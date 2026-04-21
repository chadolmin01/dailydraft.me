import React from 'react'
import Link from 'next/link'

// 존재하는 페이지만 링크. "준비 중" 라벨도 지양 — 혼란만 야기.
// 추후 로드맵/도움말/블로그 생길 때마다 여기 추가.
//
// 연락처: 실제 운영 중인 메일박스는 team@dailydraft.me 한 개이므로,
// 기관/일반 분기는 mailto subject 파라미터로만 라우팅한다.
// (institution@/contact@ 별도 주소 없음 — 잘못 보내지면 바운스됨)
type FooterLink = { label: string; href: string; external?: boolean; badge?: string }

const footerLinks: Record<string, FooterLink[]> = {
  제품: [
    { label: '기능', href: '#features' },
    { label: '가격', href: '#pricing' },
    { label: '학교·기관', href: '#institutions' },
    { label: '자주 묻는 질문', href: '/help' },
    { label: '릴리스 노트', href: '/changelog' },
  ],
  '신뢰·투명성': [
    // SLO target 은 실측이 아니라 목표치이므로 "target" 명시 — oversell 방지
    { label: '시스템 상태', href: '/status', badge: '99.9% target' },
    // Meta App Review 제출 URL 과 일치시킴 (/legal/ 경로). 기존 /privacy·/terms 는 별도 라우트 그룹에
    // 남아있고 호환용으로 유지되나, 공식 공개 링크는 /legal/* 로 통일해서 리뷰 시 혼선 방지.
    { label: '개인정보처리방침', href: '/legal/privacy' },
    { label: '이용약관', href: '/legal/terms' },
    { label: '데이터 삭제', href: '/legal/data-deletion' },
  ],
  회사: [
    {
      label: '기관 문의',
      href: 'mailto:team@dailydraft.me?subject=Institution%20Inquiry',
      external: true,
    },
    {
      label: '일반 문의',
      href: 'mailto:team@dailydraft.me?subject=General%20Inquiry',
      external: true,
    },
    {
      label: '엔터프라이즈 실사 문서',
      href: 'mailto:team@dailydraft.me?subject=Due%20Diligence%20Docs',
      external: true,
    },
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
                  className="text-sm text-txt-secondary hover:text-txt-primary transition-colors inline-flex items-baseline gap-1.5"
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="text-[10px] font-mono text-txt-tertiary">
                      {link.badge}
                    </span>
                  )}
                </Link>
              ))}
              {/* 엔터프라이즈 마이크로카피 — "신뢰·투명성" 컬럼 아래 1줄 선언.
                  실사 문서 라우팅을 명시적으로 적어 기관 방문자가 어디로 문의해야 할지 혼동 방지. */}
              {category === '신뢰·투명성' && (
                <p className="text-[11px] text-txt-tertiary leading-relaxed mt-1 break-keep">
                  개인정보는 한국 PIPA 기준으로 처리됩니다.
                  <br />
                  엔터프라이즈 실사 문서 요청은{' '}
                  <a
                    href="mailto:team@dailydraft.me?subject=Due%20Diligence%20Docs"
                    className="underline decoration-dotted underline-offset-2 hover:text-txt-primary"
                  >
                    team@dailydraft.me
                  </a>{' '}
                  로 문의.
                </p>
              )}
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
