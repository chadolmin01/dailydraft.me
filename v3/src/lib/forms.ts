/**
 * 폼 정의 + 렌더링 + 검증 공통.
 *
 * 의도: 매니저가 정의한 양식 = fields[]. 멤버 페이지가 그대로 렌더.
 *       타입은 5가지만 (단순화): text, number, date, textarea, select.
 *       복잡 (조건부, 파일 업로드, 다단계) 는 v3 Phase 1 에 안 포함.
 */

export type FieldType = 'text' | 'number' | 'date' | 'textarea' | 'select'

export interface FormField {
  key: string           // submission data 의 키 (snake_case 권장)
  label: string         // 멤버에게 보여줄 한국어 라벨
  type: FieldType
  required?: boolean
  placeholder?: string
  options?: string[]    // select 일 때
}

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: '짧은 글',
  number: '숫자',
  date: '날짜',
  textarea: '긴 글',
  select: '선택지',
}

// fields_json (DB) → FormField[] 안전 변환.
export function parseFields(json: string): FormField[] {
  try {
    const parsed = JSON.parse(json)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isField)
  } catch {
    return []
  }
}

function isField(v: unknown): v is FormField {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  return typeof o.key === 'string' && typeof o.label === 'string' && typeof o.type === 'string' &&
    (['text', 'number', 'date', 'textarea', 'select'] as const).includes(o.type as FieldType)
}

// 멤버 제출 FormData → 검증된 data 객체. 필수 필드 missing 시 throw.
export function extractSubmission(fields: FormField[], formData: FormData): Record<string, string | number | null> {
  const data: Record<string, string | number | null> = {}
  for (const f of fields) {
    const raw = formData.get(f.key)
    const value = typeof raw === 'string' ? raw.trim() : ''
    if (!value) {
      if (f.required) throw new Error(`'${f.label}' 항목은 필수입니다`)
      data[f.key] = null
      continue
    }
    if (f.type === 'number') {
      const n = Number(value)
      if (Number.isNaN(n)) throw new Error(`'${f.label}' 은 숫자여야 합니다`)
      data[f.key] = n
    } else {
      data[f.key] = value
    }
  }
  return data
}
