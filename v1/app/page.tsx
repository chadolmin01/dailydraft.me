import type { Metadata } from 'next'
import HomePageClient from '@/components/home/HomePageClient'
import { JsonLd, FaqJsonLd } from '@/components/home/JsonLd'
import { APP_URL } from '@/src/constants'

export const revalidate = 60

/**
 * 랜딩 페이지 metadata — 루트 layout 의 기본 metadata 를 override.
 * generateMetadata (동적) 대신 static export 를 쓴 이유: 랜딩 페이지는 입력값(params/searchParams)
 * 이 없어서 빌드 타임 고정 가능. Next.js 가 자동으로 캐시한다.
 *
 * canonical 명시 — www/non-www, 쿼리스트링 유무에 따른 중복 색인 방지.
 */
export const metadata: Metadata = {
  title: 'Draft — 동아리 운영을 구조화하는 SaaS',
  description:
    '주간 업데이트·멤버 관리·기수 타임라인·Discord/GitHub 연동까지. 운영은 Draft에, 소통은 원하는 곳에. 대학 동아리와 기관을 위한 운영 인프라.',
  alternates: {
    canonical: '/',
    languages: {
      'ko-KR': '/',
      'x-default': '/',
    },
  },
  openGraph: {
    title: 'Draft — 동아리 운영을 구조화하는 SaaS',
    description:
      '주간 업데이트·멤버 관리·기수 타임라인·Discord/GitHub 연동까지. 운영은 Draft에, 소통은 원하는 곳에.',
    url: APP_URL,
    siteName: 'Draft',
    type: 'website',
    locale: 'ko_KR',
    images: [{ url: `${APP_URL}/api/og/default`, width: 1200, height: 630, alt: 'Draft — 동아리의 세대를 잇는 인프라' }],
  },
}

export default function HomePage() {
  return (
    <>
      {/* 구조화 데이터 — HTML 어디든 들어가면 Googlebot 이 인식. body 최상단에 두어 초기 페인트 전에 파싱. */}
      <JsonLd />
      <FaqJsonLd />
      <HomePageClient />
    </>
  )
}
