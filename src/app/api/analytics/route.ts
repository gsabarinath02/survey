import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/analytics - Fetch analytics data
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');
        const questionId = searchParams.get('questionId');
        const fromDate = searchParams.get('from');
        const toDate = searchParams.get('to');

        // Build date filter
        const dateFilter: Record<string, unknown> = {};
        if (fromDate) {
            dateFilter.gte = new Date(fromDate);
        }
        if (toDate) {
            dateFilter.lte = new Date(toDate);
        }

        const sessionWhere: Record<string, unknown> = {};
        if (role && (role === 'nurse' || role === 'doctor')) {
            sessionWhere.role = role;
        }
        if (Object.keys(dateFilter).length > 0) {
            sessionWhere.startedAt = dateFilter;
        }

        // Get summary statistics
        const [
            totalSessions,
            completedSessions,
            nurseSessions,
            doctorSessions,
            sessions
        ] = await Promise.all([
            prisma.surveySession.count({ where: sessionWhere }),
            prisma.surveySession.count({
                where: { ...sessionWhere, completedAt: { not: null } }
            }),
            prisma.surveySession.count({
                where: { ...sessionWhere, role: 'nurse' }
            }),
            prisma.surveySession.count({
                where: { ...sessionWhere, role: 'doctor' }
            }),
            prisma.surveySession.findMany({
                where: { ...sessionWhere, completedAt: { not: null } },
                select: {
                    startedAt: true,
                    completedAt: true
                }
            })
        ]);

        // Calculate average completion time
        let averageCompletionTimeMinutes = 0;
        if (sessions.length > 0) {
            const totalMinutes = sessions.reduce((acc, s) => {
                if (s.completedAt) {
                    const diff = s.completedAt.getTime() - s.startedAt.getTime();
                    return acc + diff / (1000 * 60);
                }
                return acc;
            }, 0);
            averageCompletionTimeMinutes = Math.round(totalMinutes / sessions.length);
        }

        // Get responses by section
        const responsesBySection = await prisma.response.groupBy({
            by: ['questionId'],
            where: {
                session: sessionWhere
            },
            _count: true
        });

        // Get questions to map questionId to section
        const questions = await prisma.question.findMany({
            select: { id: true, section: true }
        });
        const questionSectionMap = new Map(questions.map(q => [q.id, q.section]));

        const sectionCounts: Record<string, number> = {};
        responsesBySection.forEach(r => {
            const section = questionSectionMap.get(r.questionId) || 'Unknown';
            sectionCounts[section] = (sectionCounts[section] || 0) + r._count;
        });

        // If a specific question is requested, get detailed analytics
        let questionAnalytics = null;
        if (questionId) {
            const question = await prisma.question.findUnique({
                where: { id: questionId }
            });

            if (question) {
                const responses = await prisma.response.findMany({
                    where: {
                        questionId,
                        session: sessionWhere
                    }
                });

                const values = responses.map(r => JSON.parse(r.value));

                // Calculate distribution based on question type
                if (['choice', 'multi-choice', 'boolean'].includes(question.type)) {
                    const distribution: Record<string, number> = {};
                    values.forEach(v => {
                        if (Array.isArray(v)) {
                            v.forEach(item => {
                                distribution[item] = (distribution[item] || 0) + 1;
                            });
                        } else {
                            const key = String(v);
                            distribution[key] = (distribution[key] || 0) + 1;
                        }
                    });
                    questionAnalytics = {
                        questionId,
                        questionText: question.text,
                        responseCount: responses.length,
                        distribution
                    };
                } else if (['slider', 'likert'].includes(question.type)) {
                    const numericValues = values.filter(v => typeof v === 'number') as number[];
                    const average = numericValues.length > 0
                        ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length
                        : 0;

                    questionAnalytics = {
                        questionId,
                        questionText: question.text,
                        responseCount: responses.length,
                        averageValue: Math.round(average * 100) / 100,
                        distribution: numericValues.reduce((acc, v) => {
                            acc[v] = (acc[v] || 0) + 1;
                            return acc;
                        }, {} as Record<number, number>)
                    };
                } else {
                    // Text responses
                    questionAnalytics = {
                        questionId,
                        questionText: question.text,
                        responseCount: responses.length,
                        textResponses: values.filter(v => typeof v === 'string').slice(0, 50)
                    };
                }
            }
        }

        // Get recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentSessions = await prisma.surveySession.findMany({
            where: {
                startedAt: { gte: sevenDaysAgo }
            },
            select: {
                startedAt: true,
                role: true
            }
        });

        // Group by date
        const activityByDate: Record<string, { nurse: number; doctor: number }> = {};
        recentSessions.forEach(s => {
            const dateKey = s.startedAt.toISOString().split('T')[0];
            if (!activityByDate[dateKey]) {
                activityByDate[dateKey] = { nurse: 0, doctor: 0 };
            }
            activityByDate[dateKey][s.role as 'nurse' | 'doctor']++;
        });

        return NextResponse.json({
            summary: {
                totalSessions,
                completedSessions,
                completionRate: totalSessions > 0
                    ? Math.round((completedSessions / totalSessions) * 100)
                    : 0,
                nurseSessions,
                doctorSessions,
                averageCompletionTimeMinutes
            },
            responsesBySection: sectionCounts,
            activityByDate,
            questionAnalytics
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}
