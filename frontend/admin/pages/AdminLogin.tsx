// AdminLogin.tsx - Admin Login Page
// Separate login page for administrators with modern dark theme styling.
// Includes email/password form, error handling, and redirect on success.

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, Shield } from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";

const AdminLogin: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAdminAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        const result = await login(email, password);

        if (result.success) {
            navigate("/admin");
        } else {
            setError(result.message);
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] opacity-50" />
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-red-600/10 blur-[120px] rounded-full"
                />
                <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.25, 0.1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-0 -left-1/4 w-[600px] h-[600px] bg-orange-600/10 blur-[120px] rounded-full"
                />
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                >
                    {/* Admin Shield Icon */}
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center border border-red-500/20 mb-6">
                        <Shield className="w-8 h-8 text-red-400" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">
                        Admin Portal
                    </h2>
                    <p className="mt-2 text-sm text-zinc-500">
                        Sign in to manage InterviewHub
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-8 bg-zinc-900/50 backdrop-blur-sm py-8 px-6 border border-white/10 rounded-xl relative overflow-hidden shadow-2xl shadow-black/50"
                >
                    {/* Decorative top gradient line */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="admin-email" className="block text-sm font-medium text-zinc-300">
                                Email address
                            </label>
                            <div className="mt-2 relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-zinc-600 group-focus-within:text-red-400 transition-colors" />
                                </div>
                                <input
                                    id="admin-email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                                    className="block w-full pl-10 pr-3 py-3 border border-zinc-800 bg-black/50 text-white placeholder-zinc-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm transition-all"
                                    placeholder="admin@interviewhub.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="admin-password" className="block text-sm font-medium text-zinc-300">
                                Password
                            </label>
                            <div className="mt-2 relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-zinc-600 group-focus-within:text-red-400 transition-colors" />
                                </div>
                                <input
                                    id="admin-password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                                    className="block w-full pl-10 pr-3 py-3 border border-zinc-800 bg-black/50 text-white placeholder-zinc-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/20"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Signing In...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminLogin;
