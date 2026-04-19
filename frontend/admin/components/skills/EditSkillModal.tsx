import React, { useState, useEffect } from 'react';
import { updateSkill, UpdateSkillDto, Skill } from '../../services/skillService';

interface EditSkillModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSkillUpdated: () => void;
    skill: Skill | null;
}

const EditSkillModal: React.FC<EditSkillModalProps> = ({ isOpen, onClose, onSkillUpdated, skill }) => {
    const [formData, setFormData] = useState<UpdateSkillDto>({
        skillName: '',
        category: 0,
        difficultyLevel: 1,
        isGlobal: true,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (skill) {
            // Map string values back to enums if needed or handle logic
            // Since DTO expects generic text/number from the service, check mappings.
            // My service returns strings for Enums on GET, but expects ints on PUT (Create/Update Dto).
            // Need to map "Technical" -> 0.

            const mapCategory = (cat: string) => {
                const categories: { [key: string]: number } = { "Technical": 0, "SoftSkill": 1, "Business": 2, "Industry": 3 };
                return categories[cat] ?? 0;
            };
            const mapDifficulty = (diff: string) => {
                const levels: { [key: string]: number } = { "Beginner": 0, "Intermediate": 1, "Advanced": 2, "Expert": 3 };
                return levels[diff] ?? 1;
            };

            setFormData({
                skillName: skill.skillName,
                category: mapCategory(skill.category),
                difficultyLevel: mapDifficulty(skill.difficultyLevel),
                isGlobal: skill.isGlobal,
            });
        }
    }, [skill]);

    if (!isOpen || !skill) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await updateSkill(skill.skillId, formData);
            onSkillUpdated();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update skill');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-6 rounded-lg w-full max-w-md border border-slate-700">
                <h2 className="text-xl font-bold text-white mb-4">Edit Skill</h2>

                {error && <div className="bg-red-500/10 text-red-500 p-3 rounded mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-400 text-sm mb-2">Skill Name</label>
                        <input
                            type="text"
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                            value={formData.skillName}
                            onChange={(e) => setFormData({ ...formData, skillName: e.target.value })}
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-400 text-sm mb-2">Category</label>
                        <select
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: parseInt(e.target.value) })}
                        >
                            <option value={0}>Technical</option>
                            <option value={1}>Soft Skill</option>
                            <option value={2}>Business</option>
                            <option value={3}>Industry</option>
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-400 text-sm mb-2">Difficulty</label>
                        <select
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                            value={formData.difficultyLevel}
                            onChange={(e) => setFormData({ ...formData, difficultyLevel: parseInt(e.target.value) })}
                        >
                            <option value={0}>Beginner</option>
                            <option value={1}>Intermediate</option>
                            <option value={2}>Advanced</option>
                            <option value={3}>Expert</option>
                        </select>
                    </div>

                    <div className="mb-6 flex items-center">
                        <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-500 bg-slate-900 border-slate-700 rounded focus:ring-blue-500"
                            checked={formData.isGlobal}
                            onChange={(e) => setFormData({ ...formData, isGlobal: e.target.checked })}
                        />
                        <label className="ml-2 text-gray-300 text-sm">Global Skill</label>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-300 hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditSkillModal;
