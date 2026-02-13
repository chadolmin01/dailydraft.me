import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase/client'
import { useAuth } from '../context/AuthContext'
import type { Tables, TablesInsert } from '../types/database'

type StartupEvent = Tables<'startup_events'>
type EventBookmark = Tables<'event_bookmarks'>

// Extended type with bookmark info
export type EventWithBookmark = StartupEvent & {
  isBookmarked?: boolean
  bookmarkId?: string
}

// Query keys
export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...eventKeys.lists(), filters] as const,
  detail: (id: string) => [...eventKeys.all, 'detail', id] as const,
  bookmarked: (userId: string) => [...eventKeys.all, 'bookmarked', userId] as const,
  recommended: (userId: string) => [...eventKeys.all, 'recommended', userId] as const,
}

// Fetch upcoming events
export function useEvents(filters?: {
  eventType?: string
  limit?: number
  tags?: string[]
}) {
  const { user } = useAuth()

  return useQuery({
    queryKey: eventKeys.list(filters ?? {}),
    queryFn: async () => {
      let query = supabase
        .from('startup_events')
        .select('*')
        .eq('status', 'active')
        .gte('registration_end_date', new Date().toISOString().split('T')[0])
        .order('registration_end_date', { ascending: true })

      if (filters?.eventType) {
        query = query.eq('event_type', filters.eventType)
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('interest_tags', filters.tags)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      const { data: events, error } = await query

      if (error) throw error

      // Get user's bookmarks if authenticated
      if (user?.id) {
        const { data: bookmarks } = await supabase
          .from('event_bookmarks')
          .select('event_id, id')
          .eq('user_id', user.id)

        const bookmarkMap = new Map(bookmarks?.map(b => [b.event_id, b.id]) ?? [])

        return events.map(event => ({
          ...event,
          isBookmarked: bookmarkMap.has(event.id),
          bookmarkId: bookmarkMap.get(event.id),
        })) as EventWithBookmark[]
      }

      return events as EventWithBookmark[]
    },
  })
}

// Fetch single event by ID
export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: eventKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) return null

      const { data, error } = await supabase
        .from('startup_events')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as StartupEvent
    },
    enabled: !!id,
  })
}

// Fetch user's bookmarked events
export function useBookmarkedEvents() {
  const { user } = useAuth()

  return useQuery({
    queryKey: eventKeys.bookmarked(user?.id ?? ''),
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('event_bookmarks')
        .select(`
          id,
          event_id,
          notify_before_days,
          event:startup_events(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data.map(item => ({
        ...item.event,
        isBookmarked: true,
        bookmarkId: item.id,
      })) as EventWithBookmark[]
    },
    enabled: !!user?.id,
  })
}

// Fetch recommended events for user
export function useRecommendedEvents(limit = 5) {
  const { user } = useAuth()

  return useQuery({
    queryKey: eventKeys.recommended(user?.id ?? ''),
    queryFn: async () => {
      if (!user?.id) {
        // Return recent events for non-authenticated users
        const { data, error } = await supabase
          .from('startup_events')
          .select('*')
          .eq('status', 'active')
          .gte('registration_end_date', new Date().toISOString().split('T')[0])
          .order('registration_end_date', { ascending: true })
          .limit(limit)

        if (error) throw error
        return data as StartupEvent[]
      }

      // Use database function for personalized recommendations
      const { data, error } = await supabase.rpc('recommend_events_for_user', {
        p_user_id: user.id,
        p_limit: limit,
      })

      if (error) {
        // Fallback to simple query if function fails
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('startup_events')
          .select('*')
          .eq('status', 'active')
          .gte('registration_end_date', new Date().toISOString().split('T')[0])
          .order('registration_end_date', { ascending: true })
          .limit(limit)

        if (fallbackError) throw fallbackError
        return fallbackData as StartupEvent[]
      }

      return data as StartupEvent[]
    },
  })
}

// Bookmark event mutation
export function useBookmarkEvent() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ eventId, notifyBeforeDays = 3 }: { eventId: string; notifyBeforeDays?: number }) => {
      if (!user?.id) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('event_bookmarks')
        .insert({
          event_id: eventId,
          user_id: user.id,
          notify_before_days: notifyBeforeDays,
        })
        .select()
        .single()

      if (error) throw error
      return data as EventBookmark
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() })
      queryClient.invalidateQueries({ queryKey: eventKeys.bookmarked(user?.id ?? '') })
    },
  })
}

// Remove bookmark mutation
export function useRemoveBookmark() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (bookmarkId: string) => {
      const { error } = await supabase
        .from('event_bookmarks')
        .delete()
        .eq('id', bookmarkId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() })
      queryClient.invalidateQueries({ queryKey: eventKeys.bookmarked(user?.id ?? '') })
    },
  })
}

// Helper to calculate days until deadline
export function calculateDaysUntilDeadline(registrationEndDate: string): number {
  const deadline = new Date(registrationEndDate)
  const now = new Date()
  const diff = deadline.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
