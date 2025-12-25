'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Download,
    FileSpreadsheet,
    FileJson,
    Calendar,
    Filter,
    Users,
    CheckCircle
} from 'lucide-react';
import { clsx } from 'clsx';

export default function ExportPage() {
    const [format, setFormat] = useState<'csv' | 'json'>('csv');
    const [role, setRole] = useState<string>('all');
    const [completedOnly, setCompletedOnly] = useState(false);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const params = new URLSearchParams();
            params.set('format', format);
            if (role !== 'all') params.set('role', role);
            if (completedOnly) params.set('completed', 'true');
            if (fromDate) params.set('from', fromDate);
            if (toDate) params.set('to', toDate);

            const res = await fetch(`/api/export?${params.toString()}`);

            if (res.ok) {
                if (format === 'csv') {
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `survey-export-${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                } else {
                    const data = await res.json();
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `survey-export-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                }
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export data');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Export Data</h1>
                <p className="text-slate-400 mt-1">Download survey responses in CSV or JSON format</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Export Options */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-xl border border-slate-700 bg-slate-800/50 space-y-6"
                >
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Filter className="w-5 h-5 text-cyan-400" />
                        Export Options
                    </h2>

                    {/* Format Selection */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Format</label>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setFormat('csv')}
                                className={clsx(
                                    "flex-1 p-4 rounded-xl border flex items-center justify-center gap-2 transition-all",
                                    format === 'csv'
                                        ? "border-cyan-500 bg-cyan-500/20 text-cyan-400"
                                        : "border-slate-700 text-slate-400 hover:border-slate-600"
                                )}
                            >
                                <FileSpreadsheet className="w-5 h-5" />
                                CSV
                            </button>
                            <button
                                onClick={() => setFormat('json')}
                                className={clsx(
                                    "flex-1 p-4 rounded-xl border flex items-center justify-center gap-2 transition-all",
                                    format === 'json'
                                        ? "border-cyan-500 bg-cyan-500/20 text-cyan-400"
                                        : "border-slate-700 text-slate-400 hover:border-slate-600"
                                )}
                            >
                                <FileJson className="w-5 h-5" />
                                JSON
                            </button>
                        </div>
                    </div>

                    {/* Role Filter */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">
                            <Users className="w-4 h-4 inline mr-1" />
                            Role
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                        >
                            <option value="all">All Roles</option>
                            <option value="nurse">Nurses Only</option>
                            <option value="doctor">Doctors Only</option>
                        </select>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                From Date
                            </label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">To Date</label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Completed Only */}
                    <label className="flex items-center gap-3 cursor-pointer">
                        <div
                            onClick={() => setCompletedOnly(!completedOnly)}
                            className={clsx(
                                "w-6 h-6 rounded border flex items-center justify-center transition-all",
                                completedOnly
                                    ? "border-cyan-500 bg-cyan-500"
                                    : "border-slate-600"
                            )}
                        >
                            {completedOnly && <CheckCircle className="w-4 h-4 text-white" />}
                        </div>
                        <span className="text-slate-300">Completed surveys only</span>
                    </label>

                    {/* Export Button */}
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-4 rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <Download className="w-5 h-5" />
                        {isExporting ? 'Exporting...' : 'Export Data'}
                    </button>
                </motion.div>

                {/* Export Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-xl border border-slate-700 bg-slate-800/50 space-y-4"
                >
                    <h2 className="text-lg font-semibold text-white">What&apos;s Included</h2>

                    <div className="space-y-3">
                        <div className="p-4 bg-slate-700/30 rounded-lg">
                            <h3 className="font-medium text-white mb-1">Session Information</h3>
                            <p className="text-sm text-slate-400">
                                Session ID, role, language, start/completion times, response time, validity status
                            </p>
                        </div>

                        <div className="p-4 bg-slate-700/30 rounded-lg">
                            <h3 className="font-medium text-white mb-1">All Question Responses</h3>
                            <p className="text-sm text-slate-400">
                                Each question as a column with the response value. Multi-choice answers are semicolon-separated.
                            </p>
                        </div>

                        <div className="p-4 bg-slate-700/30 rounded-lg">
                            <h3 className="font-medium text-white mb-1">Distribution Tracking</h3>
                            <p className="text-sm text-slate-400">
                                Source code for tracking which QR code or link brought the respondent.
                            </p>
                        </div>
                    </div>

                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <p className="text-sm text-amber-200">
                            <strong>Privacy Note:</strong> Exports do not include device fingerprints or IP hashes.
                            Data is anonymized at export time.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
