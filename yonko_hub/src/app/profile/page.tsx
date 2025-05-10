'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckToken } from '@/components/checkToken';
import { FaSync } from 'react-icons/fa'; // Import refresh icon

interface User {
    id: number;
    name: string;
    email: string;
    profile: string;
    createdAt: string;
}

interface Watchlist {
    AnimeId: number;
    English_title: string;
    Japanese_title: string;
    synopsis: string;
    Image_url: string;
}

import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";


export default function Profile() {
    CheckToken(); // Call the CheckToken component to check for token validity
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [watchlist, setWatchlist] = useState<Watchlist[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false); // New state for refresh status
    const baseUrl = 'http://localhost:3001';


    const fetchData = async () => {
        const storedToken = localStorage.getItem('token');
        setIsRefreshing(true);

        try {
            // Fetch profile
            const profileResponse = await axios.get(`${baseUrl}/api/users/me`, {
                headers: {
                    'Authorization': `Bearer ${storedToken}`
                }
            });
            localStorage.setItem('user', JSON.stringify(profileResponse.data));
            setUser(profileResponse.data);

            // Fetch watchlist
            const watchlistResponse = await axios.get(`${baseUrl}/api/watchlist`, {
                headers: {
                    'Authorization': `Bearer ${storedToken}`
                }
            });

            const stripHtml = (html: string) => {
                if (!html) return "";
                return html.replace(/<[^>]*>/g, '').replace(/\n/g, ' ').trim();
            };
            
            const watchlistData = watchlistResponse.data.map((item: any) => ({
                AnimeId: item.AnimeId,
                English_title: item.English_Title,
                Japanese_title: item.Japanese_Title,
                synopsis: stripHtml(item.synopsis),
                Image_url: item.Image_url
            }));
            localStorage.setItem('watchlist', JSON.stringify(watchlistData));
            localStorage.getItem('watchlist');
            setWatchlist(watchlistData);
        } catch (error) {
            console.error('Error refreshing data:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleRefresh = () => {
        fetchData();
    };

    useEffect(() => {
        const storedToken = localStorage.getItem('token');

        const getProfile = async () => {
            try {
                const response = await axios.get(`${baseUrl}/api/users/me`, {
                    headers: {
                        'Authorization': `Bearer ${storedToken}` // Use storedToken directly
                    }
                });
                localStorage.setItem('user', JSON.stringify(response.data));
                setUser(response.data);
            } catch (error: any) {
                console.error('Error fetching profile:', error);

            }
        };

        const getWatchlist = async () => {
            try {
                const response = await axios.get(`${baseUrl}/api/watchlist`, {
                    headers: {
                        'Authorization': `Bearer ${storedToken}` // Use storedToken directly
                    }
                });

                const stripHtml = (html: string) => {
                    if (!html) return "";
                    return html.replace(/<[^>]*>/g, '').replace(/\n/g, ' ').trim();
                };
                const watchlistData = response.data.map((item: any) => ({
                    AnimeId: item.AnimeId,
                    English_title: item.English_Title,
                    Japanese_title: item.Japanese_Title,
                    synopsis: stripHtml(item.synopsis),
                    Image_url: item.Image_url
                }));
                localStorage.setItem('watchlist', JSON.stringify(watchlistData));

                setWatchlist(watchlistData);
            } catch (error: any) {
                console.error('Error fetching watchlist:', error);
            }
        };
        const cachedUser = localStorage.getItem('user');
        const cachedWatchlist = localStorage.getItem('watchlist');

        if (!cachedUser || !cachedWatchlist) {
            // If either cache is missing, fetch both
            getProfile();
            getWatchlist();
        } else {
            try {
                // Parse cached data
                const parsedUser = JSON.parse(cachedUser);
                const parsedWatchlist = JSON.parse(cachedWatchlist);
                
                // Validate minimal structure
                if (parsedUser && typeof parsedUser === 'object' && parsedWatchlist && Array.isArray(parsedWatchlist)) {
                
                    setUser(parsedUser);
                    setWatchlist(parsedWatchlist);
                } else {
                   
                    getProfile();
                    getWatchlist();
                }
            } catch (error) {
                console.error('Error parsing cached data:', error);
                getProfile();
                getWatchlist();
            }
        }


    }, [router]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    return (
        <div className="min-h-screen bg-[#0a0914] pb-20">
            <Navbar />

            <div className="mt-3 relative w-full h-60 bg-gradient-to-r from-indigo-900 to-purple-900 overflow-hidden">
                <div className="container mx-auto px-4 relative h-full flex flex-col justify-center pb-10 mt-2">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 animate-fade-in">
                        {getGreeting()}, <span className="bg-gradient-to-r from-indigo-200 to-purple-200 text-transparent bg-clip-text">{user?.name || 'Anime Fan'}</span>!
                    </h1>
                    <p className="text-indigo-200 text-lg md:text-xl max-w-2xl">
                        Welcome to your personalized anime world. Track your favorites and discover new series.
                    </p>
                </div>

                <div className="absolute -bottom-3 left-0 right-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="w-full h-auto">
                        <path fill="#0a0914" fillOpacity="1" d="M0,96L48,85.3C96,75,192,53,288,48C384,43,480,53,576,69.3C672,85,768,107,864,101.3C960,96,1056,64,1152,48C1248,32,1344,32,1392,32L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
                    </svg>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-8 relative z-10">
                {/* Refresh Button */}
                <div className="flex justify-end mb-3">
                    <Button 
                        onClick={handleRefresh} 
                        disabled={isRefreshing}
                        className="bg-indigo-600/30 hover:bg-indigo-600/50 text-white text-sm flex items-center gap-2 border border-indigo-500/30 shadow-indigo-500/20 shadow-sm"
                    >
                        <FaSync className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Refreshing...' : 'Not seeing latest data? Refresh!'}
                    </Button>
                </div>

                {user ? (
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 bg-[#141430]/80 backdrop-blur-md p-6 rounded-xl border border-indigo-500/20 shadow-xl shadow-indigo-500/10">
                        <div className="relative">
                            <div className="h-32 w-32 md:h-48 md:w-48 rounded-full overflow-hidden border-4 border-indigo-500/50 shadow-lg shadow-indigo-500/30">
                                <img
                                    src={user.profile || 'https://via.placeholder.com/200x200?text=User'}
                                    alt={user.name}
                                    className="object-cover w-full h-full"
                                />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-lg shadow-yellow-500/30"></div>
                            <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 shadow-sm shadow-purple-500/30"></div>
                        </div>

                        <div className="flex flex-col items-center md:items-start mt-2">
                            <h1 className="text-2xl md:text-3xl font-bold text-white">{user.name}</h1>
                            <p className="text-gray-400 text-sm mt-1">User ID: {user.id}</p>
                            <p className="text-indigo-300/70 mt-1">{user.email}</p>
                            <p className="text-gray-400 text-sm mt-2">Member since {new Date(user.createdAt).toLocaleDateString()}</p>

                            <div className="flex flex-wrap gap-4 mt-5">
                                <div className="px-4 py-3 bg-indigo-600/20 border border-indigo-500/30 rounded-lg">
                                    <div className="text-xl font-bold text-white">{watchlist.length}</div>
                                    <div className="text-xs text-indigo-300">In Watchlist</div>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <Link href='profile/edit'>
                                    <Button className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 rounded-md text-white text-sm shadow-md shadow-indigo-500/30">
                                        Edit Profile
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center items-center h-32 bg-[#141430]/60 backdrop-blur-sm rounded-xl border border-indigo-500/20">
                        <div className="animate-pulse flex space-x-4">
                            <div className="rounded-full bg-indigo-500/20 h-12 w-12"></div>
                            <div className="flex-1 space-y-4">
                                <div className="h-4 bg-indigo-500/20 rounded w-3/4"></div>
                                <div className="h-4 bg-indigo-500/20 rounded w-1/2"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="container mx-auto px-4 py-12">
                <div className="flex items-center mb-6">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-3 rounded-lg mr-4 shadow-md shadow-indigo-500/20">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                            />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">My Watchlist</h2>
                        <p className="text-indigo-300/70 text-sm">{watchlist.length} anime in your collection</p>
                    </div>
                </div>

                {watchlist.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {watchlist.map((anime: Watchlist) => (
                            <Link href={`/anime/details/${anime.AnimeId}`} key={anime.AnimeId}>
                                <Card className="bg-[#141430]/70 backdrop-blur-sm rounded-xl overflow-hidden hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 group border border-indigo-500/10 hover:border-indigo-500/40 h-full">
                                    <div className="relative aspect-[3/4] overflow-hidden">
                                        <Image
                                            src={anime.Image_url}
                                            alt={anime.English_title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0914] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </div>
                                    <CardHeader className="p-4 relative z-10">
                                        <CardTitle className="text-sm sm:text-base font-bold text-white line-clamp-2 group-hover:text-indigo-300 transition-colors duration-300">
                                            {anime.English_title}
                                        </CardTitle>
                                        <div className="flex justify-between text-xs text-indigo-300/70 mt-1">
                                            <CardDescription className="text-xs line-clamp-1">{anime.Japanese_title}</CardDescription>
                                        </div>
                                        <CardDescription className="text-xs text-gray-400 mt-2 line-clamp-3">
                                            {anime.synopsis.length > 100 ? `${anime.synopsis.slice(0, 100)}...` : anime.synopsis}
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 bg-[#141430]/60 backdrop-blur-sm rounded-xl border border-indigo-500/20 p-8">
                        <div className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 w-16 h-16 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-8 w-8 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">Your watchlist is empty</h3>
                        <p className="text-gray-400 text-sm text-center max-w-md mb-4">Start exploring anime and add them to your watchlist to keep track of what you want to watch.</p>
                        <Link href="/anime">
                            <button className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 rounded-md text-white text-sm shadow-lg shadow-indigo-500/30">
                                Browse Anime
                            </button>
                        </Link>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    )
}