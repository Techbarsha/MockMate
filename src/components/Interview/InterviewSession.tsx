import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Settings, Download, CheckCircle, Volume2, VolumeX, Mic, Maximize2, Play, RefreshCw, Pause, SkipForward } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FaceInterviewer from '../Avatar/FaceInterviewer';
import VoiceRecorder from './VoiceRecorder';
import TranscriptPanel from './TranscriptPanel';
import FeedbackPanel from './FeedbackPanel';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { useElevenLabs } from '../../hooks/useElevenLabs';
import { StorageService } from '../../services/storage';
import type { InterviewSettings, FeedbackItem, Message, InterviewSession as IInterviewSession } from '../../types';

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
  const [maxQuestions] = useState(6);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [initializationStep, setInitializationStep] = useState('starting');
  const [avatarEmotion, setAvatarEmotion] = useState<'neutral' | 'happy' | 'focused' | 'encouraging'>('neutral');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSession, setCurrentSession] = useState<IInterviewSession | null>(null);
  
  // Auto-flow state management
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [interviewPaused, setInterviewPaused] = useState(false);
  const [responseSubmitted, setResponseSubmitted] = useState(false);
  const [autoQuestionTimer, setAutoQuestionTimer] = useState<NodeJS.Timeout | null>(null);
  const [responseTimeout, setResponseTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isAutoMode, setIsAutoMode] = useState(true);

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
    error: elevenLabsError,
    isReady: elevenLabsReady,
    speak,
    stopSpeaking,
    testVoice,
    hasApiKey: hasElevenLabsKey,
    selectedVoice
  } = useElevenLabs();

  // Predefined interview questions
  const getInterviewQuestions = useCallback(() => {
    const questionSets = {
      hr: [
        "Tell me about yourself and what interests you about this role.",
        "What are your greatest strengths and how do they apply to this position?",
        "Where do you see yourself in five years?",
        "Why are you looking to leave your current position?",
        "What motivates you in your work?",
        "How do you handle stress and pressure?"
      ],
      technical: [
        "Can you walk me through your approach to solving complex technical problems?",
        "Describe a challenging technical project you've worked on recently.",
        "How do you stay updated with the latest technology trends?",
        "Explain a time when you had to debug a difficult issue.",
        "What's your experience with version control systems like Git?",
        "How do you ensure code quality in your projects?"
      ],
      behavioral: [
        "Describe a challenging situation you faced at work and how you handled it.",
        "Tell me about a time when you had to work with a difficult team member.",
        "Give me an example of when you had to meet a tight deadline.",
        "Describe a situation where you had to learn something new quickly.",
        "Tell me about a time when you made a mistake and how you handled it.",
        "Describe a time when you had to lead a team or project."
      ]
    };
    
    return questionSets[settings.type] || questionSets.hr;
  }, [settings.type]);

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

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (autoQuestionTimer) clearTimeout(autoQuestionTimer);
      if (responseTimeout) clearTimeout(responseTimeout);
    };
  }, [autoQuestionTimer, responseTimeout]);

  // Initialize interview session
  useEffect(() => {
    const initializeInterview = async () => {
      try {
        console.log('Starting ElevenLabs voice interview...');
        setInitializationStep('initializing');
        
        // Create interview session
        const session: IInterviewSession = {
          id: Date.now().toString(),
          settings,
          messages: [],
          startTime: new Date(),
          resumeData
        };
        
        setCurrentSession(session);
        setInitializationStep('preparing');
        
        // Wait for ElevenLabs to be ready
        let elevenLabsWaitAttempts = 0;
        while (!elevenLabsReady && elevenLabsWaitAttempts < 10) {
          console.log('Waiting for ElevenLabs to be ready...');
          await new Promise(resolve => setTimeout(resolve, 500));
          elevenLabsWaitAttempts++;
        }
        
        setInitializationStep('ready');
        setIsInitialized(true);
        
        // Start the interview flow
        setTimeout(async () => {
          await startAutomaticQuestionFlow();
        }, 2000);
        
      } catch (error) {
        console.error('Error during interview initialization:', error);
        setIsInitialized(true);
      }
    };

    initializeInterview();
  }, [settings, resumeData, elevenLabsReady]);

  // Automatic question flow function
  const startAutomaticQuestionFlow = async () => {
    if (interviewPaused || !isAutoMode) return;

    try {
      console.log('Starting automatic question flow');
      
      const questions = getInterviewQuestions();
      const currentQuestion = questions[questionCount] || questions[questions.length - 1];
      
      // Add question to messages
      const questionMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: currentQuestion,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, questionMessage]);
      
      // Check if voice is available before attempting to speak
      if (!isSpeakerMuted && hasElevenLabsKey) {
        // Validate voice selection before speaking
        if (!selectedVoice || selectedVoice.trim() === '') {
          console.warn('No voice selected for ElevenLabs. Skipping speech synthesis.');
          console.log('Question displayed without voice:', currentQuestion.substring(0, 50) + '...');
        } else {
          console.log('Speaking question with ElevenLabs:', currentQuestion.substring(0, 50) + '...');
          try {
            await speak(currentQuestion);
          } catch (speakError) {
            console.error('Error speaking question:', speakError);
            // Continue with the interview flow even if speech fails
          }
        }
      } else {
        console.log('Voice synthesis skipped - muted or no API key');
      }
      
      // Automatically start listening for response after question is displayed/spoken
      setTimeout(async () => {
        if (!interviewPaused && isAutoMode) {
          setIsWaitingForResponse(true);
          console.log('Auto-starting voice recognition...');
          try {
            await startListening();
            
            // Set a timeout for response (30 seconds)
            const timeout = setTimeout(async () => {
              if (isListening) {
                console.log('Response timeout reached, moving to next question');
                await stopListening();
                handleAutoNextQuestion();
              }
            }, 30000);
            
            setResponseTimeout(timeout);
          } catch (listenError) {
            console.error('Error starting voice recognition:', listenError);
            // Continue with interview flow even if listening fails
            setTimeout(() => {
              handleAutoNextQuestion();
            }, 3000);
          }
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error in automatic question flow:', error);
      // Continue with interview flow even if there's an error
      setTimeout(() => {
        handleAutoNextQuestion();
      }, 3000);
    }
  };

  // Auto-generate next question
  const handleAutoNextQuestion = useCallback(async () => {
    if (interviewPaused || !isAutoMode) return;
    
    console.log('Auto-generating next question...');
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
    const timer = setTimeout(async () => {
      await startAutomaticQuestionFlow();
    }, 3000); // 3 second pause between questions
    
    setAutoQuestionTimer(timer);
  }, [questionCount, maxQuestions, interviewPaused, isAutoMode, responseTimeout]);

  // Handle automatic response submission
  const handleAutoSubmitResponse = useCallback(async (response: string) => {
    if (!currentSession || responseSubmitted || !isAutoMode) return;

    console.log('Auto-submitting response:', response.substring(0, 50) + '...');
    setResponseSubmitted(true);
    setIsWaitingForResponse(false);

    // Clear response timeout
    if (responseTimeout) {
      clearTimeout(responseTimeout);
      setResponseTimeout(null);
    }

    // Add user response to messages
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: response,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    resetTranscript();

    // Generate basic feedback
    const score = calculateBasicScore(response);
    const feedbackItem: FeedbackItem = {
      category: 'communication',
      score: score,
      feedback: generateBasicFeedback(response, score),
      suggestions: generateSuggestions(response)
    };
    
    setCurrentFeedback(prev => [...prev, feedbackItem]);
    setOverallScore(prev => prev === 0 ? score : (prev + score) / 2);

    // Automatically proceed to next question
    setTimeout(() => {
      handleAutoNextQuestion();
    }, 2000);
  }, [
    currentSession,
    resetTranscript,
    responseSubmitted,
    isAutoMode,
    responseTimeout,
    handleAutoNextQuestion
  ]);

  // Auto-submit when user stops speaking
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
    console.log('Ending ElevenLabs voice interview session...');
    setIsAutoMode(false);
    
    // Clear all timers
    if (autoQuestionTimer) clearTimeout(autoQuestionTimer);
    if (responseTimeout) clearTimeout(responseTimeout);
    
    if (currentSession) {
      const endedSession = {
        ...currentSession,
        messages,
        endTime: new Date(),
        score: overallScore || 75,
        feedback: 'Interview completed successfully! Keep practicing to improve your skills.'
      };
      
      try {
        storageService.saveInterviewSession(endedSession);
        console.log('Interview session saved:', endedSession.id);
      } catch (err) {
        console.error('Error saving interview session:', err);
      }
      
      onComplete(endedSession);
    }
  }, [currentSession, messages, overallScore, onComplete, autoQuestionTimer, responseTimeout, storageService]);

  // Helper functions for feedback
  const calculateBasicScore = (response: string): number => {
    let score = 50;
    
    if (response.length > 100) score += 10;
    if (response.length > 200) score += 10;
    if (response.length > 300) score += 5;
    
    const positiveWords = ['experience', 'skilled', 'accomplished', 'managed', 'led', 'developed', 'achieved'];
    positiveWords.forEach(word => {
      if (response.toLowerCase().includes(word)) score += 3;
    });
    
    if (response.length < 50) score -= 20;
    
    return Math.min(Math.max(score, 0), 100);
  };

  const generateBasicFeedback = (response: string, score: number): string => {
    if (score >= 80) {
      return "Excellent response! You provided detailed information and demonstrated strong communication skills.";
    } else if (score >= 60) {
      return "Good response! Consider adding more specific examples to make your answer even stronger.";
    } else {
      return "Your response could be improved. Practice providing more detailed examples and structure.";
    }
  };

  const generateSuggestions = (response: string): string[] => {
    return [
      'Provide more specific examples from your experience',
      'Structure your response using the STAR method',
      'Practice speaking clearly and confidently'
    ];
  };

  const handlePauseInterview = () => {
    const newPausedState = !interviewPaused;
    setInterviewPaused(newPausedState);
    
    if (newPausedState) {
      // Pause: stop all activities
      if (isSpeaking) stopSpeaking();
      if (isListening) stopListening();
      if (autoQuestionTimer) clearTimeout(autoQuestionTimer);
      if (responseTimeout) clearTimeout(responseTimeout);
      console.log('Interview paused');
    } else {
      // Resume: continue auto flow if in auto mode
      console.log('Interview resumed');
      if (isAutoMode && !isWaitingForResponse && !isSpeaking) {
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
      stopSpeaking();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleTestVoice = async () => {
    console.log('Testing ElevenLabs voice...');
    try {
      await testVoice();
      console.log('Voice test completed');
    } catch (error) {
      console.error('Voice test failed:', error);
    }
  };

  const getInitializationMessage = () => {
    switch (initializationStep) {
      case 'starting':
        return 'Connecting to ElevenLabs...';
      case 'initializing':
        return 'Setting up voice AI interviewer...';
      case 'preparing':
        return 'Preparing ultra-realistic voice...';
      case 'ready':
        return 'Starting voice interview flow...';
      default:
        return 'Initializing ElevenLabs voice experience...';
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">🎤 ElevenLabs Ready!</h2>
          <p className="text-gray-600 mb-4">
            Ultra-realistic voice interview with professional AI
          </p>
          <div className="bg-purple-50 rounded-lg p-4 mb-6 border border-purple-200">
            <div className="flex items-center justify-center text-purple-700">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="font-medium">ElevenLabs Voice • Auto Flow • Smart Questions</span>
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
                  width: initializationStep === 'starting' ? '25%' :
                         initializationStep === 'initializing' ? '50%' :
                         initializationStep === 'preparing' ? '75%' :
                         initializationStep === 'ready' ? '95%' : '100%'
                }}
              />
            </div>
          </div>
          
          {/* Voice Test */}
          <div className="mt-6 space-y-3">
            <button
              onClick={handleTestVoice}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center justify-center"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Test ElevenLabs Voice
            </button>

            {(elevenLabsError || voiceError) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm mb-2">{elevenLabsError || voiceError}</p>
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
            There was an issue starting your ElevenLabs interview session. Please try again.
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
                  ElevenLabs {settings.type.charAt(0).toUpperCase() + settings.type.slice(1)} Interview
                </h1>
                <p className="text-sm text-gray-500">
                  Question {questionCount + 1} of {maxQuestions} • Voice-Powered • Ultra-Realistic
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
                ElevenLabs
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
                    <span className="text-sm font-medium text-purple-700">ElevenLabs Status:</span>
                    <span className={`text-sm font-semibold ${
                      interviewPaused ? 'text-yellow-600' :
                      isWaitingForResponse ? 'text-blue-600' :
                      isSpeaking ? 'text-purple-600' :
                      'text-green-600'
                    }`}>
                      {interviewPaused ? 'Paused' :
                       isWaitingForResponse ? 'Listening for your response' :
                       isSpeaking ? 'AI speaking with ultra-realistic voice' :
                       'Processing...'}
                    </span>
                  </div>
                  
                  {isAutoMode && (
                    <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                      🎤 Automatic mode: Natural voice conversations with ElevenLabs
                    </div>
                  )}

                  {/* Voice Selection Status */}
                  {hasElevenLabsKey && (
                    <div className="mt-2 text-xs">
                      <span className={`px-2 py-1 rounded ${
                        selectedVoice && selectedVoice.trim() !== '' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        Voice: {selectedVoice && selectedVoice.trim() !== '' ? 'Selected' : 'Not Selected'}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Error Messages */}
                {(voiceError || elevenLabsError) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <p className="text-red-700 text-sm">
                      {voiceError || elevenLabsError}
                    </p>
                    <div className="mt-2 space-x-2">
                      <button
                        onClick={handleTestVoice}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors"
                      >
                        Test Voice
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Voice Status */}
                <div className="mt-4 flex items-center justify-center space-x-4 text-sm">
                  <div className={`flex items-center ${isSpeaking ? 'text-purple-600' : 'text-gray-500'}`}>
                    {isSpeakerMuted ? <VolumeX className="w-4 h-4 mr-1" /> : <Volume2 className="w-4 h-4 mr-1" />}
                    <span>{isSpeaking ? 'ElevenLabs Speaking...' : 'Voice Ready'}</span>
                  </div>
                  <div className={`flex items-center ${isListening ? 'text-blue-600' : 'text-gray-500'}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${isListening ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`} />
                    <span>{isListening ? 'Listening...' : 'Ready to Listen'}</span>
                  </div>
                </div>

                {/* ElevenLabs Ready Indicator */}
                {elevenLabsReady && (
                  <div className="mt-4 flex items-center justify-center">
                    <div className="flex items-center space-x-1 px-3 py-2 bg-green-50 rounded-full border border-green-200">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-xs text-green-700 font-medium">ElevenLabs Voice System Ready</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Transcript Panel */}
              <div className="h-64 mt-6 bg-white rounded-xl shadow-lg overflow-hidden">
                <TranscriptPanel
                  messages={messages}
                  isTyping={false}
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
                onClick={async () => {
                  if (isListening) {
                    await stopListening();
                  } else {
                    await startListening();
                  }
                }}
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
                 isSpeaking ? 'ElevenLabs Speaking...' : 
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
              🎤 ElevenLabs will automatically process your response when you finish speaking
            </div>
          </div>
        </div>
      )}
    </div>
  );
}