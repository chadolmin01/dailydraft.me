'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { PersonaRow } from '@/src/lib/personas/types'

interface Props {
  persona: PersonaRow & { term_end_at?: string | null; archived_at?: string | null }
  clubName: string | null
  canEdit: boolean
}

/**
 * 프로젝트 페르소나 라이프사이클 카드.
 *
 * 표시:
 *   - 기수 종료 예정일 (term_end_at)
 *   - 마지막 편집 시각 (owner_last_edited_at or updated_at)
 *   - 아카이브 상태 (archived_at 있으면 아카이브됨)
 *
 * 액션 (편집자만):
 *   - 종료일 변경
 *   - 수동 아카이브
 */
export function PersonaLifecycleCard({ persona, clubName, canEdit }: Props) {
  const [editingDate, setEditingDate] = useState(false)
  const [dateValue, setDateValue] = useState(
    persona.term_end_at ? persona.term_end_at.slice(0, 10) : '',
  )
  const qc = useQueryClient()

  const updateMut = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const res = await fetch(`/api/personas/${persona.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || '저장 실패')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['persona', persona.type, persona.owner_id] })
      toast.success('저장됐습니다')
      setEditingDate(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const termEnd = persona.term_end_at
    ? new Date(persona.term_end_at).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  const lastEdit = persona.owner_last_edited_at ?? persona.updated_at ?? null
  const lastEditDisplay = lastEdit ? formatRelative(lastEdit) : null

  const isArchived = !!persona.archived_at

  return (
    <section className="bg-surface-card border border-border rounded-2xl p-5 md:p-6">
      <h2 className="text-sm font-bold text-txt-primary mb-4">라이프사이클</h2>

      <dl className="space-y-3 text-[13px]">
        <Row label="종료일">
          <div className="flex items-center gap-2">
            {editingDate ? (
              <>
                <input
                  type="date"
                  value={dateValue}
                  onChange={(e) => setDateValue(e.target.value)}
                  className="text-xs px-2 py-1 rounded border border-border bg-surface-bg"
                />
                <button
                  disabled={updateMut.isPending}
                  onClick={() =>
                    updateMut.mutate({
                      term_end_at: dateValue ? new Date(dateValue).toISOString() : null,
                    })
                  }
                  className="text-[11px] font-semibold text-brand hover:underline"
                >
                  저장
                </button>
                <button
                  onClick={() => {
                    setEditingDate(false)
                    setDateValue(persona.term_end_at ? persona.term_end_at.slice(0, 10) : '')
                  }}
                  className="text-[11px] text-txt-tertiary hover:text-txt-secondary"
                >
                  취소
                </button>
              </>
            ) : (
              <>
                <span className="text-txt-primary">
                  {termEnd ?? '설정되지 않음'}
                  {clubName && termEnd && (
                    <span className="text-txt-tertiary text-[11px] ml-2">
                      · {clubName} 아카이브로 편입
                    </span>
                  )}
                </span>
                {canEdit && (
                  <button
                    onClick={() => setEditingDate(true)}
                    className="text-[11px] text-txt-tertiary hover:text-txt-secondary"
                  >
                    변경 →
                  </button>
                )}
              </>
            )}
          </div>
        </Row>

        {lastEditDisplay && (
          <Row label="최근 편집">
            <span className="text-txt-primary">{lastEditDisplay}</span>
          </Row>
        )}

        {isArchived && (
          <Row label="상태">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-sunken text-[11px] font-semibold text-txt-secondary">
              아카이브됨
            </span>
          </Row>
        )}
      </dl>

      {canEdit && !isArchived && termEnd && (
        <p className="text-[11px] text-txt-tertiary mt-4 pt-4 border-t border-border-subtle leading-relaxed">
          종료일이 되면 이 페르소나는 읽기 전용으로 전환되고 {clubName ?? '클럽'} 아카이브로 편입됩니다.
          발행된 모든 콘텐츠는 그대로 보존됩니다.
        </p>
      )}
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[11px] text-txt-tertiary w-20 shrink-0">{label}</dt>
      <dd className="flex-1 min-w-0 text-right">{children}</dd>
    </div>
  )
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86400000)
  if (d < 1) return '오늘'
  if (d < 7) return `${d}일 전`
  if (d < 30) return `${Math.floor(d / 7)}주 전`
  return new Date(iso).toLocaleDateString('ko-KR')
}
