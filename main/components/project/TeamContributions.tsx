'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sparkles, FileText } from 'lucide-react'
import { supabase } from '@/src/lib/supabase/client'

interface Contribution {
  user_id: string
  nickname: string | null
  update_count: number
}

interface Member {
  user_id: string
  nickname: string | null
}

interface Props {
  opportunityId: string
  members: Member[]
  creatorId?: string | null
  creatorNickname?: string | null
}

/**
 * 팀원 개별 기여 요약 — 주간 업데이트 작성 횟수 기준.
 * 왜: 팀장이 "누가 얼마나 기여하고 있는지" 가시화. 공정성 이슈 완화.
 * 메시지/의사결정 집계는 Discord 연동 시에만 가능해 여기선 주간 업데이트만 사용.
 */
export function TeamContributions({ opportunityId, members, creatorId, creatorNickname }: Props) {
  const allMembers = useMemo<Member[]>(() => {
    const map = new Map<string, Member>()
    if (creatorId) map.set(creatorId, { user_id: creatorId, nickname: creatorNickname ?? null })
    for (const m of members) {
      if (!map.has(m.user_id)) map.set(m.user_id, m)
    }
    return Array.from(map.values())
  }, [members, creatorId, creatorNickname])

  const { data } = useQuery<Contribution[]>({
    queryKey: ['team-contributions', opportunityId],
    enabled: !!opportunityId && allMembers.length > 0,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data: updates, error } = await supabase
        .from('project_updates')
        .select('author_id')
        .eq('opportunity_id', opportunityId)
      if (error) throw error

      const counts = new Map<string, number>()
      for (const u of updates ?? []) {
        const id = u.author_id
        if (!id) continue
        counts.set(id, (counts.get(id) ?? 0) + 1)
      }

      return allMembers.map(m => ({
        user_id: m.user_id,
        nickname: m.nickname,
        update_count: counts.get(m.user_id) ?? 0,
      }))
    },
  })

  if (!data || data.length === 0) return null
  const total = data.reduce((s, c) => s + c.update_count, 0)
  if (total === 0) return null

  const max = Math.max(1, ...data.map(d => d.update_count))
  const sorted = [...data].sort((a, b) => b.update_count - a.update_count)

  return (
    <div className="bg-surface-card border border-border rounded-2xl p-5 mb-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={14} className="text-brand" />
        <h3 className="text-[14px] font-bold text-txt-primary">기여 요약</h3>
        <span className="text-[11px] text-txt-tertiary ml-auto flex items-center gap-1">
          <FileText size={11} />
          주간 업데이트 기준
        </span>
      </div>
      <ul className="space-y-2.5">
        {sorted.map(c => (
          <li key={c.user_id} className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-brand-bg flex items-center justify-center text-[10px] font-bold text-brand shrink-0">
              {c.nickname?.[0] ?? '?'}
            </div>
            <span className="text-[13px] font-medium text-txt-primary w-20 truncate shrink-0">
              {c.nickname ?? '익명'}
            </span>
            <div className="flex-1 h-1.5 bg-surface-sunken rounded-full overflow-hidden">
              <div
                className="h-full bg-brand transition-all duration-500"
                style={{ width: `${(c.update_count / max) * 100}%` }}
              />
            </div>
            <span className="text-[12px] font-bold tabular-nums text-txt-primary shrink-0 w-8 text-right">
              {c.update_count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
