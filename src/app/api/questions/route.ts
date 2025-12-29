import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/questions - Fetch all questions (optionally filtered by role)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');
        const activeOnly = searchParams.get('activeOnly') !== 'false';

        const where: Record<string, unknown> = {};

        if (activeOnly) {
            where.isActive = true;
        }

        if (role && (role === 'nurse' || role === 'doctor')) {
            where.OR = [
                { role: role },
                { role: 'both' }
            ];

        }

        const questions = await prisma.question.findMany({
            where,
            orderBy: { order: 'asc' }  // Sort by order only (enables global reordering)
        });

        // Parse JSON fields
        const parsedQuestions = questions.map(q => ({
            ...q,
            options: q.options ? JSON.parse(q.options) : undefined,
            conditions: q.conditions ? JSON.parse(q.conditions) : undefined,
            config: q.config ? JSON.parse(q.config) : undefined,
        }));

        return NextResponse.json({ questions: parsedQuestions });
    } catch (error) {
        console.error('Error fetching questions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch questions' },
            { status: 500 }
        );
    }
}

// POST /api/questions - Create a new question (admin only)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields
        const { externalId, role, section, sectionOrder, order, text, type } = body;
        if (!externalId || !role || !section || sectionOrder === undefined || order === undefined || !text || !type) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const question = await prisma.question.create({
            data: {
                externalId,
                role,
                section,
                sectionOrder,
                order,
                text,
                subText: body.subText || null,
                type,
                options: body.options ? JSON.stringify(body.options) : null,
                required: body.required ?? true,
                isActive: body.isActive ?? true,
                conditions: body.conditions ? JSON.stringify(body.conditions) : null,
                config: body.config ? JSON.stringify(body.config) : null,
            }
        });

        return NextResponse.json({ question }, { status: 201 });
    } catch (error) {
        console.error('Error creating question:', error);
        return NextResponse.json(
            { error: 'Failed to create question' },
            { status: 500 }
        );
    }
}
