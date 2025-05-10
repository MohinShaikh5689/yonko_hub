'use client'

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { FaUser, FaSave, FaSpinner, FaCamera, FaTrash, FaArrowLeft } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckToken } from '@/components/checkToken';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  profile: string | null;
  createdAt: string;
}

export default function ProfileEdit() {
  CheckToken(); // Check if the user is authenticated and token is valid
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [_profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [removeProfileImage, setRemoveProfileImage] = useState(false);
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Fetch user profile
  const fetchProfile = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('http://localhost:3001/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const userData = response.data;
      setProfile(userData);
      
      // Initialize form with existing data
      setName(userData.name || '');
      setEmail(userData.email || '');
      
      // Set profile image preview if it exists
      if (userData.profile) {
        setPreviewImage(userData.profile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load your profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle profile image change
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setProfileImage(file);
      setRemoveProfileImage(false);
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle removing the profile image
  const handleRemoveImage = () => {
    setProfileImage(null);
    setPreviewImage(null);
    setRemoveProfileImage(true);
  };

  // Auto-hide notifications after 5 seconds
  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccessMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (password && password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    
    // Create FormData object
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    
    if (password) {
      formData.append('password', password);
    }

    if (newPassword) {
      formData.append('newPassword', newPassword);
    }
    
    if (profileImage) {
      formData.append('profile', profileImage);
    }
    
    if (removeProfileImage) {
      formData.append('removeProfile', 'true');
    }
    
    try {
      const response = await axios.put('http://localhost:3001/api/users/update', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.profile) {
        localStorage.setItem('profilePicture', response.data.user.profile);
      } else if (removeProfileImage) {
        localStorage.removeItem('profilePicture');
      }
      
      setSuccessMessage('Profile updated successfully!');
      setPassword('');
      setNewPassword('');
      fetchProfile();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {   
      fetchProfile();  
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0914] to-[#0d0d24] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0914] to-[#0d0d24] text-white pt-20 px-4 sm:px-6 lg:px-8 pb-12">
      {/* Decorative background elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full filter blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full filter blur-[80px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        <div className="absolute inset-0  opacity-[0.02]"></div>
      </div>
      
      {/* Error and Success Notifications */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-red-500/20 backdrop-blur-md border border-red-500/40 rounded-lg p-4 shadow-lg shadow-red-900/20 mx-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 w-0 flex-1">
                  <p className="text-sm text-red-200">{error}</p>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                  <button
                    className="inline-flex text-red-300 hover:text-red-100 focus:outline-none"
                    onClick={() => setError(null)}
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-green-500/20 backdrop-blur-md border border-green-500/40 rounded-lg p-4 shadow-lg shadow-green-900/20 mx-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 w-0 flex-1">
                  <p className="text-sm text-green-200">{successMessage}</p>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                  <button
                    className="inline-flex text-green-300 hover:text-green-100 focus:outline-none"
                    onClick={() => setSuccessMessage(null)}
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center mb-8"
        >
          <Button 
            onClick={() => router.push('/profile')}
            variant="ghost"
            className="mr-4 p-2 text-indigo-300 hover:text-white hover:bg-indigo-600/20"
          >
            <FaArrowLeft />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Profile Settings</h1>
        </motion.div>
        
        {/* Settings Form */}
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          onSubmit={handleSubmit} 
          className="bg-indigo-900/20 backdrop-blur-md rounded-xl border border-indigo-500/20 p-6 shadow-lg"
        >
          {/* Profile Image Section */}
          <div className="mb-8 flex flex-col items-center">
            <div className="relative mb-4 group">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border-4 border-indigo-500/30 shadow-lg">
                {previewImage ? (
                  <img 
                    src={previewImage} 
                    alt="Profile preview" 
                    className="w-full h-full object-cover"
                    onError={() => setPreviewImage(null)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FaUser className="text-4xl text-indigo-300" />
                  </div>
                )}
                
                {/* Image overlay with options */}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <div className="flex gap-2">
                    <label className="p-2 bg-indigo-600 text-white rounded-full cursor-pointer hover:bg-indigo-700 transition-colors">
                      <FaCamera className="text-lg" />
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                    
                    {previewImage && (
                      <button 
                        type="button"
                        onClick={handleRemoveImage}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <FaTrash className="text-lg" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-indigo-300/70">
              Hover over your profile picture to change or remove it
            </p>
          </div>
          
          {/* Form Fields */}
          <div className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-indigo-200 mb-2 font-medium">
                Display Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-indigo-950/50 border border-indigo-500/30 rounded-lg 
                         text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
              />
            </div>
            
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-indigo-200 mb-2 font-medium">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-indigo-950/50 border border-indigo-500/30 rounded-lg 
                         text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
              />
            </div>
            
            {/* Password Section */}
            <div className="pt-6 border-t border-indigo-500/20">
              <h2 className="text-xl text-white mb-4">Change Password</h2>
              <p className="text-indigo-300/70 text-sm mb-4">
                Leave the password fields blank if you don't want to change it
              </p>
              
              {/* Current Password Field */}
              <div className="mb-4">
                <label htmlFor="password" className="block text-indigo-200 mb-2 font-medium">
                  Enter Current Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-indigo-950/50 border border-indigo-500/30 rounded-lg 
                           text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  minLength={6}
                />
              </div>
              
              {/* New Password Field */}
              <div>
                <label htmlFor="newPassword" className="block text-indigo-200 mb-2 font-medium">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-indigo-950/50 border border-indigo-500/30 rounded-lg 
                           text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                />
              </div>
            </div>
            
            {/* Save Button */}
            <div className="pt-6 flex justify-end">
              <Button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white 
                          rounded-lg transition-all disabled:opacity-70 flex items-center gap-2 shadow-md shadow-indigo-900/30"
              >
                {isSaving ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <FaSave />
                    <span>Save Changes</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.form>
      </div>
    </div>
  );
}