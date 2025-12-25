import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyToken, createAdminUser, updateAdminUser, logAuditAction, type AdminRole } from '@/lib/auth';

// GET /api/admin/users - List all admin users
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const currentUser = await verifyToken(token);
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const users = await prisma.adminUser.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                lastLoginAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ users });

    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

// POST /api/admin/users - Create new admin user
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const currentUser = await verifyToken(token);
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { username, password, email, role } = body;

        if (!username || !password) {
            return NextResponse.json(
                { error: 'Username and password are required' },
                { status: 400 }
            );
        }

        const result = await createAdminUser(
            username,
            password,
            email || null,
            (role as AdminRole) || 'viewer'
        );

        if (result.success) {
            await logAuditAction(currentUser.id, 'create', 'user', result.user?.id);
            return NextResponse.json({ user: result.user }, { status: 201 });
        }

        return NextResponse.json({ error: result.error }, { status: 400 });

    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
        );
    }
}

// PATCH /api/admin/users - Update user
export async function PATCH(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const currentUser = await verifyToken(token);
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { id, username, email, password, role, isActive } = body;

        if (!id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const result = await updateAdminUser(id, {
            username,
            email,
            password,
            role: role as AdminRole,
            isActive
        });

        if (result.success) {
            await logAuditAction(currentUser.id, 'update', 'user', id);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: result.error }, { status: 400 });

    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/users - Delete user
export async function DELETE(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const currentUser = await verifyToken(token);
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Prevent self-deletion
        if (id === currentUser.id) {
            return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
        }

        await prisma.adminUser.delete({ where: { id } });
        await logAuditAction(currentUser.id, 'delete', 'user', id);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
            { error: 'Failed to delete user' },
            { status: 500 }
        );
    }
}
