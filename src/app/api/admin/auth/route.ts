import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { authenticateUser, verifyToken, createAdminUser, updateAdminUser, logout, initializeDefaultAdmin, logAuditAction, type AdminRole } from '@/lib/auth';

// Initialize default admin on first request
let initialized = false;

async function ensureInitialized() {
    if (!initialized) {
        await initializeDefaultAdmin();
        initialized = true;
    }
}

// POST /api/admin/auth - Login
export async function POST(request: NextRequest) {
    try {
        await ensureInitialized();

        const body = await request.json();
        const { action, username, password, email, role } = body;

        // Handle different actions
        if (action === 'login' || !action) {
            // Login
            if (!password) {
                // Legacy: password-only login for backwards compatibility
                const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
                if (password === ADMIN_PASSWORD || body.password === ADMIN_PASSWORD) {
                    // Try to find admin user and create session
                    const result = await authenticateUser('admin', ADMIN_PASSWORD, request);
                    if (result.success) {
                        return NextResponse.json(result);
                    }
                }
                return NextResponse.json(
                    { error: 'Invalid password' },
                    { status: 401 }
                );
            }

            const loginUsername = username || 'admin';
            const result = await authenticateUser(loginUsername, password, request);

            if (result.success) {
                return NextResponse.json(result);
            }

            return NextResponse.json(
                { error: result.error || 'Invalid credentials' },
                { status: 401 }
            );
        }

        if (action === 'logout') {
            const token = request.headers.get('authorization')?.replace('Bearer ', '');
            if (token) {
                await logout(token);
            }
            return NextResponse.json({ success: true });
        }

        if (action === 'create') {
            // Create new admin user (requires admin role)
            const token = request.headers.get('authorization')?.replace('Bearer ', '');
            if (!token) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }

            const currentUser = await verifyToken(token);
            if (!currentUser || currentUser.role !== 'admin') {
                return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
            }

            if (!username || !password) {
                return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
            }

            const result = await createAdminUser(username, password, email, (role as AdminRole) || 'viewer');

            if (result.success) {
                await logAuditAction(currentUser.id, 'create', 'user', result.user?.id);
                return NextResponse.json(result, { status: 201 });
            }

            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Auth error:', error);
        return NextResponse.json(
            { error: 'Authentication failed' },
            { status: 500 }
        );
    }
}

// GET /api/admin/auth - Verify token and get user info
export async function GET(request: NextRequest) {
    try {
        await ensureInitialized();

        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json(
                { error: 'No token provided' },
                { status: 401 }
            );
        }

        const user = await verifyToken(token);

        if (user) {
            return NextResponse.json({
                valid: true,
                user,
                message: 'Token is valid'
            });
        }

        return NextResponse.json(
            { error: 'Invalid token' },
            { status: 401 }
        );
    } catch (error) {
        console.error('Token verification error:', error);
        return NextResponse.json(
            { error: 'Verification failed' },
            { status: 500 }
        );
    }
}

// PUT /api/admin/auth - Update user
export async function PUT(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const currentUser = await verifyToken(token);
        if (!currentUser) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body = await request.json();
        const { userId, username, email, password, role, isActive } = body;

        // Only admin can update other users
        const targetId = userId || currentUser.id;
        if (targetId !== currentUser.id && currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Only admin can change roles
        if (role && currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required to change roles' }, { status: 403 });
        }

        const result = await updateAdminUser(targetId, {
            username,
            email,
            password,
            role: role as AdminRole,
            isActive
        });

        if (result.success) {
            await logAuditAction(currentUser.id, 'update', 'user', targetId);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: result.error }, { status: 400 });

    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
        );
    }
}
