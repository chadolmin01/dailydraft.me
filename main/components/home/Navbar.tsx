'use client'

import React from 'react'
import Link from 'next/link'
import { Command } from 'lucide-react'

interface NavbarProps {
  onLoginClick: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ onLoginClick }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200 h-16 flex items-center px-4 sm:px-6 md:px-12 justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-black flex items-center justify-center">
          <span className="text-white font-bold text-lg font-mono">D</span>
        </div>
        <span className="font-bold text-xl tracking-tight">Draft.</span>
        <div className="hidden md:flex items-center gap-2 ml-4 px-2 py-1 bg-white border border-gray-300">
          <div className="w-1.5 h-1.5 bg-green-500"></div>
          <span className="text-[10px] font-mono font-medium text-gray-600 tracking-wider">OPEN BETA</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
          <Link href="#how-it-works" className="hover:text-black transition-colors">이용 방법</Link>
          <Link href="#projects" className="hover:text-black transition-colors">프로젝트</Link>
          <Link href="#faq" className="hover:text-black transition-colors">FAQ</Link>
        </div>
        <button
          onClick={onLoginClick}
          className="text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50 px-4 py-2 transition-all duration-200 hover:border-black font-mono text-xs"
        >
          로그인
        </button>
        <button
          onClick={onLoginClick}
          className="hidden md:flex items-center gap-2 text-sm font-bold bg-black text-white px-4 py-2 hover:bg-gray-900 transition-all duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:translate-y-[1px] hover:shadow-none"
        >
          <span>시작하기</span>
          <Command size={14} />
        </button>
      </div>
    </nav>
  )
}
