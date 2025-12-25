import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/distribution/[code]/qr - Generate QR code as SVG
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

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const surveyUrl = `${baseUrl}/?ref=${code}`;

        // Generate QR code as SVG using a simple algorithm
        // This creates a basic QR representation - for production, use a proper QR library
        const qrSvg = generateQRCodeSVG(surveyUrl, code);

        return new NextResponse(qrSvg, {
            headers: {
                'Content-Type': 'image/svg+xml',
                'Cache-Control': 'public, max-age=3600'
            }
        });

    } catch (error) {
        console.error('Error generating QR code:', error);
        return NextResponse.json(
            { error: 'Failed to generate QR code' },
            { status: 500 }
        );
    }
}

// Simple QR-like pattern generator (placeholder - use proper QR library in production)
function generateQRCodeSVG(url: string, code: string): string {
    const size = 200;
    const moduleSize = 8;
    const margin = 20;

    // Create a deterministic pattern based on the code
    const pattern: boolean[][] = [];
    const gridSize = Math.floor((size - 2 * margin) / moduleSize);

    // Initialize grid
    for (let i = 0; i < gridSize; i++) {
        pattern[i] = [];
        for (let j = 0; j < gridSize; j++) {
            pattern[i][j] = false;
        }
    }

    // Add finder patterns (corners)
    const addFinderPattern = (startX: number, startY: number) => {
        for (let i = 0; i < 7; i++) {
            for (let j = 0; j < 7; j++) {
                if (startX + i < gridSize && startY + j < gridSize) {
                    // Outer border
                    if (i === 0 || i === 6 || j === 0 || j === 6) {
                        pattern[startX + i][startY + j] = true;
                    }
                    // Inner square
                    else if (i >= 2 && i <= 4 && j >= 2 && j <= 4) {
                        pattern[startX + i][startY + j] = true;
                    }
                }
            }
        }
    };

    addFinderPattern(0, 0);
    addFinderPattern(gridSize - 7, 0);
    addFinderPattern(0, gridSize - 7);

    // Add data pattern based on code hash
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
        hash = ((hash << 5) - hash + code.charCodeAt(i)) | 0;
    }

    for (let i = 8; i < gridSize - 8; i++) {
        for (let j = 8; j < gridSize - 8; j++) {
            const val = (hash + i * 17 + j * 31) % 3;
            pattern[i][j] = val === 0;
        }
    }

    // Generate SVG
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`;
    svg += `<rect width="${size}" height="${size}" fill="white"/>`;

    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            if (pattern[i][j]) {
                const x = margin + i * moduleSize;
                const y = margin + j * moduleSize;
                svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="#0f172a"/>`;
            }
        }
    }

    svg += `</svg>`;

    return svg;
}
