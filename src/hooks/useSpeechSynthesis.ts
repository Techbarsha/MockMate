import { useState, useCallback, useRef, useEffect } from 'react';
import { SpeechService } from '../services/speech';

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const speechServiceRef = useRef<SpeechService | null>(null);

  const initializeSpeechService = useCallback(() => {
    if (!speechServiceRef.current) {
      speechServiceRef.current = new SpeechService();
    }
    return speechServiceRef.current;
  }, []);

  // Check if speech synthesis is available and initialize
  useEffect(() => {
    const checkSpeechSupport = async () => {
      if (!window.speechSynthesis) {
        setError('Speech synthesis not supported in this browser');
        return;
      }

      const speechService = initializeSpeechService();
      
      // Wait for voices to load
      let attempts = 0;
      const maxAttempts = 10;
      
      const checkVoices = () => {
        attempts++;
        if (speechService.isVoiceReady) {
          setIsReady(true);
          setError(null);
          console.log('Speech synthesis is ready');
        } else if (attempts < maxAttempts) {
          setTimeout(checkVoices, 500);
        } else {
          console.warn('Speech synthesis voices not loaded after maximum attempts');
          setIsReady(true); // Allow to proceed anyway
        }
      };

      checkVoices();
    };

    checkSpeechSupport();
  }, [initializeSpeechService]);

  const speak = useCallback(async (text: string, voice?: string) => {
    if (!window.speechSynthesis) {
      const errorMsg = 'Speech synthesis not supported';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    const speechService = initializeSpeechService();
    
    setError(null);
    setIsSpeaking(true);

    try {
      console.log('Starting speech synthesis:', text.substring(0, 50) + '...');
      
      // Ensure voices are loaded before speaking
      if (!speechService.isVoiceReady) {
        console.log('Voices not ready, reloading...');
        speechService.reloadVoices();
        
        // Wait a bit for voices to load
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      await speechService.speak(text, voice);
      console.log('Speech synthesis completed successfully');
    } catch (err) {
      // Check if the error is an interruption (which is normal behavior)
      const isInterruptedError = err && typeof err === 'object' && 'error' in err && err.error === 'interrupted';
      
      if (isInterruptedError) {
        // Interrupted errors are normal when speech is cancelled - just log as info
        console.log('Speech was interrupted (normal behavior)');
      } else {
        // Only treat non-interruption errors as actual errors
        const errorMessage = 'Failed to synthesize speech. Please check your browser settings and ensure audio is enabled.';
        setError(errorMessage);
        console.error('Speech synthesis error:', err);
        throw new Error(errorMessage);
      }
    } finally {
      setIsSpeaking(false);
    }
  }, [initializeSpeechService]);

  const cancel = useCallback(() => {
    const speechService = speechServiceRef.current;
    if (speechService) {
      speechService.cancelSpeech();
      setIsSpeaking(false);
      console.log('Speech synthesis cancelled');
    }
  }, []);

  const getVoices = useCallback(() => {
    const speechService = initializeSpeechService();
    return speechService.getAvailableVoices();
  }, [initializeSpeechService]);

  const testSpeech = useCallback(async () => {
    try {
      setError(null);
      const speechService = initializeSpeechService();
      await speechService.testSpeech();
      console.log('Speech test completed successfully');
    } catch (err) {
      const errorMessage = 'Speech test failed. Please check your browser audio settings.';
      setError(errorMessage);
      console.error('Speech test error:', err);
      throw new Error(errorMessage);
    }
  }, [initializeSpeechService]);

  const checkAudioPermissions = useCallback(async () => {
    try {
      // Check if audio context is available
      if (typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined') {
        const AudioContextClass = AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        
        if (audioContext.state === 'suspended') {
          console.log('Audio context is suspended, attempting to resume...');
          await audioContext.resume();
        }
        
        console.log('Audio context state:', audioContext.state);
        audioContext.close();
      }
    } catch (err) {
      console.warn('Audio context check failed:', err);
    }
  }, []);

  // Auto-check audio permissions when component mounts
  useEffect(() => {
    checkAudioPermissions();
  }, [checkAudioPermissions]);

  return {
    isSpeaking,
    error,
    isReady,
    speak,
    cancel,
    getVoices,
    testSpeech,
    checkAudioPermissions
  };
}