import type { NextConfig } from 'next'
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

  // 보안 헤더 — 기본적인 방어선. CSP 는 복잡해서 나중에 (인라인 스타일·eval 정밀 튜닝 필요).
  // 현재: clickjacking·MIME sniffing·referrer leak·기본 권한 제한.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Clickjacking 방지 — iframe 임베드는 우리가 만든 /embed/* 만 허용
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // MIME type sniffing 방지
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Referrer 에 full URL 대신 origin 만 전송 (개인정보 누출 감소)
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // 사용 안 하는 브라우저 기능 명시적 차단 (카메라·마이크·지오로케이션 등)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          // XSS 보조 — 최신 브라우저는 대부분 무시하지만 구형 지원
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
      {
        // 임베드 페이지는 외부 사이트에서 iframe 으로 불러야 하므로 X-Frame-Options 덮어쓰기
        source: '/embed/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
        ],
      },
    ]
  },
}

export default withPWA(nextConfig)
