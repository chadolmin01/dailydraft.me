'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase/client'
import { useAuth } from '../context/AuthContext'

export interface ProjectUpdate {
  id: string
  opportunity_id: string
  author_id: string
  week_number: number
  title: string
  content: string
  update_type: 'ideation' | 'design' | 'development' | 'launch' | 'general'
  created_at: string | null
  updated_at: string | null
}

export const projectUpdateKeys = {
  all: ['project_updates'] as const,
  byOpportunity: (opportunityId: string) => [...projectUpdateKeys.all, opportunityId] as const,
}

// Fetch updates for a project
export function useProjectUpdates(opportunityId: string | undefined) {
  return useQuery({
    queryKey: projectUpdateKeys.byOpportunity(opportunityId ?? ''),
    staleTime: 1000 * 60 * 2,
    retry: (failureCount, error) => {
      if (error?.message?.includes('AbortError')) return failureCount < 1
      return failureCount < 2
    },
    queryFn: async () => {
      if (!opportunityId) return []

      const { data, error } = await supabase
        .from('project_updates')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .order('week_number', { ascending: true })

      if (error) throw error
      return data as ProjectUpdate[]
    },
    enabled: !!opportunityId,
  })
}

// Create a new update (via API — triggers team notifications server-side)
export function useCreateProjectUpdate() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (input: {
      opportunity_id: string
      week_number: number
      title: string
      content: string
      update_type: ProjectUpdate['update_type']
    }) => {
      if (!user?.id) throw new Error('Not authenticated')

      const res = await fetch('/api/project-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.message || '업데이트 생성에 실패했습니다')
      }

      return (await res.json()) as ProjectUpdate
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: projectUpdateKeys.byOpportunity(data.opportunity_id),
      })
    },
  })
}
