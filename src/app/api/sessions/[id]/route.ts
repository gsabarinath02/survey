import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/sessions/[id] - Get individual session with all responses
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const session = await prisma.surveySession.findUnique({
            where: { id },
            include: {
                responses: {
                    include: {
                        question: {
                            select: {
                                id: true,
                                externalId: true,
                                text: true,
                                subText: true,
                                section: true,
                                sectionOrder: true,
                                order: true,
                                type: true,
                                options: true
                            }
                        },
                        audio: {
                            select: {
                                duration: true,
                                confidence: true,
                                language: true
                            }
                        }
                    },
                    orderBy: {
                        question: {
                            order: 'asc'
                        }
                    }
                },
                snapshot: true
            }
        });

        if (!session) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            );
        }

        // Parse response values and format
        const formattedResponses = session.responses.map(r => ({
            id: r.id,
            questionId: r.questionId,
            externalId: r.question.externalId,
            questionText: r.question.text,
            questionSubText: r.question.subText,
            section: r.question.section,
            sectionOrder: r.question.sectionOrder,
            order: r.question.order,
            type: r.question.type,
            options: r.question.options ? JSON.parse(r.question.options) : null,
            value: JSON.parse(r.value),
            timeTaken: r.timeTaken,
            recordedAt: r.recordedAt,
            audio: r.audio ? {
                duration: r.audio.duration,
                confidence: r.audio.confidence,
                language: r.audio.language
            } : null
        }));

        // Group by section
        const responsesBySection = formattedResponses.reduce((acc, r) => {
            if (!acc[r.section]) {
                acc[r.section] = {
                    name: r.section,
                    order: r.sectionOrder,
                    responses: []
                };
            }
            acc[r.section].responses.push(r);
            return acc;
        }, {} as Record<string, { name: string; order: number; responses: typeof formattedResponses }>);

        const sections = Object.values(responsesBySection).sort((a, b) => a.order - b.order);

        return NextResponse.json({
            session: {
                id: session.id,
                role: session.role,
                language: session.language,
                startedAt: session.startedAt,
                completedAt: session.completedAt,
                responseTime: session.responseTime,
                isValid: session.isValid,
                sourceCode: session.sourceCode,
                deviceInfo: session.deviceInfo ? JSON.parse(session.deviceInfo) : null
            },
            responseCount: session.responses.length,
            sections,
            responses: formattedResponses
        });

    } catch (error) {
        console.error('Error fetching session:', error);
        return NextResponse.json(
            { error: 'Failed to fetch session' },
            { status: 500 }
        );
    }
}

// PATCH /api/sessions/[id] - Update session (mark complete, flag invalid)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { complete, isValid, responseTime } = body;

        const updateData: Record<string, unknown> = {};

        if (complete) {
            updateData.completedAt = new Date();
        }
        if (isValid !== undefined) {
            updateData.isValid = isValid;
        }
        if (responseTime !== undefined) {
            updateData.responseTime = responseTime;
        }

        const session = await prisma.surveySession.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({ session });

    } catch (error) {
        console.error('Error updating session:', error);
        return NextResponse.json(
            { error: 'Failed to update session' },
            { status: 500 }
        );
    }
}

// DELETE /api/sessions/[id] - Delete session (admin only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await prisma.surveySession.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting session:', error);
        return NextResponse.json(
            { error: 'Failed to delete session' },
            { status: 500 }
        );
    }
}
