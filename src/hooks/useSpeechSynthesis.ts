import { useState, useCallback, useRef, useEffect } from 'react';
import { SpeechService } from '../services/speech';

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioAnalyzer, setAudioAnalyzer] = useState<AnalyserNode | null>(null);
  const speechServiceRef = useRef<SpeechService | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const initializeSpeechService = useCallback(() => {
    if (!speechServiceRef.current) {
      speechServiceRef.current = new SpeechService();
    }
    return speechServiceRef.current;
  }, []);

  // Initialize audio context for lip sync analysis
  const initializeAudioAnalysis = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const analyzer = audioContextRef.current.createAnalyser();
      analyzer.fftSize = 256;
      analyzer.smoothingTimeConstant = 0.8;
      
      setAudioAnalyzer(analyzer);
      return analyzer;
    } catch (error) {
      console.warn('Audio analysis not available:', error);
      return null;
    }
  }, []);

  // Check if speech synthesis is available
  useEffect(() => {
    if (!window.speechSynthesis) {
      setError('Speech synthesis not supported in this browser');
    } else {
      initializeAudioAnalysis();
    }

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [initializeAudioAnalysis]);

  const speak = useCallback(async (text: string, voice?: string) => {
    if (!window.speechSynthesis) {
      setError('Speech synthesis not supported');
      return;
    }

    const speechService = initializeSpeechService();
    
    setError(null);
    setIsSpeaking(true);

    try {
      console.log('Attempting to speak:', text.substring(0, 50) + '...');
      
      // Set up audio analysis for lip sync
      const analyzer = initializeAudioAnalysis();
      
      await speechService.speak(text, voice);
      console.log('Speech completed successfully');
    } catch (err) {
      const errorMessage = 'Failed to synthesize speech. Please check your browser settings.';
      setError(errorMessage);
      console.error('Speech synthesis error:', err);
    } finally {
      setIsSpeaking(false);
    }
  }, [initializeSpeechService, initializeAudioAnalysis]);

  const cancel = useCallback(() => {
    const speechService = speechServiceRef.current;
    if (speechService) {
      speechService.cancelSpeech();
      setIsSpeaking(false);
    }
  }, []);

  const getVoices = useCallback(() => {
    const speechService = initializeSpeechService();
    return speechService.getAvailableVoices();
  }, [initializeSpeechService]);

  const testSpeech = useCallback(async () => {
    await speak('Hello, this is a test of the speech synthesis system with real-time lip synchronization.');
  }, [speak]);

  return {
    isSpeaking,
    error,
    audioAnalyzer,
    speak,
    cancel,
    getVoices,
    testSpeech
  };
}