import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/analytics/questions - List all questions with aggregated stats
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role'); // nurse | doctor | null (all)
        const section = searchParams.get('section');

        // Build role filter for sessions
        const sessionWhere: Record<string, unknown> = {
            completedAt: { not: null } // Only completed sessions
        };
        if (role && (role === 'nurse' || role === 'doctor')) {
            sessionWhere.role = role;
        }

        // Build question filter
        const questionWhere: Record<string, unknown> = { isActive: true };
        if (section) {
            questionWhere.section = section;
        }

        // Get all questions with response counts
        const questions = await prisma.question.findMany({
            where: questionWhere,
            orderBy: [
                { sectionOrder: 'asc' },
                { order: 'asc' }
            ],
            include: {
                responses: {
                    where: {
                        session: sessionWhere
                    },
                    select: {
                        id: true,
                        value: true,
                        session: {
                            select: { role: true }
                        }
                    }
                }
            }
        });

        // Get total completed sessions for context
        const totalSessions = await prisma.surveySession.count({
            where: sessionWhere
        });

        // Process each question to compute stats
        const questionStats = questions.map(q => {
            const responses = q.responses;
            const responseCount = responses.length;

            // Parse all values
            const parsedValues = responses.map(r => {
                try {
                    return JSON.parse(r.value);
                } catch {
                    return r.value;
                }
            });

            // Calculate most common answer (mode)
            let mostCommonAnswer: { value: unknown; count: number; percentage: number } | null = null;

            if (parsedValues.length > 0) {
                const valueCounts = new Map<string, number>();

                parsedValues.forEach(v => {
                    // Handle arrays (multi-choice)
                    if (Array.isArray(v)) {
                        v.forEach(item => {
                            const key = String(item);
                            valueCounts.set(key, (valueCounts.get(key) || 0) + 1);
                        });
                    } else {
                        const key = String(v);
                        valueCounts.set(key, (valueCounts.get(key) || 0) + 1);
                    }
                });

                // Find mode
                let maxCount = 0;
                let modeValue = '';
                valueCounts.forEach((count, value) => {
                    if (count > maxCount) {
                        maxCount = count;
                        modeValue = value;
                    }
                });

                if (maxCount > 0) {
                    mostCommonAnswer = {
                        value: modeValue,
                        count: maxCount,
                        percentage: Math.round((maxCount / responseCount) * 100)
                    };
                }
            }

            // Count by role
            const nurseCount = responses.filter(r => r.session.role === 'nurse').length;
            const doctorCount = responses.filter(r => r.session.role === 'doctor').length;

            return {
                id: q.id,
                externalId: q.externalId,
                text: q.text,
                subText: q.subText,
                section: q.section,
                sectionOrder: q.sectionOrder,
                order: q.order,
                type: q.type,
                options: q.options ? JSON.parse(q.options) : null,
                required: q.required,
                responseCount,
                mostCommonAnswer,
                responseRate: totalSessions > 0
                    ? Math.round((responseCount / totalSessions) * 100)
                    : 0,
                byRole: {
                    nurse: nurseCount,
                    doctor: doctorCount
                }
            };
        });

        // Group by section for UI
        const sections = new Map<string, typeof questionStats>();
        questionStats.forEach(q => {
            if (!sections.has(q.section)) {
                sections.set(q.section, []);
            }
            sections.get(q.section)!.push(q);
        });

        const groupedBySection = Array.from(sections.entries())
            .sort((a, b) => {
                const orderA = a[1][0]?.sectionOrder ?? 0;
                const orderB = b[1][0]?.sectionOrder ?? 0;
                return orderA - orderB;
            })
            .map(([name, questions]) => ({
                name,
                order: questions[0]?.sectionOrder ?? 0,
                questions
            }));

        return NextResponse.json({
            questions: questionStats,
            sections: groupedBySection,
            totalQuestions: questionStats.length,
            totalSessions,
            meta: {
                role: role || 'all',
                section: section || 'all'
            }
        });

    } catch (error) {
        console.error('Error fetching question analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch question analytics' },
            { status: 500 }
        );
    }
}
