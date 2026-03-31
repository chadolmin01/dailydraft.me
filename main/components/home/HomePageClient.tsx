import React from 'react'
import { BackgroundGrid } from '@/components/home/BackgroundGrid'
import { Navbar } from '@/components/home/Navbar'
import { Hero } from '@/components/home/Hero'
import { TrustBar } from '@/components/home/TrustBar'
import { FeatureShowcase } from '@/components/home/FeatureShowcase'
import { HowItWorks } from '@/components/home/HowItWorks'
import { OpportunitySection } from '@/components/home/OpportunitySection'
import { FinalCTA } from '@/components/home/FinalCTA'
import { FAQ } from '@/components/home/FAQ'
import { Footer } from '@/components/home/Footer'

export default function HomePageClient() {
  return (
    <div className="min-h-screen w-full relative overflow-x-hidden text-txt-primary font-sans selection:bg-black selection:text-white bg-surface-card">
      <BackgroundGrid />

      <Navbar />

      <main className="relative pt-14">
        <Hero />
        <TrustBar />
        <FeatureShowcase />
        <HowItWorks />
        <OpportunitySection />
        <FinalCTA />
        <FAQ />
      </main>

      <Footer />
    </div>
  )
}
