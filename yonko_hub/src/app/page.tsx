'use client';
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import dynamic from 'next/dynamic';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Import react-slick and its styles
import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

const Navbar = dynamic(() => import('@/components/navbar').then(mod => mod.Navbar), {
  ssr: false,
});

const Footer = dynamic(() => import('@/components/footer').then(mod => mod.Footer), {
  ssr: false,
});

interface Anime {
  id: number;
  title: string;
  episodes: string | number;
  rating: number;
  image: string;
  description: string;
  genres?: string[];
  season?: string;
  year?: number;
}

// Enhanced star particles with more variety and visual appeal
const starParticles = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  width: `${Math.random() * 4 + 1}px`,
  height: `${Math.random() * 4 + 1}px`,
  top: `${Math.random() * 100}%`,
  left: `${Math.random() * 100}%`,
  opacity: Math.random() * 0.7 + 0.3,
  boxShadow: `0 0 ${Math.random() * 15 + 5}px ${Math.random() * 3 + 1}px rgba(${
    Math.random() > 0.7 ? '147, 112, 219' : Math.random() > 0.5 ? '70, 130, 255' : '255, 255, 255'
  }, 0.${Math.floor(Math.random() * 9) + 1})`,
  animation: `twinkle ${Math.random() * 6 + 3}s infinite ${Math.random() * 5}s`
}));

// Enhanced feature cards with more detailed icons and descriptions
const features = [
  {
    title: "Extensive Anime Library",
    description: "Access thousands of anime series and movies, complete with detailed information, ratings, and reviews. Stay updated with seasonal releases and trending series.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-10 h-10">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    gradient: "from-blue-500 to-indigo-600"
  },
  {
    title: "Active Community",
    description: "Connect with fellow anime fans, join discussions, share your thoughts, and make new friends. Participate in weekly events and seasonal celebrations of anime culture.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-10 h-10">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.479m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    gradient: "from-purple-500 to-pink-600"
  },
  {
    title: "Personalized Experience",
    description: "Get tailored anime suggestions based on your watching history, preferences, and favorites. Create custom lists, track your progress, and discover hidden gems.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-10 h-10">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
    gradient: "from-indigo-500 to-cyan-600"
  }
];

