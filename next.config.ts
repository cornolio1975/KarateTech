import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';
// For Hostinger: use NEXT_PUBLIC_BASE_PATH if set (even if empty string), only default for GitHub Pages
const basePath = isDev ? '' : (process.env.NEXT_PUBLIC_BASE_PATH !== undefined ? process.env.NEXT_PUBLIC_BASE_PATH : '/KarateTech-');

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.56.1'],
  output: 'export',
  trailingSlash: true,
  basePath: basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
