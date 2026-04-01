import type { NextConfig } from 'next'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWAInit = require('next-pwa')

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: '/offline',
  },
})

const nextConfig: NextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Disable dev indicator
  devIndicators: {
    position: 'bottom-right',
  },

  // Image optimization with allowed remote patterns
  images: {
    remotePatterns: [
      // Supabase Storage
      {
        protocol: 'https',
        hostname: 'prxqjiuibfrmuwwmkhqb.supabase.co',
      },
      // Allow any *.supabase.co subdomain (e.g. different project refs)
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      // Unsplash
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      // Picsum (placeholder images)
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      // Google OAuth avatar
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      // GitHub OAuth avatar
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      // Kakao OAuth avatar
      {
        protocol: 'https',
        hostname: 'k.kakaocdn.net',
      },
      {
        protocol: 'https',
        hostname: '*.kakaocdn.net',
      },
      // Naver OAuth avatar
      {
        protocol: 'https',
        hostname: 'phinf.pstatic.net',
      },
      {
        protocol: 'https',
        hostname: 'ssl.pstatic.net',
      },
      // GitHub raw content
      {
        protocol: 'https',
        hostname: 'github.com',
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

export default withPWA(nextConfig)
