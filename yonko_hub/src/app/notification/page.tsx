'use client'

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import axios from "axios";
import { useEffect, useState } from "react";
import { Bell, UserPlus, MessageSquare, Heart, UserCheck, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { CheckToken } from "@/components/checkToken";

interface Notification {
    id: number;
    userId: number;
    content: string;
    createdAt: string;
    read?: boolean;
}

export default function NotificationPage() {
    CheckToken();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);

    
    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        setToken(storedToken);
        
        if (!storedToken) {
            return;
        }
        
        // Call fetchNotifications with the token
        fetchNotifications(storedToken);
    }, [router]);

    const fetchNotifications = async (storedToken: string) => {
        try {
            setLoading(true);
            
            const response = await axios.get('http://localhost:3001/api/notification', {
                headers: {
                    Authorization: `Bearer ${storedToken}`,
                },
            });
            // Add read status if not provided
            const processedNotifications = Array.isArray(response.data) ? 
                response.data.map((notif: any) => ({
                    ...notif,
                    read: notif.read !== undefined ? notif.read : false
                })) : [];
                
            setNotifications(processedNotifications);
            setLoading(false);
        } catch (error: any) {
            console.error("Error fetching notifications:", error);
            console.error("Error details:", error.response?.data || error.message);
            setLoading(false);
        }
    };

    // Function to determine notification icon based on content
    const getNotificationIcon = (content: string) => {
        if (content.includes('friend request')) {
            return <UserPlus className="h-5 w-5 text-indigo-300" />;
        } else if (content.includes('accepted your friend request')) {
            return <UserCheck className="h-5 w-5 text-green-300" />;
        } else if (content.includes('message')) {
            return <MessageSquare className="h-5 w-5 text-blue-300" />;
        } else if (content.includes('liked')) {
            return <Heart className="h-5 w-5 text-pink-300" />;
        } else {
            return <Bell className="h-5 w-5 text-indigo-300" />;
        }
    };

    // Function to determine notification type from content
    const getNotificationType = (content: string) => {
        if (content.includes('sent you a friend request')) {
            return 'Friend Request';
        } else if (content.includes('accepted your friend request')) {
            return 'Friend Accepted';
        } else if (content.includes('message')) {
            return 'Message';
        } else if (content.includes('liked')) {
            return 'Like';
        } else {
            return 'Notification';
        }
    };

    // Function to format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffInDays === 0) {
            // Today - show time only
            return date.toLocaleTimeString(undefined, { 
                hour: '2-digit', 
                minute: '2-digit'
            });
        } else if (diffInDays === 1) {
            // Yesterday
            return 'Yesterday';
        } else if (diffInDays < 7) {
            // Within a week - show day name
            return date.toLocaleDateString(undefined, { weekday: 'long' });
        } else {
            // Older - show full date
            return date.toLocaleDateString(undefined, { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric'
            });
        }
    };


    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0914] to-[#0d0d24] text-gray-100">
            <Navbar />
            
            <div className="container mx-auto px-4 py-16 max-w-3xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600/30 p-3 rounded-lg">
                            <Bell className="h-6 w-6 text-indigo-300" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">
                            Notifications
                        </h1>
                    </div>
                </div>
                
                {/* Notifications List */}
                <div className="space-y-3">
                    {loading ? (
                        <>
                            {[1, 2, 3].map(i => (
                                <div key={i} className="p-4 bg-[#141438]/60 backdrop-blur-sm rounded-lg border border-indigo-500/20 animate-pulse">
                                    <div className="flex space-x-4">
                                        <div className="rounded-full bg-indigo-500/20 h-10 w-10"></div>
                                        <div className="flex-1 space-y-2 py-1">
                                            <div className="h-4 bg-indigo-500/20 rounded w-3/4"></div>
                                            <div className="h-3 bg-indigo-500/20 rounded"></div>
                                            <div className="h-3 bg-indigo-500/20 rounded w-5/6"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : notifications.length > 0 ? (
                        notifications.map((notification) => (
                            <div 
                                key={notification.id} 
                                className={`flex items-start gap-4 p-4 rounded-lg ${
                                    notification.read 
                                        ? 'bg-[#141438]/40 border border-indigo-500/10' 
                                        : 'bg-[#161650]/60 border border-indigo-500/30'
                                }`}
                            >
                                <div className={`rounded-full p-2 ${notification.read ? 'bg-indigo-500/20' : 'bg-indigo-500/30'}`}>
                                    {getNotificationIcon(notification.content)}
                                </div>
                                
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className={`font-medium ${notification.read ? 'text-gray-300' : 'text-white'}`}>
                                            {getNotificationType(notification.content)}
                                        </h3>
                                        <span className="text-xs text-indigo-300/60">
                                            {formatDate(notification.createdAt)}
                                        </span>
                                    </div>
                                    
                                    <p className={`text-sm ${notification.read ? 'text-gray-400' : 'text-gray-200'}`}>
                                        {notification.content}
                                    </p>
                                </div>
                                
                                {!notification.read && (
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0"></div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="bg-[#141438]/40 backdrop-blur-sm rounded-lg border border-indigo-500/20 p-8 text-center">
                            <div className="mx-auto w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
                                <Bell className="h-8 w-8 text-indigo-300/70" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">No notifications</h3>
                            <p className="text-indigo-300/70 max-w-md mx-auto">
                                You're all caught up! You'll receive notifications here when you get activity.
                            </p>
                        </div>
                    )}
                </div>
                
                {/* This section would be good for categorizing notifications in the future */}
                {notifications.length > 5 && (
                    <div className="mt-8 bg-[#141438]/40 backdrop-blur-sm rounded-lg border border-indigo-500/20 p-4">
                        <h3 className="text-sm font-medium text-indigo-300 mb-2 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            Info
                        </h3>
                        <p className="text-xs text-indigo-200/70">
                            These notifications show your recent activity on Yonko Hub. New notifications will appear here as you interact with the community.
                        </p>
                    </div>
                )}
            </div>
            
            <Footer />
        </div>
    );
}