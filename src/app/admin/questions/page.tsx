'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Search,
    Edit2,
    Trash2,
    ChevronDown,
    ChevronUp,
    Save,
    X,
    Plus,
    Eye,
    GripVertical
} from 'lucide-react';
import { QuestionPreview } from '@/components/survey/QuestionPreview';
import { clsx } from 'clsx';

interface Question {
    id: string;
    externalId: string;
    role: string;
    section: string;
    sectionOrder: number;
    order: number;
    text: string;
    subText: string | null;
    type: string;
    options: string[] | null;
    required: boolean;
}

const QUESTION_TYPES = [
    { value: 'choice', label: 'Single Choice' },
    { value: 'multi-choice', label: 'Multiple Choice' },
    { value: 'boolean', label: 'Yes/No' },
    { value: 'likert', label: 'Likert Scale (1-5)' },
    { value: 'text', label: 'Short Text' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'slider', label: 'Slider' },
    { value: 'info', label: 'Info (no answer)' },
];

const emptyQuestion = {
    externalId: '',
    role: 'nurse',
    section: '',
    sectionOrder: 1,
    order: 1,
    text: '',
    subText: '',
    type: 'choice',
    options: [],
    required: true,
};

export default function QuestionsPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [sectionFilter, setSectionFilter] = useState<string>('all');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Question>>({});
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState(emptyQuestion);
    const [optionsText, setOptionsText] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

    // Drag and drop state
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [isReordering, setIsReordering] = useState(false);

    // Get unique sections
    const sections = [...new Set(questions.map(q => q.section).filter(Boolean))];

    useEffect(() => {
        fetchQuestions();
    }, []);

    useEffect(() => {
        let filtered = questions;

        // Role filter
        if (roleFilter !== 'all') {
            filtered = filtered.filter(q => q.role === roleFilter);
        }

        // Section filter
        if (sectionFilter !== 'all') {
            filtered = filtered.filter(q => q.section === sectionFilter);
        }

        // Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(q =>
                q.text?.toLowerCase().includes(query) ||
                q.externalId?.toLowerCase().includes(query) ||
                q.section?.toLowerCase().includes(query)
            );
        }

        setFilteredQuestions(filtered);
    }, [questions, searchQuery, roleFilter, sectionFilter]);

    const fetchQuestions = async () => {
        try {
            const res = await fetch('/api/questions?activeOnly=false');
            if (res.ok) {
                const data = await res.json();
                const questionsArray = data.questions || data;
                setQuestions(Array.isArray(questionsArray) ? questionsArray : []);
            }
        } catch (err) {
            console.error('Error fetching questions:', err);
            setQuestions([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (question: Question) => {
        setEditingId(question.id);
        setEditForm(question);
        setOptionsText(question.options?.join('\n') || '');
    };

    const handleSave = async () => {
        if (!editingId) return;
        setIsSaving(true);
        setError(null);

        try {
            const updateData = {
                ...editForm,
                options: optionsText.trim() ? optionsText.split('\n').filter(o => o.trim()) : null,
            };

            const res = await fetch(`/api/questions/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            if (res.ok) {
                await fetchQuestions();
                setEditingId(null);
                setEditForm({});
                setOptionsText('');
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to save');
            }
        } catch (err) {
            console.error('Error saving question:', err);
            setError('Failed to save question');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAdd = async () => {
        if (!addForm.text || !addForm.externalId || !addForm.section) {
            setError('Please fill in External ID, Section, and Question Text');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const createData = {
                ...addForm,
                options: optionsText.trim() ? optionsText.split('\n').filter(o => o.trim()) : null,
            };

            const res = await fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createData),
            });

            if (res.ok) {
                await fetchQuestions();
                setShowAddModal(false);
                setAddForm(emptyQuestion);
                setOptionsText('');
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to create question');
            }
        } catch (err) {
            console.error('Error creating question:', err);
            setError('Failed to create question');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this question?')) return;

        try {
            const res = await fetch(`/api/questions/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                await fetchQuestions();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete question');
            }
        } catch (err) {
            console.error('Error deleting question:', err);
            alert('Failed to delete question');
        }
    };

    // Drag and drop handlers
    const handleDragStart = (e: React.DragEvent, questionId: string) => {
        setDraggedId(questionId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', questionId);
    };

    const handleDragOver = (e: React.DragEvent, questionId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedId && draggedId !== questionId) {
            setDragOverId(questionId);
        }
    };

    const handleDragEnd = () => {
        setDraggedId(null);
        setDragOverId(null);
    };

    const handleDrop = async (e: React.DragEvent, targetId: string) => {
        e.preventDefault();

        if (!draggedId || draggedId === targetId) {
            handleDragEnd();
            return;
        }

        // Find indices in filtered list
        const draggedIndex = filteredQuestions.findIndex(q => q.id === draggedId);
        const targetIndex = filteredQuestions.findIndex(q => q.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) {
            handleDragEnd();
            return;
        }

        // Create a copy of the filtered list and reorder
        const reordered = [...filteredQuestions];
        const [draggedItem] = reordered.splice(draggedIndex, 1);
        reordered.splice(targetIndex, 0, draggedItem);

        // Update order values
        const updatedItems = reordered.map((q, index) => ({
            ...q,
            order: index + 1
        }));

        // Update local state immediately for responsive UI
        setFilteredQuestions(updatedItems);

        // Prepare data for API
        const reorderData = updatedItems.map((q, index) => ({
            id: q.id,
            order: index + 1
        }));

        // Save to API
        setIsReordering(true);
        try {
            const res = await fetch('/api/questions/reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: reorderData }),
            });

            if (!res.ok) {
                // Revert on error
                await fetchQuestions();
                alert('Failed to save new order');
            } else {
                // Refresh to get updated data
                await fetchQuestions();
            }
        } catch (err) {
            console.error('Error reordering questions:', err);
            await fetchQuestions();
            alert('Failed to save new order');
        } finally {
            setIsReordering(false);
            handleDragEnd();
        }
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Questions</h1>
                    <p className="text-slate-400 mt-1">{questions.length} total questions</p>
                </div>
                <button
                    onClick={() => {
                        setShowAddModal(true);
                        setAddForm({
                            ...emptyQuestion,
                            externalId: `Q${questions.length + 1}`,
                            order: questions.length + 1,
                        });
                        setOptionsText('');
                        setError(null);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium flex items-center gap-2 hover:from-cyan-400 hover:to-blue-400 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Add Question
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search questions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    />
                </div>

                {/* Role Filter */}
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                >
                    <option value="all">All Roles</option>
                    <option value="nurse">Nurse</option>
                    <option value="doctor">Doctor</option>
                </select>

                {/* Section Filter */}
                <select
                    value={sectionFilter}
                    onChange={(e) => setSectionFilter(e.target.value)}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                >
                    <option value="all">All Sections</option>
                    {sections.map(section => (
                        <option key={section} value={section}>{section}</option>
                    ))}
                </select>
            </div>

            {/* Questions List */}
            <div className="space-y-3">
                {isReordering && (
                    <div className="flex items-center justify-center py-2 text-cyan-400 text-sm">
                        <div className="animate-spin w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full mr-2" />
                        Saving new order...
                    </div>
                )}
                {filteredQuestions.map((question, idx) => (
                    <motion.div
                        key={question.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        draggable
                        onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, question.id)}
                        onDragOver={(e) => handleDragOver(e as unknown as React.DragEvent, question.id)}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e as unknown as React.DragEvent, question.id)}
                        className={clsx(
                            "bg-slate-800 border rounded-xl overflow-hidden transition-all",
                            draggedId === question.id
                                ? "opacity-50 border-cyan-500 scale-[0.98]"
                                : dragOverId === question.id
                                    ? "border-cyan-400 ring-2 ring-cyan-400/30"
                                    : "border-slate-700"
                        )}
                    >
                        {/* Question Header */}
                        <div
                            className="p-4 flex items-start justify-between cursor-pointer hover:bg-slate-700/30 transition-colors"
                            onClick={() => setExpandedId(expandedId === question.id ? null : question.id)}
                        >
                            {/* Drag Handle */}
                            <div
                                className="flex items-center mr-3 cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 transition-colors"
                                title="Drag to reorder"
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                <GripVertical className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={clsx(
                                        "px-2 py-0.5 rounded text-xs font-medium",
                                        question.role === 'nurse'
                                            ? "bg-rose-500/20 text-rose-400"
                                            : "bg-blue-500/20 text-blue-400"
                                    )}>
                                        {question.role || 'unknown'}
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300">
                                        {question.type || 'choice'}
                                    </span>
                                    <span className="text-slate-500 text-xs">{question.section || ''}</span>
                                </div>
                                <p className="text-white font-medium truncate">{question.text}</p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewQuestion(question);
                                    }}
                                    className="p-2 text-slate-400 hover:text-emerald-400 transition-colors"
                                    title="Preview question"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit(question);
                                    }}
                                    className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
                                    title="Edit question"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(question.id);
                                    }}
                                    className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                                    title="Delete question"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                {expandedId === question.id ? (
                                    <ChevronUp className="w-5 h-5 text-slate-400" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                )}
                            </div>
                        </div>

                        {/* Expanded Details */}
                        {expandedId === question.id && (
                            <div className="px-4 pb-4 border-t border-slate-700 pt-4 space-y-3">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-400">External ID:</span>
                                        <span className="text-white ml-2">{question.externalId}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Required:</span>
                                        <span className="text-white ml-2">{question.required ? 'Yes' : 'No'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Section Order:</span>
                                        <span className="text-white ml-2">{question.sectionOrder}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Order:</span>
                                        <span className="text-white ml-2">{question.order}</span>
                                    </div>
                                </div>
                                {question.subText && (
                                    <div>
                                        <span className="text-slate-400 text-sm">Sub-text:</span>
                                        <p className="text-slate-300 text-sm mt-1">{question.subText}</p>
                                    </div>
                                )}
                                {question.options && question.options.length > 0 && (
                                    <div>
                                        <span className="text-slate-400 text-sm">Options:</span>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {question.options.map((opt, i) => (
                                                <span key={i} className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
                                                    {opt}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                ))}

                {filteredQuestions.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        <p>No questions found</p>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Edit Question</h2>
                            <button
                                onClick={() => {
                                    setEditingId(null);
                                    setEditForm({});
                                    setOptionsText('');
                                    setError(null);
                                }}
                                className="text-slate-400 hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Question Text *</label>
                                <textarea
                                    value={editForm.text || ''}
                                    onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none resize-none"
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Sub-text</label>
                                <input
                                    type="text"
                                    value={editForm.subText || ''}
                                    onChange={(e) => setEditForm({ ...editForm, subText: e.target.value })}
                                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Type</label>
                                    <select
                                        value={editForm.type || 'choice'}
                                        onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                                        className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                                    >
                                        {QUESTION_TYPES.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Role</label>
                                    <select
                                        value={editForm.role || 'nurse'}
                                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                        className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                                    >
                                        <option value="nurse">Nurse</option>
                                        <option value="doctor">Doctor</option>
                                        <option value="both">Both</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Options (one per line)</label>
                                <textarea
                                    value={optionsText}
                                    onChange={(e) => setOptionsText(e.target.value)}
                                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none resize-none font-mono text-sm"
                                    rows={4}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="required"
                                    checked={editForm.required || false}
                                    onChange={(e) => setEditForm({ ...editForm, required: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="required" className="text-sm text-slate-300">Required</label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        setEditingId(null);
                                        setEditForm({});
                                        setOptionsText('');
                                        setError(null);
                                    }}
                                    className="flex-1 py-3 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Add New Question</h2>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setAddForm(emptyQuestion);
                                    setOptionsText('');
                                    setError(null);
                                }}
                                className="text-slate-400 hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">External ID *</label>
                                    <input
                                        type="text"
                                        value={addForm.externalId}
                                        onChange={(e) => setAddForm({ ...addForm, externalId: e.target.value })}
                                        placeholder="e.g., N1, D5"
                                        className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Section *</label>
                                    <input
                                        type="text"
                                        value={addForm.section}
                                        onChange={(e) => setAddForm({ ...addForm, section: e.target.value })}
                                        placeholder="e.g., Demographics"
                                        className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Question Text *</label>
                                <textarea
                                    value={addForm.text}
                                    onChange={(e) => setAddForm({ ...addForm, text: e.target.value })}
                                    placeholder="Enter the question..."
                                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none resize-none"
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Sub-text (optional)</label>
                                <input
                                    type="text"
                                    value={addForm.subText}
                                    onChange={(e) => setAddForm({ ...addForm, subText: e.target.value })}
                                    placeholder="Additional context..."
                                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Type</label>
                                    <select
                                        value={addForm.type}
                                        onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}
                                        className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                                    >
                                        {QUESTION_TYPES.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Role</label>
                                    <select
                                        value={addForm.role}
                                        onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                                        className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                                    >
                                        <option value="nurse">Nurse</option>
                                        <option value="doctor">Doctor</option>
                                        <option value="both">Both</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Section Order</label>
                                    <input
                                        type="number"
                                        value={addForm.sectionOrder}
                                        onChange={(e) => setAddForm({ ...addForm, sectionOrder: parseInt(e.target.value) || 1 })}
                                        className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Order</label>
                                    <input
                                        type="number"
                                        value={addForm.order}
                                        onChange={(e) => setAddForm({ ...addForm, order: parseInt(e.target.value) || 1 })}
                                        className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Options (one per line, for choice types)</label>
                                <textarea
                                    value={optionsText}
                                    onChange={(e) => setOptionsText(e.target.value)}
                                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none resize-none font-mono text-sm"
                                    rows={4}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="addRequired"
                                    checked={addForm.required}
                                    onChange={(e) => setAddForm({ ...addForm, required: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="addRequired" className="text-sm text-slate-300">Required</label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setAddForm(emptyQuestion);
                                        setOptionsText('');
                                        setError(null);
                                    }}
                                    className="flex-1 py-3 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAdd}
                                    disabled={isSaving}
                                    className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Plus className="w-4 h-4" />
                                    )}
                                    Add Question
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Question Preview Modal */}
            {previewQuestion && (
                <QuestionPreview
                    question={previewQuestion}
                    isOpen={!!previewQuestion}
                    onClose={() => setPreviewQuestion(null)}
                />
            )}
        </div>
    );
}
