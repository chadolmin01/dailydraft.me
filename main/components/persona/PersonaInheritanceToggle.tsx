'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { PersonaRow, PersonaFieldRow } from '@/src/lib/personas/types'

interface Props {
  persona: PersonaRow & { inherit_from_parent?: boolean | null }
  parentPersonaId: string
  parentLabel: string
  canEdit: boolean
}

/**
 * 선택적 상속 토글 — 프로젝트/개인 페르소나에서만 사용.
 *
 * persona.inherit_from_parent 불리언 토글:
 *   true  → AI 생성 시 parent 필드 참고 (default)
 *   false → 완전 독립 · 부모 safety rail 도 상속 안 됨
 *
 * 토글 변경은 즉시 저장. "차이 보기" 를 누르면 slide-over 로 parent 와
 * 이 페르소나의 필드 diff 표시.
 */
export function PersonaInheritanceToggle({
  persona,
  parentPersonaId,
  parentLabel,
  canEdit,
}: Props) {
  const [diffOpen, setDiffOpen] = useState(false)
  const qc = useQueryClient()
  const current = persona.inherit_from_parent ?? true

  const toggleMut = useMutation({
    mutationFn: async (next: boolean) => {
      const res = await fetch(`/api/personas/${persona.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inherit_from_parent: next }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || '상속 설정 저장 실패')
      }
      return next
    },
    onSuccess: (next) => {
      qc.invalidateQueries({ queryKey: ['persona', persona.type, persona.owner_id] })
      toast.success(next ? '부모 톤 참고를 켰습니다' : '부모 톤 참고를 껐습니다')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <>
      <section className="bg-surface-card border border-border rounded-2xl p-5 md:p-6">
        <div className="flex items-center justify-between gap-4 mb-2">
          <h2 className="text-sm font-bold text-txt-primary">상속</h2>
          <Switch
            checked={current}
            disabled={!canEdit || toggleMut.isPending}
            onChange={(v) => toggleMut.mutate(v)}
          />
        </div>

        <p className="text-[13px] text-txt-secondary leading-relaxed">
          {parentLabel} 클럽 톤을 AI 생성 시 기본값으로 참고합니다.
        </p>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-subtle">
          <p className="text-[11px] text-txt-tertiary">
            {current ? '참고 중 · 오버라이드는 슬롯에서 가능' : '완전 독립 · 부모 금기어도 상속 안 됨'}
          </p>
          <button
            onClick={() => setDiffOpen(true)}
            className="text-[11px] text-txt-tertiary hover:text-txt-secondary transition-colors"
          >
            차이 보기 →
          </button>
        </div>
      </section>

      {diffOpen && (
        <InheritanceDiffPanel
          projectPersonaId={persona.id}
          parentPersonaId={parentPersonaId}
          parentLabel={parentLabel}
          onClose={() => setDiffOpen(false)}
        />
      )}
    </>
  )
}

function Switch({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean
  disabled: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-brand' : 'bg-surface-sunken'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

// ============================================================
// Slide-over: 상속 diff
// ============================================================

interface DiffProps {
  projectPersonaId: string
  parentPersonaId: string
  parentLabel: string
  onClose: () => void
}

interface PersonaFetchResponse {
  persona: PersonaRow | null
  fields: PersonaFieldRow[]
}

function InheritanceDiffPanel({
  projectPersonaId,
  parentPersonaId,
  parentLabel,
  onClose,
}: DiffProps) {
  // ESC 키로 닫기 — modal UX 표준
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const { data: parentData } = useQuery<PersonaFetchResponse>({
    queryKey: ['persona-by-id', parentPersonaId],
    queryFn: () =>
      fetch(`/api/personas/${parentPersonaId}`).then((r) => r.json()),
    staleTime: 1000 * 60,
  })

  const { data: childData } = useQuery<PersonaFetchResponse>({
    queryKey: ['persona-by-id', projectPersonaId],
    queryFn: () =>
      fetch(`/api/personas/${projectPersonaId}`).then((r) => r.json()),
    staleTime: 1000 * 60,
  })

  const parentFields = new Map(
    (parentData?.fields ?? []).map((f) => [f.field_key, f]),
  )
  const childFields = new Map(
    (childData?.fields ?? []).map((f) => [f.field_key, f]),
  )

  const allKeys = Array.from(
    new Set([...parentFields.keys(), ...childFields.keys()]),
  )

  const inherited = allKeys.filter((k) => parentFields.has(k) && !childFields.has(k))
  const overridden = allKeys.filter((k) => childFields.has(k))

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="absolute inset-0 bg-black/30"
        aria-hidden="true"
      />
      <div
        className="relative bg-surface-card w-full max-w-md h-full shadow-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-surface-card border-b border-border px-5 py-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-txt-primary">상속 차이</h3>
          <button
            onClick={onClose}
            className="text-xs text-txt-tertiary hover:text-txt-primary transition-colors"
          >
            닫기
          </button>
        </div>

        <div className="p-5 space-y-6">
          {inherited.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-txt-tertiary uppercase tracking-wider mb-2">
                {parentLabel} 에서 상속
              </p>
              <ul className="space-y-2">
                {inherited.map((k) => (
                  <li
                    key={k}
                    className="flex items-center justify-between text-[12px] bg-surface-sunken/50 rounded-lg px-3 py-2"
                  >
                    <code className="font-mono text-txt-secondary">{k}</code>
                    <span className="text-[10px] text-brand font-semibold">상속</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {overridden.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-txt-tertiary uppercase tracking-wider mb-2">
                이 페르소나에서 재정의
              </p>
              <ul className="space-y-2">
                {overridden.map((k) => (
                  <li
                    key={k}
                    className="flex items-center justify-between text-[12px] bg-brand-bg/30 rounded-lg px-3 py-2"
                  >
                    <code className="font-mono text-txt-secondary">{k}</code>
                    <span className="text-[10px] text-brand font-semibold">재정의</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {inherited.length === 0 && overridden.length === 0 && (
            <p className="text-xs text-txt-tertiary text-center py-8">
              아직 채워진 슬롯이 없습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
