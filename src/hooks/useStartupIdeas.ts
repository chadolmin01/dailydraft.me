'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '../lib/supabase/client'
import { StartupIdeaSchema } from '../lib/schemas/explore'
import { useAuth } from '../context/AuthContext'
import type { StartupIdeaWithAnalysis } from '../lib/startups/types'

// Query key factory
export const startupIdeaKeys = {
  all: ['startup_ideas'] as const,
  lists: () => [...startupIdeaKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...startupIdeaKeys.lists(), filters] as const,
  details: () => [...startupIdeaKeys.all, 'detail'] as const,
  detail: (id: string) => [...startupIdeaKeys.details(), id] as const,
}

interface UseStartupIdeasOptions {
  sort?: 'final_score' | 'created_at' | 'upvotes'
  limit?: number
  analyzed?: boolean
  category?: string
}

export function useStartupIdeas(options?: UseStartupIdeasOptions) {
  const { sort = 'final_score', limit = 12, analyzed = true, category } = options ?? {}
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  return useQuery({
    queryKey: startupIdeaKeys.list({ sort, limit, analyzed, category }),
    enabled: isAuthenticated && !authLoading,
    staleTime: 1000 * 60 * 2,
    retry: (failureCount, error) => {
      if (error?.message?.includes('AbortError')) return failureCount < 1
      return failureCount < 2
    },
    queryFn: async () => {
      let query = supabase
        .from('startup_ideas')
        .select('id, external_id, name, tagline, description, logo_url, website_url, source, source_url, upvotes, category, korea_fit_score, final_score, korea_deep_analysis')
        .eq('status', 'active')

      if (analyzed) {
        query = query.not('korea_deep_analysis', 'is', null)
      }

      if (category && category !== 'all') {
        query = query.contains('category', [category])
      }

      query = query.order(sort, { ascending: false, nullsFirst: false }).limit(limit)

      const { data, error } = await query

      if (error) throw error

      // Parse each row through Zod for null safety & defaults
      return (data ?? []).map((row) => {
        const parsed = StartupIdeaSchema.safeParse(row)
        if (!parsed.success) {
          console.warn('[useStartupIdeas] Zod parse failed for row:', row?.id ?? 'unknown', parsed.error.issues)
        }
        return (parsed.success ? parsed.data : row) as StartupIdeaWithAnalysis
      })
    },
    placeholderData: keepPreviousData,
  })
}
