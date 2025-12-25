'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface DistributionItem {
    value: string;
    count: number;
    percentage: number;
}

interface DistributionChartProps {
    data: DistributionItem[];
    title?: string;
    maxItems?: number;
    type?: 'bar' | 'horizontal';
    colorScheme?: 'cyan' | 'purple' | 'emerald' | 'rose';
}

const colorSchemes = {
    cyan: {
        from: 'from-cyan-500',
        to: 'to-blue-500',
        bg: 'bg-cyan-500/20',
        text: 'text-cyan-400'
    },
    purple: {
        from: 'from-purple-500',
        to: 'to-pink-500',
        bg: 'bg-purple-500/20',
        text: 'text-purple-400'
    },
    emerald: {
        from: 'from-emerald-500',
        to: 'to-teal-500',
        bg: 'bg-emerald-500/20',
        text: 'text-emerald-400'
    },
    rose: {
        from: 'from-rose-500',
        to: 'to-orange-500',
        bg: 'bg-rose-500/20',
        text: 'text-rose-400'
    }
};

export function DistributionChart({
    data,
    title,
    maxItems = 10,
    type = 'horizontal',
    colorScheme = 'cyan'
}: DistributionChartProps) {
    const colors = colorSchemes[colorScheme];
    const displayData = data.slice(0, maxItems);
    const maxCount = Math.max(...displayData.map(d => d.count), 1);

    if (displayData.length === 0) {
        return (
            <div className="p-6 text-center text-slate-500">
                No data available
            </div>
        );
    }

    if (type === 'horizontal') {
        return (
            <div className="space-y-3">
                {title && (
                    <h3 className="text-sm font-medium text-slate-400 mb-4">{title}</h3>
                )}
                {displayData.map((item, idx) => (
                    <motion.div
                        key={item.value}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="space-y-1"
                    >
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-300 truncate max-w-[200px]" title={item.value}>
                                {item.value}
                            </span>
                            <span className={colors.text}>
                                {item.count} ({item.percentage}%)
                            </span>
                        </div>
                        <div className="h-6 bg-slate-700/50 rounded-lg overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(item.count / maxCount) * 100}%` }}
                                transition={{ duration: 0.5, delay: idx * 0.05 }}
                                className={`h-full bg-gradient-to-r ${colors.from} ${colors.to} rounded-lg flex items-center justify-end pr-2`}
                            >
                                {(item.count / maxCount) >= 0.15 && (
                                    <span className="text-xs text-white font-medium">
                                        {item.percentage}%
                                    </span>
                                )}
                            </motion.div>
                        </div>
                    </motion.div>
                ))}
            </div>
        );
    }

    // Vertical bar chart
    return (
        <div>
            {title && (
                <h3 className="text-sm font-medium text-slate-400 mb-4">{title}</h3>
            )}
            <div className="flex items-end justify-around gap-2 h-48">
                {displayData.map((item, idx) => (
                    <motion.div
                        key={item.value}
                        initial={{ height: 0 }}
                        animate={{ height: `${(item.count / maxCount) * 100}%` }}
                        transition={{ duration: 0.5, delay: idx * 0.05 }}
                        className="flex flex-col items-center flex-1 max-w-16"
                    >
                        <div
                            className={`w-full bg-gradient-to-t ${colors.from} ${colors.to} rounded-t-lg relative group`}
                            style={{ height: '100%', minHeight: '8px' }}
                        >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 px-2 py-1 rounded text-xs text-white whitespace-nowrap z-10">
                                {item.count} ({item.percentage}%)
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
            <div className="flex justify-around gap-2 mt-2">
                {displayData.map(item => (
                    <div key={item.value} className="flex-1 max-w-16 text-center">
                        <span className="text-xs text-slate-400 truncate block" title={item.value}>
                            {item.value.length > 8 ? item.value.slice(0, 8) + '...' : item.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

interface NumericStatsCardProps {
    stats: {
        mean: number;
        median: number;
        mode: number;
        min: number;
        max: number;
    };
}

export function NumericStatsCard({ stats }: NumericStatsCardProps) {
    return (
        <div className="grid grid-cols-5 gap-3">
            {[
                { label: 'Mean', value: stats.mean },
                { label: 'Median', value: stats.median },
                { label: 'Mode', value: stats.mode },
                { label: 'Min', value: stats.min },
                { label: 'Max', value: stats.max }
            ].map(stat => (
                <div key={stat.label} className="text-center p-3 bg-slate-700/30 rounded-lg">
                    <p className="text-slate-400 text-xs">{stat.label}</p>
                    <p className="text-xl font-bold text-white">{stat.value}</p>
                </div>
            ))}
        </div>
    );
}

interface MostCommonAnswerProps {
    answer: {
        value: string;
        count: number;
        percentage: number;
    };
    totalResponses: number;
}

export function MostCommonAnswerCard({ answer, totalResponses }: MostCommonAnswerProps) {
    return (
        <div className="p-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl">
            <p className="text-slate-400 text-sm mb-2">Most Common Answer</p>
            <p className="text-2xl font-bold text-white mb-1 break-words">
                "{answer.value}"
            </p>
            <div className="flex items-center gap-4 mt-3">
                <div>
                    <span className="text-3xl font-bold text-cyan-400">{answer.percentage}%</span>
                    <span className="text-slate-400 ml-2">of respondents</span>
                </div>
                <div className="text-slate-500">
                    ({answer.count} of {totalResponses})
                </div>
            </div>
        </div>
    );
}
