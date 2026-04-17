import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PieChart, Calendar, TrendingUp, BarChart3 } from "lucide-react";
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { getSkillsDistribution, SkillInterviewStatsDto } from "../services/analyticsService";

const COLORS = [
    "#3B82F6", "#8B5CF6", "#06B6D4", "#10B981", "#F59E0B",
    "#EF4444", "#EC4899", "#6366F1", "#14B8A6", "#F97316",
    "#6B7280" // "Others" color
];

type DateRange = "7d" | "30d" | "90d" | "all" | "custom";

export default function AdminSkillsAnalytics() {
    const [skills, setSkills] = useState<SkillInterviewStatsDto[]>([]);
    const [totalInterviews, setTotalInterviews] = useState(0);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<DateRange>("all");
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");

    useEffect(() => {
        loadData();
    }, [dateRange, customFrom, customTo]);

    const loadData = async () => {
        setLoading(true);
        try {
            let from: string | undefined;
            let to: string | undefined;

            const now = new Date();
            switch (dateRange) {
                case "7d":
                    from = new Date(now.getTime() - 7 * 86400000).toISOString();
                    break;
                case "30d":
                    from = new Date(now.getTime() - 30 * 86400000).toISOString();
                    break;
                case "90d":
                    from = new Date(now.getTime() - 90 * 86400000).toISOString();
                    break;
                case "custom":
                    from = customFrom || undefined;
                    to = customTo || undefined;
                    break;
            }

            const res = await getSkillsDistribution(from, to);
            setSkills(res.skills || []);
            setTotalInterviews(res.totalInterviews || 0);
        } catch { }
        setLoading(false);
    };

    const chartData = skills.map((s, i) => ({
        name: s.skillName,
        value: s.interviewCount,
        percentage: s.percentage,
        fill: COLORS[i % COLORS.length]
    }));

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-gray-900 border border-white/20 rounded-lg p-3 shadow-xl">
                    <p className="text-white font-semibold">{data.name}</p>
                    <p className="text-blue-400 text-sm">{data.value} interviews</p>
                    <p className="text-gray-400 text-sm">{data.percentage}%</p>
                </div>
            );
        }
        return null;
    };

    const CustomLegend = ({ payload }: any) => (
        <div className="flex flex-wrap justify-center gap-3 mt-4">
            {payload?.map((entry: any, idx: number) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-gray-400">{entry.value}</span>
                </div>
            ))}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <PieChart className="text-purple-400" size={24} />
                    <h2 className="text-xl font-bold text-white">Skills Distribution</h2>
                </div>

                {/* Date range filter */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Calendar size={16} className="text-gray-400" />
                    {(["7d", "30d", "90d", "all", "custom"] as DateRange[]).map((range) => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${dateRange === range ? "bg-purple-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
                        >
                            {range === "7d" ? "Last 7 Days" : range === "30d" ? "Last 30 Days" : range === "90d" ? "Last 90 Days" : range === "all" ? "All Time" : "Custom"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom date inputs */}
            {dateRange === "custom" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">From:</span>
                        <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">To:</span>
                        <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500" />
                    </div>
                </motion.div>
            )}

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : skills.length === 0 ? (
                <div className="text-center py-16 bg-white/5 border border-white/10 rounded-xl">
                    <BarChart3 className="mx-auto mb-4 text-gray-600" size={48} />
                    <h3 className="text-lg font-semibold text-gray-400 mb-2">No Interview Data</h3>
                    <p className="text-gray-500 text-sm">Complete some interviews to see skill distribution.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pie Chart */}
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <TrendingUp size={16} className="text-purple-400" />
                            Top 10 Most Interviewed Skills
                        </h3>
                        <ResponsiveContainer width="100%" height={350}>
                            <RechartsPieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={130}
                                    paddingAngle={3}
                                    dataKey="value"
                                    animationBegin={0}
                                    animationDuration={800}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend content={<CustomLegend />} />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                        <div className="text-center mt-4">
                            <p className="text-gray-400 text-sm">Total Interview Sessions: <span className="text-white font-bold text-lg">{totalInterviews}</span></p>
                        </div>
                    </motion.div>

                    {/* Stats table */}
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h3 className="text-white font-semibold mb-4">Detailed Breakdown</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left text-gray-400 font-medium py-3 px-2">#</th>
                                        <th className="text-left text-gray-400 font-medium py-3 px-2">Skill</th>
                                        <th className="text-right text-gray-400 font-medium py-3 px-2">Interviews</th>
                                        <th className="text-right text-gray-400 font-medium py-3 px-2">Share</th>
                                        <th className="text-left text-gray-400 font-medium py-3 px-2 w-32"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {skills.map((s, i) => (
                                        <motion.tr
                                            key={s.skillName}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="border-b border-white/5 hover:bg-white/5 transition"
                                        >
                                            <td className="py-3 px-2 text-gray-500">{i + 1}</td>
                                            <td className="py-3 px-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                    <span className="text-white font-medium">{s.skillName}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 text-right text-white font-semibold">{s.interviewCount}</td>
                                            <td className="py-3 px-2 text-right text-gray-400">{s.percentage}%</td>
                                            <td className="py-3 px-2">
                                                <div className="bg-white/5 rounded-full h-2 overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${s.percentage}%` }}
                                                        transition={{ duration: 0.6, delay: i * 0.05 }}
                                                        className="h-full rounded-full"
                                                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                                    />
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
