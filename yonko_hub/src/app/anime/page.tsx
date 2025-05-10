'use client'

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from "next/dynamic";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, Star, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

const Navbar = dynamic(() => import('@/components/navbar').then(mod => mod.Navbar), {
    ssr: false,
});

const Footer = dynamic(() => import('@/components/footer').then(mod => mod.Footer), {
    ssr: false,
});

// Define types
interface Anime {
    id: number;
    title: string;
    episodes: number | string;
    rating: number | string;
    image: string;
    synopsis?: string;
    banner?: string;
    year?: number;
    genres?: string[];
    status?: string;
    currentEpisode?: number;
    airingTime?: string;
    timeUntil?: number;
}

interface Comment {
    id: number;
    userId: number;
    AnimeId: string;
    content: string;
    createdAt: string;
    user: {
        name: string;
        profile: string;
    };
}

interface Watchlist {
    AnimeId: number;
    English_title: string;
    Japanese_title: string;
    synopsis: string;
    Image_url: string;
}

export default function AnimePage() {
 
    const [airingAnime, setAiringAnime] = useState<Anime[]>([]);
    const [recommendedAnime, setRecommendedAnime] = useState<Anime[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [featuredAnime, setFeaturedAnime] = useState<Anime[]>([]);
    const [airingTodayAnime, setAiringTodayAnime] = useState<Anime[]>([]);
    const [loading, setLoading] = useState({
        airing: true,
        recommended: true,
        comments: true,
        watchlist: true
    });
    const [watchlist, setWatchlist] = useState<Watchlist[]>([]);
    const [loadingFeatured, setLoadingFeatured] = useState(true);
    const [loadingAiringToday, setLoadingAiringToday] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    // Carousel scroll functionality
    const airingRef = useRef<HTMLDivElement>(null);
    const recommendedRef = useRef<HTMLDivElement>(null);
    const watchlistRef = useRef<HTMLDivElement>(null);
    const commentsRef = useRef<HTMLDivElement>(null);
    const airingTodayRef = useRef<HTMLDivElement>(null);

    const scrollCarousel = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
        if (!ref.current) return;

        const container = ref.current;
        const scrollAmount = container.clientWidth * 0.85; // Scroll by almost one full view

        if (direction === 'left') {
            container.scrollTo({
                left: container.scrollLeft - scrollAmount,
                behavior: 'smooth'
            });
        } else {
            container.scrollTo({
                left: container.scrollLeft + scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    // Format relative time for comments
    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

        return date.toLocaleDateString();
    };

    // Helper function to format time until airing
    const formatTimeUntil = (seconds: number) => {
        if (seconds < 0) return 'Aired';

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    };

    // Fetch currently airing anime
    const fetchAiringAnime = async () => {
        try {
            const query = `
        query {
          Page(page: 1, perPage: 10) {
            media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC, isAdult: false, tag_not_in: ["Ecchi", "Hentai", "Lolicon", "Shotacon"]) {
              id
              title {
                romaji
                english
                native
              }
              episodes
              description(asHtml: false)
              averageScore
              coverImage {
                large
              }
              nextAiringEpisode {
                episode
              }
            }
          }
        }
      `;

            const response = await axios.post('https://graphql.anilist.co', {
                query
            });

            const data = response.data.data.Page.media.map((anime: any) => ({
                id: anime.id,
                title: anime.title.english || anime.title.romaji,
                episodes: anime.nextAiringEpisode ? anime.nextAiringEpisode.episode - 1 : anime.episodes || "?",
                rating: anime.averageScore ? anime.averageScore / 10 : "N/A",
                image: anime.coverImage.large,
                synopsis: anime.description?.replace(/<br\s*\/?>/g, ' ').replace(/<[^>]*>/g, '').substring(0, 120) + '...'
            }));
 

            setAiringAnime(data);
            setLoading(prev => ({ ...prev, airing: false }));
        } catch (error) {
            console.error("Error fetching airing anime:", error);
            setLoading(prev => ({ ...prev, airing: false }));
        }
    };

    // Fetch recommended anime (using a randomized approach)
    const fetchRecommendedAnime = async () => {
        try {
            // Random page between 1-5 to get varied recommendations each time
            const randomPage = Math.floor(Math.random() * 5) + 1;

            const query = `
        query {
          Page(page: ${randomPage}, perPage: 10) {
            media(type: ANIME, sort: SCORE_DESC, isAdult: false, tag_not_in: ["Ecchi", "Hentai", "Lolicon", "Shotacon"]) {
              id
              title {
                romaji
                english
                native
              }
              episodes
              description(asHtml: false)
              averageScore
              coverImage {
                large
              }
            }
          }
        }
      `;

            const response = await axios.post('https://graphql.anilist.co', {
                query
            });

            const data = response.data.data.Page.media.map((anime: any) => ({
                id: anime.id,
                title: anime.title.english || anime.title.romaji,
                episodes: anime.episodes || "?",
                rating: anime.averageScore ? anime.averageScore / 10 : "N/A",
                image: anime.coverImage.large,
                synopsis: anime.description?.replace(/<br\s*\/?>/g, ' ').replace(/<[^>]*>/g, '').substring(0, 120) + '...'
            }));

            setRecommendedAnime(data);
            setLoading(prev => ({ ...prev, recommended: false }));
        } catch (error) {
            console.error("Error fetching recommended anime:", error);
            setLoading(prev => ({ ...prev, recommended: false }));
        }
    };

    // Fetch recent comments
    const fetchComments = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/anime/comments');
            setComments(response.data.comments);
            setLoading(prev => ({ ...prev, comments: false }));
        } catch (error) {
            console.error("Error fetching comments:", error);
            setLoading(prev => ({ ...prev, comments: false }));
        }
    };

    // Fetch featured anime for the carousel banner
    const fetchFeaturedAnime = async () => {
        try {
            const query = `
        query {
          Page(page: 1, perPage: 5) {
            media(type: ANIME, sort: TRENDING_DESC, isAdult: false, tag_not_in: ["Ecchi", "Hentai"]) {
              id
              title { english romaji }
              description(asHtml: false)
              bannerImage
              coverImage { large }
              averageScore
              genres
              seasonYear
              status
              episodes
            }
          }
        }
      `;

            const response = await axios.post('https://graphql.anilist.co', { query });

            // Filter out anime without banner images
            const data = response.data.data.Page.media
                .filter((anime: any) => anime.bannerImage)
                .map((anime: any) => ({
                    id: anime.id,
                    title: anime.title.english || anime.title.romaji,
                    synopsis: anime.description?.replace(/<br\s*\/?>/g, ' ').replace(/<[^>]*>/g, '').substring(0, 200) + '...',
                    banner: anime.bannerImage,
                    image: anime.coverImage.large,
                    rating: anime.averageScore ? anime.averageScore / 10 : "N/A",
                    year: anime.seasonYear,
                    episodes: anime.episodes || "?",
                    genres: anime.genres.slice(0, 3),
                    status: anime.status
                }));
                
            setFeaturedAnime(data);
            setLoadingFeatured(false);
        } catch (error) {
            console.error('Error fetching featured anime:', error);
            setLoadingFeatured(false);
        }
    };

    // Fetch anime airing today
    const fetchAiringToday = async () => {
        try {
            // Get current date
            const now = new Date();
            // Start of today
            const startOfDay = new Date(now);
            startOfDay.setHours(0, 0, 0, 0);

            // End of today
            const endOfDay = new Date(now);
            endOfDay.setHours(23, 59, 59, 999);

            // Convert to seconds (Unix time)
            const startTime = Math.floor(startOfDay.getTime() / 1000);
            const endTime = Math.floor(endOfDay.getTime() / 1000);

            const query = `
        query {
          Page(perPage: 50) {
            media(
              type: ANIME, 
              status: RELEASING, 
              sort: POPULARITY_DESC, 
              isAdult: false, 
              tag_not_in: ["Ecchi", "Hentai", "Lolicon", "Shotacon"]
            ) {
              id
              title {
                romaji
                english
                native
              }
              episodes
              nextAiringEpisode {
                episode
                airingAt
                timeUntilAiring
              }
              coverImage {
                large
              }
              averageScore
            }
          }
        }
      `;

            const response = await axios.post('https://graphql.anilist.co', { query });
            const media = response.data.data.Page.media;
            
            // Filter to only shows airing today
            const todayAiring = media.filter((anime: any) => {
                const airingAt = anime.nextAiringEpisode?.airingAt;
                return airingAt && airingAt >= startTime && airingAt <= endTime;
            });
            const data = todayAiring.map((anime: any) => {
                const airingTime = new Date(anime.nextAiringEpisode.airingAt * 1000);
                const hours = airingTime.getHours().toString().padStart(2, '0');
                const minutes = airingTime.getMinutes().toString().padStart(2, '0');

                return {
                    id: anime.id,
                    title: anime.title.english || anime.title.romaji,
                    episodes: anime.episodes,
                    currentEpisode: anime.nextAiringEpisode.episode,
                    airingTime: `${hours}:${minutes}`,
                    timeUntil: anime.nextAiringEpisode.timeUntilAiring,
                    rating: anime.averageScore ? anime.averageScore / 10 : "N/A",
                    image: anime.coverImage.large
                };
            });

            // Sort by airing time (soonest first)
            data.sort((a: any, b: any) => a.timeUntil - b.timeUntil);

            setAiringTodayAnime(data);
            setLoadingAiringToday(false);
        } catch (error) {
            console.error("Error fetching airing today anime:", error);
            setLoadingAiringToday(false);
        }
    };

    // Replace direct localStorage access with useEffect
    useEffect(() => {
        setIsMounted(true);
        const savedToken = localStorage.getItem('token');
        // Access localStorage only after component is mounted on client
        setToken(savedToken);
        
        fetchFeaturedAnime();
        fetchAiringAnime();
        fetchRecommendedAnime();
        fetchComments();
        fetchAiringToday();
        
        // Only fetch watchlist if token exists
        if (savedToken) {
            fetchWatchlist(savedToken);
        }
    }, []);

    // Update fetchWatchlist to use the state token instead of directly accessing localStorage
    const fetchWatchlist = async (token:string) => {
        try {
            const response = await axios.get('http://localhost:3001/api/watchlist', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

         

            const data = response.data.slice(0,10).map((anime: any) => ({
                AnimeId: anime.AnimeId,
                English_title: anime.English_Title,
                Japanese_title: anime.Japanese_Title,
                synopsis: anime.synopsis,
                Image_url: anime.Image_url
            }));
            setWatchlist(data);
            setLoading(prev => ({ ...prev, watchlist: false }));

        } catch (error: any) {
            console.error("Error fetching watchlist:", error);
        }
    };

    // Skeleton components for loading states
    const AnimeSkeleton = () => (
        <div className="min-w-[180px] sm:min-w-[200px] flex-shrink-0">
            <Card className="h-full bg-[#141430]/50 border-0 overflow-hidden">
                <div className="relative pb-[140%]">
                    <Skeleton className="absolute inset-0 bg-indigo-950/40" />
                </div>
                <CardContent className="p-3">
                    <Skeleton className="h-5 w-full mb-2 bg-indigo-950/40" />
                    <div className="flex justify-between mt-2">
                        <Skeleton className="h-3 w-12 bg-indigo-950/40" />
                        <Skeleton className="h-3 w-10 bg-indigo-950/40" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const CommentSkeleton = () => (
        <div className="min-w-[280px] sm:min-w-[320px] flex-shrink-0">
            <Card className="bg-[#141430]/50 border-0 p-4">
                <div className="flex gap-3">
                    <Skeleton className="h-10 w-10 rounded-full bg-indigo-950/40" />
                    <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-2 bg-indigo-950/40" />
                        <Skeleton className="h-3 w-full mb-1 bg-indigo-950/40" />
                        <Skeleton className="h-3 w-3/4 bg-indigo-950/40" />
                    </div>
                </div>
            </Card>
        </div>
    );

    const BannerSkeleton = () => (
        <div className="w-full h-[300px] md:h-[400px] bg-indigo-950/30 rounded-xl overflow-hidden relative">
            <Skeleton className="absolute inset-0 bg-indigo-950/40" />
            <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black to-transparent">
                <Skeleton className="h-8 w-1/3 mb-3 bg-indigo-950/60" />
                <Skeleton className="h-4 w-2/3 mb-2 bg-indigo-950/60" />
                <Skeleton className="h-4 w-1/2 bg-indigo-950/60" />
            </div>
        </div>
    );

    const AiringTodaySkeleton = () => (
        <div className="min-w-[230px] sm:min-w-[260px] flex-shrink-0">
            <Card className="h-full bg-[#141430]/50 border-0 overflow-hidden">
                <div className="relative pb-[56%]">
                    <Skeleton className="absolute inset-0 bg-indigo-950/40" />
                </div>
                <CardContent className="p-3">
                    <Skeleton className="h-5 w-full mb-2 bg-indigo-950/40" />
                    <div className="flex justify-between items-center mt-2">
                        <Skeleton className="h-3 w-16 bg-indigo-950/40" />
                        <Skeleton className="h-6 w-16 rounded-full bg-indigo-950/40" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    if (!isMounted) return null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0914] to-[#0d0d24]">
            <Navbar />

            {/* Decorative background elements */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full filter blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full filter blur-[80px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>
                <div className="absolute inset-0opacity-[0.02]"></div>
            </div>

            <main className="container mx-auto px-4 py-20 relative z-10">
                {/* Hero Section */}
                <section className="mb-16">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-4">
                            Yonko Hub Anime
                        </h1>
                        <p className="text-indigo-200 max-w-2xl mx-auto">
                            Discover and explore the latest anime, join discussions, and connect with fellow fans in our anime community.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                        <Link href="/anime/airing" className="relative p-6 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-900/40 to-purple-800/40 backdrop-blur-sm border border-indigo-500/20 hover:border-indigo-500/40 transition-all group flex flex-col justify-between h-32">
                            <div className="absolute bottom-0 right-0 opacity-20 group-hover:opacity-30 transition-opacity">
                                <svg width="100" height="100" viewBox="0 0 24 24" fill="none" className="text-indigo-300">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white">Currently Airing</h3>
                            <p className="text-indigo-300 text-sm">Stay up to date with weekly releases</p>
                        </Link>

                        <Link href="/anime/popular" className="relative p-6 rounded-xl overflow-hidden bg-gradient-to-br from-purple-900/40 to-indigo-800/40 backdrop-blur-sm border border-purple-500/20 hover:border-purple-500/40 transition-all group flex flex-col justify-between h-32">
                            <div className="absolute bottom-0 right-0 opacity-20 group-hover:opacity-30 transition-opacity">
                                <svg width="100" height="100" viewBox="0 0 24 24" fill="none" className="text-purple-300">
                                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white">Popular Anime</h3>
                            <p className="text-purple-300 text-sm">Explore what everyone's watching</p>
                        </Link>

                        <Link href="/anime/liked" className="relative p-6 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-800/40 to-purple-900/40 backdrop-blur-sm border border-indigo-500/20 hover:border-indigo-500/40 transition-all group flex flex-col justify-between h-32">
                            <div className="absolute bottom-0 right-0 opacity-20 group-hover:opacity-30 transition-opacity">
                                <svg width="100" height="100" viewBox="0 0 24 24" fill="none" className="text-indigo-300">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white">Most Liked Anime</h3>
                            <p className="text-indigo-300 text-sm">Fan favorites with highest ratings</p>
                        </Link>
                    </div>
                </section>

                {/* Featured Anime Carousel Banner */}
                <section className="mb-16">
                    {loadingFeatured ? (
                        <BannerSkeleton />
                    ) : (
                        <Swiper
                            modules={[Pagination, Autoplay]}
                            pagination={{ clickable: true }}
                            autoplay={{ delay: 5000, disableOnInteraction: false }}
                            className="rounded-xl overflow-hidden shadow-lg shadow-indigo-900/20"
                        >
                            {featuredAnime.map(anime => (
                                <SwiperSlide key={anime.id}>
                                    <Link href={`/anime/details/${anime.id}`}>
                                        <div className="relative h-[300px] md:h-[400px] w-full group">
                                            <Image
                                                src={anime.banner || "/placeholder-banner.jpg"}
                                                alt={anime.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                                                priority
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-80" />

                                            <div className="absolute bottom-0 left-0 w-full p-6 md:p-8">
                                                <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
                                                    <div className="hidden md:block h-32 w-24 relative rounded overflow-hidden shadow-lg">
                                                        <Image
                                                            src={anime.image}
                                                            alt={anime.title}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>

                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="px-2 py-1 bg-indigo-600/80 text-white text-xs rounded">
                                                                {anime.status ? anime.status.replace("_", " ") : "Unknown"}
                                                            </span>
                                                            <span className="text-indigo-300 text-xs flex items-center">
                                                                <Star className="h-3 w-3 mr-1" /> {anime.rating}/10
                                                            </span>
                                                        </div>

                                                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                                                            {anime.title}
                                                        </h2>

                                                        <div className="flex gap-2 mb-3">
                                                            {(anime.genres ?? []).map(genre => (
                                                                <span key={genre} className="text-xs px-2 py-1 bg-indigo-800/50 text-indigo-200 rounded">
                                                                    {genre}
                                                                </span>
                                                            ))}
                                                        </div>

                                                        <p className="text-gray-300 text-sm hidden md:line-clamp-2">
                                                            {anime.synopsis}
                                                        </p>

                                                        <button className="mt-3 md:mt-4 text-indigo-300 hover:text-white text-sm font-medium flex items-center">
                                                            Watch Now <ChevronRight className="h-4 w-4 ml-1" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    )}
                </section>

                {/* Airing Today Section */}
                <section className="mb-16">
                    <div className="flex justify-between items-center mb-5">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Airing Today</h2>
                            <p className="text-indigo-300 text-sm">Episodes scheduled to air today</p>
                        </div>

                    </div>

                    <div className="relative">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/20 backdrop-blur-sm text-white rounded-full hover:bg-black/40 -ml-4 hidden md:flex"
                            onClick={() => scrollCarousel(airingTodayRef, 'left')}
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </Button>

                        <div
                            ref={airingTodayRef}
                            className="flex overflow-x-auto gap-4 pb-4 snap-x scrollbar-hide"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {loadingAiringToday ? (
                                Array.from({ length: 8 }).map((_, idx) => (
                                    <AiringTodaySkeleton key={`airing-today-skeleton-${idx}`} />
                                ))
                            ) : airingTodayAnime.length > 0 ? (
                                airingTodayAnime.map(anime => (
                                    <motion.div
                                        key={anime.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.5 }}
                                        className="min-w-[230px] sm:min-w-[260px] flex-shrink-0 snap-start"
                                    >
                                        <Link href={`/anime/details/${anime.id}`}>
                                            <Card className="h-full bg-[#141430]/50 hover:bg-[#141430]/70 border-0 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 group">
                                                <div className="relative pb-[56%] overflow-hidden">
                                                    <Image
                                                        src={anime.image}
                                                        alt={anime.title}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                        sizes="(max-width: 768px) 230px, 260px"
                                                    />
                                                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 to-transparent p-3">
                                                        <h3 className="text-sm font-medium text-white line-clamp-1">{anime.title}</h3>
                                                    </div>
                                                    <div className="absolute top-2 right-2 bg-indigo-600/90 text-white text-xs font-medium py-1 px-2 rounded">
                                                        Ep {anime.currentEpisode}
                                                    </div>
                                                </div>
                                                <CardContent className="p-3">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-1 text-xs text-indigo-300">
                                                            <CalendarDays className="h-3 w-3" /> {anime.airingTime}
                                                        </div>
                                                        <div className={`text-xs font-medium px-2 py-1 rounded-full ${(anime.timeUntil ?? Infinity) < 1800
                                                                ? 'bg-red-500/20 text-red-300'
                                                                : (anime.timeUntil ?? Infinity) < 3600
                                                                    ? 'bg-orange-500/20 text-orange-300'
                                                                    : 'bg-indigo-600/20 text-indigo-300'
                                                            }`}>
                                                            {formatTimeUntil(anime.timeUntil ? anime.timeUntil : 0)}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="w-full py-8 flex flex-col items-center justify-center text-center">
                                    <CalendarDays className="h-10 w-10 text-indigo-500/60 mb-3" />
                                    <p className="text-indigo-300">No anime episodes airing today</p>
                                    <p className="text-sm text-indigo-400/70 mt-1">Check back tomorrow for new episodes</p>
                                </div>
                            )}
                        </div>

                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/20 backdrop-blur-sm text-white rounded-full hover:bg-black/40 -mr-4 hidden md:flex"
                            onClick={() => scrollCarousel(airingTodayRef, 'right')}
                        >
                            <ChevronRight className="h-6 w-6" />
                        </Button>
                    </div>
                </section>

                {/* Currently Airing Anime Section */}
                <section className="mb-16">
                    <div className="flex justify-between items-center mb-5">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Currently Airing</h2>
                            <p className="text-indigo-300 text-sm">Stay updated with weekly releases</p>
                        </div>
                        <Link href="/anime/airing">
                            <Button variant="ghost" className="text-indigo-300 hover:text-white hover:bg-indigo-900/30">
                                View All
                            </Button>
                        </Link>
                    </div>

                    <div className="relative">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/20 backdrop-blur-sm text-white rounded-full hover:bg-black/40 -ml-4 hidden md:flex"
                            onClick={() => scrollCarousel(airingRef, 'left')}
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </Button>

                        <div
                            ref={airingRef}
                            className="flex overflow-x-auto gap-4 pb-4 snap-x scrollbar-hide"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {loading.airing ? (
                                Array.from({ length: 10 }).map((_, idx) => (
                                    <AnimeSkeleton key={`airing-skeleton-${idx}`} />
                                ))
                            ) : (
                                airingAnime.map(anime => (
                                    <motion.div
                                        key={anime.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.5 }}
                                        className="min-w-[180px] sm:min-w-[200px] flex-shrink-0 snap-start"
                                    >
                                        <Link href={`/anime/details/${anime.id}`}>
                                            <Card className="h-full bg-[#141430]/50 hover:bg-[#141430]/70 border-0 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 group">
                                                <div className="relative pb-[140%] overflow-hidden">
                                                    <Image
                                                        src={anime.image}
                                                        alt={anime.title}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                        sizes="(max-width: 768px) 180px, 200px"
                                                    />
                                                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-3">
                                                        <h3 className="text-sm font-medium text-white line-clamp-1">{anime.title}</h3>
                                                    </div>
                                                </div>
                                                <CardContent className="p-3">
                                                    <div className="flex justify-between text-xs text-indigo-300">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" /> Ep: {anime.episodes}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Star className="h-3 w-3" /> {anime.rating}
                                                        </span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/20 backdrop-blur-sm text-white rounded-full hover:bg-black/40 -mr-4 hidden md:flex"
                            onClick={() => scrollCarousel(airingRef, 'right')}
                        >
                            <ChevronRight className="h-6 w-6" />
                        </Button>
                    </div>
                </section>

                {/* Recommended Anime Section */}
                <section className="mb-16">
                    <div className="flex justify-between items-center mb-5">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Recommended For You</h2>
                            <p className="text-indigo-300 text-sm">Discover new series based on top ratings</p>
                        </div>
                        <Link href="/anime/popular">
                            <Button variant="ghost" className="text-indigo-300 hover:text-white hover:bg-indigo-900/30">
                                View More
                            </Button>
                        </Link>
                    </div>

                    <div className="relative">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/20 backdrop-blur-sm text-white rounded-full hover:bg-black/40 -ml-4 hidden md:flex"
                            onClick={() => scrollCarousel(recommendedRef, 'left')}
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </Button>

                        <div
                            ref={recommendedRef}
                            className="flex overflow-x-auto gap-4 pb-4 snap-x scrollbar-hide"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {loading.recommended ? (
                                Array.from({ length: 10 }).map((_, idx) => (
                                    <AnimeSkeleton key={`recommended-skeleton-${idx}`} />
                                ))
                            ) : (
                                recommendedAnime.map(anime => (
                                    <motion.div
                                        key={anime.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.5 }}
                                        className="min-w-[180px] sm:min-w-[200px] flex-shrink-0 snap-start"
                                    >
                                        <Link href={`/anime/details/${anime.id}`}>
                                            <Card className="h-full bg-[#141430]/50 hover:bg-[#141430]/70 border-0 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 group">
                                                <div className="relative pb-[140%] overflow-hidden">
                                                    <Image
                                                        src={anime.image}
                                                        alt={anime.title}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                        sizes="(max-width: 768px) 180px, 200px"
                                                    />
                                                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-3">
                                                        <h3 className="text-sm font-medium text-white line-clamp-1">{anime.title}</h3>
                                                    </div>
                                                </div>
                                                <CardContent className="p-3">
                                                    <div className="flex justify-between text-xs text-indigo-300">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" /> Ep: {anime.episodes}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Star className="h-3 w-3" /> {anime.rating}
                                                        </span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    </motion.div>
                                ))
                            )}
                        </div>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/20 backdrop-blur-sm text-white rounded-full hover:bg-black/40 -mr-4 hidden md:flex"
                            onClick={() => scrollCarousel(recommendedRef, 'right')}
                        >
                            <ChevronRight className="h-6 w-6" />
                        </Button>
                    </div>
                </section>

                <section className="mb-16">
                <div className="flex justify-between items-center mb-5">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Your Watchlist</h2>
                            <p className="text-indigo-300 text-sm">  </p>
                        </div>
                        <Link href="/profile">
                            <Button variant="ghost" className="text-indigo-300 hover:text-white hover:bg-indigo-900/30">
                                View More
                            </Button>
                        </Link>
                    </div>

                    <div className="relative">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/20 backdrop-blur-sm text-white rounded-full hover:bg-black/40 -ml-4 hidden md:flex"
                            onClick={() => scrollCarousel(watchlistRef, 'left')}
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </Button>

                        <div
                            ref={watchlistRef}
                            className="flex overflow-x-auto gap-4 pb-4 snap-x scrollbar-hide"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {loading.watchlist ? (
                                Array.from({ length: 10 }).map((_, idx) => (
                                    <AnimeSkeleton key={`watchlist-skeleton-${idx}`} />
                                ))
                            ) : (
                               watchlist && watchlist.length > 0 ? watchlist.map(anime => (
                                    <motion.div
                                        key={anime.AnimeId}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.5 }}
                                        className="min-w-[180px] sm:min-w-[200px] flex-shrink-0 snap-start"
                                    >
                                        <Link href={`/anime/details/${anime.AnimeId}`}>
                                            <Card className="h-full bg-[#141430]/50 hover:bg-[#141430]/70 border-0 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 group">
                                                <div className="relative pb-[140%] overflow-hidden">
                                                    <Image
                                                        src={anime.Image_url}
                                                        alt={anime.English_title}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                        sizes="(max-width: 768px) 180px, 200px"
                                                    />
                                                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-3">
                                                        <h3 className="text-sm font-medium text-white line-clamp-1">{anime.English_title}</h3>
                                                    </div>
                                                </div>

                                            </Card>
                                        </Link>
                                    </motion.div>
                                )) : null
                            )}
                         </div>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/20 backdrop-blur-sm text-white rounded-full hover:bg-black/40 -mr-4 hidden md:flex"
                            onClick={() => scrollCarousel(watchlistRef, 'right')}
                        >
                            <ChevronRight className="h-6 w-6" />
                        </Button>
                    </div>
                </section>

                {/* Recent Comments Section */}
                <section className="mb-16">
                    <div className="flex justify-between items-center mb-5">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Community Activity</h2>
                            <p className="text-indigo-300 text-sm">Recent comments</p>
                        </div>
                    </div>

                    <div className="relative">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/20 backdrop-blur-sm text-white rounded-full hover:bg-black/40 -ml-4 hidden md:flex"
                            onClick={() => scrollCarousel(commentsRef, 'left')}
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </Button>

                     

                        <div
                            ref={commentsRef}
                            className="flex overflow-x-auto gap-4 pb-4 snap-x scrollbar-hide"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {loading.comments ? (
                                Array.from({ length: 5 }).map((_, idx) => (
                                    <CommentSkeleton key={`comment-skeleton-${idx}`} />
                                ))
                            ) : (
                                comments.map(comment => (
                                    <motion.div
                                        key={comment.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.5 }}
                                        className="min-w-[280px] sm:min-w-[320px] flex-shrink-0 snap-start"
                                    >
                                        <Card className="bg-[#141430]/50 hover:bg-[#141430]/70 border-0 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10">
                                            <div className="flex gap-3">
                                                <div className="flex-shrink-0">
                                                    <div className="w-10 h-10 rounded-full overflow-hidden relative">
                                                        <Image
                                                            src={comment.user.profile || '/default-avatar.png'}
                                                            alt={comment.user.name}
                                                            fill
                                                            className="object-cover"
                                                            sizes="40px"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.src = 'https://www.gravatar.com/avatar/default?d=mp';
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between">
                                                        <span className="font-medium text-white">{comment.user.name}</span>
                                                        <span className="text-xs text-indigo-300">{formatRelativeTime(comment.createdAt)}</span>
                                                    </div>
                                                    <p className="text-sm mt-1 text-gray-300 break-words line-clamp-2">
                                                        {comment.content}
                                                    </p>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/20 backdrop-blur-sm text-white rounded-full hover:bg-black/40 -mr-4 hidden md:flex"
                            onClick={() => scrollCarousel(commentsRef, 'right')}
                        >
                            <ChevronRight className="h-6 w-6" />
                        </Button>
                    </div>

                    <div className="mt-6 flex justify-center">
                        <Link href="/communities" passHref>
                            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                                Join the Community
                            </Button>
                        </Link>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}