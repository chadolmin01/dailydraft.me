'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase/client'
import { useAuth } from '../context/AuthContext'
import type { Tables, TablesUpdate } from '../types/database'
import { withRetry } from '../lib/query-utils'

type Profile = Tables<'profiles'>
type ProfileUpdate = TablesUpdate<'profiles'>

// Query keys
export const profileKeys = {
  all: ['profiles'] as const,
  detail: (userId: string) => [...profileKeys.all, userId] as const,
}

// Fetch current user's profile
export function useProfile() {
  const { user } = useAuth()

  return useQuery({
    queryKey: profileKeys.detail(user?.id ?? ''),
    queryFn: () => withRetry(async () => {
      if (!user?.id) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data as Profile | null
    }),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
    retry: (failureCount) => failureCount < 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  })
}

// Fetch any user's profile by userId
export function useProfileById(userId: string | undefined) {
  return useQuery({
    queryKey: profileKeys.detail(userId ?? ''),
    queryFn: () => withRetry(async () => {
      if (!userId) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data as Profile | null
    }),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
    retry: (failureCount) => failureCount < 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  })
}

// Update profile mutation
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { user, refreshProfile } = useAuth()

  return useMutation({
    mutationFn: async (updates: ProfileUpdate) => {
      if (!user?.id) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data as Profile
    },
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.detail(user?.id ?? ''), data)
      // Invalidate public_profiles cache so other views show updated data
      queryClient.invalidateQueries({ queryKey: ['public_profiles'] })
      // Sync AuthContext profile so navbar/header updates immediately
      refreshProfile().catch(() => {})
    },
  })
}

// Create profile mutation (for onboarding)
export function useCreateProfile() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (profile: Omit<Tables<'profiles'>, 'id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          ...profile,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data as Profile
    },
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.detail(user?.id ?? ''), data)
    },
  })
}
