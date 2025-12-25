import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// POST /api/sessions - Create a new survey session
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { role, deviceInfo, fingerprint, language, sourceCode, participantName, participantPhone, participantHash } = body;

        if (!role || (role !== 'nurse' && role !== 'doctor')) {
            return NextResponse.json(
                { error: 'Invalid role. Must be "nurse" or "doctor"' },
                { status: 400 }
            );
        }

        // Check fingerprint for duplicates
        let isDuplicate = false;
        let fingerprintRecord = null;
        if (fingerprint) {
            fingerprintRecord = await prisma.deviceFingerprint.findUnique({
                where: { fingerprint }
            });

            if (fingerprintRecord) {
                // Update existing fingerprint
                await prisma.deviceFingerprint.update({
                    where: { fingerprint },
                    data: {
                        lastSeenAt: new Date(),
                        sessionCount: { increment: 1 }
                    }
                });
                // Flag as duplicate if more than 2 sessions
                isDuplicate = fingerprintRecord.sessionCount >= 2;
            } else {
                // Create new fingerprint record
                await prisma.deviceFingerprint.create({
                    data: { fingerprint }
                });
            }
        }

        // Track distribution source
        if (sourceCode) {
            await prisma.distributionLink.updateMany({
                where: { code: sourceCode, isActive: true },
                data: { sessionCount: { increment: 1 } }
            });
        }

        // Create session with participant info
        const session = await prisma.surveySession.create({
            data: {
                role,
                participantName: participantName || null,
                participantPhone: participantPhone || null,
                participantHash: participantHash || null,
                deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
                fingerprint: fingerprint || null,
                language: language || 'en',
                sourceCode: sourceCode || null,
                isValid: !isDuplicate
            }
        });

        // Fetch questions for this role
        const questions = await prisma.question.findMany({
            where: {
                isActive: true,
                OR: [
                    { role: role },
                    { role: 'both' }
                ]
            },
            orderBy: [
                { sectionOrder: 'asc' },
                { order: 'asc' }
            ]
        });

        // Parse JSON fields for questions
        const parsedQuestions = questions.map(q => ({
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

        // Create survey snapshot for data integrity
        await prisma.surveySnapshot.create({
            data: {
                sessionId: session.id,
                questionsJson: JSON.stringify(parsedQuestions)
            }
        });

        return NextResponse.json({
            sessionId: session.id,
            role: session.role,
            language: session.language,
            questions: parsedQuestions,
            isDuplicate
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating session:', error);
        return NextResponse.json(
            { error: 'Failed to create session' },
            { status: 500 }
        );
    }
}

// GET /api/sessions - List all sessions (admin)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');
        const completed = searchParams.get('completed');
        const valid = searchParams.get('valid');
        const source = searchParams.get('source');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        const where: Record<string, unknown> = {};

        if (role && (role === 'nurse' || role === 'doctor')) {
            where.role = role;
        }

        if (completed === 'true') {
            where.completedAt = { not: null };
        } else if (completed === 'false') {
            where.completedAt = null;
        }

        if (valid === 'true') {
            where.isValid = true;
        } else if (valid === 'false') {
            where.isValid = false;
        }

        if (source) {
            where.sourceCode = source;
        }

        const [sessions, total] = await Promise.all([
            prisma.surveySession.findMany({
                where,
                orderBy: { startedAt: 'desc' },
                take: limit,
                skip: offset,
                include: {
                    _count: {
                        select: { responses: true }
                    }
                }
            }),
            prisma.surveySession.count({ where })
        ]);

        return NextResponse.json({
            sessions: sessions.map(s => ({
                id: s.id,
                role: s.role,
                language: s.language,
                participantName: s.participantName,
                participantPhone: s.participantPhone,
                startedAt: s.startedAt,
                completedAt: s.completedAt,
                responseTime: s.responseTime,
                isValid: s.isValid,
                sourceCode: s.sourceCode,
                status: s.completedAt ? 'completed' : 'in_progress',
                createdAt: s.startedAt,
                deviceInfo: s.deviceInfo ? JSON.parse(s.deviceInfo) : null,
                responseCount: s._count.responses
            })),
            total,
            limit,
            offset
        });
    } catch (error) {
        console.error('Error fetching sessions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch sessions' },
            { status: 500 }
        );
    }
}

