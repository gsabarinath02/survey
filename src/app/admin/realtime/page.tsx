'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    Users,
    CheckCircle,
    TrendingUp,
    Clock,
    Radio,
    MessageSquare,
    Zap
} from 'lucide-react';
import { clsx } from 'clsx';

interface RealtimeStats {
    total: number;
    today: number;
    active: number;
    completed: number;
    todayResponses: number;
    roles: Record<string, number>;
    lastUpdated: string;
}

interface RealtimeResponse {
    id: string;
    questionText: string;
    section: string;
    type: string;
    role: string;
    language: string;
    value: unknown;
    recordedAt: string;
}

interface RealtimeSession {
    id: string;
    role: string;
    language?: string;
    startedAt?: string;
    responseTime?: number;
    completedAt?: string;
}

export default function RealtimePage() {
    const [connected, setConnected] = useState(false);
    const [stats, setStats] = useState<RealtimeStats | null>(null);
    const [recentResponses, setRecentResponses] = useState<RealtimeResponse[]>([]);
    const [recentSessions, setRecentSessions] = useState<RealtimeSession[]>([]);
    const [completedSessions, setCompletedSessions] = useState<RealtimeSession[]>([]);
    const [error, setError] = useState<string | null>(null);

    const connectToStream = useCallback(() => {
        const eventSource = new EventSource('/api/realtime/stream');

        eventSource.addEventListener('connected', () => {
            setConnected(true);
            setError(null);
        });

        eventSource.addEventListener('stats', (event) => {
            const data = JSON.parse(event.data);
            setStats(data);
        });

        eventSource.addEventListener('responses', (event) => {
            const data = JSON.parse(event.data) as RealtimeResponse[];
            setRecentResponses(prev => [...data, ...prev].slice(0, 20));
        });

        eventSource.addEventListener('new_sessions', (event) => {
            const data = JSON.parse(event.data) as RealtimeSession[];
            setRecentSessions(prev => [...data, ...prev].slice(0, 10));
        });

        eventSource.addEventListener('completed', (event) => {
            const data = JSON.parse(event.data) as RealtimeSession[];
            setCompletedSessions(prev => [...data, ...prev].slice(0, 10));
        });

        eventSource.onerror = () => {
            setConnected(false);
            setError('Connection lost. Reconnecting...');
            eventSource.close();
            // Retry after 5 seconds
            setTimeout(connectToStream, 5000);
        };

        return eventSource;
    }, []);

    useEffect(() => {
        const eventSource = connectToStream();
        return () => eventSource.close();
    }, [connectToStream]);

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatValue = (value: unknown): string => {
        if (Array.isArray(value)) return value.join(', ');
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value).substring(0, 100);
    };

    return (
        <div className="space-y-6">
            {/* Header with connection status */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Activity className="w-7 h-7 text-cyan-400" />
                        Real-Time Dashboard
                    </h1>
                    <p className="text-slate-400 mt-1">Live survey activity and response feed</p>
                </div>
                <div className={clsx(
                    "flex items-center gap-2 px-4 py-2 rounded-full",
                    connected ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                )}>
                    <Radio className={clsx("w-4 h-4", connected && "animate-pulse")} />
                    {connected ? 'Connected' : 'Reconnecting...'}
                </div>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-amber-500/20 border border-amber-500/50 rounded-xl text-amber-200"
                >
                    {error}
                </motion.div>
            )}

            {/* Live Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/30"
                    >
                        <div className="flex items-center justify-between">
                            <Users className="w-8 h-8 text-cyan-400" />
                            <span className="text-3xl font-bold text-white">{stats.today}</span>
                        </div>
                        <p className="text-slate-400 mt-2 text-sm">Today&apos;s Sessions</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="p-5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30"
                    >
                        <div className="flex items-center justify-between">
                            <Zap className="w-8 h-8 text-emerald-400 animate-pulse" />
                            <span className="text-3xl font-bold text-white">{stats.active}</span>
                        </div>
                        <p className="text-slate-400 mt-2 text-sm">Active Now</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-5 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30"
                    >
                        <div className="flex items-center justify-between">
                            <CheckCircle className="w-8 h-8 text-purple-400" />
                            <span className="text-3xl font-bold text-white">{stats.completed}</span>
                        </div>
                        <p className="text-slate-400 mt-2 text-sm">Completed Today</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30"
                    >
                        <div className="flex items-center justify-between">
                            <MessageSquare className="w-8 h-8 text-amber-400" />
                            <span className="text-3xl font-bold text-white">{stats.todayResponses}</span>
                        </div>
                        <p className="text-slate-400 mt-2 text-sm">Responses Today</p>
                    </motion.div>
                </div>
            )}

            {/* Role Distribution */}
            {stats?.roles && Object.keys(stats.roles).length > 0 && (
                <div className="p-5 rounded-xl border border-slate-700 bg-slate-800/50">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-cyan-400" />
                        Today&apos;s Distribution
                    </h3>
                    <div className="flex gap-6">
                        {Object.entries(stats.roles).map(([role, count]) => (
                            <div key={role} className="flex items-center gap-3">
                                <div className={clsx(
                                    "w-12 h-12 rounded-xl flex items-center justify-center font-bold",
                                    role === 'nurse' ? "bg-cyan-500/20 text-cyan-400" : "bg-purple-500/20 text-purple-400"
                                )}>
                                    {count}
                                </div>
                                <span className="text-slate-300 capitalize">{role}s</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Live Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Responses */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-5 rounded-xl border border-slate-700 bg-slate-800/50"
                >
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-emerald-400" />
                        Live Response Feed
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        <AnimatePresence mode="popLayout">
                            {recentResponses.length === 0 ? (
                                <p className="text-slate-500 text-sm py-4 text-center">
                                    Waiting for responses...
                                </p>
                            ) : (
                                recentResponses.map((response) => (
                                    <motion.div
                                        key={response.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="p-3 bg-slate-700/30 rounded-lg border-l-2 border-emerald-500"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm text-white font-medium line-clamp-1">
                                                {response.questionText}
                                            </p>
                                            <span className={clsx(
                                                "text-xs px-2 py-0.5 rounded capitalize shrink-0",
                                                response.role === 'nurse'
                                                    ? "bg-cyan-500/20 text-cyan-400"
                                                    : "bg-purple-500/20 text-purple-400"
                                            )}>
                                                {response.role}
                                            </span>
                                        </div>
                                        <p className="text-slate-300 text-sm mt-1 line-clamp-1">
                                            {formatValue(response.value)}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                                            <Clock className="w-3 h-3" />
                                            {formatTime(response.recordedAt)}
                                            <span className="text-slate-600">•</span>
                                            <span>{response.section}</span>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Session Activity */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-5 rounded-xl border border-slate-700 bg-slate-800/50"
                >
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-cyan-400" />
                        Session Activity
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        <AnimatePresence mode="popLayout">
                            {recentSessions.length === 0 && completedSessions.length === 0 ? (
                                <p className="text-slate-500 text-sm py-4 text-center">
                                    Waiting for sessions...
                                </p>
                            ) : (
                                <>
                                    {/* New sessions */}
                                    {recentSessions.map((session) => (
                                        <motion.div
                                            key={`new-${session.id}`}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="p-3 bg-cyan-500/10 rounded-lg border-l-2 border-cyan-500"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-cyan-400 font-medium capitalize">
                                                    New {session.role} started
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    {session.startedAt && formatTime(session.startedAt)}
                                                </span>
                                            </div>
                                            {session.language && (
                                                <span className="text-xs text-slate-500">
                                                    Language: {session.language.toUpperCase()}
                                                </span>
                                            )}
                                        </motion.div>
                                    ))}
                                    {/* Completed sessions */}
                                    {completedSessions.map((session) => (
                                        <motion.div
                                            key={`done-${session.id}`}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="p-3 bg-emerald-500/10 rounded-lg border-l-2 border-emerald-500"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-emerald-400 font-medium capitalize">
                                                    {session.role} completed ✓
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    {session.completedAt && formatTime(session.completedAt)}
                                                </span>
                                            </div>
                                            {session.responseTime && (
                                                <span className="text-xs text-slate-500">
                                                    Duration: {Math.floor(session.responseTime / 60)}m {session.responseTime % 60}s
                                                </span>
                                            )}
                                        </motion.div>
                                    ))}
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>

            {/* Last Updated */}
            {stats?.lastUpdated && (
                <p className="text-xs text-slate-500 text-center">
                    Last updated: {formatTime(stats.lastUpdated)}
                </p>
            )}
        </div>
    );
}
