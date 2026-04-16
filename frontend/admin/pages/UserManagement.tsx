// UserManagement.tsx - Admin User Management Page
// Full CRUD for users with search, filter, pagination, status toggle,
// user details modal, delete confirmation, and stats cards.

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, Filter, ChevronLeft, ChevronRight, Users, UserCheck, UserX,
    TrendingUp, Shield, Eye, Ban, Trash2, CheckCircle, XCircle, Loader2, X, Mail,
    Calendar, Activity, BarChart3,
} from "lucide-react";
import {
    getUsers, getUserById, updateUserStatus, deleteUser, getUserStats,
} from "../services/userManagementService";

const UserManagement: React.FC = () => {
    // State management for users, pagination, search, filters
    const [users, setUsers] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    // Modal state
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Fetch users with current filters
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getUsers(page, pageSize, search, roleFilter, statusFilter);
            setUsers(res.data || []);
            setTotalCount(res.totalCount || 0);
            setTotalPages(res.totalPages || 1);
        } catch (err) {
            console.error("Failed to fetch users:", err);
        }
        setLoading(false);
    }, [page, pageSize, search, roleFilter, statusFilter]);

    // Fetch stats
    const fetchStats = useCallback(async () => {
        try {
            const res = await getUserStats();
            if (res.success) setStats(res.stats);
        } catch (err) {
            console.error("Failed to fetch stats:", err);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);
    useEffect(() => { fetchStats(); }, [fetchStats]);

    // Search with debounce
    const handleSearch = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    // View user details
    const handleViewDetails = async (userId: number) => {
        setActionLoading(true);
        try {
            const res = await getUserById(userId);
            if (res.success) {
                setSelectedUser(res.user);
                setDetailsOpen(true);
            }
        } catch (err) {
            console.error("Failed to fetch user details:", err);
        }
        setActionLoading(false);
    };

    // Toggle user status
    const handleToggleStatus = async (userId: number, currentActive: boolean) => {
        setActionLoading(true);
        try {
            await updateUserStatus(userId, { isActive: !currentActive });
            fetchUsers();
            fetchStats();
        } catch (err) {
            console.error("Failed to update status:", err);
        }
        setActionLoading(false);
    };

    // Toggle suspend
    const handleToggleSuspend = async (userId: number, currentSuspended: boolean) => {
        setActionLoading(true);
        try {
            await updateUserStatus(userId, { isSuspended: !currentSuspended });
            fetchUsers();
            fetchStats();
        } catch (err) {
            console.error("Failed to update suspension:", err);
        }
        setActionLoading(false);
    };

    // Delete user
    const handleDelete = async () => {
        if (!userToDelete) return;
        setActionLoading(true);
        try {
            await deleteUser(userToDelete.userId);
            setDeleteOpen(false);
            setUserToDelete(null);
            fetchUsers();
            fetchStats();
        } catch (err) {
            console.error("Failed to delete user:", err);
        }
        setActionLoading(false);
    };

    // Stats Cards Data
    const statCards = [
        { label: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
        { label: "Active", value: stats?.activeUsers ?? 0, icon: UserCheck, color: "text-green-400", bg: "bg-green-500/10" },
        { label: "Suspended", value: stats?.suspendedUsers ?? 0, icon: UserX, color: "text-red-400", bg: "bg-red-500/10" },
        { label: "New This Week", value: stats?.newUsersThisWeek ?? 0, icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-500/10" },
    ];

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">User Management</h1>
                <p className="text-zinc-500 text-sm mt-1">Manage platform users, accounts, and permissions</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {statCards.map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-zinc-900/50 border border-white/5 rounded-xl p-4"
                    >
                        <div className={`w-8 h-8 ${card.bg} rounded-lg flex items-center justify-center mb-2`}>
                            <card.icon className={`w-4 h-4 ${card.color}`} />
                        </div>
                        <p className="text-2xl font-bold text-white">{card.value}</p>
                        <p className="text-zinc-500 text-xs">{card.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-zinc-900/50 border border-white/10 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2.5 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                >
                    <option value="">All Roles</option>
                    <option value="Candidate">Candidate</option>
                    <option value="Admin">Admin</option>
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2.5 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                </select>
            </div>

            {/* Users Table */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">User</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Role</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Status</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Interviews</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Joined</th>
                                <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12">
                                        <Loader2 className="w-6 h-6 text-red-500 animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-zinc-500">No users found</td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.userId} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-medium text-zinc-300">
                                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-white text-sm font-medium">{user.firstName} {user.lastName}</p>
                                                    <p className="text-zinc-500 text-xs">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${user.role === "Admin" ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"
                                                }`}>
                                                {user.role === "Admin" && <Shield className="w-3 h-3" />}
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {user.isSuspended ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-orange-500/10 text-orange-400">
                                                    <Ban className="w-3 h-3" /> Suspended
                                                </span>
                                            ) : user.isActive ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400">
                                                    <CheckCircle className="w-3 h-3" /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-zinc-500/10 text-zinc-400">
                                                    <XCircle className="w-3 h-3" /> Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-zinc-400 text-sm">{user.totalInterviews}</td>
                                        <td className="px-4 py-3 text-zinc-500 text-sm">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleViewDetails(user.userId)}
                                                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(user.userId, user.isActive)}
                                                    className={`p-1.5 rounded-lg transition-colors ${user.isActive
                                                            ? "text-green-400 hover:text-red-400 hover:bg-red-500/10"
                                                            : "text-zinc-400 hover:text-green-400 hover:bg-green-500/10"
                                                        }`}
                                                    title={user.isActive ? "Disable User" : "Enable User"}
                                                >
                                                    {user.isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleToggleSuspend(user.userId, user.isSuspended)}
                                                    className={`p-1.5 rounded-lg transition-colors ${user.isSuspended
                                                            ? "text-orange-400 hover:text-green-400 hover:bg-green-500/10"
                                                            : "text-zinc-400 hover:text-orange-400 hover:bg-orange-500/10"
                                                        }`}
                                                    title={user.isSuspended ? "Unsuspend User" : "Suspend User"}
                                                >
                                                    <Ban className="w-4 h-4" />
                                                </button>
                                                {user.role !== "Admin" && (
                                                    <button
                                                        onClick={() => { setUserToDelete(user); setDeleteOpen(true); }}
                                                        className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                    <p className="text-zinc-500 text-sm">
                        Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount}
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-white/5"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-zinc-400 text-sm px-2">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-white/5"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* User Details Modal */}
            <AnimatePresence>
                {detailsOpen && selectedUser && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
                        onClick={() => setDetailsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-zinc-900 border border-white/10 rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-5 border-b border-white/5">
                                <h3 className="text-white font-semibold">User Details</h3>
                                <button onClick={() => setDetailsOpen(false)} className="text-zinc-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center text-lg font-bold text-zinc-300">
                                        {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold text-lg">{selectedUser.firstName} {selectedUser.lastName}</p>
                                        <p className="text-zinc-500 text-sm flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedUser.email}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-zinc-800/50 rounded-lg p-3">
                                        <p className="text-zinc-500 text-xs mb-1">Role</p>
                                        <p className="text-white text-sm font-medium">{selectedUser.role}</p>
                                    </div>
                                    <div className="bg-zinc-800/50 rounded-lg p-3">
                                        <p className="text-zinc-500 text-xs mb-1">Status</p>
                                        <p className={`text-sm font-medium ${selectedUser.isSuspended ? "text-orange-400" : selectedUser.isActive ? "text-green-400" : "text-red-400"}`}>
                                            {selectedUser.isSuspended ? "Suspended" : selectedUser.isActive ? "Active" : "Inactive"}
                                        </p>
                                    </div>
                                    <div className="bg-zinc-800/50 rounded-lg p-3">
                                        <p className="text-zinc-500 text-xs mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Joined</p>
                                        <p className="text-white text-sm">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="bg-zinc-800/50 rounded-lg p-3">
                                        <p className="text-zinc-500 text-xs mb-1 flex items-center gap-1"><Activity className="w-3 h-3" /> Last Login</p>
                                        <p className="text-white text-sm">{selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString() : "Never"}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                                        <p className="text-xl font-bold text-white">{selectedUser.totalInterviews}</p>
                                        <p className="text-zinc-500 text-xs">Interviews</p>
                                    </div>
                                    <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                                        <p className="text-xl font-bold text-white">{selectedUser.totalJobEmails}</p>
                                        <p className="text-zinc-500 text-xs">Job Emails</p>
                                    </div>
                                    <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                                        <p className="text-xl font-bold text-white">{selectedUser.averageScore?.toFixed(1) || "0"}</p>
                                        <p className="text-zinc-500 text-xs">Avg Score</p>
                                    </div>
                                </div>

                                {/* Recent Activities */}
                                {selectedUser.recentActivities?.length > 0 && (
                                    <div>
                                        <h4 className="text-white text-sm font-medium mb-2">Recent Activity</h4>
                                        <div className="space-y-2">
                                            {selectedUser.recentActivities.map((activity: any, i: number) => (
                                                <div key={i} className="flex items-center gap-3 text-sm py-1.5 border-b border-white/5 last:border-0">
                                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${activity.type === "Interview" ? "bg-blue-400" : "bg-amber-400"
                                                        }`} />
                                                    <span className="text-zinc-300 flex-1 truncate">{activity.description}</span>
                                                    <span className="text-zinc-600 text-xs flex-shrink-0">
                                                        {new Date(activity.date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteOpen && userToDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
                        onClick={() => setDeleteOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-zinc-900 border border-white/10 rounded-xl w-full max-w-sm"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 text-center">
                                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-6 h-6 text-red-400" />
                                </div>
                                <h3 className="text-white font-semibold text-lg mb-2">Delete User</h3>
                                <p className="text-zinc-400 text-sm mb-6">
                                    Are you sure you want to delete <span className="text-white font-medium">{userToDelete.firstName} {userToDelete.lastName}</span>? This action cannot be undone.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setDeleteOpen(false)}
                                        className="flex-1 px-4 py-2.5 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={actionLoading}
                                        className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserManagement;
