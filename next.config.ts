import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb',
    },
  },
  serverExternalPackages: ['fs', 'path'],
};

export default nextConfig;

// Force restart for Prisma schema update
// Force fresh build 1766770937
