'use client'

import { useState } from 'react'
import { FIELD_KEYS, type FieldKey, type PersonaFieldRow, type PersonaRow } from '@/src/lib/personas/types'
import { PersonaSlotRow } from './PersonaSlotRow'
import { PersonaSlotEditor } from './PersonaSlotEditor'

/**
 * 13 슬롯을 3개 섹션으로 그루핑해서 배치.
 * 아코디언이 아닌 "컴팩트 행 + 우측 드로어 편집" 구조로 변경:
 *   - 2-column grid 아코디언의 공백 문제 해소
 *   - 편집 영역이 항상 넓음 (드로어 w-xl)
 *   - 한 번에 한 슬롯만 편집 (컨텍스트 혼동 방지)
 */
type PersonaKind = 'club' | 'project' | 'personal'

function sectionsFor(kind: PersonaKind): Array<{
  title: string
  description: string
  keys: FieldKey[]
}> {
  const subject =
    kind === 'club'
      ? '우리 동아리'
      : kind === 'project'
        ? '이 프로젝트'
        : '나'
  const author =
    kind === 'club' ? '회장님' : kind === 'project' ? '프로젝트 리드' : '본인'

  return [
  {
    title: `${subject}는 누구인가요?`,
    description:
      `AI가 글을 쓸 때 "${subject}가 뭐 하는 곳인지"를 알아야 합니다. 이 두 슬롯이 그 기준이 됩니다.`,
    keys: ['identity', 'content_patterns'],
  },
  {
    title: '누구에게 말 걸고 싶으세요?',
    description:
      '타깃 독자가 분명할수록 AI가 어조를 맞춥니다. "신입생" vs "스폰서 기업"은 완전히 다른 글이 되죠.',
    keys: ['audience', 'emotional_distance'],
  },
  {
    title: '어떻게 쓸까요?',
    description:
      `문장 길이·어미·즐겨쓰는 단어까지 디테일하게 정해두면, AI가 ${author}이 쓰신 것처럼 글을 만듭니다.`,
    keys: [
      'hooking_style',
      'sentence_style',
      'ending_signature',
      'thought_development',
      'vocabulary',
      'rhythm',
      'humor',
      'taboos',
      'reproduction_checklist',
    ],
  },
  ]
}

interface Props {
  persona: PersonaRow
  fields: PersonaFieldRow[]
  canEdit: boolean
}

export function PersonaSlotList({ persona, fields, canEdit }: Props) {
  const fieldMap = new Map<FieldKey, PersonaFieldRow>()
  for (const f of fields) fieldMap.set(f.field_key, f)

  const [editingKey, setEditingKey] = useState<FieldKey | null>(null)
  const sections = sectionsFor(persona.type)

  // 완성도 계산 — value 가 실제로 채워진 (빈 object/null 제외) 슬롯 수
  const totalSlots = FIELD_KEYS.length
  const filledSlots = fields.filter(f => {
    const v = f.value as Record<string, unknown> | null
    if (!v) return false
    // value 가 빈 object ({}) 면 미채워진 것으로 간주
    return Object.keys(v).length > 0
  }).length
  const completionPct = Math.round((filledSlots / totalSlots) * 100)

  return (
    <>
      {/* 완성도 프로그레스 — 한 줄로 컴팩트 */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-surface-sunken rounded-full overflow-hidden">
          <div
            className="h-full bg-brand transition-all duration-500"
            style={{ width: `${completionPct}%` }}
          />
        </div>
        <span className="text-[11px] font-mono text-txt-tertiary tabular-nums shrink-0">
          {filledSlots} / {totalSlots}
        </span>
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <section key={section.title}>
            <div className="mb-3">
              <h2 className="text-sm font-bold text-txt-primary">
                {section.title}
              </h2>
              <p className="text-xs text-txt-tertiary mt-0.5">
                {section.description}
              </p>
            </div>
            {/* 행 기반 2-column: 높이 균일, 공백 없음 */}
            <div className="grid lg:grid-cols-2 gap-2">
              {section.keys.map((key) => (
                <PersonaSlotRow
                  key={key}
                  fieldKey={key}
                  field={fieldMap.get(key)}
                  canEdit={canEdit}
                  onClick={() => setEditingKey(key)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* 단일 드로어 — 선택된 슬롯 편집 */}
      <PersonaSlotEditor
        personaId={persona.id}
        fieldKey={editingKey}
        field={editingKey ? fieldMap.get(editingKey) : undefined}
        canEdit={canEdit}
        isOpen={editingKey !== null}
        onClose={() => setEditingKey(null)}
      />
    </>
  )
}
