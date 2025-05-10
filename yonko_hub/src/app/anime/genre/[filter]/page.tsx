'use client'

import Image from "next/image";
import { useParams } from "next/navigation";
import axios from "axios";
import { useEffect, useState } from "react";
import PacmanLoader from "react-spinners/PacmanLoader";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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
  const params = useParams();
  const genreName = params.filter as string;
  const [anime, setAnime] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [genreTitle, setGenreTitle] = useState("");

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

  const fetchAnimeByGenre = async () => {
    try {
      setLoading(true);
      
      // Format genre name correctly for URL decoding
      const decodedGenreName = decodeURIComponent(genreName);
      
      // Set readable title for the page
      setGenreTitle(decodedGenreName.replace(/([A-Z])/g, ' $1').trim());
      
      // GraphQL query for AniList
      const query = `
        query ($page: Int, $perPage: Int, $genre: String) {
          Page(page: $page, perPage: $perPage) {
            pageInfo {
              total
              currentPage
              lastPage
              hasNextPage
              perPage
            }
            media(genre: $genre, type: ANIME, sort: POPULARITY_DESC) {
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
      
      const variables = {
        page: page,
        perPage: 20,
        genre: decodedGenreName
      };
      
      const response = await axios.post('https://graphql.anilist.co', {
        query,
        variables
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
      
      // Extract and format data
      const animeData = response.data.data.Page.media.map((anime: any) => ({
        id: anime.id,
        title: anime.title.english || anime.title.romaji || anime.title.native,
        japanese_title: anime.title.native || anime.title.romaji,
        episodes: anime.episodes || "TBA",
        rating: anime.averageScore ? (anime.averageScore / 10).toFixed(1) : "N/A",
        image: anime.coverImage.large,
        synopsis: anime.description 
          ? anime.description.replace(/<br\s*\/?>/g, ' ').replace(/<[^>]*>/g, '')
          : "No synopsis available",
      }));
      
      // Set state based on results
      setAnime(animeData);
      
      // Extract pagination info
      const pageInfo = response.data.data.Page.pageInfo;
      setHasNextPage(pageInfo.hasNextPage);
      setHasPrevPage(page > 1); // AniList doesn't provide hasPreviousPage directly
      setTotalPages(pageInfo.lastPage || 1);
      
      setLoading(false);
    } catch (error: any) {
      console.error("Error fetching anime by genre:", error.response?.data?.message || error.message);
      setLoading(false);
    }
  }

  useEffect(() => {
    setIsMounted(true);
    fetchAnimeByGenre();
  }, [genreName, page]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0914]">
      <Navbar />
      
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-3xl font-bold mb-8 text-white">
          {genreTitle ? `${genreTitle} Anime` : 'Anime by Genre'}
        </h1>

        {loading ? (
          <div className="flex justify-center items-center h-[50vh]">
            <PacmanLoader color="#8b5cf6" size={30} />
          </div>
        ) : anime.length > 0 ? (
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
                    <CardDescription className="text-xs text-gray-400 line-clamp-2">
                      {anime.japanese_title}
                    </CardDescription>
                    <CardDescription className="text-xs line-clamp-2">
                      {anime.synopsis}
                    </CardDescription>
                    <div className="flex justify-between text-xs text-indigo-300/70 mt-1">
                      <CardDescription className="text-xs">Ep: {anime.episodes}</CardDescription>
                      <CardDescription className="text-xs">★ {anime.rating}</CardDescription>
                    </div>
                  </CardHeader>
                </Link>
              </Card>
            ))}

            {/* Pagination */}
            {(hasNextPage || hasPrevPage || page > 1) && (
              <div className="mt-10 flex items-center justify-center col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-5">
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
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-xl text-indigo-300 mb-4">No anime found for this genre</div>
            <Link href="/anime/genre" className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg">
              Browse All Genres
            </Link>
          </div>
        )}
        
        {/* Page indicator */}
        {!loading && anime.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-400">
            Page {page} of {totalPages || '?'}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}