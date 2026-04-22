'use client'

import Link from 'next/link'
import { FileEdit, ArrowRight, Sparkles } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { withRetry } from '@/src/lib/query-utils'

interface PendingDraft {
  id: string
  opportunity_id: string
  week_number: number
  title: string
  update_type: string
  source_message_count?: number
  created_at: string
}

export function usePendingDrafts(enabled: boolean) {
  return useQuery({
    queryKey: ['pending-drafts'],
    enabled,
    staleTime: 1000 * 60 * 3,
    queryFn: () =>
      withRetry(async () => {
        const res = await fetch('/api/ghostwriter/drafts')
        if (!res.ok) return []
        return res.json() as Promise<PendingDraft[]>
      }),
  })
}

const UPDATE_TYPE_LABEL: Record<string, string> = {
  weekly: '주간',
  milestone: '마일스톤',
  retro: '회고',
  decision: '의사결정',
  blocker: '블로커',
}

export default function PendingDraftCard() {
  const { data: drafts = [] } = usePendingDrafts(true)

  if (drafts.length === 0) return null

  const head = drafts[0]
  const rest = drafts.slice(1, 3)

  return (
    <div className="bg-surface-card rounded-2xl border border-border overflow-hidden">
      <div className="px-5 pt-4 pb-3 flex items-center gap-2 border-b border-border">
        <div className="w-7 h-7 rounded-lg bg-brand-bg flex items-center justify-center shrink-0">
          <Sparkles size={14} className="text-brand" />
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-bold text-txt-primary">
            Ghostwriter 가 작성한 주간 업데이트 초안 {drafts.length}건
          </p>
          <p className="text-[12px] text-txt-tertiary mt-0.5">
            Discord 활동을 요약한 초안입니다. 승인하시면 프로젝트 업데이트로 게시됩니다.
          </p>
        </div>
      </div>

      <Link
        href={`/drafts/${head.id}`}
        className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-sunken transition-colors group"
      >
        <div className="w-9 h-9 rounded-xl bg-brand-bg flex items-center justify-center shrink-0">
          <FileEdit size={16} className="text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-txt-primary truncate">
            {head.title}
          </p>
          <p className="text-[12px] text-txt-tertiary mt-0.5">
            {head.week_number}주차
            {UPDATE_TYPE_LABEL[head.update_type] && (
              <>
                <span className="mx-1.5 text-border">·</span>
                {UPDATE_TYPE_LABEL[head.update_type]}
              </>
            )}
            {head.source_message_count ? (
              <>
                <span className="mx-1.5 text-border">·</span>
                디스코드 메시지 {head.source_message_count}건
              </>
            ) : null}
          </p>
        </div>
        <ArrowRight
          size={14}
          className="text-txt-disabled group-hover:text-brand group-hover:translate-x-0.5 transition-all shrink-0"
        />
      </Link>

      {rest.length > 0 && (
        <div className="border-t border-border">
          {rest.map(d => (
            <Link
              key={d.id}
              href={`/drafts/${d.id}`}
              className="flex items-center gap-3 px-5 py-2.5 hover:bg-surface-sunken transition-colors group"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-txt-disabled shrink-0" />
              <p className="flex-1 min-w-0 text-[13px] text-txt-secondary truncate">
                <span className="font-medium text-txt-primary">{d.title}</span>
                <span className="ml-2 text-txt-tertiary">· {d.week_number}주차</span>
              </p>
              <ArrowRight
                size={12}
                className="text-txt-disabled group-hover:text-brand transition-colors shrink-0"
              />
            </Link>
          ))}
        </div>
      )}

      {drafts.length > 3 && (
        <Link
          href="/drafts"
          className="block px-5 py-2.5 border-t border-border text-[12px] font-semibold text-brand hover:bg-brand-bg transition-colors text-center"
        >
          {drafts.length - 3}건 더 보기 →
        </Link>
      )}
    </div>
  )
}
