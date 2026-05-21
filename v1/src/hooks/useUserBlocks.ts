'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/src/context/AuthContext'

export interface UserBlock {
  id: string
  blocker_id: string
  blocked_id: string
  reason: string | null
  created_at: string
}

export const blockKeys = {
  all: ['user_blocks'] as const,
  list: () => [...blockKeys.all, 'list'] as const,
}

export function useUserBlocks() {
  const { user, isLoading } = useAuth()
  return useQuery({
    queryKey: blockKeys.list(),
    queryFn: async () => {
      const res = await fetch('/api/blocks')
      if (!res.ok) return [] as UserBlock[]
      const data = await res.json()
      return (data.blocks || []) as UserBlock[]
    },
    enabled: !isLoading && !!user,
    staleTime: 1000 * 60 * 5,
  })
}

export function useBlockUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ blocked_id, reason }: { blocked_id: string; reason?: string }) => {
      const res = await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked_id, reason }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error?.message || '차단 실패')
      return result
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: blockKeys.all })
    },
  })
}

export function useUnblockUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (blocked_id: string) => {
      const res = await fetch(`/api/blocks?blocked_id=${blocked_id}`, { method: 'DELETE' })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error?.message || '차단 해제 실패')
      return result
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: blockKeys.all })
    },
  })
}
