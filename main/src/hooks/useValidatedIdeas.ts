'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Json } from '../types/database'
import { supabase } from '../lib/supabase/client'
import { useAuth } from '../context/AuthContext'
import type { Tables, TablesInsert, TablesUpdate } from '../types/database'

type ValidatedIdea = Tables<'validated_ideas'>
type ValidatedIdeaInsert = TablesInsert<'validated_ideas'>
type ValidatedIdeaUpdate = TablesUpdate<'validated_ideas'>

// Artifacts type for convenience
export interface ValidatedIdeaArtifacts {
  prd?: string
  jd?: string
}

/** 페르소나별 점수 (0-100 범위) */
export interface PersonaScores {
  developer?: number
  designer?: number
  vc?: number
}

/** 직군별 실행 계획 */
export interface ActionPlan {
  developer?: string[]
  designer?: string[]
  vc?: string[]
}

/** 검증 난이도 레벨 */
export type ValidationLevel = 'SKETCH' | 'MVP' | 'DEFENSE'
const VALID_LEVELS: readonly ValidationLevel[] = ['SKETCH', 'MVP', 'DEFENSE']

/**
 * Full update data for validated idea
 * @remarks At least one field must be provided for update
 */
export interface ValidatedIdeaFullData {
  artifacts?: ValidatedIdeaArtifacts
  score?: number
  personaScores?: PersonaScores
  actionPlan?: ActionPlan
  validationLevel?: ValidationLevel
}

// Extended type for UI compatibility
export interface ValidatedIdeaWithLegacyId extends ValidatedIdea {
  legacyId?: string // For localStorage migration compatibility
}

// Query keys
export const validatedIdeaKeys = {
  all: ['validated_ideas'] as const,
  list: (userId: string) => [...validatedIdeaKeys.all, 'list', userId] as const,
  detail: (id: string) => [...validatedIdeaKeys.all, 'detail', id] as const,
}

// Fetch current user's validated ideas
export function useValidatedIdeas(limit = 10) {
  const { user, isLoading: isAuthLoading } = useAuth()

  return useQuery({
    queryKey: validatedIdeaKeys.list(user?.id ?? ''),
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('validated_ideas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data as ValidatedIdea[]
    },
    enabled: !isAuthLoading && !!user?.id,
    staleTime: 1000 * 60 * 2,
  })
}

// Fetch single validated idea by ID
export function useValidatedIdea(id: string | undefined) {
  return useQuery({
    queryKey: validatedIdeaKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) return null

      const { data, error } = await supabase
        .from('validated_ideas')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as ValidatedIdea
    },
    enabled: !!id,
  })
}

// Create validated idea mutation
export function useCreateValidatedIdea() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (idea: Omit<ValidatedIdeaInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('validated_ideas')
        .insert({
          ...idea,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data as ValidatedIdea
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: validatedIdeaKeys.list(user?.id ?? '') })
    },
  })
}

// Update validated idea mutation
export function useUpdateValidatedIdea() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ValidatedIdeaUpdate }) => {
      const { data, error } = await supabase
        .from('validated_ideas')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as ValidatedIdea
    },
    onSuccess: (data) => {
      queryClient.setQueryData(validatedIdeaKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: validatedIdeaKeys.list(user?.id ?? '') })
    },
  })
}

// Delete validated idea mutation
export function useDeleteValidatedIdea() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('validated_ideas')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: validatedIdeaKeys.list(user?.id ?? '') })
    },
  })
}

// Update artifacts for a validated idea
export function useUpdateValidatedIdeaArtifacts() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ id, artifacts }: { id: string; artifacts: ValidatedIdeaArtifacts }) => {
      const { data, error } = await supabase
        .from('validated_ideas')
        .update({ artifacts: artifacts as unknown as Json })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as ValidatedIdea
    },
    onSuccess: (data) => {
      queryClient.setQueryData(validatedIdeaKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: validatedIdeaKeys.list(user?.id ?? '') })
    },
  })
}

// Helper to get latest validated idea
export function useLatestValidatedIdea() {
  const { data: ideas } = useValidatedIdeas(1)
  return ideas?.[0] ?? null
}

// Update validated idea with full data (artifacts + scores)
export function useUpdateValidatedIdeaFull() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: ValidatedIdeaFullData
    }) => {
      // ID 유효성 검증
      if (!id || id.trim() === '') {
        throw new Error('Invalid idea ID')
      }

      const updates: ValidatedIdeaUpdate = {}

      if (data.artifacts) {
        updates.artifacts = data.artifacts as unknown as ValidatedIdeaUpdate['artifacts']
      }

      if (data.score !== undefined) {
        // 범위 검증
        if (data.score < 0 || data.score > 100) {
          throw new Error('Score must be between 0 and 100')
        }
        updates.score = data.score
      }

      if (data.personaScores) {
        updates.persona_scores = data.personaScores as unknown as ValidatedIdeaUpdate['persona_scores']
      }

      if (data.actionPlan) {
        updates.action_plan = data.actionPlan as unknown as ValidatedIdeaUpdate['action_plan']
      }

      if (data.validationLevel) {
        // 유효성 검증
        if (!VALID_LEVELS.includes(data.validationLevel)) {
          throw new Error('Invalid validation level. Must be SKETCH, MVP, or DEFENSE')
        }
        updates.validation_level = data.validationLevel
      }

      // 빈 업데이트 방지
      if (Object.keys(updates).length === 0) {
        throw new Error('No fields to update')
      }

      const { data: result, error } = await supabase
        .from('validated_ideas')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return result as ValidatedIdea
    },
    onSuccess: (data) => {
      // Detail 캐시 즉시 업데이트
      queryClient.setQueryData(validatedIdeaKeys.detail(data.id), data)

      // List 캐시 무효화 (user 존재 확인)
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: validatedIdeaKeys.list(user.id) })
      }
    },
    onError: (error) => {
      console.error('[useUpdateValidatedIdeaFull] Update failed:', error)
    },
  })
}
