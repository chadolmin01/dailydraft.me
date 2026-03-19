'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/src/context/AuthContext'

export interface ProjectInvitation {
  id: string
  opportunity_id: string
  inviter_user_id: string
  invited_user_id: string
  role: string
  message: string | null
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  updated_at: string
}

export const invitationKeys = {
  all: ['project_invitations'] as const,
  received: () => [...invitationKeys.all, 'received'] as const,
  sent: () => [...invitationKeys.all, 'sent'] as const,
}

interface UseProjectInvitationsOptions {
  asSender?: boolean
  enabled?: boolean
}

export function useProjectInvitations(options: UseProjectInvitationsOptions = {}) {
  const { asSender = false, enabled = true } = options
  const { user } = useAuth()

  return useQuery({
    queryKey: asSender ? invitationKeys.sent() : invitationKeys.received(),
    queryFn: async () => {
      const type = asSender ? 'sent' : 'received'
      const res = await fetch(`/api/invitations?type=${type}`)
      if (!res.ok) return [] as ProjectInvitation[]
      const data = await res.json()
      return (data.invitations || []) as ProjectInvitation[]
    },
    staleTime: 1000 * 60 * 2,
    enabled: enabled && !!user,
    retry: false,
  })
}

export function useCreateInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      opportunity_id: string
      invited_user_id: string
      role: string
      message?: string
    }) => {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || '초대 전송에 실패했습니다')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.all })
    },
  })
}

export function useRespondToInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'accepted' | 'declined' }) => {
      const res = await fetch(`/api/invitations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || '처리에 실패했습니다')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.all })
    },
  })
}
