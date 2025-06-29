import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Common/Header';
import InterviewSettings from './components/Settings/InterviewSettings';
import InterviewSession from './components/Interview/InterviewSession';
import ResultsPage from './components/Results/ResultsPage';
import HomePage from './components/Pages/HomePage';
import AboutPage from './components/Pages/AboutPage';
import SignInPage from './components/Auth/SignInPage';
import SignUpPage from './components/Auth/SignUpPage';
import LoadingSpinner from './components/Common/LoadingSpinner';
import ChatBot from './components/Chat/ChatBot';
import ProfileSettings from './components/Settings/ProfileSettings';
import { ThemeProvider } from './contexts/ThemeContext';
import { StorageService } from './services/storage';
import type { InterviewSettings as IInterviewSettings, InterviewSession as IInterviewSession, UserProfile } from './types';

type AppState = 'home' | 'about' | 'signin' | 'signup' | 'loading' | 'setup' | 'interview' | 'results';

function AppContent() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [currentSettings, setCurrentSettings] = useState<IInterviewSettings | null>(null);
  const [currentSession, setCurrentSession] = useState<IInterviewSession | null>(null);
  const [resumeData, setResumeData] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChatBotOpen, setIsChatBotOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);

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
        setAppState('home');
      }, 1500);
    };

    initializeApp();
  }, [storageService]);

  const handleStartPractice = () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      setAppState('signup');
    } else {
      setAppState('setup');
    }
  };

  const handleStartInterview = (settings: IInterviewSettings, resumeData?: any) => {
    setCurrentSettings(settings);
    setResumeData(resumeData);
    setAppState('interview');
  };

  const handleInterviewComplete = (session: IInterviewSession) => {
    setCurrentSession(session);
    
    // Update user stats if authenticated
    if (session.score && userProfile) {
      const updatedProfile = {
        ...userProfile,
        totalInterviews: userProfile.totalInterviews + 1,
        averageScore: (userProfile.averageScore + session.score) / 2,
        streak: userProfile.streak + 1
      };
      setUserProfile(updatedProfile);
      storageService.saveUserProfile(updatedProfile);
    }
    
    setAppState('results');
  };

  const handleBackToHome = () => {
    setCurrentSettings(null);
    setCurrentSession(null);
    setResumeData(null);
    setAppState('home');
  };

  const handleBackToSetup = () => {
    setCurrentSettings(null);
    setCurrentSession(null);
    setResumeData(null);
    setAppState('setup');
  };

  const handleStartNewInterview = () => {
    setCurrentSession(null);
    setAppState('setup');
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
    setAppState('setup'); // Go directly to setup after sign in
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
    setAppState('setup'); // Go directly to setup after sign up
  };

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
  };

  const handleProfileClick = () => {
    if (isAuthenticated && userProfile) {
      setIsProfileSettingsOpen(true);
    } else {
      setAppState('signin');
    }
  };

  const handleLogout = () => {
    // Clear authentication state
    setUserProfile(null);
    setIsAuthenticated(false);
    setIsProfileSettingsOpen(false);
    
    // Navigate back to home
    setAppState('home');
  };

  const renderContent = () => {
    switch (appState) {
      case 'loading':
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

      case 'home':
        return (
          <HomePage
            onStartPractice={handleStartPractice}
            onSignIn={() => setAppState('signin')}
            onSignUp={() => setAppState('signup')}
            onAbout={() => setAppState('about')}
          />
        );

      case 'about':
        return (
          <AboutPage onBack={handleBackToHome} />
        );

      case 'signin':
        return (
          <SignInPage
            onBack={handleBackToHome}
            onSignIn={handleSignIn}
          />
        );

      case 'signup':
        return (
          <SignUpPage
            onBack={handleBackToHome}
            onSignUp={handleSignUp}
          />
        );

      case 'setup':
        return (
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
        );

      case 'interview':
        return currentSettings ? (
          <InterviewSession
            settings={currentSettings}
            resumeData={resumeData}
            onBack={handleBackToSetup}
          />
        ) : null;

      case 'results':
        return currentSession ? (
          <ResultsPage
            session={currentSession}
            onBack={handleBackToSetup}
            onStartNew={handleStartNewInterview}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        <motion.div
          key={appState}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
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