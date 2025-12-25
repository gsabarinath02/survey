import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/questions/[id] - Fetch a single question
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const question = await prisma.question.findUnique({
            where: { id }
        });

        if (!question) {
            return NextResponse.json(
                { error: 'Question not found' },
                { status: 404 }
            );
        }

        const parsedQuestion = {
            ...question,
            options: question.options ? JSON.parse(question.options) : undefined,
            conditions: question.conditions ? JSON.parse(question.conditions) : undefined,
            config: question.config ? JSON.parse(question.config) : undefined,
        };

        return NextResponse.json({ question: parsedQuestion });
    } catch (error) {
        console.error('Error fetching question:', error);
        return NextResponse.json(
            { error: 'Failed to fetch question' },
            { status: 500 }
        );
    }
}

// PUT /api/questions/[id] - Update a question
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();

        const updateData: Record<string, unknown> = {};

        // Only update provided fields
        if (body.externalId !== undefined) updateData.externalId = body.externalId;
        if (body.role !== undefined) updateData.role = body.role;
        if (body.section !== undefined) updateData.section = body.section;
        if (body.sectionOrder !== undefined) updateData.sectionOrder = body.sectionOrder;
        if (body.order !== undefined) updateData.order = body.order;
        if (body.text !== undefined) updateData.text = body.text;
        if (body.subText !== undefined) updateData.subText = body.subText;
        if (body.type !== undefined) updateData.type = body.type;
        if (body.options !== undefined) updateData.options = JSON.stringify(body.options);
        if (body.required !== undefined) updateData.required = body.required;
        if (body.isActive !== undefined) updateData.isActive = body.isActive;
        if (body.conditions !== undefined) updateData.conditions = JSON.stringify(body.conditions);
        if (body.config !== undefined) updateData.config = JSON.stringify(body.config);

        const question = await prisma.question.update({
            where: { id },
            data: updateData
        });

        const parsedQuestion = {
            ...question,
            options: question.options ? JSON.parse(question.options) : undefined,
            conditions: question.conditions ? JSON.parse(question.conditions) : undefined,
            config: question.config ? JSON.parse(question.config) : undefined,
        };

        return NextResponse.json({ question: parsedQuestion });
    } catch (error) {
        console.error('Error updating question:', error);
        return NextResponse.json(
            { error: 'Failed to update question' },
            { status: 500 }
        );
    }
}

// DELETE /api/questions/[id] - Delete a question
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        await prisma.question.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting question:', error);
        return NextResponse.json(
            { error: 'Failed to delete question' },
            { status: 500 }
        );
    }
}
