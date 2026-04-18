'use client'

import { useQuery } from '@tanstack/react-query'

export interface AnalyticsResponse {
  summary: {
    total_published: number
    by_channel: Record<string, number>
    period_days: number
  }
  hour_hist: number[]
  weekday_hist: number[]
  daily: Array<{ date: string; count: number }>
  recent: Array<{
    id: string
    bundle_id: string | null
    channel_format: string
    published_at: string
    destination: string | null
    content_preview: string
  }>
}

export function usePersonaAnalytics(
  personaId: string | undefined,
  days = 30,
) {
  return useQuery({
    queryKey: ['persona-analytics', personaId, days],
    enabled: !!personaId,
    queryFn: async (): Promise<AnalyticsResponse> => {
      const res = await fetch(
        `/api/personas/${personaId}/analytics?days=${days}`,
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? '성과 데이터 조회 실패')
      }
      return res.json()
    },
  })
}
