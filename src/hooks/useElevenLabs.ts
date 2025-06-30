import { useState, useCallback, useRef, useEffect } from 'react';
import { ElevenLabsService } from '../services/elevenlabs';

export function useElevenLabs() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [usageStats, setUsageStats] = useState<any>(null);

  const elevenLabsServiceRef = useRef<ElevenLabsService | null>(null);

  const initializeService = useCallback(() => {
    if (!elevenLabsServiceRef.current) {
      elevenLabsServiceRef.current = new ElevenLabsService();
    }
    return elevenLabsServiceRef.current;
  }, []);

  // Initialize service and load voices
  useEffect(() => {
    const service = initializeService();
    
    const loadInitialData = async () => {
      if (service.hasApiKey()) {
        try {
          setIsReady(false);
          
          // Load voices
          const voices = await service.getVoices();
          setAvailableVoices(voices);
          
          let voiceToSelect = null;
          
          // Try to find a preferred voice from the API response
          if (voices && voices.length > 0) {
            voiceToSelect = voices.find(v => 
              v.name.toLowerCase().includes('bella') || 
              v.name.toLowerCase().includes('rachel') ||
              v.labels?.gender === 'female'
            ) || voices[0];
          }
          
          // If no voices from API, try recommended voices as fallback
          if (!voiceToSelect) {
            const recommendedVoices = service.getRecommendedVoices();
            if (recommendedVoices && recommendedVoices.length > 0) {
              voiceToSelect = recommendedVoices[0];
              console.log('Using recommended voice as fallback:', voiceToSelect);
            }
          }
          
          // Only set as ready if we have a valid voice selected
          if (voiceToSelect && voiceToSelect.voiceId) {
            setSelectedVoice(voiceToSelect.voiceId);
            
            // Load usage stats
            try {
              const stats = await service.getUsageStats();
              setUsageStats(stats);
            } catch (statsError) {
              console.warn('Could not load usage stats:', statsError);
            }
            
            setIsReady(true);
            setError(null);
            console.log('ElevenLabs service initialized successfully with voice:', voiceToSelect.name || voiceToSelect.voiceId);
          } else {
            setIsReady(false);
            setError('No voices available. Please check your ElevenLabs API key and account status.');
            console.error('No voices available from API or recommended voices');
          }
          
        } catch (error) {
          console.error('Error initializing ElevenLabs:', error);
          setError(error instanceof Error ? error.message : 'Failed to initialize ElevenLabs');
          setIsReady(false);
          setSelectedVoice('');
        }
      } else {
        setIsReady(false);
        setSelectedVoice('');
        setError('ElevenLabs API key not configured');
      }
    };

    loadInitialData();
  }, [initializeService]);

  const speak = useCallback(async (
    text: string,
    voiceId?: string,
    options?: {
      stability?: number;
      similarityBoost?: number;
      style?: number;
      useSpeakerBoost?: boolean;
      modelId?: string;
    }
  ) => {
    const service = initializeService();
    
    if (!service.hasApiKey()) {
      const errorMsg = 'ElevenLabs API key not configured';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    const voiceToUse = voiceId || selectedVoice;
    if (!voiceToUse) {
      const errorMsg = 'No voice selected';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    setError(null);
    setIsSpeaking(true);

    try {
      console.log('Speaking with ElevenLabs:', text.substring(0, 50) + '...');
      
      await service.speakText(text, voiceToUse, {
        stability: 0.5,
        similarityBoost: 0.75,
        style: 0.0,
        useSpeakerBoost: true,
        ...options
      });
      
      console.log('ElevenLabs speech completed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to speak text';
      setError(errorMessage);
      console.error('ElevenLabs speech error:', err);
      throw new Error(errorMessage);
    } finally {
      setIsSpeaking(false);
    }
  }, [initializeService, selectedVoice]);

  const stopSpeaking = useCallback(() => {
    const service = elevenLabsServiceRef.current;
    if (service) {
      service.stopCurrentAudio();
      setIsSpeaking(false);
      console.log('ElevenLabs speech stopped');
    }
  }, []);

  const testVoice = useCallback(async (voiceId?: string) => {
    const service = initializeService();
    
    try {
      setError(null);
      const voiceToTest = voiceId || selectedVoice;
      if (!voiceToTest) {
        throw new Error('No voice selected for testing');
      }
      
      const success = await service.testVoice(voiceToTest);
      console.log('ElevenLabs voice test result:', success);
      return success;
    } catch (err) {
      const errorMessage = 'Voice test failed. Please check your API key and internet connection.';
      setError(errorMessage);
      console.error('ElevenLabs voice test error:', err);
      throw new Error(errorMessage);
    }
  }, [initializeService, selectedVoice]);

  const refreshVoices = useCallback(async () => {
    const service = initializeService();
    
    if (!service.hasApiKey()) {
      setError('ElevenLabs API key not configured');
      return;
    }

    try {
      setError(null);
      const voices = await service.getVoices();
      setAvailableVoices(voices);
      
      // Update selected voice if it's not in the new list or if no voice is selected
      if (!selectedVoice || (voices.length > 0 && !voices.find(v => v.voiceId === selectedVoice))) {
        const defaultVoice = voices.find(v => 
          v.name.toLowerCase().includes('bella') || 
          v.name.toLowerCase().includes('rachel') ||
          v.labels?.gender === 'female'
        ) || voices[0];
        
        if (defaultVoice) {
          setSelectedVoice(defaultVoice.voiceId);
          setIsReady(true);
        } else {
          // Try fallback to recommended voices
          const recommendedVoices = service.getRecommendedVoices();
          if (recommendedVoices && recommendedVoices.length > 0) {
            setSelectedVoice(recommendedVoices[0].voiceId);
            setIsReady(true);
          } else {
            setSelectedVoice('');
            setIsReady(false);
            setError('No voices available');
          }
        }
      }
      
      console.log('ElevenLabs voices refreshed:', voices.length);
    } catch (err) {
      const errorMessage = 'Failed to refresh voices';
      setError(errorMessage);
      console.error('Error refreshing voices:', err);
    }
  }, [initializeService, selectedVoice]);

  const refreshUsageStats = useCallback(async () => {
    const service = initializeService();
    
    if (!service.hasApiKey()) {
      return;
    }

    try {
      const stats = await service.getUsageStats();
      setUsageStats(stats);
      console.log('ElevenLabs usage stats refreshed');
    } catch (err) {
      console.warn('Could not refresh usage stats:', err);
    }
  }, [initializeService]);

  const getRecommendedVoices = useCallback(() => {
    const service = initializeService();
    return service.getRecommendedVoices();
  }, [initializeService]);

  const hasApiKey = useCallback(() => {
    const service = initializeService();
    return service.hasApiKey();
  }, [initializeService]);

  return {
    // State
    isSpeaking,
    error,
    isReady,
    availableVoices,
    selectedVoice,
    usageStats,
    
    // Actions
    speak,
    stopSpeaking,
    testVoice,
    refreshVoices,
    refreshUsageStats,
    setSelectedVoice,
    
    // Utilities
    getRecommendedVoices,
    hasApiKey,
    
    // Service instance
    service: elevenLabsServiceRef.current
  };
}