'use client'

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, UserCheck, AlertCircle, Check } from "lucide-react";
import Link from "next/link";
import { CheckToken } from "@/components/checkToken";

interface User {
    id: number;
    name: string;
    profile: string;
    createdAt: Date;
    isFriend?: {
        status: string;
    };
}

export default function AddFriends() {
    CheckToken(); // Call the CheckToken function to check for token validity
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResult, setSearchResult] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Get token from localStorage safely with useEffect (to avoid SSR issues)
    const [token, setToken] = useState<string | null>(null);
    useEffect(() => {
        setToken(localStorage.getItem("token"));
    }, [router]);

    const searchFriend = async () => {
        if (!searchQuery.trim()) {
            setError("Please enter a username to search");
            return;
        }
        
        setLoading(true);
        setError(null);
        setSuccess(null);
        setSearchResult(null);

        try {
            const response = await axios.get(`http://localhost:3001/api/users/${searchQuery}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setSearchResult({...response.data.user, isFriend: response.data.isFriend});
            setLoading(false);

        } catch (error: any) {
            console.error("Error fetching user:", error);
            setTimeout(() => {
                setError(error.response?.data?.message || "User not found");
                setLoading(false);
            }, 800);
        }
    };

    const addAsFriend = async () => {
        if (!searchResult) return;
        
        setLoading(true);
        setError(null);
        setSuccess(null);
        
        try {
            // Replace with your actual API endpoint for adding friends
            await axios.post(
                `https://mugiwarahubbackend-production.up.railway.app/api/friend/add/`, 
                {
                    receiverId: searchResult.id,
                }, 
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            
            setSuccess(`Friend request sent to ${searchResult.name}!`);
            // Update the search result to indicate friendship status
            setSearchResult({ ...searchResult, isFriend: { status: 'PENDING' } });
            setLoading(false);
        } catch (error: any) {
            console.error("Error adding friend:", error);
            setError(error.response?.data?.message || "Failed to send friend request");
            setLoading(false);
        }
    };
    

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0914] to-[#0d0d24] text-gray-100">
            <Navbar />
            
            <div className="container mx-auto px-4 py-16 max-w-3xl">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200 mb-4">
                        Find Friends
                    </h1>
                    <p className="text-gray-300 text-sm md:text-base max-w-lg mx-auto">
                        Connect with other anime fans by searching their Id. Add them to your friends list to share recommendations and discuss your favorite shows!
                    </p>
                </div>
                
                {/* Search Box */}
                <div className="bg-[#141438]/60 backdrop-blur-sm rounded-xl border border-indigo-500/30 p-5 md:p-8 mb-8 shadow-lg shadow-indigo-500/10">
                    <div className="flex flex-col md:flex-row gap-3">
                        <Input
                            placeholder="Enter Id to search"
                            className="bg-[#1a1a45]/50 border-indigo-500/30 focus-visible:ring-indigo-500/50 text-gray-100 placeholder:text-gray-400 h-12"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && searchFriend()}
                        />
                        <Button 
                            onClick={searchFriend} 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white h-12 px-8 transition-all duration-300 flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Search size={18} />
                                    Search
                                </>
                            )}
                        </Button>
                    </div>
                    
                    {error && (
                        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-sm text-red-200">
                            <AlertCircle size={18} className="text-red-300" />
                            {error}
                        </div>
                    )}
                    
                    {success && (
                        <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-2 text-sm text-green-200">
                            <UserCheck size={18} className="text-green-300" />
                            {success}
                        </div>
                    )}
                </div>
                
                {/* Results Section */}
                <div className="min-h-[200px]">
                    {loading && (
                        <div className="bg-[#141438]/60 backdrop-blur-sm rounded-xl border border-indigo-500/30 p-5 overflow-hidden">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-16 w-16 rounded-full" />
                                <div className="flex-1">
                                    <Skeleton className="h-6 w-32 mb-2" />
                                    <Skeleton className="h-4 w-48" />
                                </div>
                                <Skeleton className="h-10 w-28" />
                            </div>
                        </div>
                    )}
                    
                    {!loading && searchResult && (
                        <div className="bg-[#141438]/60 backdrop-blur-sm rounded-xl border border-indigo-500/30 p-5 transition-all duration-300 hover:border-indigo-500/60 hover:shadow-lg hover:shadow-indigo-500/20">
                            <Link href={`/visit/${searchResult.id}`} className="flex items-center gap-4 flex-wrap md:flex-nowrap">
                            <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
                                <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-indigo-500/50 shadow-lg shadow-indigo-500/20">
                                    <Image
                                        src={searchResult.profile}
                                        alt={searchResult.name}
                                        fill
                                        className="object-cover"
                                        sizes="64px"
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-lg font-semibold text-indigo-100">{searchResult.name}</h3>
                                        <Badge className="bg-indigo-600/40 text-indigo-100 border border-indigo-500/50 text-xs">
                                            ID: {searchResult.id}
                                        </Badge>
                                    </div>
                                    <p className="text-gray-400 text-sm">
                                        Joined {new Date(searchResult.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <Button
                                    onClick={addAsFriend}
                                    className={`px-4 ${
                                        searchResult.isFriend 
                                            ? "bg-green-600/20 text-green-300 hover:bg-green-600/30 border border-green-500/50" 
                                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                    }`}
                                    disabled={!!searchResult.isFriend}
                                >
                                    {searchResult.isFriend?.status === 'PENDING' ? (
                                        <span className="flex items-center gap-2">
                                            <UserCheck size={16} />
                                            Request Sent
                                        </span>
                                    ) : searchResult.isFriend?.status === 'ACCEPTED' ? (
                                        <span className="flex items-center gap-2">
                                            <UserCheck size={16} />
                                            Friends
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <UserPlus size={16} />
                                            Add Friend
                                        </span>
                                    )}
                                </Button>
                            </div>
                            </Link>
                        </div>
                    )}
                    
                    {!loading && !searchResult && !error && (
                        <div className="bg-[#141438]/30 backdrop-blur-sm rounded-xl border border-indigo-500/20 p-8 text-center">
                            <div className="mx-auto w-16 h-16 rounded-full bg-indigo-600/20 flex items-center justify-center mb-4">
                                <Search size={24} className="text-indigo-300 opacity-70" />
                            </div>
                            <h3 className="text-lg font-medium text-indigo-200 mb-2">Search for friends</h3>
                            <p className="text-gray-400 text-sm max-w-md mx-auto">
                                Enter a username in the search box above to find and connect with other anime fans.
                            </p>
                        </div>
                    )}
                </div>
            </div>
            
            <Footer />
        </div>
    );
}