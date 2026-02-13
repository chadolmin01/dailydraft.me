import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase/client'
import { useAuth } from '../context/AuthContext'
import type { Tables, TablesInsert, TablesUpdate, Json } from '../types/database'

type Application = Tables<'applications'>
type ApplicationInsert = TablesInsert<'applications'>
type ApplicationUpdate = TablesUpdate<'applications'>

// Extended type with opportunity and applicant info
export type ApplicationWithDetails = Application & {
  opportunity?: {
    id: string
    title: string
    type: string
    creator_id: string
  }
  applicant?: {
    nickname: string
    user_id: string
    skills: Json
    location: string | null
  }
}

// Query keys
export const applicationKeys = {
  all: ['applications'] as const,
  sent: (userId: string) => [...applicationKeys.all, 'sent', userId] as const,
  received: (userId: string) => [...applicationKeys.all, 'received', userId] as const,
  forOpportunity: (opportunityId: string) => [...applicationKeys.all, 'opportunity', opportunityId] as const,
  detail: (id: string) => [...applicationKeys.all, 'detail', id] as const,
}

// Fetch applications sent by current user
export function useMyApplications() {
  const { user } = useAuth()

  return useQuery({
    queryKey: applicationKeys.sent(user?.id ?? ''),
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          opportunity:opportunities(id, title, type, creator_id)
        `)
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as ApplicationWithDetails[]
    },
    enabled: !!user?.id,
  })
}

// Fetch applications received for user's opportunities
export function useReceivedApplications() {
  const { user } = useAuth()

  return useQuery({
    queryKey: applicationKeys.received(user?.id ?? ''),
    queryFn: async () => {
      if (!user?.id) return []

      // First get user's opportunity IDs
      const { data: opportunities, error: oppError } = await supabase
        .from('opportunities')
        .select('id')
        .eq('creator_id', user.id)

      if (oppError) throw oppError

      const opportunityIds = opportunities.map(o => o.id)

      if (opportunityIds.length === 0) return []

      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          opportunity:opportunities(id, title, type, creator_id),
          applicant:profiles!applications_applicant_id_fkey(nickname, user_id, skills, location)
        `)
        .in('opportunity_id', opportunityIds)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as ApplicationWithDetails[]
    },
    enabled: !!user?.id,
  })
}

// Fetch applications for a specific opportunity
export function useApplicationsForOpportunity(opportunityId: string | undefined) {
  return useQuery({
    queryKey: applicationKeys.forOpportunity(opportunityId ?? ''),
    queryFn: async () => {
      if (!opportunityId) return []

      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          applicant:profiles!applications_applicant_id_fkey(nickname, user_id, skills, location, vision_summary)
        `)
        .eq('opportunity_id', opportunityId)
        .order('match_score', { ascending: false })

      if (error) throw error
      return data as ApplicationWithDetails[]
    },
    enabled: !!opportunityId,
  })
}

// Create application mutation
export function useCreateApplication() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (application: Omit<ApplicationInsert, 'applicant_id'>) => {
      if (!user?.id) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('applications')
        .insert({
          ...application,
          applicant_id: user.id,
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw error
      return data as Application
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.sent(user?.id ?? '') })
      queryClient.invalidateQueries({ queryKey: applicationKeys.forOpportunity(data.opportunity_id) })
    },
  })
}

// Update application status mutation (for opportunity owners)
export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'pending' | 'accepted' | 'rejected' }) => {
      const { data, error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Application
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.all })
    },
  })
}

// Accept application (creates connection)
export function useAcceptApplication() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ applicationId, applicantId }: { applicationId: string; applicantId: string }) => {
      if (!user?.id) throw new Error('Not authenticated')

      // Update application status
      const { error: updateError } = await supabase
        .from('applications')
        .update({ status: 'accepted' })
        .eq('id', applicationId)

      if (updateError) throw updateError

      // Create connection
      const { data, error } = await supabase
        .from('accepted_connections')
        .insert({
          application_id: applicationId,
          opportunity_creator_id: user.id,
          applicant_id: applicantId,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.all })
    },
  })
}

// Check if user has already applied to an opportunity
export function useHasApplied(opportunityId: string | undefined) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['hasApplied', opportunityId, user?.id],
    queryFn: async () => {
      if (!user?.id || !opportunityId) return false

      const { data, error } = await supabase
        .from('applications')
        .select('id')
        .eq('opportunity_id', opportunityId)
        .eq('applicant_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return !!data
    },
    enabled: !!user?.id && !!opportunityId,
  })
}
