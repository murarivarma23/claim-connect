import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
