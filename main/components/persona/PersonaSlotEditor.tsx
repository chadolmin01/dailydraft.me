'use client'

import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import { SlidePanel } from '@/components/ui/SlidePanel'
import { FIELD_CATALOG } from '@/src/lib/personas/field-catalog'
import type { FieldKey, PersonaFieldRow } from '@/src/lib/personas/types'
import { useUpdatePersonaField } from '@/src/hooks/usePersona'

interface Props {
  personaId: string
  fieldKey: FieldKey | null
  field: PersonaFieldRow | undefined
  canEdit: boolean
  isOpen: boolean
  onClose: () => void
}

/**
 * 우측 드로어에서 단일 슬롯 편집.
 * 저장 성공 시 자동 닫힘. autosave 아닌 명시적 저장/취소.
 */
export function PersonaSlotEditor({
  personaId,
  fieldKey,
  field,
  canEdit,
  isOpen,
  onClose,
}: Props) {
  const [draft, setDraft] = useState<string>(fieldToText(field))
  const update = useUpdatePersonaField(personaId)

  // 슬롯이 바뀔 때마다 draft 동기화
  useEffect(() => {
    setDraft(fieldToText(field))
  }, [field, fieldKey])

  if (!fieldKey) return null
  const spec = FIELD_CATALOG[fieldKey]
  const isLocked = field?.locked === true

  const save = () => {
    update.mutate(
      { field_key: fieldKey, value: textToFieldValue(draft) },
      { onSuccess: onClose },
    )
  }

  const disabled = !canEdit || isLocked

  return (
    <SlidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={spec.label}
      subtitle={spec.description}
      width="w-full max-w-xl"
    >
      <div className="flex flex-col h-full">
        {isLocked && (
          <div className="mx-5 mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-bg text-xs text-txt-secondary">
            <Lock size={12} className="shrink-0" />
            <span>
              이 슬롯은 상위 페르소나에서 상속되어 편집이 잠겨 있습니다.
            </span>
          </div>
        )}

        <div className="flex-1 px-5 py-4 overflow-y-auto">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={18}
            placeholder={placeholderForField(fieldKey)}
            disabled={disabled}
            className="w-full h-full min-h-[320px] text-sm text-txt-primary bg-surface-bg border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:border-brand leading-relaxed resize-none disabled:opacity-60"
          />
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-3 flex items-center justify-between gap-2 bg-surface-card">
          <p className="text-[11px] text-txt-tertiary">
            {draft.length.toLocaleString()}자
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={update.isPending}
              className="h-9 px-4 rounded-lg text-sm font-semibold text-txt-secondary hover:bg-surface-bg transition-colors disabled:opacity-60"
            >
              취소
            </button>
            {!disabled && (
              <button
                onClick={save}
                disabled={update.isPending || draft.trim().length === 0}
                className="h-9 px-4 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-60"
              >
                {update.isPending ? '저장 중...' : '저장'}
              </button>
            )}
          </div>
        </div>
      </div>
    </SlidePanel>
  )
}

/**
 * 현재 저장 구조: { text: "..." } 단순 래핑.
 * items 구조(taboos 등)는 현재 한 줄씩 editor에 노출하고 저장 시 split.
 */
function fieldToText(field: PersonaFieldRow | undefined): string {
  if (!field) return ''
  const v = field.value as { text?: string; items?: unknown[] }
  if (typeof v.text === 'string') return v.text
  if (Array.isArray(v.items)) {
    return v.items
      .map((x) => (typeof x === 'string' ? x : JSON.stringify(x)))
      .join('\n')
  }
  return JSON.stringify(field.value, null, 2)
}

function textToFieldValue(text: string): Record<string, unknown> {
  return { text }
}

function placeholderForField(key: FieldKey): string {
  const hints: Partial<Record<FieldKey, string>> = {
    identity:
      '예) 경희대학교 창업동아리 FLIP 10-1기 소속으로, 대학생 창업 생태계의 최전선을 직접 실험하는...',
    audience:
      '예) 창업에 관심 있는 20대 초반 대학생. 정보의 속도와 실무 적용 가능성에 민감...',
    content_patterns:
      '예) 실제 팀이 겪은 시행착오를 구체 수치와 함께 공개할 때 반응이 강함. "매출 0에서 300만원"...',
    hooking_style:
      '예) 첫 문장에 숫자 또는 단정형 선언을 배치. "창업 동아리 3개월차, 이거 하나 때문에 팀 깨졌습니다."',
    sentence_style:
      '예) 한 단락에 1~2 문장. 모바일 가독성을 위해 빈 줄로 구분. 평균 문장 길이 15자 내외...',
    ending_signature:
      '예) -입니다(50%), -습니다(30%), -네요(10%), 명사형 종결(10%). 정보 전달은 문어체...',
    taboos:
      '예)\n- 여러분 안녕하세요 같은 상투적 인사 금지\n- 느낌표 남발 금지\n- "정말 좋은 것 같아요" 같은 모호한 감상 표현 금지',
    reproduction_checklist:
      '예)\n- 첫 문장에 숫자/단정형 표현이 있는가\n- 한 단락 1~2 문장 규칙을 지켰는가\n- 불필요한 감탄사가 들어있진 않은가',
  }
  return hints[key] ?? '이 슬롯의 내용을 작성해주세요'
}
