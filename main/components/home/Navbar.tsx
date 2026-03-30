'use client'

import React from 'react'
import Link from 'next/link'
import { Command } from 'lucide-react'

interface NavbarProps {
  onLoginClick: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ onLoginClick }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface-card/90 backdrop-blur-sm border-b border-border h-12 flex items-center px-4 sm:px-6 md:px-10 justify-between">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-black flex items-center justify-center">
          <span className="text-white font-bold text-sm font-mono">D</span>
        </div>
        <span className="font-bold text-base tracking-tight">Draft.</span>
        <div className="hidden md:flex items-center gap-2 ml-4 px-2 py-1 bg-surface-card rounded-xl border border-border">
          <div className="w-1.5 h-1.5 bg-indicator-online"></div>
          <span className="text-[0.625rem] font-medium text-txt-secondary">OPEN BETA</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-5 text-xs font-medium text-txt-tertiary">
          <Link href="#how-it-works" className="hover:text-black transition-colors">이용 방법</Link>
          <Link href="#projects" className="hover:text-black transition-colors">프로젝트</Link>
          <Link href="#faq" className="hover:text-black transition-colors">FAQ</Link>
        </div>
        <button
          onClick={onLoginClick}
          className="text-xs font-medium border border-border bg-surface-card rounded-xl hover:bg-black hover:text-white px-3 py-1.5 transition-all duration-200 font-mono"
        >
          로그인
        </button>
        <button
          onClick={onLoginClick}
          className="hidden md:flex items-center gap-1.5 text-xs font-bold bg-surface-inverse text-txt-inverse px-3 py-1.5 hover:bg-surface-inverse/90 transition-all duration-200 shadow-solid-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
        >
          <span>시작하기</span>
          <Command size={14} />
        </button>
      </div>
    </nav>
  )
}
