import React, { useState } from 'react';
import { Play, Upload, User, Clock, Globe, Briefcase, CheckCircle, Zap, Key, Save, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import AvatarSelector from '../Avatar/AvatarSelector';
import Footer from '../Common/Footer';
import { INTERVIEW_TYPES, DIFFICULTY_LEVELS, VOICE_ACCENTS } from '../../utils/constants';
import { StorageService } from '../../services/storage';
import { GeminiService } from '../../services/gemini';
import type { InterviewSettings } from '../../types';

interface InterviewSettingsProps {
  onStartInterview: (settings: InterviewSettings, resumeData?: any) => void;
  onResumeUpload?: (resumeData: any) => void;
}

export default function InterviewSettings({ onStartInterview, onResumeUpload }: InterviewSettingsProps) {
  const [settings, setSettings] = useState<InterviewSettings>({
    type: 'hr',
    difficulty: 'mid',
    duration: 15,
    voiceAccent: 'us',
    avatarStyle: 'professional'
  });

  const [resumeData, setResumeData] = useState<any>(null);
  const [geminiApiKey, setGeminiApiKey] = useState<string>(
    StorageService.getInstance().getGeminiApiKey() || ''
  );
  const [showApiKeySection, setShowApiKeySection] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);

  const geminiService = new GeminiService();

  const handleSettingChange = <K extends keyof InterviewSettings>(
    key: K,
    value: InterviewSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleStartInterview = () => {
    onStartInterview(settings, resumeData);
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

  const handleSaveApiKey = () => {
    StorageService.getInstance().saveGeminiApiKey(geminiApiKey);
    geminiService.saveApiKey(geminiApiKey);
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 2000);
  };

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
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Customize Your AI Interview</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Configure your realistic interview experience with Gemini AI
            </p>
            
            {/* Gemini AI Badge */}
            <div className="mt-4">
              <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-700">
                <Sparkles className="w-5 h-5 mr-2" />
                <span className="font-semibold">Powered by Google Gemini AI</span>
                <Zap className="w-4 h-4 ml-2 text-yellow-500" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Advanced AI for realistic interviews • Intelligent question generation • Personalized feedback
              </p>
              <button
                onClick={() => setShowApiKeySection(!showApiKeySection)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mt-1 underline"
              >
                {showApiKeySection ? 'Hide' : 'Show'} Gemini API key settings
              </button>
            </div>
          </motion.div>

          {/* Gemini API Key Section */}
          {showApiKeySection && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-purple-50 dark:bg-purple-900/30 rounded-xl border border-purple-200 dark:border-purple-700 p-6"
            >
              <div className="flex items-center mb-4">
                <Key className="w-5 h-5 text-purple-500 mr-2" />
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300">Gemini API Key</h3>
              </div>
              <p className="text-sm text-purple-800 dark:text-purple-300 mb-4">
                Add your Google Gemini API key for enhanced AI-powered interviews with realistic question generation and intelligent feedback.
                Without an API key, the app will use fallback questions.
              </p>
              <div className="flex gap-3">
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="flex-1 px-4 py-2 border border-purple-300 dark:border-purple-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <button
                  onClick={handleSaveApiKey}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                    apiKeySaved
                      ? 'bg-green-500 text-white'
                      : 'bg-purple-500 text-white hover:bg-purple-600'
                  }`}
                >
                  {apiKeySaved ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                Get your free API key at{' '}
                <a
                  href="https://makersuite.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-purple-800 dark:hover:text-purple-300"
                >
                  Google AI Studio
                </a>
              </p>
            </motion.div>
          )}

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

                  {/* Voice Accent */}
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
                      PDF files only • Get AI-personalized questions
                    </span>
                  </label>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Avatar & Start */}
            <div className="space-y-6">
              {/* Avatar Selection */}
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

              {/* Start Interview Button */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ready to Start?</h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStartInterview}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                  >
                    <Play className="w-6 h-6 mr-2" />
                    Start AI Interview
                  </motion.button>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                    Your session will be {settings.duration} minutes of {settings.type} questions
                  </p>
                  <div className="flex items-center justify-center mt-2 text-xs text-purple-600 dark:text-purple-400">
                    <Sparkles className="w-3 h-3 mr-1" />
                    <span>Powered by Gemini AI</span>
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
                <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-3">💡 AI Interview Tips</h4>
                <ul className="text-sm text-purple-800 dark:text-purple-400 space-y-2">
                  <li>• Find a quiet space with good microphone access</li>
                  <li>• Use Chrome or Edge for best voice recognition</li>
                  <li>• Speak clearly and at a moderate pace</li>
                  <li>• Take your time to think before responding</li>
                  <li>• AI will adapt questions based on your responses</li>
                  <li>• Get detailed feedback powered by Gemini AI</li>
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