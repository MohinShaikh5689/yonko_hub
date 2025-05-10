'use client'

import { useState } from 'react'
import axios from 'axios'
import { FaImage, FaTimes } from 'react-icons/fa';

interface CreateCommunityModalProps {
    onClose: () => void;
}

export default function CreateCommunity({ onClose }: CreateCommunityModalProps) {
    const [newCommunity, setNewCommunity] = useState({
        name: '',
        description: '',
        image: null as File | null
    });
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const token = localStorage.getItem('token') || '';

    const createCommunity = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            const formData = new FormData();

            // Append the text fields to the form data
            formData.append('name', newCommunity.name);
            formData.append('description', newCommunity.description);

            // Append the file to the form data
            if (newCommunity.image) {
                formData.append('coverImage', newCommunity.image);
            }

            await axios.post('https://mugiwarahubbackend-production.up.railway.app/api/community/create', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // Don't set Content-Type when sending FormData
                }
            });
            onClose();
        } catch (error:any) {
            console.error('Error creating community:', error);   
        } finally {
            setIsSubmitting(false);
            setNewCommunity({
                name: '',
                description: '',
                image: null
            });
            setImagePreview(null);
        }
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;

        if (file) {
            setNewCommunity(prev => ({
                ...prev,
                image: file
            }));

            // Create preview URL for the selected image
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const removeImage = () => {
        setNewCommunity(prev => ({
            ...prev,
            image: null
        }));
        setImagePreview(null);
    };

    return(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-[#141430]/90 p-6 sm:p-8 rounded-xl w-full max-w-md border border-indigo-500/30 shadow-xl shadow-indigo-500/10 animate-fade-in-up">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-transparent mb-6 flex items-center">
                    <span className="bg-indigo-600/30 p-2 rounded-lg mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </span>
                    Create Community
                </h2>
                
                <form onSubmit={createCommunity}>
                    <div className="space-y-5">
                        <div>
                            <label htmlFor="community-name" className="block text-sm font-medium text-indigo-300 mb-1.5">Community Name</label>
                            <input
                                id="community-name"
                                type="text"
                                placeholder="Enter your community name"
                                value={newCommunity.name}
                                onChange={(e) => setNewCommunity(prev => ({
                                    ...prev,
                                    name: e.target.value
                                }))}
                                className="w-full bg-[#0a0914] text-white px-4 py-3 rounded-lg border border-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder-indigo-300/50"
                                required
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="community-desc" className="block text-sm font-medium text-indigo-300 mb-1.5">Community Description</label>
                            <textarea
                                id="community-desc"
                                placeholder="Describe what your community is about"
                                value={newCommunity.description}
                                onChange={(e) => setNewCommunity(prev => ({
                                    ...prev,
                                    description: e.target.value
                                }))}
                                className="w-full bg-[#0a0914] text-white px-4 py-3 rounded-lg border border-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder-indigo-300/50"
                                rows={4}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-indigo-300 mb-1.5">Community Image</label>
                            {/* Image Preview */}
                            {imagePreview ? (
                                <div className="relative rounded-lg overflow-hidden border-2 border-indigo-500/40">
                                    <img
                                        src={imagePreview}
                                        alt="Community preview"
                                        className="w-full h-48 object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0914]/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105"
                                    >
                                        <FaTimes className="text-sm" />
                                    </button>
                                </div>
                            ) : (
                                <div 
                                    className="w-full h-48 border-2 border-dashed border-indigo-500/30 rounded-lg
                                    flex flex-col items-center justify-center text-indigo-300/70 cursor-pointer
                                    bg-[#0a0914]/50 hover:bg-[#0a0914]/70 hover:border-indigo-500/50 transition-all duration-200"
                                    onClick={() => document.getElementById('community-image-input')?.click()}
                                >
                                    <FaImage className="text-4xl mb-3 text-indigo-400/70" />
                                    <p className="text-center px-4">Click to upload community banner image</p>
                                    <p className="text-xs text-indigo-300/50 mt-2">Recommended: 1200 × 400px</p>
                                </div>
                            )}

                            <input
                                id="community-image-input"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </div>

                        <div className="flex justify-end gap-4 pt-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-5 py-2.5 text-indigo-300 hover:text-white bg-[#0a0914]/70 hover:bg-[#0a0914] border border-indigo-500/30 rounded-lg transition-colors duration-200 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg 
                                transition-all duration-300 disabled:opacity-50 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 flex items-center gap-2 transform hover:translate-y-[-2px]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Creating...</span>
                                    </>
                                ) : (
                                    <span>Create Community</span>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}