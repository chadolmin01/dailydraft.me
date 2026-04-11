'use client'

import { useQuery } from '@tanstack/react-query'
import { withRetry } from '../lib/query-utils'

// --- Types ---

export interface ClubBadge {
  id: string
  type: string
  method: string
  verified_at: string
  university: { name: string; short_name: string | null } | null
}

export interface ClubDetail {
  id: string
  slug: string
  name: string
  description: string | null
  logo_url: string | null
  category: string | null
  visibility: string
  require_approval: boolean
  created_by: string
  created_at: string
  updated_at: string
  member_count: number
  cohorts: string[]
  badges: ClubBadge[]
  owner: { user_id: string; nickname: string | null; avatar_url: string | null }
}

export interface ClubMember {
  id: string
  type: 'real' | 'ghost'
  user_id: string | null
  nickname: string | null
  avatar_url: string | null
  role: string
  display_role: string | null
  cohort: string | null
  joined_at: string
  department?: string | null
  university?: string | null
  skills?: Array<{ name: string }> | null
}

export interface ClubMembersResponse {
  members: ClubMember[]
  total: number
  limit: number
  offset: number
}

export interface ClubStats {
  members: { total: number; real: number; ghost: number; by_role: Record<string, number>; by_cohort: Record<string, number> }
  pending_approvals: number
  project_count: number
  weekly_updates_count: number
  active_invite_codes: number
}

// --- Query Keys ---

export const clubKeys = {
  all: ['clubs'] as const,
  detail: (slug: string) => [...clubKeys.all, 'detail', slug] as const,
  members: (slug: string, filters: Record<string, unknown>) =>
    [...clubKeys.all, 'members', slug, filters] as const,
  stats: (slug: string) => [...clubKeys.all, 'stats', slug] as const,
}

// --- Hooks ---

export function useClub(slug: string | undefined) {
  return useQuery({
    queryKey: clubKeys.detail(slug ?? ''),
    enabled: !!slug,
    staleTime: 1000 * 60 * 2,
    retry: (failureCount) => failureCount < 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    queryFn: () =>
      withRetry(async () => {
        const res = await fetch(`/api/clubs/${slug}`)
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.error?.message || `Club fetch failed: ${res.status}`)
        }
        return res.json() as Promise<ClubDetail>
      }),
  })
}

export function useClubMembers(
  slug: string | undefined,
  options?: { cohort?: string; role?: string; limit?: number; offset?: number }
) {
  const filters = options ?? {}

  return useQuery({
    queryKey: clubKeys.members(slug ?? '', filters),
    enabled: !!slug,
    staleTime: 1000 * 60 * 2,
    retry: (failureCount) => failureCount < 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    queryFn: () =>
      withRetry(async () => {
        const params = new URLSearchParams()
        if (options?.cohort) params.set('cohort', options.cohort)
        if (options?.role) params.set('role', options.role)
        if (options?.limit) params.set('limit', String(options.limit))
        if (options?.offset) params.set('offset', String(options.offset))

        const qs = params.toString()
        const res = await fetch(`/api/clubs/${slug}/members${qs ? `?${qs}` : ''}`)
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.error?.message || `Members fetch failed: ${res.status}`)
        }
        return res.json() as Promise<ClubMembersResponse>
      }),
  })
}

export function useClubStats(slug: string | undefined) {
  return useQuery({
    queryKey: clubKeys.stats(slug ?? ''),
    enabled: !!slug,
    staleTime: 1000 * 60 * 2,
    retry: (failureCount) => failureCount < 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    queryFn: () =>
      withRetry(async () => {
        const res = await fetch(`/api/clubs/${slug}/stats`)
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.error?.message || `Stats fetch failed: ${res.status}`)
        }
        return res.json() as Promise<ClubStats>
      }),
  })
}
