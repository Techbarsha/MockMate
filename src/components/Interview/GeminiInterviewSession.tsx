import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Settings, Video, Mic, VolumeX, Volume2, Pause, Play, Sparkles, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGeminiInterview } from '../../hooks/useGeminiInterview';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import FaceInterviewer from '../Avatar/FaceInterviewer';
import TranscriptPanel from './TranscriptPanel';
import type { InterviewSettings, Message } from '../../types';

interface GeminiInterviewSessionProps {
  settings: InterviewSettings;
  onBack: () => void;
  onComplete: (session: any) => void;
  resumeData?: any;
}

export default function GeminiInterviewSession({ 
  settings, 
  onBack, 
  onComplete, 
  resumeData 
}: GeminiInterviewSessionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoMode, setAutoMode] = useState(true);
  const [responseSubmitted, setResponseSubmitted] = useState(false);

  const {
    isConnected,
    isLoading,
    error,
    isSpeaking,
    isGenerating,
    availableVoices,
    conversationHistory,
    interviewComplete,
    startGeminiInterview,
    sendMessage,
    endInterview,
    speakWithElevenLabs
  } = useGeminiInterview();

  const {
    isListening,
    transcript,
    error: voiceError,
    startListening,
    stopListening,
    resetTranscript
  } = useVoiceRecognition();

  // Initialize voice selection
  useEffect(() => {
    if (availableVoices.length > 0 && !selectedVoice) {
      // Try to find a professional female voice
      const femaleVoice = availableVoices.find(v => 
        v.name.toLowerCase().includes('rachel') || 
        v.name.toLowerCase().includes('bella') ||
        v.labels?.gender === 'female'
      );
      setSelectedVoice(femaleVoice?.voiceId || availableVoices[0].voiceId);
    }
  }, [availableVoices, selectedVoice]);

  // Convert conversation history to messages format
  useEffect(() => {
    const convertedMessages: Message[] = conversationHistory.map((entry, index) => ({
      id: `${Date.now()}-${index}`,
      role: entry.role as 'user' | 'assistant',
      content: entry.content,
      timestamp: new Date()
    }));
    setMessages(convertedMessages);
  }, [conversationHistory]);

  const handleStartInterview = useCallback(async () => {
    const result = await startGeminiInterview({
      interviewType: settings.type,
      difficulty: settings.difficulty,
      duration: settings.duration,
      resumeData,
      candidateName: resumeData?.name,
      voiceId: selectedVoice
    });

    if (result.success) {
      setIsInterviewActive(true);
      
      // Speak the welcome message with ElevenLabs
      if (!isMuted && result.welcomeMessage) {
        setTimeout(async () => {
          await speakWithElevenLabs(result.welcomeMessage, selectedVoice);
        }, 1000);
      }
    }
  }, [startGeminiInterview, settings, resumeData, selectedVoice, isMuted, speakWithElevenLabs]);

  const handleUserResponse = useCallback(async (response: string) => {
    if (!response.trim() || responseSubmitted || isGenerating) return;

    setResponseSubmitted(true);
    resetTranscript();

    try {
      // Send message to Gemini
      const aiResponse = await sendMessage(response);
      
      if (aiResponse && !isMuted) {
        // Speak AI response with ElevenLabs
        setTimeout(async () => {
          await speakWithElevenLabs(aiResponse.response, selectedVoice);
          setResponseSubmitted(false);
        }, 1000);
      } else {
        setResponseSubmitted(false);
      }
    } catch (error) {
      console.error('Error handling user response:', error);
      setResponseSubmitted(false);
    }
  }, [sendMessage, resetTranscript, isMuted, speakWithElevenLabs, selectedVoice, responseSubmitted, isGenerating]);

  const handleEndInterview = useCallback(async () => {
    try {
      const sessionData = await endInterview();
      setIsInterviewActive(false);
      
      // Create session data for results
      const session = {
        id: sessionData.sessionInfo?.sessionId || Date.now().toString(),
        settings,
        messages,
        startTime: sessionData.sessionInfo?.startTime || new Date(Date.now() - settings.duration * 60 * 1000),
        endTime: new Date(),
        score: sessionData.feedback?.overallScore || 75,
        feedback: sessionData.feedback?.feedback || 'Interview completed successfully!',
        detailedFeedback: sessionData.feedback
      };

      onComplete(session);
    } catch (error) {
      console.error('Error ending interview:', error);
      // Fallback completion
      onComplete({
        id: Date.now().toString(),
        settings,
        messages,
        startTime: new Date(Date.now() - settings.duration * 60 * 1000),
        endTime: new Date(),
        score: 75,
        feedback: 'Interview completed successfully!'
      });
    }
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
    if (transcript && !isListening && transcript.length > 10 && autoMode && !responseSubmitted) {
      const submitTimer = setTimeout(() => {
        handleUserResponse(transcript);
      }, 2000);

      return () => clearTimeout(submitTimer);
    }
  }, [transcript, isListening, handleUserResponse, autoMode, responseSubmitted]);

  // Auto-complete interview when Gemini indicates completion
  useEffect(() => {
    if (interviewComplete && isInterviewActive) {
      setTimeout(() => {
        handleEndInterview();
      }, 3000);
    }
  }, [interviewComplete, isInterviewActive, handleEndInterview]);

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
                  Gemini AI + ElevenLabs Interview
                </h1>
                <p className="text-sm text-gray-500">
                  Intelligent AI conversations • Ultra-realistic voice • {settings.type} interview
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {isConnected && (
                <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                  Gemini AI Active
                </div>
              )}
              
              <button
                onClick={() => setAutoMode(!autoMode)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  autoMode 
                    ? 'bg-green-100 text-green-700 border border-green-300' 
                    : 'bg-gray-100 text-gray-600 border border-gray-300'
                }`}
              >
                {autoMode ? '🤖 AUTO' : '👤 MANUAL'}
              </button>
              
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

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Video className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`flex ${isFullscreen ? 'h-[calc(100vh-4rem)]' : 'h-[calc(100vh-4rem)]'}`}>
        {/* Avatar Section */}
        <div className={`${isFullscreen ? 'w-full' : 'w-2/3'} ${isFullscreen ? 'p-0' : 'p-6'}`}>
          <div className={`h-full ${isFullscreen ? '' : 'bg-white rounded-xl shadow-lg overflow-hidden'}`}>
            {!isInterviewActive ? (
              <div className="h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600">
                <div className="text-center text-white">
                  {isLoading ? (
                    <>
                      <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Initializing Gemini AI...</h3>
                      <p>Setting up intelligent interview conversation</p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center mb-6">
                        <Sparkles className="w-12 h-12 mr-4 opacity-80" />
                        <Brain className="w-12 h-12 opacity-80" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4">Gemini AI + ElevenLabs Ready</h3>
                      <p className="text-lg mb-6 opacity-90">
                        Experience intelligent conversations with ultra-realistic voice
                      </p>
                      
                      {availableVoices.length > 0 && (
                        <div className="mb-6">
                          <label className="block text-sm font-medium mb-2">Select Voice:</label>
                          <select
                            value={selectedVoice}
                            onChange={(e) => setSelectedVoice(e.target.value)}
                            className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white"
                          >
                            {availableVoices.map(voice => (
                              <option key={voice.voiceId} value={voice.voiceId} className="text-black">
                                {voice.name} ({voice.category})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleStartInterview}
                        disabled={!selectedVoice}
                        className="bg-white text-purple-600 px-8 py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                      >
                        Start AI Interview
                      </motion.button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <FaceInterviewer
                isSpeaking={isSpeaking}
                avatarStyle={settings.avatarStyle}
                emotion={isGenerating ? 'focused' : isListening ? 'encouraging' : 'neutral'}
                className="h-full w-full"
                gender="female"
              />
            )}
          </div>
        </div>

        {/* Chat/Controls Section - Hide in fullscreen */}
        {!isFullscreen && (
          <div className="w-1/3 p-6 flex flex-col">
            <div className="flex-1 bg-white rounded-xl shadow-lg overflow-hidden">
              <TranscriptPanel
                messages={messages}
                isTyping={isGenerating}
              />
            </div>

            {/* Voice Controls */}
            {isInterviewActive && (
              <div className="mt-4 bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <button
                    onClick={handleVoiceToggle}
                    disabled={isSpeaking || responseSubmitted}
                    className={`p-4 rounded-full transition-all duration-300 ${
                      isListening
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    } ${(isSpeaking || responseSubmitted) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Mic className="w-6 h-6" />
                  </button>
                  
                  <button
                    onClick={handleEndInterview}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    End Interview
                  </button>
                </div>

                <div className="text-center text-sm text-gray-600">
                  {responseSubmitted ? 'Processing response...' :
                   isGenerating ? 'Gemini AI thinking...' :
                   isListening ? 'Listening to your response...' :
                   isSpeaking ? 'AI speaking with ElevenLabs...' :
                   'Ready for your response'}
                </div>
              </div>
            )}

            {/* Current Response */}
            {transcript && !responseSubmitted && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 bg-white rounded-xl shadow-lg p-4"
              >
                <h4 className="text-sm font-medium text-gray-700 mb-2">Your Response:</h4>
                <p className="text-gray-900 leading-relaxed">{transcript}</p>
                {!autoMode && (
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
                )}
                {autoMode && (
                  <div className="mt-2 text-xs text-blue-600">
                    Auto-submitting when you finish speaking...
                  </div>
                )}
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
        )}
      </div>

      {/* Fullscreen Controls Overlay */}
      {isFullscreen && isInterviewActive && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl px-6 py-4 border border-white/20 shadow-xl">
            <div className="flex items-center space-x-6">
              <button
                onClick={handleVoiceToggle}
                disabled={isSpeaking || responseSubmitted}
                className={`p-4 rounded-full transition-all duration-300 ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                } ${(isSpeaking || responseSubmitted) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Mic className="w-6 h-6" />
              </button>

              <div className="text-white text-sm font-medium">
                {responseSubmitted ? 'Processing...' :
                 isGenerating ? 'AI Thinking...' :
                 isListening ? 'Listening...' :
                 isSpeaking ? 'AI Speaking...' :
                 'Ready'}
              </div>

              <button
                onClick={handleEndInterview}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                End Interview
              </button>

              <button
                onClick={() => setIsFullscreen(false)}
                className="p-3 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Transcript Display */}
      {isFullscreen && transcript && !responseSubmitted && (
        <div className="fixed top-6 left-6 right-6 z-40">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 shadow-xl">
            <h4 className="text-white font-medium mb-2">Your Response:</h4>
            <p className="text-white/90 leading-relaxed">{transcript}</p>
            {autoMode && (
              <div className="mt-2 text-xs text-white/70">
                🤖 Gemini AI will process your response automatically
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}