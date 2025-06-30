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
      setError('Speech recognition not supported in this browser. Please use Chrome or Edge.');
      return false;
    }

    setError(null);
    setTranscript('');

    const success = speechService.startListening(
      (text) => {
        setTranscript(text);
        setError(null); // Clear any previous errors when we get results
      },
      (errorMessage) => {
        setIsListening(false);
        
        if (errorMessage) {
          // Provide user-friendly error messages
          const userFriendlyErrors: { [key: string]: string } = {
            'no-speech-timeout': 'No speech detected after multiple attempts. Please speak closer to your microphone and try again.',
            'microphone-error': 'Unable to access your microphone. Please check your microphone permissions and try again.',
            'permission-denied': 'Microphone access was denied. Please allow microphone access in your browser settings.',
            'network-error': 'Network error occurred during speech recognition. Please check your internet connection.',
            'service-error': 'Speech recognition service is not available. Please try again later.',
            'no-speech': '', // Don't show error for single no-speech events
            'aborted': '' // Don't show error for normal stops
          };
          
          const friendlyMessage = userFriendlyErrors[errorMessage];
          if (friendlyMessage) {
            setError(friendlyMessage);
          } else if (errorMessage && !['no-speech', 'aborted'].includes(errorMessage)) {
            setError(`Speech recognition error: ${errorMessage}`);
          }
        }
      }
    );

    if (success) {
      setIsListening(true);
      setError(null);
    } else {
      setError('Failed to start speech recognition. Please check your microphone permissions.');
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

  const checkMicrophonePermissions = useCallback(async () => {
    const speechService = initializeSpeechService();
    try {
      const hasPermission = await speechService.checkMicrophonePermissions();
      if (!hasPermission) {
        setError('Microphone access is required for voice recognition. Please allow microphone access and try again.');
      }
      return hasPermission;
    } catch (error) {
      setError('Unable to check microphone permissions. Please ensure your browser supports microphone access.');
      return false;
    }
  }, [initializeSpeechService]);

  return {
    isListening,
    transcript,
    error,
    isSupported: initializeSpeechService().isSpeechRecognitionSupported,
    startListening,
    stopListening,
    resetTranscript,
    checkMicrophonePermissions
  };
}