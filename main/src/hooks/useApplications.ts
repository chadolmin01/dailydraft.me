'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase/client'
import { useAuth } from '../context/AuthContext'
import type { Tables, TablesInsert, TablesUpdate } from '../types/database'

type Application = Tables<'applications'>
type ApplicationInsert = TablesInsert<'applications'>
type ApplicationUpdate = TablesUpdate<'applications'>
type Opportunity = Tables<'opportunities'>

export type ApplicationWithOpportunity = Application & {
  opportunities: Pick<Opportunity, 'id' | 'title' | 'type' | 'creator_id' | 'status'>
}

// Query keys
export const applicationKeys = {
  all: ['applications'] as const,
  lists: () => [...applicationKeys.all, 'list'] as const,
  my: (userId: string) => [...applicationKeys.all, 'my', userId] as const,
  forOpportunity: (opportunityId: string) => [...applicationKeys.all, 'opportunity', opportunityId] as const,
  detail: (id: string) => [...applicationKeys.all, 'detail', id] as const,
}

// Fetch current user's applications (with opportunity details)
export function useMyApplications() {
  const { user } = useAuth()

  return useQuery({
    queryKey: applicationKeys.my(user?.id ?? ''),
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          opportunities (
            id,
            title,
            type,
            creator_id,
            status
          )
        `)
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as ApplicationWithOpportunity[]
    },
    enabled: !!user?.id,
  })
}

// Fetch applications for a specific opportunity (for opportunity owner)
export function useApplicationsForOpportunity(opportunityId: string | undefined) {
  return useQuery({
    queryKey: applicationKeys.forOpportunity(opportunityId ?? ''),
    queryFn: async () => {
      if (!opportunityId) return []

      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Application[]
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
        })
        .select()
        .single()

      if (error) throw error
      return data as Application
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.my(user?.id ?? '') })
    },
  })
}

// Update application mutation
export function useUpdateApplication() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ApplicationUpdate }) => {
      const { data, error } = await supabase
        .from('applications')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Application
    },
    onSuccess: (data) => {
      queryClient.setQueryData(applicationKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: applicationKeys.my(user?.id ?? '') })
    },
  })
}

// Helper to map status to step number
export function getApplicationStep(status: string | null): number {
  switch (status) {
    case 'pending':
      return 1
    case 'reviewing':
      return 2
    case 'interviewing':
      return 3
    case 'accepted':
    case 'rejected':
      return 4
    default:
      return 1
  }
}

// Helper to format status for display
export function formatApplicationStatus(status: string | null): string {
  switch (status) {
    case 'pending':
      return 'PENDING'
    case 'reviewing':
      return 'REVIEW'
    case 'interviewing':
      return 'INTERVIEW'
    case 'accepted':
      return 'OFFER'
    case 'rejected':
      return 'REJECTED'
    default:
      return 'PENDING'
  }
}
