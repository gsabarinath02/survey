'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Stethoscope, Heart, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface RoleSelectionProps {
    onSelectRole: (role: 'nurse' | 'doctor') => void;
    isLoading?: boolean;
}

export function RoleSelection({ onSelectRole, isLoading }: RoleSelectionProps) {
    const [selectedRole, setSelectedRole] = useState<'nurse' | 'doctor' | null>(null);

    const handleRoleClick = (role: 'nurse' | 'doctor') => {
        if (isLoading) return;
        setSelectedRole(role);
        onSelectRole(role);
    };

    const roles = [
        {
            id: 'nurse' as const,
            title: 'Nurse',
            description: 'Share your daily experiences with documentation, handovers, and patient care workflows.',
            icon: Heart,
            gradient: 'from-rose-500 to-pink-600',
            hoverGradient: 'from-rose-400 to-pink-500',
            bgGlow: 'bg-rose-500/20',
            questions: 56,
            time: '10-15 min',
        },
        {
            id: 'doctor' as const,
            title: 'Doctor',
            description: 'Help us understand how nurse documentation and AI tools can support your clinical decisions.',
            icon: Stethoscope,
            gradient: 'from-blue-500 to-indigo-600',
            hoverGradient: 'from-blue-400 to-indigo-500',
            bgGlow: 'bg-blue-500/20',
            questions: 39,
            time: '8-12 min',
        },
    ];

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-gradient-to-br from-rose-500/10 to-pink-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-cyan-500/5 to-transparent rounded-full" />
            </div>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="text-center mb-12 relative z-10"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full border border-cyan-500/20 mb-6">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm text-cyan-300 font-medium">AI Nurse Copilot Survey</span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                    Your voice{' '}
                    <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        matters
                    </span>
                </h1>

                <p className="text-slate-400 text-lg max-w-md mx-auto">
                    Help shape the future of healthcare technology.
                    Select your role to begin the survey.
                </p>
            </motion.div>

            {/* Role Cards */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full relative z-10"
            >
                {roles.map((role, index) => {
                    const isSelected = selectedRole === role.id;
                    const isOther = selectedRole !== null && selectedRole !== role.id;

                    return (
                        <motion.button
                            key={role.id}
                            onClick={() => handleRoleClick(role.id)}
                            disabled={isLoading}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                            whileHover={!isLoading ? { scale: 1.02, y: -4 } : {}}
                            whileTap={!isLoading ? { scale: 0.98 } : {}}
                            className={clsx(
                                'group relative p-6 sm:p-8 rounded-2xl border',
                                'bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl',
                                'text-left transition-all duration-300',
                                'focus:outline-none focus:ring-2 focus:ring-cyan-500/50',
                                isSelected && isLoading
                                    ? 'border-cyan-500/50 shadow-xl shadow-cyan-500/20'
                                    : isOther && isLoading
                                        ? 'opacity-40 border-white/5 cursor-not-allowed'
                                        : 'border-white/10 hover:border-white/20 hover:shadow-xl hover:shadow-black/20',
                                isLoading && 'cursor-wait'
                            )}
                        >
                            {/* Loading Overlay for selected card */}
                            {isSelected && isLoading && (
                                <div className="absolute inset-0 bg-slate-900/60 rounded-2xl flex items-center justify-center z-20 backdrop-blur-sm">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                                        <span className="text-cyan-400 text-sm font-medium">Preparing survey...</span>
                                    </div>
                                </div>
                            )}

                            {/* Glow Effect */}
                            <div className={clsx(
                                'absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                                role.bgGlow, 'blur-2xl -z-10',
                                isLoading && 'group-hover:opacity-0'
                            )} />

                            {/* Icon */}
                            <div className={clsx(
                                'w-14 h-14 rounded-xl flex items-center justify-center mb-4',
                                'bg-gradient-to-br', role.gradient,
                                'shadow-lg shadow-black/20'
                            )}>
                                <role.icon className="w-7 h-7 text-white" />
                            </div>

                            {/* Content */}
                            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                                {role.title}
                                <ArrowRight className={clsx(
                                    "w-5 h-5 transition-all",
                                    isLoading ? 'text-slate-600' : 'text-slate-500 group-hover:text-white group-hover:translate-x-1'
                                )} />
                            </h2>

                            <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                                {role.description}
                            </p>

                            {/* Meta */}
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                <span className="px-2 py-1 bg-slate-700/50 rounded-md">
                                    {role.questions} questions
                                </span>
                                <span className="px-2 py-1 bg-slate-700/50 rounded-md">
                                    ~{role.time}
                                </span>
                            </div>

                            {/* Hover Gradient Border */}
                            {!isLoading && (
                                <div className={clsx(
                                    'absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300',
                                    'bg-gradient-to-br', role.gradient, 'p-[1px]'
                                )}>
                                    <div className="w-full h-full rounded-2xl bg-slate-900" />
                                </div>
                            )}
                        </motion.button>
                    );
                })}
            </motion.div>

            {/* Footer Note */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="mt-12 text-sm text-slate-500 text-center max-w-md relative z-10"
            >
                Your responses are anonymous and will be used to improve healthcare workflows.
                You can exit at any time.
            </motion.p>
        </div>
    );
}

