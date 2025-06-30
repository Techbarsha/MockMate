import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Settings, Video, Mic, VolumeX, Volume2, Pause, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTavusInterview } from '../../hooks/useTavusInterview';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import TranscriptPanel from './TranscriptPanel';
import type { InterviewSettings, Message } from '../../types';

interface TavusInterviewSessionProps {
  settings: InterviewSettings;
  onBack: () => void;
  onComplete: (session: any) => void;
  resumeData?: any;
}

export default function TavusInterviewSession({ 
  settings, 
  onBack, 
  onComplete, 
  resumeData 
}: TavusInterviewSessionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedReplica, setSelectedReplica] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<string>('');

  const {
    isConnected,
    isLoading,
    error,
    conversationUrl,
    isSpeaking,
    availableReplicas,
    availableVoices,
    startTavusInterview,
    sendMessage,
    endInterview,
    speakWithElevenLabs
  } = useTavusInterview();

  const {
    isListening,
    transcript,
    error: voiceError,
    startListening,
    stopListening,
    resetTranscript
  } = useVoiceRecognition();

  // Initialize interview when component mounts
  useEffect(() => {
    const initializeInterview = async () => {
      if (availableReplicas.length > 0 && !selectedReplica) {
        setSelectedReplica(availableReplicas[0].replicaId);
      }
      if (availableVoices.length > 0 && !selectedVoice) {
        setSelectedVoice(availableVoices[0].voiceId);
      }
    };

    initializeInterview();
  }, [availableReplicas, availableVoices, selectedReplica, selectedVoice]);

  const handleStartInterview = useCallback(async () => {
    const success = await startTavusInterview({
      replicaId: selectedReplica,
      voiceId: selectedVoice,
      interviewType: settings.type,
      difficulty: settings.difficulty,
      maxDuration: settings.duration * 60
    });

    if (success) {
      setIsInterviewActive(true);
      
      // Add welcome message
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Hello! I'm your AI interviewer. I'll be conducting a ${settings.type} interview today. Let's begin with: Tell me about yourself and what interests you about this role.`,
        timestamp: new Date()
      };
      
      setMessages([welcomeMessage]);
      
      // Speak the welcome message with ElevenLabs
      if (!isMuted) {
        await speakWithElevenLabs(welcomeMessage.content, selectedVoice);
      }
    }
  }, [startTavusInterview, selectedReplica, selectedVoice, settings, isMuted, speakWithElevenLabs]);

  const handleUserResponse = useCallback(async (response: string) => {
    if (!response.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: response,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    resetTranscript();

    // Send to Tavus for AI response
    sendMessage(response);

    // Simulate AI response (in real implementation, this would come from Tavus WebSocket)
    setTimeout(async () => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Thank you for that response. Let me ask you another question: How do you handle challenging situations in your work?`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);

      // Speak AI response with ElevenLabs
      if (!isMuted) {
        await speakWithElevenLabs(aiResponse.content, selectedVoice);
      }
    }, 2000);
  }, [sendMessage, resetTranscript, isMuted, speakWithElevenLabs, selectedVoice]);

  const handleEndInterview = useCallback(async () => {
    await endInterview();
    setIsInterviewActive(false);
    
    // Create session data for results
    const session = {
      id: Date.now().toString(),
      settings,
      messages,
      startTime: new Date(Date.now() - 10 * 60 * 1000), // Mock start time
      endTime: new Date(),
      score: 85, // Mock score
      feedback: 'Great interview! You demonstrated strong communication skills and provided detailed examples.'
    };

    onComplete(session);
  }, [endInterview, settings, messages, onComplete]);

  const handleVoiceToggle = useCallback(async () => {
    if (isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Auto-submit transcript when user stops speaking
  useEffect(() => {
    if (transcript && !isListening && transcript.length > 10) {
      const submitTimer = setTimeout(() => {
        handleUserResponse(transcript);
      }, 2000);

      return () => clearTimeout(submitTimer);
    }
  }, [transcript, isListening, handleUserResponse]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </button>
              <div className="ml-6">
                <h1 className="text-xl font-semibold text-gray-900">
                  Tavus AI Video Interview
                </h1>
                <p className="text-sm text-gray-500">
                  Real-time AI avatar • ElevenLabs voice • {settings.type} interview
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {isConnected && (
                <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                  Connected to Tavus
                </div>
              )}
              
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 rounded-lg transition-colors ${
                  isMuted 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                }`}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Video Section */}
        <div className="w-2/3 p-6">
          <div className="h-full bg-white rounded-xl shadow-lg overflow-hidden relative">
            {conversationUrl && isConnected ? (
              <iframe
                src={conversationUrl}
                className="w-full h-full"
                allow="camera; microphone"
                title="Tavus AI Interview"
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600">
                <div className="text-center text-white">
                  {isLoading ? (
                    <>
                      <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Connecting to Tavus AI...</h3>
                      <p>Setting up your video interview session</p>
                    </>
                  ) : !isInterviewActive ? (
                    <>
                      <Video className="w-24 h-24 mx-auto mb-6 opacity-80" />
                      <h3 className="text-2xl font-bold mb-4">Ready for AI Video Interview</h3>
                      <p className="text-lg mb-6 opacity-90">
                        Experience a lifelike interview with Tavus AI avatar and ElevenLabs voice
                      </p>
                      
                      {availableReplicas.length > 0 && (
                        <div className="mb-6">
                          <label className="block text-sm font-medium mb-2">Select Interviewer:</label>
                          <select
                            value={selectedReplica}
                            onChange={(e) => setSelectedReplica(e.target.value)}
                            className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white"
                          >
                            {availableReplicas.map(replica => (
                              <option key={replica.replicaId} value={replica.replicaId} className="text-black">
                                {replica.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleStartInterview}
                        disabled={!selectedReplica}
                        className="bg-white text-purple-600 px-8 py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                      >
                        Start Video Interview
                      </motion.button>
                    </>
                  ) : (
                    <>
                      <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Video className="w-12 h-12" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Interview Session Active</h3>
                      <p>Connecting to video stream...</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Video Controls Overlay */}
            {isInterviewActive && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                <div className="flex items-center space-x-4 bg-black/50 backdrop-blur-lg rounded-2xl px-6 py-3">
                  <button
                    onClick={handleVoiceToggle}
                    className={`p-3 rounded-full transition-all duration-300 ${
                      isListening
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                  
                  <div className="text-white text-sm font-medium">
                    {isListening ? 'Listening...' : isSpeaking ? 'AI Speaking...' : 'Ready'}
                  </div>
                  
                  <button
                    onClick={handleEndInterview}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    End Interview
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat/Transcript Section */}
        <div className="w-1/3 p-6 flex flex-col">
          <div className="flex-1 bg-white rounded-xl shadow-lg overflow-hidden">
            <TranscriptPanel
              messages={messages}
              isTyping={isSpeaking}
            />
          </div>

          {/* Current Response */}
          {transcript && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-white rounded-xl shadow-lg p-4"
            >
              <h4 className="text-sm font-medium text-gray-700 mb-2">Your Response:</h4>
              <p className="text-gray-900 leading-relaxed">{transcript}</p>
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={() => handleUserResponse(transcript)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                >
                  Submit
                </button>
                <button
                  onClick={handleVoiceToggle}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  Record Again
                </button>
              </div>
            </motion.div>
          )}

          {/* Error Display */}
          {(error || voiceError) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4"
            >
              <p className="text-red-700 text-sm">
                {error || voiceError}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}