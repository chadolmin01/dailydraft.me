'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase/client'
import type { Tables } from '../types/database'

type Profile = Tables<'profiles'>

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
    queryFn: async () => {
      try {
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

        if (error) {
          console.error('Failed to fetch public profiles:', error.message, error.code, error.details)
          return []
        }
        return data as PublicProfile[]
      } catch (err) {
        console.error('Public profiles query error:', err)
        return []
      }
    },
  })
}

// Fetch profile by ID (public info only)
export function usePublicProfileById(profileId: string | undefined) {
  return useQuery({
    queryKey: [...publicProfileKeys.all, 'detail', profileId],
    queryFn: async () => {
      if (!profileId) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, nickname, desired_position, interest_tags, location, profile_visibility, vision_summary')
        .eq('id', profileId)
        .maybeSingle()

      if (error) throw error
      return data as PublicProfile | null
    },
    enabled: !!profileId,
  })
}
