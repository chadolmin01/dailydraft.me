'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export type AutomationFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly'

export interface PersonaAutomationRow {
  id: string
  persona_id: string
  event_type: string
  frequency: AutomationFrequency
  run_hour: number
  run_minute: number
  run_weekday: number | null
  run_day_of_month: number | null
  daily_count: number
  auto_publish: boolean
  default_metadata: Record<string, unknown>
  active: boolean
  next_run_at: string | null
  last_run_at: string | null
  last_run_status: string | null
  created_at: string
}

export function usePersonaAutomations(personaId: string | undefined) {
  return useQuery({
    queryKey: ['persona-automations', personaId],
    enabled: !!personaId,
    staleTime: 1000 * 60,
    placeholderData: (prev) => prev,
    queryFn: async (): Promise<{ automations: PersonaAutomationRow[] }> => {
      const res = await fetch(`/api/personas/${personaId}/automations`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? '자동화 조회 실패')
      }
      return res.json()
    },
  })
}

export interface AutomationCreateInput {
  event_type: string
  frequency: AutomationFrequency
  run_hour: number
  run_minute: number
  run_weekday?: number | null
  run_day_of_month?: number | null
  daily_count: number
  auto_publish: boolean
  default_metadata?: Record<string, unknown>
  active?: boolean
}

export function useCreateAutomation(personaId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: AutomationCreateInput) => {
      if (!personaId) throw new Error('personaId 없음')
      const res = await fetch(`/api/personas/${personaId}/automations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? '자동화 생성 실패')
      }
      return (await res.json()).automation as PersonaAutomationRow
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['persona-automations', personaId] })
      toast.success('자동화가 설정되었습니다')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateAutomation(personaId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      id: string
      patch: Partial<AutomationCreateInput & { active: boolean }>
    }) => {
      const res = await fetch(`/api/persona-automations/${input.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input.patch),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? '업데이트 실패')
      }
      return (await res.json()).automation as PersonaAutomationRow
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['persona-automations', personaId] })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteAutomation(personaId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/persona-automations/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? '삭제 실패')
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['persona-automations', personaId] })
      toast.success('자동화가 삭제되었습니다')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
