'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { profileKeys } from './useProfile'

export function useProfileAnalysis() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/profile/analyze', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '분석에 실패했습니다.')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
    },
  })
}
