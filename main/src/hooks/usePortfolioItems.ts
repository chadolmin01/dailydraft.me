'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'

export interface PortfolioItem {
  id: string
  user_id: string
  title: string
  description: string | null
  image_url: string | null
  link_url: string | null
  display_order: number
  created_at: string
  updated_at: string
}

const portfolioKeys = {
  all: ['portfolio_items'] as const,
  list: (userId: string) => [...portfolioKeys.all, userId] as const,
}

export function usePortfolioItems(userId?: string) {
  const { user } = useAuth()
  const targetId = userId || user?.id || ''

  return useQuery({
    queryKey: portfolioKeys.list(targetId),
    queryFn: async () => {
      const res = await fetch(`/api/portfolio?user_id=${targetId}`)
      if (!res.ok) return [] as PortfolioItem[]
      return res.json() as Promise<PortfolioItem[]>
    },
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
