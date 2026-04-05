import React from 'react';
import { motion } from 'framer-motion';
import { Smile, Eye, ArrowUpDown, Brain } from 'lucide-react';

interface ConfidenceMetrics {
    smileScore: number;
    eyeContactScore: number;
    nodCount: number;
    headPoseScore: number;
}

interface ConfidenceIndicatorsProps {
    metrics: ConfidenceMetrics;
    isAnalyzing: boolean;
    className?: string;
    compact?: boolean;
}

const getScoreColor = (score: number): string => {
    if (score >= 70) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
};

const getScoreBackground = (score: number): string => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
};

const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
};

interface IndicatorProps {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    maxValue?: number;
    isPercentage?: boolean;
    emoji?: string;
}

const Indicator: React.FC<IndicatorProps> = ({
    icon,
    label,
    value,
    maxValue = 100,
    isPercentage = true,
    emoji,
}) => {
    const numericValue = typeof value === 'number' ? value : 0;
    const percentage = (numericValue / maxValue) * 100;

    return (
        <div className="bg-gray-800/50 rounded-xl p-3 border border-white/5">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-gray-400">{icon}</span>
                    <span className="text-gray-300 text-sm font-medium">{label}</span>
                </div>
                <div className={`flex items-center gap-1 ${getScoreColor(numericValue)}`}>
                    {emoji && <span className="text-lg">{emoji}</span>}
                    <span className="font-semibold">
                        {isPercentage ? `${numericValue}%` : value}
                    </span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percentage, 100)}%` }}
                    transition={{ duration: 0.3 }}
                    className={`h-full rounded-full ${getScoreBackground(numericValue)}`}
                />
            </div>

            <div className="mt-1 text-right">
                <span className={`text-xs ${getScoreColor(numericValue)}`}>
                    {getScoreLabel(numericValue)}
                </span>
            </div>
        </div>
    );
};

const ConfidenceIndicators: React.FC<ConfidenceIndicatorsProps> = ({
    metrics,
    isAnalyzing,
    className = '',
    compact = false,
}) => {
    // Calculate overall confidence score
    const overallScore = Math.round(
        (metrics.smileScore * 0.3) +
        (metrics.eyeContactScore * 0.5) +
        (Math.min(metrics.nodCount, 5) * 20 * 0.2)
    );

    if (compact) {
        return (
            <div className={`flex items-center gap-4 ${className}`}>
                <div className="flex items-center gap-2">
                    <Smile className={`w-4 h-4 ${getScoreColor(metrics.smileScore)}`} />
                    <span className={`text-sm font-medium ${getScoreColor(metrics.smileScore)}`}>
                        {metrics.smileScore}%
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Eye className={`w-4 h-4 ${getScoreColor(metrics.eyeContactScore)}`} />
                    <span className={`text-sm font-medium ${getScoreColor(metrics.eyeContactScore)}`}>
                        {metrics.eyeContactScore}%
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-blue-400">
                        {metrics.nodCount}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Overall Score */}
            {isAnalyzing && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl p-4 border border-purple-500/20"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Brain className="w-5 h-5 text-purple-400" />
                            <span className="text-white font-semibold">Overall Confidence</span>
                        </div>
                        <span className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
                            {overallScore}%
                        </span>
                    </div>
                    <div className="h-3 bg-gray-700/50 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${overallScore}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                        />
                    </div>
                </motion.div>
            )}

            {/* Individual Metrics */}
            <div className="grid grid-cols-2 gap-3">
                <Indicator
                    icon={<Smile className="w-4 h-4" />}
                    label="Smile"
                    value={metrics.smileScore}
                    emoji="😊"
                />
                <Indicator
                    icon={<Eye className="w-4 h-4" />}
                    label="Eye Contact"
                    value={metrics.eyeContactScore}
                    emoji="👁️"
                />
                <Indicator
                    icon={<ArrowUpDown className="w-4 h-4" />}
                    label="Head Nods"
                    value={metrics.nodCount}
                    maxValue={10}
                    isPercentage={false}
                    emoji="👍"
                />
                <Indicator
                    icon={<Brain className="w-4 h-4" />}
                    label="Head Pose"
                    value={metrics.headPoseScore}
                    emoji="🎯"
                />
            </div>

            {/* Tips */}
            {isAnalyzing && (
                <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-500/20">
                    <p className="text-blue-300 text-sm">
                        {metrics.eyeContactScore < 50 && '💡 Try to look at the camera more often'}
                        {metrics.eyeContactScore >= 50 && metrics.smileScore < 40 && '💡 A natural smile can help you appear more confident'}
                        {metrics.eyeContactScore >= 50 && metrics.smileScore >= 40 && metrics.nodCount === 0 && '💡 Subtle head nods show active listening'}
                        {metrics.eyeContactScore >= 50 && metrics.smileScore >= 40 && metrics.nodCount > 0 && '✨ Great job! Keep up the positive body language'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default ConfidenceIndicators;
