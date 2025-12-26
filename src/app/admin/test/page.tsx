'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ChevronDown,
    Loader2,
    Check,
    AlertCircle,
    Stethoscope,
    Heart,
    GripVertical
} from 'lucide-react';
import { clsx } from 'clsx';

interface Question {
    id: string;
    externalId: string;
    section: string;
    sectionOrder: number;
    order: number;
    text: string;
    subText?: string;
    type: string;
    options?: string[];
    required: boolean;
    role: string;
    conditions?: Array<{
        questionId: string;
        operator: string;
        value: unknown;
    }>;
    config?: {
        min?: number;
        max?: number;
        likertLabels?: { low: string; high: string };
    };
}

export default function TestModePage() {
    const [role, setRole] = useState<'nurse' | 'doctor'>('nurse');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Drag and drop state
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // Fetch questions for the selected role
    useEffect(() => {
        const fetchQuestions = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/questions?role=${role}`);
                const data = await response.json();
                if (data.questions) {
                    // Sort by sectionOrder, then order
                    const sorted = [...data.questions].sort((a, b) => {
                        if (a.sectionOrder !== b.sectionOrder) {
                            return a.sectionOrder - b.sectionOrder;
                        }
                        return a.order - b.order;
                    });
                    setQuestions(sorted);
                    setCurrentIndex(0);
                }
            } catch (error) {
                console.error('Error fetching questions:', error);
                setMessage({ type: 'error', text: 'Failed to load questions' });
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuestions();
    }, [role]);

    // Current question
    const currentQuestion = questions[currentIndex];

    // Section info
    const sectionInfo = useMemo(() => {
        if (!currentQuestion) return { sections: [], currentSection: '', sectionQuestions: 0, positionInSection: 0 };

        const sections = [...new Set(questions.map(q => q.section))];
        const currentSection = currentQuestion.section;
        const sectionQuestions = questions.filter(q => q.section === currentSection).length;
        const sectionStart = questions.findIndex(q => q.section === currentSection);
        const positionInSection = currentIndex - sectionStart + 1;

        return { sections, currentSection, sectionQuestions, positionInSection };
    }, [questions, currentQuestion, currentIndex]);

    // Move question up in order
    const moveUp = async () => {
        if (currentIndex === 0) return;

        setIsSaving(true);
        const current = questions[currentIndex];
        const previous = questions[currentIndex - 1];

        // If same section, swap orders
        if (current.section === previous.section) {
            try {
                await fetch('/api/questions/reorder', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        updates: [
                            { id: current.id, order: previous.order },
                            { id: previous.id, order: current.order }
                        ]
                    })
                });

                // Update local state
                const newQuestions = [...questions];
                [newQuestions[currentIndex - 1], newQuestions[currentIndex]] = [newQuestions[currentIndex], newQuestions[currentIndex - 1]];
                // Update order values
                newQuestions[currentIndex - 1].order = previous.order;
                newQuestions[currentIndex].order = current.order;
                setQuestions(newQuestions);
                setCurrentIndex(currentIndex - 1);
                setMessage({ type: 'success', text: 'Question moved up' });
            } catch (error) {
                console.error('Error reordering:', error);
                setMessage({ type: 'error', text: 'Failed to reorder' });
            }
        }
        setIsSaving(false);
        setTimeout(() => setMessage(null), 2000);
    };

    // Move question down in order
    const moveDown = async () => {
        if (currentIndex >= questions.length - 1) return;

        setIsSaving(true);
        const current = questions[currentIndex];
        const next = questions[currentIndex + 1];

        // If same section, swap orders
        if (current.section === next.section) {
            try {
                await fetch('/api/questions/reorder', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        updates: [
                            { id: current.id, order: next.order },
                            { id: next.id, order: current.order }
                        ]
                    })
                });

                // Update local state
                const newQuestions = [...questions];
                [newQuestions[currentIndex], newQuestions[currentIndex + 1]] = [newQuestions[currentIndex + 1], newQuestions[currentIndex]];
                // Update order values
                newQuestions[currentIndex].order = current.order;
                newQuestions[currentIndex + 1].order = next.order;
                setQuestions(newQuestions);
                setCurrentIndex(currentIndex + 1);
                setMessage({ type: 'success', text: 'Question moved down' });
            } catch (error) {
                console.error('Error reordering:', error);
                setMessage({ type: 'error', text: 'Failed to reorder' });
            }
        }
        setIsSaving(false);
        setTimeout(() => setMessage(null), 2000);
    };

    // Navigation
    const goNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const goPrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') goPrevious();
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowUp' && e.ctrlKey) moveUp();
            if (e.key === 'ArrowDown' && e.ctrlKey) moveDown();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    // Drag and drop handlers
    const handleDragStart = (idx: number) => {
        setDraggedIndex(idx);
    };

    const handleDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== idx) {
            setDragOverIndex(idx);
        }
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = async (targetIdx: number) => {
        if (draggedIndex === null || draggedIndex === targetIdx) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }

        setIsSaving(true);

        // Create new array with reordered questions
        const newQuestions = [...questions];
        const [draggedQuestion] = newQuestions.splice(draggedIndex, 1);
        newQuestions.splice(targetIdx, 0, draggedQuestion);

        // Calculate new order values for all affected questions
        const updates = newQuestions.map((q, idx) => ({
            id: q.id,
            order: idx + 1
        }));

        try {
            await fetch('/api/questions/reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates })
            });

            // Update local state with new order values
            newQuestions.forEach((q, idx) => {
                q.order = idx + 1;
            });
            setQuestions(newQuestions);
            setCurrentIndex(targetIdx);
            setMessage({ type: 'success', text: `Question moved from #${draggedIndex + 1} to #${targetIdx + 1}` });
        } catch (error) {
            console.error('Error reordering:', error);
            setMessage({ type: 'error', text: 'Failed to reorder' });
        }

        setDraggedIndex(null);
        setDragOverIndex(null);
        setIsSaving(false);
        setTimeout(() => setMessage(null), 3000);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Play className="w-6 h-6 text-cyan-400" />
                        Test Mode
                    </h1>
                    <p className="text-slate-400 mt-1">Preview questions as nurses/doctors see them</p>
                </div>

                {/* Role Selector */}
                <div className="flex bg-slate-800 rounded-xl p-1">
                    <button
                        onClick={() => setRole('nurse')}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                            role === 'nurse'
                                ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                                : "text-slate-400 hover:text-white"
                        )}
                    >
                        <Heart className="w-4 h-4" />
                        Nurse
                    </button>
                    <button
                        onClick={() => setRole('doctor')}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                            role === 'doctor'
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "text-slate-400 hover:text-white"
                        )}
                    >
                        <Stethoscope className="w-4 h-4" />
                        Doctor
                    </button>
                </div>
            </div>

            {/* Message */}
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={clsx(
                            "flex items-center gap-2 p-4 rounded-lg",
                            message.type === 'success'
                                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                                : "bg-red-500/10 border border-red-500/30 text-red-400"
                        )}
                    >
                        {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {message.text}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                </div>
            ) : questions.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                    No questions found for {role} role
                </div>
            ) : (
                <>
                    {/* Progress Bar */}
                    <div className="bg-slate-800 rounded-full h-2 overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>

                    {/* Section Info */}
                    <div className="flex items-center justify-between text-sm">
                        <span className="px-3 py-1 rounded-full bg-slate-800 text-cyan-400 font-medium">
                            {sectionInfo.currentSection}
                        </span>
                        <span className="text-slate-400">
                            Question {currentIndex + 1} of {questions.length}
                        </span>
                    </div>

                    {/* Question Card */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentQuestion.id}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                            className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 relative"
                        >
                            {/* Question Meta */}
                            <div className="flex items-center gap-2 mb-4">
                                <span className="px-2 py-0.5 rounded bg-slate-700 text-xs text-slate-300">
                                    {currentQuestion.type}
                                </span>
                                {currentQuestion.required && (
                                    <span className="px-2 py-0.5 rounded bg-red-500/20 text-xs text-red-400">
                                        Required
                                    </span>
                                )}
                                {currentQuestion.conditions && currentQuestion.conditions.length > 0 && (
                                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-xs text-amber-400">
                                        Conditional
                                    </span>
                                )}
                            </div>

                            {/* Question Text */}
                            <h2 className="text-2xl font-bold text-white mb-3 leading-tight">
                                {currentQuestion.text}
                            </h2>

                            {currentQuestion.subText && (
                                <p className="text-slate-400 mb-6">{currentQuestion.subText}</p>
                            )}

                            {/* Options Preview */}
                            {currentQuestion.options && currentQuestion.options.length > 0 && (
                                <div className="space-y-2 mt-6">
                                    {currentQuestion.options.map((option, idx) => (
                                        <div
                                            key={idx}
                                            className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/50 text-slate-300"
                                        >
                                            <span className="text-slate-500 mr-2">{idx + 1}.</span>
                                            {option}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Likert/Slider Preview */}
                            {(currentQuestion.type === 'likert' || currentQuestion.type === 'slider') && (
                                <div className="mt-6 flex justify-between gap-2">
                                    {Array.from({ length: (currentQuestion.config?.max || 5) - (currentQuestion.config?.min || 1) + 1 }, (_, i) => (
                                        <div
                                            key={i}
                                            className="flex-1 aspect-square max-w-12 rounded-xl bg-slate-700/30 border border-slate-600/50 flex items-center justify-center text-slate-400 font-medium"
                                        >
                                            {(currentQuestion.config?.min || 1) + i}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Reorder Controls */}
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                                <button
                                    onClick={moveUp}
                                    disabled={currentIndex === 0 || isSaving || currentQuestion.section !== questions[currentIndex - 1]?.section}
                                    className={clsx(
                                        "p-2 rounded-lg border transition-all",
                                        currentIndex === 0 || currentQuestion.section !== questions[currentIndex - 1]?.section
                                            ? "border-slate-700 text-slate-600 cursor-not-allowed"
                                            : "border-slate-600 text-slate-400 hover:border-cyan-500 hover:text-cyan-400"
                                    )}
                                    title="Move question up (Ctrl+↑)"
                                >
                                    <ChevronUp className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={moveDown}
                                    disabled={currentIndex >= questions.length - 1 || isSaving || currentQuestion.section !== questions[currentIndex + 1]?.section}
                                    className={clsx(
                                        "p-2 rounded-lg border transition-all",
                                        currentIndex >= questions.length - 1 || currentQuestion.section !== questions[currentIndex + 1]?.section
                                            ? "border-slate-700 text-slate-600 cursor-not-allowed"
                                            : "border-slate-600 text-slate-400 hover:border-cyan-500 hover:text-cyan-400"
                                    )}
                                    title="Move question down (Ctrl+↓)"
                                >
                                    <ChevronDown className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={goPrevious}
                            disabled={currentIndex === 0}
                            className={clsx(
                                "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all",
                                currentIndex === 0
                                    ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                            )}
                        >
                            <ChevronLeft className="w-5 h-5" />
                            Previous
                        </button>

                        <div className="text-slate-500 text-sm">
                            Use ← → arrows to navigate • Ctrl+↑↓ to reorder
                        </div>

                        <button
                            onClick={goNext}
                            disabled={currentIndex >= questions.length - 1}
                            className={clsx(
                                "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all",
                                currentIndex >= questions.length - 1
                                    ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                                    : "bg-cyan-500 text-white hover:bg-cyan-400"
                            )}
                        >
                            Next
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Question List Overview - Draggable */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium text-slate-400">All Questions</h3>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                <GripVertical className="w-3 h-3" />
                                Drag to reorder
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {questions.map((q, idx) => (
                                <div
                                    key={q.id}
                                    draggable
                                    onDragStart={() => handleDragStart(idx)}
                                    onDragOver={(e) => handleDragOver(e, idx)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={() => handleDrop(idx)}
                                    onDragEnd={handleDragEnd}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={clsx(
                                        "w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-grab active:cursor-grabbing select-none flex items-center justify-center",
                                        idx === currentIndex
                                            ? "bg-cyan-500 text-white ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900"
                                            : draggedIndex === idx
                                                ? "bg-cyan-500/50 text-white opacity-50"
                                                : dragOverIndex === idx
                                                    ? "bg-emerald-500 text-white ring-2 ring-emerald-400"
                                                    : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white"
                                    )}
                                >
                                    {idx + 1}
                                </div>
                            ))}
                        </div>
                        {isSaving && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving order...
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
