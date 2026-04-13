'use client';

import dynamic from 'next/dynamic';

const LandingScene = dynamic(
  () => import('@/components/landing/LandingScene'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen bg-[#050510] flex items-center justify-center">
        <div className="text-white/30 text-sm">로딩 중...</div>
      </div>
    ),
  }
);

export default function LandingClient() {
  return <LandingScene />;
}
