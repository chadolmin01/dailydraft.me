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
