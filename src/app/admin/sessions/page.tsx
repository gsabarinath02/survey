'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    CheckCircle2,
    Clock,
    XCircle,
    Eye,
    Trash2,
    Download,
    Filter
} from 'lucide-react';
import { clsx } from 'clsx';

interface Session {
    id: string;
    role: string;
    status: string;
    createdAt: string;
    completedAt: string | null;
    deviceInfo: Record<string, unknown> | null;
    responses: Array<{
        id: string;
        questionId: string;
        value: unknown;
    }>;
}

export default function SessionsPage() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const res = await fetch('/api/sessions');
            if (res.ok) {
                const data = await res.json();
                setSessions(data.sessions || []);
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this session and all its responses?')) return;

        try {
            const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setSessions(sessions.filter(s => s.id !== id));
                if (selectedSession?.id === id) setSelectedSession(null);
            }
        } catch (error) {
            console.error('Error deleting session:', error);
        }
    };

    const filteredSessions = sessions.filter(session => {
        if (!session) return false;
        if (statusFilter !== 'all' && (session.status || '') !== statusFilter) return false;
        if (roleFilter !== 'all' && (session.role || '') !== roleFilter) return false;
        return true;
    });

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'completed':
                return { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
            case 'in_progress':
                return { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20' };
            case 'abandoned':
                return { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' };
            default:
                return { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/20' };
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Sessions</h1>
                    <p className="text-slate-400 mt-1">{sessions.length} total sessions</p>
                </div>
                <button
                    onClick={() => {
                        // Export all sessions as JSON
                        const dataStr = JSON.stringify(sessions, null, 2);
                        const blob = new Blob([dataStr], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'sessions-export.json';
                        a.click();
                    }}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:border-slate-600 flex items-center gap-2 transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Export All
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="abandoned">Abandoned</option>
                </select>

                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                >
                    <option value="all">All Roles</option>
                    <option value="nurse">Nurse</option>
                    <option value="doctor">Doctor</option>
                </select>
            </div>

            {/* Sessions List */}
            <div className="space-y-3">
                {filteredSessions.map((session, idx) => {
                    const statusInfo = getStatusInfo(session.status);
                    const StatusIcon = statusInfo.icon;

                    return (
                        <motion.div
                            key={session.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            className="bg-slate-800 border border-slate-700 rounded-xl p-4"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={clsx(
                                        "w-10 h-10 rounded-lg flex items-center justify-center",
                                        statusInfo.bg
                                    )}>
                                        <StatusIcon className={clsx("w-5 h-5", statusInfo.color)} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={clsx(
                                                "px-2 py-0.5 rounded text-xs font-medium",
                                                session.role === 'nurse'
                                                    ? "bg-rose-500/20 text-rose-400"
                                                    : "bg-blue-500/20 text-blue-400"
                                            )}>
                                                {session.role}
                                            </span>
                                            <span className={clsx(
                                                "px-2 py-0.5 rounded text-xs",
                                                statusInfo.bg, statusInfo.color
                                            )}>
                                                {(session.status || 'unknown').replace('_', ' ')}
                                            </span>
                                        </div>
                                        <p className="text-slate-400 text-sm mt-1">
                                            Started: {new Date(session.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-white font-medium">{session.responses?.length || 0}</p>
                                        <p className="text-slate-500 text-xs">responses</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setSelectedSession(session)}
                                            className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
                                            title="View details"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(session.id)}
                                            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                                            title="Delete session"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}

                {filteredSessions.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No sessions found</p>
                    </div>
                )}
            </div>

            {/* Session Detail Modal */}
            {selectedSession && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Session Details</h2>
                            <button
                                onClick={() => setSelectedSession(null)}
                                className="text-slate-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-slate-700/30 rounded-lg">
                                    <p className="text-slate-400 text-sm">Role</p>
                                    <p className="text-white font-medium capitalize">{selectedSession.role}</p>
                                </div>
                                <div className="p-3 bg-slate-700/30 rounded-lg">
                                    <p className="text-slate-400 text-sm">Status</p>
                                    <p className="text-white font-medium capitalize">{(selectedSession.status || 'unknown').replace('_', ' ')}</p>
                                </div>
                                <div className="p-3 bg-slate-700/30 rounded-lg">
                                    <p className="text-slate-400 text-sm">Started</p>
                                    <p className="text-white font-medium">{new Date(selectedSession.createdAt).toLocaleString()}</p>
                                </div>
                                <div className="p-3 bg-slate-700/30 rounded-lg">
                                    <p className="text-slate-400 text-sm">Completed</p>
                                    <p className="text-white font-medium">
                                        {selectedSession.completedAt
                                            ? new Date(selectedSession.completedAt).toLocaleString()
                                            : '—'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3">Responses ({selectedSession.responses?.length || 0})</h3>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {selectedSession.responses?.map((response, idx) => (
                                        <div key={response.id} className="p-3 bg-slate-700/30 rounded-lg">
                                            <p className="text-slate-400 text-xs mb-1">Question {idx + 1}</p>
                                            <p className="text-white text-sm">
                                                {typeof response.value === 'object'
                                                    ? JSON.stringify(response.value)
                                                    : String(response.value)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
