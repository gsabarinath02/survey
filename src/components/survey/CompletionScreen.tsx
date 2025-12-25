'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, PartyPopper, Download, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

interface CompletionScreenProps {
    role: 'nurse' | 'doctor';
    totalQuestions: number;
    completionTime: number; // in minutes
    onStartNew?: () => void;
}

interface ConfettiProps {
    delay: number;
    x: number;
    color: string;
    rotate: number;
    xOffset: number;
    duration: number;
}

// Confetti particle component - all random values passed as props
function ConfettiParticle({ delay, x, color, rotate, xOffset, duration }: ConfettiProps) {
    return (
        <motion.div
            className="absolute w-2 h-2 rounded-full"
            style={{ backgroundColor: color, left: `${x}%` }}
            initial={{ y: -20, opacity: 1, rotate: 0 }}
            animate={{
                y: '100vh',
                opacity: [1, 1, 0],
                rotate: rotate,
                x: xOffset,
            }}
            transition={{
                duration: duration,
                delay: delay,
                ease: 'easeOut',
            }}
        />
    );
}

export function CompletionScreen({
    role,
    totalQuestions,
    completionTime,
    onStartNew,
}: CompletionScreenProps) {
    const [showConfetti, setShowConfetti] = useState(false);
    const [confettiParticles, setConfettiParticles] = useState<ConfettiProps[]>([]);

    useEffect(() => {
        // Generate confetti particles with all random values on client side only
        const colors = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
        const particles = Array.from({ length: 50 }, (_, i) => ({
            delay: i * 0.05,
            x: Math.random() * 100,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotate: Math.random() * 720 - 360,
            xOffset: Math.random() * 100 - 50,
            duration: 3 + Math.random() * 2,
        }));
        setConfettiParticles(particles);
        setShowConfetti(true);

        // Stop confetti after a while
        const timer = setTimeout(() => setShowConfetti(false), 5000);
        return () => clearTimeout(timer);
    }, []);


    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
            {/* Confetti */}
            {showConfetti && (
                <div className="fixed inset-0 pointer-events-none z-50">
                    {confettiParticles.map((particle, i) => (
                        <ConfettiParticle key={i} {...particle} />
                    ))}
                </div>
            )}

            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-purple-500/10 rounded-full blur-3xl animate-pulse" />
            </div>

            {/* Main Content */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="text-center relative z-10 max-w-lg"
            >
                {/* Success Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                    className="mb-8"
                >
                    <div className="relative inline-block">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                            <CheckCircle className="w-12 h-12 text-white" />
                        </div>
                        <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.5, type: 'spring' }}
                            className="absolute -right-2 -top-2"
                        >
                            <PartyPopper className="w-8 h-8 text-amber-400" />
                        </motion.div>
                    </div>
                </motion.div>

                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl sm:text-4xl font-bold text-white mb-4"
                >
                    Thank you
                    <span className="block mt-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        for your valuable input!
                    </span>
                </motion.h1>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-slate-400 text-lg mb-8"
                >
                    Your insights as a {role} will directly shape how we build the AI Nurse Copilot
                    to better support healthcare workflows.
                </motion.p>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex justify-center gap-6 mb-10"
                >
                    <div className="px-6 py-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                        <div className="text-2xl font-bold text-white">{totalQuestions}</div>
                        <div className="text-sm text-slate-400">Questions</div>
                    </div>
                    <div className="px-6 py-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                        <div className="text-2xl font-bold text-white">{completionTime}</div>
                        <div className="text-sm text-slate-400">Minutes</div>
                    </div>
                </motion.div>

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-4"
                >
                    {onStartNew && (
                        <button
                            onClick={onStartNew}
                            className={clsx(
                                'w-full px-6 py-4 rounded-xl font-medium',
                                'bg-gradient-to-r from-cyan-500 to-blue-500 text-white',
                                'hover:from-cyan-400 hover:to-blue-400',
                                'transition-all duration-300 transform hover:scale-[1.02]',
                                'shadow-lg shadow-cyan-500/25',
                                'flex items-center justify-center gap-2'
                            )}
                        >
                            <Sparkles className="w-5 h-5" />
                            Start New Survey
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    )}

                    <div className="flex gap-4">
                        <button
                            className={clsx(
                                'flex-1 px-4 py-3 rounded-xl font-medium text-sm',
                                'bg-slate-800/50 text-slate-300 border border-slate-700/50',
                                'hover:bg-slate-700/50 hover:text-white',
                                'transition-all duration-300',
                                'flex items-center justify-center gap-2'
                            )}
                        >
                            <Download className="w-4 h-4" />
                            Download Report
                        </button>
                        <button
                            className={clsx(
                                'flex-1 px-4 py-3 rounded-xl font-medium text-sm',
                                'bg-slate-800/50 text-slate-300 border border-slate-700/50',
                                'hover:bg-slate-700/50 hover:text-white',
                                'transition-all duration-300',
                                'flex items-center justify-center gap-2'
                            )}
                        >
                            <Mail className="w-4 h-4" />
                            Contact Us
                        </button>
                    </div>
                </motion.div>

                {/* Footer */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-10 text-sm text-slate-500"
                >
                    Your responses have been saved securely. We may reach out if you opted for follow-up.
                </motion.p>
            </motion.div>
        </div>
    );
}
