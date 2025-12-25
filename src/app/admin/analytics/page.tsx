'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3,
    PieChart,
    TrendingUp,
    Download,
    Calendar,
    Users
} from 'lucide-react';
import { clsx } from 'clsx';

interface AnalyticsData {
    summary: {
        totalSessions: number;
        completedSessions: number;
        totalQuestions: number;
        totalResponses: number;
        completionRate: number;
        averageResponseTime: number;
        byRole: {
            nurse: number;
            doctor: number;
        };
    };
    questionStats: Array<{
        questionId: string;
        questionText: string;
        responseCount: number;
        mostCommonAnswer: string;
    }>;
    dailyActivity: Array<{
        date: string;
        sessions: number;
        responses: number;
    }>;
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState('7d');

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange]);

    const fetchAnalytics = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/analytics?range=${dateRange}`);
            if (res.ok) {
                const analyticsData = await res.json();
                setData(analyticsData);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = async (format: 'csv' | 'json') => {
        try {
            const res = await fetch(`/api/analytics/export?format=${format}`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `survey-analytics.${format}`;
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Export error:', error);
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
                    <h1 className="text-2xl font-bold text-white">Analytics</h1>
                    <p className="text-slate-400 mt-1">Survey performance and insights</p>
                </div>
                <div className="flex gap-3">
                    {/* Date Range */}
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                    >
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                        <option value="all">All time</option>
                    </select>

                    {/* Export */}
                    <button
                        onClick={() => handleExport('csv')}
                        className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:border-slate-600 flex items-center gap-2 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-xl border border-slate-700 bg-slate-800/50"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                            <Users className="w-5 h-5 text-cyan-400" />
                        </div>
                        <span className="text-slate-400">Total Sessions</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{data?.summary?.totalSessions || 0}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-xl border border-slate-700 bg-slate-800/50"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="text-slate-400">Completion Rate</span>
                    </div>
                    <p className="text-3xl font-bold text-white">
                        {Math.round((data?.summary?.completionRate || 0) * 100)}%
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-xl border border-slate-700 bg-slate-800/50"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="text-slate-400">Total Responses</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{data?.summary?.totalResponses || 0}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 rounded-xl border border-slate-700 bg-slate-800/50"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-amber-400" />
                        </div>
                        <span className="text-slate-400">Avg. Time</span>
                    </div>
                    <p className="text-3xl font-bold text-white">
                        {Math.round(data?.summary?.averageResponseTime || 0)} min
                    </p>
                </motion.div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Role Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-6 rounded-xl border border-slate-700 bg-slate-800/50"
                >
                    <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-cyan-400" />
                        Survey Distribution by Role
                    </h2>
                    <div className="flex items-center justify-center gap-8">
                        <div className="relative w-40 h-40">
                            <svg viewBox="0 0 100 100" className="transform -rotate-90">
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="20"
                                    className="text-slate-700"
                                />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="20"
                                    strokeDasharray={`${((data?.summary?.byRole?.nurse || 0) / (data?.summary?.totalSessions || 1)) * 251.2} 251.2`}
                                    className="text-rose-500"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl font-bold text-white">
                                    {data?.summary?.totalSessions || 0}
                                </span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded bg-rose-500" />
                                <span className="text-slate-300">Nurse: {data?.summary?.byRole?.nurse || 0}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded bg-slate-600" />
                                <span className="text-slate-300">Doctor: {data?.summary?.byRole?.doctor || 0}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Top Questions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="p-6 rounded-xl border border-slate-700 bg-slate-800/50"
                >
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-cyan-400" />
                        Most Responded Questions
                    </h2>
                    <div className="space-y-3">
                        {(data?.questionStats || []).slice(0, 5).map((stat, idx) => (
                            <div key={stat.questionId} className="p-3 bg-slate-700/30 rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="text-slate-300 text-sm truncate flex-1">{stat.questionText}</p>
                                    <span className="text-cyan-400 font-medium ml-2">{stat.responseCount}</span>
                                </div>
                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                                        style={{
                                            width: `${(stat.responseCount / (data?.summary?.totalResponses || 1)) * 100}%`
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                        {(!data?.questionStats || data.questionStats.length === 0) && (
                            <p className="text-slate-500 text-center py-8">No response data yet</p>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
