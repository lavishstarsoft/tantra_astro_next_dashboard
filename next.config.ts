import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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
    formats: ['image/avif', 'image/webp'],
  },
};

// Sentry adds ~1000 modules to every compile. In dev this makes route
// compilation extremely slow (the "pages don't load" feel), so only wrap the
// build with Sentry for production.
export default process.env.NODE_ENV === 'production'
  ? withSentryConfig(nextConfig, {
      silent: true,
      org: 'lavishstar',
      project: 'astro-lms',
    })
  : nextConfig;
