'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, ArrowRight, Sparkles, Loader2, Shield } from 'lucide-react';
import { clsx } from 'clsx';

interface ParticipantEntryProps {
    onSubmit: (name: string, phone: string) => void;
    isLoading?: boolean;
}

export function ParticipantEntry({ onSubmit, isLoading }: ParticipantEntryProps) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

    const validateForm = () => {
        // No validation needed for anonymous mode
        if (isAnonymous) {
            return true;
        }

        const newErrors: { name?: string; phone?: string } = {};

        // Both fields are now optional, but if provided, validate them
        if (name.trim() && name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        }

        if (phone.trim() && phone.replace(/\D/g, '').length < 10) {
            newErrors.phone = 'Please enter a valid 10-digit phone number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm() && !isLoading) {
            if (isAnonymous) {
                onSubmit('Anonymous', '');
            } else {
                onSubmit(name.trim() || 'Anonymous', phone.replace(/\D/g, ''));
            }
        }
    };

    const handleAnonymous = () => {
        if (!isLoading) {
            setIsAnonymous(true);
            onSubmit('Anonymous', '');
        }
    };

    const formatPhone = (value: string) => {
        const digits = value.replace(/\D/g, '');
        return digits.slice(0, 10);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-cyan-500/5 to-transparent rounded-full" />
            </div>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="text-center mb-8 relative z-10"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full border border-cyan-500/20 mb-6">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm text-cyan-300 font-medium">AI Nurse Copilot Survey</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                    Welcome! Let&apos;s get{' '}
                    <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        started
                    </span>
                </h1>

                <p className="text-slate-400 text-base max-w-md mx-auto">
                    Enter your details to save progress, or continue anonymously.
                </p>
            </motion.div>

            {/* Form Card */}
            <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                className="w-full max-w-md relative z-10"
            >
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 sm:p-8">
                    {/* Anonymous Button - Prominent */}
                    <motion.button
                        type="button"
                        onClick={handleAnonymous}
                        disabled={isLoading}
                        whileHover={!isLoading ? { scale: 1.02 } : {}}
                        whileTap={!isLoading ? { scale: 0.98 } : {}}
                        className={clsx(
                            'w-full py-4 rounded-xl font-bold text-base mb-6',
                            'bg-gradient-to-r from-emerald-500 to-teal-500',
                            'text-white shadow-lg shadow-emerald-500/25',
                            'flex items-center justify-center gap-3',
                            'transition-all duration-200',
                            isLoading
                                ? 'opacity-70 cursor-wait'
                                : 'hover:shadow-emerald-500/40 hover:from-emerald-400 hover:to-teal-400'
                        )}
                    >
                        {isLoading && isAnonymous ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Starting...
                            </>
                        ) : (
                            <>
                                <Shield className="w-5 h-5" />
                                Continue Anonymously
                            </>
                        )}
                    </motion.button>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 h-px bg-slate-700" />
                        <span className="text-xs text-slate-500 uppercase tracking-wider">or provide details</span>
                        <div className="flex-1 h-px bg-slate-700" />
                    </div>

                    {/* Name Input - Optional */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Your Name <span className="text-slate-500">(optional)</span>
                        </label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (errors.name) setErrors({ ...errors, name: undefined });
                                }}
                                placeholder="Enter your name"
                                disabled={isLoading}
                                className={clsx(
                                    'w-full pl-12 pr-4 py-3 rounded-xl bg-slate-800/50 text-white placeholder-slate-500',
                                    'border transition-all duration-200',
                                    'focus:outline-none focus:ring-2 focus:ring-cyan-500/50',
                                    errors.name
                                        ? 'border-red-500/50 focus:border-red-500'
                                        : 'border-slate-600 focus:border-cyan-500',
                                    isLoading && 'opacity-50 cursor-not-allowed'
                                )}
                            />
                        </div>
                        {errors.name && (
                            <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-400 text-sm mt-2"
                            >
                                {errors.name}
                            </motion.p>
                        )}
                    </div>

                    {/* Phone Input - Optional */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Phone Number <span className="text-slate-500">(optional)</span>
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => {
                                    setPhone(formatPhone(e.target.value));
                                    if (errors.phone) setErrors({ ...errors, phone: undefined });
                                }}
                                placeholder="Enter 10-digit phone"
                                disabled={isLoading}
                                className={clsx(
                                    'w-full pl-12 pr-4 py-3 rounded-xl bg-slate-800/50 text-white placeholder-slate-500',
                                    'border transition-all duration-200',
                                    'focus:outline-none focus:ring-2 focus:ring-cyan-500/50',
                                    errors.phone
                                        ? 'border-red-500/50 focus:border-red-500'
                                        : 'border-slate-600 focus:border-cyan-500',
                                    isLoading && 'opacity-50 cursor-not-allowed'
                                )}
                            />
                        </div>
                        {errors.phone && (
                            <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-400 text-sm mt-2"
                            >
                                {errors.phone}
                            </motion.p>
                        )}
                    </div>

                    {/* Submit with Details Button */}
                    <motion.button
                        type="submit"
                        disabled={isLoading}
                        whileHover={!isLoading ? { scale: 1.02 } : {}}
                        whileTap={!isLoading ? { scale: 0.98 } : {}}
                        className={clsx(
                            'w-full py-3 rounded-xl font-medium text-base',
                            'bg-slate-700 border border-slate-600',
                            'text-slate-200',
                            'flex items-center justify-center gap-2',
                            'transition-all duration-200',
                            isLoading
                                ? 'opacity-70 cursor-wait'
                                : 'hover:bg-slate-600 hover:border-slate-500'
                        )}
                    >
                        {isLoading && !isAnonymous ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Checking...
                            </>
                        ) : (
                            <>
                                Continue with Details
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </motion.button>
                </div>

                {/* Privacy Note */}
                <p className="mt-6 text-xs text-slate-500 text-center">
                    <Shield className="w-3 h-3 inline mr-1" />
                    Your survey responses are always anonymous.
                    <br />
                    Name/phone is only used to save progress.
                </p>
            </motion.form>
        </div>
    );
}
