export interface InterviewSettings {
  type: 'hr' | 'technical' | 'behavioral';
  difficulty: 'fresher' | 'mid' | 'senior';
  duration: number;
  voiceAccent: 'indian' | 'us' | 'uk';
  avatarStyle: 'professional' | 'casual' | 'tech';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

export interface InterviewSession {
  id: string;
  settings: InterviewSettings;
  messages: Message[];
  startTime: Date;
  endTime?: Date;
  score?: number;
  feedback?: string;
  resumeData?: ResumeData;
}

export interface ResumeData {
  name: string;
  email: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  summary: string;
}

export interface Experience {
  company: string;
  position: string;
  duration: string;
  description: string[];
}

export interface Education {
  institution: string;
  degree: string;
  year: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  streak: number;
  badges: Badge[];
  totalInterviews: number;
  averageScore: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: Date;
}

export interface FeedbackItem {
  category: 'communication' | 'technical' | 'confidence' | 'clarity';
  score: number;
  feedback: string;
  suggestions: string[];
}