import React from 'react';
import { Bot, User, Trophy, MessageCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  userProfile?: any;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
}

export default function Header({ userProfile, onProfileClick }: HeaderProps) {
  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                  MockMate
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">AI Interview Coach</p>
              </div>
            </div>
          </motion.div>

          {/* Navigation */}
          <div className="flex items-center space-x-6">
            {userProfile && (
              <div className="flex items-center space-x-4">
                {/* Streak */}
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center text-sm text-gray-600 dark:text-gray-300 bg-orange-50 dark:bg-orange-900/30 px-3 py-2 rounded-full border border-orange-200 dark:border-orange-700"
                >
                  <div className="w-6 h-6 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center mr-2">
                    <span className="text-xs">🔥</span>
                  </div>
                  <span className="font-medium">{userProfile.streak} day streak</span>
                </motion.div>

                {/* Badges */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onProfileClick}
                  className="flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors bg-yellow-50 dark:bg-yellow-900/30 px-3 py-2 rounded-full border border-yellow-200 dark:border-yellow-700"
                >
                  <Trophy className="w-4 h-4 mr-1 text-yellow-500" />
                  <span className="font-medium">{userProfile.badges?.filter((b: any) => b.earned).length || 0} badges</span>
                </motion.button>
              </div>
            )}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Profile */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onProfileClick}
              className="flex items-center space-x-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 px-4 py-2 rounded-xl border border-blue-200/50 dark:border-blue-700/50 shadow-sm"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-lg shadow-md">
                {userProfile?.avatar || '👤'}
              </div>
              {userProfile && (
                <div className="text-left">
                  <div className="text-sm font-medium">{userProfile.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {userProfile.totalInterviews} interviews
                  </div>
                </div>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  );
}