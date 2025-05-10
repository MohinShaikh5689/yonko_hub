'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from './ui/button';
import { Info } from 'lucide-react';

export const Footer = () => {
  // Generate more anime-inspired decorative elements
  const decorativeElements = Array.from({ length: 15 }, (_, i) => (
    <div 
      key={i} 
      className="absolute top-0 left-0 w-full opacity-75"
    >
      <div 
        className="bg-gradient-to-r from-indigo-500/30 via-purple-500/20 to-indigo-500/30 h-px" 
        style={{ 
          transform: `translateY(${Math.random() * 100}%)`, 
          width: `${Math.random() * 100}%`,
          marginLeft: `${Math.random() * 100}%`,
          height: `${Math.random() * 3 + 1}px`,
          animation: `pulse ${Math.random() * 3 + 2}s infinite ${Math.random() * 2}s`
        }}
      ></div>
    </div>
  ));

  // Animated stars
  const stars = Array.from({ length: 8 }, (_, i) => (
    <div
      key={`star-${i}`}
      className="absolute opacity-75"
      style={{
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        width: `${Math.random() * 3 + 1}px`,
        height: `${Math.random() * 3 + 1}px`,
        background: 'white',
        borderRadius: '50%',
        boxShadow: '0 0 8px 2px rgba(255, 255, 255, 0.8)',
        animation: `twinkle ${Math.random() * 3 + 2}s infinite ${Math.random() * 2}s`
      }}
    ></div>
  ));

  return (
    <footer className="relative mt-20 bg-[#0a0914]/90 backdrop-blur-sm border-t border-indigo-500/30">
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.1; transform: scale(0.8); }
          50% { opacity: 0.9; transform: scale(1.2); }
        }
        @keyframes floatUp {
          0% { transform: translateY(0); opacity: 0; }
          50% { opacity: 0.7; }
          100% { transform: translateY(-20px); opacity: 0; }
        }
      `}</style>
      
      <div className="relative overflow-hidden">
        {decorativeElements}
        {stars}
        <div className="h-px w-full bg-gradient-to-r from-indigo-900/20 via-indigo-500/80 to-indigo-900/20 shadow-lg shadow-indigo-500/50"></div>
      </div>
      
      {/* Third Party Data Disclaimer */}
      <div className="bg-indigo-900/30 border-y border-indigo-500/30">
        <div className="container mx-auto px-4 py-3 flex items-center gap-2 justify-center">
          <Info size={16} className="text-indigo-300" />
          <p className="text-xs md:text-sm text-indigo-200/80 text-center">
            Disclaimer: YounkoHub does not host or own any of the anime content shown. 
            All rights belong to their respective owners. This platform uses public 
            sources via proxy for educational/demo purposes only.
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and About */}
          <div className="col-span-1 flex flex-col">
            <div className="flex items-center mb-4">
              <Link href="/" className="hover:rotate-6 transition-all duration-300 relative w-10 h-10 overflow-hidden rounded-full 
                        border-2 border-indigo-500 shadow-lg shadow-indigo-500/50">
                <Image 
                  src="https://i.pinimg.com/736x/d4/17/ba/d417ba6d037fe613df2697c388cb2cb9.jpg" 
                  alt="Yonko Hub Logo" 
                  width={40} 
                  height={40} 
                  className="object-cover drop-shadow-[0_0_8px_rgba(107,102,255,0.6)]"
                />
              </Link>
              <div className="ml-3 flex flex-col">
                <span className="text-lg font-bold text-white">
                  <span className="anime-gradient-text tracking-wide">YONKO HUB</span>
                </span>
                <span className="text-indigo-300/60 text-sm">Your Anime Community</span>
              </div>
            </div>
            <p className="text-indigo-200/70 mb-4">
              Bringing anime enthusiasts together to discover, discuss, and celebrate 
              the vast world of anime and manga.
            </p>
            {/* Social Icons */}
            <div className="flex space-x-3">
              {[
                {
                  social: 'twitter',
                  path: '#',
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-300 group-hover:text-white transition-colors duration-300">
                      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                    </svg>
                  )
                },
                {
                  social: 'discord',
                  path: '#',
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-300 group-hover:text-white transition-colors duration-300">
                      <circle cx="9" cy="12" r="1"></circle>
                      <circle cx="15" cy="12" r="1"></circle>
                      <path d="M7.5 7.5c3.5-1 5.5-1 9 0"></path>
                      <path d="M7 16.5c3.5 1 6.5 1 10 0"></path>
                      <path d="M15.5 17c0 1 1.5 3 2 3 1.5 0 2.833-1.667 3.5-3 .667-1.667.5-5.833-1.5-11.5-1.457-1.015-3-1.34-4.5-1.5l-1 2.5"></path>
                      <path d="M8.5 17c0 1-1.356 3-1.832 3-1.429 0-2.698-1.667-3.333-3-.635-1.667-.48-5.833 1.428-11.5 1.388-1.015 2.782-1.34 4.237-1.5l1 2.5"></path>
                    </svg>
                  )
                },
                {
                  social: 'github',
                  path: '#',
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-300 group-hover:text-white transition-colors duration-300">
                      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                      <path d="M9 18c-4.51 2-5-2-7-2"></path>
                    </svg>
                  )
                }].map(item => (
                <a 
                  key={item.social}
                  href={item.path} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-2 rounded-md bg-indigo-900/30 hover:bg-indigo-800/50 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-indigo-500/30"
                  aria-label={item.social}
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-indigo-200 border-b border-indigo-500/30 pb-2 relative">
              Quick Links
              <span className="absolute bottom-0 left-0 w-1/3 h-0.5 bg-gradient-to-r from-pink-500 to-indigo-500"></span>
            </h3>
            <ul className="space-y-2">
              {[
                { path: '/anime', label: 'Anime' },
                { path: '/profile', label: 'Profile' },
                { path: '/communities', label: 'Communities' },
                { path: '/chat', label: 'Messages' }
              ].map(link => (
                <li key={link.path}>
                  <Link 
                    href={link.path}
                    className="text-sm text-indigo-300/70 hover:text-indigo-300 transition-colors duration-200 hover:underline flex items-center"
                  >
                    <span className="inline-block w-1 h-1 rounded-full bg-indigo-400 mr-2"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Explore */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-indigo-200 border-b border-indigo-500/30 pb-2 relative">
              Explore
              <span className="absolute bottom-0 left-0 w-1/3 h-0.5 bg-gradient-to-r from-pink-500 to-indigo-500"></span>
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Watchlist", path: "/profile/watchlist" },
                { label: "Airing", path: "/anime" },
                { label: "Join Community", path: "/communities" },
                { label: "Find Friends", path: "/chat" },
                { label: "Settings", path: "/profile/edit" },
                { label: "Help", path: "/help" }
              ].map((link) => (
                <Link 
                  key={link.path}
                  href={link.path}
                  className="text-sm text-indigo-300/70 hover:text-indigo-300 transition-colors duration-200 hover:underline flex items-center"
                >
                  <span className="inline-block w-1 h-1 rounded-full bg-indigo-400 mr-2"></span>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-10 pt-5 border-t border-indigo-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-indigo-300/60 text-sm">
            © {new Date().getFullYear()} Yonko Hub. All rights reserved.
          </div>
          
          <div id="love-message" className="text-sm text-center md:text-right text-indigo-300/60 relative group">
            Made with 
            <span className="text-red-400 mx-0.5 inline-block hover:animate-pulse hover:scale-125 transition-transform duration-300 cursor-pointer" 
            >❤️</span> 
            and 
            <span className="text-indigo-200 mx-0.5 inline-block hover:animate-bounce hover:scale-125 transition-transform duration-300 cursor-pointer"
            >☕</span> 
            by 
            <span className="text-pink-400 mx-0.5 inline-block hover:animate-spin hover:scale-125 transition-transform duration-300 cursor-pointer"
            >✨</span>
            <span className="bg-gradient-to-r from-pink-500 to-indigo-500 bg-clip-text text-transparent font-semibold">Mohin!</span>
          </div>
        </div>
      </div>
    </footer>
  );
};