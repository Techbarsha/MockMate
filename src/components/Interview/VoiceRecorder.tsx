import React from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceRecorderProps {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  onStartListening: () => void;
  onStopListening: () => void;
  onSubmitResponse: (text: string) => void;
  isSpeaking: boolean;
  onToggleSpeaker: () => void;
  isSpeakerMuted: boolean;
}

export default function VoiceRecorder({
  isListening,
  isSupported,
  transcript,
  onStartListening,
  onStopListening,
  onSubmitResponse,
  isSpeaking,
  onToggleSpeaker,
  isSpeakerMuted
}: VoiceRecorderProps) {
  const handleSubmit = () => {
    if (transcript.trim()) {
      onSubmitResponse(transcript.trim());
    }
  };

  if (!isSupported) {
    return (
      <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
        <p className="text-red-700">
          Speech recognition is not supported in your browser. Please use Chrome or Edge for the best experience.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Voice Controls */}
      <div className="flex items-center justify-center space-x-4">
        {/* Microphone Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={isListening ? onStopListening : onStartListening}
          disabled={isSpeaking}
          className={`relative p-6 rounded-full transition-all duration-300 ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg animate-pulse'
              : 'bg-primary-500 hover:bg-primary-600 text-white shadow-md'
          } ${isSpeaking ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isListening ? (
            <MicOff className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
          
          {/* Recording indicator */}
          {isListening && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 w-4 h-4 bg-red-400 rounded-full animate-ping"
            />
          )}
        </motion.button>

        {/* Speaker Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleSpeaker}
          className={`p-4 rounded-full transition-all duration-300 ${
            isSpeakerMuted
              ? 'bg-gray-300 hover:bg-gray-400 text-gray-600'
              : 'bg-secondary-500 hover:bg-secondary-600 text-white'
          }`}
        >
          {isSpeakerMuted ? (
            <VolumeX className="w-6 h-6" />
          ) : (
            <Volume2 className="w-6 h-6" />
          )}
        </motion.button>
      </div>

      {/* Instructions */}
      <div className="text-center">
        <p className="text-gray-600">
          {isListening 
            ? 'Listening... Speak your answer'
            : isSpeaking
            ? 'AI is speaking...'
            : 'Click the microphone to start recording your response'
          }
        </p>
      </div>

      {/* Transcript Display */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
          >
            <h4 className="text-sm font-medium text-gray-700 mb-2">Your Response:</h4>
            <p className="text-gray-900 leading-relaxed">{transcript}</p>
            
            <div className="flex space-x-3 mt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Submit Response
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onStartListening}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Record Again
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visual feedback for listening */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center"
          >
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    scaleY: [1, 2, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.1
                  }}
                  className="w-1 h-8 bg-primary-500 rounded-full"
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}