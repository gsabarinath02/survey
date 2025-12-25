'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart3,
    Search,
    Filter,
    ChevronRight,
    ChevronDown,
    Users,
    TrendingUp,
    Hash,
    MessageSquare,
    Loader2,
    ArrowLeft
} from 'lucide-react';
import { clsx } from 'clsx';
import { DistributionChart, NumericStatsCard, MostCommonAnswerCard } from '@/components/charts/DistributionChart';

interface QuestionStat {
    id: string;
    externalId: string;
    text: string;
    subText: string | null;
    section: string;
    sectionOrder: number;
    order: number;
    type: string;
    options: string[] | null;
    required: boolean;
    responseCount: number;
    mostCommonAnswer: {
        value: string;
        count: number;
        percentage: number;
    } | null;
    responseRate: number;
    byRole: {
        nurse: number;
        doctor: number;
    };
}

interface SectionGroup {
    name: string;
    order: number;
    questions: QuestionStat[];
}

interface QuestionDetail {
    question: {
        id: string;
        externalId: string;
        text: string;
        subText: string | null;
        section: string;
        type: string;
        options: string[] | null;
        required: boolean;
    };
    analytics: {
        totalResponses: number;
        totalSessions: number;
        responseRate: number;
        mostCommonAnswer: {
            value: string;
            count: number;
            percentage: number;
        } | null;
        distribution: Array<{
            value: string;
            count: number;
            percentage: number;
        }>;
        numericStats: {
            mean: number;
            median: number;
            mode: number;
            min: number;
            max: number;
            histogram: Array<{ value: string; count: number; percentage: number }>;
        } | null;
        textResponses?: Array<{
            value: string;
            respondent: string;
            date: string;
        }>;
        byRole: {
            nurse: { count: number; percentage: number };
            doctor: { count: number; percentage: number };
        };
        timeTrend: Record<string, number>;
    };
}

