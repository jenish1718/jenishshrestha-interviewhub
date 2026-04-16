import React, { useState, useEffect } from 'react';
import { getAllSkills, getSkillStats, Skill, SkillStats } from '../services/skillService';
import SkillStatsPanel from '../components/skills/SkillStatsPanel';
import AddSkillModal from '../components/skills/AddSkillModal';
import EditSkillModal from '../components/skills/EditSkillModal';
import DeleteSkillModal from '../components/skills/DeleteSkillModal';
import ImportSkillsModal from '../components/skills/ImportSkillsModal';

const SkillManagement: React.FC = () => {
    const [skills, setSkills] = useState<Skill[]>([]);
    const [stats, setStats] = useState<SkillStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    // Modals state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editSkill, setEditSkill] = useState<Skill | null>(null);
    const [deleteSkill, setDeleteSkill] = useState<Skill | null>(null);

    const fetchSkills = async () => {
        setLoading(true);
        try {
            const data = await getAllSkills(page, 10, search, categoryFilter);
            setSkills(data.data);
            setTotalPages(Math.ceil(data.totalCount / 10));

            // Also refresh stats
            const statsData = await getSkillStats();
            setStats(statsData);
        } catch (error) {
            console.error('Failed to fetch skills', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSkills();
    }, [page, search, categoryFilter]);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">Skills Management</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition-colors"
                    >
                        Import CSV
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded transition-colors"
                    >
                        + Add Skill
                    </button>
                </div>
            </div>

            <SkillStatsPanel stats={stats} />

            <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 mb-6">
                <div className="flex gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="Search skills..."
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <select
                        className="bg-slate-900 border border-slate-700 rounded px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        <option value="Technical">Technical</option>
                        <option value="SoftSkill">Soft Skill</option>
                        <option value="Business">Business</option>
                        <option value="Industry">Industry</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-gray-300">
                        <thead className="bg-slate-900/50 text-gray-400 text-sm uppercase">
                            <tr>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Category</th>
                                <th className="px-6 py-3">Difficulty</th>
                                <th className="px-6 py-3">Usage</th>
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-4 text-center">Loading...</td></tr>
                            ) : skills.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-4 text-center">No skills found.</td></tr>
                            ) : (
                                skills.map(skill => (
                                    <tr key={skill.skillId} className="hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">{skill.skillName}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs ${skill.category === 'Technical' ? 'bg-emerald-500/10 text-emerald-400' :
                                                    skill.category === 'SoftSkill' ? 'bg-blue-500/10 text-blue-400' :
                                                        'bg-purple-500/10 text-purple-400'
                                                }`}>
                                                {skill.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{skill.difficultyLevel}</td>
                                        <td className="px-6 py-4">{skill.usageCount}</td>
                                        <td className="px-6 py-4 text-xs">
                                            {skill.isGlobal ? (
                                                <span className="text-blue-400">Global</span>
                                            ) : (
                                                <span className="text-gray-500">Custom</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setEditSkill(skill)}
                                                className="text-blue-400 hover:text-blue-300 mr-3"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => setDeleteSkill(skill)}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-4 text-sm text-gray-400">
                    <div>Page {page} of {totalPages}</div>
                    <div className="flex gap-2">
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage(p => p - 1)}
                            className="bg-slate-900 border border-slate-700 px-3 py-1 rounded disabled:opacity-50 hover:bg-slate-700"
                        >
                            Previous
                        </button>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="bg-slate-900 border border-slate-700 px-3 py-1 rounded disabled:opacity-50 hover:bg-slate-700"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AddSkillModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSkillAdded={fetchSkills}
            />

            <EditSkillModal
                isOpen={!!editSkill}
                onClose={() => setEditSkill(null)}
                skill={editSkill}
                onSkillUpdated={fetchSkills}
            />

            <DeleteSkillModal
                isOpen={!!deleteSkill}
                onClose={() => setDeleteSkill(null)}
                skill={deleteSkill}
                onSkillDeleted={fetchSkills}
            />

            <ImportSkillsModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImportComplete={fetchSkills}
            />
        </div>
    );
};

export default SkillManagement;
