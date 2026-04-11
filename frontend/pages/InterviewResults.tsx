import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Trophy,
    Clock,
    MessageSquare,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    ArrowLeft,
    BarChart3,
    Target,
    Zap,
    Volume2,
    Loader2,
    Smile,
    Eye,
    Brain
} from 'lucide-react';
import { SessionSummary, SessionAnswer, SessionQuestion } from '../types';
import { formatDuration, getWPMAssessment, getFillerAssessment } from '../hooks';

const API_BASE = 'http://localhost:5052/api';

interface SessionData {
    sessionId: number;
    emailId: number;
    jobTitle?: string;
    companyName?: string;
    startTime: string;
    endTime?: string;
    status: string;
    totalQuestions: number;
    currentQuestionIndex: number;
    questions: SessionQuestion[];
    answers: SessionAnswer[];
}

const InterviewResults: React.FC = () => {
    const { emailId, sessionId } = useParams<{ emailId: string; sessionId: string }>();
    const navigate = useNavigate();

    const [sessionData, setSessionData] = useState<SessionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const response = await fetch(`${API_BASE}/sessions/${sessionId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch session data');
                }

                const data = await response.json();
                setSessionData(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        if (sessionId) {
            fetchSession();
        }
    }, [sessionId]);

    const toggleQuestion = (questionId: number) => {
        setExpandedQuestions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(questionId)) {
                newSet.delete(questionId);
            } else {
                newSet.add(questionId);
            }
            return newSet;
        });
    };

    // Calculate summary statistics
    const calculateSummary = (): SessionSummary | null => {
        if (!sessionData) return null;

        const answers = sessionData.answers;
        const startTime = new Date(sessionData.startTime);
        const endTime = sessionData.endTime ? new Date(sessionData.endTime) : new Date();

        return {
            sessionId: sessionData.sessionId,
            jobTitle: sessionData.jobTitle,
            companyName: sessionData.companyName,
            startTime: sessionData.startTime,
            endTime: sessionData.endTime,
            totalDurationMinutes: Math.floor((endTime.getTime() - startTime.getTime()) / 60000),
            totalQuestions: sessionData.totalQuestions,
            questionsAnswered: answers.length,
            averageWPM: answers.length > 0
                ? Math.round(answers.reduce((sum, a) => sum + a.speakingPaceWPM, 0) / answers.length)
                : 0,
            totalFillerWords: answers.reduce((sum, a) => sum + a.fillerWordCount, 0),
            totalWordCount: answers.reduce((sum, a) => sum + a.wordCount, 0),
            averageAnswerDuration: answers.length > 0
                ? Math.round(answers.reduce((sum, a) => sum + a.audioDuration, 0) / answers.length)
                : 0,
        };
    };

    const summary = calculateSummary();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-brand-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading results...</p>
                </div>
            </div>
        );
    }

    if (error || !sessionData || !summary) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Error Loading Results</h2>
                    <p className="text-gray-400 mb-6">{error || 'Session not found'}</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-3 rounded-xl bg-brand-500 text-white hover:bg-brand-600 transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const wpmAssessment = getWPMAssessment(summary.averageWPM);
    const fillerAssessment = getFillerAssessment(summary.totalFillerWords, summary.totalWordCount);
    const completionRate = Math.round((summary.questionsAnswered / summary.totalQuestions) * 100);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 pb-12">
            {/* Header */}
            <header className="glass border-b border-gray-800/50">
                <div className="max-w-5xl mx-auto px-4 py-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Dashboard
                    </button>

                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">Interview Complete!</h1>
                            {summary.jobTitle && (
                                <p className="text-gray-400">
                                    {summary.jobTitle}
                                    {summary.companyName && <> at {summary.companyName}</>}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/20 border border-green-500/30">
                            <Trophy className="w-5 h-5 text-green-400" />
                            <span className="text-green-400 font-medium">Completed</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass rounded-2xl p-6 border border-gray-800/50"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-brand-400" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">{summary.totalDurationMinutes} min</p>
                        <p className="text-gray-500 text-sm">Total Duration</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass rounded-2xl p-6 border border-gray-800/50"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                                <Target className="w-5 h-5 text-green-400" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">{completionRate}%</p>
                        <p className="text-gray-500 text-sm">Completion Rate</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass rounded-2xl p-6 border border-gray-800/50"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-purple-400" />
                            </div>
                        </div>
                        <p className={`text-3xl font-bold mb-1 ${wpmAssessment.color}`}>{summary.averageWPM}</p>
                        <p className="text-gray-500 text-sm">Average WPM</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="glass rounded-2xl p-6 border border-gray-800/50"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                                <MessageSquare className="w-5 h-5 text-yellow-400" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">{summary.totalWordCount}</p>
                        <p className="text-gray-500 text-sm">Total Words</p>
                    </motion.div>
                </div>

                {/* Performance Overview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass rounded-2xl p-6 border border-gray-800/50 mb-8"
                >
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-brand-400" />
                        Performance Overview
                    </h2>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Speaking Pace */}
                        <div className="p-4 rounded-xl bg-gray-800/50">
                            <p className="text-gray-400 text-sm mb-2">Speaking Pace</p>
                            <div className="flex items-end gap-2 mb-2">
                                <span className={`text-2xl font-bold ${wpmAssessment.color}`}>
                                    {summary.averageWPM} WPM
                                </span>
                                <span className={`text-sm pb-0.5 ${wpmAssessment.color}`}>
                                    ({wpmAssessment.label})
                                </span>
                            </div>
                            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${summary.averageWPM < 100 ? 'bg-yellow-500' :
                                        summary.averageWPM < 160 ? 'bg-green-500' : 'bg-red-500'
                                        }`}
                                    style={{ width: `${Math.min((summary.averageWPM / 200) * 100, 100)}%` }}
                                />
                            </div>
                            <p className="text-gray-500 text-xs mt-2">Ideal: 120-150 WPM</p>
                        </div>

                        {/* Filler Words */}
                        <div className="p-4 rounded-xl bg-gray-800/50">
                            <p className="text-gray-400 text-sm mb-2">Filler Words</p>
                            <div className="flex items-end gap-2 mb-2">
                                <span className={`text-2xl font-bold ${fillerAssessment.color}`}>
                                    {summary.totalFillerWords}
                                </span>
                                <span className={`text-sm pb-0.5 ${fillerAssessment.color}`}>
                                    ({fillerAssessment.label})
                                </span>
                            </div>
                            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${summary.totalFillerWords < 5 ? 'bg-green-500' :
                                        summary.totalFillerWords < 15 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                    style={{ width: `${Math.min((summary.totalFillerWords / 30) * 100, 100)}%` }}
                                />
                            </div>
                            <p className="text-gray-500 text-xs mt-2">Lower is better</p>
                        </div>

                        {/* Answer Length */}
                        <div className="p-4 rounded-xl bg-gray-800/50">
                            <p className="text-gray-400 text-sm mb-2">Avg. Answer Duration</p>
                            <div className="flex items-end gap-2 mb-2">
                                <span className="text-2xl font-bold text-white">
                                    {formatDuration(summary.averageAnswerDuration)}
                                </span>
                            </div>
                            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-brand-500"
                                    style={{ width: `${Math.min((summary.averageAnswerDuration / 180) * 100, 100)}%` }}
                                />
                            </div>
                            <p className="text-gray-500 text-xs mt-2">Ideal: 1-3 minutes</p>
                        </div>
                    </div>
                </motion.div>

                {/* Confidence Overview - Visual Metrics */}
                {sessionData.answers.some(a => a.smileScore !== undefined) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55 }}
                        className="glass rounded-2xl p-6 border border-gray-800/50 mb-8"
                    >
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Brain className="w-5 h-5 text-purple-400" />
                            Confidence Analysis
                        </h2>

                        <div className="grid md:grid-cols-3 gap-6">
                            {/* Smile Score */}
                            <div className="p-4 rounded-xl bg-gray-800/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <Smile className="w-5 h-5 text-yellow-400" />
                                    <p className="text-gray-400 text-sm">Avg. Smile Score</p>
                                </div>
                                <div className="flex items-end gap-2 mb-2">
                                    <span className={`text-2xl font-bold ${(() => {
                                        const avgSmile = Math.round(
                                            sessionData.answers.reduce((sum, a) => sum + (a.smileScore || 0), 0) /
                                            sessionData.answers.filter(a => a.smileScore !== undefined).length || 0
                                        );
                                        return avgSmile >= 60 ? 'text-green-400' : avgSmile >= 40 ? 'text-yellow-400' : 'text-red-400';
                                    })()
                                        }`}>
                                        {Math.round(
                                            sessionData.answers.reduce((sum, a) => sum + (a.smileScore || 0), 0) /
                                            Math.max(sessionData.answers.filter(a => a.smileScore !== undefined).length, 1)
                                        )}%
                                    </span>
                                </div>
                                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-yellow-500"
                                        style={{
                                            width: `${Math.round(
                                                sessionData.answers.reduce((sum, a) => sum + (a.smileScore || 0), 0) /
                                                Math.max(sessionData.answers.filter(a => a.smileScore !== undefined).length, 1)
                                            )}%`
                                        }}
                                    />
                                </div>
                                <p className="text-gray-500 text-xs mt-2">Natural smiling shows confidence</p>
                            </div>

                            {/* Eye Contact Score */}
                            <div className="p-4 rounded-xl bg-gray-800/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <Eye className="w-5 h-5 text-blue-400" />
                                    <p className="text-gray-400 text-sm">Avg. Eye Contact</p>
                                </div>
                                <div className="flex items-end gap-2 mb-2">
                                    <span className={`text-2xl font-bold ${(() => {
                                        const avgEye = Math.round(
                                            sessionData.answers.reduce((sum, a) => sum + (a.eyeContactScore || 0), 0) /
                                            sessionData.answers.filter(a => a.eyeContactScore !== undefined).length || 0
                                        );
                                        return avgEye >= 60 ? 'text-green-400' : avgEye >= 40 ? 'text-yellow-400' : 'text-red-400';
                                    })()
                                        }`}>
                                        {Math.round(
                                            sessionData.answers.reduce((sum, a) => sum + (a.eyeContactScore || 0), 0) /
                                            Math.max(sessionData.answers.filter(a => a.eyeContactScore !== undefined).length, 1)
                                        )}%
                                    </span>
                                </div>
                                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-blue-500"
                                        style={{
                                            width: `${Math.round(
                                                sessionData.answers.reduce((sum, a) => sum + (a.eyeContactScore || 0), 0) /
                                                Math.max(sessionData.answers.filter(a => a.eyeContactScore !== undefined).length, 1)
                                            )}%`
                                        }}
                                    />
                                </div>
                                <p className="text-gray-500 text-xs mt-2">Look at the camera to engage</p>
                            </div>

                            {/* Total Nods */}
                            <div className="p-4 rounded-xl bg-gray-800/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <Brain className="w-5 h-5 text-purple-400" />
                                    <p className="text-gray-400 text-sm">Total Head Nods</p>
                                </div>
                                <div className="flex items-end gap-2 mb-2">
                                    <span className="text-2xl font-bold text-purple-400">
                                        {sessionData.answers.reduce((sum, a) => sum + (a.nodCount || 0), 0)}
                                    </span>
                                </div>
                                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-purple-500"
                                        style={{ width: `${Math.min(sessionData.answers.reduce((sum, a) => sum + (a.nodCount || 0), 0) * 10, 100)}%` }}
                                    />
                                </div>
                                <p className="text-gray-500 text-xs mt-2">Nods show engagement</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Question by Question Breakdown */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="glass rounded-2xl p-6 border border-gray-800/50"
                >
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        Question Breakdown
                    </h2>

                    <div className="space-y-4">
                        {sessionData.questions.map((question, index) => {
                            const answer = sessionData.answers.find(a => a.questionId === question.questionId);
                            const isExpanded = expandedQuestions.has(question.questionId);
                            const answerWpm = answer?.speakingPaceWPM || 0;
                            const answerWpmAssessment = getWPMAssessment(answerWpm);

                            return (
                                <motion.div
                                    key={question.questionId}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1 * index }}
                                    className="rounded-xl border border-gray-800 overflow-hidden"
                                >
                                    <button
                                        onClick={() => toggleQuestion(question.questionId)}
                                        className="w-full p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 font-medium">
                                                {index + 1}
                                            </span>
                                            <div className="text-left">
                                                <p className="text-white font-medium line-clamp-1">
                                                    {question.questionText}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${question.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                                                        question.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                            'bg-red-500/20 text-red-400'
                                                        }`}>
                                                        {question.difficulty}
                                                    </span>
                                                    <span className="text-xs text-gray-500">{question.questionType}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {answer ? (
                                                <CheckCircle className="w-5 h-5 text-green-400" />
                                            ) : (
                                                <span className="text-xs text-gray-500">Not answered</span>
                                            )}
                                            {isExpanded ? (
                                                <ChevronUp className="w-5 h-5 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                    </button>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-gray-800 p-4 bg-gray-800/30"
                                        >
                                            {answer ? (
                                                <>
                                                    {/* Answer Metrics */}
                                                    <div className="grid grid-cols-4 gap-4 mb-4">
                                                        <div className="text-center p-3 rounded-lg bg-gray-800/50">
                                                            <p className="text-gray-500 text-xs mb-1">Duration</p>
                                                            <p className="text-white font-bold">{formatDuration(answer.audioDuration)}</p>
                                                        </div>
                                                        <div className="text-center p-3 rounded-lg bg-gray-800/50">
                                                            <p className="text-gray-500 text-xs mb-1">Words</p>
                                                            <p className="text-white font-bold">{answer.wordCount}</p>
                                                        </div>
                                                        <div className="text-center p-3 rounded-lg bg-gray-800/50">
                                                            <p className="text-gray-500 text-xs mb-1">WPM</p>
                                                            <p className={`font-bold ${answerWpmAssessment.color}`}>
                                                                {Math.round(answer.speakingPaceWPM)}
                                                            </p>
                                                        </div>
                                                        <div className="text-center p-3 rounded-lg bg-gray-800/50">
                                                            <p className="text-gray-500 text-xs mb-1">Fillers</p>
                                                            <p className="text-white font-bold">{answer.fillerWordCount}</p>
                                                        </div>
                                                    </div>

                                                    {/* Transcript */}
                                                    <div>
                                                        <p className="text-gray-400 text-sm mb-2">Your Answer:</p>
                                                        <p className="text-gray-300 text-sm leading-relaxed p-4 rounded-lg bg-gray-800/50">
                                                            {answer.transcriptText || 'No transcript available'}
                                                        </p>
                                                    </div>

                                                    {/* Filler Words Detected */}
                                                    {answer.detectedFillerWords && (
                                                        <div className="mt-4">
                                                            <p className="text-gray-400 text-sm mb-2">Detected Filler Words:</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {JSON.parse(answer.detectedFillerWords).map((word: string, i: number) => (
                                                                    <span
                                                                        key={i}
                                                                        className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs"
                                                                    >
                                                                        {word}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <p className="text-gray-500 italic">This question was skipped.</p>
                                            )}

                                            {/* Sample Answer (if available) */}
                                            {question.sampleAnswer && (
                                                <div className="mt-4 pt-4 border-t border-gray-700">
                                                    <p className="text-gray-400 text-sm mb-2 flex items-center gap-2">
                                                        <Volume2 className="w-4 h-4" />
                                                        Sample Answer Hint:
                                                    </p>
                                                    <p className="text-gray-500 text-sm italic">{question.sampleAnswer}</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <div className="mt-8 flex justify-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-3 rounded-xl bg-gray-800 text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Dashboard
                    </button>
                    <button
                        onClick={() => navigate(`/report/${sessionId}`)}
                        className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white transition-colors flex items-center gap-2"
                    >
                        <BarChart3 className="w-5 h-5" />
                        View Full Report
                    </button>
                    <button
                        onClick={() => navigate(`/interview/${emailId}`)}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-accent-purple text-white hover:shadow-lg hover:shadow-brand-500/25 transition-all"
                    >
                        Practice Again
                    </button>
                </div>
            </main>
        </div>
    );
};

export default InterviewResults;
