import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Edit, Trash2, CheckCircle, Filter, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { getQuestions, createQuestion, updateQuestion, deleteQuestion, approveQuestion, getPendingQuctions } from "../services/questionService";
import { getAllSkills, Skill } from "../services/skillService";

const questionTypes = ["Technical", "Behavioral", "Situational", "General"];
const difficulties = ["Easy", "Medium", "Hard"];

export default function QuestionManagement() {
    const [questions, setQuestions] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [skillFilter, setSkillFilter] = useState<string>("");
    const [skills, setSkills] = useState<Skill[]>([]);
    const [approvedFilter, setApprovedFilter] = useState<string>("");
    const [showAdd, setShowAdd] = useState(false);
    const [editItem, setEditItem] = useState<any>(null);
    const [deleteItem, setDeleteItem] = useState<any>(null);
    const [showPending, setShowPending] = useState(false);
    const [form, setForm] = useState({ questionText: "", questionType: 0, difficulty: 0, sampleAnswer: "" });
    const pageSize = 10;

    const fetchSkills = async () => {
        try {
            const res = await getAllSkills(1, 100);
            setSkills(res.data || []);
        } catch { setSkills([]); }
    };

    const fetchQuestions = async () => {
        try {
            const approved = approvedFilter === "" ? undefined : approvedFilter === "true";
            const selectedSkillId = skillFilter ? parseInt(skillFilter) : undefined;
            const res = showPending
                ? await getPendingQuctions(page, pageSize)
                : await getQuestions(page, pageSize, search, "", selectedSkillId, approved);
            setQuestions(res.data || []);
            setTotalCount(res.totalCount || 0);
        } catch { setQuestions([]); }
    };

    useEffect(() => { fetchSkills(); }, []);
    useEffect(() => { fetchQuestions(); }, [page, search, skillFilter, approvedFilter, showPending]);

    const handleAdd = async () => {
        await createQuestion(form);
        setShowAdd(false);
        setForm({ questionText: "", questionType: 0, difficulty: 0, sampleAnswer: "" });
        fetchQuestions();
    };

    const handleEdit = async () => {
        if (!editItem) return;
        await updateQuestion(editItem.questionId, form);
        setEditItem(null);
        fetchQuestions();
    };

    const handleDelete = async () => {
        if (!deleteItem) return;
        await deleteQuestion(deleteItem.questionId);
        setDeleteItem(null);
        fetchQuestions();
    };

    const handleApprove = async (id: number) => {
        await approveQuestion(id);
        fetchQuestions();
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Question Bank</h1>
                <div className="flex gap-3">
                    <button onClick={() => { setShowPending(!showPending); setPage(1); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${showPending ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" : "bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10"}`}>
                        {showPending ? "Show All" : "Pending Approval"}
                    </button>
                    <button onClick={() => { setShowAdd(true); setForm({ questionText: "", questionType: 0, difficulty: 0, sampleAnswer: "" }); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition">
                        <Plus size={16} /> Add Question
                    </button>
                </div>
            </div>

            <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input type="text" placeholder="Search questions..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                </div>
                <select value={skillFilter} onChange={(e) => { setSkillFilter(e.target.value); setPage(1); }} className="px-3 py-2 bg-gray-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" style={{ colorScheme: 'dark' }}>
                    <option value="" style={{ background: '#1f2937', color: '#fff' }}>All Skills</option>
                    {skills.map(s => <option key={s.skillId} value={s.skillId.toString()} style={{ background: '#1f2937', color: '#fff' }}>{s.skillName}</option>)}
                </select>
                <select value={approvedFilter} onChange={(e) => { setApprovedFilter(e.target.value); setPage(1); }} className="px-3 py-2 bg-gray-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" style={{ colorScheme: 'dark' }}>
                    <option value="" style={{ background: '#1f2937', color: '#fff' }}>All Status</option>
                    <option value="true" style={{ background: '#1f2937', color: '#fff' }}>Approved</option>
                    <option value="false" style={{ background: '#1f2937', color: '#fff' }}>Pending</option>
                </select>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/10 text-gray-400">
                            <th className="text-left p-4">Question</th>
                            <th className="text-left p-4">Type</th>
                            <th className="text-left p-4">Difficulty</th>
                            <th className="text-left p-4">Status</th>
                            <th className="text-left p-4">Source</th>
                            <th className="text-right p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {questions.map((q: any) => (
                            <motion.tr key={q.questionId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-white/5 hover:bg-white/5 transition">
                                <td className="p-4 text-white max-w-xs truncate">{q.questionText}</td>
                                <td className="p-4"><span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">{q.questionType}</span></td>
                                <td className="p-4"><span className={`px-2 py-1 rounded text-xs ${q.difficulty === "Hard" ? "bg-red-500/20 text-red-300" : q.difficulty === "Medium" ? "bg-yellow-500/20 text-yellow-300" : "bg-green-500/20 text-green-300"}`}>{q.difficulty}</span></td>
                                <td className="p-4">{q.isApproved ? <span className="text-green-400 text-xs">✓ Approved</span> : <span className="text-yellow-400 text-xs">⏳ Pending</span>}</td>
                                <td className="p-4"><span className={`text-xs ${q.isAI ? "text-cyan-400" : "text-gray-400"}`}>{q.isAI ? "AI" : "Manual"}</span></td>
                                <td className="p-4 text-right space-x-2">
                                    {!q.isApproved && <button onClick={() => handleApprove(q.questionId)} className="text-green-400 hover:text-green-300"><CheckCircle size={16} /></button>}
                                    <button onClick={() => { setEditItem(q); setForm({ questionText: q.questionText, questionType: questionTypes.indexOf(q.questionType), difficulty: difficulties.indexOf(q.difficulty), sampleAnswer: q.sampleAnswer || "" }); }} className="text-blue-400 hover:text-blue-300"><Edit size={16} /></button>
                                    <button onClick={() => setDeleteItem(q)} className="text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
                                </td>
                            </motion.tr>
                        ))}
                        {questions.length === 0 && (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500"><HelpCircle className="mx-auto mb-2" size={24} />No questions found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 bg-white/5 border border-white/10 rounded-lg text-white disabled:opacity-30"><ChevronLeft size={16} /></button>
                    <span className="px-4 py-2 text-gray-400 text-sm">Page {page} of {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 bg-white/5 border border-white/10 rounded-lg text-white disabled:opacity-30"><ChevronRight size={16} /></button>
                </div>
            )}

            {/* Add Modal */}
            {showAdd && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg">
                        <h2 className="text-xl font-bold text-white mb-4">Add Question</h2>
                        <div className="space-y-4">
                            <textarea value={form.questionText} onChange={(e) => setForm({ ...form, questionText: e.target.value })} placeholder="Enter question text..." rows={3} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                            <div className="grid grid-cols-2 gap-4">
                                <select value={form.questionType} onChange={(e) => setForm({ ...form, questionType: parseInt(e.target.value) })} className="px-3 py-2 bg-gray-800 border border-white/10 rounded-lg text-white text-sm" style={{ colorScheme: 'dark' }}>
                                    {questionTypes.map((t, i) => <option key={t} value={i} style={{ background: '#1f2937', color: '#fff' }}>{t}</option>)}
                                </select>
                                <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: parseInt(e.target.value) })} className="px-3 py-2 bg-gray-800 border border-white/10 rounded-lg text-white text-sm" style={{ colorScheme: 'dark' }}>
                                    {difficulties.map((d, i) => <option key={d} value={i} style={{ background: '#1f2937', color: '#fff' }}>{d}</option>)}
                                </select>
                            </div>
                            <textarea value={form.sampleAnswer} onChange={(e) => setForm({ ...form, sampleAnswer: e.target.value })} placeholder="Sample answer (optional)..." rows={2} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 text-sm hover:bg-white/10">Cancel</button>
                            <button onClick={handleAdd} disabled={!form.questionText} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">Add Question</button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Edit Modal */}
            {editItem && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg">
                        <h2 className="text-xl font-bold text-white mb-4">Edit Question</h2>
                        <div className="space-y-4">
                            <textarea value={form.questionText} onChange={(e) => setForm({ ...form, questionText: e.target.value })} rows={3} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
                            <div className="grid grid-cols-2 gap-4">
                                <select value={form.questionType} onChange={(e) => setForm({ ...form, questionType: parseInt(e.target.value) })} className="px-3 py-2 bg-gray-800 border border-white/10 rounded-lg text-white text-sm" style={{ colorScheme: 'dark' }}>
                                    {questionTypes.map((t, i) => <option key={t} value={i} style={{ background: '#1f2937', color: '#fff' }}>{t}</option>)}
                                </select>
                                <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: parseInt(e.target.value) })} className="px-3 py-2 bg-gray-800 border border-white/10 rounded-lg text-white text-sm" style={{ colorScheme: 'dark' }}>
                                    {difficulties.map((d, i) => <option key={d} value={i} style={{ background: '#1f2937', color: '#fff' }}>{d}</option>)}
                                </select>
                            </div>
                            <textarea value={form.sampleAnswer} onChange={(e) => setForm({ ...form, sampleAnswer: e.target.value })} placeholder="Sample answer..." rows={2} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setEditItem(null)} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 text-sm hover:bg-white/10">Cancel</button>
                            <button onClick={handleEdit} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">Save Changes</button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteItem && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-white mb-2">Delete Question</h2>
                        <p className="text-gray-400 text-sm mb-6">Are you sure you want to delete this question? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeleteItem(null)} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 text-sm hover:bg-white/10">Cancel</button>
                            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">Delete</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
