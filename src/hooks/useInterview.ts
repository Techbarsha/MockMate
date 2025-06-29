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
    try {
      const session: InterviewSession = {
        id: Date.now().toString(),
        settings,
        messages: [],
        startTime: new Date(),
        resumeData
      };

      setCurrentSession(session);
      setError(null);
      console.log('Interview session started:', session.id);
      return session;
    } catch (err) {
      console.error('Error starting interview:', err);
      setError('Failed to start interview session');
      return null;
    }
  }, []);

  const generateQuestion = useCallback(async (sessionOverride?: InterviewSession) => {
    const session = sessionOverride || currentSession;
    
    if (!session) {
      console.error('No current session available for question generation');
      return null;
    }

    setIsGenerating(true);
    setError(null);

    try {
      console.log('Generating question for session:', session.id);
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
      console.log('Question generated successfully:', question);
      return message;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate question';
      console.error('Error generating question:', errorMessage);
      setError(errorMessage);
      
      // Return a fallback question to keep the interview going
      const fallbackMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Tell me about yourself and what interests you about this role?',
        timestamp: new Date()
      };
      
      const updatedSession = {
        ...session,
        messages: [...session.messages, fallbackMessage]
      };
      
      setCurrentSession(updatedSession);
      return fallbackMessage;
    } finally {
      setIsGenerating(false);
    }
  }, [currentSession, huggingFaceService]);

  const addUserResponse = useCallback((content: string) => {
    if (!currentSession) {
      console.error('No current session available for adding user response');
      return null;
    }

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
    console.log('User response added:', content);
    return message;
  }, [currentSession]);

  const endInterview = useCallback(async () => {
    if (!currentSession) {
      console.error('No current session to end');
      return null;
    }

    const endedSession = {
      ...currentSession,
      endTime: new Date()
    };

    // Generate final feedback
    try {
      if (currentSession.messages.length > 0) {
        const userMessages = currentSession.messages.filter(m => m.role === 'user');
        
        if (userMessages.length > 0) {
          const lastUserMessage = userMessages[userMessages.length - 1];
          const feedback = await huggingFaceService.provideFeedback({
            userResponse: lastUserMessage.content,
            question: 'Overall interview performance',
            type: currentSession.settings.type
          });

          endedSession.score = feedback.score;
          endedSession.feedback = feedback.feedback;
        } else {
          // No user responses, set default values
          endedSession.score = 50;
          endedSession.feedback = 'Interview completed without responses. Try practicing with voice input next time!';
        }
      }
    } catch (err) {
      console.error('Error generating final feedback:', err);
      // Set default values if feedback generation fails
      endedSession.score = 75;
      endedSession.feedback = 'Interview completed successfully! Keep practicing to improve your skills.';
    }

    try {
      storageService.saveInterviewSession(endedSession);
      console.log('Interview session saved:', endedSession.id);
    } catch (err) {
      console.error('Error saving interview session:', err);
    }

    setCurrentSession(null);
    return endedSession;
  }, [currentSession, storageService, huggingFaceService]);

  const getFeedback = useCallback(async (userResponse: string, question: string) => {
    if (!currentSession) {
      console.error('No current session available for feedback');
      return null;
    }

    try {
      return await huggingFaceService.provideFeedback({
        userResponse,
        question,
        type: currentSession.settings.type
      });
    } catch (err) {
      console.error('Error getting feedback:', err);
      // Return default feedback if service fails
      return {
        score: 75,
        feedback: 'Good response! Keep practicing to improve your interview skills.',
        suggestions: ['Practice speaking clearly', 'Provide specific examples', 'Stay confident']
      };
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