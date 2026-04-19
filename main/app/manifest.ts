import type { MetadataRoute } from 'next'

/**
 * PWA manifest.
 * theme_color: 브랜드 Electric Indigo 반영 (이전 #18181B 검정 → #5E6AD2).
 *              모바일 설치 시 상단 상태바·splash 의 테마 컬러.
 * background_color: 앱 실행 초기 splash 배경 — surface-bg 토큰과 정합.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Draft — 동아리의 세대를 잇는 인프라',
    short_name: 'Draft',
    description:
      '대학 창업동아리·학회의 운영을 자동화하는 OS. Discord를 구조화된 기억으로.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F8F9FB',
    theme_color: '#5E6AD2',
    lang: 'ko',
    categories: ['productivity', 'social', 'education'],
    icons: [
      {
        src: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
