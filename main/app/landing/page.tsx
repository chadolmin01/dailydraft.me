import type { Metadata } from 'next';
import { APP_URL } from '@/src/constants';
import LandingClient from './LandingClient';

export const metadata: Metadata = {
  title: 'Draft — 동아리의 세대를 잇는 인프라',
  description:
    '대한민국 대학교 동아리 프로젝트 관리 플랫폼. 기수별 프로젝트, 주간 업데이트, 알럼나이 네트워크를 하나의 인프라로.',
  alternates: {
    canonical: `${APP_URL}/landing`,
  },
  openGraph: {
    title: 'Draft — 동아리의 세대를 잇는 인프라',
    description: '대학 창업동아리·학회·프로젝트 그룹의 운영을 자동화하는 OS.',
    url: `${APP_URL}/landing`,
    type: 'website',
    images: [{ url: `${APP_URL}/api/og/default`, width: 1200, height: 630, alt: 'Draft' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Draft — 동아리의 세대를 잇는 인프라',
    description: '대학 창업동아리·학회·프로젝트 그룹의 운영을 자동화하는 OS.',
    images: [`${APP_URL}/api/og/default`],
  },
};

export default function LandingPage() {
  return <LandingClient />;
}
