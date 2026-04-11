import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play,
    Pause,
    Square,
    Mic,
    MicOff,
    SkipForward,
    ChevronLeft,
    ChevronRight,
    Volume2,
    VolumeX,
    Clock,
    Target,
    AlertCircle,
    CheckCircle,
    Loader2,
    Settings,
    X,
    ArrowLeft,
    Zap,
    TrendingUp,
    MessageSquare,
    Camera,
    Keyboard,
    Edit3,
    Send
} from 'lucide-react';
import {
    useSpeechSynthesis,
    useSpeechRecognition,
    useSpeakingMetrics,
    useInterviewSession,
    useWebcam,
    useConfidenceAnalysis,
    formatDuration,
    getWPMAssessment,
    getFillerAssessment
} from '../hooks';
import WebcamFeed from '../components/WebcamFeed';
import ConfidenceIndicators from '../components/ConfidenceIndicators';

// Pre-Interview Screen Component
const PreInterviewScreen: React.FC<{
    jobTitle?: string;
    companyName?: string;
    questionCount: number;
    setQuestionCount: (count: number) => void;
    onStart: () => void;
    isLoading: boolean;
}> = ({ jobTitle, companyName, questionCount, setQuestionCount, onStart, isLoading }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4"
        >
            <div className="max-w-2xl w-full">
                <div className="glass rounded-3xl p-8 border border-gray-800/50">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-purple mb-4">
                            <Target className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Mock Interview</h1>
                        {jobTitle && (
                            <p className="text-gray-400">
                                Practicing for <span className="text-brand-400 font-medium">{jobTitle}</span>
                                {companyName && <> at <span className="text-brand-400 font-medium">{companyName}</span></>}
                            </p>
                        )}
                    </div>

                    {/* Instructions */}
                    <div className="space-y-4 mb-8">
                        <h2 className="text-lg font-semibold text-white mb-4">Before You Begin</h2>

                        <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-800/50">
                            <Volume2 className="w-5 h-5 text-brand-400 mt-0.5" />
                            <div>
                                <p className="text-gray-300 font-medium">Audio Playback</p>
                                <p className="text-gray-500 text-sm">Questions will be read aloud using text-to-speech. Adjust volume as needed.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-800/50">
                            <Mic className="w-5 h-5 text-green-400 mt-0.5" />
                            <div>
                                <p className="text-gray-300 font-medium">Voice or Type</p>
                                <p className="text-gray-500 text-sm">Answer using voice recording or type your response. Switch between modes anytime.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-800/50">
                            <Zap className="w-5 h-5 text-yellow-400 mt-0.5" />
                            <div>
                                <p className="text-gray-300 font-medium">AI-Generated Questions</p>
                                <p className="text-gray-500 text-sm">Questions are generated in real-time based on the job description skills.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-900/20 border border-amber-600/30">
                            <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
                            <div>
                                <p className="text-amber-300 font-medium">Browser Requirement</p>
                                <p className="text-amber-400/70 text-sm">Speech features work best in Chrome or Edge. Safari has limited support.</p>
                            </div>
                        </div>
                    </div>

                    {/* Question Count Selector */}
                    <div className="mb-8">
                        <label className="block text-gray-400 text-sm mb-2">Number of Questions</label>
                        <div className="flex gap-2">
                            {[5, 10, 15, 20].map(count => (
                                <button
                                    key={count}
                                    onClick={() => setQuestionCount(count)}
                                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${questionCount === count
                                        ? 'bg-gradient-to-r from-brand-500 to-accent-purple text-white'
                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                        }`}
                                >
                                    {count}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Start Button */}
                    <button
                        onClick={onStart}
                        disabled={isLoading}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-500 to-accent-purple text-white font-semibold text-lg flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-brand-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Generating Questions...
                            </>
                        ) : (
                            <>
                                <Play className="w-5 h-5" />
                                Begin Interview
                            </>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// Recording Indicator Component
const RecordingIndicator: React.FC<{ isRecording: boolean }> = ({ isRecording }) => {
    if (!isRecording) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30"
        >
            <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-red-500"
            />
            <span className="text-red-400 text-sm font-medium">Recording</span>
        </motion.div>
    );
};

// Metrics Display Component
const MetricsPanel: React.FC<{
    wordCount: number;
    wpm: number;
    fillerCount: number;
    duration: number;
}> = ({ wordCount, wpm, fillerCount, duration }) => {
    const wpmAssessment = getWPMAssessment(wpm);
    const fillerAssessment = getFillerAssessment(fillerCount, wordCount);

    return (
        <div className="grid grid-cols-4 gap-4 p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
            <div className="text-center">
                <p className="text-gray-500 text-xs mb-1">Words</p>
                <p className="text-white font-bold text-xl">{wordCount}</p>
            </div>
            <div className="text-center">
                <p className="text-gray-500 text-xs mb-1">WPM</p>
                <p className={`font-bold text-xl ${wpmAssessment.color}`}>{wpm}</p>
                <p className={`text-xs ${wpmAssessment.color}`}>{wpmAssessment.label}</p>
            </div>
            <div className="text-center">
                <p className="text-gray-500 text-xs mb-1">Fillers</p>
                <p className={`font-bold text-xl ${fillerAssessment.color}`}>{fillerCount}</p>
                <p className={`text-xs ${fillerAssessment.color}`}>{fillerAssessment.label}</p>
            </div>
            <div className="text-center">
                <p className="text-gray-500 text-xs mb-1">Duration</p>
                <p className="text-white font-bold text-xl">{formatDuration(Math.floor(duration))}</p>
            </div>
        </div>
    );
};

// Voice Settings Modal
const VoiceSettingsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    voices: SpeechSynthesisVoice[];
    selectedVoice: SpeechSynthesisVoice | null;
    onSelectVoice: (voice: SpeechSynthesisVoice) => void;
    rate: number;
    onSetRate: (rate: number) => void;
    autoPlay: boolean;
    onSetAutoPlay: (autoPlay: boolean) => void;
}> = ({ isOpen, onClose, voices, selectedVoice, onSelectVoice, rate, onSetRate, autoPlay, onSetAutoPlay }) => {
    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-800"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Voice Settings</h3>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Voice Selection */}
                <div className="mb-6">
                    <label className="block text-gray-400 text-sm mb-2">Voice</label>
                    <select
                        value={selectedVoice?.name || ''}
                        onChange={e => {
                            const voice = voices.find(v => v.name === e.target.value);
                            if (voice) onSelectVoice(voice);
                        }}
                        className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-brand-500"
                    >
                        {voices.map(voice => (
                            <option key={voice.name} value={voice.name}>
                                {voice.name} ({voice.lang})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Speed Control */}
                <div className="mb-6">
                    <label className="block text-gray-400 text-sm mb-2">Speed: {rate}x</label>
                    <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.25"
                        value={rate}
                        onChange={e => onSetRate(parseFloat(e.target.value))}
                        className="w-full accent-brand-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0.5x</span>
                        <span>1x</span>
                        <span>1.5x</span>
                        <span>2x</span>
                    </div>
                </div>

                {/* Auto-play Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/50">
                    <div>
                        <p className="text-white font-medium">Auto-play Questions</p>
                        <p className="text-gray-500 text-sm">Automatically read questions aloud</p>
                    </div>
                    <button
                        onClick={() => onSetAutoPlay(!autoPlay)}
                        className={`w-12 h-6 rounded-full transition-colors ${autoPlay ? 'bg-brand-500' : 'bg-gray-700'
                            }`}
                    >
                        <motion.div
                            animate={{ x: autoPlay ? 24 : 2 }}
                            className="w-5 h-5 rounded-full bg-white"
                        />
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// Main Interview Component
const MockInterview: React.FC = () => {
    const { emailId } = useParams<{ emailId: string }>();
    const navigate = useNavigate();

    // Session state
    const {
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
        isFirstQuestion,
        isLastQuestion,
    } = useInterviewSession();

    // Speech hooks
    const {
        speak,
        pause: pauseSpeech,
        resume: resumeSpeech,
        stop: stopSpeech,
        isSpeaking,
        isPaused: isSpeechPaused,
        voices,
        selectedVoice,
        setSelectedVoice,
        rate: speechRate,
        setRate: setSpeechRate,
        isSupported: isTTSSupported,
    } = useSpeechSynthesis();

    const {
        startListening,
        stopListening,
        stopAndGetTranscript,
        transcript,
        interimTranscript,
        isListening,
        isSupported: isSTTSupported,
        resetTranscript,
        getTranscript,
    } = useSpeechRecognition();

    const { calculateMetrics } = useSpeakingMetrics();

    // Webcam hook
    const {
        videoRef,
        isActive: isCameraActive,
        isLoading: isCameraLoading,
        error: cameraError,
        hasPermission: hasCameraPermission,
        startCamera,
        stopCamera,
        toggleCamera,
    } = useWebcam();

    // Confidence analysis hook
    const {
        metrics: confidenceMetrics,
        isAnalyzing: isAnalyzingConfidence,
        startAnalysis: startConfidenceAnalysis,
        stopAnalysis: stopConfidenceAnalysis,
        resetMetrics: resetConfidenceMetrics,
    } = useConfidenceAnalysis();

    // Local state
    const [hasStarted, setHasStarted] = useState(false);
    const [questionCount, setQuestionCount] = useState(10);
    const [showSettings, setShowSettings] = useState(false);
    const [autoPlay, setAutoPlay] = useState(true);
    const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [answerDuration, setAnswerDuration] = useState(0);
    const [questionConfidenceMetrics, setQuestionConfidenceMetrics] = useState<{
        smileScore: number;
        eyeContactScore: number;
        nodCount: number;
        headPoseScore: number;
    } | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Dual input mode state
    const [inputMode, setInputMode] = useState<'voice' | 'typing'>('voice');
    const [typedAnswer, setTypedAnswer] = useState('');
    const typingStartTimeRef = useRef<number | null>(null);

    // Get the current answer text (from voice or typing)
    const currentAnswerText = inputMode === 'voice' ? transcript : typedAnswer;

    // Calculate current metrics using whichever input is active
    const currentMetrics = calculateMetrics(
        currentAnswerText,
        answerDuration
    );

    // Start session handler
    const handleStart = async () => {
        if (!emailId) return;

        try {
            await startSession(parseInt(emailId), questionCount);
            setHasStarted(true);

            // Start camera for visual analysis
            startCamera();

            // Start elapsed time timer
            timerRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error('Failed to start session:', err);
        }
    };

    // Auto-play question when it changes
    useEffect(() => {
        if (hasStarted && currentQuestion && autoPlay && isTTSSupported) {
            speak(currentQuestion.questionText);
        }
    }, [currentQuestion, hasStarted, autoPlay, isTTSSupported]);

    // Start confidence analysis when camera becomes active
    useEffect(() => {
        if (isCameraActive && videoRef.current && hasStarted) {
            startConfidenceAnalysis(videoRef.current);
        } else if (!isCameraActive) {
            stopConfidenceAnalysis();
        }
    }, [isCameraActive, hasStarted]);

    // Recording handlers (voice mode)
    const handleStartRecording = () => {
        resetTranscript();
        setTypedAnswer('');
        setAnswerDuration(0);
        setRecordingStartTime(Date.now());
        resetConfidenceMetrics();
        setQuestionConfidenceMetrics(null);
        startListening();
    };

    const handleStopRecording = async () => {
        // Wait for speech recognition to fully stop and get the complete transcript
        // This fixes a race condition where the transcript state hasn't updated yet
        const finalTranscript = await stopAndGetTranscript();

        if (recordingStartTime) {
            const duration = Math.floor((Date.now() - recordingStartTime) / 1000);
            setAnswerDuration(duration);

            // Calculate final metrics using the reliable transcript
            const finalMetrics = calculateMetrics(finalTranscript, duration);

            // Cap WPM to 999 to prevent database decimal overflow
            const cappedWPM = Math.min(finalMetrics.wordsPerMinute, 999);

            // Capture current confidence metrics
            const capturedConfidence = {
                smileScore: confidenceMetrics.smileScore,
                eyeContactScore: confidenceMetrics.eyeContactScore,
                nodCount: confidenceMetrics.nodCount,
                headPoseScore: confidenceMetrics.headPoseScore,
            };
            setQuestionConfidenceMetrics(capturedConfidence);

            // Submit answer with confidence metrics
            if (currentQuestion) {
                try {
                    await submitAnswer({
                        questionId: currentQuestion.questionId,
                        transcriptText: finalTranscript,
                        audioDuration: duration,
                        wordCount: finalMetrics.wordCount,
                        fillerWordCount: finalMetrics.fillerWordCount,
                        speakingPaceWPM: cappedWPM,
                        pauseCount: finalMetrics.pauseCount,
                        totalPauseDuration: finalMetrics.totalPauseDuration,
                        detectedFillerWords: JSON.stringify(finalMetrics.detectedFillerWords),
                        // Include confidence metrics
                        smileScore: capturedConfidence.smileScore,
                        eyeContactScore: capturedConfidence.eyeContactScore,
                        nodCount: capturedConfidence.nodCount,
                        headPoseScore: capturedConfidence.headPoseScore,
                    });
                } catch (err) {
                    console.error('Failed to submit answer:', err);
                }
            }
        }

        setRecordingStartTime(null);
    };

    // Typed answer submission (typing mode)
    const handleSubmitTypedAnswer = async () => {
        if (!typedAnswer.trim() || !currentQuestion) return;

        // Calculate duration based on when user started typing
        // Ensure minimum duration of 1 second to avoid division issues
        const duration = typingStartTimeRef.current
            ? Math.max(1, Math.floor((Date.now() - typingStartTimeRef.current) / 1000))
            : 30; // Default duration for typed answers

        setAnswerDuration(duration);

        // Calculate metrics for typed answer
        const finalMetrics = calculateMetrics(typedAnswer, duration);

        // Cap WPM to 999 to prevent database decimal overflow
        const cappedWPM = Math.min(finalMetrics.wordsPerMinute, 999);

        // Capture current confidence metrics
        const capturedConfidence = {
            smileScore: confidenceMetrics.smileScore,
            eyeContactScore: confidenceMetrics.eyeContactScore,
            nodCount: confidenceMetrics.nodCount,
            headPoseScore: confidenceMetrics.headPoseScore,
        };
        setQuestionConfidenceMetrics(capturedConfidence);

        try {
            await submitAnswer({
                questionId: currentQuestion.questionId,
                transcriptText: typedAnswer,
                audioDuration: duration,
                wordCount: finalMetrics.wordCount,
                fillerWordCount: finalMetrics.fillerWordCount,
                speakingPaceWPM: cappedWPM,
                pauseCount: 0, // No pauses in typed answers
                totalPauseDuration: 0,
                detectedFillerWords: JSON.stringify(finalMetrics.detectedFillerWords),
                // Include confidence metrics
                smileScore: capturedConfidence.smileScore,
                eyeContactScore: capturedConfidence.eyeContactScore,
                nodCount: capturedConfidence.nodCount,
                headPoseScore: capturedConfidence.headPoseScore,
            });
        } catch (err) {
            console.error('Failed to submit answer:', err);
        }

        typingStartTimeRef.current = null;
    };

    // Start tracking typing time when user starts typing
    const handleTypedAnswerChange = (value: string) => {
        if (!typingStartTimeRef.current && value.length > 0) {
            typingStartTimeRef.current = Date.now();
        }
        setTypedAnswer(value);
    };

    // Update answer duration while recording
    useEffect(() => {
        if (isListening && recordingStartTime) {
            const interval = setInterval(() => {
                setAnswerDuration(Math.floor((Date.now() - recordingStartTime) / 1000));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isListening, recordingStartTime]);

    // Navigation handlers
    const handleNext = async () => {
        stopSpeech();
        if (isListening) await handleStopRecording();
        resetTranscript();
        setTypedAnswer('');
        typingStartTimeRef.current = null;
        setAnswerDuration(0);
        goToNextQuestion();
    };

    const handlePrevious = async () => {
        stopSpeech();
        if (isListening) await handleStopRecording();
        resetTranscript();
        setTypedAnswer('');
        typingStartTimeRef.current = null;
        setAnswerDuration(0);
        goToPreviousQuestion();
    };

    const handleEndInterview = async () => {
        stopSpeech();
        stopCamera();
        if (isListening) handleStopRecording();
        if (timerRef.current) clearInterval(timerRef.current);

        try {
            await completeSession();
            navigate(`/interview/${emailId}/results/${session?.sessionId}`);
        } catch (err) {
            console.error('Failed to complete session:', err);
        }
    };

    // Cleanup
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            stopSpeech();
            stopListening();
            stopCamera();
            stopConfidenceAnalysis();
        };
    }, []);

    // Show pre-interview screen
    if (!hasStarted) {
        return (
            <PreInterviewScreen
                jobTitle={session?.jobTitle}
                companyName={session?.companyName}
                questionCount={questionCount}
                setQuestionCount={setQuestionCount}
                onStart={handleStart}
                isLoading={isLoading}
            />
        );
    }

    // Loading state after starting
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-brand-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Preparing your interview...</p>
                </div>
            </div>
        );
    }

    // Error state - no session or no questions generated
    if (!session || session.questions.length === 0 || !currentQuestion) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full glass rounded-3xl p-8 border border-gray-800/50 text-center">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Unable to Generate Questions</h2>
                    <p className="text-gray-400 mb-6">
                        {error || "The AI couldn't generate questions for this job. This may be due to API rate limits or connectivity issues."}
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-6 py-3 rounded-xl bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                        >
                            Go Back
                        </button>
                        <button
                            onClick={() => {
                                setHasStarted(false);
                            }}
                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-accent-purple text-white hover:shadow-lg transition-all"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Get answer for current question if exists
    const currentAnswer = session.answers.find(a => a.questionId === currentQuestion.questionId);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-40 glass border-b border-gray-800/50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="hidden sm:inline">Exit Interview</span>
                    </button>

                    <div className="flex items-center gap-4">
                        {/* Progress */}
                        <div className="flex items-center gap-2 text-gray-400">
                            <Target className="w-4 h-4" />
                            <span className="text-white font-medium">{currentQuestionIndex + 1}</span>
                            <span>of</span>
                            <span>{session.totalQuestions}</span>
                        </div>

                        {/* Timer */}
                        <div className="flex items-center gap-2 text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span className="text-white font-mono">{formatDuration(elapsedTime)}</span>
                        </div>

                        {/* Recording Indicator */}
                        <RecordingIndicator isRecording={isListening} />

                        {/* Settings */}
                        <button
                            onClick={() => setShowSettings(true)}
                            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            <Settings className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-gray-800">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentQuestionIndex + 1) / session.totalQuestions) * 100}%` }}
                        className="h-full bg-gradient-to-r from-brand-500 to-accent-purple"
                    />
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-24 pb-32 px-4 max-w-4xl mx-auto">
                {/* Question Card */}
                <motion.div
                    key={currentQuestion.questionId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="glass rounded-3xl p-8 border border-gray-800/50 mb-6"
                >
                    {/* Question Meta */}
                    <div className="flex items-center gap-3 mb-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${currentQuestion.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                            currentQuestion.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                            }`}>
                            {currentQuestion.difficulty}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-brand-500/20 text-brand-400">
                            {currentQuestion.questionType}
                        </span>
                        {currentQuestion.skillName && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                                {currentQuestion.skillName}
                            </span>
                        )}
                    </div>

                    {/* Question Text */}
                    <h2 className="text-2xl font-semibold text-white leading-relaxed mb-6">
                        {currentQuestion.questionText}
                    </h2>

                    {/* TTS Controls */}
                    <div className="flex items-center gap-3">
                        {isSpeaking ? (
                            <>
                                {isSpeechPaused ? (
                                    <button
                                        onClick={resumeSpeech}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-white hover:bg-brand-600 transition-colors"
                                    >
                                        <Play className="w-4 h-4" />
                                        Resume
                                    </button>
                                ) : (
                                    <button
                                        onClick={pauseSpeech}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                                    >
                                        <Pause className="w-4 h-4" />
                                        Pause
                                    </button>
                                )}
                                <button
                                    onClick={stopSpeech}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                                >
                                    <Square className="w-4 h-4" />
                                    Stop
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => speak(currentQuestion.questionText)}
                                disabled={!isTTSSupported}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors disabled:opacity-50"
                            >
                                <Volume2 className="w-4 h-4" />
                                Play Question
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* Webcam and Transcript Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Webcam Feed with Confidence Indicators */}
                    <div className="lg:col-span-1 space-y-4">
                        <WebcamFeed
                            videoRef={videoRef}
                            isActive={isCameraActive}
                            isLoading={isCameraLoading}
                            error={cameraError}
                            hasPermission={hasCameraPermission}
                            onToggle={toggleCamera}
                            className="h-auto"
                        />
                        {/* Real-time Confidence Indicators */}
                        {isCameraActive && (
                            <ConfidenceIndicators
                                metrics={confidenceMetrics}
                                isAnalyzing={isAnalyzingConfidence}
                                compact={false}
                            />
                        )}
                    </div>

                    {/* Transcript Area */}
                    <div className="lg:col-span-2 glass rounded-3xl p-8 border border-gray-800/50">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-brand-400" />
                                Your Answer
                            </h3>

                            {/* Input Mode Toggle */}
                            <div className="flex items-center gap-2 p-1 rounded-xl bg-gray-800/50 border border-gray-700/50">
                                <button
                                    onClick={() => setInputMode('voice')}
                                    disabled={isListening}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${inputMode === 'voice'
                                        ? 'bg-gradient-to-r from-brand-500 to-accent-purple text-white'
                                        : 'text-gray-400 hover:text-white'
                                        } disabled:opacity-50`}
                                >
                                    <Mic className="w-4 h-4" />
                                    Voice
                                </button>
                                <button
                                    onClick={() => setInputMode('typing')}
                                    disabled={isListening}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${inputMode === 'typing'
                                        ? 'bg-gradient-to-r from-brand-500 to-accent-purple text-white'
                                        : 'text-gray-400 hover:text-white'
                                        } disabled:opacity-50`}
                                >
                                    <Keyboard className="w-4 h-4" />
                                    Type
                                </button>
                            </div>
                        </div>

                        {/* Voice Mode */}
                        {inputMode === 'voice' && (
                            <>
                                {/* Recording Controls */}
                                <div className="flex items-center gap-3 mb-4">
                                    {isListening ? (
                                        <button
                                            onClick={handleStopRecording}
                                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
                                        >
                                            <MicOff className="w-5 h-5" />
                                            Stop Recording
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleStartRecording}
                                            disabled={!isSTTSupported}
                                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-accent-purple text-white hover:shadow-lg hover:shadow-brand-500/25 transition-all disabled:opacity-50"
                                        >
                                            <Mic className="w-5 h-5" />
                                            Start Recording
                                        </button>
                                    )}
                                    {!isSTTSupported && (
                                        <span className="text-yellow-400 text-sm">Voice not supported in this browser</span>
                                    )}
                                </div>

                                {/* Transcript Display */}
                                <div className="min-h-[150px] p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
                                    {transcript || interimTranscript ? (
                                        <p className="text-gray-200 leading-relaxed">
                                            {transcript}
                                            <span className="text-gray-500">{interimTranscript}</span>
                                        </p>
                                    ) : currentAnswer?.transcriptText ? (
                                        <p className="text-gray-200 leading-relaxed">{currentAnswer.transcriptText}</p>
                                    ) : (
                                        <p className="text-gray-500 italic">
                                            {isListening ? 'Listening... Speak now.' : 'Click "Start Recording" to begin answering.'}
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Typing Mode */}
                        {inputMode === 'typing' && (
                            <>
                                <div className="relative">
                                    <textarea
                                        value={typedAnswer}
                                        onChange={(e) => handleTypedAnswerChange(e.target.value)}
                                        placeholder="Type your answer here..."
                                        className="w-full min-h-[180px] p-4 rounded-xl bg-gray-800/50 border border-gray-700/50 text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all"
                                    />
                                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                        <span className="text-gray-500 text-sm">
                                            {typedAnswer.split(/\s+/).filter(w => w.length > 0).length} words
                                        </span>
                                        <button
                                            onClick={handleSubmitTypedAnswer}
                                            disabled={!typedAnswer.trim()}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-brand-500 to-accent-purple text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Send className="w-4 h-4" />
                                            Submit
                                        </button>
                                    </div>
                                </div>
                                {currentAnswer?.transcriptText && !typedAnswer && (
                                    <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                        <p className="text-green-400 text-sm flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" />
                                            Previous answer saved: "{currentAnswer.transcriptText.slice(0, 100)}..."
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Metrics */}
                        {(currentAnswerText || currentAnswer) && (
                            <div className="mt-4">
                                <MetricsPanel
                                    wordCount={currentAnswerText ? currentMetrics.wordCount : (currentAnswer?.wordCount || 0)}
                                    wpm={currentAnswerText ? currentMetrics.wordsPerMinute : (currentAnswer?.speakingPaceWPM || 0)}
                                    fillerCount={currentAnswerText ? currentMetrics.fillerWordCount : (currentAnswer?.fillerWordCount || 0)}
                                    duration={currentAnswerText ? answerDuration : (currentAnswer?.audioDuration || 0)}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Answer Status */}
                {currentAnswer && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-green-400 mb-6"
                    >
                        <CheckCircle className="w-5 h-5" />
                        <span>Answer saved</span>
                    </motion.div>
                )}
            </main>

            {/* Navigation Footer */}
            <footer className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-gray-800/50">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button
                        onClick={handlePrevious}
                        disabled={isFirstQuestion}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-800 text-white hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Previous
                    </button>

                    <button
                        onClick={handleEndInterview}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                    >
                        <Square className="w-5 h-5" />
                        End Interview
                    </button>

                    {isLastQuestion ? (
                        <button
                            onClick={handleEndInterview}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg transition-all"
                        >
                            Complete
                            <CheckCircle className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-accent-purple text-white hover:shadow-lg hover:shadow-brand-500/25 transition-all"
                        >
                            Next
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </footer>

            {/* Voice Settings Modal */}
            <AnimatePresence>
                {showSettings && (
                    <VoiceSettingsModal
                        isOpen={showSettings}
                        onClose={() => setShowSettings(false)}
                        voices={voices}
                        selectedVoice={selectedVoice}
                        onSelectVoice={setSelectedVoice}
                        rate={speechRate}
                        onSetRate={setSpeechRate}
                        autoPlay={autoPlay}
                        onSetAutoPlay={setAutoPlay}
                    />
                )}
            </AnimatePresence>

            {/* Error Toast */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center gap-2"
                    >
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MockInterview;
