'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Search,
    CheckCircle2,
    Clock,
    XCircle,
    Eye,
    Download,
    Loader2,
    ChevronDown,
    ChevronRight,
    User,
    Phone,
    Calendar,
    Filter
} from 'lucide-react';
import { clsx } from 'clsx';

interface Respondent {
    id: string;
    role: string;
    status: string;
    participantName: string | null;
    participantPhone: string | null;
    startedAt: string;
    completedAt: string | null;
    responseCount: number;
    responseTime: number | null;
}

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

export default function RespondentExplorerPage() {
    const [respondents, setRespondents] = useState<Respondent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRespondent, setSelectedRespondent] = useState<SessionDetail | null>(null);
    const [selectedResponses, setSelectedResponses] = useState<ResponseDetail[]>([]);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress'>('all');
    const [roleFilter, setRoleFilter] = useState<'all' | 'nurse' | 'doctor'>('all');

    // Fetch respondents
    useEffect(() => {
        const fetchRespondents = async () => {
            try {
                const res = await fetch('/api/sessions?limit=200');
                if (res.ok) {
                    const data = await res.json();
                    setRespondents(data.sessions || []);
                }
            } catch (error) {
                console.error('Error fetching respondents:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRespondents();
    }, []);

    // Fetch respondent detail
    const fetchRespondentDetail = useCallback(async (sessionId: string) => {
        setIsLoadingDetail(true);
        try {
            const res = await fetch(`/api/sessions/${sessionId}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedRespondent(data.session);
                setSelectedResponses(data.responses || []);
                // Expand all sections
                const sectionNames = new Set(data.responses?.map((r: ResponseDetail) => r.section) || []);
                setExpandedSections(sectionNames as Set<string>);
            }
        } catch (error) {
            console.error('Error fetching respondent detail:', error);
        } finally {
            setIsLoadingDetail(false);
        }
    }, []);

    // Handle respondent selection
    const handleSelectRespondent = (sessionId: string) => {
        fetchRespondentDetail(sessionId);
    };

    // Toggle section
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

    // Export respondent data
    const handleExport = (format: 'json' | 'csv') => {
        if (!selectedRespondent || !selectedResponses.length) return;

        const data = {
            respondent: selectedRespondent,
            responses: selectedResponses.map(r => ({
                question: r.questionText,
                section: r.section,
                type: r.type,
                answer: r.value,
                timeTaken: r.timeTaken
            }))
        };

        if (format === 'json') {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `respondent-${selectedRespondent.id.slice(0, 8)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } else {
            // CSV export
            const rows = [
                ['Question', 'Section', 'Type', 'Answer', 'Time Taken (s)'],
                ...selectedResponses.map(r => [
                    `"${r.questionText.replace(/"/g, '""')}"`,
                    r.section,
                    r.type,
                    `"${String(r.value).replace(/"/g, '""')}"`,
                    r.timeTaken || ''
                ])
            ];
            const csv = rows.map(row => row.join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `respondent-${selectedRespondent.id.slice(0, 8)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    // Filter respondents
    const filteredRespondents = respondents.filter(r => {
        if (statusFilter !== 'all' && r.status !== statusFilter) return false;
        if (roleFilter !== 'all' && r.role !== roleFilter) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                r.participantName?.toLowerCase().includes(query) ||
                r.participantPhone?.includes(query) ||
                r.id.toLowerCase().includes(query)
            );
        }
        return true;
    });

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

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'completed':
                return { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
            case 'in_progress':
                return { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20' };
            default:
                return { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' };
        }
    };

    const formatValue = (value: unknown, type: string): string => {
        if (value === null || value === undefined) return '—';
        if (Array.isArray(value)) return value.join(', ');
        if (type === 'boolean') return value === true ? 'Yes' : value === false ? 'No' : String(value);
        return String(value);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Respondent Explorer</h1>
                    <p className="text-slate-400 mt-1">
                        {filteredRespondents.length} of {respondents.length} respondents
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, phone, or ID..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'completed' | 'in_progress')}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="in_progress">In Progress</option>
                </select>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as 'all' | 'nurse' | 'doctor')}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                >
                    <option value="all">All Roles</option>
                    <option value="nurse">Nurses</option>
                    <option value="doctor">Doctors</option>
                </select>
            </div>

            <div className="flex gap-6">
                {/* Left Panel - Respondent List */}
                <div className="w-96 shrink-0 space-y-2 max-h-[calc(100vh-18rem)] overflow-y-auto">
                    {filteredRespondents.map((respondent, idx) => {
                        const statusInfo = getStatusInfo(respondent.status);
                        const StatusIcon = statusInfo.icon;
                        const isSelected = selectedRespondent?.id === respondent.id;

                        return (
                            <motion.button
                                key={respondent.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.02 }}
                                onClick={() => handleSelectRespondent(respondent.id)}
                                className={clsx(
                                    "w-full text-left p-4 rounded-xl border transition-all",
                                    isSelected
                                        ? "bg-cyan-500/10 border-cyan-500/50"
                                        : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={clsx(
                                        "w-10 h-10 rounded-lg flex items-center justify-center",
                                        statusInfo.bg
                                    )}>
                                        <StatusIcon className={clsx("w-5 h-5", statusInfo.color)} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-medium truncate">
                                                {respondent.participantName || 'Anonymous'}
                                            </span>
                                            <span className={clsx(
                                                "px-2 py-0.5 rounded text-xs",
                                                respondent.role === 'nurse'
                                                    ? "bg-rose-500/20 text-rose-400"
                                                    : "bg-blue-500/20 text-blue-400"
                                            )}>
                                                {respondent.role}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                            <span>{respondent.responseCount} responses</span>
                                            <span>•</span>
                                            <span>{new Date(respondent.startedAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}

                    {filteredRespondents.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No respondents found</p>
                        </div>
                    )}
                </div>

                {/* Right Panel - Respondent Detail */}
                <div className="flex-1">
                    {!selectedRespondent ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                            <User className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-lg">Select a respondent to view their answers</p>
                        </div>
                    ) : isLoadingDetail ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {/* Respondent Header */}
                            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">
                                            {selectedRespondent.participantName || 'Anonymous'}
                                        </h2>
                                        {selectedRespondent.participantPhone && (
                                            <p className="text-slate-400 flex items-center gap-2 mt-1">
                                                <Phone className="w-4 h-4" />
                                                {selectedRespondent.participantPhone}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleExport('json')}
                                            className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 hover:text-white hover:border-slate-500 flex items-center gap-2 text-sm transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                            JSON
                                        </button>
                                        <button
                                            onClick={() => handleExport('csv')}
                                            className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 hover:text-white hover:border-slate-500 flex items-center gap-2 text-sm transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                            CSV
                                        </button>
                                    </div>
                                </div>

                                {/* Metadata Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                    <div className="p-3 bg-slate-700/30 rounded-lg">
                                        <p className="text-slate-400 text-xs">Role</p>
                                        <p className="text-white font-medium capitalize">{selectedRespondent.role}</p>
                                    </div>
                                    <div className="p-3 bg-slate-700/30 rounded-lg">
                                        <p className="text-slate-400 text-xs">Status</p>
                                        <p className={clsx(
                                            "font-medium capitalize",
                                            selectedRespondent.completedAt ? "text-emerald-400" : "text-amber-400"
                                        )}>
                                            {selectedRespondent.completedAt ? 'Completed' : 'In Progress'}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-slate-700/30 rounded-lg">
                                        <p className="text-slate-400 text-xs">Started</p>
                                        <p className="text-white font-medium text-sm">
                                            {new Date(selectedRespondent.startedAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-slate-700/30 rounded-lg">
                                        <p className="text-slate-400 text-xs">Duration</p>
                                        <p className="text-white font-medium">
                                            {selectedRespondent.responseTime
                                                ? `${Math.floor(selectedRespondent.responseTime / 60)}m ${selectedRespondent.responseTime % 60}s`
                                                : '—'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Responses by Section */}
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold text-white">
                                    Responses ({selectedResponses.length})
                                </h3>

                                {sortedSections.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500 bg-slate-800/50 rounded-xl border border-slate-700">
                                        <p>No responses recorded</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[calc(100vh-28rem)] overflow-y-auto">
                                        {sortedSections.map((section) => (
                                            <div key={section.name} className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                                                <button
                                                    onClick={() => toggleSection(section.name)}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {expandedSections.has(section.name) ? (
                                                            <ChevronDown className="w-4 h-4 text-cyan-400" />
                                                        ) : (
                                                            <ChevronRight className="w-4 h-4 text-slate-400" />
                                                        )}
                                                        <span className="text-white font-medium">{section.name}</span>
                                                    </div>
                                                    <span className="text-slate-500 text-sm">
                                                        {section.responses.length} answers
                                                    </span>
                                                </button>

                                                <AnimatePresence>
                                                    {expandedSections.has(section.name) && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="p-4 pt-0 space-y-3">
                                                                {section.responses.sort((a, b) => a.order - b.order).map((response, idx) => (
                                                                    <div key={response.id} className="p-4 bg-slate-700/20 rounded-lg border border-slate-700/50">
                                                                        <div className="flex items-start justify-between">
                                                                            <div className="flex-1">
                                                                                <p className="text-xs text-slate-500 mb-1">
                                                                                    Q{idx + 1} • {response.type}
                                                                                    {response.timeTaken && (
                                                                                        <span className="ml-2 text-cyan-400">
                                                                                            ({response.timeTaken}s)
                                                                                        </span>
                                                                                    )}
                                                                                </p>
                                                                                <p className="text-white text-sm font-medium">
                                                                                    {response.questionText}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="mt-3 p-3 bg-slate-900/50 rounded-lg">
                                                                            <p className="text-xs text-slate-500 mb-1">Answer:</p>
                                                                            <p className="text-cyan-300 font-medium">
                                                                                {formatValue(response.value, response.type)}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
