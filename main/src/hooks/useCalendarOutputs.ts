'use client'

import { useQuery } from '@tanstack/react-query'

export type CalendarStatus = 'published' | 'scheduled' | 'draft' | 'rejected'

export interface CalendarOutputRow {
  id: string
  bundle_id: string | null
  channel_format: string
  scheduled_at: string | null
  published_at: string | null
  status: string
  is_copy_only: boolean
  destination: string | null
  generated_content: string
  created_at: string
  cal_date: string
  cal_status: CalendarStatus
  bundle: {
    event_type: string
    event_metadata: Record<string, unknown>
  } | null
}

export function useCalendarOutputs(
  personaId: string | undefined,
  range: { start: string; end: string } | null,
) {
  return useQuery({
    queryKey: ['calendar-outputs', personaId, range?.start, range?.end],
    enabled: !!personaId && !!range,
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
    queryFn: async (): Promise<{ outputs: CalendarOutputRow[] }> => {
      const qs = new URLSearchParams({
        start: range!.start,
        end: range!.end,
      }).toString()
      const res = await fetch(
        `/api/personas/${personaId}/calendar-outputs?${qs}`,
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? '캘린더 데이터 조회 실패')
      }
      return res.json()
    },
  })
}
