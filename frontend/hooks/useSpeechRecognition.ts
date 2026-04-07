// useSpeechRecognition.ts - Voice to Text Conversion Hook
// This hook uses the Web Speech API (built into modern browsers) to convert
// the user's spoken words into text (transcript) in real-time.
// It provides both interim results (while speaking) and final results (when done).
// The transcript is used to evaluate answer content and calculate speaking metrics.

import { useState, useCallback, useEffect, useRef } from 'react';

// Web Speech API types (not included in all TypeScript lib versions)
interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
    onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
    onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
    onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
}

interface SpeechRecognitionConstructor {
    new(): SpeechRecognitionInstance;
}

// Extend Window interface
declare global {
    interface Window {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
    }
}

interface UseSpeechRecognitionReturn {
    startListening: () => void;
    stopListening: () => void;
    stopAndGetTranscript: () => Promise<string>;
    transcript: string;
    interimTranscript: string;
    isListening: boolean;
    isSupported: boolean;
    error: string | null;
    resetTranscript: () => void;
    getTranscript: () => string;
}

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
    const transcriptRef = useRef('');

    const isSupported = typeof window !== 'undefined' &&
        (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);

    // Initialize recognition
    useEffect(() => {
        if (!isSupported) return;

        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) return;
        const recognition = new SpeechRecognitionAPI();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onerror = (event) => {
            setError(event.error);
            setIsListening(false);
        };

        recognition.onresult = (event) => {
            let finalTranscript = '';
            let interim = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalTranscript += result[0].transcript + ' ';
                } else {
                    interim += result[0].transcript;
                }
            }

            if (finalTranscript) {
                transcriptRef.current += finalTranscript;
                setTranscript(transcriptRef.current);
            }
            setInterimTranscript(interim);
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.stop();
        };
    }, [isSupported]);

    const startListening = useCallback(() => {
        if (!isSupported || !recognitionRef.current) {
            setError('Speech recognition not supported');
            return;
        }

        try {
            transcriptRef.current = '';
            setTranscript('');
            setInterimTranscript('');
            recognitionRef.current.start();
        } catch (e) {
            // Recognition might already be started
            console.error('Error starting recognition:', e);
        }
    }, [isSupported]);

    const stopListening = useCallback(() => {
        if (!recognitionRef.current) return;

        try {
            recognitionRef.current.stop();
            setInterimTranscript('');
        } catch (e) {
            console.error('Error stopping recognition:', e);
        }
    }, []);

    // Stops listening and returns the final transcript reliably
    // Waits for the onend event to fire so any final results are captured
    const stopAndGetTranscript = useCallback((): Promise<string> => {
        return new Promise((resolve) => {
            if (!recognitionRef.current) {
                resolve(transcriptRef.current);
                return;
            }

            const currentRecognition = recognitionRef.current;

            // Listen for the end event to know all results are captured
            const origOnEnd = currentRecognition.onend;
            currentRecognition.onend = (ev: Event) => {
                setIsListening(false);
                setInterimTranscript('');
                // Include any interim text that didn't finalize
                const finalText = transcriptRef.current;
                // Restore original handler
                currentRecognition.onend = origOnEnd;
                resolve(finalText);
            };

            try {
                currentRecognition.stop();
            } catch (e) {
                console.error('Error stopping recognition:', e);
                resolve(transcriptRef.current);
            }
        });
    }, []);

    const resetTranscript = useCallback(() => {
        transcriptRef.current = '';
        setTranscript('');
        setInterimTranscript('');
    }, []);

    const getTranscript = useCallback(() => {
        return transcriptRef.current;
    }, []);

    return {
        startListening,
        stopListening,
        stopAndGetTranscript,
        transcript,
        interimTranscript,
        isListening,
        isSupported,
        error,
        resetTranscript,
        getTranscript,
    };
};
