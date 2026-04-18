'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export type IdeaCardStatus = 'pending' | 'drafted' | 'used' | 'dismissed'
export type IdeaSource = 'self' | 'internet' | 'internal'

export interface IdeaCardRow {
  id: string
  persona_id: string
  title: string
  description: string
  event_type_hint: string
  source: IdeaSource
  status: IdeaCardStatus
  bundle_id: string | null
  created_at: string
}

export function useIdeaCards(personaId: string | undefined) {
  return useQuery({
    queryKey: ['idea-cards', personaId],
    enabled: !!personaId,
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
    queryFn: async (): Promise<{ cards: IdeaCardRow[] }> => {
      const res = await fetch(`/api/personas/${personaId}/idea-cards`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? '카드 조회 실패')
      }
      return res.json()
    },
  })
}

export function useGenerateIdeaCards(personaId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { source: IdeaSource; count: number }) => {
      if (!personaId) throw new Error('personaId 없음')
      const res = await fetch(`/api/personas/${personaId}/idea-cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? 'AI 제안 실패')
      }
      return (await res.json()).cards as IdeaCardRow[]
    },
    onSuccess: (cards) => {
      qc.invalidateQueries({ queryKey: ['idea-cards', personaId] })
      toast.success(`${cards.length}개의 아이디어를 받았습니다`)
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateIdeaCard(personaId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      id: string
      patch: Partial<Pick<IdeaCardRow, 'status' | 'title' | 'description' | 'bundle_id'>>
    }) => {
      const res = await fetch(`/api/persona-idea-cards/${input.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input.patch),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? '업데이트 실패')
      }
      return (await res.json()).card as IdeaCardRow
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['idea-cards', personaId] })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteIdeaCard(personaId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/persona-idea-cards/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? '삭제 실패')
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['idea-cards', personaId] })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
