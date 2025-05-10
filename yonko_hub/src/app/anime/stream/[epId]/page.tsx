'use client';

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useParams } from "next/navigation";
import axios from "axios";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import VideoJS from "@/components/VideoJS";
import MobileVideoPlayer from "@/components/MobileVideoPlayer";
import useMyStore from "@/components/myStore";
import { motion } from "framer-motion";
import videojs from "video.js";
import CommentSection from "@/components/commentComponent";

interface VideoSource {
    url: string;
    isM3U8: boolean;
    quality: string;
    isDub: boolean;
}

interface zoroEp {
    headers?: {
        Referer: string;
    };
    sources: {
        url: string;
        isM3U8: boolean;
        type: string;
    }[];
    subtitles: [{
        url: string;
        lang: string;
    }];
}

interface paheEp {
    headers?: {
        Referer: string;
    };
    sources: VideoSource[];
    sub: [{
        url: string;
        lang: string;
    }];
}


export default function Page() {
    const params = useParams();
    const epId = decodeURIComponent(params.epId as string);
    const paheId = `${epId.split('+')[0]}/${epId.split('+')[1]}`;
    const zoroId = epId.split('+')[2];
    const epiId = epId.split('+')[3];
    const animeId = epId.split('+')[4];
    const token = localStorage.getItem('token') || null;
    
    const [episodeData, setEpisodeData] = useState<paheEp | zoroEp | null>(null);
    const [loadingStates, setLoadingStates] = useState({
        mainInfo: true,
        videoSource: true,
        episodeList: true
    });
    const [error, setError] = useState<string | null>(null);
    const [selectedQuality, setSelectedQuality] = useState<string>('');
    const [selectedSource, setSelectedSource] = useState<any>(null);
    const [isPahe, setIsPahe] = useState(false);
    const [audioType, setAudioType] = useState<'sub' | 'dub'>('sub');
    const [_player, setPlayer] = useState<any>(null);
    const [_animeEPData, setAnimeEPData] = useState<any>([]);
    const animeEpData = useMyStore((state) => state.data);

    const [prevEpisode, setPrevEpisode] = useState<any>(null);
    const [nextEpisode, setNextEpisode] = useState<any>(null);

    // Mobile player support
    const [useNativePlayer, setUseNativePlayer] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Comments state

    const [commentText, setCommentText] = useState("");

    
    // Detect if the user is on a mobile device
    const detectMobile = () => {
        if (typeof window !== 'undefined') {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        }
        return false;
    };

    // Initialize mobile detection on mount
    useEffect(() => {
        const mobile = detectMobile();
        setIsMobile(mobile);
        
        // Default to native player on mobile devices
        if (mobile) {
            setUseNativePlayer(true);
        }
    }, []);

    

    
    const fetchPahe = async () => {
        try {
            const url = `http://localhost:5000/api/watch/${paheId}`;
            
            
            const response = await axios.get(url);
            
            if (response.data && response.data.sources && response.data.sources.length > 0) {
                setIsPahe(true);
                setEpisodeData(response.data);
                return response.data;
            } else {
                return fetchZoro();
            }
        } catch (error) {
            console.error("Error fetching Pahe data:", error);
            return fetchZoro();
        }
    }

    const fetchZoro = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/zoro/${zoroId}`);
            
            
            if (response.data && response.data.sources && response.data.sources.length > 0) {
                setIsPahe(false);
                setEpisodeData(response.data);
                return response.data;
            } else {
                setError("No streaming data found for this episode");
                return null;
            }
        } catch (error) {
            console.error("Error fetching Zoro data:", error);
            setError("Failed to load streaming data");
            return null;
        }
    }

    const fetchEpisodeData = async () => {
        setLoadingStates(prev => ({...prev, videoSource: true}));
        const [paheMain, paheSub] = epId.split('+');
        
        let data;
        if (paheMain === 'undefined' && paheSub === 'undefined') {
            data = await fetchZoro();
        } else {
            data = await fetchPahe();
        }
        
        if (data) {
            if (isPahe && data.sources && data.sources.length > 0) {
                const subSources = data.sources.filter((source: VideoSource) => !source.isDub);
                const defaultSource = subSources.length > 0 ? subSources[subSources.length - 1] : data.sources[0];
                setSelectedQuality(defaultSource.quality);
                setSelectedSource(defaultSource);
            } else if (!isPahe && data.sources && data.sources.length > 0) {
                setSelectedSource(data.sources[0]);
            }
        }
        
        setLoadingStates(prev => ({...prev, videoSource: false, mainInfo: false}));
    }

    const fetchEpisodeList = async () => {
        setLoadingStates(prev => ({...prev, episodeList: true}));
        try {
            const response = await axios.get(`http://localhost:5000/api/episodes/${animeId}`);
            const response1 = await axios.get(`http://localhost:5000/api/episodes/${animeId}?provider=zoro`);
            const zoro = response1.data;

            const mappedData = response.data.map((item: any, index: number) => ({
                paheId0: item.id.split('/')[0],
                paheId1: item.id.split('/')[1],
                zoroId: zoro[index]?.id || null,
                epNo: item.number
            }));
            
            setAnimeEPData(mappedData);
            
            calculateEpisodeNavigation(mappedData);
            setLoadingStates(prev => ({...prev, episodeList: false}));

        } catch (error:any) {
            console.error("Error fetching episode list:", error);
            setLoadingStates(prev => ({...prev, episodeList: false}));
        }
    }

    const calculateEpisodeNavigation = (episodes: any[]) => {
        if (!episodes || episodes.length === 0) return;
        
        const currentIndex = episodes.findIndex(ep => 
            ep.paheId0 === epId.split('+')[0] && 
            ep.paheId1 === epId.split('+')[1] && 
            ep.zoroId === epId.split('+')[2] &&
            ep.epNo.toString() === epiId
        );
        
        if (currentIndex === -1) {
            const currentIndexByNumber = episodes.findIndex(ep => 
                ep.epNo.toString() === epiId
            );
            
            if (currentIndexByNumber !== -1) {  
                if (currentIndexByNumber > 0) {
                    setPrevEpisode(episodes[currentIndexByNumber - 1]);
                }
                
                if (currentIndexByNumber < episodes.length - 1) {
                    setNextEpisode(episodes[currentIndexByNumber + 1]);
                }
            }
        } else { 
            if (currentIndex > 0) {
                setPrevEpisode(episodes[currentIndex - 1]);
            }
            
            if (currentIndex < episodes.length - 1) {
                setNextEpisode(episodes[currentIndex + 1]);
            }
        }
    };

    const getPrevEpisodeUrl = () => {
        if (!prevEpisode) return '';
        return `/anime/stream/${encodeURIComponent(`${prevEpisode.paheId0}+${prevEpisode.paheId1}+${prevEpisode.zoroId}+${prevEpisode.epNo}+${animeId || ''}`)}`;
    };

    const getNextEpisodeUrl = () => {
        if (!nextEpisode) return '';
        return `/anime/stream/${encodeURIComponent(`${nextEpisode.paheId0}+${nextEpisode.paheId1}+${nextEpisode.zoroId}+${nextEpisode.epNo}+${animeId || ''}`)}`;
    };

    const handleQualityChange = (quality: string, type: 'sub' | 'dub' = 'sub') => {
        if (!episodeData) return;
        
        if (isPahe) {
            const source = (episodeData as paheEp).sources.find(s => s.quality === quality);
            if (source) {
                setSelectedQuality(quality);
                setSelectedSource(source);
                setAudioType(type);
            }
        }
    }

    const formatVideoOptions = (source: any) => {
        if (!episodeData || !source) return {};
        
        const referer = episodeData.headers?.Referer || '';
        const sourceUrl = source.url;
        
        const baseUrlMatch = sourceUrl.match(/(.*\/)[^/]+$/);
        const baseUrl = baseUrlMatch ? baseUrlMatch[1] : '';
        
        const proxyBaseUrl = 'http://localhost:5000';

        
        const proxyUrl = source.isM3U8 
            ? `${proxyBaseUrl}/api/hls-proxy?url=${encodeURIComponent(sourceUrl)}&referer=${encodeURIComponent(referer)}`
            : `${proxyBaseUrl}/api/proxy?url=${encodeURIComponent(sourceUrl)}&referer=${encodeURIComponent(referer)}`;
        
        return {
            autoplay: false,
            muted: true,
            controls: true,
            responsive: true,
            fluid: true,
            playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
            sources: [
                {
                    src: proxyUrl,
                    type: source.isM3U8 ? 'application/x-mpegURL' : 'video/mp4',
                }
            ],
            html5: {
                vhs: {
                    overrideNative: !videojs.browser.IS_SAFARI,
                    withCredentials: false,
                    handleManifestRedirects: true,
                    limitRenditionByPlayerDimensions: true,
                    maxPlaylistRetries: 5,
                    xhr: {
                        beforeRequest: function(options: any) {
                            if (options.uri && !options.uri.includes('http') && !options.uri.includes('proxy')) {
                                const absoluteUrl = options.uri.startsWith('/') 
                                    ? new URL(options.uri, new URL(sourceUrl).origin).href 
                                    : baseUrl + options.uri;
                                
                               
                                
                                options.uri = `${proxyBaseUrl}/api/hls-proxy?url=${encodeURIComponent(absoluteUrl)}&referer=${encodeURIComponent(referer)}`;
                            }
                            
                            if (!options.headers) options.headers = {};
                            options.headers['Cache-Control'] = 'no-cache';
                            
                            return options;
                        },
                        timeout: 30000
                    }
                }
            },
            tracks: getSubtitleTracks(),
            switchQualityCallback: () => {
                if (episodeData && isPahe) {
                    const sources = (episodeData as paheEp).sources;
                    const currentIndex = sources.findIndex(s => s.quality === selectedQuality);
                    if (currentIndex >= 0 && sources.length > 1) {
                        const nextIndex = (currentIndex + 1) % sources.length;
                        handleQualityChange(sources[nextIndex].quality);
                    }
                }
            },
        };
    };

    const handlePlayerReady = (player: any) => {
        setPlayer(player);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName !== 'INPUT' && 
                document.activeElement?.tagName !== 'TEXTAREA') {
                
                switch(e.code) {
                    case 'Space':
                        e.preventDefault();
                        player.paused() ? player.play() : player.pause();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        player.currentTime(player.currentTime() + 10);
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        player.currentTime(player.currentTime() - 10);
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        player.volume(Math.min(1, player.volume() + 0.1));
                        break;
                    case 'ArrowDown':
                        e.preventDefault();
                        player.volume(Math.max(0, player.volume() - 0.1));
                        break;
                    case 'KeyF':
                        e.preventDefault();
                        if (player.isFullscreen()) {
                            player.exitFullscreen();
                        } else {
                            player.requestFullscreen();
                        }
                        break;
                    case 'KeyM':
                        e.preventDefault();
                        player.muted(!player.muted());
                        break;
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    };

    const getSubtitleTracks = () => {
        if (!episodeData) return [];
        
        if (isPahe && (episodeData as paheEp).sub) {
            return (episodeData as paheEp).sub.map((track, index) => ({
                src: track.url,
                kind: 'subtitles',
                srclang: track.lang.toLowerCase().substring(0, 2),
                label: track.lang,
                default: index === 0
            }));
        } else if (!isPahe && (episodeData as zoroEp).subtitles) {
            return (episodeData as zoroEp).subtitles.map((track, index) => ({
                src: track.url,
                kind: 'subtitles',
                srclang: track.lang.toLowerCase().substring(0, 2),
                label: track.lang,
                default: index === 0
            }));
        }
        
        return [];
    };

    const getSourceGroups = () => {
        if (!episodeData || !isPahe) return { sub: [], dub: [] };
        
        const sources = (episodeData as paheEp).sources;
        return {
            sub: sources.filter(s => !s.isDub),
            dub: sources.filter(s => s.isDub)
        };
    };

    const getMobilePlayerSource = () => {
        if (!episodeData || !selectedSource) return '';
        
        const referer = episodeData.headers?.Referer || '';
        const sourceUrl = selectedSource.url;
        
        const proxyBaseUrl = "http://localhost:5000";
        
        return selectedSource.isM3U8 
            ? `${proxyBaseUrl}/api/hls-proxy?url=${encodeURIComponent(sourceUrl)}&referer=${encodeURIComponent(referer)}`
            : `${proxyBaseUrl}/api/proxy?url=${encodeURIComponent(sourceUrl)}&referer=${encodeURIComponent(referer)}`;
    };

    useEffect(() => {
        setLoadingStates({
            mainInfo: true,
            videoSource: true,
            episodeList: true
        });
        
        fetchEpisodeData();
        
        if(animeEpData.length < 1){
            fetchEpisodeList();
        } else {
            setAnimeEPData(animeEpData);
            calculateEpisodeNavigation(animeEpData);
            setLoadingStates(prev => ({...prev, episodeList: false}));
        }
    }, [epId]);

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0a0914] to-[#0f0f2a] relative overflow-hidden">
            <div className="fixed inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full filter blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full filter blur-[80px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                    <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-blue-600/10 rounded-full filter blur-[70px] animate-pulse" style={{ animationDelay: '3.5s' }}></div>
                </div>
                <div className="absolute inset-0  opacity-[0.02]"></div>
            </div>
            
            <Navbar />
            
            <main className="flex-grow container mx-auto px-4 py-8 mt-20 relative z-10">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative mb-6 rounded-2xl overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/50 via-purple-800/50 to-indigo-900/50 border border-indigo-500/30 backdrop-blur-sm"></div>
                    <div className="relative p-6 flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center">
                            <div className="mr-4">
                                {loadingStates.mainInfo ? (
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                ) : (
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30">
                                        {epiId}
                                    </div>
                                )}
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-wider text-indigo-300 font-medium mb-1 flex items-center">
                                    <span className="inline-block w-2 h-2 rounded-full bg-purple-400 mr-2 animate-pulse"></span>
                                    Now Streaming
                                </div>
                                {loadingStates.mainInfo ? (
                                    <Skeleton className="h-8 w-40" />
                                ) : (
                                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                                        Episode {epiId}
                                    </h1>
                                )}
                            </div>
                        </div>
                        
                        <div className="mt-4 md:mt-0 flex space-x-3">
                            {loadingStates.mainInfo ? (
                                <div className="flex space-x-3">
                                    <Skeleton className="h-10 w-32" />
                                    <Skeleton className="h-10 w-32" />
                                </div>
                            ) : (
                                <>
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                                        <Link href={animeId ? `/anime/watch/${animeId}` : "/anime"}>
                                            <Button className="bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-100 border border-indigo-500/50 backdrop-blur-sm transition-all duration-300 shadow-lg shadow-indigo-900/20">
                                                Back to Series
                                            </Button>
                                        </Link>
                                    </motion.div>
                                    {nextEpisode && (
                                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                                            <Link href={getNextEpisodeUrl()}>
                                                <Button variant="default" className="bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-900/30">
                                                    Next Episode
                                                </Button>
                                            </Link>
                                        </motion.div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>
                
                {loadingStates.videoSource ? (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full mx-auto relative aspect-video bg-[#0c0d24]/30 backdrop-blur-sm rounded-2xl border border-indigo-500/20 shadow-2xl mb-6 flex flex-col items-center justify-center"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-purple-600/5"></div>
                        
                        <div className="w-full h-full p-6 flex flex-col items-center justify-center">
                            <Skeleton className="w-16 h-16 rounded-full mb-6" />
                            <Skeleton className="w-48 h-5 mb-3" />
                            <Skeleton className="w-64 h-4" />
                            
                            <div className="absolute bottom-8 left-0 right-0 px-8">
                                <Skeleton className="w-full h-2 mb-4" />
                                <div className="flex justify-between">
                                    <Skeleton className="w-32 h-8" />
                                    <div className="flex space-x-2">
                                        <Skeleton className="w-8 h-8 rounded-full" />
                                        <Skeleton className="w-8 h-8 rounded-full" />
                                        <Skeleton className="w-8 h-8 rounded-full" />
                                    </div>
                                    <Skeleton className="w-32 h-8" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : error ? (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center h-[60vh] bg-[#0c0d24]/30 backdrop-blur-sm rounded-2xl border border-indigo-500/20 shadow-2xl p-6 text-center relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-purple-600/5"></div>
                        <div className="relative z-10">
                            <div className="text-red-400 text-xl mb-6 font-medium">{error}</div>
                            <div className="flex flex-col space-y-4">
                                <p className="text-indigo-200 mb-4">Sorry, we couldn't find this episode. Please try another source or episode.</p>
                                <Link href="/anime">
                                    <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-900/30">
                                        Go Home
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                ) : selectedSource ? (
                    <div>
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="w-full mx-auto relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-indigo-500/20 group"
                        >
                            <div className="absolute inset-0 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/70 via-transparent to-black/30"></div>
                            
                            {isMobile && (
                                <div className="absolute top-2 right-2 z-30">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-black/70 text-xs text-white border-white/20 hover:bg-black/90"
                                        onClick={() => setUseNativePlayer(!useNativePlayer)}
                                    >
                                        {useNativePlayer ? "Use VideoJS" : "Use Native Player"}
                                    </Button>
                                </div>
                            )}
                            
                            {useNativePlayer && isMobile ? (
                                <MobileVideoPlayer 
                                    src={getMobilePlayerSource()}
                                    poster={undefined}
                                />
                            ) : (
                                <VideoJS 
                                    options={formatVideoOptions(selectedSource)} 
                                    onReady={handlePlayerReady} 
                                />
                            )}
                        </motion.div>
                        
                        {isPahe && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="mt-6 backdrop-blur-lg rounded-2xl overflow-hidden border border-indigo-500/20 shadow-xl"
                            >
                                <div className="bg-gradient-to-r from-indigo-800/30 via-purple-700/30 to-indigo-800/30 p-4">
                                    <div className="flex items-center space-x-2">
                                        <div className="h-4 w-4 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500"></div>
                                        <h2 className="text-lg font-medium text-white">Playback Settings</h2>
                                    </div>
                                </div>
                                
                                <div className="p-5 bg-indigo-900/20">
                                    <div className="flex mb-4 border-b border-indigo-500/20 pb-4">
                                        <Button 
                                            variant={audioType === 'sub' ? "default" : "outline"}
                                            className={`mr-2 ${audioType === 'sub' 
                                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md shadow-indigo-500/30 border-none' 
                                                : 'bg-transparent border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/20'}`}
                                            onClick={() => setAudioType('sub')}
                                        >
                                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M3 8C3 7.44772 3.44772 7 4 7H20C20.5523 7 21 7.44772 21 8V16C21 16.5523 20.5523 17 20 17H4C3.44772 17 3 16.5523 3 16V8Z" stroke="currentColor" strokeWidth="2"/>
                                                <path d="M7 13H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                                <path d="M13 13H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                            </svg>
                                            Subbed
                                        </Button>
                                        <Button 
                                            variant={audioType === 'dub' ? "default" : "outline"}
                                            className={`${audioType === 'dub' 
                                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md shadow-indigo-500/30 border-none' 
                                                : 'bg-transparent border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/20'}`}
                                            disabled={getSourceGroups().dub.length === 0}
                                            onClick={() => setAudioType('dub')}
                                        >
                                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12 18.5C15.5899 18.5 18.5 15.5899 18.5 12C18.5 8.41015 15.5899 5.5 12 5.5C8.41015 5.5 5.5 8.41015 5.5 12C5.5 15.5899 8.41015 18.5 12 18.5Z" stroke="currentColor" strokeWidth="2"/>
                                                <path d="M19 6L5 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                            </svg>
                                            Dubbed
                                        </Button>
                                    </div>
                                    
                                    {audioType === 'sub' && getSourceGroups().sub.length > 0 && (
                                        <div className="mb-2">
                                            <h3 className="text-white text-base font-medium mb-3 flex items-center">
                                                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M8 15L12 19L16 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M8 9L12 5L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                                Quality Options
                                            </h3>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                                {getSourceGroups().sub.map((source, index) => (
                                                    <motion.div 
                                                        key={`sub-${index}`}
                                                        whileHover={{ scale: 1.03 }}
                                                        whileTap={{ scale: 0.97 }}
                                                    >
                                                        <Button 
                                                            variant={selectedQuality === source.quality ? "default" : "outline"}
                                                            className={`w-full ${selectedQuality === source.quality 
                                                                ? 'bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-none' 
                                                                : 'bg-indigo-500/10 hover:bg-indigo-600/20 border-indigo-500/30 text-indigo-100 hover:text-white'}`}
                                                            onClick={() => handleQualityChange(source.quality, 'sub')}
                                                        >
                                                            {source.quality.split(' · ')[1]}
                                                        </Button>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {audioType === 'dub' && getSourceGroups().dub.length > 0 && (
                                        <div className="mb-2">
                                            <h3 className="text-white text-base font-medium mb-3 flex items-center">
                                                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M8 15L12 19L16 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M8 9L12 5L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                                Quality Options
                                            </h3>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                                {getSourceGroups().dub.map((source, index) => (
                                                    <motion.div 
                                                        key={`dub-${index}`}
                                                        whileHover={{ scale: 1.03 }}
                                                        whileTap={{ scale: 0.97 }}
                                                    >
                                                        <Button 
                                                            variant={selectedQuality === source.quality ? "default" : "outline"}
                                                            className={`w-full ${selectedQuality === source.quality 
                                                                ? 'bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-none' 
                                                                : 'bg-indigo-500/10 hover:bg-indigo-600/20 border-indigo-500/30 text-indigo-100 hover:text-white'}`}
                                                            onClick={() => handleQualityChange(source.quality, 'dub')}
                                                        >
                                                            {source.quality.split(' · ')[1]}
                                                        </Button>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {audioType === 'dub' && getSourceGroups().dub.length === 0 && (
                                        <div className="p-4 text-center rounded-xl bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border border-indigo-500/20">
                                            <svg className="w-6 h-6 mx-auto mb-2 text-indigo-300 opacity-70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                                <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="currentColor" strokeWidth="2"/>
                                                <path d="M19 5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                            </svg>
                                            <div className="text-indigo-200 font-medium">
                                                No dubbed version available for this episode
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                        
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="mt-6 grid grid-cols-2 gap-4"
                        >
                            {loadingStates.episodeList ? (
                                <>
                                    <Skeleton className="h-14 w-full rounded-xl" />
                                    <Skeleton className="h-14 w-full rounded-xl" />
                                </>
                            ) : (
                                <>
                                    {prevEpisode ? (
                                        <Link href={getPrevEpisodeUrl()} className="w-full">
                                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                                <Button 
                                                    variant="outline" 
                                                    className="w-full h-14 border border-indigo-500/50 bg-indigo-900/20 backdrop-blur-sm text-indigo-100 rounded-xl
                                                        hover:bg-indigo-600/30 hover:text-white hover:border-indigo-400 
                                                        transition-all duration-300 font-medium text-sm relative overflow-hidden group"
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                                    <span className="relative z-10 flex items-center justify-center">
                                                        <svg className="w-5 h-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path d="M15 19l-7-7 7-7"></path>
                                                        </svg>
                                                        Episode {prevEpisode.epNo}
                                                    </span>
                                                </Button>
                                            </motion.div>
                                        </Link>
                                    ) : (
                                        <Button 
                                            variant="outline" 
                                            disabled
                                            className="w-full h-14 border border-indigo-500/50 bg-indigo-900/20 backdrop-blur-sm text-indigo-100 rounded-xl opacity-50"
                                        >
                                            <span className="relative z-10 flex items-center justify-center">
                                                <svg className="w-5 h-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path d="M15 19l-7-7 7-7"></path>
                                                </svg>
                                                No Previous Episode
                                            </span>
                                        </Button>
                                    )}

                                    {nextEpisode ? (
                                        <Link href={getNextEpisodeUrl()} className="w-full">
                                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                                <Button 
                                                    variant="outline"
                                                    className="w-full h-14 border border-indigo-500/50 bg-gradient-to-r from-indigo-600/30 to-purple-600/30 backdrop-blur-sm text-white rounded-xl
                                                        hover:from-indigo-600/50 hover:to-purple-600/50 hover:border-indigo-400 
                                                        transition-all duration-300 font-medium text-sm relative overflow-hidden group"
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                                    <span className="relative z-10 flex items-center justify-center">
                                                        Episode {nextEpisode.epNo}
                                                        <svg className="w-5 h-5 ml-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path d="M9 5l7 7-7 7"></path>
                                                        </svg>
                                                    </span>
                                                </Button>
                                            </motion.div>
                                        </Link>
                                    ) : (
                                        <Button 
                                            variant="outline" 
                                            disabled
                                            className="w-full h-14 border border-indigo-500/50 bg-indigo-900/20 backdrop-blur-sm text-indigo-100 rounded-xl opacity-50"
                                        >
                                            <span className="relative z-10 flex items-center justify-center">
                                                No Next Episode
                                                <svg className="w-5 h-5 ml-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path d="M9 5l7 7-7 7"></path>
                                                </svg>
                                            </span>
                                        </Button>
                                    )}
                                </>
                            )}
                        </motion.div>

                        {/* Comments section */}
                        <CommentSection animeId={epiId+animeId} token={token}/>
                       
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-[60vh] bg-[#0c0d24]/50 backdrop-blur-sm rounded-xl border border-indigo-500/20 shadow-lg p-6 text-center">
                        <div className="text-indigo-200 text-lg">
                            No playable sources found for this episode.
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}