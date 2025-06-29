import React, { useState, useEffect } from 'react';
import { User, Mail, Camera, Save, Edit3, Trophy, Calendar, Target, X, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StorageService } from '../../services/storage';
import type { UserProfile } from '../../types';

interface ProfileSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  onProfileUpdate: (profile: UserProfile) => void;
  onLogout?: () => void;
}

export default function ProfileSettings({ isOpen, onClose, userProfile, onProfileUpdate, onLogout }: ProfileSettingsProps) {
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('👤');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const storageService = StorageService.getInstance();

  const avatarOptions = ['👤', '👨‍💼', '👩‍💼', '👨‍💻', '👩‍💻', '🧑‍🎓', '👨‍🔬', '👩‍🔬', '🧑‍🎨', '👨‍🏫', '👩‍🏫', '🧑‍⚕️'];

  useEffect(() => {
    if (userProfile) {
      setEditedProfile({ ...userProfile });
      setSelectedAvatar(userProfile.avatar || '👤');
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!editedProfile) return;

    setIsSaving(true);
    
    // Simulate save delay
    setTimeout(() => {
      const updatedProfile = {
        ...editedProfile,
        avatar: selectedAvatar
      };
      
      storageService.saveUserProfile(updatedProfile);
      onProfileUpdate(updatedProfile);
      setIsEditing(false);
      setIsSaving(false);
    }, 1000);
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    if (editedProfile) {
      setEditedProfile({
        ...editedProfile,
        [field]: value
      });
    }
  };

  const handleLogout = () => {
    // Clear user data
    storageService.clearData();
    
    // Call the logout callback
    if (onLogout) {
      onLogout();
    }
    
    // Close the modal
    onClose();
    setShowLogoutConfirm(false);
  };

  if (!isOpen || !editedProfile) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Profile Settings</h2>
                  <p className="text-blue-100">Manage your account information</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Avatar Selection */}
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-4xl mb-4 shadow-lg">
                  {selectedAvatar}
                </div>
                {isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="absolute bottom-2 right-2 w-8 h-8 bg-white dark:bg-gray-700 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Camera className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </button>
                )}
              </div>
              
              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Choose your avatar:</p>
                  <div className="grid grid-cols-6 gap-2 max-w-xs mx-auto">
                    {avatarOptions.map((avatar) => (
                      <button
                        key={avatar}
                        onClick={() => setSelectedAvatar(avatar)}
                        className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl transition-all duration-200 ${
                          selectedAvatar === avatar
                            ? 'bg-blue-100 dark:bg-blue-900/50 border-2 border-blue-500 scale-110'
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border-2 border-transparent'
                        }`}
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Profile Information */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h3>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                      {editedProfile.name}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editedProfile.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                      {editedProfile.email}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Progress</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 p-4 rounded-xl border border-green-200 dark:border-green-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">{editedProfile.totalInterviews}</p>
                      <p className="text-sm text-green-600 dark:text-green-400">Interviews Completed</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 p-4 rounded-xl border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{Math.round(editedProfile.averageScore)}</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">Average Score</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 p-4 rounded-xl border border-orange-200 dark:border-orange-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{editedProfile.streak}</p>
                      <p className="text-sm text-orange-600 dark:text-orange-400">Day Streak</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Achievements</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {editedProfile.badges?.map((badge, index) => (
                  <div
                    key={badge.id || index}
                    className={`p-3 rounded-lg border text-center transition-all duration-200 ${
                      badge.earned
                        ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    <div className="text-2xl mb-1">{badge.icon}</div>
                    <p className="text-xs font-medium">{badge.name}</p>
                  </div>
                )) || (
                  <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                    <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Complete interviews to earn badges!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center"
                >
                  {isSaving ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </div>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Save Changes
                    </>
                  )}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsEditing(false);
                    if (userProfile) {
                      setEditedProfile({ ...userProfile });
                      setSelectedAvatar(userProfile.avatar || '👤');
                    }
                  }}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </motion.button>
              </motion.div>
            )}

            {/* Logout Section */}
            {!isEditing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-6 border-t border-gray-200 dark:border-gray-700"
              >
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
                  <h4 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">Account Actions</h4>
                  <p className="text-sm text-red-700 dark:text-red-400 mb-4">
                    Logging out will clear your session data. Your profile and interview history will be preserved.
                  </p>
                  
                  {!showLogoutConfirm ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowLogoutConfirm(true)}
                      className="flex items-center px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
                    >
                      <LogOut className="w-5 h-5 mr-2" />
                      Log Out
                    </motion.button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <p className="text-sm font-medium text-red-800 dark:text-red-300">
                        Are you sure you want to log out?
                      </p>
                      <div className="flex space-x-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleLogout}
                          className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Yes, Log Out
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowLogoutConfirm(false)}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}