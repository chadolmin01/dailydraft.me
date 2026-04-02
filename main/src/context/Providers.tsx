'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { useState } from 'react'
import { AuthProvider } from './AuthContext'
import { ThemeProvider } from './ThemeContext'
import { SplashScreen } from '@/components/SplashScreen'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
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
      <ThemeProvider>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
      <SplashScreen />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: '16px',
            border: 'none',
            background: 'var(--surface-inverse)',
            color: 'var(--text-inverse)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            fontFamily: '"Noto Sans KR", sans-serif',
            fontSize: '0.8125rem',
            fontWeight: 500,
            padding: '12px 16px',
          },
          classNames: {
            success: 'toast-success',
            error: 'toast-error',
          },
        }}
      />
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
