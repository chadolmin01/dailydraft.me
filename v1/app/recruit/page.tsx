import type { Metadata } from 'next'
import { APP_URL } from '@/src/constants'
import { RecruitPageClient } from '@/components/recruit/RecruitPageClient'

export const metadata: Metadata = {
  title: 'Draft 1기 모집 — 아이디어를 프로덕트로, AI로 같이',
  description:
    '경희대 국제캠 기반, 8주 동안 AI로 직접 프로덕트를 만드는 소규모 바이브코딩 스터디. 각 MVP팀에서 1명씩, 5~7명만 모집합니다. 4/12 마감.',
  alternates: {
    canonical: `${APP_URL}/recruit`,
  },
  openGraph: {
    title: 'Draft 1기 모집 중 · ~4/12',
    description: '8주 후, 당신 이름으로 된 프로덕트 하나. 경희대 국제캠에서 5~7명이 함께 만듭니다.',
    url: `${APP_URL}/recruit`,
    type: 'website',
    images: [{ url: `${APP_URL}/api/og/default`, width: 1200, height: 630, alt: 'Draft 1기 모집' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Draft 1기 모집 중 · ~4/12',
    description: '8주 후, 당신 이름으로 된 프로덕트 하나.',
    images: [`${APP_URL}/api/og/default`],
  },
}

export default function RecruitPage() {
  return <RecruitPageClient />
}
