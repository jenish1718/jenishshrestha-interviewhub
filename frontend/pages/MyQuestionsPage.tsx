import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, BookOpen, ChevronLeft, ChevronRight, Tag, Clock, Award, HelpCircle, ArrowLeft } from "lucide-react";
import {
    getMySkills,
    getMyQuestionHistory,
    getQuestionsBySkill,
    UserSkillDto,
    UserQuestionHistoryDto,
    QuestionsBySkillDto,
} from "../services/questionService";

export default function MyQuestionsPage() {
    const [skills, setSkills] = useState<UserSkillDto[]>([]);
    const [selectedSkill, setSelectedSkill] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [historyItems, setHistoryItems] = useState<UserQuestionHistoryDto[]>([]);
    const [skillQuestions, setSkillQuestions] = useState<QuestionsBySkillDto[]>([]);
    const [view, setView] = useState<"history" | "bySkill">("history");
    const [expandedId, setExpandedId] = useState<number | null>(null);

    // Load skills on mount
    useEffect(() => {
        loadSkills();
    }, []);

    // Refetch data when filters change
    useEffect(() => {
        if (view === "history") {
            loadHistory();
        } else if (view === "bySkill" && selectedSkill) {
            loadBySkill();
        }
    }, [page, search, selectedSkill, view]);

    const loadSkills = async () => {
        try {
            const res = await getMySkills();
            setSkills(res.skills || []);
        } catch { }
    };

    const loadHistory = async () => {
        setLoading(true);
        try {
            const res = await getMyQuestionHistory(search || undefined, selectedSkill || undefined, page, 10);
            setHistoryItems(res.history || []);
            setTotalPages(res.totalPages || 1);
            setTotalCount(res.totalCount || 0);
        } catch { }
        setLoading(false);
    };

    const loadBySkill = async () => {
        if (!selectedSkill) return;
        setLoading(true);
        try {
            const res = await getQuestionsBySkill(selectedSkill, search || undefined, page, 10);
            setSkillQuestions(res.questions || []);
            setTotalPages(res.totalPages || 1);
            setTotalCount(res.totalCount || 0);
        } catch { }
        setLoading(false);
    };

    const handleSkillClick = (skillId: number) => {
        setSelectedSkill(skillId);
        setView("bySkill");
        setPage(1);
        setSearch("");
    };

    const handleBackToHistory = () => {
        setView("history");
        setSelectedSkill(null);
        setPage(1);
        setSearch("");
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const difficultyColor = (d: string) => {
        switch (d) {
            case "Easy": return "bg-green-500/20 text-green-400";
            case "Medium": return "bg-yellow-500/20 text-yellow-400";
            case "Hard": return "bg-red-500/20 text-red-400";
            default: return "bg-gray-500/20 text-gray-400";
        }
    };

    const typeColor = (t: string) => {
        switch (t) {
            case "Technical": return "bg-blue-500/20 text-blue-400";
            case "Behavioral": return "bg-purple-500/20 text-purple-400";
            case "Situational": return "bg-cyan-500/20 text-cyan-400";
            default: return "bg-gray-500/20 text-gray-400";
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6">
            {/* Header */}
            <div className="max-w-6xl mx-auto">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        {view === "bySkill" && (
                            <button onClick={handleBackToHistory} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition">
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <BookOpen className="text-blue-400" size={28} />
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            {view === "history" ? "My Interview Questions" : `Questions for ${skills.find(s => s.skillId === selectedSkill)?.skillName || "Skill"}`}
                        </h1>
                    </div>
                    <p className="text-gray-400 ml-10">
                        {view === "history"
                            ? `Review all ${totalCount} questions from your past interviews`
                            : `${totalCount} questions found for this skill`}
                    </p>
                </motion.div>

                {/* Skills filter bar (always visible) */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Filter size={16} className="text-gray-400" />
                        <span className="text-gray-400 text-sm font-medium">Filter by Skill</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={handleBackToHistory}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${view === "history" && !selectedSkill ? "bg-blue-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
                        >
                            All Questions
                        </button>
                        {skills.map(skill => (
                            <button
                                key={skill.skillId}
                                onClick={() => handleSkillClick(skill.skillId)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1.5 ${selectedSkill === skill.skillId ? "bg-blue-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
                            >
                                <Tag size={12} />
                                {skill.skillName}
                                <span className="opacity-60">({skill.questionCount})</span>
                            </button>
                        ))}
                        {skills.length === 0 && (
                            <span className="text-gray-500 text-sm italic">No skills found. Complete an interview first!</span>
                        )}
                    </div>
                </motion.div>

                {/* Search bar */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            value={search}
                            onChange={handleSearchChange}
                            placeholder="Search questions..."
                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition"
                        />
                    </div>
                </motion.div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Questions list */}
                        <AnimatePresence mode="wait">
                            {view === "history" ? (
                                <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                                    {historyItems.length === 0 ? (
                                        <div className="text-center py-20">
                                            <HelpCircle className="mx-auto mb-4 text-gray-600" size={48} />
                                            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Questions Yet</h3>
                                            <p className="text-gray-500">Complete a mock interview to see your questions here.</p>
                                        </div>
                                    ) : (
                                        historyItems.map((item, i) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/[0.07] transition cursor-pointer"
                                                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <p className="text-white font-medium mb-2">{item.questionText}</p>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColor(item.questionType)}`}>{item.questionType}</span>
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColor(item.difficulty)}`}>{item.difficulty}</span>
                                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400 flex items-center gap-1">
                                                                <Tag size={10} /> {item.skillName}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <div className="flex items-center gap-1 text-gray-500 text-xs">
                                                            <Clock size={12} />
                                                            {new Date(item.askedAt).toLocaleDateString()}
                                                        </div>
                                                        {item.jobTitle && (
                                                            <p className="text-gray-500 text-xs mt-1">{item.jobTitle}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <AnimatePresence>
                                                    {expandedId === item.id && item.userAnswer && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                            <div className="mt-3 pt-3 border-t border-white/10">
                                                                <p className="text-gray-400 text-sm"><span className="text-gray-300 font-medium">Your answer:</span> {item.userAnswer}</p>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        ))
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div key="bySkill" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                                    {skillQuestions.length === 0 ? (
                                        <div className="text-center py-20">
                                            <HelpCircle className="mx-auto mb-4 text-gray-600" size={48} />
                                            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Questions Found</h3>
                                            <p className="text-gray-500">No questions for this skill yet.</p>
                                        </div>
                                    ) : (
                                        skillQuestions.map((q, i) => (
                                            <motion.div
                                                key={q.questionId}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/[0.07] transition cursor-pointer"
                                                onClick={() => setExpandedId(expandedId === q.questionId ? null : q.questionId)}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <p className="text-white font-medium mb-2">{q.questionText}</p>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColor(q.questionType)}`}>{q.questionType}</span>
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColor(q.difficulty)}`}>{q.difficulty}</span>
                                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400 flex items-center gap-1">
                                                                <Tag size={10} /> {q.skillName}
                                                            </span>
                                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-gray-300 flex items-center gap-1">
                                                                <Award size={10} /> Asked {q.usageCount}x
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${q.source === "Auto" ? "bg-emerald-500/20 text-emerald-400" : "bg-orange-500/20 text-orange-400"}`}>{q.source === "Auto" ? "AI Generated" : "Manual"}</span>
                                                        <p className="text-gray-500 text-xs mt-1">{new Date(q.generatedAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <AnimatePresence>
                                                    {expandedId === q.questionId && q.sampleAnswer && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                            <div className="mt-3 pt-3 border-t border-white/10">
                                                                <p className="text-gray-400 text-sm"><span className="text-gray-300 font-medium">Sample answer:</span> {q.sampleAnswer}</p>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        ))
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-8">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <span className="text-gray-400 text-sm">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
