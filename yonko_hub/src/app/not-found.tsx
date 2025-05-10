'use client';

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useEffect, useState } from "react";

export default function NotFound() {
  const [isMounted, setIsMounted] = useState(false);
  const [stars, setStars] = useState<Array<{ id: number; top: string; left: string; size: string; delay: string }>>([]);

  useEffect(() => {
    setIsMounted(true);

    // Create random stars for background
    const generateStars = () => {
      return Array.from({ length: 50 }, (_, i) => ({
        id: i,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: `${Math.random() * 2 + 1}px`,
        delay: `${Math.random() * 3}s`
      }));
    };

    setStars(generateStars());
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0914] text-gray-100 relative overflow-hidden">
      <Navbar />

      {/* Animated stars */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            animationDelay: star.delay,
            boxShadow: '0 0 8px 2px rgba(255, 255, 255, 0.3)'
          }}
        />
      ))}

      {/* Content */}
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[70vh] relative z-10">
        <div className="w-full max-w-3xl mx-auto text-center">
          <h1 className="text-7xl md:text-9xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-600">404</h1>

          <div className="relative w-64 h-64 mx-auto my-8">
            <div className="relative w-64 h-64 mx-auto my-8 rounded-full overflow-hidden border-4 border-indigo-500/50 shadow-lg shadow-indigo-500/30">
              <Image
                src="http://i.pinimg.com/736x/85/9b/43/859b43097ad71be3ff1f138ae4cd04ed.jpg"
                alt="Confused anime character"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, (min-width: 1281px) 20vw"
                onError={(e) => {
                  // Fallback if image doesn't exist
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-indigo-300">You've Wandered into wrong verse!!</h2>
          <p className="text-xl text-gray-400 mb-8">
                Oi Zoro 
            <br />
                Again you got lost in wrong verse ?
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/10 hover:text-white"
            >
              Go Back
            </Button>

            <Link href="/">
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/30">
                Return to Homepage
              </Button>
            </Link>
          </div>
        </div>

        {/* Glowing orb effects */}
        <div className="absolute -bottom-40 left-1/2 transform -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-purple-900/20 to-indigo-900/20 blur-3xl"></div>
        <div className="absolute -top-40 right-0 w-[300px] h-[300px] rounded-full bg-gradient-to-r from-indigo-900/10 to-purple-900/10 blur-3xl"></div>
      </div>

      <Footer />
    </div>
  );
}