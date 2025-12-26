import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

interface ReorderItem {
    id: string;
    order: number;
}

// POST /api/questions/reorder - Reorder questions
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { items } = body as { items: ReorderItem[] };

        if (!items || !Array.isArray(items)) {
            return NextResponse.json(
                { error: 'Invalid request body. Expected { items: [{ id, order }] }' },
                { status: 400 }
            );
        }

        // Update all questions in a transaction
        await prisma.$transaction(
            items.map(item =>
                prisma.question.update({
                    where: { id: item.id },
                    data: { order: item.order }
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error reordering questions:', error);
        return NextResponse.json(
            { error: 'Failed to reorder questions' },
            { status: 500 }
        );
    }
}
