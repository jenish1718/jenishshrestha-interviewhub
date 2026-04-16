import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Eye, ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle, Activity } from "lucide-react";
import { getSessions, getSessionDetail, getSessionStats } from "../services/sessionService";

export default function SessionMonitoring() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const [stats, setStats] = useState<any>(null);
    const [detail, setDetail] = useState<any>(null);
    const pageSize = 10;

    const fetchSessions = async () => {
        try {
            const res = await getSessions(page, pageSize, undefined, undefined, undefined, statusFilter || undefined);
            setSessions(res.data || []);
            setTotalCount(res.totalCount || 0);
        } catch { setSessions([]); }
    };

    const fetchStats = async () => {
        try { setStats(await getSessionStats()); } catch { }
    };

    useEffect(() => { fetchSessions(); fetchStats(); }, [page, statusFilter]);

    const viewDetail = async (id: number) => {
        try { setDetail(await getSessionDetail(id)); } catch { }
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    const statCards = stats ? [
        { label: "Total Sessions", value: stats.totalSessions, icon: Activity, color: "blue" },
        { label: "Completed", value: stats.completedSessions, icon: CheckCircle, color: "green" },
        { label: "In Progress", value: stats.inProgressSessions, icon: Clock, color: "yellow" },
        { label: "Abandoned", value: stats.abandonedSessions, icon: XCircle, color: "red" },
    ] : [];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">Session Monitoring</h1>

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {statCards.map((c) => (
                        <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`bg-${c.color}-500/10 border border-${c.color}-500/20 rounded-xl p-4`}>
                            <div className="flex items-center gap-3">
                                <c.icon className={`text-${c.color}-400`} size={20} />
                                <div>
                                    <p className="text-gray-400 text-xs">{c.label}</p>
                                    <p className="text-white text-xl font-bold">{c.value}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {stats && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <p className="text-gray-400 text-sm">Average Score</p>
                        <p className="text-2xl font-bold text-white">{Number(stats.averageScore).toFixed(1)}%</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <p className="text-gray-400 text-sm">Completion Rate</p>
                        <p className="text-2xl font-bold text-white">{stats.completionRate}%</p>
                    </div>
                </div>
            )}

            <div className="flex gap-3">
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500">
                    <option value="">All Status</option>
                    <option value="Completed">Completed</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Abandoned">Abandoned</option>
                </select>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/10 text-gray-400">
                            <th className="text-left p-4">User</th>
                            <th className="text-left p-4">Start Time</th>
                            <th className="text-left p-4">Status</th>
                            <th className="text-left p-4">Questions</th>
                            <th className="text-left p-4">Score</th>
                            <th className="text-right p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessions.map((s: any) => (
                            <motion.tr key={s.sessionId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-white/5 hover:bg-white/5 transition">
                                <td className="p-4">
                                    <p className="text-white font-medium">{s.userName}</p>
                                    <p className="text-gray-500 text-xs">{s.userEmail}</p>
                                </td>
                                <td className="p-4 text-gray-300">{new Date(s.startTime).toLocaleString()}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs ${s.status === "Completed" ? "bg-green-500/20 text-green-300" : s.status === "InProgress" ? "bg-yellow-500/20 text-yellow-300" : "bg-red-500/20 text-red-300"}`}>{s.status}</span>
                                </td>
                                <td className="p-4 text-gray-300">{s.answeredQuestions}/{s.totalQuestions}</td>
                                <td className="p-4 text-white font-medium">{s.overallScore != null ? `${Number(s.overallScore).toFixed(1)}%` : "—"}</td>
                                <td className="p-4 text-right">
                                    <button onClick={() => viewDetail(s.sessionId)} className="text-blue-400 hover:text-blue-300"><Eye size={16} /></button>
                                </td>
                            </motion.tr>
                        ))}
                        {sessions.length === 0 && (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500">No sessions found</td></tr>
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

            {/* Detail Modal */}
            {detail && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 overflow-y-auto py-8">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-2xl mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Session Detail</h2>
                            <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                            <div><span className="text-gray-400">User:</span> <span className="text-white ml-2">{detail.userName}</span></div>
                            <div><span className="text-gray-400">Status:</span> <span className={`ml-2 ${detail.status === "Completed" ? "text-green-400" : "text-yellow-400"}`}>{detail.status}</span></div>
                            <div><span className="text-gray-400">Start:</span> <span className="text-white ml-2">{new Date(detail.startTime).toLocaleString()}</span></div>
                            <div><span className="text-gray-400">Score:</span> <span className="text-white ml-2">{detail.overallScore != null ? `${Number(detail.overallScore).toFixed(1)}%` : "N/A"}</span></div>
                        </div>
                        {detail.answers && detail.answers.length > 0 && (
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                <h3 className="text-sm font-semibold text-gray-300">Answers</h3>
                                {detail.answers.map((a: any, i: number) => (
                                    <div key={a.answerId} className="bg-white/5 rounded-lg p-3">
                                        <p className="text-xs text-blue-400 mb-1">Q{i + 1}: {a.questionText}</p>
                                        <p className="text-sm text-gray-300">{a.transcriptText || "No transcript"}</p>
                                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                            <span>{a.wordCount} words</span>
                                            <span>{Number(a.speakingPaceWPM).toFixed(0)} WPM</span>
                                            <span>{a.fillerWordCount} fillers</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex justify-end mt-4">
                            <button onClick={() => setDetail(null)} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 text-sm hover:bg-white/10">Close</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
