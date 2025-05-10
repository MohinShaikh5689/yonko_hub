'use client'

import Image from "next/image";
import { useParams } from "next/navigation";
import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface VoiceActor {
  id: number;
  name: {
    full: string;
  };
  image: string;
  language: string;
}

interface Character {
  id: number;
  name: {
    full: string;
  };
  image: string;
  role: string;
  voiceActors: VoiceActor[];
}

interface Anime {
  id: string;
  title: {
    romaji: string;
    english: string;
    native: string;
  };
  synonyms: string[];
  image: string;
  cover: string;
  description: string;
  status: string;
  releaseDate: number;
  color: string;
  episodes: {
    sub: number;
    dub: number;
  };
  trailer: {
    id: string;
    site: string;
    thumbnail: string;
  };
  totalEpisodes: number;
  currentEpisode: number;
  rating: number;
  duration: number;
  genres: string[];
  season: string;
  studios: string[];
  characters: Character[];
}

interface Recommendation {
  id: number;
  image: string;
  rating: number;
  title: string;
}

export default function Page() {
  const params = useParams();
  const id = params.filter as string;
  const [anime, setAnime] = useState<Anime>();
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [relation, setRelation] = useState<any[]>([]);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    mainContent: true,
    characters: true,
    relations: true,
    recommendations: true,
  });
  const token = localStorage.getItem("token");

  const fetchAnimedetails = useCallback(async () => {
    try {
      setLoadingStates((prev) => ({ ...prev, mainContent: true }));

      const response = await axios.get(
        `http://localhost:5000/api/info/${id}`
      );
      const animeData = response.data;

      if (!animeData) {
        setLoading(false);
        return;
      }
      setAnime(animeData);
      setLoadingStates((prev) => ({ ...prev, mainContent: false }));

      if (animeData.id) {
        checkWatchlist(animeData.id);
      }

      setTimeout(() => {
        if (animeData.characters) {
          animeData.characters = animeData.characters.sort(
            (a: Character, b: Character) => {
              if (a.role === "MAIN" && b.role !== "MAIN") return -1;
              if (a.role !== "MAIN" && b.role === "MAIN") return 1;
              return a.name.full.localeCompare(b.name.full);
            }
          );
        }
        setLoadingStates((prev) => ({ ...prev, characters: false }));

        setRelation(animeData.relations?.slice(0, 5) || []);
        setLoadingStates((prev) => ({ ...prev, relations: false }));

        const mappedRecommendations =
          animeData.recommendations?.map((rec: any) => ({
            id: rec.id,
            image: rec.image,
            rating: rec.rating,
            title: rec.title.english || rec.title.romaji,
          })) || [];

        setRecommendations(mappedRecommendations);
        setLoadingStates((prev) => ({ ...prev, recommendations: false }));
        setLoading(false);
      }, 100);
    } catch (error: any) {
      console.error(
        "Error fetching anime details:",
        error.response?.data?.message || error.message
      );
      setLoading(false);
      setLoadingStates({
        mainContent: false,
        characters: false,
        relations: false,
        recommendations: false,
      });
    }
  }, [id]);

  const checkWatchlist = async (animeId?: string) => {
    if (!token) {
      console.error("User is not authenticated");
      return;
    } else {
      try {
        const idToUse = animeId || anime?.id;
        if (!idToUse) {
          console.error("No anime id available for watchlist check");
          return;
        }

        const response = await axios.post(
          "http://localhost:3001/api/watchlist/check",
          {
            AnimeId: idToUse,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.data.response === true) {
          setInWatchlist(true);
        } else {
          setInWatchlist(false);
        }
      } catch (error: any) {
        console.error(
          "Error checking watchlist:",
          error.response?.data?.message || error.message
        );
      }
    }
  };

  const addToWatchlist = async () => {
    if (!token) {
      console.error("User is not authenticated");
      return;
    } else if (!anime?.id) {
      console.error("No anime id available");
      return;
    } else {
      try {
        const response = await axios.post(
          "http://localhost:3001/api/watchlist/add",
          {
            AnimeId: parseInt(anime.id),
            English_Title: anime?.title.english,
            Japanese_Title: anime?.title.romaji,
            Image_url: anime?.image,
            synopsis: anime?.description,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.message === "Anime added to watchlist") {
          setInWatchlist(true);
        }
      } catch (error: any) {
        console.error(
          "Error adding to watchlist:",
          error.response?.data?.message || error.message
        );
      }
    }
  };

  const removeFromWatchlist = async () => {
    if (!token) {
      console.error("User is not authenticated");
      return;
    } else if (!anime?.id) {
      console.error("No anime id available");
      return;
    } else {
      try {
        const response = await axios.delete(
          "http://localhost:3001//api/watchlist/delete",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            data: {
              AnimeId: parseInt(anime.id),
            },
          }
        );
        if (response.data.message === "Anime removed from watchlist") {
          setInWatchlist(false);
        }
      } catch (error: any) {
        console.error(
          "Error removing from watchlist:",
          error.response?.data?.message || error.message
        );
      }
    }
  };

  const scrollTOTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  useEffect(() => {
    scrollTOTop();
    setIsMounted(true);
    fetchAnimedetails();
  }, [id, fetchAnimedetails]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0914] text-gray-100">
      <Navbar />

      {loadingStates.mainContent ? (
        <div className="relative w-full">
          <div className="relative container mx-auto px-4 pt-40 pb-16 md:pt-48 md:pb-24">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="w-48 md:w-64 flex-shrink-0 z-10">
                <Skeleton className="aspect-[3/4] rounded-xl" />
              </div>
              <div className="z-10 w-full max-w-2xl">
                <Skeleton className="h-8 w-24 mb-4" />
                <Skeleton className="h-12 w-full mb-3" />
                <Skeleton className="h-8 w-1/2 mb-4" />
                <div className="flex flex-wrap gap-2 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-6 w-16 rounded-full" />
                  ))}
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Skeleton className="h-10 w-40" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-28" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : anime ? (
        <>
          <div className="relative w-full">
            <div className="absolute inset-0 w-full h-[50vh] md:h-[60vh]">
              <div className="absolute inset-0 bg-gradient-to-b from-[#0a0914]/70 via-[#0a0914]/90 to-[#0a0914]"></div>
              <Image
                src={anime.cover || anime.image}
                alt={anime.title.english || anime.title.romaji}
                fill
                sizes="100vw"
                className="object-cover blur-sm"
                priority
              />
            </div>

            <div className="relative container mx-auto px-4 pt-40 pb-16 md:pt-48 md:pb-24">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-48 md:w-64 flex-shrink-0 z-10">
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-xl shadow-indigo-500/30 border border-indigo-500/30 transform hover:scale-105 transition-transform duration-300">
                    <Image
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      src={anime.image}
                      alt={anime.title.english || anime.title.romaji}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>

                <div className="z-10">
                  <div className="inline-block px-3 py-1 bg-purple-500/30 rounded-full text-xs text-purple-300 font-medium mb-4">
                    {anime.studios && anime.studios[0]}
                  </div>
                  <h1 className="text-3xl md:text-5xl font-bold mb-3 text-white text-shadow-lg">
                    {anime.title.english || anime.title.romaji}
                  </h1>
                  <h2 className="text-xl text-indigo-200/80 mb-4">
                    {anime.title.native}
                  </h2>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {anime.genres.map((genre, index) => (
                      <span
                        key={index}
                        className="px-2.5 py-1 bg-indigo-600/30 rounded-full text-xs text-indigo-200"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    {anime.rating > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-12 h-12 bg-indigo-500/20 rounded-full">
                          <span className="text-xl font-bold text-yellow-400">
                            {(anime.rating / 10).toFixed(1)}
                          </span>
                        </span>
                        <div className="text-sm">
                          <p className="text-gray-400">Rating</p>
                          <p className="text-yellow-400">
                            ★ {(anime.rating / 10).toFixed(1)}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-12 h-12 bg-indigo-500/20 rounded-full">
                        <span className="text-md font-bold text-indigo-300">
                          {anime.totalEpisodes}
                        </span>
                      </span>
                      <div className="text-sm">
                        <p className="text-gray-400">Episodes</p>
                        <p className="text-indigo-300">
                          {anime.duration ? `${anime.duration} mins` : "Unknown"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {inWatchlist ? (
                      <Button
                        variant="outline"
                        className="border-red-500/50 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                        onClick={removeFromWatchlist}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Remove from Watchlist
                      </Button>
                    ) : (
                      <Button
                        onClick={addToWatchlist}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/30"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        Add to Watchlist
                      </Button>
                    )}
                    <Link href={`/anime/watch/${anime.id}`} className="w-full">
                      <Button className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-medium px-6 shadow-lg shadow-rose-500/30 border-0 relative overflow-hidden group">
                        <span className="absolute inset-0 w-0 bg-white opacity-20 transition-all duration-300 group-hover:w-full"></span>
                        <span className="relative z-10 flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Watch Now
                        </span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="col-span-1 lg:col-span-2">
                <div className="bg-[#141430]/60 backdrop-blur-sm p-6 rounded-xl border border-indigo-500/20 mb-8">
                  <h3 className="text-xl font-medium text-indigo-300 mb-4">
                    Synopsis
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {anime.description
                      ? anime.description.replace(/<[^>]*>/g, "")
                      : "No synopsis available"}
                  </p>
                </div>

                {loadingStates.characters ? (
                  <div className="bg-[#141430]/60 backdrop-blur-sm p-6 rounded-xl border border-indigo-500/20">
                    <div className="flex items-center mb-6">
                      <Skeleton className="h-8 w-8 rounded-full mr-2" />
                      <Skeleton className="h-8 w-32" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="bg-[#0c0c20]/70 rounded-lg overflow-hidden border border-indigo-500/20"
                        >
                          <Skeleton className="aspect-[3/4] w-full" />
                          <div className="p-3">
                            <Skeleton className="h-5 w-full mb-2" />
                            <Skeleton className="h-4 w-2/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  anime.characters &&
                  anime.characters.length > 0 && (
                    <div className="bg-[#141430]/60 backdrop-blur-sm p-6 rounded-xl border border-indigo-500/20">
                      <h3 className="text-xl font-medium text-indigo-300 mb-6">
                        <span className="inline-block mr-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        </span>
                        Characters
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {anime.characters.slice(0, 8).map((character) => (
                          <div
                            key={character.id}
                            className="bg-[#0c0c20]/70 rounded-lg overflow-hidden border border-indigo-500/20 hover:border-indigo-500/40 transition-all hover:shadow-md hover:shadow-indigo-500/20"
                          >
                            <div className="relative aspect-[3/4] w-full">
                              <Image
                                src={character.image}
                                alt={character.name.full}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                loading="lazy"
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs ${
                                    character.role === "MAIN"
                                      ? "bg-indigo-500/70 text-white"
                                      : "bg-gray-700/70 text-gray-300"
                                  }`}
                                >
                                  {character.role}
                                </span>
                              </div>
                            </div>
                            <div className="p-3">
                              <h4 className="text-sm font-medium text-white truncate">
                                {character.name.full}
                              </h4>
                              {character.voiceActors &&
                                character.voiceActors.length > 0 && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <div className="w-6 h-6 rounded-full overflow-hidden relative flex-shrink-0">
                                      <Image
                                        src={character.voiceActors[0].image}
                                        alt={character.voiceActors[0].name.full}
                                        fill
                                        sizes="24px"
                                        className="object-cover"
                                        loading="lazy"
                                      />
                                    </div>
                                    <p className="text-xs text-gray-400 truncate">
                                      VA: {character.voiceActors[0].name.full}
                                    </p>
                                  </div>
                                )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {anime.characters.length > 8 && (
                        <div className="mt-4 text-center">
                          <Button
                            variant="outline"
                            className="border-indigo-500/20 hover:border-indigo-500/40 text-indigo-300"
                          >
                            View All Characters
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>

              <div className="col-span-1 space-y-6">
                <div className="bg-[#141430]/60 backdrop-blur-sm p-5 rounded-xl border border-indigo-500/20">
                  <h3 className="text-lg font-medium text-indigo-300 mb-4">
                    Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status</span>
                      <span className="text-white">{anime.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Episodes</span>
                      <span className="text-white">{anime.totalEpisodes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Studio</span>
                      <span className="text-white">
                        {anime.studios?.join(", ") || "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Duration</span>
                      <span className="text-white">
                        {anime.duration ? `${anime.duration} mins` : "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Season</span>
                      <span className="text-white">
                        {anime.season || "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rating</span>
                      <span className="text-yellow-400">
                        {anime.rating > 0
                          ? `★ ${(anime.rating / 10).toFixed(1)}`
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {anime.trailer ? (
                  <div className="bg-[#141430]/60 backdrop-blur-sm p-5 rounded-xl border border-indigo-500/20">
                    <h3 className="text-lg font-medium text-indigo-300 mb-4">
                      Trailer
                    </h3>
                    <div className="aspect-video w-full rounded-lg overflow-hidden">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${anime.trailer.id}`}
                        title="Anime Trailer"
                        allowFullScreen
                        loading="lazy"
                        className="w-full h-full"
                      ></iframe>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#141430]/60 backdrop-blur-sm p-5 rounded-xl border border-indigo-500/20">
                    <h3 className="text-lg font-medium text-indigo-300 mb-4">
                      Trailer
                    </h3>
                    <div className="aspect-video w-full rounded-lg overflow-hidden bg-[#0c0c20]/70 flex items-center justify-center">
                      <p className="text-gray-400 text-sm">
                        No trailer available
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 p-5 rounded-xl border border-indigo-500/30">
                  <h3 className="text-lg font-medium text-white mb-3">
                    Join the Discussion
                  </h3>
                  <p className="text-indigo-200 text-sm mb-4">
                    Talk with other fans about this anime
                  </p>
                  <Button className="w-full bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/30">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    View Discussions
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {loadingStates.relations ? (
            relation.length > 0 && (
              <div className="container mx-auto px-4 pt-8 pb-8">
                <div className="flex items-center mb-6">
                  <Skeleton className="h-10 w-10 rounded-lg mr-3" />
                  <Skeleton className="h-8 w-40" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                  {[...Array(5)].map((_, i) => (
                    <Card
                      key={i}
                      className="h-full bg-[#141438]/60 backdrop-blur-sm border border-indigo-500/20 overflow-hidden"
                    >
                      <Skeleton className="aspect-[3/4] w-full" />
                      <CardHeader className="p-3">
                        <Skeleton className="h-5 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3" />
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            )
          ) : (
            relation &&
            relation.length > 0 && (
              <div className="container mx-auto px-4 pt-8 pb-8">
                <div className="flex items-center mb-6">
                  <div className="bg-indigo-500/20 p-2 rounded-lg mr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-indigo-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16l-4-4m0 0l4-4m-4 4h18"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-indigo-400">
                    Related Works
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                  {relation.map((rel) => (
                    <Link
                      href={`/anime/details/${rel.id}`}
                      key={rel.id}
                      className="group"
                    >
                      <Card className="h-full bg-[#141438]/60 backdrop-blur-sm border border-indigo-500/20 overflow-hidden hover:border-indigo-500/40 transition-all hover:shadow-lg hover:shadow-indigo-500/20">
                        <div className="relative aspect-[3/4] w-full">
                          <Image
                            src={rel.image}
                            alt={rel.title.english || rel.title.romaji}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

                          <div
                            className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-md px-2 py-1 flex items-center"
                            style={{
                              backgroundColor: rel.color
                                ? `${rel.color}80`
                                : undefined,
                            }}
                          >
                            <span className="text-xs font-medium text-white">
                              {rel.relationType.replace(/_/g, " ")}
                            </span>
                          </div>

                          {rel.rating > 0 && (
                            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm rounded-md px-2 py-1 flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3 text-yellow-400 mr-1"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-xs font-medium text-white">
                                {(rel.rating / 10).toFixed(1)}
                              </span>
                            </div>
                          )}

                          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-indigo-600/90 text-white text-xs font-medium rounded-md backdrop-blur-sm border border-indigo-500/50">
                            {rel.type}
                          </div>

                          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-gray-800/80 text-gray-200 text-xs font-medium rounded-md backdrop-blur-sm">
                            {rel.status}
                          </div>
                        </div>

                        <CardHeader className="p-3">
                          <CardTitle className="text-sm font-medium text-white truncate">
                            {rel.title.english || rel.title.romaji}
                          </CardTitle>
                          <CardDescription className="text-xs text-gray-400">
                            {rel.episodes ? `${rel.episodes} Episodes` : ""}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )
          )}

          {loadingStates.recommendations ? (
            recommendations.length > 0 && (
              <div className="container mx-auto px-4 pt-8 pb-16">
                <div className="flex items-center mb-6">
                  <Skeleton className="h-10 w-10 rounded-lg mr-3" />
                  <Skeleton className="h-8 w-48" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                  {[...Array(5)].map((_, i) => (
                    <Card
                      key={i}
                      className="h-full bg-[#141438]/60 backdrop-blur-sm border border-indigo-500/20 overflow-hidden"
                    >
                      <Skeleton className="aspect-[3/4] w-full" />
                      <CardHeader className="p-3">
                        <Skeleton className="h-5 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3" />
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            )
          ) : (
            recommendations &&
            recommendations.length > 0 && (
              <div className="container mx-auto px-4 pt-8 pb-16">
                <div className="flex items-center mb-6">
                  <div className="bg-indigo-500/20 p-2 rounded-lg mr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-indigo-400"
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
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-indigo-400">
                    You May Also Like
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                  {recommendations.slice(0, 10).map((recommendation) => (
                    <Link
                      href={`/anime/details/${recommendation.id}`}
                      key={recommendation.id}
                      className="group"
                    >
                      <Card className="h-full bg-[#141438]/60 backdrop-blur-sm border border-indigo-500/20 overflow-hidden hover:border-indigo-500/40 transition-all hover:shadow-lg hover:shadow-indigo-500/20">
                        <div className="relative aspect-[3/4] w-full">
                          <Image
                            src={recommendation.image}
                            alt={recommendation.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />

                          {recommendation.rating > 0 && (
                            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-md px-2 py-1 flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3 text-yellow-400 mr-1"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-xs font-medium text-white">
                                {(recommendation.rating / 10).toFixed(1)}
                              </span>
                            </div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-4 left-0 right-0 text-center">
                              <div className="bg-indigo-600/80 mx-auto rounded-full p-2 w-10 h-10 flex items-center justify-center backdrop-blur-sm border border-indigo-500/50 transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 text-white"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>

                        <CardHeader className="p-3">
                          <CardTitle className="text-sm font-medium text-white truncate">
                            {recommendation.title}
                          </CardTitle>
                          <CardDescription className="text-xs text-gray-400">
                            Recommended for you
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )
          )}
        </>
      ) : (
        <div className="flex justify-center items-center h-[80vh]">
          <div className="bg-[#141430]/60 backdrop-blur-sm p-8 rounded-xl border border-indigo-500/20 text-center max-w-md">
            <div className="rounded-full bg-indigo-500/20 w-16 h-16 mx-auto flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-indigo-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-indigo-300 mb-2">
              Anime Not Found
            </h2>
            <p className="text-gray-400 mb-6">
              Sorry, we couldn't find information for this anime.
            </p>
            <Button
              className="bg-gradient-to-r from-indigo-600 to-purple-600"
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}