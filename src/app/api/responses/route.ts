import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// POST /api/responses - Submit a response
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sessionId, questionId, value, timeTaken, audio } = body;

        if (!sessionId || !questionId) {
            return NextResponse.json(
                { error: 'Missing sessionId or questionId' },
                { status: 400 }
            );
        }

        // Verify session exists
        const session = await prisma.surveySession.findUnique({
            where: { id: sessionId }
        });

        if (!session) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            );
        }

        // Verify question exists
        const question = await prisma.question.findUnique({
            where: { id: questionId }
        });

        if (!question) {
            return NextResponse.json(
                { error: 'Question not found' },
                { status: 404 }
            );
        }

        // Upsert the response (update if exists, create if not)
        const response = await prisma.response.upsert({
            where: {
                sessionId_questionId: {
                    sessionId,
                    questionId
                }
            },
            update: {
                value: JSON.stringify(value),
                timeTaken: timeTaken || null,
                recordedAt: new Date()
            },
            create: {
                sessionId,
                questionId,
                value: JSON.stringify(value),
                timeTaken: timeTaken || null
            }
        });

        // If audio data is provided, save it
        if (audio && audio.data) {
            await prisma.audioRecording.upsert({
                where: { responseId: response.id },
                update: {
                    audioData: audio.data,
                    duration: audio.duration || 0,
                    confidence: audio.confidence || null,
                    language: audio.language || null,
                    transcript: audio.transcript || null
                },
                create: {
                    responseId: response.id,
                    audioData: audio.data,
                    duration: audio.duration || 0,
                    confidence: audio.confidence || null,
                    language: audio.language || null,
                    transcript: audio.transcript || null
                }
            });
        }

        return NextResponse.json({ response: { ...response, value } });
    } catch (error) {
        console.error('Error submitting response:', error);
        return NextResponse.json(
            { error: 'Failed to submit response' },
            { status: 500 }
        );
    }
}

// GET /api/responses - Get responses (with filters)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');
        const questionId = searchParams.get('questionId');

        const where: Record<string, unknown> = {};

        if (sessionId) {
            where.sessionId = sessionId;
        }

        if (questionId) {
            where.questionId = questionId;
        }

        const responses = await prisma.response.findMany({
            where,
            include: {
                question: {
                    select: {
                        text: true,
                        type: true,
                        section: true
                    }
                },
                session: {
                    select: {
                        role: true,
                        startedAt: true
                    }
                }
            },
            orderBy: { recordedAt: 'desc' }
        });

        const formattedResponses = responses.map(r => ({
            id: r.id,
            sessionId: r.sessionId,
            questionId: r.questionId,
            questionText: r.question.text,
            questionType: r.question.type,
            section: r.question.section,
            role: r.session.role,
            value: JSON.parse(r.value),
            recordedAt: r.recordedAt
        }));

        return NextResponse.json({ responses: formattedResponses });
    } catch (error) {
        console.error('Error fetching responses:', error);
        return NextResponse.json(
            { error: 'Failed to fetch responses' },
            { status: 500 }
        );
    }
}
