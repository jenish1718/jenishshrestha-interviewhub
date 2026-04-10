import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Upload,
    FileText,
    Trash2,
    Eye,
    Edit3,
    X,
    Loader2,
    Plus,
    Briefcase,
    Building2,
    Calendar,
    CheckCircle,
    Clock,
    AlertCircle,
    Play,
    BarChart3,
    Trophy,
} from "lucide-react";
import Button from "../components/Button";

const API_URL = "http://localhost:5052/api";

interface JobEmail {
    emailId: number;
    userId: number;
    jobTitle: string | null;
    companyName: string | null;
    emailContent: string;
    uploadDate: string;
    parsedSkills: string[] | null;
    status: string;
    originalFileName: string | null;
    fileType: string | null;
}

interface User {
    userId: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}

interface SessionSummary {
    sessionId: number;
    jobTitle: string | null;
    companyName: string | null;
    startTime: string;
    endTime: string | null;
    totalDurationMinutes: number;
    totalQuestions: number;
    questionsAnswered: number;
    averageWPM: number;
    totalFillerWords: number;
    totalWordCount: number;
}

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [emails, setEmails] = useState<JobEmail[]>([]);
    const [sessions, setSessions] = useState<SessionSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Modal states
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState<JobEmail | null>(null);

    // Upload form states
    const [uploadMode, setUploadMode] = useState<"paste" | "file">("paste");
    const [jobTitle, setJobTitle] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [emailContent, setEmailContent] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem("accessToken");
        return {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        };
    }, []);

    // Check authentication
    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        const userData = localStorage.getItem("user");

        if (!token || !userData) {
            navigate("/signin");
            return;
        }

        try {
            setUser(JSON.parse(userData));
        } catch {
            navigate("/signin");
        }
    }, [navigate]);

    // Fetch emails
    const fetchEmails = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/emails/my-emails`, {
                headers: getAuthHeaders(),
            });

            if (response.status === 401) {
                localStorage.clear();
                navigate("/signin");
                return;
            }

            const data = await response.json();
            if (data.success) {
                setEmails(data.emails);
            }
        } catch (err) {
            console.error("Error fetching emails:", err);
        } finally {
            setIsLoading(false);
        }
    }, [getAuthHeaders, navigate]);

    // Fetch user's interview sessions
    const fetchSessions = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/sessions/user`, {
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                const data = await response.json();
                setSessions(data.sessions || []);
            }
        } catch (err) {
            console.error("Error fetching sessions:", err);
        }
    }, [getAuthHeaders]);

    useEffect(() => {
        if (user) {
            fetchEmails();
            fetchSessions();
        }
    }, [user, fetchEmails, fetchSessions]);

    // Handle paste upload
    const handlePasteUpload = async () => {
        if (!emailContent.trim()) {
            setError("Please enter job description content");
            return;
        }

        setIsUploading(true);
        setError("");

        try {
            const response = await fetch(`${API_URL}/emails/upload`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    jobTitle: jobTitle || null,
                    companyName: companyName || null,
                    emailContent,
                    fileType: "paste",
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccessMessage("Job description uploaded successfully!");
                setShowUploadModal(false);
                resetUploadForm();
                fetchEmails();
                setTimeout(() => setSuccessMessage(""), 3000);
            } else {
                setError(data.message || "Upload failed");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    // Handle file upload
    const handleFileUpload = async () => {
        if (!selectedFile) {
            setError("Please select a file");
            return;
        }

        if (selectedFile.size > 5 * 1024 * 1024) {
            setError("File size exceeds 5MB limit");
            return;
        }

        setIsUploading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("file", selectedFile);
            if (jobTitle) formData.append("jobTitle", jobTitle);
            if (companyName) formData.append("companyName", companyName);

            const token = localStorage.getItem("accessToken");
            const response = await fetch(`${API_URL}/emails/upload-file`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                setSuccessMessage("File uploaded successfully!");
                setShowUploadModal(false);
                resetUploadForm();
                fetchEmails();
                setTimeout(() => setSuccessMessage(""), 3000);
            } else {
                setError(data.message || "Upload failed");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    // Handle delete
    const handleDelete = async (emailId: number) => {
        if (!confirm("Are you sure you want to delete this job description?")) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/emails/${emailId}`, {
                method: "DELETE",
                headers: getAuthHeaders(),
            });

            const data = await response.json();

            if (data.success) {
                setSuccessMessage("Deleted successfully!");
                fetchEmails();
                setTimeout(() => setSuccessMessage(""), 3000);
            }
        } catch (err) {
            setError("Failed to delete");
        }
    };

    const resetUploadForm = () => {
        setJobTitle("");
        setCompanyName("");
        setEmailContent("");
        setSelectedFile(null);
        setUploadMode("paste");
        setError("");
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate("/");
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case "parsed":
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case "pending":
                return <Clock className="w-4 h-4 text-yellow-500" />;
            default:
                return <AlertCircle className="w-4 h-4 text-red-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "parsed":
                return "bg-green-500/10 text-green-400 border-green-500/20";
            case "pending":
                return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
            default:
                return "bg-red-500/10 text-red-400 border-red-500/20";
        }
    };

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-black pt-20 pb-10 px-4">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] opacity-50"></div>
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 12, repeat: Infinity }}
                    className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-500/10 blur-[120px] rounded-full"
                />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">
                            Welcome, {user.firstName}!
                        </h1>
                        <p className="text-zinc-500 mt-1">
                            Manage your job descriptions and start practicing
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="glow"
                            icon={Plus}
                            onClick={() => setShowUploadModal(true)}
                        >
                            Upload Job Description
                        </Button>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Success/Error Messages */}
                <AnimatePresence>
                    {successMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400"
                        >
                            {successMessage}
                        </motion.div>
                    )}
                    {error && !showUploadModal && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-brand-500/10 rounded-lg">
                                <FileText className="w-6 h-6 text-brand-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{emails.length}</p>
                                <p className="text-zinc-500 text-sm">Job Descriptions</p>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500/10 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">
                                    {emails.filter((e) => e.status === "Parsed").length}
                                </p>
                                <p className="text-zinc-500 text-sm">Parsed</p>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-500/10 rounded-lg">
                                <Trophy className="w-6 h-6 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">
                                    {sessions.filter((s) => s.endTime !== null).length}
                                </p>
                                <p className="text-zinc-500 text-sm">Completed Interviews</p>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-500/10 rounded-lg">
                                <Clock className="w-6 h-6 text-yellow-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">
                                    {emails.filter((e) => e.status === "Pending").length}
                                </p>
                                <p className="text-zinc-500 text-sm">Pending</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Email List */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-zinc-800">
                        <h2 className="text-xl font-semibold text-white">
                            Your Job Descriptions
                        </h2>
                    </div>

                    {
                        isLoading ? (
                            <div className="p-12 flex justify-center">
                                <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
                            </div>
                        ) : emails.length === 0 ? (
                            <div className="p-12 text-center">
                                <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                                <p className="text-zinc-500">No job descriptions uploaded yet</p>
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => setShowUploadModal(true)}
                                >
                                    Upload your first job description
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-zinc-800/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                                Job Title
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                                Company
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                                Upload Date
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800">
                                        {emails.map((email) => (
                                            <motion.tr
                                                key={email.emailId}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="hover:bg-zinc-800/30 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Briefcase className="w-4 h-4 text-zinc-500" />
                                                        <span className="text-white">
                                                            {email.jobTitle || "Untitled"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Building2 className="w-4 h-4 text-zinc-500" />
                                                        <span className="text-zinc-400">
                                                            {email.companyName || "Unknown"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Calendar className="w-4 h-4 text-zinc-500" />
                                                        <span className="text-zinc-400">
                                                            {new Date(email.uploadDate).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(email.status)}`}
                                                    >
                                                        {getStatusIcon(email.status)}
                                                        {email.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        {email.status === "Parsed" && (
                                                            <button
                                                                onClick={() => navigate(`/interview/${email.emailId}`)}
                                                                className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors"
                                                                title="Start Interview"
                                                            >
                                                                <Play className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                setSelectedEmail(email);
                                                                setShowViewModal(true);
                                                            }}
                                                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
                                                            title="View"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(email.emailId)}
                                                            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    }
                </div>

                {/* Interview History Section */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden mt-8">
                    <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-purple-500" />
                            Interview History
                        </h2>
                        <button
                            onClick={() => navigate('/reports')}
                            className="text-brand-500 hover:text-brand-400 text-sm font-medium transition-colors"
                        >
                            View All Reports →
                        </button>
                    </div>

                    {
                        sessions.filter(s => s.endTime !== null).length === 0 ? (
                            <div className="p-12 text-center">
                                <Trophy className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                                <p className="text-zinc-500">No completed interviews yet</p>
                                <p className="text-zinc-600 text-sm mt-2">
                                    Start a mock interview to see your results here
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-zinc-800/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                                Job Title
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                                Company
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                                Duration
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                                Questions
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800">
                                        {sessions
                                            .filter(s => s.endTime !== null)
                                            .slice(0, 5)
                                            .map((session) => (
                                                <motion.tr
                                                    key={session.sessionId}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="hover:bg-zinc-800/30 transition-colors"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <Briefcase className="w-4 h-4 text-zinc-500" />
                                                            <span className="text-white">
                                                                {session.jobTitle || "Untitled"}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <Building2 className="w-4 h-4 text-zinc-500" />
                                                            <span className="text-zinc-400">
                                                                {session.companyName || "Unknown"}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <Calendar className="w-4 h-4 text-zinc-500" />
                                                            <span className="text-zinc-400">
                                                                {new Date(session.startTime).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-zinc-400">
                                                            {session.totalDurationMinutes} min
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-zinc-400">
                                                            {session.questionsAnswered}/{session.totalQuestions}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => navigate(`/report/${session.sessionId}`)}
                                                                className="px-3 py-1.5 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
                                                            >
                                                                <BarChart3 className="w-4 h-4" />
                                                                View Report
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    }
                </div >
            </div >

            {/* Upload Modal */}
            <AnimatePresence>
                {
                    showUploadModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                            onClick={() => setShowUploadModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                            >
                                <div className="flex justify-between items-center p-6 border-b border-zinc-800">
                                    <h3 className="text-xl font-semibold text-white">
                                        Upload Job Description
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setShowUploadModal(false);
                                            resetUploadForm();
                                        }}
                                        className="text-zinc-400 hover:text-white"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-6 space-y-6">
                                    {error && (
                                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                            {error}
                                        </div>
                                    )}

                                    {/* Upload Mode Toggle */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setUploadMode("paste")}
                                            className={`flex-1 py-3 px-4 rounded-lg border transition-colors ${uploadMode === "paste"
                                                ? "bg-brand-500/10 border-brand-500 text-brand-500"
                                                : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                                                }`}
                                        >
                                            Paste Text
                                        </button>
                                        <button
                                            onClick={() => setUploadMode("file")}
                                            className={`flex-1 py-3 px-4 rounded-lg border transition-colors ${uploadMode === "file"
                                                ? "bg-brand-500/10 border-brand-500 text-brand-500"
                                                : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                                                }`}
                                        >
                                            Upload File
                                        </button>
                                    </div>

                                    {/* Job Title */}
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                                            Job Title (optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={jobTitle}
                                            onChange={(e) => setJobTitle(e.target.value)}
                                            placeholder="e.g. Senior Software Engineer"
                                            className="w-full px-4 py-3 bg-black/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500"
                                        />
                                    </div>

                                    {/* Company Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                                            Company Name (optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            placeholder="e.g. Google"
                                            className="w-full px-4 py-3 bg-black/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500"
                                        />
                                    </div>

                                    {uploadMode === "paste" ? (
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                                Job Description *
                                            </label>
                                            <textarea
                                                value={emailContent}
                                                onChange={(e) => setEmailContent(e.target.value)}
                                                placeholder="Paste the job description or email content here..."
                                                rows={8}
                                                className="w-full px-4 py-3 bg-black/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500 resize-none"
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                                Upload File *
                                            </label>
                                            <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center hover:border-zinc-600 transition-colors">
                                                <input
                                                    type="file"
                                                    accept=".txt,.pdf,.eml"
                                                    onChange={(e) =>
                                                        setSelectedFile(e.target.files?.[0] || null)
                                                    }
                                                    className="hidden"
                                                    id="file-upload"
                                                />
                                                <label
                                                    htmlFor="file-upload"
                                                    className="cursor-pointer"
                                                >
                                                    <Upload className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
                                                    {selectedFile ? (
                                                        <p className="text-brand-500">{selectedFile.name}</p>
                                                    ) : (
                                                        <>
                                                            <p className="text-zinc-400">
                                                                Click to upload or drag and drop
                                                            </p>
                                                            <p className="text-zinc-600 text-sm mt-1">
                                                                .txt, .pdf, .eml (max 5MB)
                                                            </p>
                                                        </>
                                                    )}
                                                </label>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            onClick={() => {
                                                setShowUploadModal(false);
                                                resetUploadForm();
                                            }}
                                            className="flex-1 py-3 px-4 border border-zinc-700 text-zinc-400 rounded-lg hover:bg-zinc-800 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <Button
                                            variant="glow"
                                            className="flex-1"
                                            onClick={
                                                uploadMode === "paste"
                                                    ? handlePasteUpload
                                                    : handleFileUpload
                                            }
                                            disabled={isUploading}
                                            icon={isUploading ? Loader2 : Upload}
                                        >
                                            {isUploading ? "Uploading..." : "Upload"}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* View Modal */}
            <AnimatePresence>
                {
                    showViewModal && selectedEmail && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                            onClick={() => setShowViewModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                            >
                                <div className="flex justify-between items-center p-6 border-b border-zinc-800">
                                    <div>
                                        <h3 className="text-xl font-semibold text-white">
                                            {selectedEmail.jobTitle || "Job Description"}
                                        </h3>
                                        {selectedEmail.companyName && (
                                            <p className="text-zinc-500">{selectedEmail.companyName}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setShowViewModal(false)}
                                        className="text-zinc-400 hover:text-white"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-6">
                                    <div className="flex gap-4 mb-4 text-sm text-zinc-500">
                                        <span>
                                            Uploaded:{" "}
                                            {new Date(selectedEmail.uploadDate).toLocaleString()}
                                        </span>
                                        <span
                                            className={`px-2 py-0.5 rounded ${getStatusColor(selectedEmail.status)}`}
                                        >
                                            {selectedEmail.status}
                                        </span>
                                    </div>
                                    <div className="bg-black/50 border border-zinc-800 rounded-lg p-4 max-h-96 overflow-y-auto">
                                        <pre className="text-zinc-300 whitespace-pre-wrap font-mono text-sm">
                                            {selectedEmail.emailContent}
                                        </pre>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;
