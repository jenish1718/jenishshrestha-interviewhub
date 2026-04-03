import { 
  Brain, 
  MessageSquare, 
  Video, 
  BarChart3, 
  Zap, 
  Target, 
  Upload, 
  FileText, 
  Mic, 
  TrendingUp 
} from "lucide-react";
import { Feature, Step, Testimonial } from "./types";

// Feature cards for the landing page.
export const FEATURES: Feature[] = [
  {
    id: "skill-extraction",
    title: "Smart Skill Extraction",
    description: "Upload job descriptions and let AI automatically identify key skills and requirements.",
    icon: Brain,
    className: "md:col-span-2"
  },
  {
    id: "personalized-questions",
    title: "Personalized Questions",
    description: "Get tailored behavioral and technical questions generated specifically for your target role.",
    icon: MessageSquare,
    className: "md:col-span-1"
  },
  {
    id: "webcam-analysis",
    title: "Webcam Analysis",
    description: "Track non-verbal cues like smiles, nods, and eye contact with computer vision technology.",
    icon: Video,
    className: "md:col-span-1"
  },
  {
    id: "real-time-feedback",
    title: "Real-Time Feedback",
    description: "Receive instant analysis on speech fluency, eye contact, and confidence indicators.",
    icon: Zap,
    className: "md:col-span-2"
  },
  {
    id: "performance-reports",
    title: "Performance Reports",
    description: "Get detailed insights and actionable improvement suggestions after each mock session.",
    icon: BarChart3,
    className: "md:col-span-1"
  },
  {
    id: "interview-success",
    title: "Interview Success",
    description: "Join candidates achieving up to 95% success rates with data-driven preparation.",
    icon: Target,
    className: "md:col-span-2"
  }
];

// Steps in the interview preparation workflow.
export const STEPS: Step[] = [
  {
    id: 1,
    title: "Upload Job Description",
    description: "Paste the job email or description to extract skills.",
    icon: Upload
  },
  {
    id: 2,
    title: "Get Custom Questions",
    description: "AI generates questions tailored to the specific role.",
    icon: FileText
  },
  {
    id: 3,
    title: "Practice With AI",
    description: "Mock interview with real-time video & audio analysis.",
    icon: Mic
  },
  {
    id: 4,
    title: "Review & Improve",
    description: "Get a detailed report on your performance stats.",
    icon: TrendingUp
  }
];

// User testimonials displayed on the landing page.
export const TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    name: "Samuel Sherpa",
    role: "Software Engineer",
    company: "Tech Corp",
    content: "InterviewHub helped me identify and fix my nervous habits. The real-time feedback was a game-changer for my confidence.",
    rating: 5
  },
  {
    id: "t2",
    name: "Jenish Shrestha",
    role: "Financial Analyst",
    company: "Banking Solutions",
    content: "The personalized questions based on actual job descriptions made my preparation so much more focused and effective.",
    rating: 5
  },
  {
    id: "t3",
    name: "Arpan Upreti",
    role: "Product Manager",
    company: "Innovation Labs",
    content: "I never realized how much my body language mattered until InterviewHub showed me. Landed my dream job on the first try!",
    rating: 5
  }
];
