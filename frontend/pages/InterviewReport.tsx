import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Download,
    ArrowLeft,
    Trophy,
    Clock,
    MessageSquare,
    TrendingUp,
    TrendingDown,
    ChevronDown,
    ChevronUp,
    Star,
    AlertTriangle,
    CheckCircle,
    XCircle,
    BarChart3,
    PieChart,
    Loader2,
    Smile,
    Eye,
    Brain,
    Award,
    MinusCircle,
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API_BASE = 'http://localhost:5052/api';

interface ReportData {
    reportId: number;
    sessionId: number;
    userId: number;
    jobTitle?: string;
    companyName?: string;
    interviewDate: string;
    durationMinutes: number;
    overallScore: number;
    speechScore: number;
    visualScore: number;
    grade: string;
    speechMetrics: {
        averageWPM: number;
        totalFillerWords: number;
        totalWordCount: number;
        averageAnswerDuration: number;
        fluencyScore: number;
        paceScore: number;
        completenessScore: number;
        clarityScore: number;
    };
    visualMetrics: {
        averageSmileScore: number;
        averageEyeContactScore: number;
        totalNodCount: number;
        averageHeadPoseScore: number;
        engagementScore: number;
    };
    strengths: string[];
    improvements: string[];
    questions: Array<{
        questionId: number;
        questionText: string;
        answerText?: string;
        confidenceScore: number;
        contentScore: number;  // AI-evaluated answer quality
        speechScore: number;
        visualScore: number;
        wordCount: number;
        wpm: number;
        fillerWordCount: number;
        answerDuration: number;
        smileScore: number;
        eyeContactScore: number;
        nodCount: number;
        feedback?: string;  // AI personalized feedback
        strengths?: string[];  // AI identified strengths
        improvements?: string[];  // AI suggested improvements
        tip?: string;
        sampleAnswer?: string;
        answerStatus?: string; // "Correct", "Partial", "Incorrect", "NotEvaluated"
    }>;
    generatedAt: string;
}

const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-400';
    if (grade.startsWith('B')) return 'text-blue-400';
    if (grade.startsWith('C')) return 'text-yellow-400';
    if (grade.startsWith('D')) return 'text-orange-400';
    return 'text-red-400';
};

const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
};