export default function Home() {
  const [animeData, setAnimeData] = useState<Anime[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Refs for scroll animations
  const featuredRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const query = `
    query {
      Page(perPage: 10) {
        media(status: RELEASING, type: ANIME, sort: POPULARITY_DESC) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            large
            extraLarge
          }
          episodes
          description(asHtml: false)
          averageScore
          nextAiringEpisode {
            episode
            timeUntilAiring
          }
          genres
          season
          seasonYear
        }
      }
    }
  `;
  
  const fetchAnimeData = async () => {
    axios.post('https://graphql.anilist.co', {
      query
    }, {
      headers: {
        'Content-Type': 'application/json',
         'Accept': 'application/json',
      },
    }).then((response) => {
      const animeList = response.data.data.Page.media.slice(0, 6).map((anime: any) => ({
        id: anime.id,
        title: anime.title.english || anime.title.romaji,
        episodes: anime.nextAiringEpisode ? anime.nextAiringEpisode.episode - 1 : anime.episodes,
        rating: anime.averageScore ? anime.averageScore / 10 : 0,
        image: anime.coverImage.extraLarge || anime.coverImage.large,
        description: anime.description 
          ? anime.description.replace(/<br\s*\/?>/g, ' ').replace(/<[^>]*>/g, '')
          : "No synopsis available",
        genres: anime.genres || [],
        season: anime.season,
        year: anime.seasonYear
      }));
      setAnimeData(animeList);
      setTimeout(() => setIsLoaded(true), 800); // Add a slight delay for smoother transitions
    }).catch((error) => {
      console.error('Error fetching anime data:', error);
      setIsLoaded(true);
    });
  };

  useEffect(() => {
    fetchAnimeData();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Enhanced scroll animation observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
          entry.target.classList.remove('opacity-0');
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -100px 0px" });

    if (featuredRef.current) observer.observe(featuredRef.current);
    if (featuresRef.current) observer.observe(featuresRef.current);
    if (ctaRef.current) observer.observe(ctaRef.current);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (featuredRef.current) observer.unobserve(featuredRef.current);
      if (featuresRef.current) observer.unobserve(featuresRef.current);
      if (ctaRef.current) observer.unobserve(ctaRef.current);
    };
  }, []);

  // Enhanced slider settings with improved navigation and visual appeal
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 700,
    slidesToShow: 2,
    slidesToScroll: 1,
    arrows: true,
    centerPadding: '10px',
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    cssEase: "cubic-bezier(0.45, 0, 0.55, 1)",
    responsive: [
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        }
      }
    ],
    customPaging: () => (
      <div className="w-3 h-3 rounded-full bg-indigo-500/30 hover:bg-indigo-500/70 border border-indigo-500/30 transition-all duration-300 mt-4"></div>
    ),
    nextArrow: <CustomNextArrow />,
    prevArrow: <CustomPrevArrow />,
  };

  function CustomNextArrow(props: any) {
    const { onClick } = props;
    return (
      <button 
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-r from-indigo-700/40 to-indigo-900/70 backdrop-blur-sm p-3 rounded-l-lg border border-indigo-500/30 shadow-lg hidden sm:flex"
        onClick={onClick}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    );
  }

  function CustomPrevArrow(props: any) {
    const { onClick } = props;
    return (
      <button 
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-l from-indigo-700/40 to-indigo-900/70 backdrop-blur-sm p-3 rounded-r-lg border border-indigo-500/30 shadow-lg hidden sm:flex"
        onClick={onClick}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0914] text-gray-100 overflow-hidden">
      <style jsx global>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.1; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        
        @keyframes float-up {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        .animate-fade-in-up {
          animation: float-up 0.8s ease-out forwards;
        }
        
        .anime-gradient-text {
          background: linear-gradient(to right, #C6A1F5, #8A7AFD, #5C77FB);
          background-clip: text;
          -webkit-text-fill-color: transparent;
          background-size: 200% auto;
          animation: textShine 3s ease-in-out infinite alternate;
        }
        
        @keyframes textShine {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        
        .animate-slow-pulse {
          animation: slowPulse 8s infinite;
        }
        
        @keyframes slowPulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.02); }
        }
        
        .animate-ping-slow {
          animation: pingSlow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        
        @keyframes pingSlow {
          0% { transform: scale(0.95); opacity: 1; }
          75%, 100% { transform: scale(1.2); opacity: 0; }
        }
        
        .animation-delay-300 {
          animation-delay: 0.3s;
        }
        
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
        
        .card-hover-effect {
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        .card-hover-effect:hover {
          transform: translateY(-10px);
          box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.3);
        }
        
        /* Glowing effect for cards */
        .card-glow {
          position: relative;
          overflow: hidden;
        }
        
        .card-glow::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(
            90deg, 
            transparent, 
            rgba(124, 58, 237, 0.1), 
            transparent
          );
          transition: 0.5s;
          z-index: 1;
        }
        
        .card-glow:hover::before {
          left: 100%;
        }
        
        /* Added floating animation for decorative elements */
        .floating {
          animation: floating 3s ease-in-out infinite;
        }
        
        @keyframes floating {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        /* Enhanced slide animations */
        .slick-slide {
          opacity: 0.6;
          transition: all 0.5s ease;
          transform: scale(0.9);
        }
        
        .slick-center,
        .slick-active {
          opacity: 1;
          transform: scale(1);
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(30, 30, 60, 0.2);
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #6366f1, #8b5cf6);
          border-radius: 50px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #4f46e5, #7c3aed);
        }
      `}</style>
      
      <Navbar />

      {/* Hero Section with Enhanced Parallax Effect */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Animated Background with increased depth and immersion */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0914] via-[#111432]/90 to-[#0a0914] z-10"></div>
          <div className="absolute inset-0 bg-[url('/images/hero-bg.webp')] bg-cover bg-center animate-slow-pulse z-0 opacity-30"></div>

          {/* Enhanced Animated Particles */}
          <div className="absolute inset-0 z-20">
            {starParticles.map((particle) => (
              <div
                key={particle.id}
                className="absolute rounded-full bg-white"
                style={{
                  width: particle.width,
                  height: particle.height,
                  top: particle.top,
                  left: particle.left,
                  opacity: particle.opacity,
                  boxShadow: particle.boxShadow,
                  animation: particle.animation,
                }}
              ></div>
            ))}
            
            {/* Enhanced abstract light beams with more subtle glow */}
            <div className="absolute top-0 left-1/4 w-2/3 h-screen bg-indigo-500/5 rotate-45 transform -translate-x-1/2 rounded-full blur-3xl"></div>
            <div className="absolute top-1/4 right-1/4 w-1/2 h-screen bg-purple-500/5 -rotate-45 transform translate-x-1/2 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 left-1/3 w-1/3 h-1/2 bg-blue-500/5 rotate-12 transform rounded-full blur-3xl"></div>
          </div>
        </div>

        {/* Hero Content with enhanced animated entrance */}
        <div className="container mx-auto px-4 relative z-30 animate-fade-in-up pt-16">
          <div className="max-w-3xl">
            <div className="flex items-center mb-4">
              <div className="h-12 w-1.5 bg-gradient-to-b from-purple-500 to-indigo-600 rounded-full mr-4"></div>
              <h2 className="text-xl font-medium text-indigo-300">Welcome to</h2>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tighter">
              <span className="anime-gradient-text">YONKO HUB</span>
              <span className="block text-white">Your Ultimate Anime Community</span>
            </h1>
            <p className="text-xl text-indigo-200/80 mb-8 leading-relaxed">
              Discover new anime, connect with fellow fans, and immerse yourself in the vibrant world of anime culture. Your gateway to a world of imagination awaits.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/anime" className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg font-semibold text-white hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transform hover:-translate-y-1 hover:scale-105">
                Explore Anime
              </Link>
              <Link href="/communities" className="px-8 py-4 bg-transparent border-2 border-indigo-500/50 rounded-lg font-semibold text-indigo-300 hover:text-white hover:border-indigo-400 transition-all duration-300 hover:bg-indigo-500/10 transform hover:-translate-y-1 hover:scale-105">
                Join Community
              </Link>
            </div>
          </div>
        </div>

        {/* Enhanced Decorative Elements */}
        <div className="absolute bottom-10 left-0 right-0 z-30 flex justify-center">
          <div className="animate-bounce w-12 h-12 flex items-center justify-center bg-indigo-900/40 rounded-full p-2 border border-indigo-500/40 shadow-lg shadow-indigo-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6 text-indigo-300">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
        
        {/* Japanese characters floating in background */}
        <div className="absolute top-1/4 right-10 text-4xl text-indigo-500/20 font-bold floating">アニメ</div>
        <div className="absolute bottom-1/4 left-10 text-5xl text-purple-500/20 font-bold floating animation-delay-300">漫画</div>
        <div className="absolute top-2/3 right-1/4 text-6xl text-blue-500/10 font-bold floating animation-delay-600">夢</div>
      </section>

      {/* Featured Anime Section with enhanced visual effects */}
      <section ref={featuredRef} className="py-20 relative opacity-0 transition-opacity duration-1000">
        <div className="absolute inset-0 opacity-5 bg-[url('/images/pattern.svg')] bg-repeat"></div>
        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-radial-gradient from-indigo-900/20 to-transparent"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center mb-16 text-center">
            <span className="inline-block px-4 py-1.5 bg-indigo-900/40 border border-indigo-500/30 rounded-full text-indigo-300 text-sm mb-4">DISCOVER</span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 anime-gradient-text inline-block">
              Trending This Season
            </h2>
            <p className="text-indigo-300/80 max-w-2xl text-lg">
              Stay updated with the hottest anime titles currently taking the community by storm
            </p>
            <div className="h-1 w-24 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full mt-6"></div>
          </div>

          {isLoaded ? (
            isMobile ? (
              <div className="px-1">
                <Slider {...sliderSettings}>
                  {animeData.map((anime: Anime) => (
                    <div key={anime.id} className="px-2 pb-8">
                      <Card className="card-hover-effect card-glow bg-[#141430]/60 backdrop-blur-sm border border-indigo-500/20 rounded-xl hover:border-indigo-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/20 group overflow-hidden h-full">
                        <Link href={`/anime/details/${anime.id}`}>
                          <div className="relative w-full aspect-[3/4]">
                            <Image 
                              src={anime.image} 
                              alt={anime.title || "Anime"} 
                              fill
                              className="object-cover rounded-t-xl group-hover:scale-105 transition-transform duration-500"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              loading="eager"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0914] via-[#0a0914]/70 to-transparent opacity-80"></div>
                            {Number(anime.rating) > 0 && (
                              <div className="absolute top-2 right-2 bg-indigo-900/70 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs font-medium text-amber-300 border border-indigo-500/30 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-amber-300" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                </svg>
                                {anime.rating.toFixed(1)}
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="text-base font-medium text-white line-clamp-1 mb-1.5 group-hover:text-indigo-300 transition-colors duration-300">{anime.title}</h3>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-indigo-300/80">Ep: {anime.episodes || '?'}</span>
                              <span className="text-xs bg-indigo-500/30 px-2.5 py-1 rounded-full text-indigo-200">Airing</span>
                            </div>
                          </div>
                        </Link>
                      </Card>
                    </div>
                  ))}
                </Slider>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                {animeData.map((anime: Anime, index) => (
                  <Card 
                    key={anime.id} 
                    className={`card-hover-effect card-glow bg-[#141430]/60 backdrop-blur-sm border border-indigo-500/20 rounded-xl p-6 hover:border-indigo-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/20 group h-full`}
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <Link href={`/anime/details/${anime.id}`} className="block h-full">
                      <div className="relative mb-4 overflow-hidden rounded-lg">
                        <Image 
                          src={anime.image} 
                          alt={anime.title || "Anime"} 
                          width={350} 
                          height={500} 
                          className="rounded-lg group-hover:scale-105 transition-transform duration-500 w-full h-auto"
                          loading={index < 3 ? "eager" : "lazy"}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#0a0914]/90 to-transparent"></div>
                        {Number(anime.rating) > 0 && (
                          <div className="absolute top-3 right-3 bg-indigo-900/70 backdrop-blur-sm px-3 py-1 rounded-md text-sm font-medium text-amber-300 border border-indigo-500/40 flex items-center gap-1 shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-300" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                            </svg>
                            {anime.rating.toFixed(1)}
                          </div>
                        )}
                        {/* Genre tags */}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                          {anime.genres && anime.genres.slice(0, 2).map((genre: string, idx: number) => (
                            <span key={idx} className="text-xs bg-indigo-900/70 backdrop-blur-sm px-2 py-0.5 rounded-md text-indigo-200 border border-indigo-500/30">
                              {genre}
                            </span>
                          ))}
                        </div>
                      </div>
                      <CardHeader className="px-0 py-2">
                        <CardTitle className="text-xl font-semibold text-white group-hover:text-indigo-300 transition-colors duration-300">{anime.title}</CardTitle>
                        <div className="flex justify-between mt-2 items-center">
                          <CardDescription className="text-indigo-300/80">Episodes: {anime.episodes || '?'}</CardDescription>
                          <span className="text-xs bg-indigo-500/30 px-3 py-1 rounded-full text-indigo-200 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                            Airing
                          </span>
                        </div>
                        <CardDescription className="text-indigo-300/80 mt-3 line-clamp-2">
                          {anime.description || "No description available"}
                        </CardDescription>
                      </CardHeader>
                    </Link>
                  </Card>
                ))}
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-[#141430]/60 backdrop-blur-sm border border-indigo-500/20 rounded-xl p-6 animate-pulse">
                  <div className="w-full h-64 bg-indigo-700/20 rounded-lg mb-4"></div>
                  <div className="h-6 bg-indigo-700/20 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-indigo-700/20 rounded w-1/2 mb-3"></div>
                  <div className="h-4 bg-indigo-700/20 rounded w-full"></div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-16 text-center">
            <Link href="/anime" className="inline-flex items-center px-8 py-4 bg-indigo-800/50 border border-indigo-600/70 rounded-lg font-medium text-white hover:bg-indigo-700/60 transition-all duration-300 hover:scale-105 transform hover:shadow-lg hover:shadow-indigo-500/30">
              <span>View All Anime</span>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Enhanced decorative divider with more visual appeal */}
      <div className="relative h-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/20 via-purple-900/30 to-indigo-900/20"></div>
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/70 to-transparent transform -translate-y-1/2 shadow-lg shadow-indigo-500/50"></div>
        <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping-slow"></div>
            <div className="absolute inset-2 bg-indigo-500/30 rounded-full animate-ping-slow animation-delay-300"></div>
            <div className="absolute inset-4 bg-indigo-500/40 rounded-full animate-ping-slow animation-delay-600"></div>
            <div className="absolute inset-6 bg-indigo-600/60 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">夢</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Features Section with more detailed cards */}
      <section ref={featuresRef} className="py-24 bg-[#0c0d24]/70 relative opacity-0 transition-opacity duration-1000 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-[#0a0914] to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-[#0a0914] to-transparent"></div>
        
        {/* Abstract decorative elements */}
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 left-0 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center mb-20 text-center">
            <span className="inline-block px-4 py-1.5 bg-indigo-900/40 border border-indigo-500/30 rounded-full text-indigo-300 text-sm mb-4">FEATURES</span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
              <span className="anime-gradient-text">EXPLORE</span> Our Features
            </h2>
            <p className="text-indigo-300/80 max-w-2xl text-lg">
              Discover what makes Yonko Hub the ultimate destination for anime enthusiasts around the world
            </p>
            <div className="h-1 w-24 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full mt-6"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="card-hover-effect card-glow bg-[#141430]/70 backdrop-blur-sm border border-indigo-500/30 rounded-xl p-8 hover:border-indigo-500/60 transition-all duration-400 hover:shadow-xl hover:shadow-indigo-500/20 group"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className={`bg-gradient-to-br ${feature.gradient} rounded-xl p-5 inline-flex mb-6 text-white shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-all duration-300 transform group-hover:scale-110`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4 group-hover:text-indigo-300 transition-colors duration-300">{feature.title}</h3>
                <p className="text-indigo-300/80 text-base leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section with more immersive design */}
      <section ref={ctaRef} className="py-24 relative overflow-hidden opacity-0 transition-opacity duration-1000">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/30 to-purple-900/30"></div>
        
        {/* Abstract shapes with enhanced effects */}
        <div className="absolute top-0 right-0 w-2/3 h-2/3 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-1/2 h-full bg-purple-500/10 rounded-full blur-3xl"></div>
        
        {/* Animated particles in background */}
        <div className="absolute inset-0">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-indigo-500/20"
              style={{
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `floating ${Math.random() * 5 + 5}s infinite ${Math.random() * 2}s`
              }}
            ></div>
          ))}
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto bg-gradient-to-br from-[#141430]/90 to-[#1e1b4b]/90 p-10 md:p-16 rounded-2xl border border-indigo-500/50 shadow-xl shadow-indigo-500/20 backdrop-blur-md transform transition-all duration-500 hover:shadow-indigo-500/30 hover:border-indigo-500/70">
            <div className="flex flex-col md:flex-row items-center justify-between gap-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Ready to Start Your Anime Journey?</h2>
                <p className="text-indigo-300/90 text-lg mb-8 md:mb-0 leading-relaxed">
                  Join thousands of anime enthusiasts on Yonko Hub today. Connect, discover, and immerse yourself in the world of anime like never before!
                </p>
              </div>
              <div>
                <Link
                  href="/Auth/register"
                  className="px-10 py-4 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-semibold text-white hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-indigo-500/40 hover:shadow-indigo-500/60 transform hover:-translate-y-2 hover:scale-105 inline-flex items-center gap-2"
                >
                  <span>Join Yonko Hub</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}