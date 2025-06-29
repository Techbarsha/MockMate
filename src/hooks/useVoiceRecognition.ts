import { useState, useCallback, useRef } from 'react';
import { SpeechService } from '../services/speech';

export function useVoiceRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const speechServiceRef = useRef<SpeechService | null>(null);

  const initializeSpeechService = useCallback(() => {
    if (!speechServiceRef.current) {
      speechServiceRef.current = new SpeechService();
    }
    return speechServiceRef.current;
  }, []);

  const startListening = useCallback(() => {
    const speechService = initializeSpeechService();
    
    if (!speechService.isSpeechRecognitionSupported) {
      setError('Speech recognition not supported in this browser');
      return false;
    }

    setError(null);
    setTranscript('');

    const success = speechService.startListening(
      (text) => {
        setTranscript(text);
      },
      () => {
        setIsListening(false);
      }
    );

    if (success) {
      setIsListening(true);
    } else {
      setError('Failed to start speech recognition');
    }

    return success;
  }, [initializeSpeechService]);

  const stopListening = useCallback(() => {
    const speechService = speechServiceRef.current;
    if (speechService) {
      speechService.stopListening();
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    error,
    isSupported: initializeSpeechService().isSpeechRecognitionSupported,
    startListening,
    stopListening,
    resetTranscript
  };
}