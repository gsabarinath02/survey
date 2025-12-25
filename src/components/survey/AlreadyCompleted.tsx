'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Sparkles, Heart } from 'lucide-react';

interface AlreadyCompletedProps {
    participantName?: string;
    completedAt?: string;
}

export function AlreadyCompleted({ participantName, completedAt }: AlreadyCompletedProps) {
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-gradient-to-br from-green-500/10 to-emerald-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 rounded-full blur-3xl" />
            </div>

            {/* Content */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="text-center relative z-10 max-w-md"
            >
                {/* Success Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-xl shadow-green-500/30"
                >
                    <CheckCircle2 className="w-12 h-12 text-white" />
                </motion.div>

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-full border border-green-500/20 mb-6">
                    <Sparkles className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-300 font-medium">Survey Complete</span>
                </div>

                {/* Title */}
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                    Thank you{participantName ? `, ${participantName}` : ''}!
                </h1>

                {/* Message */}
                <p className="text-slate-400 text-lg mb-6">
                    You have already completed this survey.
                </p>

                {completedAt && (
                    <p className="text-slate-500 text-sm mb-8">
                        Completed on {formatDate(completedAt)}
                    </p>
                )}

                {/* Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
                >
                    <div className="flex items-center justify-center gap-3 text-slate-300">
                        <Heart className="w-5 h-5 text-rose-400" />
                        <span>Your feedback helps improve healthcare technology</span>
                    </div>
                </motion.div>

                {/* Footer */}
                <p className="mt-8 text-sm text-slate-500">
                    If you believe this is an error, please contact the survey administrator.
                </p>
            </motion.div>
        </div>
    );
}
