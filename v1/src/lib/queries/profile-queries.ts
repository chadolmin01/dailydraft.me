/**
 * Shared query functions for profile-related data.
 * Used by both server prefetch (Server Components) and client hooks.
 *
 * All functions accept a Supabase client so they work with:
 *   - createServerSupabaseClient() on the server
 *   - browser supabase singleton on the client
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/src/types/database'

type TypedClient = SupabaseClient<Database>

// ── Query key factories (single source of truth) ──

export const profileKeys = {
  all: ['profiles'] as const,
  detail: (userId: string) => [...profileKeys.all, userId] as const,
}

export const portfolioKeys = {
  all: ['portfolio_items'] as const,
  list: (userId: string) => [...portfolioKeys.all, userId] as const,
}

export const opportunityKeys = {
  all: ['opportunities'] as const,
  my: (userId: string) => [...opportunityKeys.all, 'my', userId] as const,
}

export const universityVerificationKeys = {
  detail: (userId: string) => ['university-verification', userId] as const,
}

// ── Fetch functions ──

export async function fetchProfile(supabase: TypedClient, userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  // PGRST116 = no rows found — not an error, just null
  if (error && error.code !== 'PGRST116') throw error
  return data ?? null
}

export async function fetchMyOpportunities(supabase: TypedClient, userId: string) {
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('creator_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function fetchPortfolioItems(supabase: TypedClient, userId: string) {
  const { data, error } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('user_id', userId)
    .order('display_order', { ascending: true })

  if (error) {
    // Table might not exist yet (migration not applied)
    if (error.code === '42P01' || error.message?.includes('does not exist')) return []
    throw error
  }
  return data ?? []
}

export async function fetchUniversityVerification(supabase: TypedClient, userId: string) {
  const { data } = await supabase
    .from('users')
    .select('is_uni_verified, university')
    .eq('id', userId)
    .single()

  const d = data as { is_uni_verified: boolean | null; university: string | null } | null
  return {
    is_verified: d?.is_uni_verified || false,
    university: d?.university || null,
  }
}
