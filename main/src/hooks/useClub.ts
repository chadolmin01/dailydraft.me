'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase/client'
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
  team_channel_visibility: 'isolated' | 'open'
  created_by: string
  created_at: string
  updated_at: string
  member_count: number
  cohorts: string[]
  badges: ClubBadge[]
  owner: { user_id: string; nickname: string | null; avatar_url: string | null }
  my_role: string | null
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
  projects: number
  updates: number
  active_invite_codes: number
}

// --- Bot Activity Types ---

export interface BotActivitySummary {
  total_interventions: number
  accepted: number
  dismissed: number
  acceptance_rate: number | null
  pending_tasks: number
  completed_tasks: number
  total_decisions: number
  total_resources: number
}

export interface BotIntervention {
  id: string
  pattern_type: string
  confidence: number
  trigger_type: string
  user_response: string | null
  created_at: string
  discord_channel_id: string | null
}

export interface TeamTask {
  id: string
  assignee_name: string
  task_description: string
  deadline: string | null
  status: string
  created_at: string
  completed_at: string | null
}

export interface TeamDecision {
  id: string
  topic: string
  result: string
  decided_at: string
}

export interface TeamResource {
  id: string
  url: string
  label: string
  shared_by_name: string
  resource_type: string
  created_at: string
}

export interface ClubBotActivity {
  summary: BotActivitySummary
  interventions: BotIntervention[]
  tasks: TeamTask[]
  decisions: TeamDecision[]
  resources: TeamResource[]
}

export interface ClubProject {
  id: string
  title: string
  type: string | null
  status: string | null
  interest_tags: string[]
  needed_roles: string[]
  interest_count: number
  views_count: number
  created_at: string
  creator_nickname: string | null
}

// --- Team Types ---

export interface TeamMember {
  user_id: string
  nickname: string | null
  avatar_url: string | null
  role: string
  position: string | null
}

export interface ClubTeam {
  id: string
  title: string
  status: string | null
  cohort: string | null
  created_at: string
  members: TeamMember[]
  member_count: number
  current_week: number
  update_count: number
  update_status: 'complete' | 'missing' | 'overdue'
  latest_update: {
    week_number: number
    title: string
    update_type: string
    created_at: string
  } | null
}

export interface ClubTeamsResponse {
  teams: ClubTeam[]
  summary: {
    total_teams: number
    updated_this_week: number
    missing_updates: number
    latest_week: number
  }
}

// --- Query Keys ---

export const clubKeys = {
  all: ['clubs'] as const,
  detail: (slug: string) => [...clubKeys.all, 'detail', slug] as const,
  members: (slug: string, filters: Record<string, unknown>) =>
    [...clubKeys.all, 'members', slug, filters] as const,
  stats: (slug: string) => [...clubKeys.all, 'stats', slug] as const,
  projects: (slug: string) => [...clubKeys.all, 'projects', slug] as const,
  botActivity: (slug: string) => [...clubKeys.all, 'bot-activity', slug] as const,
  teams: (slug: string) => [...clubKeys.all, 'teams', slug] as const,
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

export function useClubProjects(clubId: string | undefined) {
  return useQuery({
    queryKey: clubKeys.projects(clubId ?? ''),
    enabled: !!clubId,
    staleTime: 1000 * 60 * 2,
    retry: (failureCount) => failureCount < 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    queryFn: () =>
      withRetry(async () => {
        const { data, error } = await supabase
          .from('opportunities')
          .select('id, title, type, status, interest_tags, needed_roles, interest_count, views_count, created_at, creator:profiles!opportunities_creator_profile_fkey(nickname)')
          .eq('club_id', clubId!)
          .order('created_at', { ascending: false })
          .limit(20)

        if (error) throw error
        return (data ?? []).map(p => ({
          ...p,
          creator_nickname: (p.creator as unknown as { nickname: string } | null)?.nickname ?? null,
        })) as ClubProject[]
      }),
  })
}

export function useClubTeams(slug: string | undefined) {
  return useQuery({
    queryKey: clubKeys.teams(slug ?? ''),
    enabled: !!slug,
    staleTime: 1000 * 60 * 2,
    retry: (failureCount) => failureCount < 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    queryFn: () =>
      withRetry(async () => {
        const res = await fetch(`/api/clubs/${slug}/teams`)
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.error?.message || `Teams fetch failed: ${res.status}`)
        }
        return res.json() as Promise<ClubTeamsResponse>
      }),
  })
}

export function useClubBotActivity(slug: string | undefined) {
  return useQuery({
    queryKey: clubKeys.botActivity(slug ?? ''),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
    retry: (failureCount) => failureCount < 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    queryFn: () =>
      withRetry(async () => {
        const res = await fetch(`/api/clubs/${slug}/bot-activity`)
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.error?.message || `Bot activity fetch failed: ${res.status}`)
        }
        return res.json() as Promise<ClubBotActivity>
      }),
  })
}
