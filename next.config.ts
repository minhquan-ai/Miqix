import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb', // Increase from default 1mb to 15mb for file uploads
    },
  },
  serverExternalPackages: ['fs', 'path'],
};

export default nextConfig;

// Force restart for Prisma schema update
// Force fresh build 1766770937
