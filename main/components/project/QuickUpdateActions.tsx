'use client'

import { FileText, AlertTriangle, GitBranch, Sparkles } from 'lucide-react'
import { useCreateProjectUpdate } from '@/src/hooks/useProjectUpdates'
import { toast } from 'sonner'
import { useState } from 'react'

interface Props {
  opportunityId: string
  currentWeek: number
}

/**
 * 팀 프로젝트 페이지 상단 빠른 기록 액션 — 운영자/팀원 전용.
 *
 * 템플릿 기반 1-step 기록: "블로커 생김" 만 보고하고 편집 페이지로 이동 없이 즉시 저장.
 * 왜: 블로커 생긴 직후 가장 느끼는 피로는 "또 업데이트 창 열기".
 *  핵심 지점을 1-click 으로 기록해야 실제로 쌓임.
 */
export function QuickUpdateActions({ opportunityId, currentWeek }: Props) {
  const createUpdate = useCreateProjectUpdate()
  const [pending, setPending] = useState<string | null>(null)

  const handleQuickRecord = async (
    kind: 'blocker' | 'decision' | 'checkin',
    promptText: string
  ) => {
    const content = window.prompt(promptText)
    if (!content || !content.trim()) return

    const title =
      kind === 'blocker' ? `Week ${currentWeek} 블로커` :
      kind === 'decision' ? `Week ${currentWeek} 결정` :
      `Week ${currentWeek} 체크인`

    const prefix =
      kind === 'blocker' ? '[블로커] ' :
      kind === 'decision' ? '[의사결정] ' :
      '[체크인] '

    const update_type =
      kind === 'blocker' ? 'general' :
      kind === 'decision' ? 'ideation' :
      'general'

    setPending(kind)
    try {
      await createUpdate.mutateAsync({
        opportunity_id: opportunityId,
        week_number: currentWeek,
        title,
        content: prefix + content.trim(),
        update_type: update_type as 'general' | 'ideation' | 'development' | 'design' | 'launch',
      })
      toast.success('기록이 저장되었습니다')
    } catch {
      toast.error('저장에 실패했습니다')
    } finally {
      setPending(null)
    }
  }

  const actions = [
    {
      key: 'blocker' as const,
      icon: AlertTriangle,
      label: '블로커 기록',
      hint: '막힌 지점 한줄 남기기',
      prompt: '지금 막힌 지점을 한줄로 알려주세요 (예: API 응답 500 에러 디버깅 중)',
      color: 'text-status-danger-text',
      bg: 'bg-status-danger-bg',
    },
    {
      key: 'decision' as const,
      icon: GitBranch,
      label: '결정 기록',
      hint: '오늘 정한 것',
      prompt: '오늘 팀이 내린 결정을 한줄로 알려주세요',
      color: 'text-status-info-text',
      bg: 'bg-status-info-bg',
    },
    {
      key: 'checkin' as const,
      icon: FileText,
      label: '체크인',
      hint: '오늘 한 일 간단히',
      prompt: '오늘 한 일을 한줄로 알려주세요',
      color: 'text-status-success-text',
      bg: 'bg-status-success-bg',
    },
  ]

  return (
    <div className="mb-6">
      <div className="flex items-center gap-1.5 mb-2.5 text-[11px] font-semibold text-txt-tertiary">
        <Sparkles size={10} />
        빠른 기록
      </div>
      <div className="grid grid-cols-3 gap-2">
        {actions.map(a => {
          const Icon = a.icon
          const isPending = pending === a.key
          return (
            <button
              key={a.key}
              onClick={() => handleQuickRecord(a.key, a.prompt)}
              disabled={isPending}
              className="text-left bg-surface-card border border-border rounded-xl p-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 group"
            >
              <div className={`w-8 h-8 rounded-lg ${a.bg} flex items-center justify-center mb-2`}>
                <Icon size={14} className={a.color} />
              </div>
              <p className="text-[13px] font-bold text-txt-primary">
                {isPending ? '저장 중…' : a.label}
              </p>
              <p className="text-[11px] text-txt-tertiary mt-0.5">{a.hint}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
