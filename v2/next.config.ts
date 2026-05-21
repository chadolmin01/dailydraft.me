import type { NextConfig } from 'next'

// V2 next.config — PWA / V1 의 이미지 호스트들은 제거.
// V2 는 OAuth 가 Google 만, 외부 이미지 표시 X (필요 시 lh3.googleusercontent.com 만).

const nextConfig: NextConfig = {
  reactStrictMode: true,

  devIndicators: {
    position: 'bottom-right',
  },

  // 번들 사이즈 축소 — lucide-react 의 500+ 아이콘 전체 import 방지.
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

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

export default nextConfig
