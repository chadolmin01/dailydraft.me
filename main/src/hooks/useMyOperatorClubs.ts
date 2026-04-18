'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/src/context/AuthContext'

/**
 * 내가 owner/admin으로 속한 클럽만 반환.
 *
 * 용도: "이 유저가 운영자인가?" 를 앱 전역에서 판단.
 * Sidebar "운영" 섹션, Dashboard operator 위젯, Explore nudge 분기 등에서 사용.
 *
 * 왜 별도 훅: /api/users/my-clubs 가 모든 멤버십을 반환하는데, 대부분의 UI는
 * "운영 중인 것" vs "참여 중인 것" 을 구분해야 함. 매번 클라이언트에서 필터하면
 * 누락/불일치 위험. 훅으로 묶어 한 번만 정의.
 */
export interface OperatorClub {
  slug: string
  name: string
  description: string | null
  logo_url: string | null
  category: string | null
  role: 'owner' | 'admin'
  display_role: string | null
  cohort: string | null
  member_count: number
}

interface MyClubResponse {
  slug: string
  name: string
  description: string | null
  logo_url: string | null
  category: string | null
  role: string
  display_role: string | null
  cohort: string | null
  member_count: number
}

export function useMyOperatorClubs() {
  const { user, isLoading: isAuthLoading } = useAuth()

  const query = useQuery<OperatorClub[]>({
    queryKey: ['my-operator-clubs', user?.id],
    queryFn: async () => {
      const res = await fetch('/api/users/my-clubs')
      if (!res.ok) return []
      const all = (await res.json()) as MyClubResponse[]
      // owner/admin만 필터 — member/alumni 제외
      return all.filter((c): c is OperatorClub =>
        c.role === 'owner' || c.role === 'admin'
      )
    },
    enabled: !isAuthLoading && !!user,
    staleTime: 1000 * 60 * 2,
  })

  return {
    ...query,
    clubs: query.data ?? [],
    isOperator: (query.data?.length ?? 0) > 0,
  }
}
