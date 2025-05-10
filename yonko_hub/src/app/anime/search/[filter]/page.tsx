'use client';

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
} from "@/components/ui/card";

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
  const searchQuery = params.filter as string;
  const [animeResults, setAnimeResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  const fetchSearchResults = async () => {
    try {
      setLoading(true);
      
      // GraphQL query for AniList
      const query = `
        query ($search: String) {
          Page(perPage: 20) {
            pageInfo {
              total
            }
            media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
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
            }
          }
        }
      `;
      
      const variables = {
        search: decodeURIComponent(searchQuery)
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
      
      const results = response.data.data.Page.media.map((anime: any) => ({
        id: anime.id,
        title: anime.title.english || anime.title.romaji,
        japanese_title: anime.title.native || anime.title.romaji,
        episodes: anime.episodes || "TBA",
        synopsis: anime.description 
          ? anime.description.replace(/<br\s*\/?>/g, ' ').replace(/<[^>]*>/g, '')
          : "No synopsis available",
        rating: anime.averageScore ? anime.averageScore / 10 : 0,
        image: anime.coverImage.large
      }));
      
      setAnimeResults(results);
      setTotalResults(response.data.data.Page.pageInfo.total);
      setLoading(false);
    } catch (error: any) {
      console.error("Error fetching search results:", error.response?.data?.message || error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchSearchResults();
  }, [searchQuery]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0914] text-gray-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-3xl font-bold mb-4 text-white">
          Search Results for <span className="text-indigo-400">"{decodeURIComponent(searchQuery)}"</span>
        </h1>
        <p className="text-gray-400 mb-8">{totalResults} anime found</p>

        {loading ? (
          <div className="flex justify-center items-center h-[50vh]">
            <PacmanLoader color="#625fff" size={30} />
          </div>
        ) : animeResults.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {animeResults.map((anime) => (
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
                    <CardDescription className="text-xs text-gray-400 line-clamp-1">
                      {anime.japanese_title}
                    </CardDescription>
                    <div className="flex justify-between text-xs text-indigo-300/70 mt-1">
                      <CardDescription className="text-xs">Ep: {anime.episodes}</CardDescription>
                      <CardDescription className="text-xs">★ {anime.rating}</CardDescription>
                    </div>
                      <CardDescription className="text-xs text-gray-400 line-clamp-2 mt-1">
                        {anime.synopsis.length > 100 ? `${anime.synopsis.slice(0, 100)}...` : anime.synopsis}
                        </CardDescription>
                  </CardHeader>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-indigo-300 mb-2">No results found</h2>
            <p className="text-gray-400 mb-6">We couldn't find any anime matching your search query.</p>
            <Link href="/anime/genre">
              <div className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg">
                Browse By Genre
              </div>
            </Link>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}