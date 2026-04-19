import React, { useState } from 'react';
import { createSkill, CreateSkillDto } from '../../services/skillService';

interface AddSkillModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSkillAdded: () => void;
}

const AddSkillModal: React.FC<AddSkillModalProps> = ({ isOpen, onClose, onSkillAdded }) => {
    const [formData, setFormData] = useState<CreateSkillDto>({
        skillName: '',
        category: 0, // Technical
        difficultyLevel: 1, // Intermediate
        isGlobal: true,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await createSkill(formData);
            onSkillAdded();
            onClose();
            // Reset form
            setFormData({
                skillName: '',
                category: 0,
                difficultyLevel: 1,
                isGlobal: true,
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to add skill');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-6 rounded-lg w-full max-w-md border border-slate-700">
                <h2 className="text-xl font-bold text-white mb-4">Add New Skill</h2>

                {error && <div className="bg-red-500/10 text-red-500 p-3 rounded mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-400 text-sm mb-2">Skill Name</label>
                        <input
                            type="text"
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-emerald-500"
                            value={formData.skillName}
                            onChange={(e) => setFormData({ ...formData, skillName: e.target.value })}
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-400 text-sm mb-2">Category</label>
                        <select
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-emerald-500"
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
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-emerald-500"
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
                            className="w-4 h-4 text-emerald-500 bg-slate-900 border-slate-700 rounded focus:ring-emerald-500"
                            checked={formData.isGlobal}
                            onChange={(e) => setFormData({ ...formData, isGlobal: e.target.checked })}
                            disabled // Manual adds are usually global
                        />
                        <label className="ml-2 text-gray-300 text-sm">Global Skill (Available to all)</label>
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
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Adding...' : 'Add Skill'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddSkillModal;
