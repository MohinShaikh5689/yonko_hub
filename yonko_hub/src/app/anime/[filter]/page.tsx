'use client'
import dynamic from "next/dynamic";
import axios from "axios";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton";

const Navbar = dynamic(() => import('@/components/navbar').then(mod => mod.Navbar), {
  ssr: false,
})

const Footer = dynamic(() => import('@/components/footer').then(mod => mod.Footer), {
  ssr: false,
})

import { useParams } from "next/navigation";

interface Anime {
  id: number;
  title: string;
  japanese_title: string;
  episodes: string | number;
  synopsis: string;
  rating: number;
  image: string;
}

export default function Page() {
    const [anime, setAnime] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [hasPrevPage, setHasPrevPage] = useState(false);
    const [totalPages, setTotalPages] = useState(0);

    const params = useParams();
    let filter = params.filter as string;

    const prevPage = () => {
      if (page > 1) {
        window.scrollTo(0, 0);
        setPage(page - 1);
      }
    }

    const nextPage = () => {
      if (hasNextPage) {
        window.scrollTo(0, 0);
        setPage(page + 1);
      }
    }

    const goToPage = (pageNumber: number) => {
      if (pageNumber >= 1 && pageNumber <= totalPages) {
        window.scrollTo(0, 0);
        setPage(pageNumber);
      }
    }

    const fetchAnimes = async () => {
      try {
        setLoading(true);
        setAnime([]);

        // Base query structure for AniList GraphQL API
        let query = `
          query ($page: Int, $perPage: Int, $sort: [MediaSort]) {
            Page(page: $page, perPage: $perPage) {
              pageInfo {
                total
                currentPage
                lastPage
                hasNextPage
                perPage
              }
              media(type: ANIME, sort: $sort) {
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
                status
              }
            }
          }
        `;

        const variables = {
          page: page,
          perPage: 20, // You can adjust this number
          sort: ["POPULARITY_DESC"] // Default sort
        };

        // Set sort variables based on filter
        switch(filter) {
          case 'upcoming':
            variables.sort = ["START_DATE_DESC"];
            query = `
              query ($page: Int, $perPage: Int, $sort: [MediaSort]) {
                Page(page: $page, perPage: $perPage) {
                  pageInfo {
                    total
                    currentPage
                    lastPage
                    hasNextPage
                    perPage
                  }
                  media(type: ANIME, status: NOT_YET_RELEASED, sort: $sort) {
                    id
                    title {
                      romaji
                      english
                      native
                    }
                    episodes
                    description
                    averageScore
                    coverImage {
                      large
                    }
                    status
                  }
                }
              }
            `;
            break;
          case 'airing':
            query = `
              query ($page: Int, $perPage: Int, $sort: [MediaSort]) {
                Page(page: $page, perPage: $perPage) {
                  pageInfo {
                    total
                    currentPage
                    lastPage
                    hasNextPage
                    perPage
                  }
                  media(type: ANIME, status: RELEASING, sort: $sort, isAdult: false, tag_not_in: ["Hentai","Incest", "Lolicon", "Shotacon"]) {
                    id
                    title {
                      romaji
                      english
                      native
                    }
                    episodes
                    description
                    averageScore
                    coverImage {
                      large
                    }
                    nextAiringEpisode {
                      episode
                      timeUntilAiring
                    }
                    status
                  }
                }
              }
            `;
            break;
          case 'popular':
            variables.sort = ["POPULARITY_DESC"];
            break;
          case 'liked':
            variables.sort = ["FAVOURITES_DESC"];
            break;  
          default:
            variables.sort = ["POPULARITY_DESC"];
        }

        // Make the GraphQL request
        const response = await axios.post('https://graphql.anilist.co', {
          query,
          variables
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        });

        // Extract and format the data
        const animeList = response.data.data.Page.media.map((anime: any) => ({
          id: anime.id,
          title: anime.title.english || anime.title.romaji || anime.title.native,
          japanese_title: anime.title.native || anime.title.romaji,
          episodes: anime.nextAiringEpisode ? anime.nextAiringEpisode.episode - 1 : anime.episodes || "TBA",
          rating: anime.averageScore ? anime.averageScore / 10 : "N/A", // Convert to 10-point scale
          image: anime.coverImage.large,
          synopsis: anime.description ? anime.description.replace(/<br\s*\/?>/g, ' ').replace(/<[^>]*>/g, '') : "No synopsis available",
        }));

        const pageInfo = response.data.data.Page.pageInfo;
        
        setAnime(animeList);
        setHasNextPage(pageInfo.hasNextPage);
        setHasPrevPage(page > 1); 
        setTotalPages(pageInfo.lastPage || 1);
        setLoading(false);
      } catch(error: any) {
        console.error("Error fetching anime data:", error);
        setLoading(false);
      }
    }

    useEffect(() => {
        setIsMounted(true);
        fetchAnimes();
    }, [filter, page]);

    // Calculate page buttons to show
    const getPageNumbers = () => {
      const pageButtons = [];
      const maxButtons = window.innerWidth < 640 ? 3 : 5; // Show fewer buttons on mobile
      
      let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
      const endPage = Math.min(totalPages, startPage + maxButtons - 1);
      
      // Adjust start page if we're near the end
      startPage = Math.max(1, endPage - maxButtons + 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pageButtons.push(i);
      }
      
      return pageButtons;
    }

    // Skeleton loader component for anime cards
    const AnimeSkeleton = () => {
      return (
        <Card className="bg-[#141430]/50 rounded-xl overflow-hidden border-0">
          <div className="relative aspect-[3/4] overflow-hidden">
            <Skeleton className="absolute inset-0 bg-indigo-950/40" />
          </div>
          <CardHeader className="p-3">
            <Skeleton className="h-5 w-full mb-2 bg-indigo-950/40" />
            <div className="flex justify-between mt-1">
              <Skeleton className="h-3 w-12 bg-indigo-950/40" />
              <Skeleton className="h-3 w-12 bg-indigo-950/40" />
            </div>
            <div className="mt-2 space-y-1">
              <Skeleton className="h-2 w-full bg-indigo-950/40" />
              <Skeleton className="h-2 w-3/4 bg-indigo-950/40" />
              <Skeleton className="h-2 w-5/6 bg-indigo-950/40" />
            </div>
          </CardHeader>
        </Card>
      );
    };

    if (!isMounted) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#0a0914]">
            <Navbar />
            
            <div className="container mx-auto px-4 py-20">
                <h1 className="text-3xl font-bold mb-8 text-white capitalize">
                    {filter === 'upcoming' ? 'Upcoming Anime' : filter === 'airing' ? 'Currently Airing Anime' : filter === 'popular' ? 'Popular Anime' : filter === 'liked' ? 'Most Liked Anime' : 'Anime List'}
                </h1>

                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {[...Array(20)].map((_, index) => (
                            <AnimeSkeleton key={index} />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {anime.map((anime: Anime) => (
                                <Card key={anime.id} className="bg-[#141430]/50 rounded-xl overflow-hidden hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 group border-0">
                                    <Link href={`/anime/details/${anime.id}`} className="block h-full">
                                        <div className="relative aspect-[3/4] overflow-hidden">
                                            <Image 
                                                src={anime.image} 
                                                alt={anime.title} 
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                className="object-cover group-hover:scale-105 transition-transform duration-300" 
                                            />
                                        </div>
                                        <CardHeader className="p-3">
                                            <CardTitle className="text-sm sm:text-base font-medium text-white line-clamp-2">
                                                {anime.title}
                                            </CardTitle>
                                            <div className="flex justify-between text-xs text-indigo-300/70 mt-1">
                                                <CardDescription className="text-xs">Ep: {anime.episodes}</CardDescription>
                                                <CardDescription className="text-xs">⭐ {anime.rating}</CardDescription>
                                            </div>
                                                <CardDescription className="text-xs text-gray-400 mt-1 line-clamp-3">
                                                {anime.synopsis.length > 100 ? `${anime.synopsis.slice(0, 100)}...` : anime.synopsis}
                                                </CardDescription>
                                        </CardHeader>
                                    </Link>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination */}
                        {(hasNextPage || hasPrevPage || page > 1) && (
                            <div className="mt-10 flex items-center justify-center">
                                <div className="flex items-center space-x-2">
                                    {/* First page button */}
                                    <button 
                                        onClick={() => goToPage(1)} 
                                        disabled={page === 1}
                                        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                                            page === 1 
                                                ? 'text-gray-500 cursor-not-allowed' 
                                                : 'text-indigo-300 hover:bg-indigo-900/40 hover:text-white'
                                        }`}
                                        aria-label="Go to first page"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="11 17 6 12 11 7"></polyline>
                                            <polyline points="18 17 13 12 18 7"></polyline>
                                        </svg>
                                    </button>
                                    
                                    {/* Previous button */}
                                    <button 
                                        onClick={prevPage} 
                                        disabled={page === 1}
                                        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                                            page === 1 
                                                ? 'text-gray-500 cursor-not-allowed' 
                                                : 'text-indigo-300 hover:bg-indigo-900/40 hover:text-white'
                                        }`}
                                        aria-label="Previous page"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="15 18 9 12 15 6"></polyline>
                                        </svg>
                                    </button>
                                    
                                    {/* Page numbers */}
                                    {getPageNumbers().map(pageNum => (
                                        <button 
                                            key={pageNum} 
                                            onClick={() => goToPage(pageNum)}
                                            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                                                pageNum === page 
                                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
                                                    : 'text-indigo-300 hover:bg-indigo-900/40 hover:text-white'
                                            }`}
                                            aria-label={`Page ${pageNum}`}
                                            aria-current={pageNum === page ? 'page' : undefined}
                                        >
                                            {pageNum}
                                        </button>
                                    ))}
                                    
                                    {/* Next button */}
                                    <button 
                                        onClick={nextPage} 
                                        disabled={!hasNextPage}
                                        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                                            !hasNextPage 
                                                ? 'text-gray-500 cursor-not-allowed' 
                                                : 'text-indigo-300 hover:bg-indigo-900/40 hover:text-white'
                                        }`}
                                        aria-label="Next page"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="9 18 15 12 9 6"></polyline>
                                        </svg>
                                    </button>
                                    
                                    {/* Last page button */}
                                    <button 
                                        onClick={() => goToPage(totalPages)} 
                                        disabled={page === totalPages || !hasNextPage}
                                        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                                            page === totalPages || !hasNextPage
                                                ? 'text-gray-500 cursor-not-allowed' 
                                                : 'text-indigo-300 hover:bg-indigo-900/40 hover:text-white'
                                        }`}
                                        aria-label="Go to last page"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="13 17 18 12 13 7"></polyline>
                                            <polyline points="6 17 11 12 6 7"></polyline>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Page indicator */}
                        <div className="mt-4 text-center text-sm text-gray-400">
                            Page {page} of {totalPages || '?'}
                        </div>
                    </>
                )}
            </div>
            <Footer />
        </div>
    );
}