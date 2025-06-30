import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Settings, Download, CheckCircle, Volume2, VolumeX, Mic, Maximize2, Play, RefreshCw, Pause, SkipForward } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FaceInterviewer from '../Avatar/FaceInterviewer';
import VoiceRecorder from './VoiceRecorder';
import TranscriptPanel from './TranscriptPanel';
import FeedbackPanel from './FeedbackPanel';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { useInterview } from '../../hooks/useInterview';
import { StorageService } from '../../services/storage';
import type { InterviewSettings, FeedbackItem } from '../../types';

interface InterviewSessionProps {
  settings: InterviewSettings;
  onBack: () => void;
  onComplete: (session: any) => void;
  resumeData?: any;
}

export default function InterviewSession({ settings, onBack, onComplete, resumeData }: InterviewSessionProps) {
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<FeedbackItem[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [maxQuestions] = useState(8); // Increased for more comprehensive interview
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [initializationStep, setInitializationStep] = useState('starting');
  const [avatarEmotion, setAvatarEmotion] = useState<'neutral' | 'happy' | 'focused' | 'encouraging'>('neutral');
  const [speechError, setSpeechError] = useState<string | null>(null);
  
  // Auto-flow state management
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [interviewPaused, setInterviewPaused] = useState(false);
  const [responseSubmitted, setResponseSubmitted] = useState(false);
  const [autoQuestionTimer, setAutoQuestionTimer] = useState<NodeJS.Timeout | null>(null);
  const [responseTimeout, setResponseTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isAutoMode, setIsAutoMode] = useState(true); // New: Auto mode enabled by default

  const storageService = StorageService.getInstance();

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
    isSpeaking,
    speak,
    cancel: cancelSpeech,
    error: speechSynthesisError,
    isReady: speechReady,
    testSpeech,
    checkAudioPermissions
  } = useSpeechSynthesis();

  const {
    currentSession,
    isGenerating,
    error: interviewError,
    startInterview,
    generateQuestion,
    addUserResponse,
    endInterview,
    getFeedback
  } = useInterview();

  // Update avatar emotion based on interview state
  useEffect(() => {
    if (isSpeaking) {
      setAvatarEmotion('focused');
    } else if (isListening) {
      setAvatarEmotion('encouraging');
    } else if (questionCount > 0 && !isWaitingForResponse) {
      setAvatarEmotion('happy');
    } else {
      setAvatarEmotion('neutral');
    }
  }, [isSpeaking, isListening, questionCount, isWaitingForResponse]);

  // Monitor speech synthesis errors
  useEffect(() => {
    setSpeechError(speechSynthesisError);
  }, [speechSynthesisError]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (autoQuestionTimer) clearTimeout(autoQuestionTimer);
      if (responseTimeout) clearTimeout(responseTimeout);
    };
  }, [autoQuestionTimer, responseTimeout]);

  // Initialize interview with automatic flow
  useEffect(() => {
    const initializeInterview = async () => {
      try {
        console.log('Starting automatic Gemini AI interview...');
        setInitializationStep('initializing');
        
        // Check audio permissions first
        await checkAudioPermissions();
        
        // Start the interview session
        const session = startInterview(settings, resumeData);
        if (!session) {
          throw new Error('Failed to create interview session');
        }
        
        console.log('Interview session created successfully');
        setInitializationStep('preparing');
        
        // Wait for speech synthesis to be ready
        let speechWaitAttempts = 0;
        while (!speechReady && speechWaitAttempts < 10) {
          console.log('Waiting for speech synthesis to be ready...');
          await new Promise(resolve => setTimeout(resolve, 500));
          speechWaitAttempts++;
        }
        
        setInitializationStep('generating');
        console.log('Generating first question with Gemini AI...');
        
        // Generate the first question automatically
        const firstQuestion = await generateQuestion(session);
        if (firstQuestion) {
          console.log('First question generated:', firstQuestion.content);
          setInitializationStep('ready');
          
          // Mark as fully initialized
          setIsInitialized(true);
          
          // Automatically start the interview flow
          setTimeout(async () => {
            await startAutomaticQuestionFlow(firstQuestion.content);
          }, 2000);
        } else {
          console.error('Failed to generate first question');
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Error during interview initialization:', error);
        setSpeechError('Initialization failed. Please try again.');
        setIsInitialized(true);
      }
    };

    initializeInterview();
  }, [settings, resumeData, startInterview, generateQuestion, speechReady, checkAudioPermissions]);

  // Automatic question flow function
  const startAutomaticQuestionFlow = async (questionText: string) => {
    if (interviewPaused || !isAutoMode) return;

    try {
      console.log('Starting automatic question flow with Gemini AI');
      
      // Speak the question automatically
      if (!isSpeakerMuted) {
        console.log('AI speaking question:', questionText.substring(0, 50) + '...');
        await speak(questionText, settings.voiceAccent);
      }
      
      // Automatically start listening for response after question is spoken
      setTimeout(() => {
        if (!interviewPaused && isAutoMode) {
          setIsWaitingForResponse(true);
          console.log('Auto-starting voice recognition...');
          startListening();
          
          // Set a timeout for response (30 seconds)
          const timeout = setTimeout(() => {
            if (isListening) {
              console.log('Response timeout reached, moving to next question');
              stopListening();
              handleAutoNextQuestion();
            }
          }, 30000);
          
          setResponseTimeout(timeout);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error in automatic question flow:', error);
      setSpeechError('Failed to speak question automatically.');
    }
  };

  // Auto-generate next question
  const handleAutoNextQuestion = useCallback(async () => {
    if (interviewPaused || !isAutoMode) return;
    
    console.log('Auto-generating next question with Gemini AI...');
    setResponseSubmitted(false);
    setIsWaitingForResponse(false);
    
    // Clear any existing timers
    if (responseTimeout) {
      clearTimeout(responseTimeout);
      setResponseTimeout(null);
    }
    
    const newQuestionCount = questionCount + 1;
    setQuestionCount(newQuestionCount);

    // Check if interview should end
    if (newQuestionCount >= maxQuestions) {
      console.log('Interview completed, ending session...');
      setTimeout(async () => {
        await handleEndInterview();
      }, 2000);
      return;
    }
    
    // Generate next question automatically
    const message = await generateQuestion();
    if (message) {
      // Wait a moment before asking next question
      const timer = setTimeout(async () => {
        await startAutomaticQuestionFlow(message.content);
      }, 3000); // 3 second pause between questions
      
      setAutoQuestionTimer(timer);
    }
  }, [generateQuestion, questionCount, maxQuestions, interviewPaused, isAutoMode, responseTimeout]);

  // Handle automatic response submission
  const handleAutoSubmitResponse = useCallback(async (response: string) => {
    if (!currentSession || responseSubmitted || !isAutoMode) return;

    console.log('Auto-submitting response to Gemini AI:', response.substring(0, 50) + '...');
    setResponseSubmitted(true);
    setIsWaitingForResponse(false);

    // Clear response timeout
    if (responseTimeout) {
      clearTimeout(responseTimeout);
      setResponseTimeout(null);
    }

    addUserResponse(response);
    resetTranscript();

    // Get feedback for this response using Gemini AI
    const lastQuestion = currentSession.messages
      .filter(m => m.role === 'assistant')
      .pop();

    if (lastQuestion) {
      const feedback = await getFeedback(response, lastQuestion.content);
      if (feedback) {
        const feedbackItem: FeedbackItem = {
          category: 'communication',
          score: feedback.score,
          feedback: feedback.feedback,
          suggestions: feedback.suggestions
        };
        setCurrentFeedback(prev => [...prev, feedbackItem]);
        setOverallScore(prev => prev === 0 ? feedback.score : (prev + feedback.score) / 2);
      }
    }

    // Automatically proceed to next question
    setTimeout(() => {
      handleAutoNextQuestion();
    }, 2000);
  }, [
    currentSession,
    addUserResponse,
    resetTranscript,
    getFeedback,
    responseSubmitted,
    isAutoMode,
    responseTimeout,
    handleAutoNextQuestion
  ]);

  // Auto-submit when user stops speaking (transcript is complete)
  useEffect(() => {
    if (transcript && !isListening && isWaitingForResponse && !responseSubmitted && isAutoMode) {
      // Wait a moment to ensure user is done speaking
      const submitTimer = setTimeout(() => {
        if (transcript.trim().length > 10) { // Minimum response length
          handleAutoSubmitResponse(transcript);
        } else {
          // If response too short, restart listening
          console.log('Response too short, restarting listening...');
          startListening();
        }
      }, 2000);

      return () => clearTimeout(submitTimer);
    }
  }, [transcript, isListening, isWaitingForResponse, responseSubmitted, isAutoMode, handleAutoSubmitResponse, startListening]);

  const handleEndInterview = useCallback(async () => {
    console.log('Ending automatic Gemini AI interview session...');
    setIsAutoMode(false); // Disable auto mode
    
    // Clear all timers
    if (autoQuestionTimer) clearTimeout(autoQuestionTimer);
    if (responseTimeout) clearTimeout(responseTimeout);
    
    const session = await endInterview();
    if (session) {
      onComplete(session);
    }
  }, [endInterview, onComplete, autoQuestionTimer, responseTimeout]);

  const handlePauseInterview = () => {
    const newPausedState = !interviewPaused;
    setInterviewPaused(newPausedState);
    
    if (newPausedState) {
      // Pause: stop all activities
      if (isSpeaking) cancelSpeech();
      if (isListening) stopListening();
      if (autoQuestionTimer) clearTimeout(autoQuestionTimer);
      if (responseTimeout) clearTimeout(responseTimeout);
      console.log('Interview paused');
    } else {
      // Resume: continue auto flow if in auto mode
      console.log('Interview resumed');
      if (isAutoMode && !isWaitingForResponse && !isSpeaking) {
        // Resume by generating next question
        setTimeout(() => {
          handleAutoNextQuestion();
        }, 1000);
      }
    }
  };

  const toggleAutoMode = () => {
    setIsAutoMode(!isAutoMode);
    console.log('Auto mode toggled:', !isAutoMode);
  };

  const toggleSpeaker = () => {
    setIsSpeakerMuted(!isSpeakerMuted);
    if (isSpeaking) {
      cancelSpeech();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleTestSpeech = async () => {
    console.log('Testing speech...');
    try {
      setSpeechError(null);
      await testSpeech();
      console.log('Speech test completed');
    } catch (error) {
      console.error('Speech test failed:', error);
      setSpeechError('Speech test failed. Please check your browser audio settings.');
    }
  };

  const handleRetryAudio = async () => {
    console.log('Retrying audio setup...');
    setSpeechError(null);
    try {
      await checkAudioPermissions();
      await testSpeech();
    } catch (error) {
      console.error('Audio retry failed:', error);
      setSpeechError('Audio setup failed. Please check your browser settings.');
    }
  };

  const getInitializationMessage = () => {
    switch (initializationStep) {
      case 'starting':
        return 'Connecting to Gemini AI...';
      case 'initializing':
        return 'Setting up AI interviewer with Gemini...';
      case 'preparing':
        return 'Preparing intelligent questions...';
      case 'generating':
        return 'Gemini AI generating your first question...';
      case 'ready':
        return 'Starting automatic interview flow...';
      default:
        return 'Initializing Gemini AI interview experience...';
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white rounded-xl shadow-xl p-8 max-w-md"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">🚀 Gemini AI Ready!</h2>
          <p className="text-gray-600 mb-4">
            Automatic interview flow with intelligent Gemini AI questions
          </p>
          <div className="bg-purple-50 rounded-lg p-4 mb-6 border border-purple-200">
            <div className="flex items-center justify-center text-purple-700">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="font-medium">Gemini AI • Auto Questions • Smart Flow</span>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-3"></div>
            <p className="text-gray-600 font-medium">{getInitializationMessage()}</p>
            
            {/* Progress indicator */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: initializationStep === 'starting' ? '20%' :
                         initializationStep === 'initializing' ? '40%' :
                         initializationStep === 'preparing' ? '60%' :
                         initializationStep === 'generating' ? '80%' :
                         initializationStep === 'ready' ? '95%' : '100%'
                }}
              />
            </div>
          </div>
          
          {/* Audio Controls */}
          <div className="mt-6 space-y-3">
            <button
              onClick={handleTestSpeech}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center justify-center"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Test Speech System
            </button>

            {speechError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm mb-2">{speechError}</p>
                <button
                  onClick={handleRetryAudio}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors flex items-center"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry Audio
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white rounded-xl shadow-xl p-8 max-w-md"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Error</h2>
          <p className="text-gray-600 mb-6">
            There was an issue starting your Gemini AI interview session. Please try again.
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
                  Gemini AI {settings.type.charAt(0).toUpperCase() + settings.type.slice(1)} Interview
                </h1>
                <p className="text-sm text-gray-500">
                  Question {questionCount + 1} of {maxQuestions} • Automatic Flow • Intelligent Questions
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-48 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((questionCount) / maxQuestions) * 100}%` }}
                />
              </div>
              
              {/* Auto Mode Toggle */}
              <button
                onClick={toggleAutoMode}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  isAutoMode 
                    ? 'bg-green-100 text-green-700 border border-green-300' 
                    : 'bg-gray-100 text-gray-600 border border-gray-300'
                }`}
                title={isAutoMode ? 'Auto Mode ON' : 'Auto Mode OFF'}
              >
                {isAutoMode ? '🤖 AUTO' : '👤 MANUAL'}
              </button>
              
              {/* Interview Controls */}
              <button
                onClick={handlePauseInterview}
                className={`p-2 rounded-lg transition-colors ${
                  interviewPaused 
                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                    : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                }`}
                title={interviewPaused ? 'Resume Interview' : 'Pause Interview'}
              >
                {interviewPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>
              
              <div className="flex items-center text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                <CheckCircle className="w-4 h-4 mr-1" />
                Gemini AI
              </div>
              <button
                onClick={toggleFullscreen}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="Toggle Fullscreen Avatar"
              >
                <Maximize2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowFeedback(!showFeedback)}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`flex ${isFullscreen ? 'h-[calc(100vh-4rem)]' : 'h-[calc(100vh-4rem)]'}`}>
        {/* Main Interview Area */}
        <div className={`flex ${isFullscreen ? 'w-full' : 'flex-1'}`}>
          {/* Avatar Section */}
          <div className={`${isFullscreen ? 'w-full' : 'w-1/2'} ${isFullscreen ? 'p-0' : 'p-6'}`}>
            <div className={`h-full ${isFullscreen ? '' : 'bg-white rounded-xl shadow-lg overflow-hidden'}`}>
              <FaceInterviewer
                isSpeaking={isSpeaking}
                avatarStyle={settings.avatarStyle}
                emotion={avatarEmotion}
                className="h-full w-full"
              />
            </div>
          </div>

          {/* Voice Interaction Section - Hide in fullscreen */}
          {!isFullscreen && (
            <div className="w-1/2 p-6 flex flex-col">
              <div className="flex-1 bg-white rounded-xl shadow-lg p-6">
                <VoiceRecorder
                  isListening={isListening}
                  isSupported={isSupported}
                  transcript={transcript}
                  onStartListening={startListening}
                  onStopListening={stopListening}
                  onSubmitResponse={handleAutoSubmitResponse}
                  isSpeaking={isSpeaking}
                  onToggleSpeaker={toggleSpeaker}
                  isSpeakerMuted={isSpeakerMuted}
                  disabled={interviewPaused || !isAutoMode}
                />
                
                {/* Interview Status */}
                <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-700">Gemini AI Status:</span>
                    <span className={`text-sm font-semibold ${
                      interviewPaused ? 'text-yellow-600' :
                      isWaitingForResponse ? 'text-blue-600' :
                      isSpeaking ? 'text-purple-600' :
                      isGenerating ? 'text-orange-600' :
                      'text-green-600'
                    }`}>
                      {interviewPaused ? 'Paused' :
                       isWaitingForResponse ? 'Listening for your response' :
                       isSpeaking ? 'AI asking question' :
                       isGenerating ? 'Generating next question' :
                       'Processing...'}
                    </span>
                  </div>
                  
                  {isAutoMode && (
                    <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                      🤖 Automatic mode: Questions flow naturally with Gemini AI
                    </div>
                  )}
                </div>
                
                {/* Error Messages */}
                {(voiceError || interviewError || speechError) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <p className="text-red-700 text-sm">
                      {voiceError || interviewError || speechError}
                    </p>
                    {speechError && (
                      <div className="mt-2 space-x-2">
                        <button
                          onClick={handleTestSpeech}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors"
                        >
                          Test Speech
                        </button>
                        <button
                          onClick={handleRetryAudio}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors"
                        >
                          Retry Audio
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Speech Status */}
                <div className="mt-4 flex items-center justify-center space-x-4 text-sm">
                  <div className={`flex items-center ${isSpeaking ? 'text-purple-600' : 'text-gray-500'}`}>
                    {isSpeakerMuted ? <VolumeX className="w-4 h-4 mr-1" /> : <Volume2 className="w-4 h-4 mr-1" />}
                    <span>{isSpeaking ? 'Gemini AI Speaking...' : 'AI Ready'}</span>
                  </div>
                  <div className={`flex items-center ${isListening ? 'text-blue-600' : 'text-gray-500'}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${isListening ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`} />
                    <span>{isListening ? 'Listening...' : 'Ready to Listen'}</span>
                  </div>
                </div>

                {/* Speech Ready Indicator */}
                {speechReady && (
                  <div className="mt-4 flex items-center justify-center">
                    <div className="flex items-center space-x-1 px-3 py-2 bg-green-50 rounded-full border border-green-200">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-xs text-green-700 font-medium">Gemini AI Voice System Ready</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Transcript Panel */}
              <div className="h-64 mt-6 bg-white rounded-xl shadow-lg overflow-hidden">
                <TranscriptPanel
                  messages={currentSession.messages}
                  isTyping={isGenerating}
                />
              </div>
            </div>
          )}
        </div>

        {/* Feedback Panel - Hide in fullscreen */}
        <AnimatePresence>
          {showFeedback && !isFullscreen && (
            <FeedbackPanel
              feedback={currentFeedback}
              overallScore={overallScore}
              isVisible={showFeedback}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Fullscreen Controls Overlay */}
      {isFullscreen && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl px-6 py-4 border border-white/20 shadow-xl">
            <div className="flex items-center space-x-6">
              {/* Voice Controls */}
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isSpeaking || interviewPaused || !isAutoMode}
                className={`p-4 rounded-full transition-all duration-300 ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg animate-pulse'
                    : 'bg-primary-500 hover:bg-primary-600 text-white shadow-md'
                } ${(isSpeaking || interviewPaused || !isAutoMode) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Mic className="w-6 h-6" />
              </button>

              {/* Speaker Toggle */}
              <button
                onClick={toggleSpeaker}
                className={`p-3 rounded-full transition-all duration-300 ${
                  isSpeakerMuted
                    ? 'bg-gray-300 hover:bg-gray-400 text-gray-600'
                    : 'bg-secondary-500 hover:bg-secondary-600 text-white'
                }`}
              >
                {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              {/* Pause/Resume */}
              <button
                onClick={handlePauseInterview}
                className={`p-3 rounded-full transition-all duration-300 ${
                  interviewPaused 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                }`}
              >
                {interviewPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>

              {/* Auto Mode Toggle */}
              <button
                onClick={toggleAutoMode}
                className={`p-3 rounded-full transition-all duration-300 ${
                  isAutoMode 
                    ? 'bg-purple-500 hover:bg-purple-600 text-white' 
                    : 'bg-gray-500 hover:bg-gray-600 text-white'
                }`}
                title={isAutoMode ? 'Auto Mode ON' : 'Auto Mode OFF'}
              >
                {isAutoMode ? '🤖' : '👤'}
              </button>

              {/* Status Display */}
              <div className="text-white text-sm font-medium">
                {interviewPaused ? 'Paused' :
                 isListening ? 'Listening...' : 
                 isSpeaking ? 'Gemini AI Speaking...' : 
                 isGenerating ? 'Generating...' :
                 'Auto Mode'}
              </div>

              {/* Exit Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-3 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Transcript Display */}
      {isFullscreen && transcript && (
        <div className="fixed top-6 left-6 right-6 z-40">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 shadow-xl">
            <h4 className="text-white font-medium mb-2">Your Response (Auto-submitting):</h4>
            <p className="text-white/90 leading-relaxed">{transcript}</p>
            <div className="mt-2 text-xs text-white/70">
              🤖 Gemini AI will automatically process your response when you finish speaking
            </div>
          </div>
        </div>
      )}
    </div>
  );
}