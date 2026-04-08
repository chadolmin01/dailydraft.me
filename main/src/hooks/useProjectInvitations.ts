'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/src/context/AuthContext'

export interface ProjectInvitationOpportunity {
  id: string
  title: string
  type: string | null
  interest_tags: string[] | null
  needed_roles: string[] | null
  status: string | null
}

export interface ProjectInvitationInviter {
  user_id: string
  nickname: string | null
  desired_position: string | null
  avatar_url: string | null
}

export interface ProjectInvitation {
  id: string
  opportunity_id: string
  inviter_user_id: string
  invited_user_id: string
  role: string
  message: string | null
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  created_at: string
  updated_at: string
  expires_at?: string | null
  decline_reason?: string | null
  last_reminder_at?: string | null
  opportunity?: ProjectInvitationOpportunity | null
  inviter?: ProjectInvitationInviter | null
  invitee?: ProjectInvitationInviter | null
  match?: { score: number; reason: string } | null
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
  const { user, isLoading: isAuthLoading } = useAuth()

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
    enabled: !isAuthLoading && enabled && !!user,
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
    mutationFn: async ({ id, status, decline_reason }: { id: string; status: 'accepted' | 'declined'; decline_reason?: string }) => {
      const res = await fetch(`/api/invitations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, decline_reason }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error?.message || result.error || '처리에 실패했습니다')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.all })
    },
  })
}

export function useCancelInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/invitations/${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error?.message || '취소에 실패했습니다')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.all })
    },
  })
}

export function useRemindInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/invitations/${id}`, { method: 'PUT' })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error?.message || '리마인더 발송 실패')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.all })
    },
  })
}
