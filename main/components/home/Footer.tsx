'use client'

import React from 'react'
import Link from 'next/link'

export const Footer: React.FC = () => {
  return (
    <footer className="bg-surface-card border-t border-border py-10 px-6 md:px-10 relative z-10">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">D</span>
            </div>
            <span className="font-bold text-sm tracking-tight">Draft.</span>
          </div>
          <p className="text-[10px] font-medium text-txt-disabled">
            &copy; 2026 Draft. All rights reserved.
          </p>
        </div>

        <div className="flex gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-medium text-txt-disabled">서비스</span>
            <Link href="#features" className="text-sm text-txt-secondary hover:text-black transition-colors">기능</Link>
            <Link href="#how-it-works" className="text-sm text-txt-secondary hover:text-black transition-colors">이용 방법</Link>
            <Link href="#projects" className="text-sm text-txt-secondary hover:text-black transition-colors">프로젝트</Link>
            <Link href="#faq" className="text-sm text-txt-secondary hover:text-black transition-colors">FAQ</Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-medium text-txt-disabled">안내</span>
            <Link href="/privacy" className="text-sm text-txt-secondary hover:text-black transition-colors">개인정보처리방침</Link>
            <Link href="/terms" className="text-sm text-txt-secondary hover:text-black transition-colors">이용약관</Link>
            <Link href="mailto:contact@dailydraft.me" className="text-sm text-txt-secondary hover:text-black transition-colors">문의하기</Link>
            <Link href="/login" className="text-sm text-txt-secondary hover:text-black transition-colors">로그인</Link>
          </div>
        </div>

        <div className="flex items-center gap-2 border border-border px-3 py-1.5 bg-surface-sunken rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-indicator-online"></div>
          <span className="text-[10px] font-medium text-txt-tertiary">OPEN BETA</span>
        </div>
      </div>
    </footer>
  )
}
