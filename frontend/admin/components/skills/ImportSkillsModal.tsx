import React, { useState } from 'react';
import { importSkills } from '../../services/skillService';

interface ImportSkillsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportComplete: () => void;
}

const ImportSkillsModal: React.FC<ImportSkillsModalProps> = ({ isOpen, onClose, onImportComplete }) => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string>('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleImport = async () => {
        if (!file) return;
        setLoading(true);
        setError('');
        setResult('');

        try {
            const data = await importSkills(file);
            setResult(data.message);
            setTimeout(() => {
                onImportComplete();
                onClose();
                setFile(null);
                setResult('');
            }, 1500);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to import skills');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-6 rounded-lg w-full max-w-md border border-slate-700">
                <h2 className="text-xl font-bold text-white mb-4">Import Skills from CSV</h2>

                <p className="text-gray-400 text-sm mb-4">
                    CSV format must be: <br />
                    <code className="bg-slate-900 px-1 py-0.5 rounded text-emerald-400">Name,Category,Difficulty</code>
                </p>

                {error && <div className="bg-red-500/10 text-red-500 p-3 rounded mb-4 text-sm">{error}</div>}
                {result && <div className="bg-emerald-500/10 text-emerald-500 p-3 rounded mb-4 text-sm">{result}</div>}

                <div className="mb-6">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                        className="block w-full text-sm text-gray-400
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-slate-700 file:text-white
                            hover:file:bg-slate-600
                        "
                    />
                </div>

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
                        onClick={handleImport}
                        disabled={!file || loading}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Importing...' : 'Import'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportSkillsModal;
