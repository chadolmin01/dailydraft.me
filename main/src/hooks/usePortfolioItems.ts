'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase/client'
import { useAuth } from '../context/AuthContext'
import { portfolioKeys, fetchPortfolioItems } from '../lib/queries/profile-queries'

export interface PortfolioItem {
  id: string
  user_id: string
  title: string
  description: string | null
  image_url: string | null
  link_url: string | null
  display_order: number | null
  created_at: string | null
  updated_at: string | null
}

// Re-export keys
export { portfolioKeys }

export function usePortfolioItems(userId?: string) {
  const { user } = useAuth()
  const targetId = userId || user?.id || ''

  return useQuery({
    queryKey: portfolioKeys.list(targetId),
    queryFn: () => fetchPortfolioItems(supabase, targetId),
    enabled: !!targetId,
    staleTime: 1000 * 60 * 2,
    retry: false,
  })
}

export function useCreatePortfolioItem() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (item: { title: string; description?: string; image_url?: string; link_url?: string; display_order?: number }) => {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create portfolio item')
      }
      return res.json() as Promise<PortfolioItem>
    },
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: portfolioKeys.list(user.id) })
      }
    },
  })
}

export function useUpdatePortfolioItem() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; description?: string; image_url?: string; link_url?: string; display_order?: number }) => {
      const res = await fetch(`/api/portfolio/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update portfolio item')
      }
      return res.json() as Promise<PortfolioItem>
    },
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: portfolioKeys.list(user.id) })
      }
    },
  })
}

export function useDeletePortfolioItem() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/portfolio/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete portfolio item')
      }
    },
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: portfolioKeys.list(user.id) })
      }
    },
  })
}
