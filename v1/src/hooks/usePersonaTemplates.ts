'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { PersonaTemplateRow } from '@/src/lib/personas/types'

export interface TemplatesResponse {
  templates: PersonaTemplateRow[]
}

export function usePersonaTemplates(personaId: string | undefined) {
  return useQuery({
    queryKey: ['persona-templates', personaId],
    enabled: !!personaId,
    queryFn: async (): Promise<TemplatesResponse> => {
      const res = await fetch(`/api/personas/${personaId}/templates`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? '템플릿 목록 조회 실패')
      }
      return res.json()
    },
  })
}

export function useSaveAsTemplate(personaId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { name: string; description?: string }) => {
      if (!personaId) throw new Error('페르소나 ID가 없습니다')
      const res = await fetch(`/api/personas/${personaId}/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? '템플릿 저장 실패')
      }
      return (await res.json()) as PersonaTemplateRow
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['persona-templates', personaId] })
      toast.success('템플릿으로 저장되었습니다')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useRestoreTemplate(personaId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (templateId: string) => {
      if (!personaId) throw new Error('페르소나 ID가 없습니다')
      const res = await fetch(
        `/api/personas/${personaId}/restore-template`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ template_id: templateId }),
        },
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? '복원 실패')
      }
      return (await res.json()) as {
        restored_count: number
        restored_fields: string[]
      }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['persona'] })
      toast.success(`${data.restored_count}개 슬롯이 복원되었습니다`)
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeletePersonaTemplate(personaId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (templateId: string) => {
      const res = await fetch(`/api/persona-templates/${templateId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? '삭제 실패')
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['persona-templates', personaId] })
      toast.success('템플릿이 삭제되었습니다')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
