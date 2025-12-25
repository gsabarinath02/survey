import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/distribution/[code] - Get link info and track click
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;

        const link = await prisma.distributionLink.findUnique({
            where: { code }
        });

        if (!link) {
            return NextResponse.json(
                { error: 'Link not found' },
                { status: 404 }
            );
        }

        // Check if active and not expired
        if (!link.isActive) {
            return NextResponse.json(
                { error: 'Link is no longer active' },
                { status: 410 }
            );
        }

        if (link.expiresAt && link.expiresAt < new Date()) {
            return NextResponse.json(
                { error: 'Link has expired' },
                { status: 410 }
            );
        }

        if (link.maxSessions && link.sessionCount >= link.maxSessions) {
            return NextResponse.json(
                { error: 'Link has reached maximum sessions' },
                { status: 410 }
            );
        }

        // Increment click count
        await prisma.distributionLink.update({
            where: { code },
            data: { clickCount: { increment: 1 } }
        });

        return NextResponse.json({
            code: link.code,
            name: link.name,
            targetRole: link.targetRole,
            source: link.source
        });

    } catch (error) {
        console.error('Error fetching distribution link:', error);
        return NextResponse.json(
            { error: 'Failed to fetch distribution link' },
            { status: 500 }
        );
    }
}

// PATCH /api/distribution/[code] - Update link
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;
        const body = await request.json();
        const { name, description, isActive, expiresAt, maxSessions } = body;

        const updateData: Record<string, unknown> = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
        if (maxSessions !== undefined) updateData.maxSessions = maxSessions;

        const link = await prisma.distributionLink.update({
            where: { code },
            data: updateData
        });

        return NextResponse.json({ link });

    } catch (error) {
        console.error('Error updating distribution link:', error);
        return NextResponse.json(
            { error: 'Failed to update distribution link' },
            { status: 500 }
        );
    }
}

// DELETE /api/distribution/[code] - Delete link
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;

        await prisma.distributionLink.delete({
            where: { code }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting distribution link:', error);
        return NextResponse.json(
            { error: 'Failed to delete distribution link' },
            { status: 500 }
        );
    }
}
