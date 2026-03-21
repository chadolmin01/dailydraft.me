'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { BackgroundGrid } from '@/components/home/BackgroundGrid'
import { Navbar } from '@/components/home/Navbar'
import { Hero } from '@/components/home/Hero'
import { HowItWorks } from '@/components/home/HowItWorks'
import { CommunityFeedback } from '@/components/home/CommunityFeedback'
import { OpportunitySection } from '@/components/home/OpportunitySection'
import { FAQ } from '@/components/home/FAQ'
import { Footer } from '@/components/home/Footer'

export default function HomePageClient() {
  const router = useRouter()

  const handleLoginClick = () => {
    router.push('/login')
  }

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden text-txt-primary font-sans selection:bg-black selection:text-white bg-surface-card">
      <BackgroundGrid />

      <Navbar onLoginClick={handleLoginClick} />

      <main className="relative pt-14">
        <Hero onCtaClick={handleLoginClick} />
        <HowItWorks />
        <CommunityFeedback />
        <OpportunitySection />
        <FAQ />
      </main>

      <Footer />
    </div>
  )
}
