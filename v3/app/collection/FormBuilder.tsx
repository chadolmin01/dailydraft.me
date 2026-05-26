'use client'

import { useState } from 'react'
import { FIELD_TYPE_LABELS, type FieldType, type FormField } from '@/src/lib/forms'

// 의도: 인터랙티브 필드 빌더 (추가/삭제/순서). 결과는 hidden input fields_json 으로 form 제출.
//       서버 actions.ts 가 JSON.parse 해서 검증.
export function FormBuilder() {
  const [fields, setFields] = useState<FormField[]>([
    { key: 'progress', label: '이번 주 진척', type: 'textarea', required: true },
  ])

  const addField = () =>
    setFields((f) => [...f, { key: `field_${f.length + 1}`, label: '', type: 'text' }])
  const removeField = (idx: number) =>
    setFields((f) => f.filter((_, i) => i !== idx))
  const updateField = (idx: number, patch: Partial<FormField>) =>
    setFields((f) => f.map((x, i) => (i === idx ? { ...x, ...patch } : x)))

  return (
    <div className="space-y-3">
      <input type="hidden" name="fields_json" value={JSON.stringify(fields)} />

      <div className="flex items-center justify-between">
        <label className="label mb-0">필드 ({fields.length})</label>
        <button type="button" onClick={addField} className="btn-ghost text-xs">+ 필드 추가</button>
      </div>

      <div className="space-y-2">
        {fields.map((f, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 items-start p-3 bg-surface rounded-lg">
            <input
              className="input col-span-3"
              placeholder="key (snake_case)"
              value={f.key}
              onChange={(e) => updateField(idx, { key: e.target.value })}
              required
            />
            <input
              className="input col-span-4"
              placeholder="라벨 (멤버에게 보일 한국어)"
              value={f.label}
              onChange={(e) => updateField(idx, { label: e.target.value })}
              required
            />
            <select
              className="input col-span-2"
              value={f.type}
              onChange={(e) => updateField(idx, { type: e.target.value as FieldType })}
            >
              {Object.entries(FIELD_TYPE_LABELS).map(([v, label]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>
            <label className="col-span-2 text-xs text-muted flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={f.required ?? false}
                onChange={(e) => updateField(idx, { required: e.target.checked })}
              />
              필수
            </label>
            <button
              type="button"
              onClick={() => removeField(idx)}
              className="col-span-1 text-xs text-muted hover:text-red-600"
            >
              삭제
            </button>
            {f.type === 'select' && (
              <input
                className="input col-span-12 text-xs"
                placeholder="옵션 (쉼표로 구분). 예: 진행중, 완료, 보류"
                value={(f.options ?? []).join(', ')}
                onChange={(e) => updateField(idx, {
                  options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                })}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
