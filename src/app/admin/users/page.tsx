'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    Plus,
    Shield,
    Edit,
    Trash2,
    CheckCircle,
    XCircle
} from 'lucide-react';
import { clsx } from 'clsx';

interface AdminUser {
    id: string;
    username: string;
    email: string | null;
    role: string;
    isActive: boolean;
    createdAt: string;
    lastLoginAt: string | null;
}

export default function UsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [newUser, setNewUser] = useState({
        username: '',
        password: '',
        email: '',
        role: 'viewer'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const createUser = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newUser)
            });

            if (res.ok) {
                setShowCreateModal(false);
                setNewUser({ username: '', password: '', email: '', role: 'viewer' });
                fetchUsers();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to create user');
            }
        } catch (error) {
            console.error('Error creating user:', error);
        }
    };

    const updateUser = async () => {
        if (!editingUser) return;

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    id: editingUser.id,
                    role: editingUser.role,
                    isActive: editingUser.isActive
                })
            });

            if (res.ok) {
                setEditingUser(null);
                fetchUsers();
            }
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };

    const deleteUser = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/users?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchUsers();
            }
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-red-500/20 text-red-400';
            case 'editor': return 'bg-amber-500/20 text-amber-400';
            default: return 'bg-slate-700 text-slate-400';
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Admin Users</h1>
                    <p className="text-slate-400 mt-1">Manage admin accounts and permissions</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 hover:from-cyan-600 hover:to-blue-600 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Add User
                </button>
            </div>

            {/* Users Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden"
            >
                <table className="w-full">
                    <thead className="bg-slate-800">
                        <tr>
                            <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">User</th>
                            <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Role</th>
                            <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Status</th>
                            <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Last Login</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                                <td className="py-4 px-6">
                                    <div>
                                        <p className="font-medium text-white">{user.username}</p>
                                        {user.email && (
                                            <p className="text-sm text-slate-500">{user.email}</p>
                                        )}
                                    </div>
                                </td>
                                <td className="py-4 px-6">
                                    <span className={clsx(
                                        "px-2 py-1 rounded text-xs font-medium capitalize",
                                        getRoleBadgeColor(user.role)
                                    )}>
                                        <Shield className="w-3 h-3 inline mr-1" />
                                        {user.role}
                                    </span>
                                </td>
                                <td className="py-4 px-6">
                                    {user.isActive ? (
                                        <span className="text-emerald-400 flex items-center gap-1">
                                            <CheckCircle className="w-4 h-4" />
                                            Active
                                        </span>
                                    ) : (
                                        <span className="text-red-400 flex items-center gap-1">
                                            <XCircle className="w-4 h-4" />
                                            Inactive
                                        </span>
                                    )}
                                </td>
                                <td className="py-4 px-6 text-slate-400 text-sm">
                                    {user.lastLoginAt
                                        ? new Date(user.lastLoginAt).toLocaleDateString()
                                        : 'Never'}
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => setEditingUser(user)}
                                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteUser(user.id)}
                                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </motion.div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700"
                    >
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-cyan-400" />
                            Add Admin User
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Username *</label>
                                <input
                                    type="text"
                                    value={newUser.username}
                                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Password *</label>
                                <input
                                    type="password"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    placeholder="Min 8 characters"
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Role</label>
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                                >
                                    <option value="viewer">Viewer (Read-only)</option>
                                    <option value="editor">Editor (Can modify questions)</option>
                                    <option value="admin">Admin (Full access)</option>
                                </select>
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
                                onClick={createUser}
                                disabled={!newUser.username || !newUser.password}
                                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold disabled:opacity-50 hover:from-cyan-600 hover:to-blue-600 transition-all"
                            >
                                Create
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700"
                    >
                        <h2 className="text-xl font-bold text-white mb-4">Edit User</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Username</label>
                                <input
                                    type="text"
                                    value={editingUser.username}
                                    disabled
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Role</label>
                                <select
                                    value={editingUser.role}
                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                                >
                                    <option value="viewer">Viewer</option>
                                    <option value="editor">Editor</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <div
                                    onClick={() => setEditingUser({ ...editingUser, isActive: !editingUser.isActive })}
                                    className={clsx(
                                        "w-6 h-6 rounded border flex items-center justify-center transition-all",
                                        editingUser.isActive
                                            ? "border-emerald-500 bg-emerald-500"
                                            : "border-slate-600"
                                    )}
                                >
                                    {editingUser.isActive && <CheckCircle className="w-4 h-4 text-white" />}
                                </div>
                                <span className="text-slate-300">Active</span>
                            </label>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="flex-1 py-3 bg-slate-700 text-slate-300 rounded-xl font-medium hover:bg-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={updateUser}
                                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold hover:from-cyan-600 hover:to-blue-600 transition-all"
                            >
                                Save
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
