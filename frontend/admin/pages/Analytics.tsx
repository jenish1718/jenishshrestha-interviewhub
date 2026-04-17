import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, BookOpen, Award, BarChart3, TrendingUp, Activity } from "lucide-react";
import { getDashboardStats, getUserGrowth, getSessionTrends, getSkillPopularity } from "../services/analyticsService";
import AdminSkillsAnalytics from "./AdminSkillsAnalytics";

export default function Analytics() {
    const [stats, setStats] = useState<any>(null);
    const [userGrowth, setUserGrowth] = useState<any[]>([]);
    const [sessionTrends, setSessionTrends] = useState<any[]>([]);
    const [skillPop, setSkillPop] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                const [s, ug, st, sp] = await Promise.all([
                    getDashboardStats(), getUserGrowth(), getSessionTrends(), getSkillPopularity()
                ]);
                setStats(s);
                setUserGrowth(ug || []);
                setSessionTrends(st || []);
                setSkillPop(sp || []);
            } catch { }
        };
        load();
    }, []);

    const cards = stats ? [
        { label: "Total Users", value: stats.totalUsers, icon: Users, color: "blue", sub: `${stats.activeUsers} active` },
        { label: "Total Sessions", value: stats.totalSessions, icon: Activity, color: "green", sub: `${stats.completionRate}% completion` },
        { label: "Total Questions", value: stats.totalQuestions, icon: BookOpen, color: "purple", sub: "in bank" },
        { label: "Total Skills", value: stats.totalSkills, icon: Award, color: "cyan", sub: "tracked" },
        { label: "Avg Score", value: `${Number(stats.averageScore).toFixed(1)}%`, icon: BarChart3, color: "yellow", sub: "across all sessions" },
        { label: "Completion Rate", value: `${stats.completionRate}%`, icon: TrendingUp, color: "emerald", sub: "sessions completed" },
    ] : [];

    const maxGrowth = Math.max(...userGrowth.map((d: any) => d.count), 1);
    const maxTrends = Math.max(...sessionTrends.map((d: any) => d.count), 1);
    const maxSkill = Math.max(...skillPop.map((d: any) => d.value), 1);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map((c, i) => (
                    <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/8 transition">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 bg-${c.color}-500/20 rounded-lg`}>
                                <c.icon className={`text-${c.color}-400`} size={20} />
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs">{c.label}</p>
                                <p className="text-white text-2xl font-bold">{c.value}</p>
                                <p className="text-gray-500 text-xs">{c.sub}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Growth Chart */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <h3 className="text-white font-semibold mb-4">User Growth</h3>
                    {userGrowth.length > 0 ? (
                        <div className="flex items-end gap-1 h-40">
                            {userGrowth.slice(-30).map((d: any, i: number) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <div className="w-full bg-blue-500/40 rounded-t" style={{ height: `${(d.count / maxGrowth) * 100}%`, minHeight: "4px" }} title={`${d.date}: ${d.count}`}></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm text-center py-10">No user growth data yet</p>
                    )}
                </motion.div>

                {/* Session Trends Chart */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <h3 className="text-white font-semibold mb-4">Session Trends</h3>
                    {sessionTrends.length > 0 ? (
                        <div className="flex items-end gap-1 h-40">
                            {sessionTrends.slice(-30).map((d: any, i: number) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <div className="w-full bg-green-500/40 rounded-t" style={{ height: `${(d.count / maxTrends) * 100}%`, minHeight: "4px" }} title={`${d.date}: ${d.count}`}></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm text-center py-10">No session data yet</p>
                    )}
                </motion.div>
            </div>

            {/* Skill Popularity */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-4">Top Skills by Usage</h3>
                {skillPop.length > 0 ? (
                    <div className="space-y-3">
                        {skillPop.map((s: any, i: number) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="text-gray-400 text-sm w-32 truncate">{s.label}</span>
                                <div className="flex-1 bg-white/5 rounded-full h-3 overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${(s.value / maxSkill) * 100}%` }} transition={{ duration: 0.5, delay: i * 0.05 }} className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full" />
                                </div>
                                <span className="text-white text-sm font-medium w-10 text-right">{s.value}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm text-center py-10">No skill usage data yet</p>
                )}
            </motion.div>

            {/* Skills Distribution Pie Chart */}
            <AdminSkillsAnalytics />
        </div>
    );
}
