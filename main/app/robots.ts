import type { MetadataRoute } from 'next'
import { APP_URL } from '@/src/constants'

/**
 * robots.txt — 크롤러 접근 제어.
 *
 * Allow: 공개 페이지 (/, /feed, /explore, /landing, /recruit, /u/[id], /p/[id], /clubs/[slug])
 * Disallow:
 *   - /api/ : 내부 API. robots 와 별개로 서버에서 인증 강제
 *   - 관리자·사용자 인증 영역 : 로그인 필요, 색인되어도 유저가 접근 못 함
 *   - MVP hidden 기능 : 공식 출시 전 색인 방지
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = APP_URL

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          // 관리자 영역
          '/admin/',
          '/institution/',
          // 사용자 인증 영역
          '/dashboard',
          '/onboarding/',
          '/profile',
          '/messages',
          '/notifications',
          '/drafts',
          '/me/',
          '/projects/new',
          '/projects/*/edit',
          '/clubs/*/settings',
          '/clubs/*/operator',
          '/clubs/*/reports',
          '/clubs/*/contents',
          '/clubs/*/analytics',
          '/clubs/*/automations',
          '/clubs/*/bundles',
          '/clubs/*/decks',
          '/clubs/*/certificate',
          '/connect/',
          // 개발·실험 라우트
          '/dev/',
          // MVP hidden
          '/business-plan',
          '/workflow',
          '/validated-ideas',
          '/calendar',
          '/documents',
          '/usage',
          '/network', // 내부 사람 탐색 — 공개 프로필은 /u/[id]
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