export default function QuestionAnalyticsPage() {
    const [sections, setSections] = useState<SectionGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
    const [questionDetail, setQuestionDetail] = useState<QuestionDetail | null>(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'nurse' | 'doctor'>('all');
    const [textSearch, setTextSearch] = useState('');

    // Fetch questions list
    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const res = await fetch(`/api/analytics/questions?role=${roleFilter === 'all' ? '' : roleFilter}`);
                if (res.ok) {
                    const data = await res.json();
                    setSections(data.sections || []);
                    // Expand first section by default
                    if (data.sections?.length > 0) {
                        setExpandedSections(new Set([data.sections[0].name]));
                    }
                }
            } catch (error) {
                console.error('Error fetching questions:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuestions();
    }, [roleFilter]);

    // Fetch question detail
    const fetchQuestionDetail = useCallback(async (questionId: string) => {
        setIsLoadingDetail(true);
        try {
            const res = await fetch(`/api/analytics/questions/${questionId}?role=${roleFilter === 'all' ? '' : roleFilter}`);
            if (res.ok) {
                const data = await res.json();
                setQuestionDetail(data);
            }
        } catch (error) {
            console.error('Error fetching question detail:', error);
        } finally {
            setIsLoadingDetail(false);
        }
    }, [roleFilter]);

    // Handle question selection
    const handleSelectQuestion = (questionId: string) => {
        setSelectedQuestion(questionId);
        fetchQuestionDetail(questionId);
    };

    // Toggle section expansion
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

    // Filter questions by search
    const filteredSections = sections.map(section => ({
        ...section,
        questions: section.questions.filter(q =>
            q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.externalId.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(section => section.questions.length > 0);

    // Filter text responses
    const filteredTextResponses = questionDetail?.analytics.textResponses?.filter(
        r => r.value.toLowerCase().includes(textSearch.toLowerCase())
    );

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'choice':
            case 'boolean':
                return <BarChart3 className="w-4 h-4" />;
            case 'multi-choice':
                return <Hash className="w-4 h-4" />;
            case 'slider':
            case 'likert':
                return <TrendingUp className="w-4 h-4" />;
            default:
                return <MessageSquare className="w-4 h-4" />;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex gap-6 min-h-[calc(100vh-12rem)]">
            {/* Left Panel - Question List */}
            <div className="w-96 shrink-0 space-y-4">
                {/* Search & Filters */}
                <div className="space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search questions..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value as 'all' | 'nurse' | 'doctor')}
                            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                        >
                            <option value="all">All Roles</option>
                            <option value="nurse">Nurses Only</option>
                            <option value="doctor">Doctors Only</option>
                        </select>
                    </div>
                </div>

                {/* Questions by Section */}
                <div className="space-y-2 max-h-[calc(100vh-20rem)] overflow-y-auto">
                    {filteredSections.map(section => (
                        <div key={section.name} className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                            <button
                                onClick={() => toggleSection(section.name)}
                                className="w-full flex items-center justify-between p-3 hover:bg-slate-700/50 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    {expandedSections.has(section.name) ? (
                                        <ChevronDown className="w-4 h-4 text-cyan-400" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                    )}
                                    <span className="text-white font-medium">{section.name}</span>
                                </div>
                                <span className="text-slate-500 text-sm">{section.questions.length}</span>
                            </button>

                            <AnimatePresence>
                                {expandedSections.has(section.name) && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-2 pt-0 space-y-1">
                                            {section.questions.map(q => (
                                                <button
                                                    key={q.id}
                                                    onClick={() => handleSelectQuestion(q.id)}
                                                    className={clsx(
                                                        "w-full text-left p-3 rounded-lg transition-colors",
                                                        selectedQuestion === q.id
                                                            ? "bg-cyan-500/20 border border-cyan-500/50"
                                                            : "bg-slate-700/30 hover:bg-slate-700/50 border border-transparent"
                                                    )}
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <div className={clsx(
                                                            "mt-0.5",
                                                            selectedQuestion === q.id ? "text-cyan-400" : "text-slate-500"
                                                        )}>
                                                            {getTypeIcon(q.type)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-white line-clamp-2">{q.text}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-xs text-slate-500">{q.responseCount} responses</span>
                                                                {q.mostCommonAnswer && (
                                                                    <span className="text-xs text-cyan-400 truncate max-w-[120px]">
                                                                        Top: {q.mostCommonAnswer.value}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Panel - Question Detail */}
            <div className="flex-1">
                {!selectedQuestion ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <BarChart3 className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg">Select a question to view analytics</p>
                        <p className="text-sm mt-1">Click on any question from the left panel</p>
                    </div>
                ) : isLoadingDetail ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                    </div>
                ) : questionDetail ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Question Header */}
                        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                            <div className="flex items-start gap-3">
                                <button
                                    onClick={() => {
                                        setSelectedQuestion(null);
                                        setQuestionDetail(null);
                                    }}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors lg:hidden"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300">
                                            {questionDetail.question.type}
                                        </span>
                                        <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300">
                                            {questionDetail.question.section}
                                        </span>
                                    </div>
                                    <h2 className="text-xl font-semibold text-white">
                                        {questionDetail.question.text}
                                    </h2>
                                    {questionDetail.question.subText && (
                                        <p className="text-slate-400 mt-1">{questionDetail.question.subText}</p>
                                    )}
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-3 gap-4 mt-6">
                                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                                    <p className="text-2xl font-bold text-white">{questionDetail.analytics.totalResponses}</p>
                                    <p className="text-xs text-slate-400">Responses</p>
                                </div>
                                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                                    <p className="text-2xl font-bold text-white">{questionDetail.analytics.responseRate}%</p>
                                    <p className="text-xs text-slate-400">Response Rate</p>
                                </div>
                                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                                    <div className="flex justify-center gap-3">
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-rose-500" />
                                            <span className="text-sm text-white">{questionDetail.analytics.byRole.nurse.count}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            <span className="text-sm text-white">{questionDetail.analytics.byRole.doctor.count}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">Nurse / Doctor</p>
                                </div>
                            </div>
                        </div>

                        {/* Most Common Answer */}
                        {questionDetail.analytics.mostCommonAnswer && (
                            <MostCommonAnswerCard
                                answer={questionDetail.analytics.mostCommonAnswer}
                                totalResponses={questionDetail.analytics.totalResponses}
                            />
                        )}

                        {/* Numeric Stats */}
                        {questionDetail.analytics.numericStats && (
                            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
                                <NumericStatsCard stats={questionDetail.analytics.numericStats} />
                            </div>
                        )}

                        {/* Distribution Chart */}
                        {questionDetail.analytics.distribution.length > 0 && (
                            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">
                                    {questionDetail.analytics.textResponses ? 'Top Keywords' : 'Answer Distribution'}
                                </h3>
                                <DistributionChart
                                    data={questionDetail.analytics.distribution}
                                    type={questionDetail.analytics.numericStats ? 'bar' : 'horizontal'}
                                    colorScheme="cyan"
                                />
                            </div>
                        )}

                        {/* Text Responses */}
                        {questionDetail.analytics.textResponses && questionDetail.analytics.textResponses.length > 0 && (
                            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-white">
                                        Text Responses ({questionDetail.analytics.textResponses.length})
                                    </h3>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={textSearch}
                                            onChange={(e) => setTextSearch(e.target.value)}
                                            placeholder="Search responses..."
                                            className="pl-9 pr-4 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none w-48"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                    {(filteredTextResponses || []).map((response, idx) => (
                                        <div key={idx} className="p-3 bg-slate-700/30 rounded-lg">
                                            <p className="text-white">{response.value}</p>
                                            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                                                <span>{response.respondent}</span>
                                                <span>•</span>
                                                <span>{new Date(response.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Time Trend */}
                        {Object.keys(questionDetail.analytics.timeTrend).length > 0 && (
                            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Last 7 Days</h3>
                                <div className="flex items-end justify-between gap-2 h-24">
                                    {Object.entries(questionDetail.analytics.timeTrend).map(([date, count]) => {
                                        const maxCount = Math.max(...Object.values(questionDetail.analytics.timeTrend), 1);
                                        const height = (count / maxCount) * 100;
                                        return (
                                            <div key={date} className="flex-1 flex flex-col items-center">
                                                <div
                                                    className="w-full bg-gradient-to-t from-purple-500 to-pink-500 rounded-t"
                                                    style={{ height: `${Math.max(height, 4)}%` }}
                                                />
                                                <span className="text-xs text-slate-500 mt-2">
                                                    {new Date(date).toLocaleDateString('en', { weekday: 'short' })}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </motion.div>
                ) : null}
            </div>
        </div>
    );
}
