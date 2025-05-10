'use client'

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Send, ArrowLeft, MoreHorizontal, Image as ImageIcon, Smile } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckToken } from "@/components/checkToken";


interface Message {
    id?: number;
    senderId: number;
    receiverId: number;
    content: string;
    createdAt: string;
}
interface User {
    id: number;
    name: string;
    profile: string;
}

const ChatComponent = () => {
    CheckToken(); // Check if token is valid before rendering the component
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(true);
    const [user, setUser] = useState<User>();
    const [windowWidth, setWindowWidth] = useState(0);
    const userId = Number(localStorage.getItem('userId'));
    const token = localStorage.getItem('token');
    const socketRef = useRef<Socket | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);

    // Detect window size for responsive layout
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };
        
        // Set initial size
        setWindowWidth(window.innerWidth);
        
        // Add event listener
        window.addEventListener('resize', handleResize);
        
        // Clean up
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const fetchMessages = async () => {
        try {
            const response = await axios.post('http://localhost:3001/api/chat/', {
                receiverId: id
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMessages(response.data);
            
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    if (error.response.status === 401) {
                        setError("Your session has expired. Please log in again.");
                        // Clear token and redirect to login after a delay
                        setTimeout(() => {
                            localStorage.removeItem('token');
                            router.push('/Auth/login');
                        }, 3000);
                    } else if (error.response.status === 403) {
                        setError("You don't have permission to access this resource.");
                    } else if (error.response.status === 500) {
                        setError("Server error. Please try again later.");
                    } else {
                        setError(`Error: ${error.response.data.message || "Something went wrong"}`);
                    }
                } else if (error.request) {
                    // The request was made but no response was received
                    setError("Network error. Please check your connection and try again.");
                } else {
                    // Something happened in setting up the request
                    setError("An unexpected error occurred. Please try again.");
                }
            } else {
                setError("An unexpected error occurred. Please try again.");
            }
            
        } finally {
            setIsLoadingMessages(false);
        }
    };

    const fetchUser = async () => {
        try {
            const response = await axios.get(`http://localhost:3001/api/users/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setUser(response.data.user);
           
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    if (error.response.status === 401) {
                        setError("Your session has expired. Please log in again.");
                        // Clear token and redirect to login after a delay
                        setTimeout(() => {
                            localStorage.removeItem('token');
                            router.push('/Auth/login');
                        }, 3000);
                    } else if (error.response.status === 403) {
                        setError("You don't have permission to access this resource.");
                    } else if (error.response.status === 500) {
                        setError("Server error. Please try again later.");
                    } else {
                        setError(`Error: ${error.response.data.message || "Something went wrong"}`);
                    }
                } else if (error.request) {
                    // The request was made but no response was received
                    setError("Network error. Please check your connection and try again.");
                } else {
                    // Something happened in setting up the request
                    setError("An unexpected error occurred. Please try again.");
                }
            } else {
                setError("An unexpected error occurred. Please try again.");
            }
            
        }
    };

    useEffect(() => {
        fetchMessages();
        fetchUser();
        
        // Initialize socket connection
        socketRef.current = io('http://localhost:3001/', {
            withCredentials: true
        });

        // Join private room
        socketRef.current.emit('join', userId);

        // Listen for new messages
        socketRef.current.on('new_message', (message: Message) => {
            if ((message.senderId === userId && message.receiverId === Number(id)) ||
                (message.senderId === Number(id) && message.receiverId === userId)) {
                setMessages(prev => [...prev, message]);
                scrollToBottom();
            }
        });

        socketRef.current.emit('online', {
            userId: userId,
            receiverId: Number(id)
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, [userId, id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        setTimeout(() => {
            if (scrollAreaRef.current) {
                const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
                if (scrollContainer) {
                    scrollContainer.scrollTop = scrollContainer.scrollHeight;
                }
            }
        }, 100);
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setIsLoading(true);
        try {
            // Save message to database
            const response = await axios.post('http://localhost:3001/api/chat/send', {
                receiverId: Number(id),
                content: newMessage
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Emit message through socket
            socketRef.current?.emit('private_message', {
                senderId: userId,
                receiverId: Number(id),
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

    // Format time from ISO string to readable format
    const formatTime = (timeString: string) => {
        const date = new Date(timeString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Group messages by date
    const groupMessagesByDate = () => {
        const groups: { date: string, messages: Message[] }[] = [];
        
        messages.forEach((message:Message) => {
            const date = new Date(message.createdAt);
            const dateStr = date.toLocaleDateString();
            
            const existingGroup = groups.find((group:any) => group.date === dateStr);
            if (existingGroup) {
                existingGroup.messages.push(message);
            } else {
                groups.push({ date: dateStr, messages: [message] });
            }
        });
        
        return groups;
    };

    // Determine if mobile view
    const isMobile = windowWidth < 640;

    return (
        <div className="h-screen flex flex-col bg-gradient-to-b from-[#0a0914] to-[#0d0d24] text-gray-100 overflow-hidden">
            {/* Chat Header - Fixed at top */}
            <div className="w-full bg-[#141438]/90 backdrop-blur-md border-b border-indigo-500/20 shadow-md shadow-indigo-500/10 z-10 flex-shrink-0">
                <div className="max-w-3xl mx-auto px-3 md:px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                        <button 
                            className="h-8 w-8 flex items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft size={16} />
                        </button>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-indigo-500/30">
                            <img
                                src={user?.profile}
                                alt={user?.name || 'User'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'https://www.gravatar.com/avatar/default?d=mp';
                                }}
                            />
                        </div>
                        <div>
                            <h2 className="text-white font-medium text-sm md:text-lg">
                                {user?.name}
                            </h2>
                        </div>
                    </div>
                    
                    <div>
                        <button className="h-8 w-8 md:h-9 md:w-9 flex items-center justify-center rounded-full bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20">
                            <MoreHorizontal size={isMobile ? 16 : 18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Chat Messages Area - Scrollable, takes remaining height */}
            <div className="flex-grow flex flex-col relative h-0">
                <ScrollArea 
                    className="h-full w-full" 
                    ref={scrollAreaRef}
                >
                    <div className="px-3 md:px-6 py-4 space-y-6 max-w-3xl mx-auto">
                        {isLoadingMessages ? (
                            <div className="flex justify-center items-center h-40">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
                            </div>
                        ) : messages.length > 0 ? (
                            groupMessagesByDate().map((group:any, groupIndex:number) => (
                                <div key={groupIndex} className="space-y-4">
                                    {/* Date separator */}
                                    <div className="flex items-center justify-center">
                                        <div className="bg-indigo-500/20 text-xs text-indigo-300 px-3 py-1 rounded-full">
                                            {new Date(group.date).toLocaleDateString(undefined, { 
                                                weekday: isMobile ? 'short' : 'long',
                                                year: 'numeric', 
                                                month: isMobile ? 'numeric' : 'short', 
                                                day: 'numeric' 
                                            })}
                                        </div>
                                    </div>
                                    
                                    {group.messages.map((message:any, index:number) => {
                                        const isSender = message.senderId === userId;
                                        const showAvatar = index === 0 || 
                                            group.messages[index - 1].senderId !== message.senderId;
                                        
                                        return (
                                            <div
                                                key={message.id || index}
                                                className={`flex ${isSender ? 'justify-end' : 'justify-start'} items-end gap-1 md:gap-2`}
                                            >
                                                {/* Avatar for receiver messages */}
                                                {!isSender && showAvatar && (
                                                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full overflow-hidden flex-shrink-0 border border-indigo-500/20">
                                                        <img
                                                            src={user?.profile || "https://www.gravatar.com/avatar/default?d=mp"}
                                                            alt={user?.name || 'User'}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.src = 'https://www.gravatar.com/avatar/default?d=mp';
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                                
                                                {/* Message placeholder when not showing avatar */}
                                                {!isSender && !showAvatar && <div className="w-6 md:w-8 flex-shrink-0"></div>}
                                                
                                                <div 
                                                    className={`${isMobile ? 'max-w-[80%]' : 'max-w-[70%]'} rounded-2xl p-2 md:p-3 shadow-sm ${
                                                        isSender
                                                            ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-none'
                                                            : 'bg-[#141438]/90 text-gray-100 border border-indigo-500/20 rounded-bl-none'
                                                    }`}
                                                >
                                                    <p className="break-words text-sm md:text-base">{message.content}</p>
                                                    <div className={`flex items-center justify-end mt-1 text-xs ${isSender ? 'text-indigo-200/80' : 'text-indigo-300/70'}`}>
                                                        {formatTime(message.createdAt)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-center">
                                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6 md:h-8 md:w-8 text-indigo-300">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <h3 className="font-medium text-white mb-1">No messages yet</h3>
                                <p className="text-sm text-indigo-300/80">Send a message to start the conversation!</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Message Input - Fixed at bottom */}
            <div className="border-t border-indigo-500/20 bg-[#141438]/90 backdrop-blur-md p-2 md:p-4 flex-shrink-0">
                <form onSubmit={sendMessage} className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Message attachment buttons - show on larger screens */}
                        {!isMobile && (
                            <>
                                <button
                                    type="button"
                                    className="p-2 rounded-full text-indigo-300 hover:bg-indigo-500/20"
                                >
                                    <ImageIcon size={20} />
                                </button>
                                <button
                                    type="button"
                                    className="p-2 rounded-full text-indigo-300 hover:bg-indigo-500/20"
                                >
                                    <Smile size={20} />
                                </button>
                            </>
                        )}
                        
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="w-full bg-[#0a0914] text-white px-3 md:px-4 py-2 md:py-3 rounded-full 
                                      border border-indigo-500/30 focus:border-indigo-500/70
                                      focus:outline-none focus:ring-1 focus:ring-indigo-500/30 text-sm md:text-base"
                                autoComplete="off"
                            />
                        </div>
                        
                        {/* Mobile attachment button */}
                        {isMobile && (
                            <button
                                type="button"
                                className="p-2 rounded-full text-indigo-300 hover:bg-indigo-500/20"
                            >
                                <ImageIcon size={18} />
                            </button>
                        )}
                        
                        <button
                            type="submit"
                            disabled={isLoading || !newMessage.trim()}
                            className={`p-2 md:p-3 rounded-full ${
                                isLoading || !newMessage.trim()
                                    ? 'bg-indigo-500/30 text-indigo-300/50'
                                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30 hover:shadow-indigo-500/50'
                            } transition-all duration-300`}
                        >
                            {isLoading ? (
                                <div className="h-4 w-4 md:h-5 md:w-5 border-2 border-indigo-200 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Send size={isMobile ? 16 : 18} />
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatComponent;