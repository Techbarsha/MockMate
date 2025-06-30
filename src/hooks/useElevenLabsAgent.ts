import { useState, useCallback, useRef, useEffect } from 'react';
import { ElevenLabsAgentService } from '../services/elevenLabsAgent';

interface AgentMessage {
  id: string;
  content: string;
  role: 'user' | 'agent';
  timestamp: Date;
}

export function useElevenLabsAgent() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const agentServiceRef = useRef<ElevenLabsAgentService | null>(null);

  const initializeService = useCallback(() => {
    if (!agentServiceRef.current) {
      agentServiceRef.current = new ElevenLabsAgentService();
    }
    return agentServiceRef.current;
  }, []);

  const startConversation = useCallback(async () => {
    const service = initializeService();
    
    if (!service.hasApiKey()) {
      setError('ElevenLabs API key not configured');
      return false;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const success = await service.startAgentConversation({
        onMessage: (message: string, isAgent: boolean) => {
          const newMessage: AgentMessage = {
            id: Date.now().toString() + Math.random(),
            content: message,
            role: isAgent ? 'agent' : 'user',
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, newMessage]);
          console.log(`${isAgent ? 'Agent' : 'User'} message:`, message);
        },
        
        onAudioChunk: async (chunk: ArrayBuffer) => {
          try {
            setIsSpeaking(true);
            await service.playAudioChunk(chunk);
          } catch (error) {
            console.error('Error playing audio chunk:', error);
          } finally {
            setIsSpeaking(false);
          }
        },
        
        onError: (error: any) => {
          console.error('Agent conversation error:', error);
          setError(error.message || 'Agent conversation error');
          setIsConnected(false);
          setIsConnecting(false);
        },
        
        onConnected: () => {
          console.log('Agent conversation connected');
          setIsConnected(true);
          setIsConnecting(false);
          setConversationId(service.currentConversationId);
          
          // Add welcome message
          const welcomeMessage: AgentMessage = {
            id: 'welcome-' + Date.now(),
            content: 'Hello! I\'m your AI interview coach. I\'m here to help you practice and improve your interview skills. What type of interview would you like to practice today?',
            role: 'agent',
            timestamp: new Date()
          };
          setMessages([welcomeMessage]);
        },
        
        onDisconnected: () => {
          console.log('Agent conversation disconnected');
          setIsConnected(false);
          setIsConnecting(false);
          setConversationId(null);
        }
      });

      return success;
    } catch (error) {
      console.error('Error starting agent conversation:', error);
      setError(error instanceof Error ? error.message : 'Failed to start conversation');
      setIsConnecting(false);
      return false;
    }
  }, [initializeService]);

  const sendMessage = useCallback((message: string) => {
    const service = agentServiceRef.current;
    
    if (!service || !isConnected) {
      console.error('Agent service not connected');
      return;
    }

    // Add user message to local state immediately
    const userMessage: AgentMessage = {
      id: Date.now().toString() + Math.random(),
      content: message,
      role: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Send to agent
    service.sendUserMessage(message);
  }, [isConnected]);

  const endConversation = useCallback(() => {
    const service = agentServiceRef.current;
    
    if (service) {
      service.endConversation();
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    setConversationId(null);
    console.log('Agent conversation ended');
  }, []);

  const testConnection = useCallback(async () => {
    const service = initializeService();
    
    try {
      setError(null);
      const success = await service.testAgentConnection();
      console.log('Agent connection test result:', success);
      return success;
    } catch (error) {
      const errorMessage = 'Agent connection test failed. Please check your API key.';
      setError(errorMessage);
      console.error('Agent connection test error:', error);
      throw new Error(errorMessage);
    }
  }, [initializeService]);

  const getConversationHistory = useCallback(async () => {
    const service = agentServiceRef.current;
    
    if (!service || !conversationId) {
      return [];
    }

    try {
      return await service.getConversationHistory();
    } catch (error) {
      console.error('Error getting conversation history:', error);
      return [];
    }
  }, [conversationId]);

  const hasApiKey = useCallback(() => {
    const service = initializeService();
    return service.hasApiKey();
  }, [initializeService]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const service = agentServiceRef.current;
      if (service && isConnected) {
        service.endConversation();
      }
    };
  }, [isConnected]);

  return {
    // State
    isConnected,
    isConnecting,
    error,
    messages,
    isSpeaking,
    conversationId,
    
    // Actions
    startConversation,
    sendMessage,
    endConversation,
    testConnection,
    getConversationHistory,
    
    // Utilities
    hasApiKey,
    
    // Service instance
    service: agentServiceRef.current
  };
}