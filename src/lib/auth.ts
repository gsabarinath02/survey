// Enhanced authentication utilities with RBAC
// Replaces simple password auth with multi-user token-based auth

import prisma from './db';

export type AdminRole = 'viewer' | 'editor' | 'admin';

export interface AdminUserInfo {
    id: string;
    username: string;
    email: string | null;
    role: AdminRole;
}

export interface AuthResult {
    success: boolean;
    token?: string;
    user?: AdminUserInfo;
    error?: string;
}

// Simple hash function for passwords (in production, use bcrypt)
export async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + process.env.TOKEN_SECRET || 'survey-secret');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate secure random token
export function generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// Authenticate user and create session
export async function authenticateUser(
    username: string,
    password: string,
    request?: Request
): Promise<AuthResult> {
    try {
        const passwordHash = await hashPassword(password);

        // Find user by username or email
        const user = await prisma.adminUser.findFirst({
            where: {
                OR: [
                    { username },
                    { email: username }
                ],
                isActive: true
            }
        });

        if (!user || user.passwordHash !== passwordHash) {
            return { success: false, error: 'Invalid username or password' };
        }

        // Create session token
        const token = generateToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Get request info
        const userAgent = request?.headers.get('user-agent') || undefined;
        const ipAddress = request?.headers.get('x-forwarded-for')?.split(',')[0] || undefined;

        // Create session
        await prisma.adminSession.create({
            data: {
                userId: user.id,
                token,
                expiresAt,
                userAgent,
                ipAddress
            }
        });

        // Update last login
        await prisma.adminUser.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });

        // Log the login
        await logAuditAction(user.id, 'login', 'user', user.id, null, ipAddress);

        return {
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role as AdminRole
            }
        };
    } catch (error) {
        console.error('Authentication error:', error);
        return { success: false, error: 'Authentication failed' };
    }
}

// Verify token and get user info
export async function verifyToken(token: string): Promise<AdminUserInfo | null> {
    try {
        const session = await prisma.adminSession.findUnique({
            where: { token },
            include: { user: true }
        });

        if (!session) return null;
        if (session.expiresAt < new Date()) {
            // Session expired, delete it
            await prisma.adminSession.delete({ where: { id: session.id } });
            return null;
        }
        if (!session.user.isActive) return null;

        return {
            id: session.user.id,
            username: session.user.username,
            email: session.user.email,
            role: session.user.role as AdminRole
        };
    } catch (error) {
        console.error('Token verification error:', error);
        return null;
    }
}

// Logout - delete session
export async function logout(token: string): Promise<boolean> {
    try {
        await prisma.adminSession.delete({ where: { token } });
        return true;
    } catch {
        return false;
    }
}

// Check if user has required permission
export function hasPermission(role: AdminRole, requiredRole: AdminRole): boolean {
    const hierarchy: Record<AdminRole, number> = {
        viewer: 1,
        editor: 2,
        admin: 3
    };

    return hierarchy[role] >= hierarchy[requiredRole];
}

// Create a new admin user
export async function createAdminUser(
    username: string,
    password: string,
    email?: string,
    role: AdminRole = 'viewer'
): Promise<{ success: boolean; user?: AdminUserInfo; error?: string }> {
    try {
        // Check password strength
        if (password.length < 8) {
            return { success: false, error: 'Password must be at least 8 characters' };
        }

        const passwordHash = await hashPassword(password);

        const user = await prisma.adminUser.create({
            data: {
                username,
                email: email || null,
                passwordHash,
                role
            }
        });

        return {
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role as AdminRole
            }
        };
    } catch (error) {
        // Check for unique constraint violation
        if ((error as { code?: string }).code === 'P2002') {
            return { success: false, error: 'Username or email already exists' };
        }
        console.error('Create user error:', error);
        return { success: false, error: 'Failed to create user' };
    }
}

// Update admin user
export async function updateAdminUser(
    id: string,
    updates: {
        username?: string;
        email?: string;
        password?: string;
        role?: AdminRole;
        isActive?: boolean;
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        const data: Record<string, unknown> = {};

        if (updates.username) data.username = updates.username;
        if (updates.email !== undefined) data.email = updates.email;
        if (updates.role) data.role = updates.role;
        if (updates.isActive !== undefined) data.isActive = updates.isActive;
        if (updates.password) {
            if (updates.password.length < 8) {
                return { success: false, error: 'Password must be at least 8 characters' };
            }
            data.passwordHash = await hashPassword(updates.password);
        }

        await prisma.adminUser.update({
            where: { id },
            data
        });

        return { success: true };
    } catch (error) {
        console.error('Update user error:', error);
        return { success: false, error: 'Failed to update user' };
    }
}

// Log audit action
export async function logAuditAction(
    userId: string,
    action: string,
    resource: string,
    resourceId?: string | null,
    details?: Record<string, unknown> | null,
    ipAddress?: string
): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                resource,
                resourceId: resourceId || null,
                details: details ? JSON.stringify(details) : null,
                ipAddress: ipAddress || null
            }
        });
    } catch (error) {
        console.error('Audit log error:', error);
    }
}

// Get audit logs
export async function getAuditLogs(options?: {
    userId?: string;
    action?: string;
    limit?: number;
    offset?: number;
}) {
    const where: Record<string, unknown> = {};
    if (options?.userId) where.userId = options.userId;
    if (options?.action) where.action = options.action;

    return prisma.auditLog.findMany({
        where,
        include: {
            user: {
                select: { username: true }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 100,
        skip: options?.offset || 0
    });
}

// Initialize default admin if none exists
export async function initializeDefaultAdmin(): Promise<void> {
    const adminCount = await prisma.adminUser.count();
    if (adminCount === 0) {
        const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
        await createAdminUser('admin', defaultPassword, undefined, 'admin');
        console.log('Default admin user created');
    }
}
