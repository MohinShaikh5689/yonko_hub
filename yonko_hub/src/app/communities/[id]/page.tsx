'use client'

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { FaPaperPlane, FaArrowLeft, FaUsers } from "react-icons/fa";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckToken } from "@/components/checkToken";

interface Message {
    id?: number;
    communityId: number;
    content: string;
    createdAt: string;
    userId: number;
    user: {
        name: string;
        profile: string;
    }
}

interface Community {
    id: number;
    Name: string;
    description: string;
    CoverImage?: string;
}

interface Member {
    id: number;
    username: string;
    profile?: string;
}

export default function CommunityChat() {
    CheckToken(); // Check if the user is logged in and token is valid
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(true);
    const [community, setCommunity] = useState<Community | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const userId = typeof window !== 'undefined' ? Number(localStorage.getItem('userId')) : 0;
    const username = typeof window !== 'undefined' ? localStorage.getItem('username') : null;
    const userProfile = typeof window !== 'undefined' ? localStorage.getItem('userProfile') : null;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const socketRef = useRef<Socket | null>(null);
    const lastMessageRef = useRef<HTMLDivElement>(null);

    const fetchMessages = async () => {
        if (!token) return;
        
        try {
            const response = await axios.get(`http://localhost:3001/api/community/chat/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMessages(response.data);
        } catch (error:any) {
            if(error.response.data.message === 'You are not a member of this community'){
                router.push('/communities');
            }
        } finally {
            setIsLoadingMessages(false);
        }
    };

    const fetchCommunity = async () => {
        if (!token) return;
        
        try {
            const response = await axios.get(`http://localhost:3001/api/community/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data === null) {
                router.push('/communities');
                return;
            }
            setCommunity(response.data);
        } catch (error:any) {
            console.error('Error fetching community:', error);
        }

    };

    const fetchMembers = async () => {
        if (!token) return;
        
        try {
            const response = await axios.get(`http://localhost:3001/api/community/members/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMembers(response.data);
        }
        catch (error:any) {
            console.error('Error fetching community members:', error);
        }
    }

    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        fetchMessages();
        fetchMembers();
        fetchCommunity();
        
        // Initialize socket connection
        socketRef.current = io('http://localhost:3001/', {
            withCredentials: true
        });

        // Join community room
        socketRef.current.emit('joinCommunity', id);

        // Listen for new messages
        socketRef.current.on('community_message', (message: Message) => {
            if (message.communityId === Number(id)) {
                setMessages(prev => [...prev, message]);
                scrollToBottom();
            }
        });

        return () => {
            socketRef.current?.emit('leaveCommunity', id);
            socketRef.current?.disconnect();
        };
    }, [id]);
    

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        setTimeout(() => {
            if (lastMessageRef.current) {
                lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !token) return;

        setIsLoading(true);
        try {
            // Save message to database
            const response = await axios.post(`http://localhost:3001/api/community/chat`, {
                message: newMessage,
                communityId: Number(id)
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Emit message through socket
            socketRef.current?.emit('community_message', {
                communityId: Number(id),
                userId: userId,
                username: username,
                userProfile: userProfile,
                content: newMessage,
                id: response.data.id,
                createdAt: response.data.createdAt
            });
            
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative">
            
            {/* Community Chat Header */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="fixed left-0 top-0 right-0 z-40 backdrop-blur-lg bg-indigo-900/30 border-b border-indigo-500/20"
            >
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/communities">
                            <Button variant="ghost" size="icon" className="text-indigo-200 hover:text-white hover:bg-indigo-800/40">
                                <FaArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div 
                            className="flex items-center gap-3 cursor-pointer hover:bg-indigo-800/20 p-2 rounded-lg transition-colors"
                            onClick={() => router.push(`/communities/details/${id}`)}
                        >
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-600/40 to-purple-600/40 
                                         border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-900/20">
                                {community?.CoverImage ? (
                                    <img
                                        src={community.CoverImage}
                                        alt={community?.Name || 'Community'}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/community-default.jpg';
                                        }}
                                    />
                                ) : (
                                    <FaUsers className="text-indigo-200" />
                                )}
                            </div>
                            <div>
                                <h2 className="text-white font-medium text-lg">{community?.Name}</h2>
                                <p className="text-indigo-300 text-xs">{members.length} members</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
            
            {/* Chat Messages Area with imported ScrollArea */}
            <div className="pt-16 pb-24 flex flex-col h-screen relative z-10">
                <ScrollArea className="flex-1 h-[calc(100vh-8rem)] mt-4">
                    <div className="px-4 py-2 max-w-5xl mx-auto">
                        {isLoadingMessages ? (
                            <div className="flex justify-center items-center py-20">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent border-indigo-500" />
                            </div>
                        ) : messages.length > 0 ? (
                            <>
                                {messages.map((message, index) => (
                                    <motion.div
                                        key={`${message.id}-${index}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className={`flex ${message.userId === userId 
                                            ? 'justify-end' : 'justify-start'} mb-3`}
                                        ref={index === messages.length - 1 ? lastMessageRef : null}
                                    >
                                        <div className={`max-w-[80%] rounded-2xl shadow-lg ${
                                            message.userId === userId
                                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none'
                                                : 'bg-indigo-900/40 backdrop-blur-md border border-indigo-500/20 text-gray-100 rounded-bl-none'
                                        }`}>
                                            {message.userId !== userId && (
                                                <div className="flex items-center gap-2 px-3 pt-2">
                                                    <div 
                                                        className="w-6 h-6 rounded-full overflow-hidden border border-indigo-500/30 cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.push(`/visit/${message.userId}`);
                                                        }}
                                                    >
                                                        {members.find(member => member.id === message.userId)?.profile ? (
                                                            <img
                                                                src={members.find(member => member.id === message.userId)?.profile}
                                                                alt={members.find(member => member.id === message.userId)?.username}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.src = 'https://www.gravatar.com/avatar/default?d=mp';
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-indigo-500/60 to-purple-500/60 flex items-center justify-center">
                                                                <span className="text-xs text-white">
                                                                    {(members.find(member => member.id === message.userId)?.username || 'U').charAt(0).toUpperCase()}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-xs font-medium text-indigo-200">
                                                        {members.find(member => member.id === message.userId)?.username || 'Unknown User'}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="p-3 pt-1">
                                                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                                <p className={`text-xs mt-1 text-right ${
                                                    message.userId === userId ? 'text-indigo-100/70' : 'text-indigo-300/70'
                                                }`}>
                                                    {new Date(message.createdAt).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5 }}
                                className="text-center text-indigo-300 py-16"
                            >
                                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full 
                                             flex items-center justify-center mb-4 border border-indigo-500/40">
                                    <FaUsers className="text-2xl text-indigo-400" />
                                </div>
                                <p className="max-w-xs mx-auto">Be the first to send a message in this community!</p>
                            </motion.div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Message Input */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="fixed bottom-0 left-0 right-0 backdrop-blur-lg bg-indigo-900/40 border-t border-indigo-500/20 z-40"
            >
                <form onSubmit={sendMessage} className="max-w-5xl mx-auto p-4">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-indigo-950/50 text-white px-4 py-2 rounded-xl 
                                     focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border border-indigo-500/30
                                     placeholder:text-indigo-300/50"
                        />
                        <Button
                            type="submit"
                            disabled={isLoading || !newMessage.trim()}
                            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700
                                     text-white rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-indigo-900/30"
                        >
                            <FaPaperPlane className="text-sm mr-2" />
                            <span className="hidden sm:inline">{isLoading ? 'Sending...' : 'Send'}</span>
                        </Button>
                        </div>
                    </form>
                </motion.div>
            </div>
        
    );
}