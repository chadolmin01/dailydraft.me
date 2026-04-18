'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export interface ConnectedChannel {
  id: string
  channel_type: string
  account_ref: string
  scope: string[]
  connected: boolean
  expired: boolean
  expires_at: string | null
  installed_by_me: boolean
}

export function usePersonaChannels(personaId: string | undefined) {
  return useQuery({
    queryKey: ['persona-channels', personaId],
    enabled: !!personaId,
    staleTime: 1000 * 60 * 2,
    placeholderData: (prev) => prev,
    queryFn: async (): Promise<{ channels: ConnectedChannel[] }> => {
      const res = await fetch(`/api/personas/${personaId}/channels`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? '채널 연결 상태 조회 실패')
      }
      return res.json()
    },
  })
}

export function useDisconnectChannel(personaId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (credentialId: string) => {
      if (!personaId) throw new Error('personaId 없음')
      const res = await fetch(
        `/api/personas/${personaId}/channels/${credentialId}`,
        { method: 'DELETE' },
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? '연결 해제 실패')
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['persona-channels', personaId] })
      toast.success('연결이 해제되었습니다')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
