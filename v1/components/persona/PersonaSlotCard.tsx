'use client'

import { useState } from 'react'
import { ChevronDown, Lock, Pencil, Loader2 } from 'lucide-react'
import { FIELD_CATALOG } from '@/src/lib/personas/field-catalog'
import type { FieldKey, PersonaFieldRow } from '@/src/lib/personas/types'
import { useUpdatePersonaField } from '@/src/hooks/usePersona'

interface Props {
  personaId: string
  fieldKey: FieldKey
  field: PersonaFieldRow | undefined
  canEdit: boolean
}

/**
 * 슬롯 1개를 표시하는 카드.
 *
 * 상태 3가지:
 *   - 잠금: 상위 페르소나에서 상속된 필드. 읽기 전용 + 자물쇠.
 *   - 읽기: 값 표시 + 우측 연필. 헤더 클릭 시 펼침/접힘.
 *   - 편집: Textarea + Save/Cancel. autosave 아님.
 */
export function PersonaSlotCard({ personaId, fieldKey, field, canEdit }: Props) {
  const spec = FIELD_CATALOG[fieldKey]
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<string>(fieldToText(field))

  const update = useUpdatePersonaField(personaId)

  const isInherited = field?.source === 'inherited'
  const isLocked = field?.locked === true
  const isEmpty = !field
  const confidence = field?.confidence ?? 1

  const preview = textPreview(field)

  const startEdit = () => {
    setDraft(fieldToText(field))
    setEditing(true)
    setExpanded(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setDraft(fieldToText(field))
  }

  const saveEdit = () => {
    update.mutate(
      {
        field_key: fieldKey,
        value: textToFieldValue(draft),
      },
      {
        onSuccess: () => setEditing(false),
      },
    )
  }

  return (
    <div className="bg-surface-card border border-border rounded-2xl overflow-hidden">
      {/* 헤더 (접힘/펼침 토글) */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-bg transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-txt-primary">
              {spec.label}
            </span>
            {isLocked && (
              <Lock
                size={12}
                className="text-txt-tertiary shrink-0"
                aria-label="편집 잠금"
              />
            )}
            {isInherited && (
              <span className="text-[10px] text-txt-tertiary px-1.5 py-0.5 rounded bg-surface-bg shrink-0">
                상속됨
              </span>
            )}
            {!isEmpty && confidence < 1 && (
              <span className="text-[10px] text-txt-tertiary shrink-0">
                정확도 {Math.round(confidence * 100)}%
              </span>
            )}
          </div>
          <p className="text-xs text-txt-tertiary truncate">
            {isEmpty ? '아직 작성되지 않았습니다' : preview}
          </p>
        </div>

        {canEdit && !isLocked && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              startEdit()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation()
                startEdit()
              }
            }}
            className="shrink-0 w-8 h-8 rounded-lg hover:bg-surface-bg flex items-center justify-center text-txt-tertiary hover:text-txt-primary transition-colors"
            aria-label="이 슬롯 편집"
          >
            <Pencil size={14} />
          </span>
        )}

        <ChevronDown
          size={16}
          className={`shrink-0 text-txt-tertiary transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* 펼침 영역 */}
      {expanded && (
        <div className="border-t border-border px-4 py-4">
          <p className="text-xs text-txt-tertiary mb-3 leading-relaxed">
            {spec.description}
          </p>

          {editing ? (
            <div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={8}
                className="w-full text-sm text-txt-primary bg-surface-bg border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:border-brand leading-relaxed resize-none"
                placeholder={placeholderForField(fieldKey)}
              />
              <div className="flex items-center justify-end gap-2 mt-3">
                <button
                  onClick={cancelEdit}
                  disabled={update.isPending}
                  className="h-9 px-4 rounded-lg text-sm font-semibold text-txt-secondary hover:bg-surface-bg transition-colors disabled:opacity-60"
                >
                  취소
                </button>
                <button
                  onClick={saveEdit}
                  disabled={update.isPending}
                  className="h-9 px-4 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-60 inline-flex items-center gap-1.5"
                >
                  {update.isPending && <Loader2 size={12} className="animate-spin" />}
                  {update.isPending ? '저장 중' : '저장'}
                </button>
              </div>
            </div>
          ) : isEmpty ? (
            <div className="text-sm text-txt-tertiary leading-relaxed">
              {canEdit ? (
                <button
                  onClick={startEdit}
                  className="text-brand font-semibold hover:underline"
                >
                  + 이 슬롯 채우기
                </button>
              ) : (
                <span>아직 작성되지 않았습니다</span>
              )}
            </div>
          ) : (
            <p className="text-sm text-txt-primary leading-relaxed whitespace-pre-wrap">
              {fieldToText(field)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * R1은 jsonb 구조를 단순화: { text: "..." } 래핑만 사용.
 * R2에서 슬롯별 구조화 (items[], rules{} 등)로 확장 예정.
 */
function fieldToText(field: PersonaFieldRow | undefined): string {
  if (!field) return ''
  const v = field.value as { text?: string; items?: unknown[] }
  if (typeof v.text === 'string') return v.text
  if (Array.isArray(v.items)) {
    return v.items.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join('\n')
  }
  return JSON.stringify(field.value, null, 2)
}

function textToFieldValue(text: string): Record<string, unknown> {
  return { text }
}

function textPreview(field: PersonaFieldRow | undefined): string {
  const t = fieldToText(field)
  if (!t) return ''
  const firstLine = t.split('\n')[0] ?? ''
  return firstLine.length > 60 ? `${firstLine.slice(0, 60)}...` : firstLine
}

function placeholderForField(key: FieldKey): string {
  const hints: Partial<Record<FieldKey, string>> = {
    identity: '예) 경희대학교 창업동아리 FLIP 10-1기 소속으로, 대학생 창업 생태계의 최전선을 직접 실험하는...',
    audience: '예) 창업에 관심 있는 20대 초반 대학생. 정보의 속도와 실무 적용 가능성에 민감...',
    content_patterns: '예) 실제 팀이 겪은 시행착오를 구체 수치와 함께 공개할 때 반응이 강함. "매출 0에서 300만원", "PMF 없이 3개월" 같은...',
    hooking_style: '예) 첫 문장에 숫자 또는 단정형 선언을 배치. "창업 동아리 3개월차, 이거 하나 때문에 팀 깨졌습니다."',
    sentence_style: '예) 한 단락에 1~2 문장. 모바일 가독성을 위해 빈 줄로 구분. 평균 문장 길이 15자 내외...',
    ending_signature: '예) -입니다(50%), -습니다(30%), -네요(10%), 명사형 종결(10%). 정보 전달은 문어체, 감상은 구어체...',
    taboos: '예)\n- 여러분 안녕하세요 같은 상투적 인사 금지\n- 느낌표 남발 금지\n- "정말 좋은 것 같아요" 같은 모호한 감상 표현 금지',
    reproduction_checklist: '예)\n- 첫 문장에 숫자/단정형 표현이 있는가\n- 한 단락 1~2 문장 규칙을 지켰는가\n- 불필요한 감탄사가 들어있진 않은가',
  }
  return hints[key] ?? '이 슬롯의 내용을 작성해주세요'
}
