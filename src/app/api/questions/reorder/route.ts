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
        // Accept both 'items' and 'updates' for backward compatibility
        const items = (body.items || body.updates) as ReorderItem[];

        if (!items || !Array.isArray(items)) {
            return NextResponse.json(
                { error: 'Invalid request body. Expected { items: [{ id, order }] }' },
                { status: 400 }
            );
        }

        console.log(`Reordering ${items.length} questions...`);

        // Update each question sequentially to ensure persistence
        let successCount = 0;
        for (const item of items) {
            try {
                await prisma.question.update({
                    where: { id: item.id },
                    data: { order: item.order }
                });
                successCount++;
            } catch (updateError) {
                console.error(`Failed to update question ${item.id}:`, updateError);
            }
        }

        console.log(`Successfully updated ${successCount}/${items.length} questions`);

        if (successCount === 0) {
            return NextResponse.json(
                { error: 'Failed to update any questions' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, updated: successCount });
    } catch (error) {
        console.error('Error reordering questions:', error);
        return NextResponse.json(
            { error: 'Failed to reorder questions' },
            { status: 500 }
        );
    }
}
