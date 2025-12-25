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
    Loader2,
    ChevronDown,
    ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';

interface ResponseDetail {
    id: string;
    questionId: string;
    externalId: string;
    questionText: string;
    questionSubText?: string;
    section: string;
    sectionOrder: number;
    order: number;
    type: string;
    options: string[] | null;
    value: unknown;
    timeTaken: number | null;
    recordedAt: string;
}

interface SessionListItem {
    id: string;
    role: string;
    status: string;
    createdAt: string;
    completedAt: string | null;
    participantName: string | null;
    participantPhone: string | null;
    responseCount: number;
}

interface SessionDetail {
    id: string;
    role: string;
    language: string;
    startedAt: string;
    completedAt: string | null;
    responseTime: number | null;
    isValid: boolean;
    sourceCode: string | null;
    deviceInfo: Record<string, unknown> | null;
    participantName?: string | null;
    participantPhone?: string | null;
}

interface SectionGroup {
    name: string;
    order: number;
    responses: ResponseDetail[];
}

export default function SessionsPage() {
    const [sessions, setSessions] = useState<SessionListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null);
    const [selectedResponses, setSelectedResponses] = useState<ResponseDetail[]>([]);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

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

    const handleViewSession = async (sessionId: string) => {
        setIsLoadingDetails(true);
        try {
            const res = await fetch(`/api/sessions/${sessionId}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedSession(data.session);
                setSelectedResponses(data.responses || []);
                // Expand all sections by default
                const sectionNames = new Set(data.responses?.map((r: ResponseDetail) => r.section) || []);
                setExpandedSections(sectionNames as Set<string>);
            }
        } catch (error) {
            console.error('Error fetching session details:', error);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const handleCloseModal = () => {
        setSelectedSession(null);
        setSelectedResponses([]);
        setExpandedSections(new Set());
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this session and all its responses?')) return;

        try {
            const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setSessions(sessions.filter(s => s.id !== id));
                if (selectedSession?.id === id) handleCloseModal();
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

    const toggleSection = (sectionName: string) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sectionName)) {
                newSet.delete(sectionName);
            } else {
                newSet.add(sectionName);
            }
            return newSet;
        });
    };

    const formatValue = (value: unknown, type: string): string => {
        if (value === null || value === undefined) return '—';

        if (Array.isArray(value)) {
            return value.join(', ');
        }

        if (type === 'boolean') {
            return value === true ? 'Yes' : value === false ? 'No' : String(value);
        }

        if (type === 'likert' || type === 'slider') {
            return `${value}`;
        }

        return String(value);
    };

    // Group responses by section
    const groupedResponses = selectedResponses.reduce((acc, response) => {
        if (!acc[response.section]) {
            acc[response.section] = {
                name: response.section,
                order: response.sectionOrder,
                responses: []
            };
        }
        acc[response.section].responses.push(response);
        return acc;
    }, {} as Record<string, SectionGroup>);

    const sortedSections = Object.values(groupedResponses).sort((a, b) => a.order - b.order);

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
                                            <span className="text-white font-medium">
                                                {session.participantName || 'Anonymous'}
                                            </span>
                                            {session.participantPhone && (
                                                <span className="text-slate-400 text-sm">
                                                    ({session.participantPhone})
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
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
                                            <span className="text-slate-500 text-xs">
                                                {new Date(session.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-white font-medium">{session.responseCount || 0}</p>
                                        <p className="text-slate-500 text-xs">responses</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleViewSession(session.id)}
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
            {(selectedSession || isLoadingDetails) && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-3xl max-h-[85vh] overflow-y-auto"
                    >
                        {isLoadingDetails ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                            </div>
                        ) : selectedSession && (
                            <>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-white">Session Details</h2>
                                    <button
                                        onClick={handleCloseModal}
                                        className="text-slate-400 hover:text-white text-xl"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Participant Info */}
                                    <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl">
                                        <h3 className="text-lg font-semibold text-cyan-400 mb-2">Participant</h3>
                                        <p className="text-white text-xl font-medium">{selectedSession.participantName || 'Anonymous'}</p>
                                        {selectedSession.participantPhone && (
                                            <p className="text-slate-300 mt-1">📱 {selectedSession.participantPhone}</p>
                                        )}
                                    </div>

                                    {/* Session Meta */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="p-3 bg-slate-700/30 rounded-lg">
                                            <p className="text-slate-400 text-sm">Role</p>
                                            <p className="text-white font-medium capitalize">{selectedSession.role}</p>
                                        </div>
                                        <div className="p-3 bg-slate-700/30 rounded-lg">
                                            <p className="text-slate-400 text-sm">Status</p>
                                            <p className={clsx(
                                                "font-medium capitalize",
                                                selectedSession.completedAt ? "text-emerald-400" : "text-amber-400"
                                            )}>
                                                {selectedSession.completedAt ? 'Completed' : 'In Progress'}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-slate-700/30 rounded-lg">
                                            <p className="text-slate-400 text-sm">Started</p>
                                            <p className="text-white font-medium text-sm">{new Date(selectedSession.startedAt).toLocaleString()}</p>
                                        </div>
                                        <div className="p-3 bg-slate-700/30 rounded-lg">
                                            <p className="text-slate-400 text-sm">Completed</p>
                                            <p className="text-white font-medium text-sm">
                                                {selectedSession.completedAt
                                                    ? new Date(selectedSession.completedAt).toLocaleString()
                                                    : '—'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Response Time */}
                                    {selectedSession.responseTime && (
                                        <div className="p-3 bg-slate-700/30 rounded-lg inline-block">
                                            <p className="text-slate-400 text-sm">Total Time</p>
                                            <p className="text-white font-medium">
                                                {Math.floor(selectedSession.responseTime / 60)} min {selectedSession.responseTime % 60} sec
                                            </p>
                                        </div>
                                    )}

                                    {/* Responses by Section */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-4">
                                            Responses ({selectedResponses.length})
                                        </h3>

                                        {sortedSections.length === 0 ? (
                                            <div className="text-center py-8 text-slate-500">
                                                <p>No responses recorded</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {sortedSections.map((section) => (
                                                    <div key={section.name} className="border border-slate-700 rounded-xl overflow-hidden">
                                                        <button
                                                            onClick={() => toggleSection(section.name)}
                                                            className="w-full flex items-center justify-between p-4 bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                {expandedSections.has(section.name) ? (
                                                                    <ChevronDown className="w-5 h-5 text-cyan-400" />
                                                                ) : (
                                                                    <ChevronRight className="w-5 h-5 text-slate-400" />
                                                                )}
                                                                <span className="text-white font-medium">{section.name}</span>
                                                            </div>
                                                            <span className="text-slate-400 text-sm">
                                                                {section.responses.length} questions
                                                            </span>
                                                        </button>

                                                        {expandedSections.has(section.name) && (
                                                            <div className="p-4 space-y-3 bg-slate-800/50">
                                                                {section.responses.sort((a, b) => a.order - b.order).map((response, idx) => (
                                                                    <div key={response.id} className="p-4 bg-slate-700/20 rounded-lg border border-slate-700/50">
                                                                        <div className="flex items-start justify-between gap-4">
                                                                            <div className="flex-1">
                                                                                <p className="text-slate-400 text-xs mb-1">
                                                                                    Q{idx + 1} • {response.type}
                                                                                    {response.timeTaken && (
                                                                                        <span className="ml-2 text-cyan-400">
                                                                                            ({response.timeTaken}s)
                                                                                        </span>
                                                                                    )}
                                                                                </p>
                                                                                <p className="text-white text-sm font-medium mb-2">
                                                                                    {response.questionText}
                                                                                </p>
                                                                                {response.questionSubText && (
                                                                                    <p className="text-slate-500 text-xs mb-2">
                                                                                        {response.questionSubText}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div className="mt-2 p-3 bg-slate-900/50 rounded-lg">
                                                                            <p className="text-slate-400 text-xs mb-1">Answer:</p>
                                                                            <p className="text-cyan-300 font-medium">
                                                                                {formatValue(response.value, response.type)}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </div>
    );
}
