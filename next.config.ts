import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '32mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'razorpay.com',
      },
      {
        protocol: 'https',
        hostname: 'pub-f35e903402514e0a906601c1b15ddd3b.r2.dev',
      },
    ],
  },
};

export default nextConfig;
