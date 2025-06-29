import React from 'react';
import { TrendingUp, MessageSquare, Brain, Target, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import type { FeedbackItem } from '../../types';

interface FeedbackPanelProps {
  feedback: FeedbackItem[];
  overallScore: number;
  isVisible: boolean;
}

export default function FeedbackPanel({ feedback, overallScore, isVisible }: FeedbackPanelProps) {
  if (!isVisible || feedback.length === 0) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const categoryIcons = {
    communication: MessageSquare,
    technical: Brain,
    confidence: TrendingUp,
    clarity: Target
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto"
    >
      <div className="space-y-6">
        {/* Overall Score */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-white mb-4">
            <span className="text-2xl font-bold">{overallScore}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Overall Performance</h3>
          <p className="text-sm text-gray-600">
            {overallScore >= 80 ? 'Excellent work!' : overallScore >= 60 ? 'Good effort!' : 'Keep practicing!'}
          </p>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-4">
          <h4 className="text-md font-semibold text-gray-900 flex items-center">
            <Star className="w-5 h-5 mr-2 text-yellow-500" />
            Performance Breakdown
          </h4>
          
          {feedback.map((item, index) => {
            const IconComponent = categoryIcons[item.category] || Target;
            
            return (
              <motion.div
                key={item.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <IconComponent className="w-4 h-4 mr-2 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {item.category}
                    </span>
                  </div>
                  <span className={`text-sm font-semibold ${getScoreColor(item.score)}`}>
                    {item.score}/100
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.score}%` }}
                    transition={{ duration: 1, delay: index * 0.2 }}
                    className={`h-2 rounded-full ${getProgressColor(item.score)}`}
                  />
                </div>
                
                <p className="text-xs text-gray-600">{item.feedback}</p>
                
                {/* Suggestions */}
                {item.suggestions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-700 mb-1">Suggestions:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {item.suggestions.map((suggestion, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-primary-500 mr-1">•</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Encouragement */}
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-4 border border-primary-200">
          <h4 className="text-sm font-semibold text-primary-900 mb-2">Keep Improving!</h4>
          <p className="text-xs text-primary-700">
            Regular practice will help you improve your interview skills. 
            Focus on the areas highlighted above for better performance.
          </p>
        </div>
      </div>
    </motion.div>
  );
}