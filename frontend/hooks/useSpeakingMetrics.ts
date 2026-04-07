// useSpeakingMetrics.ts - Speaking Performance Calculator
// This hook analyzes the user's transcript to calculate speaking quality metrics:
// - Word Count: Total words spoken in the answer
// - Words Per Minute (WPM): Speaking pace (ideal: 120-160 WPM)
// - Filler Words: Counts "um", "uh", "like", "basically" etc.
// - Pause Count: Estimates pauses based on sentence breaks
// These metrics help evaluate speaking fluency and confidence.

import { useMemo } from 'react';
import { SpeakingMetrics } from '../types';

// Common filler words to detect
const FILLER_WORDS = [
    'um', 'uh', 'uhm', 'umm', 'uhh',
    'like', 'you know', 'basically',
    'actually', 'literally', 'honestly',
    'so', 'well', 'right', 'okay', 'ok',
    'i mean', 'kind of', 'sort of',
    'anyway', 'anyways'
];

interface UseSpeakingMetricsReturn {
    metrics: SpeakingMetrics;
    calculateMetrics: (transcript: string, durationSeconds: number) => SpeakingMetrics;
}

export const useSpeakingMetrics = (): UseSpeakingMetricsReturn => {
    const calculateMetrics = useMemo(() => {
        return (transcript: string, durationSeconds: number): SpeakingMetrics => {
            if (!transcript || durationSeconds <= 0) {
                return {
                    wordCount: 0,
                    wordsPerMinute: 0,
                    fillerWordCount: 0,
                    detectedFillerWords: [],
                    duration: durationSeconds,
                    pauseCount: 0,
                    totalPauseDuration: 0,
                };
            }

            const normalizedText = transcript.toLowerCase().trim();

            // Count words
            const words = normalizedText.split(/\s+/).filter(word => word.length > 0);
            const wordCount = words.length;

            // Calculate WPM
            const durationMinutes = durationSeconds / 60;
            const wordsPerMinute = durationMinutes > 0
                ? Math.round(wordCount / durationMinutes)
                : 0;

            // Detect filler words
            const detectedFillers: string[] = [];
            let fillerCount = 0;

            FILLER_WORDS.forEach(filler => {
                // Create regex that matches whole words or phrases
                const regex = new RegExp(`\\b${filler}\\b`, 'gi');
                const matches = normalizedText.match(regex);
                if (matches) {
                    fillerCount += matches.length;
                    // Add each occurrence to detected list
                    matches.forEach(() => {
                        detectedFillers.push(filler);
                    });
                }
            });

            // Estimate pauses based on punctuation and long gaps
            // This is an approximation since we don't have actual audio analysis
            const sentences = normalizedText.split(/[.!?]+/).filter(s => s.trim().length > 0);
            const pauseCount = Math.max(0, sentences.length - 1);

            // Estimate pause duration (rough approximation)
            // Average pause between sentences is about 0.5-1 second
            const estimatedPauseDuration = pauseCount * 0.75;

            return {
                wordCount,
                wordsPerMinute,
                fillerWordCount: fillerCount,
                detectedFillerWords: detectedFillers,
                duration: durationSeconds,
                pauseCount,
                totalPauseDuration: Math.round(estimatedPauseDuration),
            };
        };
    }, []);

    // Default empty metrics
    const metrics: SpeakingMetrics = {
        wordCount: 0,
        wordsPerMinute: 0,
        fillerWordCount: 0,
        detectedFillerWords: [],
        duration: 0,
        pauseCount: 0,
        totalPauseDuration: 0,
    };

    return {
        metrics,
        calculateMetrics,
    };
};

// Utility function to format duration
export const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Utility to get WPM assessment
export const getWPMAssessment = (wpm: number): { label: string; color: string } => {
    if (wpm < 100) {
        return { label: 'Slow', color: 'text-yellow-400' };
    } else if (wpm < 130) {
        return { label: 'Good', color: 'text-green-400' };
    } else if (wpm < 160) {
        return { label: 'Fast', color: 'text-orange-400' };
    } else {
        return { label: 'Too Fast', color: 'text-red-400' };
    }
};

// Utility to get filler word assessment
export const getFillerAssessment = (count: number, wordCount: number): { label: string; color: string } => {
    if (wordCount === 0) return { label: 'N/A', color: 'text-gray-400' };

    const percentage = (count / wordCount) * 100;

    if (percentage < 2) {
        return { label: 'Excellent', color: 'text-green-400' };
    } else if (percentage < 5) {
        return { label: 'Good', color: 'text-blue-400' };
    } else if (percentage < 10) {
        return { label: 'Moderate', color: 'text-yellow-400' };
    } else {
        return { label: 'High', color: 'text-red-400' };
    }
};
