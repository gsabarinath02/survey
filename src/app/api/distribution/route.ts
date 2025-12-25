import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Generate short unique code
function generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// GET /api/distribution - List all distribution links
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get('active') !== 'false';

        const where: Record<string, unknown> = {};
        if (activeOnly) {
            where.isActive = true;
        }

        const links = await prisma.distributionLink.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            links: links.map(link => ({
                ...link,
                url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/?ref=${link.code}`,
                qrUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/distribution/${link.code}/qr`
            }))
        });

    } catch (error) {
        console.error('Error fetching distribution links:', error);
        return NextResponse.json(
            { error: 'Failed to fetch distribution links' },
            { status: 500 }
        );
    }
}

// POST /api/distribution - Create new distribution link
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, description, source, targetRole, expiresAt, maxSessions } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            );
        }

        // Generate unique code
        let code = generateCode();
        let attempts = 0;
        while (attempts < 10) {
            const existing = await prisma.distributionLink.findUnique({ where: { code } });
            if (!existing) break;
            code = generateCode();
            attempts++;
        }

        const link = await prisma.distributionLink.create({
            data: {
                code,
                name,
                description: description || null,
                source: source || null,
                targetRole: targetRole || null,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                maxSessions: maxSessions || null
            }
        });

        return NextResponse.json({
            link: {
                ...link,
                url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/?ref=${link.code}`,
                qrUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/distribution/${link.code}/qr`
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating distribution link:', error);
        return NextResponse.json(
            { error: 'Failed to create distribution link' },
            { status: 500 }
        );
    }
}
