import type { Metadata } from 'next';
import LandingClient from './LandingClient';

export const metadata: Metadata = {
  title: 'Draft — 동아리의 세대를 잇는 인프라',
  description:
    '대한민국 대학교 동아리 프로젝트 관리 플랫폼. 기수별 프로젝트, 주간 업데이트, 알럼나이 네트워크를 하나의 인프라로.',
};

export default function LandingPage() {
  return <LandingClient />;
}
