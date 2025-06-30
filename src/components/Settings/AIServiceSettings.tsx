import React, { useState } from 'react';
import { Key, Save, CheckCircle, Video, Mic, Sparkles, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { StorageService } from '../../services/storage';

interface AIServiceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIServiceSettings({ isOpen, onClose }: AIServiceSettingsProps) {
  const [tavusApiKey, setTavusApiKey] = useState(
    localStorage.getItem('tavus_api_key') || ''
  );
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState(
    localStorage.getItem('elevenlabs_api_key') || ''
  );
  const [geminiApiKey, setGeminiApiKey] = useState(
    StorageService.getInstance().getGeminiApiKey() || ''
  );
  
  const [savedStates, setSavedStates] = useState({
    tavus: false,
    elevenlabs: false,
    gemini: false
  });

  const handleSaveApiKey = (service: 'tavus' | 'elevenlabs' | 'gemini', key: string) => {
    switch (service) {
      case 'tavus':
        localStorage.setItem('tavus_api_key', key);
        break;
      case 'elevenlabs':
        localStorage.setItem('elevenlabs_api_key', key);
        break;
      case 'gemini':
        StorageService.getInstance().saveGeminiApiKey(key);
        break;
    }
    
    setSavedStates(prev => ({ ...prev, [service]: true }));
    setTimeout(() => {
      setSavedStates(prev => ({ ...prev, [service]: false }));
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">AI Service Configuration</h2>
                <p className="text-purple-100">Configure Tavus, ElevenLabs, and Gemini AI</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Tavus Configuration */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center mb-4">
              <Video className="w-6 h-6 text-blue-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Tavus AI Video</h3>
              <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                Real-time Video AI
              </span>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Tavus provides real-time AI video agents for immersive interview experiences with lifelike avatars.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tavus API Key
                </label>
                <div className="flex gap-3">
                  <input
                    type="password"
                    value={tavusApiKey}
                    onChange={(e) => setTavusApiKey(e.target.value)}
                    placeholder="tvs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={() => handleSaveApiKey('tavus', tavusApiKey)}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center ${
                      savedStates.tavus
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {savedStates.tavus ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Saved
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Features:</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                  <li>• Real-time AI video conversations</li>
                  <li>• Lifelike avatar interactions</li>
                  <li>• WebSocket-based communication</li>
                  <li>• Custom replica creation</li>
                </ul>
                <a
                  href="https://www.tavus.io/developers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center mt-3 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                >
                  Get API Key <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            </div>
          </div>

          {/* ElevenLabs Configuration */}
          <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700">
            <div className="flex items-center mb-4">
              <Mic className="w-6 h-6 text-green-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">ElevenLabs Voice AI</h3>
              <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs rounded-full">
                Advanced TTS
              </span>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              ElevenLabs provides ultra-realistic text-to-speech with natural-sounding voices and real-time streaming.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ElevenLabs API Key
                </label>
                <div className="flex gap-3">
                  <input
                    type="password"
                    value={elevenLabsApiKey}
                    onChange={(e) => setElevenLabsApiKey(e.target.value)}
                    placeholder="sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={() => handleSaveApiKey('elevenlabs', elevenLabsApiKey)}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center ${
                      savedStates.elevenlabs
                        ? 'bg-green-500 text-white'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {savedStates.elevenlabs ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Saved
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">Features:</h4>
                <ul className="text-sm text-green-800 dark:text-green-400 space-y-1">
                  <li>• Ultra-realistic voice synthesis</li>
                  <li>• Real-time streaming TTS</li>
                  <li>• Voice cloning capabilities</li>
                  <li>• Multiple language support</li>
                </ul>
                <a
                  href="https://elevenlabs.io/docs/api-reference/getting-started"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center mt-3 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 text-sm font-medium"
                >
                  Get API Key <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            </div>
          </div>

          {/* Gemini Configuration */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
            <div className="flex items-center mb-4">
              <Sparkles className="w-6 h-6 text-purple-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Google Gemini AI</h3>
              <span className="ml-2 px-2 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                Intelligent Questions
              </span>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Google Gemini provides intelligent question generation and personalized feedback for interviews.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gemini API Key
                </label>
                <div className="flex gap-3">
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={() => handleSaveApiKey('gemini', geminiApiKey)}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center ${
                      savedStates.gemini
                        ? 'bg-green-500 text-white'
                        : 'bg-purple-500 text-white hover:bg-purple-600'
                    }`}
                  >
                    {savedStates.gemini ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Saved
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">Features:</h4>
                <ul className="text-sm text-purple-800 dark:text-purple-400 space-y-1">
                  <li>• Intelligent question generation</li>
                  <li>• Personalized feedback analysis</li>
                  <li>• Context-aware conversations</li>
                  <li>• Resume-based customization</li>
                </ul>
                <a
                  href="https://makersuite.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center mt-3 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 text-sm font-medium"
                >
                  Get API Key <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            </div>
          </div>

          {/* Integration Benefits */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">🚀 Enhanced Interview Experience</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Lifelike Avatars</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Real-time AI video agents that respond naturally to your answers
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mic className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Natural Voice</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Ultra-realistic speech synthesis with emotional expression
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Smart Questions</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  AI-generated questions tailored to your experience and role
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}