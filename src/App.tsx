import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Common/Header';
import InterviewSettings from './components/Settings/InterviewSettings';
import InterviewSession from './components/Interview/InterviewSession';
import ResultsPage from './components/Results/ResultsPage';
import HomePage from './components/Pages/HomePage';
import AboutPage from './components/Pages/AboutPage';
import SignInPage from './components/Auth/SignInPage';
import SignUpPage from './components/Auth/SignUpPage';
import ForgotPasswordPage from './components/Auth/ForgotPasswordPage';
import LoadingSpinner from './components/Common/LoadingSpinner';
import ChatBot from './components/Chat/ChatBot';
import ProfileSettings from './components/Settings/ProfileSettings';
import { ThemeProvider } from './contexts/ThemeContext';
import { StorageService } from './services/storage';
import type { InterviewSettings as IInterviewSettings, InterviewSession as IInterviewSession, UserProfile } from './types';

function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentSettings, setCurrentSettings] = useState<IInterviewSettings | null>(null);
  const [currentSession, setCurrentSession] = useState<IInterviewSession | null>(null);
  const [resumeData, setResumeData] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChatBotOpen, setIsChatBotOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const storageService = StorageService.getInstance();

  useEffect(() => {
    // Initialize app
    const initializeApp = async () => {
      // Load user profile if exists
      let profile = storageService.getUserProfile();
      if (profile) {
        setUserProfile(profile);
        setIsAuthenticated(true);
      }

      // Simulate loading
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    };

    initializeApp();
  }, [storageService]);

  const handleStartPractice = () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      navigate('/signup');
    } else {
      navigate('/setup');
    }
  };

  const handleStartInterview = (settings: IInterviewSettings, resumeData?: any) => {
    console.log('Starting interview with settings:', settings);
    setCurrentSettings(settings);
    setResumeData(resumeData);
    navigate('/interview');
  };

  const handleInterviewComplete = (session: IInterviewSession) => {
    console.log('Interview completed:', session);
    setCurrentSession(session);
    
    // Update user stats if authenticated
    if (session.score && userProfile) {
      const updatedProfile = {
        ...userProfile,
        totalInterviews: userProfile.totalInterviews + 1,
        averageScore: userProfile.totalInterviews === 0 
          ? session.score 
          : (userProfile.averageScore * userProfile.totalInterviews + session.score) / (userProfile.totalInterviews + 1),
        streak: userProfile.streak + 1
      };
      setUserProfile(updatedProfile);
      storageService.saveUserProfile(updatedProfile);
    }
    
    navigate('/results');
  };

  const handleBackToHome = () => {
    setCurrentSettings(null);
    setCurrentSession(null);
    setResumeData(null);
    navigate('/');
  };

  const handleBackToSetup = () => {
    setCurrentSettings(null);
    setCurrentSession(null);
    setResumeData(null);
    navigate('/setup');
  };

  const handleStartNewInterview = () => {
    setCurrentSession(null);
    navigate('/setup');
  };

  const handleSignIn = (email: string, password: string) => {
    // Simulate authentication
    const profile: UserProfile = {
      id: Date.now().toString(),
      name: email.split('@')[0],
      email: email,
      avatar: '👤',
      streak: 0,
      badges: [],
      totalInterviews: 0,
      averageScore: 0
    };
    
    setUserProfile(profile);
    setIsAuthenticated(true);
    storageService.saveUserProfile(profile);
    navigate('/setup'); // Go directly to setup after sign in
  };

  const handleSignUp = (name: string, email: string, password: string) => {
    // Simulate registration
    const profile: UserProfile = {
      id: Date.now().toString(),
      name: name,
      email: email,
      avatar: '👤',
      streak: 0,
      badges: [],
      totalInterviews: 0,
      averageScore: 0
    };
    
    setUserProfile(profile);
    setIsAuthenticated(true);
    storageService.saveUserProfile(profile);
    navigate('/setup'); // Go directly to setup after sign up
  };

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
  };

  const handleProfileClick = () => {
    if (isAuthenticated && userProfile) {
      setIsProfileSettingsOpen(true);
    } else {
      navigate('/signin');
    }
  };

  const handleLogout = () => {
    // Clear authentication state
    setUserProfile(null);
    setIsAuthenticated(false);
    setIsProfileSettingsOpen(false);
    
    // Navigate back to home
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-20 h-20 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
          >
            <span className="text-3xl">🤖</span>
          </motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2">MockMate</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">AI-Powered Interview Coach</p>
          <LoadingSpinner text="Initializing your interview experience..." />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Routes>
            <Route 
              path="/" 
              element={
                <HomePage
                  onStartPractice={handleStartPractice}
                  onSignIn={() => navigate('/signin')}
                  onSignUp={() => navigate('/signup')}
                  onAbout={() => navigate('/about')}
                />
              } 
            />
            <Route 
              path="/about" 
              element={<AboutPage onBack={handleBackToHome} />} 
            />
            <Route 
              path="/signin" 
              element={
                <SignInPage
                  onBack={handleBackToHome}
                  onSignIn={handleSignIn}
                />
              } 
            />
            <Route 
              path="/signup" 
              element={
                <SignUpPage
                  onBack={handleBackToHome}
                  onSignUp={handleSignUp}
                />
              } 
            />
            <Route 
              path="/forgot-password" 
              element={
                <ForgotPasswordPage
                  onBack={() => navigate('/signin')}
                />
              } 
            />
            <Route 
              path="/setup" 
              element={
                <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                  <Header 
                    userProfile={userProfile} 
                    onProfileClick={handleProfileClick}
                  />
                  <div className="py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <InterviewSettings
                        onStartInterview={handleStartInterview}
                        onResumeUpload={setResumeData}
                      />
                    </div>
                  </div>
                </div>
              } 
            />
            <Route 
              path="/interview" 
              element={
                currentSettings ? (
                  <InterviewSession
                    settings={currentSettings}
                    resumeData={resumeData}
                    onBack={handleBackToSetup}
                    onComplete={handleInterviewComplete}
                  />
                ) : (
                  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                    <div className="text-center bg-white rounded-xl shadow-xl p-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">No Interview Settings Found</h2>
                      <p className="text-gray-600 mb-6">Please go back and configure your interview settings.</p>
                      <button
                        onClick={handleBackToSetup}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Back to Setup
                      </button>
                    </div>
                  </div>
                )
              } 
            />
            <Route 
              path="/results" 
              element={
                currentSession ? (
                  <ResultsPage
                    session={currentSession}
                    onBack={handleBackToSetup}
                    onStartNew={handleStartNewInterview}
                  />
                ) : (
                  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                    <div className="text-center bg-white rounded-xl shadow-xl p-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">No Results Found</h2>
                      <p className="text-gray-600 mb-6">Please complete an interview to see results.</p>
                      <button
                        onClick={handleBackToSetup}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Start New Interview
                      </button>
                    </div>
                  </div>
                )
              } 
            />
          </Routes>
        </motion.div>
      </AnimatePresence>

      {/* AI Chatbot */}
      <ChatBot 
        isOpen={isChatBotOpen} 
        onToggle={() => setIsChatBotOpen(!isChatBotOpen)} 
      />

      {/* Profile Settings Modal */}
      <ProfileSettings
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
        userProfile={userProfile}
        onProfileUpdate={handleProfileUpdate}
        onLogout={handleLogout}
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;