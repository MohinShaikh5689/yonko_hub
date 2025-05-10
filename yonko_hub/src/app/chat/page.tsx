'use client'

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CheckToken } from "@/components/checkToken";
import { AlertCircle, UserX, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface User {
    id: number;
    name: string;
    profile: string;
    lastMessage: string;
}

export default function ChatPage() {
    CheckToken()
    const router = useRouter()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        
        try {
            if (!token) {
                router.push('/Auth/login');
                return;
            }
            
            const response = await axios.get("http://localhost:3001/api/chat/chatted-users", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            localStorage.setItem('messageUsers', JSON.stringify(response.data));
            localStorage.setItem('messageUsersTimestamp', Date.now().toString());
            
            setUsers(response.data);
            setLoading(false);
        } catch (error: any) {
            // Handle different types of errors
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
            
            setLoading(false);
        }
    }


    useEffect(() => {
        const loadUsers = async () => {
            try {
                // Try to load from cache first for immediate display
                const storedUsers = localStorage.getItem('messageUsers');
                if (storedUsers) {
                    const parsedUsers = JSON.parse(storedUsers);
                    setUsers(parsedUsers);
                    setLoading(false);
                    
                    // Check when the cache was last updated
                    const cacheTimestamp = localStorage.getItem('messageUsersTimestamp');
                    const now = Date.now();
                    
                    // If cache is older than 5 minutes, refresh in background
                    if (!cacheTimestamp || now - parseInt(cacheTimestamp) > 5 * 60 * 1000) {
                        // Still fetch data in background after rendering cached content
                        fetchUsers();
                    }
                } else {
                    // No cache, fetch from API
                    await fetchUsers();
                }
            } catch (error) {
                console.error("Error loading cached users:", error);
                // Fallback to API if cache parsing fails
                fetchUsers();
            }
        };
        
        loadUsers();
    }, [])

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0914] to-[#0d0d24]">
            <Navbar />
            
            {/* Decorative background elements */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full filter blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full filter blur-[80px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>
                <div className="absolute inset-0  opacity-[0.02]"></div>
            </div>
            
            <main className="container mx-auto px-4 py-20 relative z-10">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-4">
                            Messages
                        </h1>
                        <p className="text-indigo-200 max-w-xl mx-auto">
                            Connect with fellow anime fans and discuss your favorite series
                        </p>
                    </div>
                    
                    {/* Error message */}
                    {error && (
                        <Alert className="mb-6 bg-red-900/20 border-red-500/30 text-red-200">
                            <AlertCircle className="h-4 w-4 text-red-400" />
                            <AlertTitle className="text-red-300">Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    
                    <div className="bg-[#141430]/50 backdrop-blur-sm border border-indigo-500/20 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-indigo-500/20 flex justify-between items-center">
                            <h2 className="text-white font-medium">Recent Conversations</h2>
                            
                            {/* Refresh button */}
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-indigo-300 hover:text-indigo-100 hover:bg-indigo-800/30"
                                onClick={() => fetchUsers()}
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    "Refresh if no recent conversations"
                                )}
                            </Button>
                        </div>
                        
                        {loading ? (
                            <div className="py-16 flex flex-col items-center justify-center">
                                <div className="bg-indigo-900/20 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                                    <Loader2 className="h-8 w-8 text-indigo-400/80 animate-spin" />
                                </div>
                                <p className="text-indigo-300">Loading conversations...</p>
                            </div>
                        ) : users.length > 0 ? (
                            <div className="divide-y divide-indigo-500/20">
                                {users.map((user: User) => (
                                    <Link href={`/chat/${user.id}`} key={user.id}>
                                        <div className="flex items-center gap-4 p-4 hover:bg-indigo-900/30 transition-colors cursor-pointer">
                                            <div className="relative">
                                                <Image
                                                    src={user.profile || "https://i.pinimg.com/736x/9f/c5/cf/9fc5cf14dc2fdefaacf70d52a12415b3.jpg"}
                                                    alt={user.name}
                                                    width={50}
                                                    height={50}
                                                    className="rounded-full object-cover border-2 border-indigo-500/30"
                                                    onError={(e) => {
                                                        // Handle image error by setting a default
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = "https://i.pinimg.com/736x/9f/c5/cf/9fc5cf14dc2fdefaacf70d52a12415b3.jpg";
                                                    }}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center">
                                                    <h3 className="text-white font-medium truncate">{user.name}</h3>
                                                </div>
                                                <p className="text-indigo-300 text-sm line-clamp-1">{user.lastMessage}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="py-16 text-center">
                                <div className="bg-indigo-900/20 mx-auto rounded-full w-16 h-16 flex items-center justify-center mb-4">
                                    <UserX className="h-8 w-8 text-indigo-400/80" />
                                </div>
                                <h3 className="text-white font-medium mb-2">No conversations yet</h3>
                                <p className="text-indigo-300 text-sm max-w-sm mx-auto mb-6">
                                    Start connecting with other anime fans to begin chatting about your favorite series
                                </p>
                                
                                <Link href="/communities">
                                    <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                                        Find Communities
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            
            <Footer />
        </div>
    )
}