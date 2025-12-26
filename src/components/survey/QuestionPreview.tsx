'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye } from 'lucide-react';
import { QuestionCard, Question } from './QuestionCard';
import { clsx } from 'clsx';

interface QuestionPreviewProps {
    question: {
        id: string;
        externalId: string;
        role: string;
        section: string;
        text: string;
        subText?: string | null;
        type: string;
        options?: string[] | null;
        required: boolean;
        config?: {
            min?: number;
            max?: number;
            likertLabels?: { low: string; high: string };
        } | null;
    };
    isOpen: boolean;
    onClose: () => void;
}

export function QuestionPreview({ question, isOpen, onClose }: QuestionPreviewProps) {
    const [previewAnswer, setPreviewAnswer] = useState<unknown>(undefined);

    // Convert admin question format to QuestionCard format
    const questionForCard: Question = {
        id: question.id,
        section: question.section,
        text: question.text,
        subText: question.subText || undefined,
        type: question.type as 'choice' | 'multi-choice' | 'text' | 'textarea' | 'slider' | 'boolean' | 'likert' | 'info',
        options: question.options || undefined,
        isCore: question.required,
        required: question.required,
        min: question.config?.min,
        max: question.config?.max,
        labels: question.config?.likertLabels
            ? { 1: question.config.likertLabels.low, 5: question.config.likertLabels.high }
            : undefined,
    };

    const handlePreviewAnswer = async (value: unknown): Promise<void> => {
        setPreviewAnswer(value);
        // Don't navigate - just show the selection
    };

    const handlePreviewNext = () => {
        // In preview mode, don't actually navigate
        // Just reset the answer to show the interaction
    };

    // Reset preview answer when modal closes
    React.useEffect(() => {
        if (!isOpen) {
            setPreviewAnswer(undefined);
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    {/* Background - matches survey background */}
                    <div className="absolute inset-0 bg-[#0f172a]">
                        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 rounded-full blur-3xl" />
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-full blur-3xl" />
                    </div>

                    {/* Preview Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Preview Badge & Controls */}
                        <div className="flex items-center justify-between mb-4 relative z-20">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full border border-amber-500/30">
                                    <Eye className="w-4 h-4 text-amber-400" />
                                    <span className="text-sm text-amber-300 font-medium">Preview Mode</span>
                                </div>
                                <div className={clsx(
                                    "px-3 py-1.5 rounded-full text-xs font-medium",
                                    question.role === 'nurse'
                                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                        : question.role === 'doctor'
                                            ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                            : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                                )}>
                                    {question.role === 'both' ? 'Both Roles' : `${question.role.charAt(0).toUpperCase() + question.role.slice(1)} Survey`}
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Question Card Preview */}
                        <div className="relative z-10">
                            <QuestionCard
                                question={questionForCard}
                                answer={previewAnswer}
                                onAnswer={handlePreviewAnswer}
                                onNext={handlePreviewNext}
                            />
                        </div>

                        {/* Preview Info */}
                        <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700 relative z-10">
                            <p className="text-sm text-slate-400 text-center">
                                This is a preview of how the question appears to survey participants.
                                <br />
                                <span className="text-slate-500">Interactions are simulated and not saved.</span>
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
