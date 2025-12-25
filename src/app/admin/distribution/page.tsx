'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Link2,
    Plus,
    QrCode,
    Copy,
    Trash2,
    Eye,
    ExternalLink,
    Calendar
} from 'lucide-react';
import { clsx } from 'clsx';

interface DistributionLink {
    id: string;
    code: string;
    name: string;
    description: string | null;
    source: string | null;
    targetRole: string | null;
    expiresAt: string | null;
    maxSessions: number | null;
    clickCount: number;
    sessionCount: number;
    isActive: boolean;
    createdAt: string;
    url: string;
    qrUrl: string;
}

export default function DistributionPage() {
    const [links, setLinks] = useState<DistributionLink[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newLink, setNewLink] = useState({
        name: '',
        description: '',
        source: 'qr',
        targetRole: '',
        expiresAt: '',
        maxSessions: ''
    });

    useEffect(() => {
        fetchLinks();
    }, []);

    const fetchLinks = async () => {
        try {
            const res = await fetch('/api/distribution');
            if (res.ok) {
                const data = await res.json();
                setLinks(data.links || []);
            }
        } catch (error) {
            console.error('Error fetching links:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const createLink = async () => {
        try {
            const res = await fetch('/api/distribution', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newLink.name,
                    description: newLink.description || null,
                    source: newLink.source || null,
                    targetRole: newLink.targetRole || null,
                    expiresAt: newLink.expiresAt || null,
                    maxSessions: newLink.maxSessions ? parseInt(newLink.maxSessions) : null
                })
            });

            if (res.ok) {
                setShowCreateModal(false);
                setNewLink({ name: '', description: '', source: 'qr', targetRole: '', expiresAt: '', maxSessions: '' });
                fetchLinks();
            }
        } catch (error) {
            console.error('Error creating link:', error);
        }
    };

    const deleteLink = async (code: string) => {
        if (!confirm('Are you sure you want to delete this link?')) return;

        try {
            const res = await fetch(`/api/distribution/${code}`, { method: 'DELETE' });
            if (res.ok) {
                fetchLinks();
            }
        } catch (error) {
            console.error('Error deleting link:', error);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Distribution</h1>
                    <p className="text-slate-400 mt-1">Create trackable links and QR codes for survey distribution</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 hover:from-cyan-600 hover:to-blue-600 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Create Link
                </button>
            </div>

            {/* Links Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {links.map((link, idx) => (
                    <motion.div
                        key={link.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={clsx(
                            "p-5 rounded-xl border bg-slate-800/50",
                            link.isActive ? "border-slate-700" : "border-red-500/30 opacity-60"
                        )}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h3 className="font-semibold text-white">{link.name}</h3>
                                <p className="text-sm text-slate-500">{link.code}</p>
                            </div>
                            <span className={clsx(
                                "px-2 py-1 rounded text-xs font-medium",
                                link.source === 'qr' ? "bg-purple-500/20 text-purple-400" :
                                    link.source === 'email' ? "bg-blue-500/20 text-blue-400" :
                                        "bg-slate-700 text-slate-400"
                            )}>
                                {link.source || 'link'}
                            </span>
                        </div>

                        {link.description && (
                            <p className="text-sm text-slate-400 mb-3">{link.description}</p>
                        )}

                        <div className="flex gap-4 text-sm text-slate-400 mb-4">
                            <span><Eye className="w-4 h-4 inline mr-1" />{link.clickCount} clicks</span>
                            <span><Link2 className="w-4 h-4 inline mr-1" />{link.sessionCount} sessions</span>
                        </div>

                        {link.targetRole && (
                            <div className="text-xs text-slate-500 mb-3">
                                Target: <span className="text-cyan-400 capitalize">{link.targetRole}</span>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={() => copyToClipboard(link.url)}
                                className="flex-1 px-3 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm flex items-center justify-center gap-1 hover:bg-slate-600 transition-colors"
                            >
                                <Copy className="w-4 h-4" />
                                Copy
                            </button>
                            <a
                                href={link.qrUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm flex items-center justify-center gap-1 hover:bg-slate-600 transition-colors"
                            >
                                <QrCode className="w-4 h-4" />
                            </a>
                            <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm flex items-center justify-center gap-1 hover:bg-slate-600 transition-colors"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </a>
                            <button
                                onClick={() => deleteLink(link.code)}
                                className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm flex items-center justify-center hover:bg-red-500/30 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                ))}

                {links.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        No distribution links yet. Create one to start tracking!
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700"
                    >
                        <h2 className="text-xl font-bold text-white mb-4">Create Distribution Link</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={newLink.name}
                                    onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
                                    placeholder="e.g., Ward A Poster"
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Description</label>
                                <input
                                    type="text"
                                    value={newLink.description}
                                    onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
                                    placeholder="Optional description"
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Source</label>
                                    <select
                                        value={newLink.source}
                                        onChange={(e) => setNewLink({ ...newLink, source: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                                    >
                                        <option value="qr">QR Code</option>
                                        <option value="email">Email</option>
                                        <option value="sms">SMS</option>
                                        <option value="poster">Poster</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Target Role</label>
                                    <select
                                        value={newLink.targetRole}
                                        onChange={(e) => setNewLink({ ...newLink, targetRole: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                                    >
                                        <option value="">All</option>
                                        <option value="nurse">Nurses</option>
                                        <option value="doctor">Doctors</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">
                                        <Calendar className="w-4 h-4 inline mr-1" />
                                        Expires
                                    </label>
                                    <input
                                        type="date"
                                        value={newLink.expiresAt}
                                        onChange={(e) => setNewLink({ ...newLink, expiresAt: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Max Sessions</label>
                                    <input
                                        type="number"
                                        value={newLink.maxSessions}
                                        onChange={(e) => setNewLink({ ...newLink, maxSessions: e.target.value })}
                                        placeholder="Unlimited"
                                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 py-3 bg-slate-700 text-slate-300 rounded-xl font-medium hover:bg-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createLink}
                                disabled={!newLink.name}
                                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold disabled:opacity-50 hover:from-cyan-600 hover:to-blue-600 transition-all"
                            >
                                Create
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
