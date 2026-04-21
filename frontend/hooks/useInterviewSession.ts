// useInterviewSession.ts - Interview Session State Manager
// This hook manages the entire interview session lifecycle:
// - startSession: Creates a new interview session in the backend
// - submitAnswer: Saves the user's answer with metrics to the database
// - completeSession: Ends the session and triggers report generation
// - Navigation: goToNextQuestion, goToPreviousQuestion, goToQuestion
// It communicates with the backend API using fetch() with JWT authentication.

import { useState, useCallback } from 'react';
import { InterviewSession, SessionQuestion, SubmitAnswerRequest } from '../types';

const API_BASE = 'https://jenishshrestha-interviewhub-production.up.railway.app/api';

interface UseInterviewSessionReturn {
    session: InterviewSession | null;
    isLoading: boolean;
    error: string | null;
    currentQuestion: SessionQuestion | null;
    currentQuestionIndex: number;
    startSession: (emailId: number, questionCount?: number) => Promise<void>;
    submitAnswer: (answer: SubmitAnswerRequest) => Promise<void>;
    completeSession: () => Promise<void>;
    goToNextQuestion: () => void;
    goToPreviousQuestion: () => void;
    goToQuestion: (index: number) => void;
    isFirstQuestion: boolean;
    isLastQuestion: boolean;
}

export const useInterviewSession = (): UseInterviewSessionReturn => {
    const [session, setSession] = useState<InterviewSession | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('accessToken');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    };

    const startSession = useCallback(async (emailId: number, questionCount = 10) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/sessions/start`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ emailId, questionCount }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to start session');
            }

            const data: InterviewSession = await response.json();
            // Ensure answers array is initialized even if API doesn't return it
            setSession({
                ...data,
                answers: data.answers || [],
            });
            setCurrentQuestionIndex(0);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const submitAnswer = useCallback(async (answer: SubmitAnswerRequest) => {
        if (!session) {
            setError('No active session');
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/sessions/${session.sessionId}/answer`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(answer),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to submit answer');
            }

            const savedAnswer = await response.json();

            // Update session with new answer
            setSession(prev => {
                if (!prev) return prev;

                const existingIndex = prev.answers.findIndex(a => a.questionId === answer.questionId);
                const updatedAnswers = existingIndex >= 0
                    ? prev.answers.map((a, i) => i === existingIndex ? savedAnswer : a)
                    : [...prev.answers, savedAnswer];

                return {
                    ...prev,
                    answers: updatedAnswers,
                };
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            throw err;
        }
    }, [session]);

    const completeSession = useCallback(async () => {
        if (!session) {
            setError('No active session');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE}/sessions/${session.sessionId}/complete`, {
                method: 'PUT',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to complete session');
            }

            const summary = await response.json();

            setSession(prev => prev ? {
                ...prev,
                status: 'Completed',
                endTime: new Date().toISOString(),
            } : prev);

            return summary;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [session]);

    const goToNextQuestion = useCallback(() => {
        if (!session) return;
        if (currentQuestionIndex < session.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    }, [session, currentQuestionIndex]);

    const goToPreviousQuestion = useCallback(() => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    }, [currentQuestionIndex]);

    const goToQuestion = useCallback((index: number) => {
        if (!session) return;
        if (index >= 0 && index < session.questions.length) {
            setCurrentQuestionIndex(index);
        }
    }, [session]);

    const currentQuestion = session?.questions[currentQuestionIndex] || null;
    const isFirstQuestion = currentQuestionIndex === 0;
    const isLastQuestion = session ? currentQuestionIndex === session.questions.length - 1 : false;

    return {
        session,
        isLoading,
        error,
        currentQuestion,
        currentQuestionIndex,
        startSession,
        submitAnswer,
        completeSession,
        goToNextQuestion,
        goToPreviousQuestion,
        goToQuestion,
        isFirstQuestion,
        isLastQuestion,
    };
};
