'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/home/Navbar'
import { HeroSimple } from '@/components/home/HeroSimple'
import { ProjectFeed } from '@/components/home/ProjectFeed'
import { FAQ } from '@/components/home/FAQ'
import { Footer } from '@/components/home/Footer'

// Preserved imports for future use
// import { BackgroundGrid } from '@/components/home/BackgroundGrid'
// import { Hero } from '@/components/home/Hero'
// import { Features } from '@/components/home/Features'
// import { HowItWorks } from '@/components/home/HowItWorks'
// import { CommunityFeedback } from '@/components/home/CommunityFeedback'
// import { OpportunitySection } from '@/components/home/OpportunitySection'

export default function HomePage() {
  const router = useRouter()

  const handleLoginClick = () => {
    router.push('/login')
  }

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden text-slate-900 font-sans selection:bg-black selection:text-white bg-[#FAFAFA]">
      <Navbar onLoginClick={handleLoginClick} />

      <main className="relative z-10 pt-20">
        {/* Simple Hero - Community focused */}
        <HeroSimple onCtaClick={handleLoginClick} />

        {/* Main Feed - Disquiet/PH style */}
        <div id="project-feed">
          <ProjectFeed />
        </div>

        {/* FAQ - Keep for SEO and user questions */}
        <div className="bg-white border-t border-gray-200">
          <FAQ />
        </div>
      </main>

      <Footer />
    </div>
  )
}
