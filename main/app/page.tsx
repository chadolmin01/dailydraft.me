'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BackgroundGrid } from '@/components/home/BackgroundGrid'
import { Navbar } from '@/components/home/Navbar'
import { Hero } from '@/components/home/Hero'
import { HowItWorks } from '@/components/home/HowItWorks'
import { CommunityFeedback } from '@/components/home/CommunityFeedback'
import { OpportunitySection } from '@/components/home/OpportunitySection'
import { FAQ } from '@/components/home/FAQ'
import { Footer } from '@/components/home/Footer'
import { OpportunitySlidePanel } from '@/components/home/OpportunitySlidePanel'

export default function HomePage() {
  const router = useRouter()
  const [isSlideOpen, setIsSlideOpen] = useState(false)

  const handleLoginClick = () => {
    router.push('/login')
  }

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden text-slate-900 font-sans selection:bg-black selection:text-white bg-white">
      <BackgroundGrid />

      <Navbar onLoginClick={handleLoginClick} />

      <main className="relative z-10 pt-20">
        <Hero onCtaClick={handleLoginClick} onSlidePanelOpen={() => setIsSlideOpen(true)} />
        <HowItWorks />
        <CommunityFeedback />
        <OpportunitySection onSlidePanelOpen={() => setIsSlideOpen(true)} />
        <FAQ />
      </main>

      <Footer />

      <OpportunitySlidePanel
        isOpen={isSlideOpen}
        onClose={() => setIsSlideOpen(false)}
      />
    </div>
  )
}
