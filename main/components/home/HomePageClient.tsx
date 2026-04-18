import React from 'react'
import { Navbar } from '@/components/home/Navbar'
import { Hero } from '@/components/home/Hero'
import { FeatureBar } from '@/components/home/FeatureBar'
import { BeforeAfterTabs } from '@/components/home/BeforeAfterTabs'
import { DemoTabs } from '@/components/home/DemoTabs'
import { HowItWorks } from '@/components/home/HowItWorks'
import { Scenarios } from '@/components/home/Scenarios'
import { Pricing } from '@/components/home/Pricing'
import { FAQ } from '@/components/home/FAQ'
import { FinalCTA } from '@/components/home/FinalCTA'
import { Footer } from '@/components/home/Footer'

export default function HomePageClient() {
  return (
    <div className="min-h-screen w-full relative overflow-x-hidden text-txt-primary font-sans selection:bg-black selection:text-white bg-surface-card">
      <Navbar />

      <main id="main-content" className="relative pt-14">
        <Hero />
        <FeatureBar />
        <BeforeAfterTabs />
        <DemoTabs />
        <HowItWorks />
        <Scenarios />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  )
}
