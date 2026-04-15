// AdminDashboard.tsx - Admin Dashboard Layout with Sidebar Navigation
// Main layout component for the admin panel. Includes:
// - Collapsible sidebar with navigation links
// - Header with admin info and logout
// - Outlet for nested admin routes (Users, Job Emails pages)

import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    Mail,
    LayoutDashboard,
    LogOut,
    Menu,
    X,
    Shield,
    ChevronRight,
    Award,
    HelpCircle,
    Activity,
    BarChart3,
    ShieldCheck,
    Settings,
    FileText
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";

const sidebarLinks = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
    { to: "/admin/users", icon: Users, label: "User Management", end: false },
    { to: "/admin/skills", icon: Award, label: "Skills", end: false },
    { to: "/admin/questions", icon: HelpCircle, label: "Questions", end: false },
    { to: "/admin/sessions", icon: Activity, label: "Sessions", end: false },
    { to: "/admin/analytics", icon: BarChart3, label: "Analytics", end: false },
    { to: "/admin/moderation", icon: ShieldCheck, label: "Moderation", end: false },
    { to: "/admin/job-emails", icon: Mail, label: "Job Emails", end: false },
    { to: "/admin/settings", icon: Settings, label: "Settings", end: false },
    { to: "/admin/audit-logs", icon: FileText, label: "Audit Logs", end: false },
];

const AdminDashboard: React.FC = () => {
    const { admin, logout } = useAdminAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/admin/login");
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex">
            {/* Mobile overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-zinc-900/80 backdrop-blur-xl border-r border-white/5 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                    }`}
            >
                {/* Sidebar Header */}
                <div className="h-16 flex items-center gap-3 px-5 border-b border-white/5">
                    <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-sm">InterviewHub</h1>
                        <p className="text-zinc-500 text-xs">Admin Panel</p>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="ml-auto lg:hidden text-zinc-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="p-3 space-y-1 mt-2">
                    {sidebarLinks.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end={link.end}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                                }`
                            }
                        >
                            <link.icon className="w-5 h-5 flex-shrink-0" />
                            <span>{link.label}</span>
                            <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </NavLink>
                    ))}
                </nav>

                {/* Admin Info at Bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-300 text-sm font-medium">
                            {admin?.firstName?.[0]}{admin?.lastName?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                                {admin?.firstName} {admin?.lastName}
                            </p>
                            <p className="text-zinc-500 text-xs truncate">{admin?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Header */}
                <header className="h-16 bg-zinc-900/50 backdrop-blur-sm border-b border-white/5 flex items-center px-4 lg:px-6 sticky top-0 z-30">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden text-zinc-400 hover:text-white mr-4"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex-1" />
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-zinc-500 hidden sm:inline">
                            Welcome, <span className="text-white font-medium">{admin?.firstName}</span>
                        </span>
                    </div>
                </header>

                {/* Page Content - renders nested routes */}
                <main className="flex-1 p-4 lg:p-6 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
