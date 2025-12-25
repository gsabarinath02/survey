import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/sessions/[id]/resume - Get session data for resuming
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Find the session
        const session = await prisma.surveySession.findUnique({
            where: { id },
            include: {
                responses: true,
                snapshot: true
            }
        });

        if (!session) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            );
        }

        if (session.completedAt) {
            return NextResponse.json(
                { error: 'Session already completed' },
                { status: 400 }
            );
        }

        // Get questions from snapshot or fetch fresh
        let questions = [];
        if (session.snapshot?.questionsJson) {
            questions = JSON.parse(session.snapshot.questionsJson);
        } else {
            // Fetch questions for this role
            const dbQuestions = await prisma.question.findMany({
                where: {
                    isActive: true,
                    OR: [
                        { role: session.role },
                        { role: 'both' }
                    ]
                },
                orderBy: [
                    { sectionOrder: 'asc' },
                    { order: 'asc' }
                ]
            });

            questions = dbQuestions.map(q => ({
                id: q.id,
                externalId: q.externalId,
                section: q.section,
                sectionOrder: q.sectionOrder,
                order: q.order,
                text: q.text,
                subText: q.subText,
                type: q.type,
                options: q.options ? JSON.parse(q.options) : undefined,
                required: q.required,
                randomize: q.randomize,
                conditions: q.conditions ? JSON.parse(q.conditions) : undefined,
                config: q.config ? JSON.parse(q.config) : undefined,
            }));
        }

        // Build answers object from responses
        const answers: Record<string, unknown> = {};
        for (const response of session.responses) {
            try {
                answers[response.questionId] = JSON.parse(response.value);
            } catch {
                answers[response.questionId] = response.value;
            }
        }

        // Determine current index based on answered questions
        const answeredIds = new Set(Object.keys(answers));
        let currentIndex = 0;
        for (let i = 0; i < questions.length; i++) {
            if (!answeredIds.has(questions[i].id)) {
                currentIndex = i;
                break;
            }
            currentIndex = i + 1;
        }

        return NextResponse.json({
            sessionId: session.id,
            role: session.role,
            language: session.language,
            questions,
            answers,
            currentIndex: Math.min(currentIndex, questions.length - 1),
            participantName: session.participantName
        });

    } catch (error) {
        console.error('Error resuming session:', error);
        return NextResponse.json(
            { error: 'Failed to resume session' },
            { status: 500 }
        );
    }
}
