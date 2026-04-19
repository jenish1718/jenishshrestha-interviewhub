import React from 'react';
import { SkillStats } from '../../services/skillService';

interface SkillStatsPanelProps {
    stats: SkillStats | null;
}

const SkillStatsPanel: React.FC<SkillStatsPanelProps> = ({ stats }) => {
    if (!stats) return <div className="text-gray-400">Loading stats...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800 p-4 rounded-lg shadow-md border border-slate-700">
                <h3 className="text-gray-400 text-sm font-medium">Total Skills</h3>
                <p className="text-2xl font-bold text-white mt-1">{stats.totalSkills}</p>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg shadow-md border border-slate-700">
                <h3 className="text-gray-400 text-sm font-medium">Technical Skills</h3>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.technicalSkills}</p>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg shadow-md border border-slate-700">
                <h3 className="text-gray-400 text-sm font-medium">Soft Skills</h3>
                <p className="text-2xl font-bold text-blue-400 mt-1">{stats.softSkills}</p>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg shadow-md border border-slate-700">
                <h3 className="text-gray-400 text-sm font-medium">Most Popular</h3>
                <p className="text-lg font-bold text-purple-400 mt-1 truncate" title={stats.mostUsedSkillName}>
                    {stats.mostUsedSkillName}
                </p>
                <p className="text-xs text-gray-500">{stats.mostUsedSkillCount} questions</p>
            </div>
        </div>
    );
};

export default SkillStatsPanel;
