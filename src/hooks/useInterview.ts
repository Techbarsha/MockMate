import { useState, useCallback } from 'react';
import { HuggingFaceService } from '../services/huggingface';
import { StorageService } from '../services/storage';
import type { InterviewSession, InterviewSettings, Message } from '../types';

export function useInterview() {
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storageService = StorageService.getInstance();
  const huggingFaceService = new HuggingFaceService();

  const startInterview = useCallback((settings: InterviewSettings, resumeData?: any) => {
    const session: InterviewSession = {
      id: Date.now().toString(),
      settings,
      messages: [],
      startTime: new Date(),
      resumeData
    };

    setCurrentSession(session);
    setError(null);
    return session;
  }, []);

  const generateQuestion = useCallback(async (sessionOverride?: InterviewSession) => {
    const session = sessionOverride || currentSession;
    if (!session) return null;

    setIsGenerating(true);
    setError(null);

    try {
      const question = await huggingFaceService.generateInterviewQuestion({
        type: session.settings.type,
        difficulty: session.settings.difficulty,
        previousMessages: session.messages,
        resumeData: session.resumeData
      });

      const message: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: question,
        timestamp: new Date()
      };

      const updatedSession = {
        ...session,
        messages: [...session.messages, message]
      };

      setCurrentSession(updatedSession);
      return message;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate question';
      setError(errorMessage);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [currentSession, huggingFaceService]);

  const addUserResponse = useCallback((content: string) => {
    if (!currentSession) return;

    const message: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, message]
    };

    setCurrentSession(updatedSession);
    return message;
  }, [currentSession]);

  const endInterview = useCallback(async () => {
    if (!currentSession) return null;

    const endedSession = {
      ...currentSession,
      endTime: new Date()
    };

    // Generate final feedback
    try {
      if (currentSession.messages.length > 0) {
        const lastUserMessage = currentSession.messages
          .filter(m => m.role === 'user')
          .pop();

        if (lastUserMessage) {
          const feedback = await huggingFaceService.provideFeedback({
            userResponse: lastUserMessage.content,
            question: 'Overall interview performance',
            type: currentSession.settings.type
          });

          endedSession.score = feedback.score;
          endedSession.feedback = feedback.feedback;
        }
      }
    } catch (err) {
      console.error('Error generating final feedback:', err);
    }

    storageService.saveInterviewSession(endedSession);
    setCurrentSession(null);
    return endedSession;
  }, [currentSession, storageService, huggingFaceService]);

  const getFeedback = useCallback(async (userResponse: string, question: string) => {
    if (!currentSession) return null;

    try {
      return await huggingFaceService.provideFeedback({
        userResponse,
        question,
        type: currentSession.settings.type
      });
    } catch (err) {
      console.error('Error getting feedback:', err);
      return null;
    }
  }, [currentSession, huggingFaceService]);

  return {
    currentSession,
    isGenerating,
    error,
    startInterview,
    generateQuestion,
    addUserResponse,
    endInterview,
    getFeedback
  };
}