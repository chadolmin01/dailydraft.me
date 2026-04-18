'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type {
  PersonaOutputBundleRow,
  PersonaOutputRow,
} from '@/src/lib/personas/types'

export interface BundleDetailResponse {
  bundle: PersonaOutputBundleRow
  outputs: PersonaOutputRow[]
}

export function useBundleDetail(bundleId: string | undefined) {
  return useQuery({
    queryKey: ['bundle', bundleId],
    enabled: !!bundleId,
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
    queryFn: async (): Promise<BundleDetailResponse> => {
      const res = await fetch(`/api/bundles/${bundleId}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(
          body?.error?.message ?? `번들을 불러오지 못했습니다 (${res.status})`,
        )
      }
      return res.json()
    },
  })
}

export function useApproveBundle(bundleId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      if (!bundleId) throw new Error('번들 ID가 없습니다')
      const res = await fetch(`/api/bundles/${bundleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? '승인 실패')
      }
      return (await res.json()).bundle as PersonaOutputBundleRow
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bundle', bundleId] })
      toast.success('번들이 승인되었습니다. 자동 발행 가능 채널은 발행됐습니다.')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

/**
 * 채널별 개별 예약 발행 시간 설정.
 * scheduled_at=null 로 보내면 예약 해제.
 */
export function useScheduleOutput(bundleId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      output_id: string
      scheduled_at: string | null
    }) => {
      const res = await fetch(
        `/api/persona-outputs/${input.output_id}/schedule`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduled_at: input.scheduled_at }),
        },
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? '예약 저장 실패')
      }
      return (await res.json()) as { scheduled_at: string | null }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['bundle', bundleId] })
      if (data.scheduled_at) {
        toast.success('발행 예약이 설정되었습니다')
      } else {
        toast.success('예약이 해제되었습니다')
      }
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

/**
 * 승인하되 즉시 발행하지 않고 예약만 거는 뮤테이션.
 * approve와 달리 Discord·LinkedIn API를 지금 호출하지 않음 — 크론이 도달 시간에 발행.
 */
export function useApproveAndScheduleBundle(bundleId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { scheduled_at: string }) => {
      if (!bundleId) throw new Error('번들 ID가 없습니다')
      const res = await fetch(`/api/bundles/${bundleId}/approve-and-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduled_at: input.scheduled_at }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? '예약 승인 실패')
      }
      return (await res.json()) as {
        bundle_id: string
        scheduled_at: string
        scheduled_count: number
      }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['bundle', bundleId] })
      qc.invalidateQueries({ queryKey: ['persona-bundles'] })
      qc.invalidateQueries({ queryKey: ['scheduled-outputs'] })
      toast.success(`${data.scheduled_count}개 채널이 예약되었습니다`)
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useArchiveBundle(bundleId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      if (!bundleId) throw new Error('번들 ID가 없습니다')
      const res = await fetch(`/api/bundles/${bundleId}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? '덱 삭제 실패')
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bundle', bundleId] })
      qc.invalidateQueries({ queryKey: ['persona-bundles'] })
      toast.success('덱이 삭제되었습니다')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useRejectBundle(bundleId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (reason: string) => {
      if (!bundleId) throw new Error('번들 ID가 없습니다')
      const res = await fetch(`/api/bundles/${bundleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? '거절 실패')
      }
      return (await res.json()).bundle as PersonaOutputBundleRow
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bundle', bundleId] })
      toast.success('거절 처리되었습니다. 사유는 페르소나 학습에 반영됩니다.')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
