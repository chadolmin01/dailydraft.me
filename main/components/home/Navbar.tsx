'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 bg-surface-card/90 backdrop-blur-sm border-b border-border h-12 flex items-center px-4 sm:px-6 md:px-10 justify-between transition-shadow duration-200 ${scrolled ? 'shadow-sm' : ''}`}>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm font-mono">D</span>
        </div>
        <span className="font-bold text-base tracking-tight">Draft.</span>
        <div className="hidden md:flex items-center gap-2 ml-4 px-2 py-1 bg-surface-card rounded-full border border-border">
          <div className="w-1.5 h-1.5 rounded-full bg-indicator-online"></div>
          <span className="text-[10px] font-medium text-txt-secondary">OPEN BETA</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-5 text-xs font-medium text-txt-tertiary">
          <Link href="#how-it-works" className="hover:text-black transition-colors">이용 방법</Link>
          <Link href="#projects" className="hover:text-black transition-colors">프로젝트</Link>
          <Link href="#faq" className="hover:text-black transition-colors">FAQ</Link>
          <Link href="/explore" className="hover:text-black transition-colors">둘러보기</Link>
        </div>
        <Link
          href="/login"
          className="text-xs font-medium border border-border bg-surface-card rounded-full hover:bg-surface-sunken px-3 py-1.5 transition-colors duration-200"
        >
          로그인
        </Link>
        <Link
          href="/login"
          className="hidden md:flex items-center gap-1.5 text-xs font-bold bg-brand text-white rounded-full px-4 py-2 hover:bg-brand-hover transition-colors duration-200"
        >
          시작하기
        </Link>
      </div>
    </nav>
  )
}
