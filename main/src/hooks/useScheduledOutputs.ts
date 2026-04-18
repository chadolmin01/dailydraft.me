'use client'

import { useQuery } from '@tanstack/react-query'

export interface ScheduledOutputRow {
  id: string
  bundle_id: string | null
  channel_format: string
  scheduled_at: string
  status: string
  is_copy_only: boolean
  destination: string | null
  generated_content: string
  created_at: string
  bundle: {
    event_type: string
    event_metadata: Record<string, unknown>
  } | null
}

export function useScheduledOutputs(personaId: string | undefined) {
  return useQuery({
    queryKey: ['scheduled-outputs', personaId],
    enabled: !!personaId,
    queryFn: async (): Promise<{ outputs: ScheduledOutputRow[] }> => {
      const res = await fetch(`/api/personas/${personaId}/scheduled-outputs`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? '예약 목록 조회 실패')
      }
      return res.json()
    },
  })
}
