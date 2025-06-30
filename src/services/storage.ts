import type { InterviewSession, UserProfile } from '../types';

export class StorageService {
  private static instance: StorageService;
  
  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  saveInterviewSession(session: InterviewSession): void {
    const sessions = this.getInterviewSessions();
    sessions.push(session);
    localStorage.setItem('interview_sessions', JSON.stringify(sessions));
  }

  getInterviewSessions(): InterviewSession[] {
    const sessions = localStorage.getItem('interview_sessions');
    return sessions ? JSON.parse(sessions) : [];
  }

  getInterviewSession(id: string): InterviewSession | null {
    const sessions = this.getInterviewSessions();
    return sessions.find(session => session.id === id) || null;
  }

  saveUserProfile(profile: UserProfile): void {
    localStorage.setItem('user_profile', JSON.stringify(profile));
  }

  getUserProfile(): UserProfile | null {
    const profile = localStorage.getItem('user_profile');
    return profile ? JSON.parse(profile) : null;
  }

  updateUserStats(scoreGained: number): void {
    const profile = this.getUserProfile();
    if (profile) {
      profile.totalInterviews += 1;
      profile.averageScore = (profile.averageScore + scoreGained) / 2;
      this.saveUserProfile(profile);
    }
  }

  saveApiKey(apiKey: string): void {
    localStorage.setItem('openai_api_key', apiKey);
  }

  getApiKey(): string | null {
    return localStorage.getItem('openai_api_key');
  }

  saveHuggingFaceApiKey(apiKey: string): void {
    localStorage.setItem('huggingface_api_key', apiKey);
  }

  getHuggingFaceApiKey(): string | null {
    return localStorage.getItem('huggingface_api_key');
  }

  saveGeminiApiKey(apiKey: string): void {
    localStorage.setItem('gemini_api_key', apiKey);
  }

  getGeminiApiKey(): string | null {
    return localStorage.getItem('gemini_api_key');
  }

  clearData(): void {
    const keysToKeep = ['openai_api_key', 'huggingface_api_key', 'gemini_api_key'];
    const allKeys = Object.keys(localStorage);
    
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
  }
}