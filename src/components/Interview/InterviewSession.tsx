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
  const [maxQuestions] = useState(5);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [initializationStep, setInitializationStep] = useState('starting');
  const [avatarEmotion, setAvatarEmotion] = useState<'neutral' | 'happy' | 'focused' | 'encouraging'>('neutral');
  const [speechError, setSpeechError] = useState<string | null>(null);
  
  // New state for better pacing control
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [canProceedToNext, setCanProceedToNext] = useState(false);
  const [showNextQuestionButton, setShowNextQuestionButton] = useState(false);
  const [interviewPaused, setInterviewPaused] = useState(false);
  const [responseSubmitted, setResponseSubmitted] = useState(false);

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

  // Initialize interview with better error handling and progress tracking
  useEffect(() => {
    const initializeInterview = async () => {
      try {
        console.log('Starting interview initialization...');
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
        console.log('Generating first question...');
        
        // Generate the first question, passing the session directly
        const firstQuestion = await generateQuestion(session);
        if (firstQuestion) {
          console.log('First question generated:', firstQuestion.content);
          setInitializationStep('ready');
          
          // Mark as fully initialized first
          setIsInitialized(true);
          setIsWaitingForResponse(true);
          
          // Wait a moment before speaking
          setTimeout(async () => {
            if (!isSpeakerMuted) {
              try {
                console.log('Speaking first question...');
                await speak(firstQuestion.content, settings.voiceAccent);
                console.log('First question spoken successfully');
                
                // After speaking, show that user can respond
                setIsWaitingForResponse(true);
              } catch (error) {
                console.error('Error speaking first question:', error);
                setSpeechError('Failed to speak question. Please check your audio settings.');
                // Continue anyway - user can still read the question
                setIsWaitingForResponse(true);
              }
            } else {
              setIsWaitingForResponse(true);
            }
          }, 1500); // Increased delay for better pacing
        } else {
          console.error('Failed to generate first question');
          // Still allow the interview to proceed
          setIsInitialized(true);
          setIsWaitingForResponse(true);
        }
      } catch (error) {
        console.error('Error during interview initialization:', error);
        setSpeechError('Initialization failed. Please try again.');
        // Show error but still allow proceeding
        setIsInitialized(true);
      }
    };

    initializeInterview();
  }, [settings, resumeData, startInterview, generateQuestion, speak, isSpeakerMuted, speechReady, checkAudioPermissions]);

  const handleGenerateNextQuestion = useCallback(async () => {
    if (interviewPaused) return;
    
    console.log('Generating next question...');
    setShowNextQuestionButton(false);
    setCanProceedToNext(false);
    setResponseSubmitted(false);
    
    const message = await generateQuestion();
    if (message) {
      setIsWaitingForResponse(true);
      
      if (!isSpeakerMuted) {
        console.log('Speaking question:', message.content);
        try {
          setSpeechError(null);
          await speak(message.content, settings.voiceAccent);
          console.log('Question spoken successfully');
        } catch (error) {
          console.error('Error speaking question:', error);
          setSpeechError('Failed to speak question. You can still read it above.');
        }
      }
    }
  }, [generateQuestion, speak, isSpeakerMuted, settings.voiceAccent, interviewPaused]);

  const handleSubmitResponse = useCallback(async (response: string) => {
    if (!currentSession || responseSubmitted) return;

    console.log('Submitting response:', response.substring(0, 50) + '...');
    setResponseSubmitted(true);
    setIsWaitingForResponse(false);

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

    const newQuestionCount = questionCount + 1;
    setQuestionCount(newQuestionCount);

    // Check if interview should end
    if (newQuestionCount >= maxQuestions) {
      console.log('Interview completed, ending session...');
      setTimeout(async () => {
        await handleEndInterview();
      }, 2000);
    } else {
      // Show option to proceed to next question after a delay
      setTimeout(() => {
        setCanProceedToNext(true);
        setShowNextQuestionButton(true);
      }, 3000); // 3 second delay before showing next question option
    }
  }, [
    currentSession,
    addUserResponse,
    resetTranscript,
    getFeedback,
    questionCount,
    maxQuestions,
    responseSubmitted
  ]);

  const handleEndInterview = useCallback(async () => {
    console.log('Ending interview session...');
    const session = await endInterview();
    if (session) {
      onComplete(session);
    }
  }, [endInterview, onComplete]);

  const handlePauseInterview = () => {
    setInterviewPaused(!interviewPaused);
    if (isSpeaking) {
      cancelSpeech();
    }
    if (isListening) {
      stopListening();
    }
  };

  const handleSkipToNext = () => {
    if (canProceedToNext) {
      handleGenerateNextQuestion();
    }
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

  if (!isInitialized) {
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
            Using completely free, open-source AI technology with realistic face interviewer
          </p>
          <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
            <div className="flex items-center justify-center text-green-700">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="font-medium">AI Face Interviewer • Real Expressions • 100% Free</span>
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

            {/* Skip initialization button for debugging */}
            <button
              onClick={() => setIsInitialized(true)}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              Skip & Continue
            </button>
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
            There was an issue starting your interview session. Please try again.
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
                  {settings.type.charAt(0).toUpperCase() + settings.type.slice(1)} Interview
                </h1>
                <p className="text-sm text-gray-500">
                  Question {questionCount + 1} of {maxQuestions} • AI Face Interviewer • Controlled Pacing
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
              
              <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                <CheckCircle className="w-4 h-4 mr-1" />
                AI Face
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
          {/* Avatar Section - Now using FaceInterviewer */}
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
                  onSubmitResponse={handleSubmitResponse}
                  isSpeaking={isSpeaking}
                  onToggleSpeaker={toggleSpeaker}
                  isSpeakerMuted={isSpeakerMuted}
                  disabled={interviewPaused || !isWaitingForResponse || responseSubmitted}
                />
                
                {/* Interview Status */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Interview Status:</span>
                    <span className={`text-sm font-semibold ${
                      interviewPaused ? 'text-yellow-600' :
                      isWaitingForResponse ? 'text-blue-600' :
                      canProceedToNext ? 'text-green-600' :
                      'text-gray-600'
                    }`}>
                      {interviewPaused ? 'Paused' :
                       isWaitingForResponse ? 'Waiting for your response' :
                       canProceedToNext ? 'Ready for next question' :
                       'Processing...'}
                    </span>
                  </div>
                  
                  {/* Next Question Button */}
                  {showNextQuestionButton && !interviewPaused && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={handleSkipToNext}
                      className="w-full mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
                    >
                      <SkipForward className="w-4 h-4 mr-2" />
                      Continue to Next Question
                    </motion.button>
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
                  <div className={`flex items-center ${isSpeaking ? 'text-green-600' : 'text-gray-500'}`}>
                    {isSpeakerMuted ? <VolumeX className="w-4 h-4 mr-1" /> : <Volume2 className="w-4 h-4 mr-1" />}
                    <span>{isSpeaking ? 'AI Speaking...' : 'AI Ready'}</span>
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
                      <span className="text-xs text-green-700 font-medium">Voice System Ready</span>
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
                disabled={isSpeaking || interviewPaused || !isWaitingForResponse || responseSubmitted}
                className={`p-4 rounded-full transition-all duration-300 ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg animate-pulse'
                    : 'bg-primary-500 hover:bg-primary-600 text-white shadow-md'
                } ${(isSpeaking || interviewPaused || !isWaitingForResponse || responseSubmitted) ? 'opacity-50 cursor-not-allowed' : ''}`}
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

              {/* Next Question */}
              {showNextQuestionButton && !interviewPaused && (
                <button
                  onClick={handleSkipToNext}
                  className="p-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              )}

              {/* Status Display */}
              <div className="text-white text-sm font-medium">
                {interviewPaused ? 'Paused' :
                 isListening ? 'Listening...' : 
                 isSpeaking ? 'AI Speaking...' : 
                 isWaitingForResponse ? 'Your Turn' :
                 'Ready'}
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
                disabled={responseSubmitted}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Response
              </button>
              <button
                onClick={startListening}
                disabled={responseSubmitted}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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