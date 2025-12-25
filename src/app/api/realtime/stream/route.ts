import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/realtime/stream - Server-Sent Events for real-time updates
export async function GET(request: NextRequest) {
    // Create a readable stream for SSE
    const encoder = new TextEncoder();

    // Track the last event ID for reconnection
    const lastEventId = request.headers.get('Last-Event-ID');
    let lastChecked = lastEventId ? new Date(parseInt(lastEventId)) : new Date();

    const stream = new ReadableStream({
        async start(controller) {
            // Send initial connection message
            controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ time: new Date().toISOString() })}\n\n`));

            // Send initial stats
            try {
                const stats = await getRealtimeStats();
                controller.enqueue(encoder.encode(`event: stats\ndata: ${JSON.stringify(stats)}\n\n`));
            } catch (error) {
                console.error('Error fetching initial stats:', error);
            }

            // Polling interval for updates (every 3 seconds)
            const interval = setInterval(async () => {
                try {
                    // Check for new responses since last check
                    const newResponses = await prisma.response.findMany({
                        where: {
                            recordedAt: { gt: lastChecked }
                        },
                        include: {
                            question: {
                                select: { text: true, section: true, type: true }
                            },
                            session: {
                                select: { role: true, language: true }
                            }
                        },
                        orderBy: { recordedAt: 'desc' },
                        take: 10
                    });

                    // Check for new sessions
                    const newSessions = await prisma.surveySession.findMany({
                        where: {
                            startedAt: { gt: lastChecked }
                        },
                        orderBy: { startedAt: 'desc' },
                        take: 5
                    });

                    // Check for completed sessions
                    const completedSessions = await prisma.surveySession.findMany({
                        where: {
                            completedAt: { gt: lastChecked }
                        },
                        orderBy: { completedAt: 'desc' },
                        take: 5
                    });

                    const now = new Date();

                    // Send new responses
                    if (newResponses.length > 0) {
                        const formattedResponses = newResponses.map(r => ({
                            id: r.id,
                            questionText: r.question.text.substring(0, 100),
                            section: r.question.section,
                            type: r.question.type,
                            role: r.session.role,
                            language: r.session.language,
                            value: JSON.parse(r.value),
                            recordedAt: r.recordedAt
                        }));

                        controller.enqueue(encoder.encode(
                            `id: ${now.getTime()}\nevent: responses\ndata: ${JSON.stringify(formattedResponses)}\n\n`
                        ));
                    }

                    // Send new sessions
                    if (newSessions.length > 0) {
                        controller.enqueue(encoder.encode(
                            `id: ${now.getTime()}\nevent: new_sessions\ndata: ${JSON.stringify(newSessions.map(s => ({
                                id: s.id,
                                role: s.role,
                                language: s.language,
                                startedAt: s.startedAt
                            })))}\n\n`
                        ));
                    }

                    // Send completed sessions
                    if (completedSessions.length > 0) {
                        controller.enqueue(encoder.encode(
                            `id: ${now.getTime()}\nevent: completed\ndata: ${JSON.stringify(completedSessions.map(s => ({
                                id: s.id,
                                role: s.role,
                                responseTime: s.responseTime,
                                completedAt: s.completedAt
                            })))}\n\n`
                        ));
                    }

                    // Send updated stats every 15 seconds
                    if (now.getTime() - lastChecked.getTime() > 15000 || newResponses.length > 0 || completedSessions.length > 0) {
                        const stats = await getRealtimeStats();
                        controller.enqueue(encoder.encode(`event: stats\ndata: ${JSON.stringify(stats)}\n\n`));
                    }

                    lastChecked = now;

                } catch (error) {
                    console.error('SSE update error:', error);
                    // Send heartbeat to keep connection alive
                    controller.enqueue(encoder.encode(`: heartbeat\n\n`));
                }
            }, 3000);

            // Cleanup on close
            request.signal.addEventListener('abort', () => {
                clearInterval(interval);
                controller.close();
            });
        }
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        }
    });
}

// Helper function to get real-time statistics
async function getRealtimeStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [
        totalSessions,
        todaySessions,
        activeSessions,
        completedSessions,
        todayResponses,
        recentActivity,
        roleDistribution
    ] = await Promise.all([
        prisma.surveySession.count(),
        prisma.surveySession.count({
            where: { startedAt: { gte: todayStart } }
        }),
        prisma.surveySession.count({
            where: {
                startedAt: { gte: hourAgo },
                completedAt: null
            }
        }),
        prisma.surveySession.count({
            where: {
                completedAt: { gte: todayStart }
            }
        }),
        prisma.response.count({
            where: { recordedAt: { gte: todayStart } }
        }),
        // Recent activity by hour
        prisma.response.groupBy({
            by: ['recordedAt'],
            where: { recordedAt: { gte: hourAgo } },
            _count: true
        }),
        // Role distribution
        prisma.surveySession.groupBy({
            by: ['role'],
            where: { startedAt: { gte: todayStart } },
            _count: true
        })
    ]);

    return {
        total: totalSessions,
        today: todaySessions,
        active: activeSessions,
        completed: completedSessions,
        todayResponses,
        roles: roleDistribution.reduce((acc, r) => {
            acc[r.role] = r._count;
            return acc;
        }, {} as Record<string, number>),
        lastUpdated: now.toISOString()
    };
}
