import type { Metadata } from 'next'
import Link from 'next/link'
import { Sparkles, Zap, ShieldCheck, FileText, Wrench } from 'lucide-react'
import { CHANGELOG, type ChangelogEntryType } from '@/src/content/changelog'

export const metadata: Metadata = {
  title: '릴리스 노트 · Draft',
  description: 'Draft 의 주요 업데이트와 배포 이력을 공개합니다. 엔터프라이즈 실사·학교 파트너십 대응에도 동일한 기록이 근거로 쓰입니다.',
  alternates: { canonical: '/changelog' },
  openGraph: {
    type: 'article',
    title: '릴리스 노트 · Draft',
    description: 'Draft 의 주요 업데이트와 배포 이력을 공개합니다.',
    url: '/changelog',
    locale: 'ko_KR',
  },
}

const TYPE_META: Record<ChangelogEntryType, { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string; bg: string }> = {
  feature:     { label: '신규',   icon: Sparkles,   color: 'text-brand',              bg: 'bg-brand-bg' },
  improvement: { label: '개선',   icon: Zap,        color: 'text-indicator-online',   bg: 'bg-status-success-bg' },
  security:    { label: '보안',   icon: ShieldCheck,color: 'text-status-warn-text',   bg: 'bg-status-warn-bg' },
  fix:         { label: '수정',   icon: Wrench,     color: 'text-indicator-premium-border', bg: 'bg-status-warning-bg' },
  docs:        { label: '문서',   icon: FileText,   color: 'text-txt-secondary',      bg: 'bg-surface-sunken' },
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

/**
 * /changelog — 공개 릴리스 노트.
 *
 * 데이터 소스: src/content/changelog.ts (단일 진실 소스).
 * 새 항목 추가는 해당 파일 상단에 객체 하나 올리기만 하면 됨.
 * 구조화 데이터(RSS/Atom)는 추후 필요 시 별도 라우트로.
 */
export default function ChangelogPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <header className="mb-12">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-brand" aria-hidden="true" />
          <p className="text-[12px] font-semibold text-brand">릴리스 노트</p>
        </div>
        <h1 className="text-[28px] font-bold text-txt-primary tracking-tight">
          Draft 가 지금까지 어떻게 달라져왔는가
        </h1>
        <p className="text-[14px] text-txt-secondary mt-2 leading-relaxed">
          주요 배포 이력을 공개합니다. 기관 실사·학교 파트너십에서 "활발히 유지되는 프로덕트인지" 를 확인하실 때 동일한 기록을 근거로 쓰실 수 있습니다. 세부 변경은 <a href="https://github.com/chadolmin01/dailydraft.me/commits/main" className="text-brand underline" target="_blank" rel="noopener noreferrer">GitHub 커밋 히스토리</a> 에 모두 열려 있습니다.
        </p>
      </header>

      <section className="space-y-10">
        {CHANGELOG.map((entry) => (
          <article key={entry.date} className="relative pl-6 border-l-2 border-border">
            {/* 날짜 + 버전 헤더 */}
            <div className="absolute left-[-7px] top-1 w-3 h-3 rounded-full bg-brand ring-4 ring-surface-bg" aria-hidden="true" />
            <header className="mb-4 flex items-baseline gap-3 flex-wrap">
              <h2 className="text-[16px] font-bold text-txt-primary">
                {formatDate(entry.date)}
              </h2>
              {entry.version && (
                <code className="text-[11px] font-mono text-txt-tertiary bg-surface-sunken px-1.5 py-0.5 rounded">
                  {entry.version}
                </code>
              )}
            </header>

            <ul className="space-y-3">
              {entry.items.map((item, idx) => {
                const meta = TYPE_META[item.type]
                const Icon = meta.icon
                return (
                  <li key={idx} className="bg-surface-card border border-border rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.bg} ${meta.color} shrink-0`}>
                        <Icon size={10} aria-hidden="true" />
                        {meta.label}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-txt-primary">{item.title}</p>
                        {item.note && (
                          <p className="text-[12px] text-txt-tertiary mt-1 leading-relaxed">{item.note}</p>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </article>
        ))}
      </section>

      <footer className="mt-16 pt-8 border-t border-border text-[13px] text-txt-tertiary space-y-2">
        <p>
          정식 버전 체계는 v1.0 이후부터 의미 있는 단위로 부여됩니다. 현재 v0.x 는 클로즈드 베타 단계의 임시 버전입니다.
        </p>
        <p>
          이슈 제보·개선 요청은 <a href="mailto:team@dailydraft.me?subject=Changelog%20Feedback" className="text-brand underline">team@dailydraft.me</a>. 보안 관련은 <Link href="/.well-known/security.txt" className="text-brand underline">/.well-known/security.txt</Link>.
        </p>
      </footer>
    </main>
  )
}
