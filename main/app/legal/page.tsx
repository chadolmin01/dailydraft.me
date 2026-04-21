import type { Metadata } from 'next'
import Link from 'next/link'
import { FileCheck2, Shield, Database, Trash2, Cookie, Scale } from 'lucide-react'

export const metadata: Metadata = {
  title: '법적 고지 모음 · Draft',
  description:
    'Draft 의 개인정보처리방침·서비스 이용약관·데이터 관련 정책을 한 곳에서 찾을 수 있는 인덱스.',
  alternates: { canonical: '/legal' },
  openGraph: {
    type: 'website',
    title: '법적 고지 모음 · Draft',
    description: '개인정보·약관·데이터 정책 인덱스.',
    url: '/legal',
    locale: 'ko_KR',
  },
}

interface LegalItem {
  href: string
  title: string
  desc: string
  icon: typeof Shield
  lastUpdated: string
}

const ITEMS: LegalItem[] = [
  {
    href: '/legal/privacy',
    title: '개인정보처리방침',
    desc: 'PIPA 기준 개인정보 수집·이용·위탁·파기 전체 조항.',
    icon: Shield,
    lastUpdated: '2026-04-21',
  },
  {
    href: '/legal/terms',
    title: '서비스 이용약관',
    desc: '이용자·기관·클럽의 권리·의무, 자동 발행 특약, 준거법·관할.',
    icon: Scale,
    lastUpdated: '2026-04-21',
  },
  {
    href: '/legal/retention',
    title: '데이터 보관·파기 정책',
    desc: '12개 데이터 유형별 보관 기간·파기 트리거·법정 보존 근거.',
    icon: Database,
    lastUpdated: '2026-04-22',
  },
  {
    href: '/legal/subprocessors',
    title: '수탁업체 목록',
    desc: '12개 수탁업체의 처리 범위·리전·이전 근거·보안 증빙.',
    icon: FileCheck2,
    lastUpdated: '2026-04-22',
  },
  {
    href: '/legal/cookies',
    title: '쿠키 사용 방침',
    desc: '사용 쿠키 전수 · DNT/GPC 대응 · 광고 미사용 명시.',
    icon: Cookie,
    lastUpdated: '2026-04-22',
  },
  {
    href: '/legal/data-deletion',
    title: '데이터 삭제 안내',
    desc: '정보주체 삭제권(PIPA 36조) 행사 경로·유예 기간.',
    icon: Trash2,
    lastUpdated: '2026-04-21',
  },
]

export default function LegalIndexPage() {
  return (
    <article className="max-w-none">
      <header className="mb-10">
        <p className="text-[12px] font-semibold text-brand mb-3">법적 고지</p>
        <h1 className="text-[28px] font-bold text-txt-primary tracking-tight">법적 고지 모음</h1>
        <p className="text-[14px] text-txt-secondary mt-2 leading-relaxed">
          개인정보·약관·수탁업체·데이터 보관 정책을 한 곳에 모았습니다. 실사·계약 검토 시 필요한
          문서를 빠르게 찾을 수 있도록 인덱스로 구성했습니다. 엔터프라이즈 DPA·PIPA 준수 근거 요청은{' '}
          <Link href="/trust" className="text-brand underline">
            신뢰 센터
          </Link>{' '}
          에서 통합 진입이 가능합니다.
        </p>
      </header>

      <ul className="space-y-3 mb-12">
        {ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group block bg-surface-card border border-border rounded-2xl p-5 hover:border-brand/40 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-brand" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[15px] font-bold text-txt-primary group-hover:text-brand transition-colors">
                      {item.title}
                    </h2>
                    <p className="text-[13px] text-txt-secondary mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                    <p className="text-[11px] text-txt-tertiary mt-2 tabular-nums">
                      최종 개정 {item.lastUpdated}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>

      <footer className="pt-8 border-t border-border text-[12px] text-txt-tertiary space-y-1">
        <p>
          관련 페이지:{' '}
          <Link href="/trust" className="text-brand underline">
            신뢰 센터
          </Link>{' '}
          ·{' '}
          <Link href="/status" className="text-brand underline">
            시스템 상태
          </Link>{' '}
          ·{' '}
          <Link href="/changelog" className="text-brand underline">
            릴리스 노트
          </Link>
        </p>
        <p>
          실사·DPA 요청:{' '}
          <a href="mailto:team@dailydraft.me?subject=Legal%20Docs" className="text-brand underline">
            team@dailydraft.me
          </a>
        </p>
      </footer>
    </article>
  )
}
