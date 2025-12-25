'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard,
    FileQuestion,
    BarChart3,
    Users,
    LogOut,
    Menu,
    X,
    Settings,
    Download,
    QrCode,
    Shield,
    Activity,
    GitBranch
} from 'lucide-react';
import { clsx } from 'clsx';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/realtime', label: 'Real-Time', icon: Activity },
    { href: '/admin/questions', label: 'Questions', icon: FileQuestion },
    { href: '/admin/versions', label: 'Versions', icon: GitBranch },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/admin/sessions', label: 'Sessions', icon: Users },
    { href: '/admin/export', label: 'Export', icon: Download },
    { href: '/admin/distribution', label: 'Distribution', icon: QrCode },
    { href: '/admin/users', label: 'Users', icon: Shield },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Check authentication
        const checkAuth = async () => {
            const token = localStorage.getItem('admin_token');
            if (!token && pathname !== '/admin/login') {
                router.push('/admin/login');
                return;
            }

            if (token) {
                // Verify token
                try {
                    const res = await fetch('/api/admin/auth', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.ok) {
                        setIsAuthenticated(true);
                    } else {
                        localStorage.removeItem('admin_token');
                        if (pathname !== '/admin/login') {
                            router.push('/admin/login');
                        }
                    }
                } catch {
                    setIsAuthenticated(false);
                }
            } else if (pathname === '/admin/login') {
                setIsAuthenticated(false);
            }
        };

        checkAuth();
    }, [pathname, router]);

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        router.push('/admin/login');
    };

    // Show login page without sidebar
    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    // Loading state
    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 flex">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                "fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 border-r border-slate-700 transform transition-transform duration-200 lg:translate-x-0 lg:static",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6 border-b border-slate-700">
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <LayoutDashboard className="w-6 h-6 text-cyan-400" />
                            Admin Panel
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">Survey Management</p>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={clsx(
                                        "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors",
                                        isActive
                                            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                            : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                                    )}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout */}
                    <div className="p-4 border-t border-slate-700">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-slate-300 hover:bg-red-500/20 hover:text-red-400 transition-colors w-full"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile header */}
                <header className="lg:hidden bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="text-slate-300 hover:text-white"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-bold text-white">Admin Panel</h1>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="text-slate-300 hover:text-white opacity-0"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </header>

                {/* Page content */}
                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
