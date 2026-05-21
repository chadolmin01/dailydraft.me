'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Rocket, CheckCircle2, Circle, X, ArrowRight, Users, FileText, Target } from 'lucide-react'
import type { ProjectUpdate } from '@/src/hooks/useProjectUpdates'

interface Props {
  projectId: string
  isOwner: boolean
  createdAt: string | null
  description: string | null
  memberCount: number
  updates: ProjectUpdate[]
}

function daysSince(iso: string | null): number {
  if (!iso) return Infinity
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

/**
 * 킥오프 체크리스트 — 생성 후 14일 이내 + 운영자 한정 + 미완료 항목 있을 때만 노출.
 * localStorage 로 dismiss 상태 기억해 한번 닫으면 안 보이게 함 (수동 재노출은 추후).
 *
 * 왜 이 위치에: 프로젝트 페이지 상단에 고정 노출해 킥오프 누락 방지.
 * 4/27 FLIP 킥오프 시 팀장들이 "첫 주 뭐 해야 하지?" 질문 제거.
 */
export function KickoffChecklist({
  projectId,
  isOwner,
  createdAt,
  description,
  memberCount,
  updates,
}: Props) {
  const [dismissed, setDismissed] = useState<boolean | null>(null)
  const storageKey = `kickoff-dismissed-${projectId}`

  useEffect(() => {
    if (typeof window === 'undefined') return
    setDismissed(window.localStorage.getItem(storageKey) === '1')
  }, [storageKey])

  const items = useMemo(() => ([
    {
      key: 'description',
      label: '프로젝트 목표·범위 작성',
      done: !!(description && description.trim().length >= 30),
      icon: Target,
      href: `/projects/${projectId}/edit`,
      actionLabel: '설명 작성',
    },
    {
      key: 'members',
      label: '팀원 초대',
      done: memberCount >= 2,
      icon: Users,
      href: `/projects/${projectId}?tab=applications`,
      actionLabel: '초대 관리',
    },
    {
      key: 'update',
      label: '첫 주 회고 작성',
      done: updates.length > 0,
      icon: FileText,
      href: `/projects/${projectId}?tab=updates`,
      actionLabel: '회고 남기기',
    },
  ]), [description, memberCount, updates, projectId])

  const completed = items.filter(i => i.done).length
  const total = items.length
  const allDone = completed === total

  const age = daysSince(createdAt)

  // Hydration-aware: show only after we've read localStorage
  if (dismissed === null) return null
  if (!isOwner) return null
  if (dismissed) return null
  if (age > 14) return null
  if (allDone) return null

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, '1')
    }
    setDismissed(true)
  }

  return (
    <div className="relative bg-surface-card border border-brand-border rounded-2xl p-5 mb-6">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-txt-disabled hover:text-txt-tertiary transition-colors"
        aria-label="닫기"
      >
        <X size={14} />
      </button>

      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center shrink-0">
          <Rocket size={18} className="text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-txt-primary">
            킥오프 체크리스트 <span className="text-brand tabular-nums">{completed}/{total}</span>
          </p>
          <p className="text-[12px] text-txt-tertiary mt-0.5">
            팀이 첫 2주 안에 이 네 가지를 끝내면 이후가 훨씬 수월합니다
          </p>
        </div>
      </div>

      <div className="h-1 bg-surface-sunken rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-brand transition-all duration-500"
          style={{ width: `${(completed / total) * 100}%` }}
        />
      </div>

      <ul className="space-y-2">
        {items.map(item => {
          const Icon = item.icon
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  item.done ? 'bg-surface-sunken/50' : 'hover:bg-surface-sunken'
                }`}
              >
                {item.done ? (
                  <CheckCircle2 size={16} className="text-status-success-text shrink-0" />
                ) : (
                  <Circle size={16} className="text-txt-disabled shrink-0" />
                )}
                <Icon size={13} className={item.done ? 'text-txt-disabled' : 'text-txt-tertiary'} />
                <span className={`flex-1 text-[13px] ${
                  item.done ? 'text-txt-tertiary line-through' : 'font-semibold text-txt-primary'
                }`}>
                  {item.label}
                </span>
                {!item.done && (
                  <span className="text-[12px] font-semibold text-brand flex items-center gap-0.5">
                    {item.actionLabel}
                    <ArrowRight size={11} />
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
