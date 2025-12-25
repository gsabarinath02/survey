import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

interface DistributionItem {
    value: string;
    count: number;
    percentage: number;
}

interface NumericStats {
    mean: number;
    median: number;
    mode: number;
    min: number;
    max: number;
    histogram: DistributionItem[];
}

// GET /api/analytics/questions/[id] - Detailed analytics for a specific question
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');
        const fromDate = searchParams.get('from');
        const toDate = searchParams.get('to');

        // Get the question
        const question = await prisma.question.findUnique({
            where: { id }
        });

        if (!question) {
            return NextResponse.json(
                { error: 'Question not found' },
                { status: 404 }
            );
        }

        // Build session filter
        const sessionWhere: Record<string, unknown> = {
            completedAt: { not: null }
        };
        if (role && (role === 'nurse' || role === 'doctor')) {
            sessionWhere.role = role;
        }
        if (fromDate || toDate) {
            const dateFilter: Record<string, unknown> = {};
            if (fromDate) dateFilter.gte = new Date(fromDate);
            if (toDate) dateFilter.lte = new Date(toDate);
            sessionWhere.startedAt = dateFilter;
        }

        // Get all responses for this question
        const responses = await prisma.response.findMany({
            where: {
                questionId: id,
                session: sessionWhere
            },
            include: {
                session: {
                    select: {
                        id: true,
                        role: true,
                        startedAt: true,
                        participantName: true
                    }
                }
            },
            orderBy: { recordedAt: 'desc' }
        });

        // Parse all values
        const parsedResponses = responses.map(r => ({
            ...r,
            parsedValue: (() => {
                try {
                    return JSON.parse(r.value);
                } catch {
                    return r.value;
                }
            })()
        }));

        // Calculate response count
        const totalResponses = parsedResponses.length;

        // Get total completed sessions for response rate
        const totalSessions = await prisma.surveySession.count({
            where: sessionWhere
        });

        const responseRate = totalSessions > 0
            ? Math.round((totalResponses / totalSessions) * 100)
            : 0;

        // Parse question options
        const options = question.options ? JSON.parse(question.options) as string[] : null;

        // Calculate analytics based on question type
        let distribution: DistributionItem[] = [];
        let numericStats: NumericStats | null = null;
        let textResponses: Array<{ value: string; respondent: string; date: string }> = [];
        let mostCommonAnswer: { value: string; count: number; percentage: number } | null = null;

        const values = parsedResponses.map(r => r.parsedValue);

        if (['choice', 'boolean', 'multi-choice'].includes(question.type)) {
            // Count occurrences of each option
            const valueCounts = new Map<string, number>();

            // Initialize with all options at 0
            if (options) {
                options.forEach(opt => valueCounts.set(opt, 0));
            }

            // Count values
            values.forEach(v => {
                if (Array.isArray(v)) {
                    // Multi-choice: count each selection
                    v.forEach(item => {
                        const key = String(item);
                        valueCounts.set(key, (valueCounts.get(key) || 0) + 1);
                    });
                } else {
                    const key = String(v);
                    valueCounts.set(key, (valueCounts.get(key) || 0) + 1);
                }
            });

            // Build distribution array
            distribution = Array.from(valueCounts.entries())
                .map(([value, count]) => ({
                    value,
                    count,
                    percentage: totalResponses > 0
                        ? Math.round((count / totalResponses) * 100)
                        : 0
                }))
                .sort((a, b) => b.count - a.count);

            // Get most common
            if (distribution.length > 0) {
                mostCommonAnswer = {
                    value: distribution[0].value,
                    count: distribution[0].count,
                    percentage: distribution[0].percentage
                };
            }

        } else if (['slider', 'likert'].includes(question.type)) {
            // Numeric analysis
            const numericValues = values
                .map(v => Number(v))
                .filter(v => !isNaN(v));

            if (numericValues.length > 0) {
                // Sort for median
                const sorted = [...numericValues].sort((a, b) => a - b);
                const mid = Math.floor(sorted.length / 2);
                const median = sorted.length % 2 !== 0
                    ? sorted[mid]
                    : (sorted[mid - 1] + sorted[mid]) / 2;

                // Mean
                const sum = numericValues.reduce((a, b) => a + b, 0);
                const mean = sum / numericValues.length;

                // Mode
                const valueCounts = new Map<number, number>();
                numericValues.forEach(v => {
                    valueCounts.set(v, (valueCounts.get(v) || 0) + 1);
                });
                let maxCount = 0;
                let mode = numericValues[0];
                valueCounts.forEach((count, value) => {
                    if (count > maxCount) {
                        maxCount = count;
                        mode = value;
                    }
                });

                // Histogram
                const histogram = Array.from(valueCounts.entries())
                    .map(([value, count]) => ({
                        value: String(value),
                        count,
                        percentage: Math.round((count / numericValues.length) * 100)
                    }))
                    .sort((a, b) => Number(a.value) - Number(b.value));

                numericStats = {
                    mean: Math.round(mean * 100) / 100,
                    median: Math.round(median * 100) / 100,
                    mode,
                    min: sorted[0],
                    max: sorted[sorted.length - 1],
                    histogram
                };

                distribution = histogram;
                mostCommonAnswer = {
                    value: String(mode),
                    count: maxCount,
                    percentage: Math.round((maxCount / numericValues.length) * 100)
                };
            }

        } else {
            // Text responses
            textResponses = parsedResponses
                .filter(r => typeof r.parsedValue === 'string' && r.parsedValue.trim())
                .slice(0, 100) // Limit to 100 responses
                .map(r => ({
                    value: String(r.parsedValue),
                    respondent: r.session.participantName || 'Anonymous',
                    date: r.recordedAt.toISOString()
                }));

            // Word frequency for text (simple implementation)
            const wordCounts = new Map<string, number>();
            textResponses.forEach(r => {
                const words = r.value.toLowerCase()
                    .replace(/[^\w\s]/g, '')
                    .split(/\s+/)
                    .filter(w => w.length > 3); // Skip short words

                words.forEach(word => {
                    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
                });
            });

            // Top 20 words
            distribution = Array.from(wordCounts.entries())
                .map(([value, count]) => ({
                    value,
                    count,
                    percentage: Math.round((count / textResponses.length) * 100)
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 20);
        }

        // Role breakdown
        const nurseResponses = parsedResponses.filter(r => r.session.role === 'nurse');
        const doctorResponses = parsedResponses.filter(r => r.session.role === 'doctor');

        // Time trend (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentResponses = parsedResponses.filter(
            r => r.recordedAt >= sevenDaysAgo
        );

        const timeTrend: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            timeTrend[dateKey] = 0;
        }

        recentResponses.forEach(r => {
            const dateKey = r.recordedAt.toISOString().split('T')[0];
            if (timeTrend[dateKey] !== undefined) {
                timeTrend[dateKey]++;
            }
        });

        return NextResponse.json({
            question: {
                id: question.id,
                externalId: question.externalId,
                text: question.text,
                subText: question.subText,
                section: question.section,
                type: question.type,
                options,
                required: question.required
            },
            analytics: {
                totalResponses,
                totalSessions,
                responseRate,
                mostCommonAnswer,
                distribution,
                numericStats,
                textResponses: textResponses.length > 0 ? textResponses : undefined,
                byRole: {
                    nurse: {
                        count: nurseResponses.length,
                        percentage: totalResponses > 0
                            ? Math.round((nurseResponses.length / totalResponses) * 100)
                            : 0
                    },
                    doctor: {
                        count: doctorResponses.length,
                        percentage: totalResponses > 0
                            ? Math.round((doctorResponses.length / totalResponses) * 100)
                            : 0
                    }
                },
                timeTrend
            },
            filters: {
                role: role || 'all',
                from: fromDate || null,
                to: toDate || null
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
