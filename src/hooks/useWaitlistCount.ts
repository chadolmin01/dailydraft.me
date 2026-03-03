import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase/client'

export const waitlistKeys = {
  all: ['waitlist'] as const,
  count: () => [...waitlistKeys.all, 'count'] as const,
}

export const useWaitlistCount = () => {
  return useQuery({
    queryKey: waitlistKeys.count(),
    queryFn: async () => {
      // 데이터베이스에 정의된 get_waitlist_count 함수 사용
      const { data, error } = await supabase
        .rpc('get_waitlist_count')

      if (error) {
        console.error('Error fetching waitlist count:', error)
        return 0
      }

      return data ?? 0
    },
    staleTime: 1000 * 60 * 5, // 5분 캐시
    refetchOnWindowFocus: false,
  })
}
