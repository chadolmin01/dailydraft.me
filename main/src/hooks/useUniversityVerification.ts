'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/src/context/AuthContext'

export function useUniversityVerification() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['university-verification', user?.id],
    queryFn: async () => {
      const res = await fetch('/api/profile/verify-university')
      if (!res.ok) throw new Error('verification failed')
      return res.json() as Promise<{ is_verified: boolean; university: string | null }>
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    retry: false,
  })
}
