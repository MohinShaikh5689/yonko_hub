'use client'

import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUsers, FaCalendarAlt, FaShareAlt, FaArrowLeft, FaUserMinus, FaUserPlus, FaTrash, FaCrown, FaEdit, FaComments, FaTimes, FaExclamationTriangle, FaTwitter, FaFacebook, FaWhatsapp, FaCheck, FaLink } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { CheckToken } from '@/components/checkToken';

interface CommunityDetails {
    id: number;
    Name: string;
    Description: string;
    createdAt: string;
    CoverImage?: string;
}

interface CommunityMembers {
    id: number;
    username: string;
    profile: string;
    role: string;
}

export default function CommunityDetails() {
    CheckToken(); // Check if the user is logged in and token is valid
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const userId = typeof window !== 'undefined' ? Number(localStorage.getItem('userId')) : 0;
    const [communityDetails, setCommunityDetails] = useState<CommunityDetails | null>(null);
    const [communityMembers, setCommunityMembers] = useState<CommunityMembers[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showConfirmLeave, setShowConfirmLeave] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    const fetchdetails = async () => {
        if (!token) return;

        setIsLoading(true);
        try {;
             const response = await axios.get(`http://localhost:3001/api/community/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setCommunityDetails(response.data);
        } catch (error) {
            console.error('Error fetching community details:', error);
            setError('Failed to load community details. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }

    const fetchMembers = async () => {
        if (!token) return;

        try {
           
             const response = await axios.get(`http://localhost:3001/api/community/members/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setCommunityMembers(response.data);

            // Check if current user is admin
            const currentUser = response.data.find((member: CommunityMembers) => member.id === userId);
            if (currentUser && currentUser.role === 'ADMIN') {
                setIsAdmin(true);
            }
        } catch (error) {
            console.error('Error fetching community members:', error);
            setError('Failed to load community members. Please try again later.');
        }
    }

    const kickMember = async (memberId: number) => {
        if (!token || !isAdmin) return;

        try {
            const response = await axios.post(`http://localhost:3001/api/community/kick`, {
                communityId: id,
                userId: memberId
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setCommunityMembers(response.data);
        } catch (error: any) {
            console.error('Error kicking member:', error);
            setError(error.response?.data?.message || 'Failed to remove member. Please try again.');
        }
    }

    const makeAdmin = async (memberId: number) => {
        if (!token || !isAdmin) return;

        try {
            await axios.post(`http://localhost:30001/api/community/make-admin`, {
                communityId: id,
                userId: memberId
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            fetchMembers();
        } catch (error: any) {
            console.error('Error making member admin:', error);
            setError(error.response?.data?.message || 'Failed to promote member. Please try again.');
        }
    }

    const removeAdmin = async (memberId: number) => {
        if (!token || !isAdmin) return;

        try {
            await axios.post(`http://localhost:3001/api/community/remove-admin`, {
                communityId: id,
                userId: memberId
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            fetchMembers();
        } catch (error: any) {
            console.error('Error removing admin:', error);
            setError(error.response?.data?.message || 'Failed to demote admin. Please try again.');
        }
    }

    const leaveCommunity = async () => {
        try {
            await axios.delete(`http://localhost:3001/api/community/leave/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            router.push('/communities');
        } catch (error: any) {
            console.error('Error leaving community:', error);
            setError(error.response?.data?.message || 'Failed to leave community. Please try again.');
            setShowConfirmLeave(false);
        }
    }

    const handleShare = async () => {
        setShareModalOpen(true);
    };

    const copyToClipboard = async () => {
        const joinLink = `${window.location.origin}/communities/join/${id}`;
        
        try {
            await navigator.clipboard.writeText(joinLink);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    // Share via platform functions
    const shareViaTwitter = () => {
        const joinLink = `${window.location.origin}/communities/join/${id}`;
        const text = `Join me in the ${communityDetails?.Name} community on Yonko Hub!`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(joinLink)}`, '_blank');
    };

    const shareViaFacebook = () => {
        const joinLink = `${window.location.origin}/communities/join/${id}`;
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(joinLink)}`, '_blank');
    };

    const shareViaWhatsapp = () => {
        const joinLink = `${window.location.origin}/communities/join/${id}`;
        const text = `Join me in the ${communityDetails?.Name} community on Yonko Hub!`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + joinLink)}`, '_blank');
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            fetchdetails();
            fetchMembers();
        }
    }, []);

    // Auto-hide error after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError(null);
            }, 5000);
            
            return () => clearTimeout(timer);
        }
    }, [error]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#0a0914] to-[#0d0d24] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0914] to-[#0d0d24] text-white">
            {/* Decorative background elements */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full filter blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full filter blur-[80px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>
                <div className="absolute inset-0  opacity-[0.02]"></div>
            </div>

            {/* Error popup */}
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
                                    <FaExclamationTriangle className="h-6 w-6 text-red-400" />
                                </div>
                                <div className="ml-3 w-0 flex-1">
                                    <p className="text-sm text-red-200">{error}</p>
                                </div>
                                <div className="ml-4 flex-shrink-0 flex">
                                    <button
                                        className="inline-flex text-red-300 hover:text-red-100 focus:outline-none"
                                        onClick={() => setError(null)}
                                    >
                                        <FaTimes className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Leave community confirmation dialog */}
            <AnimatePresence>
                {showConfirmLeave && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConfirmLeave(false)}></div>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-indigo-900/80 backdrop-blur-md border border-indigo-500/30 p-6 rounded-xl shadow-xl w-full max-w-md z-10"
                        >
                            <div className="text-center mb-6">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-500/20 mb-4">
                                    <FaUserMinus className="h-6 w-6 text-red-400" />
                                </div>
                                <h3 className="text-lg font-medium text-white mb-1">Leave Community</h3>
                                <p className="text-indigo-200">
                                    Are you sure you want to leave <span className="font-semibold text-white">{communityDetails?.Name}</span>? You'll need an invitation to rejoin.
                                </p>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <Button
                                    className="bg-indigo-800/50 hover:bg-indigo-700/50 text-white px-4"
                                    onClick={() => setShowConfirmLeave(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="bg-red-500/80 hover:bg-red-600/80 text-white px-4"
                                    onClick={leaveCommunity}
                                >
                                    Leave
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Share modal */}
            <AnimatePresence>
                {shareModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShareModalOpen(false)}></div>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-gradient-to-br from-[#141430] to-[#1e1b4b]/90 backdrop-blur-md border border-indigo-500/30 p-6 rounded-xl shadow-xl w-full max-w-md z-10"
                        >
                            <div className="text-center mb-6">
                                <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-indigo-500/20 mb-4">
                                    <FaShareAlt className="h-7 w-7 text-indigo-400" />
                                </div>
                                <h3 className="text-xl font-medium text-white mb-2">Share Community</h3>
                                <p className="text-indigo-200 text-sm">
                                    Invite others to join <span className="font-semibold text-white">{communityDetails?.Name}</span> community
                                </p>
                            </div>

                            {/* Copy link section */}
                            <div className="bg-[#0a0914]/80 p-3 rounded-lg flex items-center justify-between mb-5 border border-indigo-500/20">
                                <div className="truncate text-sm text-indigo-200 flex-1 pl-2">
                                    {`${window.location.origin}/communities/join/${id}`}
                                </div>
                                <Button 
                                    className={`ml-2 text-sm px-3 py-1 flex items-center gap-1.5 
                                    ${copySuccess 
                                        ? 'bg-green-500/20 text-green-300 border-green-500/40' 
                                        : 'bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/40 border-indigo-500/40'}`}
                                    onClick={copyToClipboard}
                                >
                                    {copySuccess ? (
                                        <>
                                            <FaCheck className="h-3 w-3" /> Copied!
                                        </>
                                    ) : (
                                        <>
                                            <FaLink className="h-3 w-3" /> Copy Link
                                        </>
                                    )}
                                </Button>
                            </div>

                            {/* Share via platforms */}
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                <button 
                                    onClick={shareViaTwitter}
                                    className="p-3 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 rounded-lg flex flex-col items-center gap-1.5 transition-colors text-[#1DA1F2] border border-[#1DA1F2]/30"
                                >
                                    <FaTwitter className="text-xl" />
                                    <span className="text-xs font-medium">Twitter</span>
                                </button>
                                
                                <button 
                                    onClick={shareViaFacebook}
                                    className="p-3 bg-[#3b5998]/10 hover:bg-[#3b5998]/20 rounded-lg flex flex-col items-center gap-1.5 transition-colors text-[#3b5998]/90 border border-[#3b5998]/30"
                                >
                                    <FaFacebook className="text-xl" />
                                    <span className="text-xs font-medium">Facebook</span>
                                </button>
                                
                                <button 
                                    onClick={shareViaWhatsapp}
                                    className="p-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 rounded-lg flex flex-col items-center gap-1.5 transition-colors text-[#25D366]/90 border border-[#25D366]/30"
                                >
                                    <FaWhatsapp className="text-xl" />
                                    <span className="text-xs font-medium">WhatsApp</span>
                                </button>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    className="bg-white/10 hover:bg-white/20 text-white px-4"
                                    onClick={() => setShareModalOpen(false)}
                                >
                                    <FaTimes className="h-4 w-4 mr-2" /> Close
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main content */}
            <div className="relative z-10 container mx-auto px-4 pt-20 pb-16">
                {/* Back button */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-8"
                >
                    <Button
                        variant="ghost"
                        className="flex items-center gap-2 text-indigo-300 hover:text-white hover:bg-indigo-600/20"
                        onClick={() => router.back()}
                    >
                        <FaArrowLeft className="h-3.5 w-3.5" /> Back
                    </Button>
                </motion.div>

                {/* Community header with hero image - 16:9 aspect ratio */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative rounded-2xl overflow-hidden mb-16"
                    style={{
                        aspectRatio: '2/0',
                        maxHeight: '500px'
                    }}
                >
                    {/* Cover image with proper path */}
                    <img
                        src="/8c88b9fe27b508404b1627f48dbd55a9.jpg"
                        alt={communityDetails?.Name || "Community"}
                        className="w-full h-full object-cover object-center"
                    />

                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

                    {/* Content positioned at bottom */}
                    <div className="absolute bottom-0 left-0 w-full p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-xl p-1 shadow-lg">
                                    <div className="w-full h-full rounded-lg overflow-hidden bg-indigo-900/70 flex items-center justify-center">
                                        {communityDetails?.CoverImage ? (
                                            <img
                                                src={communityDetails.CoverImage}
                                                alt={communityDetails?.Name || 'Community'}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <FaUsers className="text-indigo-300 text-3xl" />
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-white">{communityDetails?.Name || 'Loading...'}</h1>
                                    <div className="flex items-center gap-4 mt-1 text-gray-200 text-sm">
                                        <div className="flex items-center gap-1.5">
                                            <FaUsers className="text-xs" />
                                            <span>{communityMembers.length} members</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <FaCalendarAlt className="text-xs" />
                                            <span>{communityDetails?.createdAt ? formatDate(communityDetails.createdAt) : 'Recently'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
                                {isAdmin && (
                                    <Link href={`/communities/edit/${id}`}>
                                        <Button
                                            className="bg-white/10 hover:bg-white/20 text-white flex items-center gap-2 rounded-lg"
                                        >
                                            <FaEdit className="h-4 w-4" /> Edit
                                        </Button>
                                    </Link>
                                )}

                                {/* Chat button */}
                                <Button
                                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white 
                                              shadow-md shadow-indigo-900/30 flex items-center gap-2 rounded-lg"
                                    onClick={() => router.push(`/communities/${id}`)}
                                >
                                    <FaComments className="h-4 w-4" /> Chat
                                </Button>

                                {/* Share button - now opens modal */}
                                <Button
                                    className="bg-white/10 hover:bg-white/20 text-white flex items-center gap-2 rounded-lg"
                                    onClick={handleShare}
                                >
                                    <FaShareAlt className="h-4 w-4" /> Share
                                </Button>

                                {/* Leave button - now triggers confirmation dialog */}
                                <Button
                                    className="bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 
                                     border border-red-500/30 flex items-center gap-2 rounded-lg"
                                    onClick={() => setShowConfirmLeave(true)}
                                >
                                    <FaUserMinus className="h-4 w-4" /> Leave
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* About section and Members combined */}
                <div className="grid grid-cols-1 gap-6">
                    {/* About section - more compact */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="bg-indigo-900/20 backdrop-blur-md rounded-xl border border-indigo-500/20 p-5 shadow-lg"
                    >
                        <h2 className="text-lg font-semibold mb-2 text-white">About</h2>
                        <p className="text-gray-300 leading-relaxed">
                            {communityDetails?.Description || 'No description provided.'}
                        </p>
                    </motion.div>

                    {/* Members section - changed to list view for all device sizes */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="bg-indigo-900/20 backdrop-blur-md rounded-xl border border-indigo-500/20 p-5 shadow-lg"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-white">Members</h2>
                            <span className="bg-indigo-500/20 text-indigo-200 text-sm rounded-full px-3 py-1">
                                {communityMembers.length}
                            </span>
                        </div>

                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                            {communityMembers.map((member) => (
                                <div
                                    key={member.id}
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-indigo-600/20 transition-colors border border-indigo-500/10"
                                >
                                    <div
                                        className="flex items-center gap-3 cursor-pointer flex-1"
                                        onClick={() => router.push(`/visit/${member.id}`)}
                                    >
                                        <div className="relative">
                                            {member.profile ? (
                                                <img
                                                    src={member.profile}
                                                    alt={member.username}
                                                    className="w-10 h-10 rounded-full object-cover border border-indigo-500/30"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = 'https://www.gravatar.com/avatar/default?d=mp';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/70 to-purple-500/70 flex items-center justify-center">
                                                    <span className="text-white font-medium">
                                                        {member.username.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}

                                            {member.role === 'ADMIN' && (
                                                <div className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full p-1">
                                                    <FaCrown className="text-[10px] text-white" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="truncate">
                                            <p className="text-white font-medium truncate">{member.username}</p>
                                            <p className="text-xs text-indigo-300 capitalize">{member.role.toLowerCase()}</p>
                                        </div>
                                    </div>

                                    {isAdmin && member.id !== userId && (
                                        <div className="flex gap-1 ml-2">
                                            {member.role === 'ADMIN' ? (
                                                <button
                                                    className="p-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/40 text-amber-400"
                                                    onClick={() => removeAdmin(member.id)}
                                                    title="Demote from Admin"
                                                >
                                                    <FaUserMinus className="h-3 w-3" />
                                                </button>
                                            ) : (
                                                <button
                                                    className="p-1.5 rounded-full bg-green-500/20 hover:bg-green-500/40 border border-green-500/40 text-green-400"
                                                    onClick={() => makeAdmin(member.id)}
                                                    title="Promote to Admin"
                                                >
                                                    <FaUserPlus className="h-3 w-3" />
                                                </button>
                                            )}

                                            <button
                                                className="p-1.5 rounded-full bg-red-500/20 hover:bg-red-500/40 border border-red-500/40 text-red-400"
                                                onClick={() => kickMember(member.id)}
                                                title="Remove from community"
                                            >
                                                <FaTrash className="h-3 w-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {communityMembers.length === 0 && (
                                <div className="text-center py-8">
                                    <FaUsers className="text-indigo-400/40 text-3xl mx-auto mb-2" />
                                    <p className="text-indigo-300">No members in this community yet.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}