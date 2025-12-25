import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Generate a hash from name and phone for deduplication
function generateParticipantHash(name: string, phone: string): string {
    const combined = `${name.toLowerCase().trim()}-${phone.replace(/\D/g, '')}`;
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}

// GET /api/check-participant - Check if participant exists
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const name = searchParams.get('name');
        const phone = searchParams.get('phone');
        const fingerprint = searchParams.get('fingerprint');

        if (!name || !phone) {
            return NextResponse.json(
                { error: 'Name and phone are required' },
                { status: 400 }
            );
        }

        const participantHash = generateParticipantHash(name, phone);

        // Look for existing session with this participant hash OR fingerprint
        const existingSession = await prisma.surveySession.findFirst({
            where: {
                OR: [
                    { participantHash },
                    ...(fingerprint ? [{ fingerprint }] : [])
                ]
            },
            orderBy: { startedAt: 'desc' },
            include: {
                _count: {
                    select: { responses: true }
                }
            }
        });

        if (!existingSession) {
            return NextResponse.json({
                status: 'new',
                participantHash,
                message: 'No existing session found'
            });
        }

        if (existingSession.completedAt) {
            return NextResponse.json({
                status: 'completed',
                sessionId: existingSession.id,
                role: existingSession.role,
                completedAt: existingSession.completedAt,
                message: 'Survey already completed'
            });
        }

        // Session exists but not completed - can resume
        return NextResponse.json({
            status: 'in_progress',
            sessionId: existingSession.id,
            role: existingSession.role,
            responseCount: existingSession._count.responses,
            startedAt: existingSession.startedAt,
            message: 'Survey in progress - can resume'
        });

    } catch (error) {
        console.error('Error checking participant:', error);
        return NextResponse.json(
            { error: 'Failed to check participant status' },
            { status: 500 }
        );
    }
}

// POST /api/check-participant - Create participant hash (utility endpoint)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, phone } = body;

        if (!name || !phone) {
            return NextResponse.json(
                { error: 'Name and phone are required' },
                { status: 400 }
            );
        }

        const participantHash = generateParticipantHash(name, phone);

        return NextResponse.json({
            participantHash,
            message: 'Hash generated successfully'
        });

    } catch (error) {
        console.error('Error generating hash:', error);
        return NextResponse.json(
            { error: 'Failed to generate participant hash' },
            { status: 500 }
        );
    }
}
