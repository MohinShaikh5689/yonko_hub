'use client'

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useParams } from "next/navigation";
import axios from "axios";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserX } from "lucide-react";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface User {
    id: number;
    name: string;
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

export default function VisitPage() {
    const params = useParams();
    const id = params.Id as string;
    const [user, setUser] = useState<User | null>(null);
    const [watchlist, setWatchlist] = useState<Watchlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        setToken(storedToken);

        if (!storedToken) {
            window.location.href = "/login";
            return;
        }
        
        fetchUser(storedToken);
        fetchWatchlist(storedToken);
    }, [id]);

    const fetchUser = async (storedToken: string) => {
        try {
            const response = await axios.get(`http://localhost:3001/api/users/${id}`, {
                headers: {
                    Authorization: `Bearer ${storedToken}`,
                },
            });

            const data = {
                id: response.data.user.id,
                name: response.data.user.name,
                profile: response.data.user.profile,
                createdAt: response.data.user.createdAt,
            };
            setUser(data);
            setLoading(false);
        } catch (error: any) {
            console.error("Error fetching user data:", error);
            setLoading(false);
        }
    };

    const fetchWatchlist = async (storedToken: string) => {
        try {
            const response = await axios.get(`http://localhost:3001/api/watchlist/${id}`, {
                headers: {
                    Authorization: `Bearer ${storedToken}`,
                },
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
            
            setWatchlist(watchlistData);
        } catch (error: any) {
            console.error("Error fetching watchlist data:", error);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0914] pb-20">
            <Navbar />

            {/* Hero Banner */}
            <div className="relative w-full h-60 bg-gradient-to-r from-indigo-900 to-purple-900 overflow-hidden">
                <div className="container mx-auto px-4 relative h-full flex flex-col justify-center pb-10 mt-2">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 animate-fade-in">
                        Visiting <span className="bg-gradient-to-r from-indigo-200 to-purple-200 text-transparent bg-clip-text">
                            {loading ? "User's Profile" : user?.name}
                        </span>
                    </h1>
                    <p className="text-indigo-200 text-lg md:text-xl max-w-2xl">
                        Check out their anime collection and connect with them!
                    </p>
                </div>

                {/* Wave divider */}
                <div className="absolute -bottom-3 left-0 right-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="w-full h-auto">
                        <path fill="#0a0914" fillOpacity="1" d="M0,96L48,85.3C96,75,192,53,288,48C384,43,480,53,576,69.3C672,85,768,107,864,101.3C960,96,1056,64,1152,48C1248,32,1344,32,1392,32L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
                    </svg>
                </div>
            </div>

            {/* User Profile Section */}
            <div className="container mx-auto px-4 -mt-8 relative z-10">
                {loading ? (
                    <div className="flex justify-center items-center h-32 bg-[#141430]/60 backdrop-blur-sm rounded-xl border border-indigo-500/20">
                        <div className="animate-pulse flex space-x-4">
                            <div className="rounded-full bg-indigo-500/20 h-12 w-12"></div>
                            <div className="flex-1 space-y-4">
                                <div className="h-4 bg-indigo-500/20 rounded w-3/4"></div>
                                <div className="h-4 bg-indigo-500/20 rounded w-1/2"></div>
                            </div>
                        </div>
                    </div>
                ) : user ? (
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 bg-[#141430]/80 backdrop-blur-md p-6 rounded-xl border border-indigo-500/20 shadow-xl shadow-indigo-500/10">
                        <div className="relative">
                            <div className="h-32 w-32 md:h-48 md:w-48 rounded-full overflow-hidden border-4 border-indigo-500/50 shadow-lg shadow-indigo-500/30">
                                <img
                                    src={user.profile || 'https://via.placeholder.com/200x200?text=User'}
                                    alt={user.name}
                                    className="object-cover w-full h-full"
                                />
                            </div>
                            {/* Decorative elements */}
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-lg shadow-yellow-500/30"></div>
                            <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 shadow-sm shadow-purple-500/30"></div>
                        </div>

                        <div className="flex flex-col items-center md:items-start mt-2">
                            <h1 className="text-2xl md:text-3xl font-bold text-white">{user.name}</h1>
                            <p className="text-gray-400 text-sm mt-2">Member since {new Date(user.createdAt).toLocaleDateString()}</p>

                            {/* Stats Cards */}
                            <div className="flex flex-wrap gap-4 mt-5">
                                <div className="px-4 py-3 bg-indigo-600/20 border border-indigo-500/30 rounded-lg">
                                    <div className="text-xl font-bold text-white">{watchlist.length}</div>
                                    <div className="text-xs text-indigo-300">In Watchlist</div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <Link href={`/chat/${user.id}`}>
                                    <Button className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 rounded-md text-white text-sm shadow-md shadow-indigo-500/30">
                                        Message
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-[#141430]/80 backdrop-blur-md p-6 rounded-xl border border-indigo-500/20 shadow-xl shadow-indigo-500/10 text-center">
                        <div className="bg-red-500/20 p-4 rounded-lg inline-flex items-center justify-center mb-4">
                            <UserX size={24} className="text-red-300" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">User Not Found</h2>
                        <p className="text-gray-400">This user does not exist </p>
                    </div>
                )}
            </div>

            {/* Watchlist Section */}
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
                        <h2 className="text-2xl font-bold text-white">{user?.name}'s Watchlist</h2>
                        <p className="text-indigo-300/70 text-sm">{watchlist.length} anime in their collection</p>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="bg-[#141430]/70 backdrop-blur-sm rounded-xl overflow-hidden border border-indigo-500/10 h-full animate-pulse">
                                <div className="relative aspect-[3/4] bg-indigo-500/20"></div>
                                <div className="p-4 space-y-2">
                                    <div className="h-4 bg-indigo-500/20 rounded w-3/4"></div>
                                    <div className="h-3 bg-indigo-500/20 rounded w-1/2"></div>
                                    <div className="h-3 bg-indigo-500/20 rounded w-full"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : watchlist.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {watchlist.map((anime: Watchlist) => (
                            <Link href={`/anime/watch/${anime.AnimeId}`} key={anime.AnimeId}>
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
                        <h3 className="text-lg font-medium text-white mb-2">This {user?.name}'s watchlist is empty</h3>
                        <p className="text-gray-400 text-sm text-center max-w-md mb-4">They haven't added any anime to their watchlist yet.</p>
                        <Link href="/anime">
                            <Button className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 rounded-md text-white text-sm shadow-lg shadow-indigo-500/30">
                                Browse Anime
                            </Button>
                        </Link>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}