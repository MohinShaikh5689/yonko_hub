'use client'

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import useMyStore from "@/components/myStore";

interface Anime {
    id: number;
    title: string;
    japanese_title: string;
    episodes: string | number;
    synopsis: string;
    rating: number;
    coverImage: string;
    image: string;
    genres?: string[];
    status?: string;
    releaseDate?: number;
    totalEpisodes?: number;
    studios?: string[];
}

interface Episode {
    paheId0: string;
    paheId1: string;
    zoroId: string;
    animeId: string;
    image: string;
    epNo: number;
    title?: string;
}

const EPISODES_PER_PAGE = 25;
const EPISODE_GROUP_SIZE = 25;

export default function Page() {
    const params = useParams();
    const searchQuery = params.filter as string;
    
    // Split loading states for progressive UI
    const [loadingStates, setLoadingStates] = useState({
        animeDetails: true,
        episodes: true
    });
    const [animeData, setAnimeData] = useState<Anime>();
    const [episodeData, setEpisodeData] = useState<Episode[]>([]);
    const [expandDescription, setExpandDescription] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [episodeRanges, setEpisodeRanges] = useState<{ label: string; startPage: number }[]>([]);
    const setData = useMyStore((state) => state.setData);

    const fetchAnimeDetails = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/info/${searchQuery}`);
            setAnimeData({
                id: response.data.id,
                title: response.data.title.english || response.data.title.romaji,
                japanese_title: response.data.title.native,
                episodes: response.data.episodes,
                synopsis: response.data.description,
                rating: response.data.rating,
                coverImage: response.data.cover,
                image: response.data.image,
                genres: response.data.genres,
                status: response.data.status,
                releaseDate: response.data.releaseDate,
                totalEpisodes: response.data.totalEpisodes,
                studios: response.data.studios,
            });
            setLoadingStates(prev => ({ ...prev, animeDetails: false }));
        } catch (error: any) {
            console.error("Error fetching anime details:", error.message);
            setLoadingStates(prev => ({ ...prev, animeDetails: false }));
        }
    };

    const fetchEpisodeData = async () => {
        try {

            const responsePahe = await axios.get(`http://localhost:5000/api/episodes/${searchQuery}`)
            const responseZoro = await axios.get(`http://localhost:5000/api/episodes/${searchQuery}?provider=zoro`)

            const zoro = responseZoro.data;


            if (responsePahe.data.length > 0) {
                const mappedEpisodes = responsePahe.data.map((episode: any, index:number) => ({
                    paheId0: episode.id.split("/")[0],
                    paheId1: episode.id.split("/")[1],
                    zoroId: zoro[index]?.id || null,
                    image: episode.image,
                    epNo: episode.number,
                    title: zoro[index]?.title || episode.title,
                }));
                setEpisodeData(mappedEpisodes);  
                setData(mappedEpisodes); // Store the data in Zustand store
            } else {
                const mappedEpisodes = zoro.map((episode: any) => ({
                    paheId0: null,
                    paheId1: null,
                    zoroId: episode.id,
                    image: episode.image,
                    epNo: episode.number,
                    title: episode.title,
                }));
                setEpisodeData(mappedEpisodes);
                setData(mappedEpisodes); // Store the data in Zustand store
            }
            setLoadingStates(prev => ({ ...prev, episodes: false }));
        } catch (error: any) {
            console.error("Fatal error fetching episode data:", error.message);
            setEpisodeData([]);
            setLoadingStates(prev => ({ ...prev, episodes: false }));
        }
    };

    useEffect(() => {
        // Reset loading states when search query changes
        setLoadingStates({
            animeDetails: true,
            episodes: true
        });
        
        // Fetch anime details and episodes in parallel
        fetchAnimeDetails();
        fetchEpisodeData();
    }, [searchQuery]);

    useEffect(() => {
        if (episodeData.length > EPISODES_PER_PAGE) {
            const ranges = [];
            const totalEpisodes = episodeData.length;
            for (let i = 0; i < totalEpisodes; i += EPISODE_GROUP_SIZE) {
                const startEp = i + 1;
                const endEp = Math.min(i + EPISODE_GROUP_SIZE, totalEpisodes);
                const startPage = Math.floor(i / EPISODES_PER_PAGE) + 1;
                ranges.push({ label: `${startEp} - ${endEp}`, startPage });
            }
            setEpisodeRanges(ranges);
        } else {
            setEpisodeRanges([]);
        }
    }, [episodeData]);

    const totalPages = Math.ceil(episodeData.length / EPISODES_PER_PAGE);

    const getCurrentPageEpisodes = () => {
        const startIndex = (currentPage - 1) * EPISODES_PER_PAGE;
        const endIndex = startIndex + EPISODES_PER_PAGE;
        return episodeData.slice(startIndex, endIndex);
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            const episodesSection = document.getElementById("episodes-section");
            if (episodesSection) {
                const yOffset = -80;
                const y = episodesSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        }
    };

    const renderPaginationItems = () => {
        const pageItems = [];
        // Reduce visible pages on small screens
        const maxVisiblePages = window.innerWidth < 640 ? 3 : 5;
        const halfVisible = Math.floor(maxVisiblePages / 2);

        let startPage = Math.max(1, currentPage - halfVisible);
        let endPage = Math.min(totalPages, currentPage + halfVisible);

        if (currentPage <= halfVisible) {
            endPage = Math.min(totalPages, maxVisiblePages);
        }
        if (currentPage + halfVisible >= totalPages) {
            startPage = Math.max(1, totalPages - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            pageItems.push(
                <PaginationItem key={1}>
                    <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(1); }}>1</PaginationLink>
                </PaginationItem>
            );
            if (startPage > 2) {
                pageItems.push(<PaginationItem key="start-ellipsis"><PaginationEllipsis /></PaginationItem>);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pageItems.push(
                <PaginationItem key={i}>
                    <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(i); }} isActive={currentPage === i}>
                        {i}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pageItems.push(<PaginationItem key="end-ellipsis"><PaginationEllipsis /></PaginationItem>);
            }
            pageItems.push(
                <PaginationItem key={totalPages}>
                    <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(totalPages); }}>{totalPages}</PaginationLink>
                </PaginationItem>
            );
        }

        return pageItems;
    };

    const handleRangeSelect = (startPage: number) => {
        handlePageChange(startPage);
    };

    const PaginationControls = () => (
        totalPages > 1 ? (
            <Pagination className="mt-8 mb-4 w-full overflow-x-auto py-2 max-w-full">
                <PaginationContent className="flex-nowrap min-w-full justify-center">
                    <PaginationItem>
                        <PaginationPrevious
                            href="#"
                            onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                            className={`${currentPage === 1 ? "pointer-events-none opacity-50" : ""} px-2 sm:px-3`}
                        />
                    </PaginationItem>
                    {renderPaginationItems()}
                    <PaginationItem>
                        <PaginationNext
                            href="#"
                            onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                            className={`${currentPage === totalPages ? "pointer-events-none opacity-50" : ""} px-2 sm:px-3`}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        ) : null
    );

    const EpisodeRangeDropdown = () => (
        episodeRanges.length > 0 ? (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-1 border-indigo-500/30 text-indigo-300 hover:text-white hover:border-indigo-500/50 text-xs sm:text-sm">
                        Episode Range
                        <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-60 overflow-y-auto bg-[#141438]/90 backdrop-blur-sm border-indigo-500/30 text-gray-200 w-36 sm:w-auto">
                    <DropdownMenuLabel className="text-xs sm:text-sm">Go to Episode</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-indigo-500/20" />
                    {episodeRanges.map((range) => (
                        <DropdownMenuItem
                            key={range.label}
                            onClick={() => handleRangeSelect(range.startPage)}
                            className="cursor-pointer hover:bg-indigo-600/30 focus:bg-indigo-600/30 text-xs sm:text-sm"
                        >
                            {range.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        ) : null
    );

    // Skeleton components for loading states
    const AnimeCoverSkeleton = () => (
        <div className="relative h-[40vh] sm:h-[50vh] w-full overflow-hidden mt-14 sm:mt-16">
            <div className="absolute inset-0">
                <Skeleton className="h-full w-full" />
            </div>
            <div className="container mx-auto px-3 sm:px-4 relative h-full">
                <div className="flex flex-col md:flex-row items-start gap-4 sm:gap-6 pt-10 sm:pt-16 md:pt-10">
                    <div className="w-32 sm:w-40 md:w-64 flex-shrink-0 z-10 md:mt-12 mx-auto sm:mx-0">
                        <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-indigo-500/20">
                            <Skeleton className="absolute inset-0" />
                        </div>
                    </div>

                    <div className="z-10 flex-grow pt-4 md:mt-6 w-full">
                        <Skeleton className="h-5 sm:h-6 w-20 sm:w-24 mb-2 sm:mb-3" />
                        <Skeleton className="h-8 sm:h-10 w-full sm:w-3/4 mb-2" />
                        <Skeleton className="h-5 sm:h-6 w-3/4 sm:w-1/2 mb-3 sm:mb-4" />
                        
                        <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                            {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="h-5 sm:h-6 w-16 sm:w-20 rounded-full" />
                            ))}
                        </div>
                        
                        <div className="flex flex-wrap gap-3 sm:gap-6 my-3 sm:my-4">
                            <Skeleton className="h-4 sm:h-5 w-24 sm:w-32" />
                            <Skeleton className="h-4 sm:h-5 w-24 sm:w-32" />
                        </div>
                        
                        <div className="mt-2 bg-[#141438]/60 backdrop-blur-sm p-3 sm:p-4 rounded-lg border border-indigo-500/20 max-w-3xl">
                            <Skeleton className="h-3 sm:h-4 w-full mb-2" />
                            <Skeleton className="h-3 sm:h-4 w-full mb-2" />
                            <Skeleton className="h-3 sm:h-4 w-2/3 sm:w-3/4 mb-2" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const EpisodeSkeletonItem = () => (
        <div className="bg-[#141438]/60 backdrop-blur-sm rounded-lg overflow-hidden border border-indigo-500/20">
            <div className="relative aspect-video w-full overflow-hidden">
                <Skeleton className="absolute inset-0" />
            </div>
            <div className="p-2 sm:p-3">
                <Skeleton className="h-3 sm:h-4 w-full mb-1" />
                <Skeleton className="h-3 sm:h-4 w-1/2" />
            </div>
        </div>
    );

    const EpisodeSkeletonList = () => (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
            {[...Array(10)].map((_, i) => (
                <EpisodeSkeletonItem key={i} />
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0914] to-[#0d0d24] text-gray-100">
            <Navbar />

            {!animeData && !loadingStates.animeDetails ? (
                <div className="flex justify-center items-center h-[80vh] px-4">
                    <div className="text-center bg-[#141430]/60 backdrop-blur-sm p-6 sm:p-8 rounded-xl border border-indigo-500/20 w-full max-w-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 text-red-500/70 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">Error Loading Anime</h2>
                        <p className="text-sm sm:text-base text-gray-400 mb-4">Could not fetch details for this anime. Please try again later.</p>
                        <Link href="/">
                            <Button className="bg-indigo-600 hover:bg-indigo-700">Go Home</Button>
                        </Link>
                    </div>
                </div>
            ) : (
                <>
                    {/* Anime Cover and Info Section */}
                    {loadingStates.animeDetails ? (
                        <AnimeCoverSkeleton />
                    ) : (
                        <div className="relative w-full h-[40vh] sm:h-[50vh] overflow-hidden mt-14 sm:mt-16">
                            <div className="absolute inset-0 scale-105 bg-fixed">
                                <Image
                                    src={animeData?.coverImage || animeData?.image || "/images/default-cover.jpg"}
                                    alt={animeData?.title || "Anime Cover"}
                                    fill
                                    className="object-cover"
                                    priority
                                    sizes="100vw"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0914] via-[#0a0914]/90 to-transparent">
                                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-indigo-900/10 to-transparent opacity-70"></div>
                                </div>
                            </div>

                            <div className="container mx-auto px-3 sm:px-4 relative h-full">
                                <div className="flex flex-col md:flex-row items-start gap-4 sm:gap-6 pt-10 sm:pt-16 md:pt-10">
                                    <div className="w-32 sm:w-40 md:w-64 flex-shrink-0 z-10 md:mt-12 mx-auto sm:mx-0">
                                        <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-[0_0_20px_rgba(99,93,255,0.4)] border border-indigo-500/50 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(99,93,255,0.5)]">
                                            <Image
                                                src={animeData?.image || "/images/default-cover.jpg"}
                                                alt={animeData?.title || "Anime Cover"}
                                                fill
                                                className="object-cover"
                                                priority
                                                sizes="(max-width: 640px) 30vw, (max-width: 768px) 25vw, 20vw"
                                            />
                                        </div>
                                    </div>

                                    <div className="z-10 flex-grow pt-4 md:mt-6 text-center sm:text-left">
                                        {animeData?.status && (
                                            <Badge className="mb-2 sm:mb-3 bg-indigo-600/70 hover:bg-indigo-600 text-white text-xs sm:text-sm">
                                                {animeData.status}
                                            </Badge>
                                        )}

                                        <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200 leading-tight">
                                            {animeData?.title}
                                        </h1>

                                        <h2 className="text-sm sm:text-lg text-indigo-300 mb-3 sm:mb-4 mt-1 font-medium">
                                            {animeData?.japanese_title}
                                        </h2>

                                        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4 justify-center sm:justify-start">
                                            {animeData?.genres?.map((genre, index) => (
                                                <span key={index} className="px-2 sm:px-3 py-0.5 sm:py-1 bg-indigo-600/30 backdrop-blur-sm rounded-full text-xs font-medium text-indigo-200 border border-indigo-500/30 transition-colors hover:bg-indigo-600/40">
                                                    {genre}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="flex flex-wrap gap-4 sm:gap-6 my-3 sm:my-4 text-xs sm:text-sm justify-center sm:justify-start">
                                            {animeData?.totalEpisodes && (
                                                <div className="flex items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-400 mr-1 sm:mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                    <span className="text-gray-300">{animeData.totalEpisodes} Episodes</span>
                                                </div>
                                            )}

                                            {animeData?.studios && animeData.studios.length > 0 && (
                                                <div className="flex items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-400 mr-1 sm:mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                    <span className="text-gray-300">{animeData.studios[0]}</span>
                                                </div>
                                            )}

                                            {animeData?.rating && (
                                                <div className="flex items-center">
                                                    <div className="flex items-center text-yellow-400 mr-1 sm:mr-1.5">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.240.588 1.810l-2.800 2.034a1 1 0 00-.364 1.118l1.070 3.292c.300.921-.755 1.688-1.540 1.118l-2.800-2.034a1 1 0 00-1.175 0l-2.800 2.034c-.784.570-1.838-.197-1.539-1.118l1.070-3.292a1 1 0 00-.364-1.118L2.980 8.720c-.783-.570-.380-1.810.588-1.810h3.461a1 1 0 00.951-.690l1.070-3.292z" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-gray-300 font-medium">{(animeData.rating / 10).toFixed(1)}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-2 bg-[#141438]/60 backdrop-blur-sm p-3 sm:p-4 rounded-lg border border-indigo-500/20 max-w-3xl mx-auto sm:mx-0">
                                            <p className={`text-gray-300 text-xs sm:text-sm md:text-base ${expandDescription ? '' : 'line-clamp-3 sm:line-clamp-3'}`}>
                                                {animeData?.synopsis?.replace(/<[^>]*>/g, '')}
                                            </p>
                                            {animeData?.synopsis && animeData.synopsis.length > 150 && (
                                                <button
                                                    onClick={() => setExpandDescription(!expandDescription)}
                                                    className="text-indigo-400 hover:text-indigo-300 text-xs sm:text-sm mt-2 flex items-center mx-auto sm:mx-0"
                                                >
                                                    {expandDescription ? 'Show Less' : 'Read More'}
                                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 sm:h-4 sm:w-4 ml-1 transform transition-transform ${expandDescription ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Episodes Section */}
                    <div id="episodes-section" className="container mx-auto px-3 sm:px-4 py-6 sm:py-10">
                        <div className="flex flex-wrap justify-between items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
                            <div className="flex items-center">
                                <div className="bg-indigo-500/20 p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-indigo-400">
                                    Episodes {loadingStates.episodes ? (
                                        <Skeleton className="inline-block h-6 sm:h-8 w-10 sm:w-16 align-text-bottom" />
                                    ) : (
                                        `(${episodeData.length})`
                                    )}
                                </h2>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                                {!loadingStates.episodes && <EpisodeRangeDropdown />}
                            </div>
                        </div>

                        {loadingStates.episodes ? (
                            <EpisodeSkeletonList />
                        ) : episodeData.length === 0 ? (
                            <div className="text-center py-6 sm:py-10 px-3">
                                <div className="bg-[#141438]/60 backdrop-blur-sm p-6 sm:p-8 rounded-xl border border-indigo-500/20 inline-block">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-indigo-400 mb-3 sm:mb-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-xl sm:text-2xl font-medium text-indigo-200 mb-2">No Episodes Available</p>
                                    <p className="text-sm sm:text-base text-gray-400 max-w-md mx-auto">We couldn't find any episodes for this anime. The content may be unavailable or still being added.</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
                                    {getCurrentPageEpisodes().map((episode) => (
                                        <Link
                                            key={`ep-${episode.epNo}`}
                                            href={`/anime/stream/${episode.paheId0}+${episode.paheId1}+${episode.zoroId}+${episode.epNo}+${searchQuery}`}
                                            className="group"
                                        >
                                            <div className="bg-[#141438]/60 backdrop-blur-sm rounded-lg overflow-hidden border border-indigo-500/20 transition-all duration-300 hover:border-indigo-500/60 hover:shadow-lg hover:shadow-indigo-500/20 h-full flex flex-col">
                                                <div className="relative aspect-video w-full overflow-hidden">
                                                    <Image
                                                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                                                        src={episode.image || "/images/default-episode.jpg"}
                                                        alt={`Episode ${episode.epNo}`}
                                                        fill
                                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:opacity-70 transition-opacity"></div>
                                                    <div className="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 bg-indigo-600/90 text-white text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md backdrop-blur-sm border border-indigo-500/50">
                                                        EP {episode.epNo}
                                                    </div>
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-100 scale-75">
                                                        <div className="bg-indigo-600/90 rounded-full p-2 sm:p-3 shadow-lg shadow-indigo-900/50 border border-indigo-500/50">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-2 sm:p-3 flex-grow flex flex-col justify-between">
                                                    <h3 className="text-xs sm:text-sm font-medium text-indigo-100 line-clamp-2 group-hover:text-indigo-300 transition-colors">
                                                        {episode.title || `Episode ${episode.epNo}`}
                                                    </h3>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                <PaginationControls />
                            </>
                        )}
                    </div>
                </>
            )}

            <Footer />
        </div>
    );
}