import { useState, useCallback, useRef, useEffect } from 'react';
import { SpeechService } from '../services/speech';

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const speechServiceRef = useRef<SpeechService | null>(null);

  const initializeSpeechService = useCallback(() => {
    if (!speechServiceRef.current) {
      speechServiceRef.current = new SpeechService();
    }
    return speechServiceRef.current;
  }, []);

  // Check if speech synthesis is available
  useEffect(() => {
    if (!window.speechSynthesis) {
      setError('Speech synthesis not supported in this browser');
    }
  }, []);

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
      
      await speechService.speak(text, voice);
      console.log('Speech completed successfully');
    } catch (err) {
      // Check if the error is an interruption (which is normal behavior)
      const isInterruptedError = err && typeof err === 'object' && 'error' in err && err.error === 'interrupted';
      
      if (isInterruptedError) {
        // Interrupted errors are normal when speech is cancelled - just log as info
        console.log('Speech was interrupted (normal behavior)');
      } else {
        // Only treat non-interruption errors as actual errors
        const errorMessage = 'Failed to synthesize speech. Please check your browser settings.';
        setError(errorMessage);
        console.error('Speech synthesis error:', err);
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
    }
  }, []);

  const getVoices = useCallback(() => {
    const speechService = initializeSpeechService();
    return speechService.getAvailableVoices();
  }, [initializeSpeechService]);

  const testSpeech = useCallback(async () => {
    await speak('Hello, this is a test of the speech synthesis system.');
  }, [speak]);

  return {
    isSpeaking,
    error,
    speak,
    cancel,
    getVoices,
    testSpeech
  };
}