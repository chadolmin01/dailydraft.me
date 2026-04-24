import type { NextConfig } from 'next'
import withSerwistInit from '@serwist/next'

// PWA: @serwist/next — next-pwa 의 유지보수 중단 후계. Next 15 공식 호환.
// 실제 캐싱 정책은 app/sw.ts 에서 정의 (NetworkOnly API, NetworkFirst static).
const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
  reloadOnOnline: true,
  cacheOnNavigation: false,
})

const nextConfig: NextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Disable dev indicator
  devIndicators: {
    position: 'bottom-right',
  },

  // 번들 사이즈 축소 — tree-shaking 이 약한 라이브러리를 named import 기반으로 최적화.
  // lucide-react 는 alias import 구조라 미최적화 시 500+ 아이콘이 전부 번들에 포함됨.
  // date-fns 도 전체 네임스페이스 import 시 수백 KB 증가. 실측 50%+ 번들 감소 패턴.
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },

  // Image optimization with allowed remote patterns
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    // AVIF 우선(가장 작음), fallback WebP. 최신 브라우저 대부분 지원.
    // 대용량 이미지(업로드 avatar·club logo) 네트워크 비용 30~50% 감소.
    formats: ['image/avif', 'image/webp'],
    // 모바일 우선이므로 기본 deviceSizes 중 2048/3840(초대형 레티나) 제거.
    // 상한 1920 이면 4K 레티나 빼고 전부 커버. 변환 비용/CDN 저장 비용 감소.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // 아바타·아이콘·썸네일용 — 16~256px 범위면 대부분 케이스 커버
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // 사용자 업로드 이미지 최대 크기 — 모바일 기준 과도 큰 원본 방지
    minimumCacheTTL: 60 * 60 * 24, // 24h
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
          // HSTS — HTTPS 강제. preload 등록 전까진 includeSubDomains + 1년 (31536000s).
          // 프로덕션 도메인 dailydraft.me 는 Vercel Edge 에서 이미 TLS 1.3 강제 중이므로 안전.
          // Meta/기관 실사 시 체크하는 항목. preload 는 https://hstspreload.org 에 별도 등록.
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
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

export default withSerwist(nextConfig)
