import React, { useState } from 'react';
import { ArrowLeft, Mail, CheckCircle, AlertCircle, Bot, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import Footer from '../Common/Footer';

interface ForgotPasswordPageProps {
  onBack: () => void;
}

export default function ForgotPasswordPage({ onBack }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsEmailSent(true);
    }, 2000);
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <button
                onClick={onBack}
                className="inline-flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </button>

              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/50 dark:border-gray-700/50 p-8">
                <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>

                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Check Your Email</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  We've sent a password reset link to <strong>{email}</strong>. 
                  Please check your email and follow the instructions to reset your password.
                </p>

                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 mb-6 border border-blue-200 dark:border-blue-700">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Didn't receive the email?</h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                    <li>• Check your spam or junk folder</li>
                    <li>• Make sure you entered the correct email address</li>
                    <li>• Wait a few minutes for the email to arrive</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setIsEmailSent(false);
                      setEmail('');
                    }}
                    className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Send Another Email
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onBack}
                    className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Back to Sign In
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <button
              onClick={onBack}
              className="inline-flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </button>
            
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-xl flex items-center justify-center mr-4 shadow-xl">
                <Bot className="w-9 h-9 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                  MockMate
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">AI Interview Coach</p>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Forgot Password?</h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
              No worries! Enter your email address and we'll send you a link to reset your password.
            </p>
          </motion.div>

          {/* Reset Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/50 dark:border-gray-700/50 p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm"
                    placeholder="Enter your email address"
                    required
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                  <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                    Sending Reset Link...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Send className="w-5 h-5 mr-2" />
                    Send Reset Link
                  </div>
                )}
              </motion.button>
            </form>

            {/* Additional Help */}
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">Need Help?</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-2">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Make sure you're using the email address associated with your MockMate account
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Check your spam folder if you don't receive the email within a few minutes
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  If you continue having issues, try creating a new account
                </li>
              </ul>
            </div>

            {/* Back to Sign In */}
            <div className="mt-6 text-center">
              <p className="text-gray-600 dark:text-gray-300">
                Remember your password?{' '}
                <button 
                  onClick={onBack}
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold transition-colors"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </motion.div>

          {/* Security Note */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-center"
          >
            <div className="inline-flex items-center px-4 py-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm border border-green-200 dark:border-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span>Your data is secure and encrypted</span>
            </div>
          </motion.div>

          {/* Decorative Elements */}
          <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20 blur-xl"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 blur-xl"></div>
          <div className="absolute top-1/2 left-5 w-16 h-16 bg-gradient-to-r from-pink-400 to-blue-400 rounded-full opacity-15 blur-lg"></div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}