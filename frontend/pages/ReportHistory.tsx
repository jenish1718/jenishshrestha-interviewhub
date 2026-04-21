import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    FileText,
    Calendar,
    Trophy,
    Search,
    SortAsc,
    SortDesc,
    Briefcase,
    Loader2,
    ArrowLeft,
    Eye,
    Download,
} from 'lucide-react';

const API_BASE = 'https://jenishshrestha-interviewhub-production.up.railway.app/api';

interface ReportHistoryItem {
    reportId: number;
    sessionId: number;
    jobTitle?: string;
    companyName?: string;
    overallScore: number;
    grade: string;
    generatedAt: string;
}

const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (grade.startsWith('B')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (grade.startsWith('C')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
};

const ReportHistory: React.FC = () => {
    const navigate = useNavigate();
    const [reports, setReports] = useState<ReportHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<'date' | 'score'>('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        const fetchReports = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                navigate('/');
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/reports/history`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch reports');
                }

                const data = await response.json();
                setReports(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [navigate]);

    // Filter and sort reports
    const filteredReports = reports
        .filter(report => {
            const query = searchQuery.toLowerCase();
            return (
                (report.jobTitle?.toLowerCase().includes(query) || false) ||
                (report.companyName?.toLowerCase().includes(query) || false)
            );
        })
        .sort((a, b) => {
            if (sortOrder === 'date') {
                const dateA = new Date(a.generatedAt).getTime();
                const dateB = new Date(b.generatedAt).getTime();
                return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
            } else {
                return sortDirection === 'desc'
                    ? b.overallScore - a.overallScore
                    : a.overallScore - b.overallScore;
            }
        });

    const toggleSort = (order: 'date' | 'score') => {
        if (sortOrder === order) {
            setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortOrder(order);
            setSortDirection('desc');
        }
    };

    // Calculate statistics
    const avgScore = reports.length > 0
        ? Math.round(reports.reduce((sum, r) => sum + r.overallScore, 0) / reports.length)
        : 0;
    const bestScore = reports.length > 0
        ? Math.round(Math.max(...reports.map(r => r.overallScore)))
        : 0;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-8"
                >
                    <div>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-2"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back to Dashboard
                        </button>
                        <h1 className="text-2xl font-bold text-white">Interview Reports</h1>
                        <p className="text-gray-400">View your past interview performance</p>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-white/10"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-500/20 rounded-lg">
                                <FileText className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Total Reports</p>
                                <p className="text-2xl font-bold text-white">{reports.length}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-white/10"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-500/20 rounded-lg">
                                <Trophy className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Best Score</p>
                                <p className="text-2xl font-bold text-white">{bestScore}%</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-white/10"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-500/20 rounded-lg">
                                <Calendar className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Average Score</p>
                                <p className="text-2xl font-bold text-white">{avgScore}%</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Search and Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-white/10 mb-6"
                >
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by job title or company..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                            />
                        </div>

                        {/* Sort Options */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => toggleSort('date')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${sortOrder === 'date'
                                        ? 'bg-blue-600/20 border-blue-500/30 text-blue-400'
                                        : 'bg-gray-900/50 border-white/10 text-gray-400 hover:text-white'
                                    }`}
                            >
                                <Calendar className="w-4 h-4" />
                                Date
                                {sortOrder === 'date' && (
                                    sortDirection === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />
                                )}
                            </button>
                            <button
                                onClick={() => toggleSort('score')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${sortOrder === 'score'
                                        ? 'bg-blue-600/20 border-blue-500/30 text-blue-400'
                                        : 'bg-gray-900/50 border-white/10 text-gray-400 hover:text-white'
                                    }`}
                            >
                                <Trophy className="w-4 h-4" />
                                Score
                                {sortOrder === 'score' && (
                                    sortDirection === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Reports List */}
                {filteredReports.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                    >
                        <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl text-gray-400 mb-2">No reports found</h3>
                        <p className="text-gray-500 mb-4">
                            {reports.length === 0
                                ? 'Complete a mock interview to see your reports here'
                                : 'Try adjusting your search query'}
                        </p>
                        <Link
                            to="/dashboard"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                        >
                            Start an Interview
                        </Link>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {filteredReports.map((report, idx) => (
                            <motion.div
                                key={report.reportId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * idx }}
                                className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-colors"
                            >
                                <div className="p-5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gray-900/50 rounded-lg">
                                            <Briefcase className="w-6 h-6 text-gray-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">
                                                {report.jobTitle || 'Interview Session'}
                                            </h3>
                                            <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                                                {report.companyName && (
                                                    <span>{report.companyName}</span>
                                                )}
                                                <span>â€¢</span>
                                                <span>{new Date(report.generatedAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        {/* Score */}
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-white">
                                                {Math.round(report.overallScore)}%
                                            </div>
                                            <div className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${getGradeColor(report.grade)}`}>
                                                {report.grade}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            <Link
                                                to={`/report/${report.sessionId}`}
                                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
                                                title="View Report"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="h-1 bg-gray-700">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                        style={{ width: `${report.overallScore}%` }}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportHistory;
