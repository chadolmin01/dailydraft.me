'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase/client'
import { useAuth } from '../context/AuthContext'
import type { Tables } from '../types/database'

type AcceptedConnection = Tables<'accepted_connections'>
type Profile = Tables<'profiles'>

export type ConnectionWithProfile = AcceptedConnection & {
  connected_profile?: Pick<Profile, 'id' | 'user_id' | 'nickname' | 'desired_position' | 'interest_tags' | 'contact_email'>
}

// Query keys
export const connectionKeys = {
  all: ['connections'] as const,
  list: (userId: string) => [...connectionKeys.all, 'list', userId] as const,
}

// Fetch current user's connections (both as applicant and opportunity creator)
export function useMyConnections() {
  const { user } = useAuth()

  return useQuery({
    queryKey: connectionKeys.list(user?.id ?? ''),
    queryFn: async () => {
      if (!user?.id) return []

      // Get connections where user is the opportunity creator
      const { data: asCreator, error: creatorError } = await supabase
        .from('accepted_connections')
        .select('*')
        .eq('opportunity_creator_id', user.id)
        .order('connected_at', { ascending: false })

      if (creatorError) throw creatorError

      // Get connections where user is the applicant
      const { data: asApplicant, error: applicantError } = await supabase
        .from('accepted_connections')
        .select('*')
        .eq('applicant_id', user.id)
        .order('connected_at', { ascending: false })

      if (applicantError) throw applicantError

      // Combine and deduplicate
      const allConnections = [...(asCreator || []), ...(asApplicant || [])]
      const uniqueConnections = allConnections.filter((conn, index, self) =>
        index === self.findIndex(c => c.id === conn.id)
      )

      // Get connected user IDs (the other party in each connection)
      const connectedUserIds = uniqueConnections.map(conn =>
        conn.opportunity_creator_id === user.id ? conn.applicant_id : conn.opportunity_creator_id
      )

      if (connectedUserIds.length === 0) return []

      // Fetch profiles for connected users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, nickname, desired_position, interest_tags, contact_email')
        .in('user_id', connectedUserIds)

      if (profilesError) throw profilesError

      // Map profiles to connections
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || [])

      return uniqueConnections.map(conn => {
        const connectedUserId = conn.opportunity_creator_id === user.id
          ? conn.applicant_id
          : conn.opportunity_creator_id
        return {
          ...conn,
          connected_profile: profileMap.get(connectedUserId)
        }
      }) as ConnectionWithProfile[]
    },
    enabled: !!user?.id,
  })
}

// Format time ago for last contact
export function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return 'Unknown'

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return '1d ago'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
  return `${Math.floor(diffDays / 365)}y ago`
}
