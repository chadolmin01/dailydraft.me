'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase/client'
import type { Tables } from '../types/database'

type Profile = Tables<'profiles'>

// AbortError 방어: 실패 시 1회 재시도
async function withRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    if (retries > 0 && err instanceof DOMException && err.name === 'AbortError') {
      await new Promise(r => setTimeout(r, 300))
      return withRetry(fn, retries - 1)
    }
    throw err
  }
}

export type PublicProfile = Pick<Profile,
  'id' | 'user_id' | 'nickname' | 'desired_position' | 'interest_tags' | 'location' | 'profile_visibility' | 'vision_summary'
>

// Query keys
export const publicProfileKeys = {
  all: ['public_profiles'] as const,
  list: (filters: Record<string, unknown>) => [...publicProfileKeys.all, 'list', filters] as const,
}

// Fetch public profiles (users with public visibility)
export function usePublicProfiles(options?: {
  limit?: number
  interestTags?: string[]
}) {
  return useQuery({
    queryKey: publicProfileKeys.list(options ?? {}),
    staleTime: 1000 * 60 * 2,
    retry: (failureCount) => failureCount < 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    queryFn: () => withRetry(async () => {
      let query = supabase
        .from('profiles')
        .select('id, user_id, nickname, desired_position, interest_tags, location, profile_visibility, vision_summary')
        .eq('profile_visibility', 'public')
        .order('updated_at', { ascending: false })

      if (options?.interestTags && options.interestTags.length > 0) {
        query = query.overlaps('interest_tags', options.interestTags)
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) throw error
      return data as PublicProfile[]
    }),
  })
}

// Fetch profile by ID (public info only)
export function usePublicProfileById(profileId: string | undefined) {
  return useQuery({
    queryKey: [...publicProfileKeys.all, 'detail', profileId],
    staleTime: 1000 * 60 * 2,
    retry: (failureCount) => failureCount < 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    queryFn: () => withRetry(async () => {
      if (!profileId) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, nickname, desired_position, interest_tags, location, profile_visibility, vision_summary')
        .eq('id', profileId)
        .eq('profile_visibility', 'public')
        .maybeSingle()

      if (error) throw error
      return data as PublicProfile | null
    }),
    enabled: !!profileId,
  })
}

// Fetch profile by user_id (for creator info)
export type CreatorProfile = Pick<Profile,
  'id' | 'user_id' | 'nickname' | 'desired_position' | 'university' | 'interest_tags' | 'skills' | 'location' | 'contact_email'
>

export function useProfileByUserId(userId: string | undefined) {
  return useQuery({
    queryKey: [...publicProfileKeys.all, 'user', userId],
    staleTime: 1000 * 60 * 2,
    retry: (failureCount) => failureCount < 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    queryFn: () => withRetry(async () => {
      if (!userId) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, nickname, desired_position, university, interest_tags, skills, location, contact_email')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) throw error
      return data as CreatorProfile | null
    }),
    enabled: !!userId,
  })
}
