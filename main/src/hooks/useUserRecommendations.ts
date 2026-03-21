'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import type { Skill } from '../types/profile'
import { withRetry } from '../lib/query-utils'

export interface UserRecommendation {
  user_id: string
  nickname: string
  desired_position: string | null
  skills: Skill[]
  interest_tags: string[]
  location: string | null
  vision_summary: string | null
  founder_type: string | null
  current_situation: string | null
  match_score: number
  match_reason: string
  match_reason_detail: string
  match_details: {
    vision: number
    skill: number
    founder: number
    interest: number
    situation: number
  }
}

export const userRecommendationKeys = {
  all: ['user_recommendations'] as const,
  list: (options?: Record<string, unknown>) =>
    [...userRecommendationKeys.all, 'list', options] as const,
}

export function useUserRecommendations(options?: { limit?: number }) {
  const { user } = useAuth()

  return useQuery({
    queryKey: userRecommendationKeys.list(options ?? {}),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount) => failureCount < 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    enabled: !!user,
    queryFn: () =>
      withRetry(async () => {
        const res = await fetch('/api/users/recommendations')
        if (!res.ok) {
          throw new Error(`Failed to fetch recommendations: ${res.status}`)
        }
        const data: UserRecommendation[] = await res.json()
        if (options?.limit) {
          return data.slice(0, options.limit)
        }
        return data
      }),
  })
}
