import type { MetadataRoute } from 'next'

// 가벼운 PWA manifest — Chrome / Safari 에서 "홈에 추가" 가능.
// service worker 는 없음 (next-pwa 제거) — 단순 설치 가능성만.

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Draft',
    short_name: 'Draft',
    description: '창업기관 매니저 워크스페이스',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf9f5',
    theme_color: '#141413',
    lang: 'ko',
    orientation: 'any',
    icons: [
      { src: '/icon', sizes: '32x32', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  }
}
