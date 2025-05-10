'use client';
import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { UserPlus, Clock, UserX, MoreHorizontal, Users, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckToken } from "@/components/checkToken";

interface Friend {
    id: number;
    name: string;
    profile: string;
    friendshipCreatedAt: string;
}

interface PendingRequest {
    id: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    senderId: number;
    sender:{
        name: string;   
        profile: string;
    }
}

export default function FriendsPage() {
    CheckToken(); // Check if the token is valid and redirect if not
    const router = useRouter();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
    const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        const storedFriends = localStorage.getItem("friends");
        setToken(storedToken);

         if (!storedToken) {
          return;
        }

        if (storedFriends) {
            setFriends(JSON.parse(storedFriends));
            setLoading(false);
        }else{
            fetchFriends(storedToken);
        }

       

        fetchPendingRequests(storedToken);
    }, [router]);

    const fetchFriends = async (storedToken: string) => {
        try {
            const response = await axios.get('http://localhost:3001/api/friend/list', {
                headers: {
                    'Authorization': `Bearer ${storedToken}`
                }
            });

            localStorage.setItem("friends", JSON.stringify(response.data));
            setFriends(response.data);
            setLoading(false);
        } catch (error: any) {
            console.error("Error fetching friends:", error.message);
            setLoading(false);
        }
    }

    const fetchPendingRequests = async (storedToken: string) => {
        try {
            const response = await axios.get('http://localhost:3001/api/friend/requests', {
                headers: {
                    'Authorization': `Bearer ${storedToken}`
                }
            });
            setPendingRequests(response.data);
        } catch (error: any) {
            console.error("Error fetching pending requests:", error.message);
        }
    }

    const handleAcceptRequest = async (requestId: number) => {
        try {
            await axios.post('http://localhost:3001/api/friend/request', {
                friendId: requestId,
                status: 'ACCEPTED'
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            
            if (token) {
                fetchFriends(token);
                fetchPendingRequests(token);
            }
        } catch (error: any) {
            console.error("Error accepting request:", error.message);
        }
    }

    const handleDeclineRequest = async (requestId: number) => {
        try {
            await axios.post('http://localhost:3001/api/friend/request', {
                friendId: requestId,
                status: 'REJECTED'
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            // Remove request from state
            setPendingRequests(pendingRequests.filter(request => request.id !== requestId));
        } catch (error: any) {
            console.error("Error declining request:", error.message);
        }
    }

    const FriendsSkeleton = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-[#141438]/70 backdrop-blur-sm p-4 rounded-xl border border-indigo-500/20 flex items-center gap-4">
                    <Skeleton className="h-14 w-14 rounded-full" />
                    <div className="flex-1">
                        <Skeleton className="h-5 w-36 mb-2" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-9 w-9 rounded-md" />
                </div>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0914] to-[#0d0d24] text-gray-100">
            <Navbar />
            
            <div className="container mx-auto px-4 py-16 max-w-5xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200 mb-2">
                            Your Friends
                        </h1>
                        <p className="text-indigo-300/80 text-sm md:text-base">
                            Connect with anime enthusiasts and share your favorite shows
                        </p>
                    </div>
                    
                    <Link href="/friends/add">
                        <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 border border-indigo-500/50 px-6">
                            <UserPlus size={18} className="mr-2" />
                            Add Friends
                        </Button>
                    </Link>
                </div>
                
                {/* Tabs */}
                <div className="flex border-b border-indigo-500/30 mb-6">
                    <button
                        onClick={() => setActiveTab('friends')}
                        className={`py-2 px-4 flex items-center ${activeTab === 'friends' 
                            ? 'text-indigo-300 border-b-2 border-indigo-500' 
                            : 'text-gray-400 hover:text-indigo-200'}`}
                    >
                        <Users size={18} className="mr-2" />
                        Friends
                        {friends.length > 0 && (
                            <span className="ml-2 bg-indigo-600/50 text-xs px-2 py-0.5 rounded-full">
                                {friends.length}
                            </span>
                        )}
                    </button>
                    
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`py-2 px-4 flex items-center ${activeTab === 'requests' 
                            ? 'text-indigo-300 border-b-2 border-indigo-500' 
                            : 'text-gray-400 hover:text-indigo-200'}`}
                    >
                        <Clock size={18} className="mr-2" />
                        Requests
                        {pendingRequests.length > 0 && (
                            <span className="ml-2 bg-amber-500/50 text-xs px-2 py-0.5 rounded-full">
                                {pendingRequests.length}
                            </span>
                        )}
                    </button>
                </div>
                
                {/* Content */}
                {activeTab === 'friends' && (
                    <>
                        {loading ? (
                            <FriendsSkeleton />
                        ) : friends.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {friends.map((friend) => (
                                    <div key={friend.id} className="bg-[#141438]/70 backdrop-blur-sm p-4 rounded-xl border border-indigo-500/20 flex items-center gap-4 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/10 transition duration-300">
                                        <div className="relative h-14 w-14 rounded-full overflow-hidden border-2 border-indigo-500/40">
                                            <Image 
                                                src={friend.profile || "/images/default-avatar.jpg"}
                                                alt={friend.name}
                                                fill
                                                className="object-cover"
                                                sizes="56px"
                                            />
                                        </div>
                                        
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-white">{friend.name}</h3>
                                            <p className="text-xs text-indigo-300/70">
                                                Friends since {new Date(friend.friendshipCreatedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-indigo-300/70 hover:text-indigo-100 hover:bg-indigo-500/20">
                                                    <MoreHorizontal size={18} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-[#141438]/90 backdrop-blur-md border-indigo-500/30 text-indigo-100">
                                                <Link href={`/visit/${friend.id}`}>
                                                    <DropdownMenuItem className="cursor-pointer hover:bg-indigo-500/20">
                                                        Visit Profile
                                                    </DropdownMenuItem>
                                                </Link>
                                                <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-red-500/20 cursor-pointer">
                                                    Remove Friend (Comming Soon)
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-[#141438]/40 backdrop-blur-sm rounded-xl border border-indigo-500/20 p-10 text-center">
                                <div className="mx-auto w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
                                    <Users size={30} className="text-indigo-300/70" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">No friends yet</h3>
                                <p className="text-indigo-300/70 max-w-md mx-auto mb-6">
                                    Start connecting with other anime fans to share your recommendations and discuss your favorite shows.
                                </p>
                                <Link href="/friends/add">
                                    <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-500/20">
                                        <UserPlus size={16} className="mr-2" />
                                        Add Your First Friend
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </>
                )}
                
                {activeTab === 'requests' && (
                    <>
                        {pendingRequests.length > 0 ? (
                            <div className="flex flex-col gap-4">
                                {pendingRequests.map((request) => (
                                    <div key={request.id} className="bg-[#141438]/70 backdrop-blur-sm p-4 rounded-xl border border-amber-500/30 flex items-center gap-4">
                                        <div className="relative h-14 w-14 rounded-full overflow-hidden border-2 border-amber-500/40">
                                            <Image 
                                                src={request.sender.profile}
                                                alt={request.sender.name}
                                                fill
                                                className="object-cover"
                                                sizes="56px"
                                            />
                                        </div>
                                        
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-white">{request.sender.name}</h3>
                                            <p className="text-xs text-amber-300/70">
                                                Requested {new Date(request.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <Button 
                                                size="sm" 
                                                className="bg-green-600/80 hover:bg-green-600 text-white border border-green-500/50"
                                                onClick={() => handleAcceptRequest(request.senderId)}
                                            >
                                                <UserCheck size={16} className="mr-1" />
                                                Accept
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                className="border-red-500/30 text-red-300 hover:bg-red-500/20 hover:text-red-200"
                                                onClick={() => handleDeclineRequest(request.senderId)}
                                            >
                                                <UserX size={16} className="mr-1" />
                                                Decline
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-[#141438]/40 backdrop-blur-sm rounded-xl border border-indigo-500/20 p-10 text-center">
                                <div className="mx-auto w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
                                    <Clock size={30} className="text-indigo-300/70" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">No pending requests</h3>
                                <p className="text-indigo-300/70 max-w-md mx-auto">
                                    You don't have any friend requests waiting for your response at the moment.
                                </p>
                            </div>
                        )}
                    </>
                )}
                
                {/* Friend suggestions - optional feature */}
                <div className="mt-12 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 p-6 rounded-xl border border-indigo-500/20">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Find More Friends
                    </h2>
                    <p className="text-indigo-300/70 mb-4">
                        Connect with more anime enthusiasts to expand your network and discover new recommendations.
                    </p>
                    <Link href="/friends/add">
                        <Button className="bg-gradient-to-r from-indigo-600/80 to-purple-600/80 hover:from-indigo-600 hover:to-purple-600 text-white">
                            Search for Friends
                        </Button>
                    </Link>
                </div>
            </div>
            
            <Footer />
        </div>
    );
}