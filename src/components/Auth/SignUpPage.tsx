import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Bot, CheckCircle, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import Footer from '../Common/Footer';

interface SignUpPageProps {
  onBack: () => void;
  onSignUp: (name: string, email: string, password: string) => void;
}

export default function SignUpPage({ onBack, onSignUp }: SignUpPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    if (!agreeToTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      onSignUp(name, email, password);
      setIsLoading(false);
    }, 1000);
  };

  const handleSignInRedirect = () => {
    // Navigate to sign in page by changing the URL
    window.history.pushState({}, '', '/signin');
    window.location.reload();
  };

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
              Back to Home
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
            
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Create Your Account</h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">Join thousands practicing interviews with AI</p>
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-green-50/80 to-blue-50/80 dark:from-green-900/20 dark:to-blue-900/20 backdrop-blur-sm border border-green-200/50 dark:border-green-700/50 rounded-xl p-5 mb-6 shadow-lg"
          >
            <h3 className="font-bold text-green-900 dark:text-green-300 mb-3 text-lg">Why create an account?</h3>
            <ul className="text-sm text-green-800 dark:text-green-400 space-y-2">
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-3 text-green-600 dark:text-green-400" />
                Save your interview progress and history
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-3 text-green-600 dark:text-green-400" />
                Track performance improvements over time
              </li>
              <li className="flex items-center">
                <Shield className="w-4 h-4 mr-3 text-green-600 dark:text-green-400" />
                Your data stays private and secure
              </li>
            </ul>
          </motion.div>

          {/* Sign Up Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/50 dark:border-gray-700/50 p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

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
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-14 py-4 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm"
                    placeholder="Create a password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-14 py-4 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="mt-1 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 bg-white dark:bg-gray-700"
                />
                <label htmlFor="terms" className="ml-3 text-sm text-gray-600 dark:text-gray-300">
                  I agree to the{' '}
                  <a href="/terms" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors">
                    Privacy Policy
                  </a>
                </label>
              </div>

              {/* Sign Up Button */}
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
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </motion.button>
            </form>

            {/* Sign In Link */}
            <div className="mt-8 text-center">
              <p className="text-gray-600 dark:text-gray-300">
                Already have an account?{' '}
                <button 
                  onClick={handleSignInRedirect}
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold transition-colors"
                >
                  Sign in
                </button>
              </p>
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