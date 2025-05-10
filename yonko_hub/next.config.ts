import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint:{
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['i.pinimg.com', 'cdn.myanimelist.net', 'cdn.noitatnemucod.net','s4.anilist.co', 'i.animepahe.ru', 'media.kitsu.app','res.cloudinary.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'w7.pngwing.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;