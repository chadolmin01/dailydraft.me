'use client'

import React from 'react'
import Link from 'next/link'
import { Command } from 'lucide-react'

interface NavbarProps {
  onLoginClick: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ onLoginClick }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface-card/90 backdrop-blur-sm border-b border-border h-16 flex items-center px-4 sm:px-6 md:px-12 justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-black flex items-center justify-center">
          <span className="text-white font-bold text-lg font-mono">D</span>
        </div>
        <span className="font-bold text-xl tracking-tight">Draft.</span>
        <div className="hidden md:flex items-center gap-2 ml-4 px-2 py-1 bg-surface-card border border-border-strong">
          <div className="w-1.5 h-1.5 bg-green-500"></div>
          <span className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-secondary">OPEN BETA</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-txt-tertiary">
          <Link href="#how-it-works" className="hover:text-black transition-colors">이용 방법</Link>
          <Link href="#projects" className="hover:text-black transition-colors">프로젝트</Link>
          <Link href="#faq" className="hover:text-black transition-colors">FAQ</Link>
        </div>
        <button
          onClick={onLoginClick}
          className="text-sm font-medium border border-border-strong bg-surface-card hover:bg-black hover:text-white px-4 py-2 transition-all duration-200 font-mono text-xs"
        >
          로그인
        </button>
        <button
          onClick={onLoginClick}
          className="hidden md:flex items-center gap-2 text-sm font-bold bg-black text-white px-4 py-2 hover:bg-[#333] transition-all duration-200 shadow-solid-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
        >
          <span>시작하기</span>
          <Command size={14} />
        </button>
      </div>
    </nav>
  )
}
