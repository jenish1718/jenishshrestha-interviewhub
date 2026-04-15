// AdminHome.tsx - Dashboard Home Page
// Shows summary statistics and quick overview when admin first logs in.

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Mail, TrendingUp, UserCheck, UserX, Clock } from "lucide-react";
import { getUserStats } from "../services/userManagementService";
import { getJobEmailStats } from "../services/jobEmailManagementService";

const AdminHome: React.FC = () => {
    const [userStats, setUserStats] = useState<any>(null);
    const [emailStats, setEmailStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [userRes, emailRes] = await Promise.all([
                    getUserStats(),
                    getJobEmailStats(),
                ]);
                if (userRes.success) setUserStats(userRes.stats);
                if (emailRes.success) setEmailStats(emailRes.stats);
            } catch (err) {
                console.error("Failed to load stats:", err);
            }
            setLoading(false);
        };
        fetchStats();
    }, []);

    const statCards = [
        { label: "Total Users", value: userStats?.totalUsers ?? 0, icon: Users, color: "from-blue-500 to-cyan-500", bg: "bg-blue-500/10" },
        { label: "Active Users", value: userStats?.activeUsers ?? 0, icon: UserCheck, color: "from-green-500 to-emerald-500", bg: "bg-green-500/10" },
        { label: "New This Week", value: userStats?.newUsersThisWeek ?? 0, icon: TrendingUp, color: "from-purple-500 to-pink-500", bg: "bg-purple-500/10" },
        { label: "Suspended", value: userStats?.suspendedUsers ?? 0, icon: UserX, color: "from-red-500 to-orange-500", bg: "bg-red-500/10" },
        { label: "Total Job Emails", value: emailStats?.totalEmails ?? 0, icon: Mail, color: "from-amber-500 to-yellow-500", bg: "bg-amber-500/10" },
        { label: "Pending Parsing", value: emailStats?.pendingEmails ?? 0, icon: Clock, color: "from-orange-500 to-red-500", bg: "bg-orange-500/10" },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
                <p className="text-zinc-500 text-sm mt-1">Monitor your platform's key metrics</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {statCards.map((card, index) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-zinc-900/50 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center`}>
                                <card.icon className={`w-5 h-5 bg-gradient-to-r ${card.color} bg-clip-text`} style={{ color: 'inherit' }} />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-white">{card.value}</p>
                        <p className="text-zinc-500 text-sm mt-1">{card.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Quick Stats Rows */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Skills */}
                {emailStats?.topSkills?.length > 0 && (
                    <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-5">
                        <h3 className="text-white font-semibold mb-4">Top Skills Extracted</h3>
                        <div className="space-y-3">
                            {emailStats.topSkills.slice(0, 5).map((skill: any, i: number) => (
                                <div key={i} className="flex items-center justify-between">
                                    <span className="text-zinc-300 text-sm">{skill.skillName}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                                                style={{ width: `${(skill.count / emailStats.topSkills[0].count) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-zinc-500 text-xs w-8 text-right">{skill.count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Top Companies */}
                {emailStats?.topCompanies?.length > 0 && (
                    <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-5">
                        <h3 className="text-white font-semibold mb-4">Top Companies</h3>
                        <div className="space-y-3">
                            {emailStats.topCompanies.slice(0, 5).map((company: any, i: number) => (
                                <div key={i} className="flex items-center justify-between">
                                    <span className="text-zinc-300 text-sm">{company.companyName}</span>
                                    <span className="text-zinc-500 text-sm bg-zinc-800 px-2 py-0.5 rounded">{company.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminHome;
