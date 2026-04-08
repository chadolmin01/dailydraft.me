'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AuthProvider } from './AuthContext'
import { ThemeProvider } from './ThemeContext'
import { SplashScreen } from '@/components/SplashScreen'
import { PostHogProvider } from './PostHogProvider'

/**
 * Renders Sonner Toaster inside a dedicated portal container appended to <body>.
 * The container has the highest possible z-index and is created OUTSIDE the React
 * tree, so no ancestor (Framer Motion's transform, backdrop-filter, etc) can
 * trap it in a lower stacking context.
 */
function PortaledToaster() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = document.createElement('div')
    el.id = 'sonner-toast-root'
    el.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:0;z-index:2147483647;pointer-events:none;'
    // 마지막 body 자식으로 append → DOM 순서로도 최상단 보장
    document.body.appendChild(el)
    setContainer(el)
    return () => {
      if (el.parentNode) el.parentNode.removeChild(el)
    }
  }, [])

  if (!container) return null

  return createPortal(
    <Toaster
      position="top-center"
      style={{ zIndex: 2147483647, pointerEvents: 'auto' }}
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
    />,
    container
  )
}

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
      <PostHogProvider>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
        <SplashScreen />
        <PortaledToaster />
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </PostHogProvider>
    </QueryClientProvider>
  )
}
