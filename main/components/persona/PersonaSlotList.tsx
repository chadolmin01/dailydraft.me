'use client'

import { useState } from 'react'
import type { FieldKey, PersonaFieldRow, PersonaRow } from '@/src/lib/personas/types'
import { PersonaSlotRow } from './PersonaSlotRow'
import { PersonaSlotEditor } from './PersonaSlotEditor'

/**
 * 13 슬롯을 3개 섹션으로 그루핑해서 배치.
 * 아코디언이 아닌 "컴팩트 행 + 우측 드로어 편집" 구조로 변경:
 *   - 2-column grid 아코디언의 공백 문제 해소
 *   - 편집 영역이 항상 넓음 (드로어 w-xl)
 *   - 한 번에 한 슬롯만 편집 (컨텍스트 혼동 방지)
 */
const SECTIONS: Array<{
  title: string
  description: string
  keys: FieldKey[]
}> = [
  {
    title: '컨셉',
    description: '이 동아리·프로젝트가 누구이고 무엇을 말하는가',
    keys: ['identity', 'content_patterns'],
  },
  {
    title: '독자',
    description: '누구에게 말하고 어떤 거리감을 유지하는가',
    keys: ['audience', 'emotional_distance'],
  },
  {
    title: '콘텐츠 스타일',
    description: '실제 문장을 어떻게 쓰는가',
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

interface Props {
  persona: PersonaRow
  fields: PersonaFieldRow[]
  canEdit: boolean
}

export function PersonaSlotList({ persona, fields, canEdit }: Props) {
  const fieldMap = new Map<FieldKey, PersonaFieldRow>()
  for (const f of fields) fieldMap.set(f.field_key, f)

  const [editingKey, setEditingKey] = useState<FieldKey | null>(null)

  return (
    <>
      <div className="space-y-6">
        {SECTIONS.map((section) => (
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
