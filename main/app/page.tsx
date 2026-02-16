'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { BackgroundGrid } from '@/components/home/BackgroundGrid'
import { Navbar } from '@/components/home/Navbar'
import { Hero } from '@/components/home/Hero'
import { Features } from '@/components/home/Features'
import { Footer } from '@/components/home/Footer'

export default function HomePage() {
  const router = useRouter()

  const handleLoginClick = () => {
    router.push('/login')
  }

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden text-slate-900 font-sans selection:bg-black selection:text-white bg-white">
      <BackgroundGrid />

      <Navbar onLoginClick={handleLoginClick} />

      <main className="relative z-10 pt-20">
        <Hero onCtaClick={handleLoginClick} />
        <Features />
      </main>

      <Footer />
    </div>
  )
}