const InterviewReport: React.FC = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const [report, setReport] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        const fetchReport = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                navigate('/');
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/sessions/${sessionId}/report`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch report');
                }

                const data = await response.json();
                setReport(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, [sessionId, navigate]);

    const toggleQuestion = (questionId: number) => {
        setExpandedQuestions(prev => {
            const next = new Set(prev);
            if (next.has(questionId)) {
                next.delete(questionId);
            } else {
                next.add(questionId);
            }
            return next;
        });
    };

    const exportToPDF = async () => {
        if (!report) return;
        setIsExporting(true);

        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 15;
            let y = margin;

            // Header
            pdf.setFillColor(30, 41, 59);
            pdf.rect(0, 0, pageWidth, 40, 'F');

            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(24);
            pdf.setFont('helvetica', 'bold');
            pdf.text('InterviewHub', margin, 20);

            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            pdf.text('Interview Performance Report', margin, 30);

            y = 50;

            // Job Info
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
            pdf.text(report.jobTitle || 'Interview Session', margin, y);
            y += 7;

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(100, 100, 100);
            if (report.companyName) {
                pdf.text(`Company: ${report.companyName}`, margin, y);
                y += 5;
            }
            pdf.text(`Date: ${new Date(report.interviewDate).toLocaleDateString()}`, margin, y);
            y += 5;
            pdf.text(`Duration: ${report.durationMinutes} minutes`, margin, y);
            y += 15;

            // Overall Score Box
            pdf.setFillColor(240, 253, 244);
            pdf.roundedRect(margin, y, pageWidth - 2 * margin, 30, 3, 3, 'F');

            pdf.setTextColor(22, 163, 74);
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Overall Score', margin + 10, y + 12);

            pdf.setFontSize(24);
            pdf.text(`${Math.round(report.overallScore)}%`, margin + 10, y + 25);

            pdf.setFontSize(20);
            pdf.text(`Grade: ${report.grade}`, pageWidth - margin - 50, y + 20);

            y += 40;

            // Score Breakdown
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Score Breakdown', margin, y);
            y += 8;

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10);
            pdf.text(`Speech Score: ${Math.round(report.speechScore)}%`, margin, y);
            y += 6;
            pdf.text(`Visual Score: ${Math.round(report.visualScore)}%`, margin, y);
            y += 15;

            // Strengths
            if (report.strengths.length > 0) {
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(12);
                pdf.setTextColor(22, 163, 74);
                pdf.text('Strengths', margin, y);
                y += 7;

                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(10);
                pdf.setTextColor(0, 0, 0);
                report.strengths.forEach(strength => {
                    pdf.text(`✓ ${strength}`, margin + 5, y);
                    y += 6;
                });
                y += 5;
            }

            // Improvements
            if (report.improvements.length > 0) {
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(12);
                pdf.setTextColor(234, 179, 8);
                pdf.text('Areas for Improvement', margin, y);
                y += 7;

                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(10);
                pdf.setTextColor(0, 0, 0);
                report.improvements.forEach(improvement => {
                    pdf.text(`• ${improvement}`, margin + 5, y);
                    y += 6;
                });
            }

            y += 10;

            // Per-Question Breakdown
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(14);
            pdf.setTextColor(0, 0, 0);
            pdf.text('Question-by-Question Breakdown', margin, y);
            y += 10;

            report.questions.forEach((question, idx) => {
                // Check if we need a new page
                if (y > pageHeight - 60) {
                    pdf.addPage();
                    y = margin;
                }

                // Question header with status
                pdf.setFillColor(240, 240, 245);
                pdf.roundedRect(margin, y - 4, pageWidth - 2 * margin, 10, 2, 2, 'F');
                
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(10);
                pdf.setTextColor(0, 0, 0);
                
                const statusText = question.answerStatus === 'Correct' ? ' ✓ Correct'
                    : question.answerStatus === 'Partial' ? ' ~ Partial'
                    : question.answerStatus === 'Incorrect' ? ' ✗ Incorrect'
                    : '';
                
                const statusColor = question.answerStatus === 'Correct' ? [22, 163, 74]
                    : question.answerStatus === 'Partial' ? [234, 179, 8]
                    : [239, 68, 68];

                pdf.text(`Q${idx + 1}: `, margin + 3, y + 3);
                
                // Truncate question text
                const maxQLen = 70;
                const qText = question.questionText.length > maxQLen 
                    ? question.questionText.substring(0, maxQLen) + '...' 
                    : question.questionText;
                pdf.setFont('helvetica', 'normal');
                pdf.text(qText, margin + 15, y + 3);

                // Status badge
                if (question.answerStatus && question.answerStatus !== 'NotEvaluated') {
                    pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text(statusText, pageWidth - margin - 30, y + 3);
                }
                
                y += 12;

                // Scores row
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(9);
                pdf.setTextColor(80, 80, 80);
                pdf.text(`Content: ${Math.round(question.contentScore || 0)}%`, margin + 3, y);
                pdf.text(`Speech: ${Math.round(question.speechScore)}%`, margin + 40, y);
                pdf.text(`Visual: ${Math.round(question.visualScore)}%`, margin + 77, y);
                pdf.text(`Smile: ${Math.round(question.smileScore)}%`, margin + 110, y);
                pdf.text(`Nods: ${question.nodCount}`, margin + 143, y);
                y += 6;

                // User's answer
                if (question.answerText) {
                    pdf.setTextColor(60, 60, 60);
                    pdf.setFontSize(8);
                    pdf.setFont('helvetica', 'italic');
                    const answerLines = pdf.splitTextToSize(`Your Answer: ${question.answerText}`, pageWidth - 2 * margin - 6);
                    const answerLinesToShow = answerLines.slice(0, 3); // Max 3 lines
                    answerLinesToShow.forEach((line: string) => {
                        if (y > pageHeight - 20) { pdf.addPage(); y = margin; }
                        pdf.text(line, margin + 3, y);
                        y += 4;
                    });
                    if (answerLines.length > 3) {
                        pdf.text('...', margin + 3, y);
                        y += 4;
                    }
                }

                // Ideal answer
                if (question.sampleAnswer) {
                    pdf.setTextColor(22, 163, 74);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(8);
                    if (y > pageHeight - 20) { pdf.addPage(); y = margin; }
                    pdf.text('Ideal Answer:', margin + 3, y);
                    y += 4;
                    pdf.setFont('helvetica', 'normal');
                    pdf.setTextColor(40, 40, 40);
                    const idealLines = pdf.splitTextToSize(question.sampleAnswer, pageWidth - 2 * margin - 6);
                    const idealLinesToShow = idealLines.slice(0, 3);
                    idealLinesToShow.forEach((line: string) => {
                        if (y > pageHeight - 20) { pdf.addPage(); y = margin; }
                        pdf.text(line, margin + 3, y);
                        y += 4;
                    });
                    if (idealLines.length > 3) {
                        pdf.text('...', margin + 3, y);
                        y += 4;
                    }
                }

                // AI Feedback
                if (question.feedback) {
                    pdf.setTextColor(100, 50, 150);
                    pdf.setFont('helvetica', 'italic');
                    pdf.setFontSize(8);
                    if (y > pageHeight - 20) { pdf.addPage(); y = margin; }
                    const feedbackLines = pdf.splitTextToSize(`AI Feedback: ${question.feedback}`, pageWidth - 2 * margin - 6);
                    feedbackLines.slice(0, 2).forEach((line: string) => {
                        if (y > pageHeight - 20) { pdf.addPage(); y = margin; }
                        pdf.text(line, margin + 3, y);
                        y += 4;
                    });
                }

                y += 6; // spacing between questions
            });

            // Footer on last page
            pdf.setTextColor(150, 150, 150);
            pdf.setFontSize(8);
            pdf.text(
                `Generated on ${new Date().toLocaleString()} | Report ID: ${report.reportId}`,
                margin,
                pageHeight - 10
            );

            pdf.save(`interview-report-${report.sessionId}.pdf`);
        } catch (err) {
            console.error('PDF export error:', err);
        } finally {
            setIsExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl text-white mb-2">Failed to load report</h2>
                    <p className="text-gray-400 mb-4">{error}</p>
                    <Link to="/dashboard" className="text-blue-400 hover:underline">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    // Prepare chart data
    const questionScoreData = report.questions.map((q, idx) => ({
        name: `Q${idx + 1}`,
        score: q.confidenceScore,
        speech: q.speechScore,
        visual: q.visualScore,
    }));

    const radarData = [
        { metric: 'Fluency', value: report.speechMetrics.fluencyScore },
        { metric: 'Pace', value: report.speechMetrics.paceScore },
        { metric: 'Completeness', value: report.speechMetrics.completenessScore },
        { metric: 'Eye Contact', value: report.visualMetrics.averageEyeContactScore },
        { metric: 'Expression', value: report.visualMetrics.averageSmileScore },
        { metric: 'Engagement', value: report.visualMetrics.engagementScore },
    ];

    const pieData = [
        { name: 'Speech', value: 60, color: '#3b82f6' },
        { name: 'Visual', value: 40, color: '#8b5cf6' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-8"
                >
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Dashboard
                    </button>

                    <button
                        onClick={exportToPDF}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isExporting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                        Export PDF
                    </button>
                </motion.div>

                {/* Title Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-6"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-2">
                                {report.jobTitle || 'Interview Report'}
                            </h1>
                            {report.companyName && (
                                <p className="text-gray-400">{report.companyName}</p>
                            )}
                            <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {report.durationMinutes} min
                                </span>
                                <span className="flex items-center gap-1">
                                    <MessageSquare className="w-4 h-4" />
                                    {report.questions.length} questions
                                </span>
                                <span>
                                    {new Date(report.interviewDate).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className={`text-5xl font-bold ${getGradeColor(report.grade)}`}>
                                {report.grade}
                            </div>
                            <div className="text-gray-400 text-sm mt-1">Grade</div>
                        </div>
                    </div>
                </motion.div>

                {/* Score Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-emerald-900/50 to-green-900/50 rounded-2xl p-6 border border-emerald-500/20"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <Trophy className="w-8 h-8 text-emerald-400" />
                            <span className="text-gray-300 font-medium">Overall Score</span>
                        </div>
                        <div className="text-4xl font-bold text-white">
                            {Math.round(report.overallScore)}%
                        </div>
                        <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${report.overallScore}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className="h-full bg-emerald-500 rounded-full"
                            />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-blue-900/50 to-indigo-900/50 rounded-2xl p-6 border border-blue-500/20"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <BarChart3 className="w-8 h-8 text-blue-400" />
                            <span className="text-gray-300 font-medium">Speech Score</span>
                        </div>
                        <div className="text-4xl font-bold text-white">
                            {Math.round(report.speechScore)}%
                        </div>
                        <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${report.speechScore}%` }}
                                transition={{ duration: 1, delay: 0.6 }}
                                className="h-full bg-blue-500 rounded-full"
                            />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-br from-purple-900/50 to-violet-900/50 rounded-2xl p-6 border border-purple-500/20"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <PieChart className="w-8 h-8 text-purple-400" />
                            <span className="text-gray-300 font-medium">Visual Score</span>
                        </div>
                        <div className="text-4xl font-bold text-white">
                            {Math.round(report.visualScore)}%
                        </div>
                        <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${report.visualScore}%` }}
                                transition={{ duration: 1, delay: 0.7 }}
                                className="h-full bg-purple-500 rounded-full"
                            />
                        </div>
                    </motion.div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Score Trend */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
                    >
                        <h3 className="text-lg font-semibold text-white mb-4">Score by Question</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={questionScoreData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="name" stroke="#9ca3af" />
                                <YAxis domain={[0, 100]} stroke="#9ca3af" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1f2937',
                                        border: '1px solid #374151',
                                        borderRadius: '8px',
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    dot={{ fill: '#10b981' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </motion.div>

                    {/* Radar Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
                    >
                        <h3 className="text-lg font-semibold text-white mb-4">Performance Overview</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="#374151" />
                                <PolarAngleAxis dataKey="metric" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#9ca3af' }} />
                                <Radar
                                    name="Score"
                                    dataKey="value"
                                    stroke="#8b5cf6"
                                    fill="#8b5cf6"
                                    fillOpacity={0.3}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </motion.div>
                </div>

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-green-500/20"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <h3 className="text-lg font-semibold text-white">Strengths</h3>
                        </div>
                        <ul className="space-y-3">
                            {report.strengths.map((strength, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <Star className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-300 text-sm">{strength}</span>
                                </li>
                            ))}
                            {report.strengths.length === 0 && (
                                <p className="text-gray-500 text-sm">No strengths identified yet</p>
                            )}
                        </ul>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 }}
                        className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-yellow-500/20"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-5 h-5 text-yellow-400" />
                            <h3 className="text-lg font-semibold text-white">Areas for Improvement</h3>
                        </div>
                        <ul className="space-y-3">
                            {report.improvements.map((improvement, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <TrendingUp className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-300 text-sm">{improvement}</span>
                                </li>
                            ))}
                            {report.improvements.length === 0 && (
                                <p className="text-gray-500 text-sm">Great job! No major improvements needed</p>
                            )}
                        </ul>
                    </motion.div>
                </div>

                {/* Question Breakdown */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
                >
                    <h3 className="text-lg font-semibold text-white mb-4">Question-by-Question Breakdown</h3>
                    <div className="space-y-3">
                        {report.questions.map((question, idx) => (
                            <div
                                key={question.questionId}
                                className="bg-gray-900/50 rounded-xl border border-white/5 overflow-hidden"
                            >
                                <button
                                    onClick={() => toggleQuestion(question.questionId)}
                                    className="w-full p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-gray-500 font-mono text-sm">Q{idx + 1}</span>
                                        <span className="text-gray-300 text-left text-sm line-clamp-1">
                                            {question.questionText}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {/* Answer Status Badge */}
                                        {question.answerStatus && question.answerStatus !== 'NotEvaluated' && (
                                            <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                                                question.answerStatus === 'Correct'
                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                    : question.answerStatus === 'Partial'
                                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                    : question.answerStatus === 'NotAnswered'
                                                    ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                            }`}>
                                                {question.answerStatus === 'Correct' && <CheckCircle className="w-3 h-3" />}
                                                {question.answerStatus === 'Partial' && <MinusCircle className="w-3 h-3" />}
                                                {question.answerStatus === 'Incorrect' && <XCircle className="w-3 h-3" />}
                                                {question.answerStatus === 'NotAnswered' && <AlertTriangle className="w-3 h-3" />}
                                                {question.answerStatus === 'NotAnswered' ? 'Not Answered' : question.answerStatus}
                                            </span>
                                        )}
                                        <span className={`font-semibold ${getScoreColor(question.confidenceScore)}`}>
                                            {Math.round(question.confidenceScore)}%
                                        </span>
                                        {expandedQuestions.has(question.questionId) ? (
                                            <ChevronUp className="w-4 h-4 text-gray-400" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                        )}
                                    </div>
                                </button>

                                {expandedQuestions.has(question.questionId) && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="px-4 pb-4 border-t border-white/5"
                                    >
                                        {/* Score breakdown */}
                                        {/* Answer Status Banner */}
                                        {question.answerStatus && question.answerStatus !== 'NotEvaluated' && (
                                            <div className={`pt-4 mb-3 rounded-lg p-3 flex items-center gap-3 ${
                                                question.answerStatus === 'Correct'
                                                    ? 'bg-green-900/30 border border-green-500/20'
                                                    : question.answerStatus === 'Partial'
                                                    ? 'bg-yellow-900/30 border border-yellow-500/20'
                                                    : question.answerStatus === 'NotAnswered'
                                                    ? 'bg-gray-800/50 border border-gray-600/30'
                                                    : 'bg-red-900/30 border border-red-500/20'
                                            }`}>
                                                {question.answerStatus === 'Correct' && <Award className="w-5 h-5 text-green-400" />}
                                                {question.answerStatus === 'Partial' && <MinusCircle className="w-5 h-5 text-yellow-400" />}
                                                {question.answerStatus === 'Incorrect' && <XCircle className="w-5 h-5 text-red-400" />}
                                                {question.answerStatus === 'NotAnswered' && <AlertTriangle className="w-5 h-5 text-gray-400" />}
                                                <div>
                                                    <p className={`font-semibold text-sm ${
                                                        question.answerStatus === 'Correct' ? 'text-green-400'
                                                        : question.answerStatus === 'Partial' ? 'text-yellow-400'
                                                        : question.answerStatus === 'NotAnswered' ? 'text-gray-400'
                                                        : 'text-red-400'
                                                    }`}>
                                                        {question.answerStatus === 'Correct' && '✅ Correct Answer'}
                                                        {question.answerStatus === 'Partial' && '⚠️ Partially Correct'}
                                                        {question.answerStatus === 'Incorrect' && '❌ Incorrect Answer'}
                                                        {question.answerStatus === 'NotAnswered' && '⏭️ Question Not Answered'}
                                                    </p>
                                                    <p className="text-gray-400 text-xs">
                                                        {question.answerStatus === 'NotAnswered' 
                                                            ? 'No answer was provided for this question' 
                                                            : `Content Score: ${Math.round(question.contentScore || 0)}%`
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Score breakdown */}
                                        <div className={`${!question.answerStatus || question.answerStatus === 'NotEvaluated' ? 'pt-4' : ''} grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-4`}>
                                            <div className="bg-emerald-900/30 rounded-lg p-3 border border-emerald-500/20">
                                                <p className="text-emerald-400 text-xs mb-1">Content Score</p>
                                                <p className="text-white font-semibold text-lg">{Math.round(question.contentScore || 0)}%</p>
                                            </div>
                                            <div className="bg-gray-800/50 rounded-lg p-3">
                                                <p className="text-gray-500 text-xs mb-1">Words</p>
                                                <p className="text-white font-semibold">{question.wordCount}</p>
                                            </div>
                                            <div className="bg-gray-800/50 rounded-lg p-3">
                                                <p className="text-gray-500 text-xs mb-1">WPM</p>
                                                <p className="text-white font-semibold">{Math.round(question.wpm)}</p>
                                            </div>
                                            <div className="bg-gray-800/50 rounded-lg p-3">
                                                <p className="text-gray-500 text-xs mb-1">Filler Words</p>
                                                <p className="text-white font-semibold">{question.fillerWordCount}</p>
                                            </div>
                                            <div className="bg-blue-900/30 rounded-lg p-3 border border-blue-500/20">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <Eye className="w-3 h-3 text-blue-400" />
                                                    <p className="text-blue-400 text-xs">Eye Contact</p>
                                                </div>
                                                <p className="text-white font-semibold">{Math.round(question.eyeContactScore)}%</p>
                                            </div>
                                            <div className="bg-yellow-900/30 rounded-lg p-3 border border-yellow-500/20">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <Smile className="w-3 h-3 text-yellow-400" />
                                                    <p className="text-yellow-400 text-xs">Smile</p>
                                                </div>
                                                <p className="text-white font-semibold">{Math.round(question.smileScore)}%</p>
                                            </div>
                                            <div className="bg-purple-900/30 rounded-lg p-3 border border-purple-500/20">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <Brain className="w-3 h-3 text-purple-400" />
                                                    <p className="text-purple-400 text-xs">Nods</p>
                                                </div>
                                                <p className="text-white font-semibold">{question.nodCount}</p>
                                            </div>
                                        </div>

                                        {/* AI Feedback */}
                                        {question.feedback && (
                                            <div className="bg-purple-900/20 rounded-lg p-3 mb-3 border border-purple-500/20">
                                                <p className="text-purple-400 text-xs mb-2 font-medium">🤖 AI Feedback</p>
                                                <p className="text-gray-300 text-sm">{question.feedback}</p>
                                            </div>
                                        )}

                                        {/* AI Strengths and Improvements */}
                                        {(question.strengths?.length > 0 || question.improvements?.length > 0) && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                                {question.strengths && question.strengths.length > 0 && (
                                                    <div className="bg-green-900/20 rounded-lg p-3 border border-green-500/20">
                                                        <p className="text-green-400 text-xs mb-2 font-medium">✓ What You Did Well</p>
                                                        <ul className="space-y-1">
                                                            {question.strengths.map((s, i) => (
                                                                <li key={i} className="text-gray-300 text-sm">• {s}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {question.improvements && question.improvements.length > 0 && (
                                                    <div className="bg-yellow-900/20 rounded-lg p-3 border border-yellow-500/20">
                                                        <p className="text-yellow-400 text-xs mb-2 font-medium">↗ Areas to Improve</p>
                                                        <ul className="space-y-1">
                                                            {question.improvements.map((imp, i) => (
                                                                <li key={i} className="text-gray-300 text-sm">• {imp}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {question.answerText ? (
                                            <div className="bg-gray-800/50 rounded-lg p-3 mb-3">
                                                <p className="text-gray-500 text-xs mb-2">Your Answer</p>
                                                <p className="text-gray-300 text-sm">{question.answerText}</p>
                                            </div>
                                        ) : question.answerStatus === 'NotAnswered' ? (
                                            <div className="bg-gray-800/30 rounded-lg p-3 mb-3 border border-dashed border-gray-700">
                                                <p className="text-gray-500 text-xs mb-2">Your Answer</p>
                                                <p className="text-gray-600 text-sm italic">No answer was provided</p>
                                            </div>
                                        ) : null}

                                        {question.sampleAnswer && (
                                            <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/20 rounded-lg p-4 mb-3 border border-green-500/30">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Award className="w-4 h-4 text-green-400" />
                                                    <p className="text-green-400 text-sm font-semibold">✨ Ideal / Expected Answer</p>
                                                </div>
                                                <p className="text-gray-200 text-sm leading-relaxed">{question.sampleAnswer}</p>
                                            </div>
                                        )}

                                        {question.tip && (
                                            <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-500/20">
                                                <p className="text-blue-300 text-sm">💡 {question.tip}</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default InterviewReport;
