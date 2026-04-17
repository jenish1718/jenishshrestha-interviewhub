import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, CheckCircle, XCircle, ChevronLeft, ChevronRight, Clock, MessageSquare } from "lucide-react";
import { getModerationQueue, approveContent, rejectContent, getModerationHistory } from "../services/moderationService";

export default function ContentModeration() {
    const [items, setItems] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [tab, setTab] = useState<"queue" | "history">("queue");
    const [actionItem, setActionItem] = useState<any>(null);
    const [actionType, setActionType] = useState<"approve" | "reject">("approve");
    const [notes, setNotes] = useState("");
    const pageSize = 10;

    const fetchData = async () => {
        try {
            const res = tab === "queue"
                ? await getModerationQueue(page, pageSize)
                : await getModerationHistory(page, pageSize);
            setItems(res.data || []);
            setTotalCount(res.totalCount || 0);
        } catch { setItems([]); }
    };

    useEffect(() => { fetchData(); }, [page, tab]);

    const handleAction = async () => {
        if (!actionItem) return;
        if (actionType === "approve") await approveContent(actionItem.id, notes);
        else await rejectContent(actionItem.id, notes);
        setActionItem(null);
        setNotes("");
        fetchData();
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Content Moderation</h1>
            </div>

            <div className="flex gap-2">
                <button onClick={() => { setTab("queue"); setPage(1); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === "queue" ? "bg-blue-600 text-white" : "bg-white/5 text-gray-300 hover:bg-white/10"}`}>
                    <Clock size={14} className="inline mr-1" /> Pending Queue
                </button>
                <button onClick={() => { setTab("history"); setPage(1); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === "history" ? "bg-blue-600 text-white" : "bg-white/5 text-gray-300 hover:bg-white/10"}`}>
                    <MessageSquare size={14} className="inline mr-1" /> History
                </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/10 text-gray-400">
                            <th className="text-left p-4">Type</th>
                            <th className="text-left p-4">Reason</th>
                            <th className="text-left p-4">Reporter</th>
                            <th className="text-left p-4">Status</th>
                            <th className="text-left p-4">Date</th>
                            <th className="text-right p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item: any) => (
                            <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-white/5 hover:bg-white/5 transition">
                                <td className="p-4"><span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">{item.contentType}</span></td>
                                <td className="p-4 text-gray-300 max-w-xs truncate">{item.reason}</td>
                                <td className="p-4 text-gray-400">{item.reporterName || "System"}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs ${item.status === "Pending" ? "bg-yellow-500/20 text-yellow-300" : item.status === "Approved" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>{item.status}</span>
                                </td>
                                <td className="p-4 text-gray-400 text-xs">{new Date(item.createdAt).toLocaleDateString()}</td>
                                <td className="p-4 text-right space-x-2">
                                    {item.status === "Pending" && (
                                        <>
                                            <button onClick={() => { setActionItem(item); setActionType("approve"); }} className="text-green-400 hover:text-green-300"><CheckCircle size={16} /></button>
                                            <button onClick={() => { setActionItem(item); setActionType("reject"); }} className="text-red-400 hover:text-red-300"><XCircle size={16} /></button>
                                        </>
                                    )}
                                    {item.status !== "Pending" && item.moderatorNotes && (
                                        <span className="text-gray-500 text-xs" title={item.moderatorNotes}>Notes ✏️</span>
                                    )}
                                </td>
                            </motion.tr>
                        ))}
                        {items.length === 0 && (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500"><Shield className="mx-auto mb-2" size={24} />{tab === "queue" ? "No pending items" : "No moderation history"}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 bg-white/5 border border-white/10 rounded-lg text-white disabled:opacity-30"><ChevronLeft size={16} /></button>
                    <span className="px-4 py-2 text-gray-400 text-sm">Page {page} of {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 bg-white/5 border border-white/10 rounded-lg text-white disabled:opacity-30"><ChevronRight size={16} /></button>
                </div>
            )}

            {/* Action Modal */}
            {actionItem && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-white mb-2">
                            {actionType === "approve" ? "Approve Content" : "Reject Content"}
                        </h2>
                        <p className="text-gray-400 text-sm mb-4">
                            {actionType === "approve" ? "This content will be marked as approved." : "This content will be flagged as rejected."}
                        </p>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)..." rows={3} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 mb-4" />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => { setActionItem(null); setNotes(""); }} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 text-sm hover:bg-white/10">Cancel</button>
                            <button onClick={handleAction} className={`px-4 py-2 ${actionType === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} text-white rounded-lg text-sm font-medium`}>
                                {actionType === "approve" ? "Approve" : "Reject"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
