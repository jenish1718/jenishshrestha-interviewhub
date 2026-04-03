import { LucideIcon } from "lucide-react";

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  className?: string; // For Bento grid spanning
}

export interface Step {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
}

// Interview Session Types
export interface InterviewSession {
  sessionId: number;
  emailId: number;
  jobTitle?: string;
  companyName?: string;
  startTime: string;
  endTime?: string;
  status: 'InProgress' | 'Completed' | 'Abandoned';
  totalQuestions: number;
  currentQuestionIndex: number;
  questions: SessionQuestion[];
  answers: SessionAnswer[];
}

export interface SessionQuestion {
  questionId: number;
  questionText: string;
  questionType: 'Technical' | 'Behavioral' | 'Situational';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  skillName?: string;
  sampleAnswer?: string;
}

export interface SessionAnswer {
  answerId: number;
  questionId: number;
  questionText: string;
  transcriptText?: string;
  audioDuration: number;
  wordCount: number;
  fillerWordCount: number;
  speakingPaceWPM: number;
  pauseCount: number;
  totalPauseDuration: number;
  detectedFillerWords?: string;
  answeredAt: string;
  // Confidence metrics from webcam analysis
  smileScore?: number;
  eyeContactScore?: number;
  nodCount?: number;
  headPoseScore?: number;
}

export interface SessionSummary {
  sessionId: number;
  jobTitle?: string;
  companyName?: string;
  startTime: string;
  endTime?: string;
  totalDurationMinutes: number;
  totalQuestions: number;
  questionsAnswered: number;
  averageWPM: number;
  totalFillerWords: number;
  totalWordCount: number;
  averageAnswerDuration: number;
}

// Speaking Metrics
export interface SpeakingMetrics {
  wordCount: number;
  wordsPerMinute: number;
  fillerWordCount: number;
  detectedFillerWords: string[];
  duration: number;
  pauseCount: number;
  totalPauseDuration: number;
}

// TTS Settings
export interface TTSSettings {
  voice: SpeechSynthesisVoice | null;
  rate: number; // 0.5 to 2
  autoPlay: boolean;
}

// API Request/Response Types
export interface StartSessionRequest {
  emailId: number;
  questionCount?: number;
}

export interface SubmitAnswerRequest {
  questionId: number;
  transcriptText?: string;
  audioDuration: number;
  wordCount: number;
  fillerWordCount: number;
  speakingPaceWPM: number;
  pauseCount: number;
  totalPauseDuration: number;
  detectedFillerWords?: string;
  // Confidence metrics from webcam analysis
  smileScore?: number;
  eyeContactScore?: number;
  nodCount?: number;
  headPoseScore?: number;
}

// Confidence metrics interface
export interface ConfidenceMetrics {
  smileScore: number;
  eyeContactScore: number;
  nodCount: number;
  headPoseScore: number;
}

