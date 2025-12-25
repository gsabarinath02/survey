'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    FileQuestion,
    CheckCircle2,
    Clock,
    TrendingUp,
    Activity
} from 'lucide-react';
import { clsx } from 'clsx';

interface DashboardStats {
    totalSessions: number;
    completedSessions: number;
    totalQuestions: number;
    totalResponses: number;
    nurseCount: number;
    doctorCount: number;
}

interface RecentSession {
    id: string;
    role: string;
    status: string;
    createdAt: string;
    responseCount: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch analytics
                const analyticsRes = await fetch('/api/analytics');
                if (analyticsRes.ok) {
                    const data = await analyticsRes.json();
                    setStats({
                        totalSessions: data.summary?.totalSessions || 0,
                        completedSessions: data.summary?.completedSessions || 0,
                        totalQuestions: data.summary?.totalQuestions || 0,
                        totalResponses: data.summary?.totalResponses || 0,
                        nurseCount: data.summary?.byRole?.nurse || 0,
                        doctorCount: data.summary?.byRole?.doctor || 0,
                    });
                }

                // Fetch recent sessions
                const sessionsRes = await fetch('/api/sessions?limit=5');
                if (sessionsRes.ok) {
                    const sessionsData = await sessionsRes.json();
                    setRecentSessions(sessionsData.sessions || []);
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const statCards = [
        {
            label: 'Total Sessions',
            value: stats?.totalSessions || 0,
            icon: Users,
            color: 'from-cyan-500 to-blue-500',
            bgColor: 'bg-cyan-500/10'
        },
        {
            label: 'Completed',
            value: stats?.completedSessions || 0,
            icon: CheckCircle2,
            color: 'from-emerald-500 to-green-500',
            bgColor: 'bg-emerald-500/10'
        },
        {
            label: 'Questions',
            value: stats?.totalQuestions || 0,
            icon: FileQuestion,
            color: 'from-purple-500 to-pink-500',
            bgColor: 'bg-purple-500/10'
        },
        {
            label: 'Responses',
            value: stats?.totalResponses || 0,
            icon: Activity,
            color: 'from-amber-500 to-orange-500',
            bgColor: 'bg-amber-500/10'
        },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-slate-400 mt-1">Overview of survey activity and statistics</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={clsx(
                            "p-6 rounded-xl border border-slate-700 bg-slate-800/50",
                            stat.bgColor
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">{stat.label}</p>
                                <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                            </div>
                            <div className={clsx(
                                "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br",
                                stat.color
                            )}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Role Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-6 rounded-xl border border-slate-700 bg-slate-800/50"
                >
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-cyan-400" />
                        Survey by Role
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-300">Nurses</span>
                                <span className="text-slate-400">{stats?.nurseCount || 0}</span>
                            </div>
                            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all"
                                    style={{
                                        width: `${stats?.totalSessions ? (stats.nurseCount / stats.totalSessions) * 100 : 0}%`
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-300">Doctors</span>
                                <span className="text-slate-400">{stats?.doctorCount || 0}</span>
                            </div>
                            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                                    style={{
                                        width: `${stats?.totalSessions ? (stats.doctorCount / stats.totalSessions) * 100 : 0}%`
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Recent Sessions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="p-6 rounded-xl border border-slate-700 bg-slate-800/50"
                >
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-cyan-400" />
                        Recent Sessions
                    </h2>
                    {recentSessions.length > 0 ? (
                        <div className="space-y-3">
                            {recentSessions.map((session) => (
                                <div
                                    key={session.id}
                                    className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={clsx(
                                            "w-2 h-2 rounded-full",
                                            session.status === 'completed' ? 'bg-emerald-400' : 'bg-amber-400'
                                        )} />
                                        <div>
                                            <p className="text-white font-medium capitalize">{session.role}</p>
                                            <p className="text-slate-400 text-xs">
                                                {new Date(session.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-slate-400 text-sm">
                                        {session.responseCount} responses
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-center py-8">No sessions yet</p>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
