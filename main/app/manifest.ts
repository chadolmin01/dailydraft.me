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
    orientation: 'portrait-primary',
    background_color: '#F8F9FB',
    theme_color: '#5E6AD2',
    lang: 'ko',
    dir: 'ltr',
    categories: ['productivity', 'social', 'education'],
    // PWA 설치 후 OS 앱 런처에서 우클릭/롱프레스 시 표시되는 바로가기.
    // 가장 자주 쓰이는 진입점 4개 (대시보드·탐색·피드·로드맵).
    shortcuts: [
      {
        name: '대시보드',
        short_name: '대시보드',
        url: '/dashboard',
        description: '내 클럽·프로젝트 현황',
      },
      {
        name: '탐색',
        short_name: '탐색',
        url: '/explore',
        description: '공개 프로젝트 둘러보기',
      },
      {
        name: '공개 피드',
        short_name: '피드',
        url: '/feed',
        description: '최근 활동 타임라인',
      },
      {
        name: '시스템 상태',
        short_name: 'Status',
        url: '/status',
        description: '실시간 헬스체크',
      },
    ],
    // related_applications 과 prefer_related_applications 는 명시적으로 false/empty —
    // 네이티브 앱 없음을 선언해 브라우저가 플레이 스토어 배너를 띄우지 않게.
    related_applications: [],
    prefer_related_applications: false,
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
