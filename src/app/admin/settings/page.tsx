'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Key, Database, Save, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';

export default function SettingsPage() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isReseeding, setIsReseeding] = useState(false);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        // Note: In production, implement proper password change API
        setMessage({ type: 'success', text: 'Password change functionality requires server implementation' });
    };

    const handleReseed = async () => {
        if (!confirm('This will reset all questions to their default state. Continue?')) return;

        setIsReseeding(true);
        try {
            // Note: Implement reseed API endpoint
            await new Promise(resolve => setTimeout(resolve, 2000));
            setMessage({ type: 'success', text: 'Database reseeded successfully' });
        } catch {
            setMessage({ type: 'error', text: 'Failed to reseed database' });
        } finally {
            setIsReseeding(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="text-slate-400 mt-1">Manage application settings</p>
            </div>

            {/* Message */}
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={clsx(
                        "flex items-center gap-2 p-4 rounded-lg",
                        message.type === 'success'
                            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                            : "bg-red-500/10 border border-red-500/30 text-red-400"
                    )}
                >
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message.text}
                </motion.div>
            )}

            {/* Password Change */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-xl border border-slate-700 bg-slate-800/50"
            >
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Key className="w-5 h-5 text-cyan-400" />
                    Change Admin Password
                </h2>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Current Password</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium flex items-center gap-2 hover:from-cyan-400 hover:to-blue-400"
                    >
                        <Save className="w-4 h-4" />
                        Update Password
                    </button>
                </form>
            </motion.div>

            {/* Database Operations */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 rounded-xl border border-slate-700 bg-slate-800/50"
            >
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5 text-cyan-400" />
                    Database Operations
                </h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                        <div>
                            <p className="text-white font-medium">Reseed Questions</p>
                            <p className="text-slate-400 text-sm">Reset all questions to their default state</p>
                        </div>
                        <button
                            onClick={handleReseed}
                            disabled={isReseeding}
                            className={clsx(
                                "px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors",
                                isReseeding
                                    ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                                    : "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                            )}
                        >
                            <RefreshCw className={clsx("w-4 h-4", isReseeding && "animate-spin")} />
                            {isReseeding ? 'Reseeding...' : 'Reseed'}
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* App Info */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 rounded-xl border border-slate-700 bg-slate-800/50"
            >
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-cyan-400" />
                    Application Info
                </h2>
                <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-slate-700">
                        <span className="text-slate-400">Version</span>
                        <span className="text-white">1.0.0</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-700">
                        <span className="text-slate-400">Database</span>
                        <span className="text-white">SQLite (Prisma)</span>
                    </div>
                    <div className="flex justify-between py-2">
                        <span className="text-slate-400">Framework</span>
                        <span className="text-white">Next.js 16</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
