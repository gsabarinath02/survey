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
    unoptimized: true, // For Docker deployment with SQLite
  },

  // Webpack config for better-sqlite3 compatibility
  webpack: (config) => {
    config.externals = [...(config.externals || []), 'better-sqlite3'];
    return config;
  },
};

export default nextConfig;
