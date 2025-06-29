export const INTERVIEW_TYPES = {
  hr: {
    label: 'HR Interview',
    description: 'General HR questions about background, motivation, and cultural fit',
    icon: '👥',
    color: 'bg-blue-500'
  },
  technical: {
    label: 'Technical Interview',
    description: 'Role-specific technical questions and problem-solving',
    icon: '💻',
    color: 'bg-green-500'
  },
  behavioral: {
    label: 'Behavioral Interview',
    description: 'STAR method questions about past experiences and situations',
    icon: '🧠',
    color: 'bg-purple-500'
  }
} as const;

export const DIFFICULTY_LEVELS = {
  fresher: {
    label: 'Fresher (0-2 years)',
    description: 'Entry-level questions focused on basics and learning attitude',
    icon: '🌱'
  },
  mid: {
    label: 'Mid-Level (2-5 years)',
    description: 'Intermediate questions with practical scenarios',
    icon: '🚀'
  },
  senior: {
    label: 'Senior (5+ years)',
    description: 'Advanced questions on leadership and architecture',
    icon: '👨‍💼'
  }
} as const;

export const VOICE_ACCENTS = {
  indian: { label: 'Indian English', flag: '🇮🇳' },
  us: { label: 'US English', flag: '🇺🇸' },
  uk: { label: 'UK English', flag: '🇬🇧' }
} as const;

export const AVATAR_STYLES = {
  professional: {
    label: 'Professional',
    description: 'Formal business attire',
    preview: '👔'
  },
  casual: {
    label: 'Casual',
    description: 'Smart casual look',
    preview: '👕'
  },
  tech: {
    label: 'Tech',
    description: 'Modern tech professional',
    preview: '💻'
  }
} as const;

export const BADGES = [
  {
    id: 'first-interview',
    name: 'First Steps',
    description: 'Complete your first interview',
    icon: '🎯',
    requirement: 'interviews >= 1'
  },
  {
    id: 'fluent-speaker',
    name: 'Fluent Speaker',
    description: 'Maintain clear speech in 5 interviews',
    icon: '🗣️',
    requirement: 'clarity >= 80 && interviews >= 5'
  },
  {
    id: 'star-pro',
    name: 'STAR Pro',
    description: 'Master the STAR method',
    icon: '⭐',
    requirement: 'behavioral_score >= 85'
  },
  {
    id: 'streak-master',
    name: 'Streak Master',
    description: '7-day interview streak',
    icon: '🔥',
    requirement: 'streak >= 7'
  }
];

export const API_ENDPOINTS = {
  OPENAI: 'https://api.openai.com/v1/chat/completions',
  READY_PLAYER_ME: 'https://models.readyplayer.me'
};