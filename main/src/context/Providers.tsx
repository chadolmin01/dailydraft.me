'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { useState } from 'react'
import { AuthProvider } from './AuthContext'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnMount: true,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            retry: (failureCount, error) => {
              // AbortError(StrictMode 더블마운트)도 무조건 재시도
              return failureCount < 3
            },
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: '0',
            border: '2px solid var(--border-strong)',
            boxShadow: 'var(--shadow-solid-sm)',
            fontFamily: '"Noto Sans KR", sans-serif',
            fontSize: '0.8125rem',
          },
        }}
      />
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
