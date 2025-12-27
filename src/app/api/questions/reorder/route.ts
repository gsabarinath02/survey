import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

interface ReorderItem {
    id: string;
    order: number;
}

// GET /api/questions/reorder - Debug endpoint to check question orders
export async function GET() {
    try {
        const questions = await prisma.question.findMany({
            select: { id: true, text: true, order: true, sectionOrder: true, section: true },
            orderBy: { order: 'asc' },
            take: 20
        });
        return NextResponse.json({ questions });
    } catch (error) {
        console.error('Error fetching questions:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
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
        console.log('First 3 items:', items.slice(0, 3));

        // Update each question sequentially and verify
        const results: Array<{ id: string; newOrder: number; verified: boolean }> = [];

        for (const item of items) {
            try {
                // Perform the update
                const updated = await prisma.question.update({
                    where: { id: item.id },
                    data: { order: item.order }
                });

                // Verify the update by re-fetching
                const verified = await prisma.question.findUnique({
                    where: { id: item.id },
                    select: { order: true }
                });

                const isVerified = verified?.order === item.order;
                results.push({ id: item.id, newOrder: item.order, verified: isVerified });

                if (!isVerified) {
                    console.error(`Verification failed for ${item.id}: expected ${item.order}, got ${verified?.order}`);
                }
            } catch (updateError) {
                console.error(`Failed to update question ${item.id}:`, updateError);
                results.push({ id: item.id, newOrder: item.order, verified: false });
            }
        }

        const successCount = results.filter(r => r.verified).length;
        console.log(`Successfully updated and verified ${successCount}/${items.length} questions`);

        if (successCount === 0) {
            return NextResponse.json(
                { error: 'Failed to update any questions', results },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, updated: successCount, total: items.length, results: results.slice(0, 5) });
    } catch (error) {
        console.error('Error reordering questions:', error);
        return NextResponse.json(
            { error: 'Failed to reorder questions: ' + String(error) },
            { status: 500 }
        );
    }
}
