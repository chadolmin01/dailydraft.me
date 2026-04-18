'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type {
  FieldKey,
  PersonaFieldRow,
  PersonaRow,
  PersonaType,
} from '@/src/lib/personas/types'

/**
 * 클럽의 동아리 페르소나 + 필드 로드.
 * 아직 생성되지 않은 경우 persona=null 반환 (빈 상태 UI로 "페르소나 생성" 표시).
 */
export interface PersonaWithFieldsResponse {
  persona: PersonaRow | null
  fields: PersonaFieldRow[]
  /** 상속된 필드(부모 체인의 최종 resolved 값). R1에선 club=최상위라 비어있음 */
  resolvedFields: Record<FieldKey, unknown> | null
}

export function usePersonaByOwner(
  type: PersonaType,
  ownerId: string | undefined,
) {
  return useQuery({
    queryKey: ['persona', type, ownerId],
    enabled: !!ownerId,
    queryFn: async (): Promise<PersonaWithFieldsResponse> => {
      const res = await fetch(
        `/api/personas?type=${type}&owner_id=${ownerId}`,
      )
      if (!res.ok) {
        throw new Error(`페르소나 불러오기에 실패했습니다 (${res.status})`)
      }
      return res.json()
    },
  })
}

export function useCreatePersona() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      type: PersonaType
      owner_id: string
      name: string
      parent_persona_id?: string | null
    }) => {
      const res = await fetch('/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || '페르소나 생성에 실패했습니다')
      }
      return (await res.json()) as PersonaRow
    },
    onSuccess: (persona) => {
      qc.invalidateQueries({
        queryKey: ['persona', persona.type, persona.owner_id],
      })
      toast.success('브랜드 페르소나가 생성되었습니다')
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })
}

/**
 * AI 초안 생성 (smart 모드).
 * 수동 작성 슬롯은 보호하고 빈 슬롯만 채움.
 * identity/audience/taboos 슬롯에 수동 내용이 있으면 seed로 활용.
 */
export interface GenerateResponse {
  mode: string
  success_count: number
  total_count: number
  written_count: number
  protected_count: number
  slots: { field_key: string; confidence: number; protected: boolean; error: string | null }[]
}

export function useGeneratePersona(personaId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (): Promise<GenerateResponse> => {
      if (!personaId) throw new Error('페르소나가 아직 없습니다')
      const res = await fetch(`/api/personas/${personaId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // smart 모드 (기본)
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? 'AI 초안 생성 실패')
      }
      return res.json()
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['persona'] })
      if (data.written_count === 0) {
        toast.info(
          `모든 슬롯이 이미 작성되어 있어 변경 사항이 없습니다 (보호된 ${data.protected_count}개)`,
        )
      } else {
        toast.success(
          `${data.written_count}개 슬롯을 AI가 채웠습니다${data.protected_count > 0 ? ` (직접 작성한 ${data.protected_count}개 보호)` : ''}`,
        )
      }
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdatePersonaField(personaId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      field_key: FieldKey
      value: Record<string, unknown>
    }) => {
      if (!personaId) throw new Error('페르소나가 아직 생성되지 않았습니다')
      const res = await fetch(
        `/api/personas/${personaId}/fields/${input.field_key}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: input.value }),
        },
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || '슬롯 저장에 실패했습니다')
      }
      return (await res.json()) as PersonaFieldRow
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['persona'] })
      toast.success('저장되었습니다')
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })
}
