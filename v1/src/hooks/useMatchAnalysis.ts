'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface MatchAnalysis {
  synergy: string
  strengths: string[]
  caution: string
}

export interface MatchAnalysisResponse {
  analysis: MatchAnalysis
  cached: boolean
  created_at: string
}

const key = (targetId: string) => ['match-analysis', targetId]

/**
 * AI 매칭 심층 분석 훅
 *  - useQuery: 캐시된 결과 조회 (GET 역할, 실제로는 POST지만 cached=true면 즉시 반환)
 *  - runAnalysis: 명시적 버튼 클릭 시 LLM 호출 (mutation)
 *
 * 서버에 7일 TTL 캐시가 있으므로 mount 시 한 번 POST 호출로 cache hit 확인만 하는 게
 * 이상적이지만, 비용 방지를 위해 명시적 트리거 방식을 택함.
 * 대신 sessionStorage에 "이 세션에서 이미 조회한 targetId" 플래그를 두어
 * 모달 재오픈 시 자동 prefetch가 가능하도록 한다.
 */
export function useMatchAnalysis(targetId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery<MatchAnalysisResponse | null>({
    queryKey: key(targetId || ''),
    queryFn: () => null,
    enabled: false, // 수동 트리거 only
    staleTime: Infinity,
  })

  const mutation = useMutation<MatchAnalysisResponse, Error, void>({
    mutationFn: async () => {
      if (!targetId) throw new Error('targetId required')
      const res = await fetch(`/api/users/${targetId}/ai-analysis`, {
        method: 'POST',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || 'AI 분석에 실패했습니다')
      }
      const json = await res.json()
      return json as MatchAnalysisResponse
    },
    onSuccess: (data) => {
      if (targetId) queryClient.setQueryData(key(targetId), data)
    },
  })

  return {
    data: query.data ?? null,
    isLoading: mutation.isPending,
    error: mutation.error,
    runAnalysis: () => mutation.mutate(),
    reset: () => mutation.reset(),
  }
}
