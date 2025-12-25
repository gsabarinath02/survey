'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { History, GitBranch, Clock, Eye, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

interface QuestionVersion {
    id: string;
    questionId: string;
    version: number;
    text: string;
    options: string | null;
    config: string | null;
    changedAt: string;
    changedBy: string | null;
}

interface Question {
    id: string;
    externalId: string;
    text: string;
    type: string;
    section: string;
    version: number;
    versions?: QuestionVersion[];
}

export default function VersionHistoryPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
    const [versions, setVersions] = useState<QuestionVersion[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            const res = await fetch('/api/questions');
            if (res.ok) {
                const data = await res.json();
                setQuestions(data.questions || []);
            }
        } catch (error) {
            console.error('Error fetching questions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchVersions = async (questionId: string) => {
        try {
            const res = await fetch(`/api/questions/${questionId}/versions`);
            if (res.ok) {
                const data = await res.json();
                setVersions(data.versions || []);
            }
        } catch (error) {
            console.error('Error fetching versions:', error);
            setVersions([]);
        }
    };

    const handleSelectQuestion = (questionId: string) => {
        setSelectedQuestion(questionId);
        fetchVersions(questionId);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <History className="w-7 h-7 text-cyan-400" />
                    Version History
                </h1>
                <p className="text-slate-400 mt-1">Track changes to survey questions over time</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Question List */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-1 p-5 rounded-xl border border-slate-700 bg-slate-800/50"
                >
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <GitBranch className="w-5 h-5 text-purple-400" />
                        Questions
                    </h2>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                        {questions.map((q) => (
                            <button
                                key={q.id}
                                onClick={() => handleSelectQuestion(q.id)}
                                className={clsx(
                                    "w-full p-3 rounded-lg text-left transition-all",
                                    selectedQuestion === q.id
                                        ? "bg-cyan-500/20 border border-cyan-500/50"
                                        : "bg-slate-700/30 border border-transparent hover:border-slate-600"
                                )}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm text-white font-medium line-clamp-2">
                                        {q.text}
                                    </p>
                                    <ChevronRight className={clsx(
                                        "w-4 h-4 shrink-0 transition-transform",
                                        selectedQuestion === q.id && "rotate-90"
                                    )} />
                                </div>
                                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                                    <span className="text-cyan-400">{q.externalId}</span>
                                    <span className="text-slate-600">•</span>
                                    <span>v{q.version}</span>
                                    <span className="text-slate-600">•</span>
                                    <span>{q.section}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Version Timeline */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-2 p-5 rounded-xl border border-slate-700 bg-slate-800/50"
                >
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-emerald-400" />
                        Version Timeline
                    </h2>

                    {!selectedQuestion ? (
                        <div className="flex items-center justify-center h-64 text-slate-500">
                            Select a question to view its version history
                        </div>
                    ) : versions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                            <Eye className="w-12 h-12 mb-3 opacity-30" />
                            <p>No version history available</p>
                            <p className="text-sm mt-1">This question has not been modified since creation</p>
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" />

                            <div className="space-y-4">
                                {versions.map((v, idx) => (
                                    <motion.div
                                        key={v.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="relative pl-10"
                                    >
                                        {/* Timeline dot */}
                                        <div className={clsx(
                                            "absolute left-2 w-4 h-4 rounded-full border-2",
                                            idx === 0
                                                ? "bg-cyan-500 border-cyan-400"
                                                : "bg-slate-700 border-slate-600"
                                        )} />

                                        <div className={clsx(
                                            "p-4 rounded-lg border",
                                            idx === 0
                                                ? "bg-cyan-500/10 border-cyan-500/30"
                                                : "bg-slate-700/30 border-slate-700"
                                        )}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={clsx(
                                                    "text-sm font-medium",
                                                    idx === 0 ? "text-cyan-400" : "text-slate-400"
                                                )}>
                                                    Version {v.version}
                                                    {idx === 0 && " (Current)"}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    {formatDate(v.changedAt)}
                                                </span>
                                            </div>
                                            <p className="text-white">{v.text}</p>
                                            {v.options && (
                                                <div className="mt-2 text-sm text-slate-400">
                                                    Options: {JSON.parse(v.options).join(', ')}
                                                </div>
                                            )}
                                            {v.changedBy && (
                                                <div className="mt-2 text-xs text-slate-500">
                                                    Changed by: {v.changedBy}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
