'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase/client'
import { useAuth } from '../context/AuthContext'
import type { Tables, TablesInsert, TablesUpdate } from '../types/database'

type Opportunity = Tables<'opportunities'>
type OpportunityInsert = TablesInsert<'opportunities'>
type OpportunityUpdate = TablesUpdate<'opportunities'>

// Extended type with creator profile
export type OpportunityWithCreator = Opportunity & {
  creator?: {
    nickname: string
    user_id: string
    skills?: unknown
    location?: string | null
    contact_email?: string | null
    desired_position?: string | null
    university?: string | null
  }
}

// Query keys
export const opportunityKeys = {
  all: ['opportunities'] as const,
  lists: () => [...opportunityKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...opportunityKeys.lists(), filters] as const,
  details: () => [...opportunityKeys.all, 'detail'] as const,
  detail: (id: string) => [...opportunityKeys.details(), id] as const,
  my: (userId: string) => [...opportunityKeys.all, 'my', userId] as const,
  recommended: (userId: string) => [...opportunityKeys.all, 'recommended', userId] as const,
}

// Fetch all active opportunities
export function useOpportunities(filters?: {
  type?: string
  interestTags?: string[]
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: opportunityKeys.list(filters ?? {}),
    queryFn: async () => {
      let query = supabase
        .from('opportunities')
        .select('*', { count: 'exact' })
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (filters?.type) {
        query = query.eq('type', filters.type)
      }

      if (filters?.interestTags && filters.interestTags.length > 0) {
        query = query.overlaps('interest_tags', filters.interestTags)
      }

      const offset = filters?.offset ?? 0
      const limit = filters?.limit ?? 50

      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) throw error
      return { items: data as OpportunityWithCreator[], totalCount: count ?? 0 }
    },
    staleTime: 1000 * 60 * 2,
    retry: (failureCount, error) => {
      // AbortError는 Strict Mode에서 발생 → 조용히 1회 재시도
      if (error?.message?.includes('AbortError')) return failureCount < 1
      return failureCount < 2
    },
  })
}

// Fetch single opportunity by ID
export function useOpportunity(id: string | undefined) {
  return useQuery({
    queryKey: opportunityKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) return null

      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as OpportunityWithCreator
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
    retry: (failureCount, error) => {
      if (error?.message?.includes('AbortError')) return failureCount < 1
      return failureCount < 2
    },
  })
}

// Fetch current user's opportunities
export function useMyOpportunities() {
  const { user } = useAuth()

  return useQuery({
    queryKey: opportunityKeys.my(user?.id ?? ''),
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Opportunity[]
    },
    enabled: !!user?.id,
  })
}

// Fetch recommended opportunities for user
export function useRecommendedOpportunities(limit = 4) {
  const { user } = useAuth()

  return useQuery({
    queryKey: opportunityKeys.recommended(user?.id ?? ''),
    queryFn: async () => {
      // For now, just fetch recent active opportunities
      // In production, this would use vector similarity search
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('status', 'active')
        .neq('creator_id', user?.id ?? '')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data as OpportunityWithCreator[]
    },
    enabled: !!user?.id,
  })
}

// Create opportunity mutation
export function useCreateOpportunity() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (opportunity: Omit<OpportunityInsert, 'creator_id'>) => {
      if (!user?.id) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('opportunities')
        .insert({
          ...opportunity,
          creator_id: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data as Opportunity
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() })
      queryClient.invalidateQueries({ queryKey: opportunityKeys.my(user?.id ?? '') })
    },
  })
}

// Update opportunity mutation
export function useUpdateOpportunity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: OpportunityUpdate }) => {
      const { data, error } = await supabase
        .from('opportunities')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Opportunity
    },
    onSuccess: (data) => {
      queryClient.setQueryData(opportunityKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() })
    },
  })
}

// Delete (close) opportunity mutation
export function useDeleteOpportunity() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('opportunities')
        .update({ status: 'closed' })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() })
      queryClient.invalidateQueries({ queryKey: opportunityKeys.my(user?.id ?? '') })
    },
  })
}

// Helper to calculate days left until deadline (based on created_at + 30 days default)
export function calculateDaysLeft(createdAt: string | null, durationDays = 30): number {
  if (!createdAt) return 0
  const created = new Date(createdAt)
  const deadline = new Date(created.getTime() + durationDays * 24 * 60 * 60 * 1000)
  const now = new Date()
  const diff = deadline.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
