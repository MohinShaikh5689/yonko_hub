'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { FaUsers, FaArrowLeft, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import { CheckToken } from '@/components/checkToken';
import { Button } from '@/components/ui/button';

interface Community {
    id: number;
    Name: string;
    Description: string;
    CoverImage?: string;
    memberCount?: number;
}

export default function CommunityJoin() {
    CheckToken(); // Check if the user is logged in and token is valid
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    
    const [community, setCommunity] = useState<Community | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [joining, setJoining] = useState(false);
    const [joined, setJoined] = useState(false);
    const [alreadyMember, setAlreadyMember] = useState(false);
    
    // We need to check if we're in the browser before accessing localStorage
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setAuthToken(localStorage.getItem('token'));
            setUserId(localStorage.getItem('userId'));
        }
    }, []);

    useEffect(() => {
        const fetchCommunity = async () => {
            if (!authToken) return;
            
            try {
                setLoading(true);
                const response = await axios.get(`http://localhost:3001/api/community/${id}`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                setCommunity(response.data);
                
                // Check if already a member
                const alreadyMemberResponse = await axios.get(`http://localhost:3001/api/community/members/${id}`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                
                const isMember = alreadyMemberResponse.data.some((member: any) => member.id == userId);
                
                if (isMember) {
                    setAlreadyMember(true);
                }
                
            } catch (error) {
                console.error('Error fetching community:', error);
                setError('Failed to load community details');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchCommunity();
        } else if (typeof window !== 'undefined') {
            setError('You must be logged in to join a community');
            setLoading(false);
        }
    }, [id, authToken, userId]);

    const handleJoin = async () => {
        if (!authToken || !userId) {
            router.push('/login');
            return;
        }

        try {
            setJoining(true);
            await axios.post(`http://localhost:3001/api/community/join/`, {
                communityId: id,
            },
            { headers: { 'Authorization': `Bearer ${authToken}` } }
            );
            setJoined(true);
            setTimeout(() => {
                router.push(`/communities/details/${id}`);
            }, 1500);
        } catch (error) {
            console.error('Failed to join community:', error);
            setError('Failed to join community. The invitation may be invalid or expired.');
        } finally {
            setJoining(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#0a0914] to-[#0d0d24] pt-20 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#0a0914] to-[#0d0d24] pt-20 px-4">
                <div className="max-w-lg mx-auto bg-[#141430]/90 rounded-xl p-8 text-center border border-indigo-500/30 shadow-xl shadow-indigo-500/10">
                    <div className="bg-red-500/20 p-4 rounded-lg mb-4 border border-red-500/30">
                        <FaTimes className="text-red-400 text-4xl mx-auto mb-2" />
                        <h2 className="text-xl font-bold text-white mb-2">Error</h2>
                        <p className="text-indigo-200">{error}</p>
                    </div>
                    <Link href="/communities" className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors">
                        Browse Communities
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0914] to-[#0d0d24] pt-20 px-4">
            {/* Decorative background elements */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full filter blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full filter blur-[80px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>
            </div>
            
            <div className="max-w-lg mx-auto relative z-10">
                {/* Back Button */}
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        className="flex items-center gap-2 text-indigo-300 hover:text-white hover:bg-indigo-600/20"
                        onClick={() => router.push('/communities')}
                    >
                        <FaArrowLeft className="h-3.5 w-3.5" /> Back to Communities
                    </Button>
                </div>
                
                {/* Join Card */}
                <div className="bg-gradient-to-br from-[#141430] to-[#1e1b4b]/90 rounded-xl overflow-hidden border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
                    <div className="p-6">
                        {/* Community Info */}
                        <div className="flex flex-col items-center text-center mb-6">
                            {/* Community Avatar */}
                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-500/50 shadow-lg shadow-indigo-500/30 mb-4">
                                {community?.CoverImage ? (
                                    <img
                                        src={community.CoverImage}
                                        alt={community?.Name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = 'https://via.placeholder.com/150?text=Community'; 
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
                                        <FaUsers className="text-4xl text-white" />
                                    </div>
                                )}
                            </div>
                            
                            <h1 className="text-2xl font-bold text-white mb-2">{community?.Name}</h1>
                            <p className="text-indigo-200 mb-3">{community?.Description}</p>
                            
                            {community?.memberCount && (
                                <div className="flex items-center text-indigo-300 text-sm">
                                    <FaUsers className="mr-1" />
                                    <span>{community.memberCount} members</span>
                                </div>
                            )}
                        </div>
                        
                        {/* Join Status */}
                        {joined ? (
                            <div className="bg-green-500/20 p-4 rounded-lg text-center mb-6 border border-green-500/30">
                                <FaCheck className="text-green-400 text-4xl mx-auto mb-2" />
                                <h2 className="text-xl font-bold text-white mb-2">Success!</h2>
                                <p className="text-indigo-200">You have joined the community.</p>
                            </div>
                        ) : alreadyMember ? (
                            <div className="bg-blue-500/20 p-4 rounded-lg text-center mb-6 border border-blue-500/30">
                                <FaCheck className="text-blue-400 text-4xl mx-auto mb-2" />
                                <h2 className="text-xl font-bold text-white mb-2">Already a Member</h2>
                                <p className="text-indigo-200">You are already a member of this community.</p>
                            </div>
                        ) : (
                            <div className="bg-indigo-500/10 p-4 rounded-lg text-center mb-6 border border-indigo-500/30">
                                <h2 className="text-xl font-bold text-white mb-2">Join Community</h2>
                                <p className="text-indigo-200">You've been invited to join this community.</p>
                            </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3">
                            {alreadyMember ? (
                                <Button 
                                    onClick={() => router.push(`/communities/${id}`)} 
                                    className="w-full py-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold shadow-md shadow-indigo-500/30"
                                >
                                    Open Community Chat
                                </Button>
                            ) : joined ? (
                                <Button 
                                    onClick={() => router.push(`/communities/details/${id}`)} 
                                    className="w-full py-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold shadow-md shadow-indigo-500/30"
                                >
                                    Go to Community
                                </Button>
                            ) : (
                                <Button 
                                    onClick={handleJoin}
                                    disabled={joining}
                                    className="w-full py-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold shadow-md shadow-indigo-500/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {joining ? (
                                        <>
                                            <FaSpinner className="animate-spin mr-2" />
                                            Joining...
                                        </>
                                    ) : (
                                        'Join Community'
                                    )}
                                </Button>
                            )}
                            
                            <Button 
                                variant="outline"
                                onClick={() => router.push('/communities')}
                                className="w-full py-6 border border-indigo-500/30 text-indigo-300 rounded-lg font-semibold hover:bg-indigo-500/10 transition-colors"
                            >
                                Browse Other Communities
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}