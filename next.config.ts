import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.56.1'],
  output: 'export',
  trailingSlash: true,
  // Use subfolder basePath for all production builds to align Hostinger and GitHub Pages
  basePath: isProduction ? '/Kelab-Senshi-Goju-Ryu-Karate-' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
