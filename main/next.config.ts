import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Image optimization with allowed remote patterns
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'prxqjiuibfrmuwwmkhqb.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  // Type checking during build
  typescript: {
    ignoreBuildErrors: false,
  },

  // Exclude puppeteer from webpack bundling (not available on Vercel serverless)
  serverExternalPackages: ['puppeteer'],
}

export default nextConfig
