import React from 'react'
import { Navbar } from '@/components/home/Navbar'
import { Hero } from '@/components/home/Hero'
import { FeatureBar } from '@/components/home/FeatureBar'
import { CognitiveSystem } from '@/components/home/CognitiveSystem'
import { BeforeAfterTabs } from '@/components/home/BeforeAfterTabs'
import { PersonaEngine } from '@/components/home/PersonaEngine'
import { DemoTabs } from '@/components/home/DemoTabs'
import { HowItWorks } from '@/components/home/HowItWorks'
import { Scenarios } from '@/components/home/Scenarios'
import { Pricing } from '@/components/home/Pricing'
import { SecuritySection } from '@/components/home/SecuritySection'
import { FAQ } from '@/components/home/FAQ'
import { FinalCTA } from '@/components/home/FinalCTA'
import { Footer } from '@/components/home/Footer'

/**
 * Home page section order — 3층 포지셔닝 서사 흐름:
 *
 * 1. Hero           → "운영은 Draft에, 소통은 원하는 곳에"
 * 2. FeatureBar     → 3 코어 기능 (눈높이 맞추기)
 * 3. CognitiveSystem → 철학 ("인지 시스템" 메타포)
 * 4. BeforeAfterTabs → 감정 문제·해결 (실물 모킹)
 * 5. PersonaEngine   → Pro 요금제 핵심 가치 ("조직 운영권 판매")
 * 6. DemoTabs        → 실기능 탐색 (이후 Phase C 에서 통합 예정)
 * 7. HowItWorks      → 3분 셋업 신뢰
 * 8. Scenarios       → 특정 오디언스 공감 (동아리 타입별)
 * 9. Pricing         → 전환 (+ 기관 문의)
 * 10. SecuritySection → 엔터프라이즈 신뢰 신호
 * 11. FAQ            → 마지막 장벽 제거
 * 12. FinalCTA       → 행동 전환
 */
export default function HomePageClient() {
  return (
    <div className="min-h-screen w-full relative overflow-x-hidden text-txt-primary font-sans selection:bg-black selection:text-white bg-surface-card">
      <Navbar />

      <main id="main-content" className="relative pt-14">
        <Hero />
        <FeatureBar />
        <CognitiveSystem />
        <BeforeAfterTabs />
        <PersonaEngine />
        <DemoTabs />
        <HowItWorks />
        <Scenarios />
        <Pricing />
        <SecuritySection />
        <FAQ />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  )
}
