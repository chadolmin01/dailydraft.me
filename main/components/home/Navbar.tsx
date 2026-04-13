'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 모바일 메뉴 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const navLinks = [
    { href: '#features', label: '기능' },
    { href: '#use-cases', label: '사례' },
    { href: '#pricing', label: '가격' },
  ]

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-5 sm:px-8 md:px-12 justify-between transition-all duration-200 border-b ${
          scrolled
            ? 'bg-surface-card/80 backdrop-blur-xl border-border shadow-sm'
            : 'bg-transparent border-transparent'
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 bg-brand rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <span className="font-bold text-base tracking-tight text-txt-primary">
            Draft
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-7 text-[13px] font-medium text-txt-secondary">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-txt-primary transition-colors duration-150"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="hover:text-txt-primary transition-colors duration-150"
          >
            로그인
          </Link>
        </div>

        {/* Desktop CTA */}
        <Link
          href="/login"
          className="hidden md:flex items-center justify-center bg-brand text-white text-[13px] font-semibold px-5 py-2 rounded-full hover:bg-brand-hover transition-colors duration-150 active:scale-[0.97]"
        >
          무료로 시작하기
        </Link>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex flex-col items-center justify-center w-8 h-8 gap-1.5"
          aria-label="메뉴 열기"
        >
          <span
            className={`block w-5 h-[1.5px] bg-txt-primary transition-all duration-200 ${
              mobileOpen ? 'rotate-45 translate-y-[4.5px]' : ''
            }`}
          />
          <span
            className={`block w-5 h-[1.5px] bg-txt-primary transition-all duration-200 ${
              mobileOpen ? '-rotate-45 -translate-y-[1.5px]' : ''
            }`}
          />
        </button>
      </nav>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-surface-card/95 backdrop-blur-xl pt-14 md:hidden">
          <div className="flex flex-col items-center gap-6 pt-12 text-lg font-medium text-txt-primary">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="hover:text-brand transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="text-txt-secondary hover:text-txt-primary transition-colors"
            >
              로그인
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="mt-4 bg-brand text-white text-base font-semibold px-8 py-3 rounded-full hover:bg-brand-hover transition-colors"
            >
              무료로 시작하기
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
