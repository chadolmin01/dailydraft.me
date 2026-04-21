import type { Metadata } from 'next'
import { Compass, CheckCircle2, Loader2, Clock, Archive } from 'lucide-react'
import { ROADMAP, type RoadmapStatus } from '@/src/content/roadmap'

export const metadata: Metadata = {
  title: '로드맵 · Draft',
  description: '분기별 로드맵과 주요 기능 계획을 공개합니다. 학교·기관 파트너십 검토 단계에서 "곧 오는 기능" 확인이 필요하시면 참고해주십시오.',
  alternates: { canonical: '/roadmap' },
  openGraph: {
    type: 'article',
    title: '로드맵 · Draft',
    description: '분기별 로드맵과 주요 기능 계획을 공개합니다.',
    url: '/roadmap',
    locale: 'ko_KR',
  },
}

const STATUS_META: Record<RoadmapStatus, { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string; bg: string }> = {
  'planned':     { label: '예정',      icon: Clock,         color: 'text-txt-secondary',     bg: 'bg-surface-sunken' },
  'in-progress': { label: '진행 중',  icon: Loader2,       color: 'text-brand',             bg: 'bg-brand-bg' },
  'shipped':     { label: '배포 완료',icon: CheckCircle2,  color: 'text-indicator-online',  bg: 'bg-status-success-bg' },
  'deferred':    { label: '이관',     icon: Archive,       color: 'text-txt-tertiary',      bg: 'bg-surface-sunken' },
}

/**
 * /roadmap — 공개 분기별 로드맵.
 *
 * 단일 진실 소스: src/content/roadmap.ts.
 * 배포/상태 변경 시 해당 파일 수정 후 배포. 배포 완료된 항목은 /changelog 로도 이동.
 */
export default function RoadmapPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <header className="mb-12">
        <div className="flex items-center gap-2 mb-3">
          <Compass size={16} className="text-brand" aria-hidden="true" />
          <p className="text-[12px] font-semibold text-brand">로드맵</p>
        </div>
        <h1 className="text-[28px] font-bold text-txt-primary tracking-tight">
          Draft 가 어디로 가는가
        </h1>
        <p className="text-[14px] text-txt-secondary mt-2 leading-relaxed">
          분기별 방향성과 주요 기능 계획을 공개합니다. 과도한 약속은 피하고 실제 분기 내 반영 가능한 범위만 올립니다. 이미 배포된 항목은 <a href="/changelog" className="text-brand underline">릴리스 노트</a> 로 이관됩니다.
        </p>
      </header>

      <section className="space-y-14">
        {ROADMAP.map((q) => (
          <article key={q.quarter}>
            <header className="mb-5">
              <h2 className="text-[18px] font-bold text-txt-primary">{q.quarter}</h2>
              <p className="text-[12px] text-txt-tertiary mt-0.5 font-mono">{q.window}</p>
              <p className="text-[13px] text-txt-secondary mt-2 italic">
                {q.theme}
              </p>
            </header>
            <ul className="space-y-2">
              {q.items.map((item, idx) => {
                const meta = STATUS_META[item.status]
                const Icon = meta.icon
                return (
                  <li key={idx} className="bg-surface-card border border-border rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.bg} ${meta.color}`}>
                        <Icon size={10} aria-hidden="true" className={item.status === 'in-progress' ? 'animate-spin' : undefined} />
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
          로드맵은 분기 시작 시 갱신되고, 배포 완료된 항목은 <a href="/changelog" className="text-brand underline">릴리스 노트</a> 로 이관됩니다. 특정 기능의 우선순위나 포함 요청은 <a href="mailto:team@dailydraft.me?subject=Roadmap%20Request" className="text-brand underline">team@dailydraft.me</a>.
        </p>
      </footer>
    </main>
  )
}
