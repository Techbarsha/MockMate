import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Settings, Download, CheckCircle, Volume2, VolumeX, Mic, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import InterviewerAvatar from '../Avatar/InterviewerAvatar';
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
  resumeData?: any;
}

export default function InterviewSession({ settings, onBack, resumeData }: InterviewSessionProps) {
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<FeedbackItem[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [maxQuestions] = useState(5);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [initializationStep, setInitializationStep] = useState('starting');

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
    error: speechError,
    testSpeech,
    audioAnalyzer
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

  // Initialize interview with better error handling and progress tracking
  useEffect(() => {
    const initializeInterview = async () => {
      try {
        console.log('Starting interview initialization...');
        setInitializationStep('initializing');
        
        // Start the interview session
        const session = startInterview(settings, resumeData);
        if (!session) {
          throw new Error('Failed to create interview session');
        }
        
        console.log('Interview session created successfully');
        setInitializationStep('preparing');
        
        // Wait a moment for UI to settle
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setInitializationStep('generating');
        console.log('Generating first question...');
        
        // Generate and speak the first question - pass the session directly
        const firstQuestion = await generateQuestion(session);
        if (firstQuestion) {
          console.log('First question generated:', firstQuestion.content);
          setInitializationStep('ready');
          
          // Wait a moment before speaking
          setTimeout(async () => {
            if (!isSpeakerMuted) {
              try {
                console.log('Speaking first question...');
                await speak(firstQuestion.content, settings.voiceAccent);
                console.log('First question spoken successfully');
              } catch (error) {
                console.error('Error speaking first question:', error);
                // Continue anyway - user can still read the question
              }
            }
            
            // Mark as fully initialized
            setIsInitialized(true);
            console.log('Interview fully initialized and ready');
          }, 500);
        } else {
          console.error('Failed to generate first question');
          // Still allow the interview to proceed
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Error during interview initialization:', error);
        // Show error but still allow proceeding
        setIsInitialized(true);
      }
    };

    initializeInterview();
  }, [settings, resumeData, startInterview, generateQuestion, speak, isSpeakerMuted]);

  const handleGenerateQuestion = useCallback(async () => {
    console.log('Generating question...');
    const message = await generateQuestion();
    if (message && !isSpeakerMuted) {
      console.log('Speaking question:', message.content);
      try {
        await speak(message.content, settings.voiceAccent);
        console.log('Question spoken successfully');
      } catch (error) {
        console.error('Error speaking question:', error);
      }
    }
  }, [generateQuestion, speak, isSpeakerMuted, settings.voiceAccent]);

  const handleSubmitResponse = useCallback(async (response: string) => {
    if (!currentSession) return;

    addUserResponse(response);
    resetTranscript();

    // Get feedback for this response
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

    setQuestionCount(prev => prev + 1);

    // Check if interview should end
    if (questionCount + 1 >= maxQuestions) {
      await handleEndInterview();
    } else {
      // Generate next question
      setTimeout(() => {
        handleGenerateQuestion();
      }, 1500);
    }
  }, [
    currentSession,
    addUserResponse,
    resetTranscript,
    getFeedback,
    questionCount,
    maxQuestions,
    handleGenerateQuestion
  ]);

  const handleEndInterview = useCallback(async () => {
    const session = await endInterview();
    if (session) {
      setShowFeedback(true);
    }
  }, [endInterview]);

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
      await testSpeech();
      console.log('Speech test completed');
    } catch (error) {
      console.error('Speech test failed:', error);
    }
  };

  const getInitializationMessage = () => {
    switch (initializationStep) {
      case 'starting':
        return 'Starting your interview session...';
      case 'initializing':
        return 'Setting up AI interviewer...';
      case 'preparing':
        return 'Preparing interview questions...';
      case 'generating':
        return 'Generating your first question...';
      case 'ready':
        return 'Almost ready! Preparing voice system...';
      default:
        return 'Initializing your interview experience...';
    }
  };

  if (!isInitialized || !currentSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white rounded-xl shadow-xl p-8 max-w-md"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">🎉 Ready to Start!</h2>
          <p className="text-gray-600 mb-4">
            Using completely free, open-source AI technology
          </p>
          <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
            <div className="flex items-center justify-center text-green-700">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="font-medium">No API key required • 100% Free • Privacy-focused</span>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-3"></div>
            <p className="text-gray-600 font-medium">{getInitializationMessage()}</p>
            
            {/* Progress indicator */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500"
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
          
          {/* Test Speech Button */}
          <button
            onClick={handleTestSpeech}
            className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            Test Speech System
          </button>

          {/* Skip initialization button for debugging */}
          <button
            onClick={() => setIsInitialized(true)}
            className="mt-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
          >
            Skip & Continue
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
                  {settings.type.charAt(0).toUpperCase() + settings.type.slice(1)} Interview
                </h1>
                <p className="text-sm text-gray-500">
                  Question {questionCount + 1} of {maxQuestions} • Free Open Source AI • Real-time Lip Sync
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-48 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((questionCount) / maxQuestions) * 100}%` }}
                />
              </div>
              <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                <CheckCircle className="w-4 h-4 mr-1" />
                Free AI
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
          {/* Avatar Section - Flexible sizing */}
          <div className={`${isFullscreen ? 'w-full' : 'w-1/2'} ${isFullscreen ? 'p-0' : 'p-6'}`}>
            <div className={`h-full ${isFullscreen ? '' : 'bg-white rounded-xl shadow-lg overflow-hidden'}`}>
              <InterviewerAvatar
                isSpeaking={isSpeaking}
                avatarStyle={settings.avatarStyle}
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
                  onSubmitResponse={handleSubmitResponse}
                  isSpeaking={isSpeaking}
                  onToggleSpeaker={toggleSpeaker}
                  isSpeakerMuted={isSpeakerMuted}
                />
                
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
                      <button
                        onClick={handleTestSpeech}
                        className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors"
                      >
                        Test Speech System
                      </button>
                    )}
                  </motion.div>
                )}

                {/* Speech Status */}
                <div className="mt-4 flex items-center justify-center space-x-4 text-sm">
                  <div className={`flex items-center ${isSpeaking ? 'text-green-600' : 'text-gray-500'}`}>
                    {isSpeakerMuted ? <VolumeX className="w-4 h-4 mr-1" /> : <Volume2 className="w-4 h-4 mr-1" />}
                    <span>{isSpeaking ? 'AI Speaking...' : 'AI Ready'}</span>
                  </div>
                  <div className={`flex items-center ${isListening ? 'text-blue-600' : 'text-gray-500'}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${isListening ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`} />
                    <span>{isListening ? 'Listening...' : 'Ready to Listen'}</span>
                  </div>
                </div>

                {/* Audio Analysis Indicator */}
                {audioAnalyzer && isSpeaking && (
                  <div className="mt-4 flex items-center justify-center">
                    <div className="flex items-center space-x-1 px-3 py-2 bg-green-50 rounded-full border border-green-200">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-green-700 font-medium">Real-time Lip Sync Active</span>
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
                disabled={isSpeaking}
                className={`p-4 rounded-full transition-all duration-300 ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg animate-pulse'
                    : 'bg-primary-500 hover:bg-primary-600 text-white shadow-md'
                } ${isSpeaking ? 'opacity-50 cursor-not-allowed' : ''}`}
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

              {/* Status Display */}
              <div className="text-white text-sm font-medium">
                {isListening ? 'Listening...' : isSpeaking ? 'AI Speaking...' : 'Ready'}
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
            <h4 className="text-white font-medium mb-2">Your Response:</h4>
            <p className="text-white/90 leading-relaxed">{transcript}</p>
            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => handleSubmitResponse(transcript)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Submit Response
              </button>
              <button
                onClick={startListening}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Record Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}