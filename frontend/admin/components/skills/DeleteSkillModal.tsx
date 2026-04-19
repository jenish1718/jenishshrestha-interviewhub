import React, { useState } from 'react';
import { deleteSkill, Skill } from '../../services/skillService';

interface DeleteSkillModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSkillDeleted: () => void;
    skill: Skill | null;
}

const DeleteSkillModal: React.FC<DeleteSkillModalProps> = ({ isOpen, onClose, onSkillDeleted, skill }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen || !skill) return null;

    const handleDelete = async () => {
        setLoading(true);
        setError('');
        try {
            await deleteSkill(skill.skillId);
            onSkillDeleted();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete skill');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-6 rounded-lg w-full max-w-md border border-slate-700">
                <h2 className="text-xl font-bold text-white mb-4">Delete Skill</h2>

                <p className="text-gray-300 mb-6">
                    Are you sure you want to delete <span className="font-bold text-white">{skill.skillName}</span>?
                    This action cannot be undone.
                </p>

                {error && <div className="bg-red-500/10 text-red-500 p-3 rounded mb-4 text-sm">{error}</div>}

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-300 hover:text-white"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={loading}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteSkillModal;
