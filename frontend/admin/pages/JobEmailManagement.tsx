// JobEmailManagement.tsx - Admin Job Email Management Page
// Full CRUD for job emails with search, filter, pagination,
// details/edit modal, delete confirmation, and statistics panel.

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, ChevronLeft, ChevronRight, Mail, Eye, Trash2, Edit3,
    Loader2, X, Calendar, FileText, CheckCircle, Clock, AlertCircle,
    BarChart3, Briefcase, Building,
} from "lucide-react";
import {
    getJobEmails, getJobEmailById, updateJobEmail, deleteJobEmail, getJobEmailStats,
} from "../services/jobEmailManagementService";

const JobEmailManagement: React.FC = () => {
    const [emails, setEmails] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // Modal state
    const [selectedEmail, setSelectedEmail] = useState<any>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState({ jobTitle: "", companyName: "", emailContent: "", status: "" });
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [emailToDelete, setEmailToDelete] = useState<any>(null);
    const [statsOpen, setStatsOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchEmails = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getJobEmails(page, pageSize, search, undefined, dateFrom || undefined, dateTo || undefined);
            setEmails(res.data || []);
            setTotalCount(res.totalCount || 0);
            setTotalPages(res.totalPages || 1);
        } catch (err) {
            console.error("Failed to fetch emails:", err);
        }
        setLoading(false);
    }, [page, pageSize, search, dateFrom, dateTo]);

    const fetchStats = useCallback(async () => {
        try {
            const res = await getJobEmailStats();
            if (res.success) setStats(res.stats);
        } catch (err) {
            console.error("Failed to fetch stats:", err);
        }
    }, []);

    useEffect(() => { fetchEmails(); }, [fetchEmails]);
    useEffect(() => { fetchStats(); }, [fetchStats]);

    // View details
    const handleViewDetails = async (emailId: number) => {
        setActionLoading(true);
        try {
            const res = await getJobEmailById(emailId);
            if (res.success) {
                setSelectedEmail(res.email);
                setEditForm({
                    jobTitle: res.email.jobTitle || "",
                    companyName: res.email.companyName || "",
                    emailContent: res.email.emailContent || "",
                    status: res.email.status || "",
                });
                setDetailsOpen(true);
                setEditMode(false);
            }
        } catch (err) {
            console.error("Failed to fetch email details:", err);
        }
        setActionLoading(false);
    };

    // Save edit
    const handleSaveEdit = async () => {
        if (!selectedEmail) return;
        setActionLoading(true);
        try {
            const res = await updateJobEmail(selectedEmail.emailId, editForm);
            if (res.success) {
                setDetailsOpen(false);
                fetchEmails();
            }
        } catch (err) {
            console.error("Failed to update email:", err);
        }
        setActionLoading(false);
    };

    // Delete
    const handleDelete = async () => {
        if (!emailToDelete) return;
        setActionLoading(true);
        try {
            await deleteJobEmail(emailToDelete.emailId);
            setDeleteOpen(false);
            setEmailToDelete(null);
            fetchEmails();
            fetchStats();
        } catch (err) {
            console.error("Failed to delete email:", err);
        }
        setActionLoading(false);
    };

    const statusIcon = (status: string) => {
        switch (status) {
            case "Parsed": return <CheckCircle className="w-3 h-3" />;
            case "Pending": return <Clock className="w-3 h-3" />;
            case "Failed": return <AlertCircle className="w-3 h-3" />;
            default: return <FileText className="w-3 h-3" />;
        }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case "Parsed": return "bg-green-500/10 text-green-400";
            case "Pending": return "bg-amber-500/10 text-amber-400";
            case "Failed": return "bg-red-500/10 text-red-400";
            default: return "bg-zinc-500/10 text-zinc-400";
        }
    };

    // Stats cards
    const statCards = [
        { label: "Total Emails", value: stats?.totalEmails ?? 0, icon: Mail, color: "text-blue-400", bg: "bg-blue-500/10" },
        { label: "Parsed", value: stats?.parsedEmails ?? 0, icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
        { label: "Pending", value: stats?.pendingEmails ?? 0, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
        { label: "Failed", value: stats?.failedEmails ?? 0, icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10" },
    ];

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Job Email Management</h1>
                    <p className="text-zinc-500 text-sm mt-1">View and manage all uploaded job descriptions</p>
                </div>
                <button
                    onClick={() => setStatsOpen(!statsOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white hover:border-white/20 transition-all"
                >
                    <BarChart3 className="w-4 h-4" />
                    {statsOpen ? "Hide Stats" : "View Stats"}
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
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

            {/* Stats Panel (expandable) */}
            <AnimatePresence>
                {statsOpen && stats && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-4"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Top Skills */}
                            {stats.topSkills?.length > 0 && (
                                <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4">
                                    <h3 className="text-white font-semibold text-sm mb-3">Top Skills</h3>
                                    <div className="space-y-2">
                                        {stats.topSkills.slice(0, 7).map((s: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between text-sm">
                                                <span className="text-zinc-300 truncate flex-1">{s.skillName}</span>
                                                <span className="text-zinc-500 ml-2 bg-zinc-800 px-2 py-0.5 rounded text-xs">{s.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Top Companies */}
                            {stats.topCompanies?.length > 0 && (
                                <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4">
                                    <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                                        <Building className="w-4 h-4 text-zinc-500" /> Top Companies
                                    </h3>
                                    <div className="space-y-2">
                                        {stats.topCompanies.slice(0, 7).map((c: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between text-sm">
                                                <span className="text-zinc-300 truncate flex-1">{c.companyName}</span>
                                                <span className="text-zinc-500 ml-2 bg-zinc-800 px-2 py-0.5 rounded text-xs">{c.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Top Job Titles */}
                            {stats.topJobTitles?.length > 0 && (
                                <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4">
                                    <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 text-zinc-500" /> Top Job Titles
                                    </h3>
                                    <div className="space-y-2">
                                        {stats.topJobTitles.slice(0, 7).map((j: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between text-sm">
                                                <span className="text-zinc-300 truncate flex-1">{j.jobTitle}</span>
                                                <span className="text-zinc-500 ml-2 bg-zinc-800 px-2 py-0.5 rounded text-xs">{j.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search by job title, company, or user..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-9 pr-3 py-2.5 bg-zinc-900/50 border border-white/10 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                </div>
                <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                    className="px-3 py-2.5 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                    placeholder="From"
                />
                <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                    className="px-3 py-2.5 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                    placeholder="To"
                />
            </div>

            {/* Emails Table */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Job Info</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">User</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Status</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Skills</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Uploaded</th>
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
                            ) : emails.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-zinc-500">No job emails found</td>
                                </tr>
                            ) : (
                                emails.map((email) => (
                                    <tr key={email.emailId} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="text-white text-sm font-medium">{email.jobTitle || "Untitled"}</p>
                                                <p className="text-zinc-500 text-xs">{email.companyName || "Unknown Company"}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="text-zinc-300 text-sm">{email.userName}</p>
                                                <p className="text-zinc-600 text-xs">{email.userEmail}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusColor(email.status)}`}>
                                                {statusIcon(email.status)}
                                                {email.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-zinc-400 text-sm">{email.skillCount}</td>
                                        <td className="px-4 py-3 text-zinc-500 text-sm">
                                            {new Date(email.uploadDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleViewDetails(email.emailId)}
                                                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => { setEmailToDelete(email); setDeleteOpen(true); }}
                                                    className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
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
                        <span className="text-zinc-400 text-sm px-2">Page {page} of {totalPages}</span>
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

            {/* Details / Edit Modal */}
            <AnimatePresence>
                {detailsOpen && selectedEmail && (
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
                            className="bg-zinc-900 border border-white/10 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-5 border-b border-white/5 sticky top-0 bg-zinc-900 z-10">
                                <h3 className="text-white font-semibold">{editMode ? "Edit Job Email" : "Job Email Details"}</h3>
                                <div className="flex items-center gap-2">
                                    {!editMode && (
                                        <button
                                            onClick={() => setEditMode(true)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 text-sm"
                                        >
                                            <Edit3 className="w-3 h-3" /> Edit
                                        </button>
                                    )}
                                    <button onClick={() => setDetailsOpen(false)} className="text-zinc-400 hover:text-white">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-5 space-y-4">
                                {/* User Info */}
                                <div className="flex items-center gap-3 bg-zinc-800/50 rounded-lg p-3">
                                    <div className="w-9 h-9 bg-zinc-700 rounded-full flex items-center justify-center text-xs font-medium text-zinc-300">
                                        {selectedEmail.userName?.split(" ").map((n: string) => n[0]).join("")}
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-medium">{selectedEmail.userName}</p>
                                        <p className="text-zinc-500 text-xs">{selectedEmail.userEmail}</p>
                                    </div>
                                </div>

                                {/* Fields */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-zinc-500 text-xs mb-1 block">Job Title</label>
                                        {editMode ? (
                                            <input
                                                value={editForm.jobTitle}
                                                onChange={(e) => setEditForm({ ...editForm, jobTitle: e.target.value })}
                                                className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white text-sm"
                                            />
                                        ) : (
                                            <p className="text-white text-sm">{selectedEmail.jobTitle || "—"}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-zinc-500 text-xs mb-1 block">Company</label>
                                        {editMode ? (
                                            <input
                                                value={editForm.companyName}
                                                onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                                                className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white text-sm"
                                            />
                                        ) : (
                                            <p className="text-white text-sm">{selectedEmail.companyName || "—"}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="text-zinc-500 text-xs mb-1 block">Status</label>
                                    {editMode ? (
                                        <select
                                            value={editForm.status}
                                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                            className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white text-sm"
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Parsed">Parsed</option>
                                            <option value="Failed">Failed</option>
                                        </select>
                                    ) : (
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusColor(selectedEmail.status)}`}>
                                            {statusIcon(selectedEmail.status)} {selectedEmail.status}
                                        </span>
                                    )}
                                </div>

                                {/* Content */}
                                <div>
                                    <label className="text-zinc-500 text-xs mb-1 block">Email Content</label>
                                    {editMode ? (
                                        <textarea
                                            value={editForm.emailContent}
                                            onChange={(e) => setEditForm({ ...editForm, emailContent: e.target.value })}
                                            rows={6}
                                            className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white text-sm resize-none"
                                        />
                                    ) : (
                                        <div className="bg-zinc-800/50 rounded-lg p-3 text-zinc-300 text-sm max-h-40 overflow-y-auto whitespace-pre-wrap">
                                            {selectedEmail.emailContent?.slice(0, 500)}
                                            {selectedEmail.emailContent?.length > 500 && "..."}
                                        </div>
                                    )}
                                </div>

                                {/* Parsed Skills */}
                                {!editMode && selectedEmail.parsedSkills?.length > 0 && (
                                    <div>
                                        <label className="text-zinc-500 text-xs mb-2 block">Extracted Skills</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedEmail.parsedSkills.map((skill: string, i: number) => (
                                                <span key={i} className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded text-xs">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Meta Info */}
                                {!editMode && (
                                    <div className="grid grid-cols-3 gap-3 text-sm">
                                        <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                                            <p className="text-lg font-bold text-white">{selectedEmail.skillCount}</p>
                                            <p className="text-zinc-500 text-xs">Skills</p>
                                        </div>
                                        <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                                            <p className="text-lg font-bold text-white">{selectedEmail.questionCount}</p>
                                            <p className="text-zinc-500 text-xs">Questions</p>
                                        </div>
                                        <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                                            <p className="text-lg font-bold text-white">{selectedEmail.sessionCount}</p>
                                            <p className="text-zinc-500 text-xs">Sessions</p>
                                        </div>
                                    </div>
                                )}

                                {/* Edit Actions */}
                                {editMode && (
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={() => setEditMode(false)}
                                            className="flex-1 px-4 py-2.5 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors text-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveEdit}
                                            disabled={actionLoading}
                                            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                            Save Changes
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteOpen && emailToDelete && (
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
                                <h3 className="text-white font-semibold text-lg mb-2">Delete Job Email</h3>
                                <p className="text-zinc-400 text-sm mb-6">
                                    Are you sure you want to delete "<span className="text-white font-medium">{emailToDelete.jobTitle || "Untitled"}</span>"? Related skills and questions will be unlinked.
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

export default JobEmailManagement;
