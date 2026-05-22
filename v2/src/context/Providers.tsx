'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { AuthProvider } from './AuthContext'

export function Providers({
  children,
  initialUser,
}: {
  children: React.ReactNode
  initialUser?: User | null
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            retry: (failureCount) => failureCount < 3,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
            // 의도: 탭 포커스 복귀마다 매트릭스·폴더 stats 가 재페치되며 우측 카드들이 점멸하는 문제 차단.
            // staleTime 5분 안엔 캐시 사용으로 충분하고, 사용자가 직접 새로고침 버튼을 가지고 있음.
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider initialUser={initialUser}>{children}</AuthProvider>
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
