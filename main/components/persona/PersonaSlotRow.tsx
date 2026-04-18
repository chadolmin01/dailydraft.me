'use client'

import { Lock, Pencil, Plus } from 'lucide-react'
import { FIELD_CATALOG } from '@/src/lib/personas/field-catalog'
import type { FieldKey, PersonaFieldRow } from '@/src/lib/personas/types'

interface Props {
  fieldKey: FieldKey
  field: PersonaFieldRow | undefined
  canEdit: boolean
  onClick: () => void
}

/**
 * 컴팩트 슬롯 행. 클릭 시 우측 드로어에서 편집.
 * 아코디언 인라인 편집을 버리고 단일 드로어로 통일한 이유:
 *   - 2-column grid 아코디언은 한쪽 펼침 시 반대편 공백 생김
 *   - 편집 영역이 충분히 넓어야 긴 텍스트 편집 편함 (드로어가 해법)
 */
export function PersonaSlotRow({ fieldKey, field, canEdit, onClick }: Props) {
  const spec = FIELD_CATALOG[fieldKey]
  const isLocked = field?.locked === true
  const isInherited = field?.source === 'inherited'
  const isAuto = field?.source === 'auto'
  const isEmpty = !field
  const confidence = field?.confidence ?? 1
  const preview = textPreview(field)

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!canEdit && !field}
      className="group w-full text-left flex items-start gap-3 bg-surface-card border border-border rounded-xl px-4 py-3 hover:border-brand-border hover:bg-surface-bg transition-colors disabled:cursor-not-allowed"
    >
      {/* 좌: 슬롯명 + 뱃지 */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          <span className="text-sm font-semibold text-txt-primary">
            {spec.label}
          </span>
          {isLocked && (
            <Lock
              size={11}
              className="text-txt-tertiary"
              aria-label="편집 잠금"
            />
          )}
          {isInherited && (
            <span className="text-[10px] text-txt-tertiary px-1.5 py-0.5 rounded bg-surface-bg">
              상속됨
            </span>
          )}
          {isAuto && !isInherited && (
            <span className="text-[10px] text-brand px-1.5 py-0.5 rounded bg-brand-bg">
              AI 생성
            </span>
          )}
          {!isEmpty && confidence < 1 && (
            <span className="text-[10px] text-txt-tertiary">
              정확도 {Math.round(confidence * 100)}%
            </span>
          )}
        </div>
        <p className="text-xs text-txt-tertiary line-clamp-2 leading-relaxed">
          {isEmpty ? (
            <span className="italic">아직 작성되지 않았습니다</span>
          ) : (
            preview
          )}
        </p>
      </div>

      {/* 우: 액션 아이콘 */}
      <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-txt-tertiary group-hover:text-brand group-hover:bg-brand-bg transition-colors">
        {isEmpty ? <Plus size={14} /> : <Pencil size={14} />}
      </div>
    </button>
  )
}

function textPreview(field: PersonaFieldRow | undefined): string {
  if (!field) return ''
  const v = field.value as { text?: string; items?: unknown[] }
  if (typeof v.text === 'string') return v.text.trim()
  if (Array.isArray(v.items)) {
    return v.items
      .map((x) => (typeof x === 'string' ? x : JSON.stringify(x)))
      .join(' · ')
  }
  return JSON.stringify(field.value)
}
