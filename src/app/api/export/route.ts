import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/export - Export survey data as CSV or JSON
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format') || 'csv';
        const role = searchParams.get('role');
        const fromDate = searchParams.get('from');
        const toDate = searchParams.get('to');
        const completedOnly = searchParams.get('completed') === 'true';

        // Build session filter
        const sessionWhere: Record<string, unknown> = {};
        if (role && (role === 'nurse' || role === 'doctor')) {
            sessionWhere.role = role;
        }
        if (completedOnly) {
            sessionWhere.completedAt = { not: null };
        }
        if (fromDate || toDate) {
            sessionWhere.startedAt = {};
            if (fromDate) (sessionWhere.startedAt as Record<string, unknown>).gte = new Date(fromDate);
            if (toDate) (sessionWhere.startedAt as Record<string, unknown>).lte = new Date(toDate);
        }

        // Fetch all sessions with responses
        const sessions = await prisma.surveySession.findMany({
            where: sessionWhere,
            include: {
                responses: {
                    include: {
                        question: {
                            select: {
                                externalId: true,
                                text: true,
                                section: true,
                                type: true
                            }
                        }
                    }
                }
            },
            orderBy: { startedAt: 'desc' }
        });

        // Get all questions for column headers
        const questions = await prisma.question.findMany({
            where: { isActive: true },
            orderBy: [{ sectionOrder: 'asc' }, { order: 'asc' }],
            select: {
                id: true,
                externalId: true,
                text: true,
                section: true
            }
        });

        if (format === 'json') {
            // Return detailed JSON export
            const exportData = sessions.map(session => {
                const responseMap: Record<string, unknown> = {};
                session.responses.forEach(r => {
                    responseMap[r.question.externalId] = {
                        value: JSON.parse(r.value),
                        recordedAt: r.recordedAt
                    };
                });

                return {
                    sessionId: session.id,
                    role: session.role,
                    language: session.language,
                    startedAt: session.startedAt,
                    completedAt: session.completedAt,
                    responseTime: session.responseTime,
                    isValid: session.isValid,
                    sourceCode: session.sourceCode,
                    responses: responseMap
                };
            });

            return NextResponse.json({
                exportedAt: new Date().toISOString(),
                totalSessions: sessions.length,
                filters: { role, fromDate, toDate, completedOnly },
                data: exportData
            });
        }

        // CSV export
        const headers = [
            'session_id',
            'role',
            'language',
            'started_at',
            'completed_at',
            'response_time_seconds',
            'is_valid',
            'source_code',
            ...questions.map(q => q.externalId)
        ];

        const rows = sessions.map(session => {
            const responseMap = new Map(
                session.responses.map(r => [r.question.externalId, r.value])
            );

            const row = [
                session.id,
                session.role,
                session.language,
                session.startedAt.toISOString(),
                session.completedAt?.toISOString() || '',
                session.responseTime?.toString() || '',
                session.isValid ? 'true' : 'false',
                session.sourceCode || ''
            ];

            // Add response values for each question
            questions.forEach(q => {
                const value = responseMap.get(q.externalId);
                if (value) {
                    try {
                        const parsed = JSON.parse(value);
                        if (Array.isArray(parsed)) {
                            row.push(parsed.join('; '));
                        } else if (typeof parsed === 'object' && parsed !== null) {
                            row.push(JSON.stringify(parsed));
                        } else {
                            row.push(String(parsed));
                        }
                    } catch {
                        row.push(value);
                    }
                } else {
                    row.push('');
                }
            });

            return row;
        });

        // Build CSV content
        const escapeCSV = (value: string) => {
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        };

        const csvContent = [
            headers.map(escapeCSV).join(','),
            ...rows.map(row => row.map(cell => escapeCSV(String(cell))).join(','))
        ].join('\n');

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="survey-export-${new Date().toISOString().split('T')[0]}.csv"`
            }
        });

    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json(
            { error: 'Failed to export data' },
            { status: 500 }
        );
    }
}
