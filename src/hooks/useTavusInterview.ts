import { useState, useCallback, useRef, useEffect } from 'react';
import { TavusService } from '../services/tavus';
import { ElevenLabsService } from '../services/elevenlabs';

interface TavusInterviewConfig {
  replicaId?: string;
  voiceId?: string;
  interviewType: string;
  difficulty: string;
  maxDuration?: number;
}

export function useTavusInterview() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableReplicas, setAvailableReplicas] = useState<any[]>([]);
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);

  const tavusServiceRef = useRef<TavusService | null>(null);
  const elevenLabsServiceRef = useRef<ElevenLabsService | null>(null);

  const initializeServices = useCallback(() => {
    if (!tavusServiceRef.current) {
      tavusServiceRef.current = new TavusService();
    }
    if (!elevenLabsServiceRef.current) {
      elevenLabsServiceRef.current = new ElevenLabsService();
    }
    return {
      tavus: tavusServiceRef.current,
      elevenlabs: elevenLabsServiceRef.current
    };
  }, []);

  // Load available replicas and voices
  useEffect(() => {
    const loadResources = async () => {
      const { tavus, elevenlabs } = initializeServices();
      
      try {
        if (tavus.hasApiKey()) {
          const replicas = await tavus.getReplicas();
          setAvailableReplicas(replicas);
        }
        
        if (elevenlabs.hasApiKey()) {
          const voices = await elevenlabs.getVoices();
          setAvailableVoices(voices);
        }
      } catch (error) {
        console.error('Error loading resources:', error);
      }
    };

    loadResources();
  }, [initializeServices]);

  const startTavusInterview = useCallback(async (config: TavusInterviewConfig) => {
    const { tavus } = initializeServices();
    
    if (!tavus.hasApiKey()) {
      setError('Tavus API key not configured');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use default replica if none specified
      const replicaId = config.replicaId || (availableReplicas[0]?.replicaId);
      
      if (!replicaId) {
        throw new Error('No replica available for conversation');
      }

      const conversation = await tavus.createConversation({
        replicaId,
        conversationName: `MockMate ${config.interviewType} Interview`,
        properties: {
          maxDuration: config.maxDuration || 1800,
          language: 'en',
          enableRecording: false
        }
      });

      setConversationId(conversation.conversationId);
      setConversationUrl(conversation.conversationUrl);

      // Connect WebSocket for real-time communication
      tavus.connectWebSocket(conversation.conversationId, {
        onOpen: () => {
          setIsConnected(true);
          setIsLoading(false);
          console.log('Tavus interview session started');
        },
        onMessage: (message) => {
          console.log('Tavus message:', message);
          if (message.type === 'ai_response') {
            setIsSpeaking(false);
          } else if (message.type === 'ai_speaking') {
            setIsSpeaking(true);
          }
        },
        onError: (error) => {
          console.error('Tavus WebSocket error:', error);
          setError('Connection error occurred');
          setIsConnected(false);
        },
        onClose: () => {
          setIsConnected(false);
          console.log('Tavus interview session ended');
        }
      });

      return true;
    } catch (error) {
      console.error('Error starting Tavus interview:', error);
      setError(error instanceof Error ? error.message : 'Failed to start interview');
      setIsLoading(false);
      return false;
    }
  }, [initializeServices, availableReplicas]);

  const sendMessage = useCallback((message: string) => {
    const { tavus } = initializeServices();
    
    if (isConnected && conversationId) {
      tavus.sendMessage(message);
      setIsSpeaking(true);
    } else {
      console.error('Not connected to Tavus conversation');
    }
  }, [initializeServices, isConnected, conversationId]);

  const endInterview = useCallback(async () => {
    const { tavus } = initializeServices();
    
    if (conversationId) {
      try {
        await tavus.endConversation(conversationId);
        setIsConnected(false);
        setConversationId(null);
        setConversationUrl(null);
        setIsSpeaking(false);
      } catch (error) {
        console.error('Error ending interview:', error);
      }
    }
  }, [initializeServices, conversationId]);

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
      console.warn('ElevenLabs API key not configured, falling back to browser TTS');
      return false;
    }

    try {
      setIsSpeaking(true);
      const selectedVoiceId = voiceId || availableVoices[0]?.voiceId;
      
      if (!selectedVoiceId) {
        throw new Error('No voice available');
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

  const getConversationStatus = useCallback(async () => {
    const { tavus } = initializeServices();
    
    if (conversationId) {
      try {
        return await tavus.getConversationStatus(conversationId);
      } catch (error) {
        console.error('Error getting conversation status:', error);
        return null;
      }
    }
    return null;
  }, [initializeServices, conversationId]);

  return {
    // State
    isConnected,
    isLoading,
    error,
    conversationId,
    conversationUrl,
    isSpeaking,
    availableReplicas,
    availableVoices,
    
    // Actions
    startTavusInterview,
    sendMessage,
    endInterview,
    speakWithElevenLabs,
    getConversationStatus,
    
    // Services
    tavusService: tavusServiceRef.current,
    elevenLabsService: elevenLabsServiceRef.current
  };
}