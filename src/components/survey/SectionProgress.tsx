'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

interface Section {
    name: string;
    questionCount: number;
    answeredCount: number;
}

interface SectionProgressProps {
    sections: Section[];
    currentSectionIndex: number;
    currentQuestionInSection: number;
    totalQuestionsInCurrentSection: number;
}

export function SectionProgress({
    sections,
    currentSectionIndex,
    currentQuestionInSection,
    totalQuestionsInCurrentSection,
}: SectionProgressProps) {
    const currentSection = sections[currentSectionIndex];
    const totalQuestions = sections.reduce((sum, s) => sum + s.questionCount, 0);
    const answeredQuestions = sections.reduce((sum, s) => sum + s.answeredCount, 0);
    const overallProgress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

    return (
        <div className="w-full max-w-2xl mx-auto mb-8">
            {/* Overall Progress Bar */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-300">
                        Progress
                    </span>
                    <span className="text-sm text-slate-400">
                        {Math.round(overallProgress)}% complete
                    </span>
                </div>
                <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${overallProgress}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                </div>
            </div>

            {/* Current Section Info */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-cyan-400">
                            {currentSectionIndex + 1}
                        </span>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-white">
                            {currentSection?.name || 'Survey'}
                        </h3>
                        <p className="text-xs text-slate-400">
                            Question {currentQuestionInSection} of {totalQuestionsInCurrentSection}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {sections.map((section, idx) => (
                        <div
                            key={section.name}
                            className={clsx(
                                'w-2 h-2 rounded-full transition-all duration-300',
                                idx < currentSectionIndex
                                    ? 'bg-emerald-400'
                                    : idx === currentSectionIndex
                                        ? 'bg-cyan-400 w-6 rounded-md'
                                        : 'bg-slate-600'
                            )}
                        />
                    ))}
                </div>
            </div>

            {/* Section Pills (Mobile Scrollable) */}
            <div className="mt-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                <div className="flex gap-2 min-w-max">
                    {sections.map((section, idx) => {
                        const isComplete = section.answeredCount === section.questionCount;
                        const isCurrent = idx === currentSectionIndex;
                        const isPast = idx < currentSectionIndex;

                        return (
                            <motion.div
                                key={section.name}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className={clsx(
                                    'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
                                    'border transition-all duration-300',
                                    isCurrent
                                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                                        : isComplete || isPast
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                            : 'bg-slate-800/50 border-slate-700/50 text-slate-500'
                                )}
                            >
                                {isComplete || isPast ? (
                                    <CheckCircle className="w-3 h-3" />
                                ) : isCurrent ? (
                                    <Circle className="w-3 h-3" />
                                ) : null}
                                <span className="whitespace-nowrap">{section.name}</span>
                                {isCurrent && <ChevronRight className="w-3 h-3 animate-pulse" />}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
