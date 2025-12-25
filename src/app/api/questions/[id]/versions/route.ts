import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/questions/[id]/versions - Get version history for a question
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const versions = await prisma.questionVersion.findMany({
            where: { questionId: id },
            orderBy: { version: 'desc' }
        });

        return NextResponse.json({
            versions: versions.map(v => ({
                id: v.id,
                questionId: v.questionId,
                version: v.version,
                text: v.text,
                options: v.options,
                config: v.config,
                changedAt: v.createdAt,
                changedBy: v.createdBy
            }))
        });

    } catch (error) {
        console.error('Error fetching question versions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch versions' },
            { status: 500 }
        );
    }
}
