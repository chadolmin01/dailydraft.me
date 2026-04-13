import React from 'react'
import Link from 'next/link'

const footerLinks = {
  제품: [
    { label: '기능', href: '#features' },
    { label: '가격', href: '#pricing' },
    { label: '로드맵', href: '#' },
  ],
  리소스: [
    { label: '도움말', href: '#' },
    { label: 'API 문서', href: '#' },
    { label: '블로그', href: '#' },
  ],
  회사: [
    { label: '이용약관', href: '/terms' },
    { label: '개인정보처리방침', href: '/privacy' },
    { label: '문의하기', href: 'mailto:contact@dailydraft.me' },
  ],
}

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border bg-surface-card relative z-10">
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-10">
          {/* Logo & tagline */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">D</span>
              </div>
              <span className="font-bold text-sm tracking-tight text-txt-primary">
                Draft
              </span>
            </div>
            <p className="text-xs text-txt-tertiary leading-relaxed whitespace-pre-line">
              {'동아리의 세대를 잇는 인프라.\n운영은 Draft에, 소통은 원하는 곳에.'}
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="flex flex-col gap-2.5">
              <span className="text-xs font-semibold text-txt-tertiary mb-1">
                {category}
              </span>
              {links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm text-txt-secondary hover:text-txt-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-6">
          <p className="text-xs text-txt-disabled">
            &copy; 2026 Draft. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
