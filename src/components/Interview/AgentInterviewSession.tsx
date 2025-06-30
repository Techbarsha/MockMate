import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Settings, Volume2, VolumeX, Mic, Maximize2, Play, Pause, Send, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FaceInterviewer from '../Avatar/FaceInterviewer';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { useElevenLabsAgent } from '../../hooks/useElevenLabsAgent';
import type { InterviewSettings } from '../../types';

interface AgentInterviewSessionProps {
  settings: InterviewSettings;
  onBack: () => void;
  onComplete: (session: any) => void;
  resumeData?: any;
}

export default function AgentInterviewSession({ 
  settings, 
  onBack, 
  onComplete, 
  resumeData 
}: AgentInterviewSessionProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [useVoiceInput, setUseVoiceInput] = useState(true);
  const [sessionStartTime] = useState(new Date());
  const [avatarEmotion, setAvatarEmotion] = useState<'neutral' | 'happy' | 'focused' | 'encouraging'>('neutral');

  const {
    isListening,
    transcript,
    error: voiceError,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useVoiceRecognition();

  const {
    isConnected,
    isConnecting,
    error: agentError,
    messages,
    isSpeaking,
    startConversation,
    sendMessage,
    endConversation,
    testConnection,
    hasApiKey
  } = useElevenLabsAgent();

  // Update avatar emotion based on conversation state
  useEffect(() => {
    if (isSpeaking) {
      setAvatarEmotion('focused');
    } else if (isListening) {
      setAvatarEmotion('encouraging');
    } else if (messages.length > 1) {
      setAvatarEmotion('happy');
    } else {
      setAvatarEmotion('neutral');
    }
  }, [isSpeaking, isListening, messages.length]);

  // Auto-submit voice transcript
  useEffect(() => {
    if (transcript && !isListening && useVoiceInput && transcript.trim().length > 10) {
      const submitTimer = setTimeout(() => {
        handleSendMessage(transcript);
        resetTranscript();
      }, 2000);

      return () => clearTimeout(submitTimer);
    }
  }, [transcript, isListening, useVoiceInput, resetTranscript]);

  const handleStartConversation = useCallback(async () => {
    try {
      const success = await startConversation();
      if (!success) {
        console.error('Failed to start agent conversation');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  }, [startConversation]);

  const handleSendMessage = useCallback((message: string) => {
    if (!message.trim() || !isConnected) return;

    sendMessage(message);
    setTextInput('');
  }, [sendMessage, isConnected]);

  const handleEndInterview = useCallback(async () => {
    endConversation();
    
    // Create session data for results
    const session = {
      id: Date.now().toString(),
      settings,
      messages: messages.map(msg => ({
        id: msg.id,
        role: msg.role === 'agent' ? 'assistant' : 'user',
        content: msg.content,
        timestamp: msg.timestamp
      })),
      startTime: sessionStartTime,
      endTime: new Date(),
      score: Math.min(85 + Math.random() * 15, 100), // Simulated score
      feedback: 'Great conversation with the AI agent! Your responses showed good engagement and communication skills.'
    };

    onComplete(session);
  }, [endConversation, messages, settings, sessionStartTime, onComplete]);

  const handleVoiceToggle = useCallback(async () => {
    if (isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleTestAgent = useCallback(async () => {
    try {
      await testConnection();
    } catch (error) {
      console.error('Agent test failed:', error);
    }
  }, [testConnection]);

  if (!hasApiKey()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white rounded-xl shadow-xl p-8 max-w-md"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔑</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">API Key Required</h2>
          <p className="text-gray-600 mb-6">
            ElevenLabs API key is required for agent conversations.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

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
                  ElevenLabs Agent Interview
                </h1>
                <p className="text-sm text-gray-500">
                  Conversational AI • Real-time Voice • Interactive Agent
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {isConnected && (
                <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                  Agent Connected
                </div>
              )}
              
              <button
                onClick={() => setUseVoiceInput(!useVoiceInput)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  useVoiceInput 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'bg-gray-100 text-gray-600 border border-gray-300'
                }`}
              >
                {useVoiceInput ? '🎤 VOICE' : '⌨️ TEXT'}
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
                <Maximize2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`flex ${isFullscreen ? 'h-[calc(100vh-4rem)]' : 'h-[calc(100vh-4rem)]'}`}>
        {/* Avatar Section */}
        <div className={`${isFullscreen ? 'w-full' : 'w-2/3'} ${isFullscreen ? 'p-0' : 'p-6'}`}>
          <div className={`h-full ${isFullscreen ? '' : 'bg-white rounded-xl shadow-lg overflow-hidden'}`}>
            {!isConnected ? (
              <div className="h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600">
                <div className="text-center text-white">
                  {isConnecting ? (
                    <>
                      <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Connecting to Agent...</h3>
                      <p>Setting up conversational AI interview</p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center mb-6">
                        <MessageCircle className="w-12 h-12 mr-4 opacity-80" />
                        <Mic className="w-12 h-12 opacity-80" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4">ElevenLabs Agent Ready</h3>
                      <p className="text-lg mb-6 opacity-90">
                        Experience natural conversations with AI interview agent
                      </p>
                      
                      <div className="space-y-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleStartConversation}
                          className="bg-white text-purple-600 px-8 py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          Start Agent Interview
                        </motion.button>
                        
                        <button
                          onClick={handleTestAgent}
                          className="block mx-auto text-white/80 hover:text-white text-sm underline"
                        >
                          Test Agent Connection
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <FaceInterviewer
                isSpeaking={isSpeaking}
                avatarStyle={settings.avatarStyle}
                emotion={avatarEmotion}
                className="h-full w-full"
                gender="female"
              />
            )}
          </div>
        </div>

        {/* Chat Section - Hide in fullscreen */}
        {!isFullscreen && (
          <div className="w-1/3 p-6 flex flex-col">
            {/* Messages */}
            <div className="flex-1 bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900">Agent Conversation</h3>
                  <p className="text-sm text-gray-500">{messages.length} messages</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-75 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {isSpeaking && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Input Controls */}
            {isConnected && (
              <div className="mt-4 bg-white rounded-xl shadow-lg p-4">
                {useVoiceInput ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={handleVoiceToggle}
                        disabled={isSpeaking}
                        className={`p-4 rounded-full transition-all duration-300 ${
                          isListening
                            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        } ${isSpeaking ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Mic className="w-6 h-6" />
                      </button>
                    </div>
                    
                    {transcript && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700">{transcript}</p>
                        <div className="mt-2 text-xs text-blue-600">
                          Auto-submitting when you finish speaking...
                        </div>
                      </div>
                    )}
                    
                    <div className="text-center text-sm text-gray-600">
                      {isListening ? 'Listening...' : 
                       isSpeaking ? 'Agent speaking...' : 
                       'Click to speak'}
                    </div>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(textInput)}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => handleSendMessage(textInput)}
                      disabled={!textInput.trim()}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <button
                  onClick={handleEndInterview}
                  className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  End Interview
                </button>
              </div>
            )}

            {/* Error Display */}
            {(agentError || voiceError) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4"
              >
                <p className="text-red-700 text-sm">
                  {agentError || voiceError}
                </p>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Controls */}
      {isFullscreen && isConnected && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl px-6 py-4 border border-white/20 shadow-xl">
            <div className="flex items-center space-x-6">
              {useVoiceInput && (
                <button
                  onClick={handleVoiceToggle}
                  disabled={isSpeaking}
                  className={`p-4 rounded-full transition-all duration-300 ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  } ${isSpeaking ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Mic className="w-6 h-6" />
                </button>
              )}

              <div className="text-white text-sm font-medium">
                {isListening ? 'Listening...' : 
                 isSpeaking ? 'Agent Speaking...' : 
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

      {/* Fullscreen Transcript */}
      {isFullscreen && transcript && useVoiceInput && (
        <div className="fixed top-6 left-6 right-6 z-40">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 shadow-xl">
            <h4 className="text-white font-medium mb-2">Your Message:</h4>
            <p className="text-white/90 leading-relaxed">{transcript}</p>
            <div className="mt-2 text-xs text-white/70">
              🤖 Agent will respond automatically
            </div>
          </div>
        </div>
      )}
    </div>
  );
}