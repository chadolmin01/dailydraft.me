import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

// V2 next.config — PWA / V1 의 이미지 호스트들은 제거.
// V2 는 OAuth 가 Google 만, 외부 이미지 표시 X (필요 시 lh3.googleusercontent.com 만).
// Sentry: SENTRY_DSN 환경변수 없으면 init() 가 silent no-op → 빌드/런타임 영향 0.

const nextConfig: NextConfig = {
  reactStrictMode: true,

  devIndicators: {
    position: 'bottom-right',
  },

  // 번들 사이즈 축소 — lucide-react 의 500+ 아이콘 전체 import 방지.
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // 의도: pdf-parse 가 내부적으로 동적 import 하는 pdfjs-dist/.../pdf.worker.mjs 를
  //       Next 가 번들에 못 넣어서 "Cannot find module pdf.worker.mjs" 런타임 에러 발생.
  //       serverExternalPackages 에 넣으면 번들 안 하고 Node 의 require 가 직접 해결.
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Supabase Storage (현재 V2 에서 미사용이지만 V1.5 에서 첨부 기능 추가 시 필요)
      { protocol: 'https', hostname: '*.supabase.co' },
      // Google OAuth 프로필 사진 (현재 미사용, 추후 매니저 아바타 표시 시)
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  // 보안 헤더 — middleware 에서도 일부 설정하지만 정적 응답 (public assets, ISR 등) 에도
  // 적용되도록 next.config 에서 추가 보장.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ]
  },
}

// Sentry 옵션: SENTRY_ORG/SENTRY_PROJECT/SENTRY_AUTH_TOKEN 없으면 source map upload 안 함.
// 즉 DSN 만 등록해도 에러 추적은 동작 (스택트레이스만 minified). production 디버깅
// 필요 시 Sentry 대시보드에서 org/project 생성 후 auth token 환경변수 추가.
const sentryOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.SENTRY_AUTH_TOKEN,
  // 의도: Sentry 의 next 인스트루멘테이션이 일부 라우트에서 무거울 수 있음 — 필요 시 disable.
  disableLogger: true,
  automaticVercelMonitors: false,
}

export default withSentryConfig(nextConfig, sentryOptions)
