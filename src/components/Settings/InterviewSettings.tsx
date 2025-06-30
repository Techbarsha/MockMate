import React, { useState } from 'react';
import { Play, Upload, User, Clock, Globe, Briefcase, CheckCircle, Mic, Volume2, MessageCircle, Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import AvatarSelector from '../Avatar/AvatarSelector';
import Footer from '../Common/Footer';
import { INTERVIEW_TYPES, DIFFICULTY_LEVELS, VOICE_ACCENTS } from '../../utils/constants';
import { ElevenLabsService } from '../../services/elevenlabs';
import type { InterviewSettings } from '../../types';

interface InterviewSettingsProps {
  onStartInterview: (settings: InterviewSettings, resumeData?: any) => void;
  onStartAgentInterview?: (settings: InterviewSettings, resumeData?: any) => void;
  onResumeUpload?: (resumeData: any) => void;
}

export default function InterviewSettings({ 
  onStartInterview, 
  onStartAgentInterview,
  onResumeUpload 
}: InterviewSettingsProps) {
  const [settings, setSettings] = useState<InterviewSettings>({
    type: 'hr',
    difficulty: 'mid',
    duration: 15,
    voiceAccent: 'us',
    avatarStyle: 'professional'
  });

  const [resumeData, setResumeData] = useState<any>(null);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [voiceTestResult, setVoiceTestResult] = useState<'success' | 'error' | null>(null);
  const [interviewMode, setInterviewMode] = useState<'voice' | 'agent'>('voice');

  const handleSettingChange = <K extends keyof InterviewSettings>(
    key: K,
    value: InterviewSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleStartInterview = () => {
    if (interviewMode === 'agent' && onStartAgentInterview) {
      onStartAgentInterview(settings, resumeData);
    } else {
      onStartInterview(settings, resumeData);
    }
  };

  const handleResumeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      // In a real app, you'd parse the PDF here
      const mockResumeData = {
        name: 'John Doe',
        email: 'john@example.com',
        skills: ['JavaScript', 'React', 'Node.js'],
        experience: [
          {
            company: 'Tech Corp',
            position: 'Software Developer',
            duration: '2021 - Present',
            description: ['Built web applications', 'Led team projects']
          }
        ],
        education: [
          {
            institution: 'Tech University',
            degree: 'Computer Science',
            year: '2020'
          }
        ],
        summary: 'Experienced software developer with expertise in modern web technologies...'
      };
      
      setResumeData(mockResumeData);
      onResumeUpload?.(mockResumeData);
    }
  };

  const testElevenLabsVoice = async () => {
    setIsTestingVoice(true);
    setVoiceTestResult(null);
    
    try {
      const elevenLabsService = new ElevenLabsService();
      const success = await elevenLabsService.testVoice();
      setVoiceTestResult(success ? 'success' : 'error');
    } catch (error) {
      console.error('Voice test failed:', error);
      setVoiceTestResult('error');
    } finally {
      setIsTestingVoice(false);
    }
  };

  // Check if ElevenLabs API key is configured
  const hasElevenLabsKey = !!localStorage.getItem('elevenlabs_api_key');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      <div className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Voice-Powered Interview Practice</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Choose between voice interviews or conversational AI agent
            </p>
            
            {/* Interview Mode Selection */}
            <div className="mt-6 flex justify-center">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-2 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setInterviewMode('voice')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                      interviewMode === 'voice'
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Mic className="w-5 h-5" />
                      <span>Voice Interview</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setInterviewMode('agent')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                      interviewMode === 'agent'
                        ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="w-5 h-5" />
                      <span>AI Agent</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Mode Description */}
            <div className="mt-4">
              {interviewMode === 'voice' ? (
                <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-700">
                  <Mic className="w-5 h-5 mr-2" />
                  <span className="font-semibold">Ultra-realistic voice with predefined questions</span>
                </div>
              ) : (
                <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/30 dark:to-teal-900/30 text-green-700 dark:text-green-300 rounded-full border border-green-200 dark:border-green-700">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  <Bot className="w-4 h-4 mr-2" />
                  <span className="font-semibold">Conversational AI agent with natural dialogue</span>
                </div>
              )}
            </div>

            {/* ElevenLabs Status */}
            <div className="mt-6 flex justify-center">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4 text-sm">
                  <div className={`flex items-center ${hasElevenLabsKey ? 'text-green-600' : 'text-red-600'}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${hasElevenLabsKey ? 'bg-green-500' : 'bg-red-500'}`} />
                    <Mic className="w-4 h-4 mr-1" />
                    ElevenLabs Voice AI
                  </div>
                  
                  {hasElevenLabsKey && (
                    <button
                      onClick={testElevenLabsVoice}
                      disabled={isTestingVoice}
                      className="flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-xs"
                    >
                      {isTestingVoice ? (
                        <>
                          <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin mr-1" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3 mr-1" />
                          Test Voice
                        </>
                      )}
                    </button>
                  )}
                </div>
                
                {voiceTestResult && (
                  <div className={`mt-2 text-xs ${
                    voiceTestResult === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {voiceTestResult === 'success' ? (
                      <div className="flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Voice test successful! ElevenLabs is working perfectly.
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="mr-1">⚠️</span>
                        Voice test failed. Please check your API key configuration.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Features Highlight */}
            <div className="mt-6 inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-700">
              {interviewMode === 'voice' ? (
                <>
                  <Mic className="w-5 h-5 mr-2" />
                  <span className="font-semibold">Ultra-Realistic Voice • Natural Conversations • Professional Quality</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-5 h-5 mr-2" />
                  <span className="font-semibold">AI Agent • Natural Dialogue • Adaptive Responses</span>
                </>
              )}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Settings */}
            <div className="space-y-6">
              {/* Interview Type */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center mb-4">
                  <Briefcase className="w-5 h-5 text-primary-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Interview Type</h3>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(INTERVIEW_TYPES).map(([key, type]) => (
                    <button
                      key={key}
                      onClick={() => handleSettingChange('type', key as any)}
                      className={`p-4 rounded-lg border-2 text-left transition-all duration-200 hover:scale-105 ${
                        settings.type === key
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-md'
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{type.icon}</span>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{type.label}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">{type.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Difficulty Level */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center mb-4">
                  <User className="w-5 h-5 text-primary-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Experience Level</h3>
                </div>
                <div className="space-y-3">
                  {Object.entries(DIFFICULTY_LEVELS).map(([key, level]) => (
                    <button
                      key={key}
                      onClick={() => handleSettingChange('difficulty', key as any)}
                      className={`w-full p-3 rounded-lg border text-left transition-all duration-200 ${
                        settings.difficulty === key
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="text-xl mr-3">{level.icon}</span>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{level.label}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">{level.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Duration & Voice Settings */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="space-y-6">
                  {/* Duration */}
                  <div>
                    <div className="flex items-center mb-3">
                      <Clock className="w-5 h-5 text-primary-500 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Duration</h3>
                    </div>
                    <div className="flex space-x-3">
                      {[10, 15, 20, 30].map(duration => (
                        <button
                          key={duration}
                          onClick={() => handleSettingChange('duration', duration)}
                          className={`px-4 py-2 rounded-lg border transition-colors ${
                            settings.duration === duration
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                          }`}
                        >
                          {duration} min
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Voice Accent - Only for voice mode */}
                  {interviewMode === 'voice' && (
                    <div>
                      <div className="flex items-center mb-3">
                        <Globe className="w-5 h-5 text-primary-500 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Voice Accent</h3>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(VOICE_ACCENTS).map(([key, accent]) => (
                          <button
                            key={key}
                            onClick={() => handleSettingChange('voiceAccent', key as any)}
                            className={`p-3 rounded-lg border text-center transition-colors ${
                              settings.voiceAccent === key
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                            }`}
                          >
                            <div className="text-xl mb-1">{accent.flag}</div>
                            <div className="text-sm font-medium">{accent.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Resume Upload */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center mb-4">
                  <Upload className="w-5 h-5 text-primary-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Resume (Optional)</h3>
                </div>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleResumeUpload}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label
                    htmlFor="resume-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {resumeData ? 'Resume uploaded ✅' : 'Upload your resume'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      PDF files only • Get personalized questions
                    </span>
                  </label>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Avatar & Start */}
            <div className="space-y-6">
              {/* Avatar Selection - Only for voice mode */}
              {interviewMode === 'voice' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                >
                  <AvatarSelector
                    selectedStyle={settings.avatarStyle}
                    onStyleChange={(style) => handleSettingChange('avatarStyle', style)}
                  />
                </motion.div>
              )}

              {/* Start Interview Button */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ready to Start?</h3>
                  
                  {!hasElevenLabsKey && (
                    <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                      <p className="text-yellow-800 dark:text-yellow-300 text-sm mb-2">
                        ElevenLabs API key is required for voice functionality
                      </p>
                      <p className="text-yellow-600 dark:text-yellow-400 text-xs">
                        The app will use browser TTS as fallback
                      </p>
                    </div>
                  )}
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStartInterview}
                    className={`w-full px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center ${
                      interviewMode === 'agent'
                        ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white'
                        : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                    }`}
                  >
                    <Play className="w-6 h-6 mr-2" />
                    {interviewMode === 'agent' ? 'Start Agent Interview' : 'Start Voice Interview'}
                  </motion.button>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                    Your session will be {settings.duration} minutes of {settings.type} questions
                  </p>
                  
                  <div className="flex items-center justify-center mt-2 text-xs">
                    <div className="flex items-center text-purple-600 dark:text-purple-400">
                      {interviewMode === 'agent' ? (
                        <>
                          <MessageCircle className="w-3 h-3 mr-1" />
                          <span>Powered by ElevenLabs Agent</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3 h-3 mr-1" />
                          <span>Powered by ElevenLabs Voice AI</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Quick Tips */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl border border-purple-200 dark:border-purple-700 p-6"
              >
                <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-3">
                  {interviewMode === 'agent' ? '🤖 Agent Interview Tips' : '🎤 Voice Interview Tips'}
                </h4>
                <ul className="text-sm text-purple-800 dark:text-purple-400 space-y-2">
                  {interviewMode === 'agent' ? (
                    <>
                      <li>• Engage in natural conversation with the AI agent</li>
                      <li>• Ask questions and seek clarification when needed</li>
                      <li>• Use voice or text input as preferred</li>
                      <li>• Experience adaptive responses based on your answers</li>
                      <li>• Get personalized feedback and coaching</li>
                    </>
                  ) : (
                    <>
                      <li>• Find a quiet space with good microphone access</li>
                      <li>• Use Chrome or Edge for best voice recognition</li>
                      <li>• Speak clearly and at a moderate pace</li>
                      <li>• Take your time to think before responding</li>
                      <li>• Experience ultra-realistic voice responses</li>
                      <li>• Get immediate feedback on your performance</li>
                    </>
                  )}
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}