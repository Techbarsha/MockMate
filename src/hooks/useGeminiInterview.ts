import { useState, useCallback, useRef, useEffect } from 'react';
import { GeminiVideoService } from '../services/geminiVideo';
import { ElevenLabsService } from '../services/elevenlabs';

interface GeminiInterviewConfig {
  interviewType: string;
  difficulty: string;
  duration: number;
  resumeData?: any;
  candidateName?: string;
  voiceId?: string;
}

export function useGeminiInterview() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [interviewComplete, setInterviewComplete] = useState(false);

  const geminiServiceRef = useRef<GeminiVideoService | null>(null);
  const elevenLabsServiceRef = useRef<ElevenLabsService | null>(null);

  const initializeServices = useCallback(() => {
    if (!geminiServiceRef.current) {
      geminiServiceRef.current = new GeminiVideoService();
    }
    if (!elevenLabsServiceRef.current) {
      elevenLabsServiceRef.current = new ElevenLabsService();
    }
    return {
      gemini: geminiServiceRef.current,
      elevenlabs: elevenLabsServiceRef.current
    };
  }, []);

  // Load available voices
  useEffect(() => {
    const loadVoices = async () => {
      const { elevenlabs } = initializeServices();
      
      try {
        if (elevenlabs.hasApiKey()) {
          const voices = await elevenlabs.getVoices();
          setAvailableVoices(voices);
        }
      } catch (error) {
        console.error('Error loading ElevenLabs voices:', error);
      }
    };

    loadVoices();
  }, [initializeServices]);

  const startGeminiInterview = useCallback(async (config: GeminiInterviewConfig) => {
    const { gemini } = initializeServices();
    
    if (!gemini.hasApiKey()) {
      setError('Gemini API key not configured');
      return false;
    }

    setIsLoading(true);
    setError(null);
    setInterviewComplete(false);

    try {
      const session = await gemini.startInterviewSession({
        interviewType: config.interviewType,
        difficulty: config.difficulty,
        duration: config.duration,
        resumeData: config.resumeData,
        candidateName: config.candidateName
      });

      setSessionId(session.sessionId);
      setIsConnected(true);
      setIsLoading(false);
      
      // Add welcome message to conversation
      const welcomeEntry = { role: 'assistant', content: session.welcomeMessage };
      setConversationHistory([welcomeEntry]);

      console.log('Gemini interview session started:', session.sessionId);
      return { success: true, welcomeMessage: session.welcomeMessage };
    } catch (error) {
      console.error('Error starting Gemini interview:', error);
      setError(error instanceof Error ? error.message : 'Failed to start interview');
      setIsLoading(false);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to start interview' };
    }
  }, [initializeServices]);

  const sendMessage = useCallback(async (message: string) => {
    const { gemini } = initializeServices();
    
    if (!isConnected || !sessionId || isGenerating) {
      console.error('Cannot send message: not connected or already generating');
      return null;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Add user message to conversation
      const userEntry = { role: 'user', content: message };
      setConversationHistory(prev => [...prev, userEntry]);

      // Generate AI response
      const response = await gemini.generateResponse(message);
      
      // Add AI response to conversation
      const aiEntry = { role: 'assistant', content: response.response };
      setConversationHistory(prev => [...prev, aiEntry]);

      // Check if interview is complete
      if (response.isComplete || response.nextAction === 'complete') {
        setInterviewComplete(true);
      }

      setIsGenerating(false);
      return response;
    } catch (error) {
      console.error('Error sending message to Gemini:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate response');
      setIsGenerating(false);
      return null;
    }
  }, [initializeServices, isConnected, sessionId, isGenerating]);

  const speakWithElevenLabs = useCallback(async (
    text: string, 
    voiceId?: string,
    options?: {
      stability?: number;
      similarityBoost?: number;
      style?: number;
    }
  ) => {
    const { elevenlabs } = initializeServices();
    
    if (!elevenlabs.hasApiKey()) {
      console.warn('ElevenLabs API key not configured, skipping TTS');
      return false;
    }

    try {
      setIsSpeaking(true);
      const selectedVoiceId = voiceId || availableVoices[0]?.voiceId;
      
      if (!selectedVoiceId) {
        console.warn('No voice available for TTS');
        setIsSpeaking(false);
        return false;
      }

      await elevenlabs.speakText(text, selectedVoiceId, options);
      setIsSpeaking(false);
      return true;
    } catch (error) {
      console.error('Error with ElevenLabs TTS:', error);
      setIsSpeaking(false);
      return false;
    }
  }, [initializeServices, availableVoices]);

  const generateFinalFeedback = useCallback(async () => {
    const { gemini } = initializeServices();
    
    if (!sessionId) {
      throw new Error('No active session for feedback generation');
    }

    try {
      const feedback = await gemini.generateFinalFeedback();
      return feedback;
    } catch (error) {
      console.error('Error generating final feedback:', error);
      throw error;
    }
  }, [initializeServices, sessionId]);

  const endInterview = useCallback(async () => {
    const { gemini } = initializeServices();
    
    try {
      // Generate final feedback before ending
      let feedback = null;
      if (sessionId && conversationHistory.length > 2) {
        try {
          feedback = await generateFinalFeedback();
        } catch (error) {
          console.error('Error generating feedback:', error);
        }
      }

      // End the session
      gemini.endSession();
      
      setIsConnected(false);
      setSessionId(null);
      setIsSpeaking(false);
      setIsGenerating(false);
      setInterviewComplete(true);

      return {
        conversationHistory: [...conversationHistory],
        feedback,
        sessionInfo: gemini.getSessionInfo()
      };
    } catch (error) {
      console.error('Error ending interview:', error);
      throw error;
    }
  }, [initializeServices, sessionId, conversationHistory, generateFinalFeedback]);

  const getSessionStatus = useCallback(() => {
    const { gemini } = initializeServices();
    return {
      isConnected,
      sessionId,
      conversationHistory: [...conversationHistory],
      sessionInfo: gemini.getSessionInfo(),
      isComplete: interviewComplete
    };
  }, [initializeServices, isConnected, sessionId, conversationHistory, interviewComplete]);

  return {
    // State
    isConnected,
    isLoading,
    error,
    sessionId,
    isSpeaking,
    isGenerating,
    availableVoices,
    conversationHistory,
    interviewComplete,
    
    // Actions
    startGeminiInterview,
    sendMessage,
    endInterview,
    speakWithElevenLabs,
    generateFinalFeedback,
    getSessionStatus,
    
    // Services
    geminiService: geminiServiceRef.current,
    elevenLabsService: elevenLabsServiceRef.current
  };
}