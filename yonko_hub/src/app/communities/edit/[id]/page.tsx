'use client'

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { FaArrowLeft, FaImage, FaSpinner, FaSave } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CheckToken } from '@/components/checkToken';

interface Community {
    id: number;
    Name: string;
    description: string;
    CoverImage?: string;
    createdAt: string;
    creatorId: number;
}

export default function CommunityEditPage() {
    CheckToken(); // Check if the user is logged in and token is valid
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    
    // State variables
    const [community, setCommunity] = useState<Community | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const userId = typeof window !== 'undefined' ? Number(localStorage.getItem('userId')) : 0;

    // Fetch community data
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const fetchCommunity = async () => {
            try {
                setIsLoading(true);
                const response = await axios.get(`http://localhost:3001/api/community/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const communityData = response.data;
                setCommunity(communityData);
                setName(communityData.Name);
                setDescription(communityData.description || '');
                
                if (communityData.CoverImage) {
                    setPreviewImage(communityData.CoverImage);
                }
                
                // Check if user has permission to edit
                const membersResponse = await axios.get(`http://localhost:3001/api/community/members/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const isAdmin = membersResponse.data.some(
                    (member: any) => member.id === userId && member.role === 'ADMIN'
                );
                
                if (!isAdmin) {
                    router.push(`/communities/details/${id}`);
                    return;
                }
                
            } catch (error) {
                console.error('Error fetching community:', error);
                setError('Failed to load community details');
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchCommunity();
    }, [id, token, userId, router]);

    // Handle image change
    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setCoverImage(file);
            // Create a preview
            const reader = new FileReader();
            reader.onload = () => {
                setPreviewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle form submission
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        if (!name.trim()) {
            setError('Community name is required');
            return;
        }
        
        setIsSaving(true);
        setError(null);
        
        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        
        if (coverImage) {
            formData.append('coverImage', coverImage);
        }
        
        try {
            await axios.put(`http://localhost:3001/api/community/edit/${id}`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                }
            });
            
            setSuccessMessage('Community updated successfully');
            
            // Navigate after short delay to show success message
            setTimeout(() => {
                router.push(`/communities/details/${id}`);
            }, 1500);
            
        } catch (error: any) {
            console.error('Error updating community:', error);
            setError(error.response?.data?.message || 'Failed to update community');
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#0a0914] to-[#0d0d24] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-t-transparent border-indigo-500" />
            </div>
        );
    }

    if (error && !community) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#0a0914] to-[#0d0d24] pt-20 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="text-red-400 mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">{error}</div>
                    <Link href="/communities" className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors">
                        Back to Communities
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0914] to-[#0d0d24] text-gray-100 pt-20 px-4 pb-12">
            {/* Decorative background elements */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full filter blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full filter blur-[80px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>
                <div className="absolute inset-0  opacity-[0.02]"></div>
            </div>
            
            <div className="max-w-3xl mx-auto relative z-10">
                {/* Header with Back Button */}
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-4 mb-8"
                >
                    <Link href={`/communities/details/${id}`}>
                        <Button variant="ghost" className="text-indigo-300 hover:text-white hover:bg-indigo-800/40">
                            <FaArrowLeft size={18} />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Edit Community</h1>
                </motion.div>

                {/* Success Message */}
                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 flex items-center"
                    >
                        <div className="mr-3 bg-green-400/20 rounded-full p-1">
                            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        {successMessage}
                    </motion.div>
                )}

                {/* Edit Form */}
                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    onSubmit={handleSubmit} 
                    className="bg-indigo-900/20 backdrop-blur-md rounded-xl p-6 shadow-lg border border-indigo-500/20 mb-8"
                >
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">
                            {error}
                        </div>
                    )}
                    
                    {/* Cover Image Upload */}
                    <div className="mb-8">
                        <label className="block text-white font-medium mb-2">
                            Community Image
                        </label>
                        
                        <div className="flex flex-col items-center">
                            {/* Image Preview */}
                            <div className="w-32 h-32 rounded-full overflow-hidden bg-indigo-900/60 mb-4 relative border-2 border-indigo-500/40 shadow-lg shadow-indigo-900/30">
                                {previewImage ? (
                                    <img 
                                        src={previewImage} 
                                        alt="Community" 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-indigo-300">
                                        <FaImage size={40} />
                                    </div>
                                )}
                            </div>
                            
                            {/* Upload Button */}
                            <label className="cursor-pointer px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors flex items-center gap-2 shadow-md shadow-indigo-900/30">
                                <FaImage />
                                <span>Choose Image</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>
                            
                            <p className="text-indigo-300/70 text-xs mt-2">
                                Recommended: Square image, at least 200x200px
                            </p>
                        </div>
                    </div>
                    
                    {/* Community Name */}
                    <div className="mb-6">
                        <label htmlFor="name" className="block text-white font-medium mb-2">
                            Community Name <span className="text-indigo-400">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-indigo-950/50 border border-indigo-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent"
                            placeholder="Give your community a name"
                        />
                    </div>
                    
                    {/* Community Description */}
                    <div className="mb-8">
                        <label htmlFor="description" className="block text-white font-medium mb-2">
                            Description
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 bg-indigo-950/50 border border-indigo-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent resize-none"
                            placeholder="Describe your community..."
                        />
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Link
                            href={`/communities/details/${id}`}
                            className="px-4 py-2 text-indigo-300 hover:text-white transition-colors"
                        >
                            Cancel
                        </Link>
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-colors disabled:opacity-70 flex items-center gap-2 shadow-md shadow-indigo-900/30"
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
                </motion.form>
            </div>
        </div>
    );
}