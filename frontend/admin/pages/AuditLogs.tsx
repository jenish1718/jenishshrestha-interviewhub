import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Download, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { getAuditLogs, getActivityLogs, exportLogs } from "../services/auditLogService";

export default function AuditLogs() {
    const [tab, setTab] = useState<"audit" | "activity">("audit");
    const [logs, setLogs] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [actionFilter, setActionFilter] = useState("");
    const pageSize = 15;

    const fetchLogs = async () => {
        try {
            const res = tab === "audit"
                ? await getAuditLogs(page, pageSize, undefined, actionFilter || undefined)
                : await getActivityLogs(page, pageSize);
            setLogs(res.data || []);
            setTotalCount(res.totalCount || 0);
        } catch { setLogs([]); }
    };

    useEffect(() => { fetchLogs(); }, [page, tab, actionFilter]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
                <button onClick={() => exportLogs()} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 text-sm hover:bg-white/10">
                    <Download size={16} /> Export CSV
                </button>
            </div>

            <div className="flex gap-3 flex-wrap">
                <button onClick={() => { setTab("audit"); setPage(1); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === "audit" ? "bg-blue-600 text-white" : "bg-white/5 text-gray-300 hover:bg-white/10"}`}>Admin Logs</button>
                <button onClick={() => { setTab("activity"); setPage(1); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === "activity" ? "bg-blue-600 text-white" : "bg-white/5 text-gray-300 hover:bg-white/10"}`}>User Activity</button>
                {tab === "audit" && (
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input type="text" placeholder="Filter by action..." value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                    </div>
                )}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/10 text-gray-400">
                            {tab === "audit" ? (
                                <>
                                    <th className="text-left p-4">Admin</th>
                                    <th className="text-left p-4">Action</th>
                                    <th className="text-left p-4">Details</th>
                                    <th className="text-left p-4">Target</th>
                                    <th className="text-left p-4">IP</th>
                                    <th className="text-left p-4">Date</th>
                                </>
                            ) : (
                                <>
                                    <th className="text-left p-4">User</th>
                                    <th className="text-left p-4">Action</th>
                                    <th className="text-left p-4">Details</th>
                                    <th className="text-left p-4">Date</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log: any, i: number) => (
                            <motion.tr key={log.logId || log.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-white/5 hover:bg-white/5 transition">
                                {tab === "audit" ? (
                                    <>
                                        <td className="p-4 text-white">{log.adminName}</td>
                                        <td className="p-4"><span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">{log.action}</span></td>
                                        <td className="p-4 text-gray-400 max-w-xs truncate">{log.details || "—"}</td>
                                        <td className="p-4 text-gray-400 text-xs">{log.targetEntityType ? `${log.targetEntityType} #${log.targetEntityId}` : "—"}</td>
                                        <td className="p-4 text-gray-500 text-xs">{log.ipAddress || "—"}</td>
                                        <td className="p-4 text-gray-400 text-xs">{new Date(log.performedAt).toLocaleString()}</td>
                                    </>
                                ) : (
                                    <>
                                        <td className="p-4 text-white">{log.userName}</td>
                                        <td className="p-4"><span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">{log.action}</span></td>
                                        <td className="p-4 text-gray-400 max-w-xs truncate">{log.details || "—"}</td>
                                        <td className="p-4 text-gray-400 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                                    </>
                                )}
                            </motion.tr>
                        ))}
                        {logs.length === 0 && (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500"><FileText className="mx-auto mb-2" size={24} />No logs found</td></tr>
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
        </div>
    );
}
