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
  current_situation: string | null
  match_score: number
  match_reason: string
  match_details: {
    skill: number
    interest: number
    situation: number
    teamfit: number
  }
}

export const userRecommendationKeys = {
  all: ['user_recommendations'] as const,
  list: (options?: Record<string, unknown>) =>
    [...userRecommendationKeys.all, 'list', options] as const,
}

const CACHE_KEY = 'draft:user-recs'
const CACHE_TTL = 1000 * 60 * 5 // 5 minutes

function getCachedRecs(): UserRecommendation[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return null
    return data
  } catch {
    return null
  }
}

function setCachedRecs(data: UserRecommendation[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
  } catch { /* storage full — ignore */ }
}

export function useUserRecommendations(options?: { limit?: number }) {
  const { user, isLoading: isAuthLoading } = useAuth()

  return useQuery({
    queryKey: userRecommendationKeys.list(options ?? {}),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount) => failureCount < 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    enabled: !isAuthLoading && !!user,
    initialData: () => {
      const cached = getCachedRecs()
      if (!cached) return undefined
      return options?.limit ? cached.slice(0, options.limit) : cached
    },
    initialDataUpdatedAt: () => {
      try {
        const raw = localStorage.getItem(CACHE_KEY)
        if (!raw) return 0
        return JSON.parse(raw).ts
      } catch { return 0 }
    },
    queryFn: () =>
      withRetry(async () => {
        const res = await fetch('/api/users/recommendations')
        if (!res.ok) {
          throw new Error(`Failed to fetch recommendations: ${res.status}`)
        }
        const data: UserRecommendation[] = await res.json()
        setCachedRecs(data)
        if (options?.limit) {
          return data.slice(0, options.limit)
        }
        return data
      }),
  })
}
