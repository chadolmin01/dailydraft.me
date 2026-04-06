'use client'

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase/client'
import { useAuth } from '../context/AuthContext'
import type { TablesInsert, TablesUpdate } from '../types/database'
import type { Opportunity, OpportunityWithCreator } from '../types/opportunity'
import { withRetry } from '../lib/query-utils'

type OpportunityInsert = TablesInsert<'opportunities'>
type OpportunityUpdate = TablesUpdate<'opportunities'>

// Re-export for consumers that import from this hook
export type { OpportunityWithCreator } from '../types/opportunity'

import { opportunityKeys as sharedOpportunityKeys, fetchMyOpportunities } from '../lib/queries/profile-queries'

// Query keys — merge shared keys with local-only keys
export const opportunityKeys = {
  ...sharedOpportunityKeys,
  lists: () => [...sharedOpportunityKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...sharedOpportunityKeys.all, 'list', filters] as const,
  details: () => [...sharedOpportunityKeys.all, 'detail'] as const,
  detail: (id: string) => [...sharedOpportunityKeys.all, 'detail', id] as const,
  recommended: (userId: string) => [...sharedOpportunityKeys.all, 'recommended', userId] as const,
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
    queryFn: () => withRetry(async () => {
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
    }),
    staleTime: 1000 * 60 * 2,
    retry: (failureCount) => failureCount < 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  })
}

// Infinite scroll: fetch opportunities page by page
export function useInfiniteOpportunities(pageSize = 12) {
  return useInfiniteQuery({
    queryKey: [...opportunityKeys.lists(), 'infinite', pageSize],
    queryFn: ({ pageParam = 0 }) => withRetry(async () => {
      const { data, error, count } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact' })
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + pageSize - 1)

      if (error) throw error
      return { items: data as OpportunityWithCreator[], totalCount: count ?? 0, nextOffset: pageParam + pageSize }
    }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.items.length < pageSize ? undefined : lastPage.nextOffset,
    staleTime: 1000 * 60 * 2,
    retry: (failureCount) => failureCount < 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  })
}

// Fetch single opportunity by ID — creator profile을 병렬로 함께 가져옴
export function useOpportunity(id: string | undefined) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: opportunityKeys.detail(id ?? ''),
    queryFn: () => withRetry(async () => {
      if (!id) return null

      const { data: opp, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      // creator profile을 같은 queryFn 안에서 즉시 fetch
      // (별도 useQuery 훅 대기 없이 한 번의 React Query 사이클로 완료)
      let creator = undefined
      if (opp.creator_id) {
        const { data } = await supabase
          .from('profiles')
          .select('id, user_id, nickname, desired_position, university, interest_tags, skills, location, contact_email')
          .eq('user_id', opp.creator_id)
          .maybeSingle()
        creator = data || undefined
      }

      return { ...opp, creator } as OpportunityWithCreator
    }),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
    retry: (failureCount) => failureCount < 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    // 리스트 캐시에 이미 있으면 즉시 표시 (스켈레톤 없이 모달 바로 오픈)
    placeholderData: () => {
      if (!id) return undefined
      const listCaches = queryClient.getQueriesData<{ pages: { items: OpportunityWithCreator[] }[] }>({
        queryKey: ['opportunities', 'list', 'infinite'],
      })
      for (const [, cached] of listCaches) {
        if (!cached?.pages) continue
        for (const page of cached.pages) {
          const found = page.items?.find(item => item.id === id)
          if (found) return found
        }
      }
      return undefined
    },
  })
}

// Fetch current user's opportunities
export function useMyOpportunities() {
  const { user, isLoading: isAuthLoading } = useAuth()

  return useQuery({
    queryKey: opportunityKeys.my(user?.id ?? ''),
    queryFn: () => withRetry(() => fetchMyOpportunities(supabase, user!.id)),
    enabled: !isAuthLoading && !!user?.id,
    staleTime: 1000 * 60 * 2,
    retry: (failureCount) => failureCount < 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  })
}

// Fetch recommended opportunities for user
export function useRecommendedOpportunities(limit = 4) {
  const { user, isLoading: isAuthLoading } = useAuth()

  return useQuery({
    queryKey: opportunityKeys.recommended(user?.id ?? ''),
    queryFn: () => withRetry(async () => {
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
    }),
    enabled: !isAuthLoading && !!user?.id,
    retry: (failureCount) => failureCount < 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
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

export type SimilarOpportunity = {
  id: string
  title: string
  description: string
  type: string
  interest_tags: string[]
  needed_roles: string[]
  similarity: number
}

export function useSimilarOpportunities(id: string | undefined) {
  return useQuery({
    queryKey: [...opportunityKeys.detail(id ?? ''), 'similar'],
    queryFn: async (): Promise<SimilarOpportunity[]> => {
      const res = await fetch(`/api/opportunities/${id}/similar`)
      if (!res.ok) return []
      const json = await res.json()
      return json.data || []
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
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
