import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add empty turbopack config to allow webpack config
  turbopack: {},

  // Standalone output for Docker deployment
  output: 'standalone',

  // Optimize for production
  poweredByHeader: false,

  // Enable strict mode
  reactStrictMode: true,

  // Image optimization
  images: {
    unoptimized: true, // For Docker deployment
  },
};

export default nextConfig;
