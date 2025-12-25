import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { nurseQuestions, doctorQuestions } from '@/data/questions';

// POST /api/seed - Seed the database with questions
// This is a one-time operation protected by a secret key
export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');

        // Protect with environment secret
        const expectedSecret = process.env.TOKEN_SECRET || 'nurse-survey-secret-2024';
        if (secret !== expectedSecret) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if questions already exist
        const existingCount = await prisma.question.count();
        if (existingCount > 0) {
            return NextResponse.json({
                message: 'Questions already exist',
                count: existingCount
            });
        }

        const allQuestions = [...nurseQuestions, ...doctorQuestions];

        // Insert all questions
        let insertedCount = 0;
        for (const q of allQuestions) {
            const id = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await prisma.question.create({
                data: {
                    id,
                    externalId: q.externalId,
                    role: q.role,
                    section: q.section,
                    sectionOrder: q.sectionOrder,
                    order: q.order,
                    text: q.text,
                    subText: q.subText || null,
                    type: q.type,
                    options: q.options ? JSON.stringify(q.options) : null,
                    required: q.required ?? true,
                    isActive: true,
                    conditions: q.conditions ? JSON.stringify(q.conditions) : null,
                    config: q.config ? JSON.stringify(q.config) : null,
                    updatedAt: new Date(),
                }
            });
            insertedCount++;
        }

        return NextResponse.json({
            success: true,
            message: `Seeded ${insertedCount} questions`,
            nurseCount: nurseQuestions.length,
            doctorCount: doctorQuestions.length
        });
    } catch (error) {
        console.error('Seed error:', error);
        return NextResponse.json(
            { error: 'Failed to seed database', details: String(error) },
            { status: 500 }
        );
    }
}

// GET /api/seed - Check seed status
export async function GET() {
    try {
        const count = await prisma.question.count();
        return NextResponse.json({
            questionCount: count,
            seeded: count > 0
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to check seed status', details: String(error) },
            { status: 500 }
        );
    }
}
