import React from 'react';
import { ArrowLeft, Download, Share2, RotateCcw, Trophy, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import type { InterviewSession } from '../../types';

interface ResultsPageProps {
  session: InterviewSession;
  onBack: () => void;
  onStartNew: () => void;
}

export default function ResultsPage({ session, onBack, onStartNew }: ResultsPageProps) {
  const score = session.score || 75;
  const duration = session.endTime && session.startTime
    ? Math.round((session.endTime.getTime() - session.startTime.getTime()) / 1000 / 60)
    : session.settings.duration;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'from-green-400 to-green-600';
    if (score >= 60) return 'from-yellow-400 to-yellow-600';
    return 'from-red-400 to-red-600';
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };

  const downloadReport = () => {
    // In a real app, you'd generate a PDF report using jsPDF
    const reportData = {
      session,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-report-${session.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={downloadReport}
                className="flex items-center px-4 py-2 text-primary-600 hover:text-primary-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </button>
              <button className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-700 transition-colors">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-r ${getScoreBackground(score)} text-white text-4xl font-bold mb-6 shadow-2xl`}>
            {score}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Interview Complete!</h1>
          <p className="text-xl text-gray-600">
            {getPerformanceLevel(score)} Performance in {session.settings.type.charAt(0).toUpperCase() + session.settings.type.slice(1)} Interview
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Performance Overview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Summary Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-primary-500" />
                Performance Summary
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600">{score}</div>
                  <div className="text-sm text-gray-600">Overall Score</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-secondary-600">{session.messages.filter(m => m.role === 'user').length}</div>
                  <div className="text-sm text-gray-600">Questions Answered</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-accent-600">{duration}</div>
                  <div className="text-sm text-gray-600">Minutes</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {session.settings.difficulty.charAt(0).toUpperCase() + session.settings.difficulty.slice(1)}
                  </div>
                  <div className="text-sm text-gray-600">Level</div>
                </div>
              </div>
            </div>

            {/* Detailed Feedback */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Detailed Feedback</h2>
              
              {session.feedback ? (
                <div className="prose prose-gray max-w-none">
                  <p>{session.feedback}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-medium text-blue-900 mb-2">Strengths</h3>
                    <ul className="text-blue-800 text-sm space-y-1">
                      <li>• Clear communication throughout the interview</li>
                      <li>• Good understanding of the role requirements</li>
                      <li>• Confident presentation of skills and experience</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h3 className="font-medium text-yellow-900 mb-2">Areas for Improvement</h3>
                    <ul className="text-yellow-800 text-sm space-y-1">
                      <li>• Provide more specific examples using the STAR method</li>
                      <li>• Practice technical explanations with clearer structure</li>
                      <li>• Work on reducing filler words during responses</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Interview Transcript */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Interview Transcript</h2>
              
              <div className="max-h-96 overflow-y-auto space-y-4">
                {session.messages.map((message, index) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-75 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Action Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Achievement */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <div className="mb-4">
                <Trophy className="w-16 h-16 text-yellow-500 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Achievement Unlocked!</h3>
              <p className="text-gray-600 text-sm">
                Completed your {session.settings.type} interview with a {getPerformanceLevel(score).toLowerCase()} performance.
              </p>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
              
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onStartNew}
                  className="w-full bg-primary-500 text-white px-4 py-3 rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Start New Interview
                </motion.button>
                
                <button className="w-full bg-secondary-500 text-white px-4 py-3 rounded-lg hover:bg-secondary-600 transition-colors">
                  Practice Similar Questions
                </button>
                
                <button
                  onClick={downloadReport}
                  className="w-full border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Full Report
                </button>
              </div>
            </div>

            {/* Progress Tracking */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Progress</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Interviews Completed</span>
                  <span className="font-medium">1</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Score</span>
                  <span className={`font-medium ${getScoreColor(score)}`}>{score}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Streak</span>
                  <span className="font-medium">1 day</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Keep practicing to improve your score!
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}