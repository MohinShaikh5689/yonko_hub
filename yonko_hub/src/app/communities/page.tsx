'use client'

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import axios from "axios";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CheckToken } from "@/components/checkToken";
import CreateCommunity from "@/components/createCommunity";
import { FaSync } from "react-icons/fa"; // Import sync icon

interface Community {
    id: number;
    Name: string;
    Description: string;
    createdAt: string;
    CoverImage: string;
    membersCount: number;
}

export default function CommunitiesPage() {
    CheckToken(); // Check token validity on page load
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
    const [showCreateCommunityModal, setShowCreateCommunityModal] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false); // New state for refresh status

    const fetchCommunities = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get('http://localhost:3001/api/community', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            localStorage.setItem('Communities', JSON.stringify(response.data));
            localStorage.setItem('CommunitiesTimestamp', Date.now().toString()); // Save timestamp
            setCommunities(response.data);
            setFilteredCommunities(response.data);
            setLoading(false);
            setIsRefreshing(false); // Reset refreshing state
        } catch (error) {
            console.error("Error fetching communities:", error);
            setLoading(false);
            setIsRefreshing(false); // Reset refreshing state
        }
    };
    
    // Function to handle manual refresh
    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchCommunities();
    };

    useEffect(() => {
         const storedCommunities = localStorage.getItem('Communities');
         const timestamp = localStorage.getItem('CommunitiesTimestamp');
         const now = Date.now();
         const isStale = !timestamp || (now - parseInt(timestamp)) > 5 * 60 * 1000; // Stale after 5 minutes
         
         if (storedCommunities) {
             setCommunities(JSON.parse(storedCommunities));
             setFilteredCommunities(JSON.parse(storedCommunities));
             setLoading(false);
             
             // If data is stale, refresh in background
             if (isStale) {
                 fetchCommunities();
             }
         } else {
             fetchCommunities();
         }
    }, []);

    useEffect(() => {
        if (searchQuery) {
            const filtered = communities.filter(community => 
                community.Name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                community.Description.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredCommunities(filtered);
        } else {
            setFilteredCommunities(communities);
        }
    }, [searchQuery, communities]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0914] to-[#0d0d24] text-gray-100 relative">
            {showCreateCommunityModal && (
                <CreateCommunity 
                    onClose={() => setShowCreateCommunityModal(false)} 
                />
            )}
            
            {/* Background gradient */}

            {/* Decorative background elements */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full filter blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full filter blur-[80px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                    <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-blue-600/10 rounded-full filter blur-[70px] animate-pulse" style={{ animationDelay: '3.5s' }}></div>
                </div>
                <div className="absolute inset-0 opacity-[0.02]"></div>
            </div>
            
            <Navbar />
            
            <main className="container mx-auto px-4 py-12 relative z-10 mt-16 max-w-5xl">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8"
                >
                    <div className="mb-6 md:mb-0">
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent mb-2">
                            Anime Communities
                        </h1>
                        <p className="text-indigo-300 text-lg max-w-2xl">
                            Connect with fellow anime enthusiasts, share your thoughts, and discover new series.
                        </p>
                    </div>
                    
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                        <Button 
                            onClick={() => setShowCreateCommunityModal(true)}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-900/30 px-6"
                        >
                            <svg 
                                className="w-5 h-5 mr-2" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24" 
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth="2" 
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                ></path>
                            </svg>
                            Create Community
                        </Button>
                    </motion.div>
                </motion.div>
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mb-6 backdrop-blur-lg rounded-2xl overflow-hidden border border-indigo-500/20 shadow-xl p-4"
                >
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-grow">
                            <svg
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400"
                                width="16"
                                height="16"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                            <Input
                                type="text"
                                placeholder="Search communities..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 w-full bg-indigo-950/30 border border-indigo-500/30 rounded-xl text-indigo-100 placeholder:text-indigo-300/50 focus:border-indigo-400 focus:ring focus:ring-indigo-500/20"
                            />
                        </div>
                        
                        {/* Refresh Button */}
                        <Button 
                            onClick={handleRefresh} 
                            disabled={isRefreshing || loading}
                            className="bg-indigo-600/30 hover:bg-indigo-600/50 text-white text-sm flex items-center gap-2 border border-indigo-500/30 shadow-indigo-500/20 shadow-sm min-w-[160px] justify-center md:w-auto"
                        >
                            <FaSync className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                            {isRefreshing ? 'Refreshing...' : 'Refresh Communities'}
                        </Button>
                    </div>
                </motion.div>
                
                {/* Refresh Message - shows briefly after refresh */}
                {isRefreshing && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-3 text-sm text-center text-indigo-300"
                    >
                        <span className="inline-block px-3 py-1 bg-indigo-500/20 rounded-full">
                            Looking for recently joined communities...
                        </span>
                    </motion.div>
                )}
                
                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="backdrop-blur-lg rounded-xl overflow-hidden border border-indigo-500/20 shadow-md hover:shadow-lg transition-all duration-300">
                                <div className="p-3 flex items-center space-x-3">
                                    <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                                    <div className="flex-1">
                                        <Skeleton className="h-5 w-3/4 mb-1" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                    <Skeleton className="h-8 w-16 rounded-md" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredCommunities.length > 0 ? (
                    <div className="space-y-3">
                        {filteredCommunities.map((community, index) => (
                            <motion.div
                                key={community.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.05 * index }}
                                className="backdrop-blur-lg rounded-xl overflow-hidden border border-indigo-500/20 shadow-md
                                       hover:border-indigo-500/40 hover:shadow-lg hover:bg-indigo-950/30 transition-all duration-300"
                            >
                                <Link href={`/communities/${community.id}`} className="block">
                                    <div className="p-3 flex items-center space-x-3">
                                        <div 
                                            className="h-12 w-12 rounded-full bg-cover bg-center flex-shrink-0 border border-indigo-500/30"
                                            style={{ 
                                                backgroundImage: community.CoverImage 
                                                    ? `url(${community.CoverImage})` 
                                                    : 'url(/community-default.jpg)' 
                                            }}
                                        ></div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-semibold text-white truncate">{community.Name}</h3>
                                            <p className="text-xs text-indigo-300 truncate">{formatDate(community.createdAt)}</p>
                                        </div>
                                        
                                        <Badge className="bg-indigo-600/40 text-indigo-100 px-2 flex-shrink-0">
                                            {community.membersCount || 0} members
                                        </Badge>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="backdrop-blur-lg rounded-2xl overflow-hidden border border-indigo-500/20 shadow-xl p-8 text-center"
                    >
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/10 mb-4">
                            <svg className="w-6 h-6 text-indigo-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
                            </svg>
                        </div>
                        {searchQuery ? (
                            <>
                                <h3 className="text-lg font-medium text-white mb-2">No communities found</h3>
                                <p className="text-indigo-300/70 max-w-md mx-auto mb-4">
                                    We couldn't find any communities matching "{searchQuery}".
                                </p>
                            </>
                        ) : (
                            <>
                                <h3 className="text-lg font-medium text-white mb-2">No communities yet</h3>
                                <p className="text-indigo-300/70 max-w-md mx-auto mb-4">
                                    Be the first to create a community!
                                </p>
                            </>
                        )}
                        <Button 
                            onClick={() => setShowCreateCommunityModal(true)}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                        >
                            Create Community
                        </Button>
                    </motion.div>
                )}
            </main>
            <Footer />
        </div>
    );
}