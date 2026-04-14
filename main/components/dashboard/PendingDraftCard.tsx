'use client'

import Link from 'next/link'
import { FileEdit, ArrowRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { withRetry } from '@/src/lib/query-utils'

interface PendingDraft {
  id: string
  opportunity_id: string
  week_number: number
  title: string
  update_type: string
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

export default function PendingDraftCard() {
  const { data: drafts = [] } = usePendingDrafts(true)

  if (drafts.length === 0) return null

  return (
    <Link
      href={`/drafts/${drafts[0].id}`}
      className="flex items-center justify-between bg-surface-card rounded-xl border border-border p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-brand-bg border border-brand-border flex items-center justify-center">
          <FileEdit size={14} className="text-brand" />
        </div>
        <div>
          <p className="text-sm font-bold text-txt-primary">
            AI 주간 업데이트 초안 {drafts.length}건
          </p>
          <p className="text-[10px] font-mono text-txt-tertiary">
            승인하면 프로젝트 업데이트로 게시됩니다
          </p>
        </div>
      </div>
      <ArrowRight size={16} className="text-txt-disabled group-hover:text-txt-primary transition-colors" />
    </Link>
  )
}
