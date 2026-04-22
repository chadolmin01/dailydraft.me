/**
 * Institution Custom Fields — 스키마 정의·validation 유틸.
 *
 * 기관 관리자가 `custom_fields_schema` 로 정의하는 필드 타입과 형식을 고정.
 * 학생 응답 저장 전 서버 사이드에서 이 함수로 검증.
 */

export type CustomFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'multi_select'
  | 'boolean'
  | 'date'

export interface CustomFieldDef {
  /** jsonb key — 영문 소문자·언더스코어 권장 */
  id: string
  /** UI 표시 라벨 */
  label: string
  /** 필드 타입 */
  type: CustomFieldType
  /** 필수 여부 */
  required?: boolean
  /** helper 문구 (라벨 아래 회색 안내) */
  helper?: string
  /** 예시 (placeholder) */
  placeholder?: string
  /** text: regex, number: min/max */
  pattern?: string
  min?: number
  max?: number
  /** select / multi_select: 선택지 */
  options?: string[]
  /** multi_select: 최대 선택 수 */
  maxSelect?: number
}

export type CustomFieldsSchema = CustomFieldDef[]

export interface CustomFieldValidationResult {
  ok: boolean
  /** 필드별 에러. ok=false 일 때만. */
  errors?: Record<string, string>
}

/** 스키마 자체가 유효한지 (관리자 저장 직전 체크) */
export function validateSchema(schema: unknown): schema is CustomFieldsSchema {
  if (!Array.isArray(schema)) return false
  if (schema.length > 20) return false // 너무 많은 필드 방지
  const ids = new Set<string>()
  for (const f of schema) {
    if (!f || typeof f !== 'object') return false
    const def = f as Record<string, unknown>
    if (typeof def.id !== 'string' || !/^[a-z][a-z0-9_]{0,30}$/.test(def.id)) return false
    if (ids.has(def.id)) return false
    ids.add(def.id)
    if (typeof def.label !== 'string' || def.label.length < 1 || def.label.length > 80) return false
    const validTypes: CustomFieldType[] = [
      'text', 'textarea', 'number', 'select', 'multi_select', 'boolean', 'date',
    ]
    if (!validTypes.includes(def.type as CustomFieldType)) return false
    if ((def.type === 'select' || def.type === 'multi_select') && !Array.isArray(def.options)) return false
  }
  return true
}

/** 학생 응답이 스키마에 맞는지 검증 */
export function validateResponses(
  schema: CustomFieldsSchema,
  responses: Record<string, unknown>,
): CustomFieldValidationResult {
  const errors: Record<string, string> = {}
  for (const field of schema) {
    const raw = responses[field.id]
    const isEmpty =
      raw === undefined || raw === null || raw === '' ||
      (Array.isArray(raw) && raw.length === 0)

    if (field.required && isEmpty) {
      errors[field.id] = `${field.label}은(는) 필수입니다`
      continue
    }
    if (isEmpty) continue

    // type 별 검증
    switch (field.type) {
      case 'text':
      case 'textarea': {
        if (typeof raw !== 'string') {
          errors[field.id] = '문자열이 아닙니다'
          break
        }
        if (raw.length > (field.type === 'textarea' ? 2000 : 200)) {
          errors[field.id] = '입력이 너무 깁니다'
          break
        }
        if (field.pattern) {
          try {
            if (!new RegExp(field.pattern).test(raw)) {
              errors[field.id] = `${field.label} 형식이 맞지 않습니다`
            }
          } catch {
            // 잘못된 regex — 검증 생략
          }
        }
        break
      }
      case 'number': {
        const n = typeof raw === 'string' ? Number(raw) : (raw as number)
        if (typeof n !== 'number' || Number.isNaN(n)) {
          errors[field.id] = '숫자가 아닙니다'
          break
        }
        if (typeof field.min === 'number' && n < field.min) {
          errors[field.id] = `${field.min} 이상이어야 합니다`
          break
        }
        if (typeof field.max === 'number' && n > field.max) {
          errors[field.id] = `${field.max} 이하여야 합니다`
        }
        break
      }
      case 'select': {
        if (typeof raw !== 'string' || !field.options?.includes(raw)) {
          errors[field.id] = '선택지에 없는 값입니다'
        }
        break
      }
      case 'multi_select': {
        if (!Array.isArray(raw)) {
          errors[field.id] = '배열이 아닙니다'
          break
        }
        if (field.maxSelect && raw.length > field.maxSelect) {
          errors[field.id] = `최대 ${field.maxSelect}개까지 선택 가능합니다`
          break
        }
        for (const item of raw) {
          if (typeof item !== 'string' || !field.options?.includes(item)) {
            errors[field.id] = '선택지에 없는 값이 포함되어 있습니다'
            break
          }
        }
        break
      }
      case 'boolean': {
        if (typeof raw !== 'boolean') {
          errors[field.id] = 'true/false 가 아닙니다'
        }
        break
      }
      case 'date': {
        if (typeof raw !== 'string' || Number.isNaN(Date.parse(raw))) {
          errors[field.id] = '날짜 형식이 맞지 않습니다'
        }
        break
      }
    }
  }
  return {
    ok: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  }
}
