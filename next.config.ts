import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === 'production';
const isHostinger = process.env.DEPLOY_TARGET === 'hostinger';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.56.1'],
  output: 'export',
  trailingSlash: true,
  // Hostinger serves from root /; GitHub Pages needs subfolder basePath
  basePath: isProduction && !isHostinger ? '/Kelab-Senshi-Goju-Ryu-Karate-' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
