'use client'

import React, { useState } from 'react'
import { Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'
import type { CustomFieldDef, CustomFieldsSchema } from '@/src/lib/institution/custom-fields'

interface Props {
  institutionId: string
  schema: CustomFieldsSchema
  /** 초기값 (기존 응답 로드 후 넣어 줌) */
  initialValues?: Record<string, unknown>
  /** 성공 저장 후 콜백 */
  onSaved?: (responses: Record<string, unknown>) => void
}

/**
 * `<CustomFieldForm>` — 기관 커스텀 필드 스키마 기반 폼.
 *
 * 각 필드 타입에 맞는 입력 위젯을 렌더하고, PUT /api/institution/[id]/custom-responses 로 저장.
 * 서버 사이드에서 다시 검증하므로 클라 validation 은 UX 용.
 */
export function CustomFieldForm({ institutionId, schema, initialValues = {}, onSaved }: Props) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const setField = (id: string, v: unknown) => {
    setValues(prev => ({ ...prev, [id]: v }))
    setErrors(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/institution/${institutionId}/custom-responses`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses: values }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        const serverErrors = (body?.error?.details as Record<string, string>) ?? {}
        if (Object.keys(serverErrors).length > 0) {
          setErrors(serverErrors)
          toast.error('입력값에 오류가 있습니다. 각 필드를 확인해 주세요.')
        } else {
          toast.error(body?.error?.message ?? '저장에 실패했습니다', {
            description: '잠시 후 다시 시도해 주세요.',
          })
        }
        return
      }
      if (body?.data?.pendingMigration) {
        toast.info('기능 준비 중입니다', {
          description: '기관 커스텀 필드 마이그레이션이 적용된 뒤 저장됩니다.',
        })
        return
      }
      setJustSaved(true)
      toast.success('기관 정보를 저장했습니다', {
        description: '기관 리포트에 이 정보가 반영됩니다. 언제든 수정하실 수 있습니다.',
      })
      onSaved?.(values)
      setTimeout(() => setJustSaved(false), 2000)
    } catch {
      toast.error('네트워크 오류가 발생했습니다', {
        description: '인터넷 연결을 확인하신 뒤 다시 시도해 주세요.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (schema.length === 0) {
    return (
      <p className="text-[13px] text-txt-tertiary">
        이 기관에는 추가 입력 항목이 없습니다.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {schema.map(field => (
        <FieldRow
          key={field.id}
          field={field}
          value={values[field.id]}
          error={errors[field.id]}
          onChange={v => setField(field.id, v)}
        />
      ))}
      <div className="flex items-center gap-2 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-inverse text-txt-inverse rounded-xl text-[13px] font-bold hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          ) : justSaved ? (
            <Check size={14} aria-hidden="true" />
          ) : null}
          {submitting ? '저장 중...' : justSaved ? '저장됨' : '저장'}
        </button>
        <p className="text-[11px] text-txt-tertiary">
          입력하신 정보는 이 기관의 리포트·매칭에만 사용됩니다.
        </p>
      </div>
    </form>
  )
}

/* ─── 개별 필드 렌더 ─── */
function FieldRow({
  field,
  value,
  error,
  onChange,
}: {
  field: CustomFieldDef
  value: unknown
  error?: string
  onChange: (v: unknown) => void
}) {
  const labelId = `custom-field-${field.id}`
  const baseInput =
    'w-full px-3 py-2.5 text-[13px] bg-surface-sunken border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors'
  const borderCls = error ? 'border-status-danger-text' : 'border-border'

  return (
    <div>
      <label htmlFor={labelId} className="block text-[12px] font-semibold text-txt-secondary mb-1.5">
        {field.label}
        {field.required && <span className="text-status-danger-text ml-1">*</span>}
        {!field.required && <span className="text-txt-tertiary ml-1 font-normal">(선택)</span>}
      </label>
      {field.helper && (
        <p className="text-[11px] text-txt-tertiary mb-1.5 leading-relaxed">{field.helper}</p>
      )}

      {field.type === 'text' && (
        <input
          id={labelId}
          type="text"
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={`${baseInput} ${borderCls}`}
          aria-invalid={!!error}
        />
      )}

      {field.type === 'textarea' && (
        <textarea
          id={labelId}
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          rows={4}
          placeholder={field.placeholder}
          className={`${baseInput} ${borderCls} resize-none`}
          aria-invalid={!!error}
        />
      )}

      {field.type === 'number' && (
        <input
          id={labelId}
          type="number"
          value={typeof value === 'number' ? value : ''}
          onChange={e => onChange(e.target.value ? Number(e.target.value) : '')}
          min={field.min}
          max={field.max}
          placeholder={field.placeholder}
          className={`${baseInput} ${borderCls}`}
          aria-invalid={!!error}
        />
      )}

      {field.type === 'select' && (
        <select
          id={labelId}
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value || null)}
          className={`${baseInput} ${borderCls}`}
          aria-invalid={!!error}
        >
          <option value="">선택해 주세요</option>
          {field.options?.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )}

      {field.type === 'multi_select' && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby={labelId}>
          {field.options?.map(opt => {
            const current = Array.isArray(value) ? (value as string[]) : []
            const checked = current.includes(opt)
            const atMax = !!field.maxSelect && current.length >= field.maxSelect && !checked
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  if (checked) {
                    onChange(current.filter(x => x !== opt))
                  } else if (!atMax) {
                    onChange([...current, opt])
                  }
                }}
                disabled={atMax}
                aria-pressed={checked}
                className={`px-3 py-1.5 text-[12px] font-medium rounded-full border transition-all ${
                  checked
                    ? 'bg-brand text-white border-brand'
                    : 'bg-surface-card text-txt-primary border-border hover:border-txt-tertiary'
                } ${atMax ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {opt}
              </button>
            )
          })}
          {field.maxSelect && (
            <p className="text-[10px] text-txt-tertiary w-full mt-1">최대 {field.maxSelect}개</p>
          )}
        </div>
      )}

      {field.type === 'boolean' && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onChange(true)}
            aria-pressed={value === true}
            className={`px-4 py-2 text-[13px] font-medium rounded-xl border ${
              value === true ? 'bg-brand text-white border-brand' : 'bg-surface-card border-border'
            }`}
          >
            네
          </button>
          <button
            type="button"
            onClick={() => onChange(false)}
            aria-pressed={value === false}
            className={`px-4 py-2 text-[13px] font-medium rounded-xl border ${
              value === false ? 'bg-brand text-white border-brand' : 'bg-surface-card border-border'
            }`}
          >
            아니요
          </button>
        </div>
      )}

      {field.type === 'date' && (
        <input
          id={labelId}
          type="date"
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          className={`${baseInput} ${borderCls}`}
          aria-invalid={!!error}
        />
      )}

      {error && (
        <p className="text-[11px] text-status-danger-text mt-1 font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
