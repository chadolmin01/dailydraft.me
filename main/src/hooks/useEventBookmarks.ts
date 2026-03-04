'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase/client'
import { useAuth } from '../context/AuthContext'
import type { Tables } from '../types/database'

type EventBookmark = Tables<'event_bookmarks'>
type StartupEvent = Tables<'startup_events'>

export type EventBookmarkWithEvent = EventBookmark & {
  startup_events: Pick<StartupEvent, 'id' | 'title' | 'registration_end_date' | 'event_type' | 'organizer'>
}

// Query keys
export const eventBookmarkKeys = {
  all: ['event_bookmarks'] as const,
  list: (userId: string) => [...eventBookmarkKeys.all, 'list', userId] as const,
  upcoming: (userId: string) => [...eventBookmarkKeys.all, 'upcoming', userId] as const,
}

// Fetch current user's event bookmarks with event details
export function useEventBookmarks() {
  const { user } = useAuth()

  return useQuery({
    queryKey: eventBookmarkKeys.list(user?.id ?? ''),
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('event_bookmarks')
        .select(`
          *,
          startup_events (
            id,
            title,
            registration_end_date,
            event_type,
            organizer
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as EventBookmarkWithEvent[]
    },
    enabled: !!user?.id,
  })
}

// Fetch upcoming deadlines (events with registration_end_date in the future)
export function useUpcomingDeadlines(limit = 5) {
  const { user } = useAuth()

  return useQuery({
    queryKey: eventBookmarkKeys.upcoming(user?.id ?? ''),
    queryFn: async () => {
      if (!user?.id) return []

      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('event_bookmarks')
        .select(`
          *,
          startup_events (
            id,
            title,
            registration_end_date,
            event_type,
            organizer
          )
        `)
        .eq('user_id', user.id)
        .gte('startup_events.registration_end_date', now)
        .order('startup_events(registration_end_date)', { ascending: true })
        .limit(limit)

      if (error) throw error
      return data as EventBookmarkWithEvent[]
    },
    enabled: !!user?.id,
  })
}

// Calculate days until deadline
export function calculateDaysUntilDeadline(endDate: string): number {
  const deadline = new Date(endDate)
  const now = new Date()
  const diff = deadline.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

// Get the closest deadline info
export function useClosestDeadline() {
  const { user } = useAuth()

  return useQuery({
    queryKey: [...eventBookmarkKeys.upcoming(user?.id ?? ''), 'closest'],
    queryFn: async () => {
      if (!user?.id) return null

      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('event_bookmarks')
        .select(`
          *,
          startup_events!inner (
            id,
            title,
            registration_end_date,
            event_type,
            organizer
          )
        `)
        .eq('user_id', user.id)
        .gte('startup_events.registration_end_date', now)
        .order('startup_events(registration_end_date)', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (error) throw error

      if (!data) return null

      const bookmark = data as EventBookmarkWithEvent
      const daysLeft = calculateDaysUntilDeadline(bookmark.startup_events.registration_end_date)

      return {
        bookmark,
        daysLeft,
      }
    },
    enabled: !!user?.id,
  })
}

// Get count of bookmarks with upcoming deadlines
export function useUpcomingDeadlineCount() {
  const { user } = useAuth()

  return useQuery({
    queryKey: [...eventBookmarkKeys.upcoming(user?.id ?? ''), 'count'],
    queryFn: async () => {
      if (!user?.id) return 0

      const now = new Date().toISOString()

      const { count, error } = await supabase
        .from('event_bookmarks')
        .select(`
          *,
          startup_events!inner (
            registration_end_date
          )
        `, { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('startup_events.registration_end_date', now)

      if (error) throw error
      return count ?? 0
    },
    enabled: !!user?.id,
  })
}
