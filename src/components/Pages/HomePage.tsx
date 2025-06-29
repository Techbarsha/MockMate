import React from 'react';
import { Play, Bot, Mic, Brain, Trophy, Shield, Zap, CheckCircle, Star, Users, ArrowRight, Sparkles, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Footer from '../Common/Footer';
import ThemeToggle from '../Common/ThemeToggle';

interface HomePageProps {
  onStartPractice: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
  onAbout: () => void;
}

export default function HomePage({ onStartPractice, onSignIn, onSignUp, onAbout }: HomePageProps) {
  const features = [
    {
      icon: Mic,
      title: 'Voice-Powered Interviews',
      description: 'Practice with real-time speech recognition and natural voice responses',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Bot,
      title: 'AI Interview Coach',
      description: 'Get intelligent questions and personalized feedback from our AI interviewer',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Brain,
      title: 'Smart Feedback System',
      description: 'Receive detailed analysis and improvement suggestions after each session',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: Trophy,
      title: 'Progress Tracking',
      description: 'Monitor your improvement with detailed analytics and achievement badges',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Shield,
      title: '100% Private',
      description: 'Your data stays on your device. No external tracking or data collection',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      icon: MessageCircle,
      title: 'AI Assistant',
      description: 'Get instant help and tips from our intelligent chatbot assistant',
      gradient: 'from-pink-500 to-rose-500'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Software Engineer',
      content: 'MockMate helped me land my dream job at Google. The AI feedback was incredibly detailed and actionable.',
      rating: 5,
      avatar: '👩‍💻'
    },
    {
      name: 'Michael Rodriguez',
      role: 'Product Manager',
      content: 'The voice recognition works perfectly, and I love that it\'s completely free. No hidden costs!',
      rating: 5,
      avatar: '👨‍💼'
    },
    {
      name: 'Emily Johnson',
      role: 'Data Scientist',
      content: 'Best interview practice tool I\'ve used. The 3D avatar makes it feel like a real interview.',
      rating: 5,
      avatar: '👩‍🔬'
    }
  ];

  const stats = [
    { number: '50K+', label: 'Interviews Practiced', icon: '🎯' },
    { number: '15K+', label: 'Happy Users', icon: '😊' },
    { number: '95%', label: 'Success Rate', icon: '📈' },
    { number: '100%', label: 'Free Forever', icon: '💎' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                  MockMate
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">AI Interview Coach</p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors font-medium">
                Features
              </a>
              <button onClick={onAbout} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors font-medium">
                About
              </button>
              <a href="#testimonials" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors font-medium">
                Reviews
              </a>
            </div>

            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <button
                onClick={onSignIn}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors font-medium"
              >
                Sign In
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onStartPractice}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Start Free
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm font-medium mb-6 border border-purple-200 dark:border-purple-700 shadow-sm">
                <Sparkles className="w-4 h-4 mr-2 text-yellow-500" />
                Transform Your Career with AI-Powered Practice
              </div>
              
              <h1 className="text-6xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6">
                Master Your
                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                  {' '}Interview Skills
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Practice interviews with AI-powered coaching, real-time voice interaction, 
                and personalized feedback. Completely free, open source, and privacy-focused.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onStartPractice}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center"
              >
                <Play className="w-6 h-6 mr-2" />
                Start Practicing Now
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAbout}
                className="border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg transition-all duration-200 flex items-center"
              >
                Learn More
                <ArrowRight className="w-5 h-5 ml-2" />
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="text-center bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 dark:border-gray-700/50"
                >
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">{stat.number}</div>
                  <div className="text-gray-600 dark:text-gray-300 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our comprehensive platform provides all the tools you need to master your interview skills
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300"
              >
                <div className={`w-14 h-14 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mb-6 shadow-lg`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Loved by Thousands of Users
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              See what our community says about MockMate
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-xl mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</div>
                    <div className="text-gray-500 dark:text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-5xl font-bold text-white mb-6">
              Ready to Ace Your Next Interview?
            </h2>
            <p className="text-xl text-purple-100 mb-8">
              Join thousands of successful candidates who improved their interview skills with MockMate
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onStartPractice}
                className="bg-white text-purple-600 px-8 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center"
              >
                <Play className="w-6 h-6 mr-2" />
                Start Free Practice
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onSignUp}
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-purple-600 transition-all duration-200 flex items-center"
              >
                <Users className="w-6 h-6 mr-2" />
                Create Free Account
              </motion.button>
            </div>
            
            <p className="text-purple-100 mt-6 text-sm">
              No credit card required • No setup needed • Always free
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}