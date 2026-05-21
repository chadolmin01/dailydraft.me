import type { Metadata } from 'next'
import { APP_URL } from '@/src/constants'
import { RecruitPageClient } from '@/components/recruit/RecruitPageClient'

export const metadata: Metadata = {
  title: 'FLIP 1기 AI 빌더 스터디 사전 신청',
  description:
    'FLIP 1기 안에서 운영하는 AI 빌더 스터디(8명 내외) 사전 신청. 6주간 매주 2시간, 각자 팀 아이템을 Claude로 직접 만들어보고 데모데이에서 공개합니다.',
  alternates: {
    canonical: `${APP_URL}/recruit`,
  },
  openGraph: {
    title: 'FLIP 1기 AI 빌더 스터디 · 사전 신청',
    description: '6주, 매주 2시간, Claude 중심. 우리 팀 데모데이용 그것 하나를 직접 만듭니다.',
    url: `${APP_URL}/recruit`,
    type: 'website',
    images: [{ url: `${APP_URL}/api/og/default`, width: 1200, height: 630, alt: 'FLIP 1기 AI 빌더 스터디' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FLIP 1기 AI 빌더 스터디 · 사전 신청',
    description: '6주, 매주 2시간, Claude로 직접 만듭니다.',
    images: [`${APP_URL}/api/og/default`],
  },
}

export default function RecruitPage() {
  return <RecruitPageClient />
}
