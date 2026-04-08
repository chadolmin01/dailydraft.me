import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWAInit = require('next-pwa')

// Customize default runtimeCaching: make APIs & page navigations NetworkOnly
// to prevent stale SW cache from breaking Next.js App Router client navigation
// eslint-disable-next-line @typescript-eslint/no-require-imports
const defaultCache = require('next-pwa/cache') as Array<{options?: {cacheName?: string}; handler: string}>
const runtimeCaching = defaultCache.map(entry => {
  const name = entry.options?.cacheName
  // APIs: never cache — React Query handles caching client-side
  // Pages/RSC payloads: never cache — prevents stale navigation
  // next-data: also skip cache
  if (name === 'apis' || name === 'others' || name === 'next-data') {
    const { networkTimeoutSeconds: _, ...rest } = (entry.options || {}) as Record<string, unknown>
    return { ...entry, handler: 'NetworkOnly', options: rest }
  }
  // JS/CSS: NetworkFirst — prevents serving stale old design after deploy
  // Next.js uses content-hashed filenames, so cache misses are rare anyway
  if (name === 'static-js-assets' || name === 'static-style-assets') {
    return { ...entry, handler: 'NetworkFirst' }
  }
  // Start URL: NetworkFirst with short timeout — always show latest HTML
  if (name === 'start-url') {
    return { ...entry, handler: 'NetworkFirst' }
  }
  return entry
})

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: '/offline',
  },
  runtimeCaching,
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
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
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

const configWithPWA = withPWA(nextConfig)

export default withSentryConfig(configWithPWA, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // 소스맵 업로드 (에러 스택트레이스에서 원본 코드 보기)
  silent: true,

  // 소스맵: 업로드 후 번들에서 제거 (보안)
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // 번들 크기 최적화
  disableLogger: true,

  automaticVercelMonitors: false,
})
