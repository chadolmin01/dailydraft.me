'use client'

import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import posthog from 'posthog-js'
import { User } from '@supabase/supabase-js'
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

export function Providers({ children, initialUser }: { children: React.ReactNode; initialUser?: User | null }) {
  // 언핸들드 프로미스 에러 + 동기 throw 전역 캡처
  useEffect(() => {
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      try {
        posthog.captureException(event.reason, { tags: { source: 'unhandledRejection' } })
      } catch {}
    }
    const errorHandler = (event: ErrorEvent) => {
      try {
        posthog.captureException(event.error ?? new Error(event.message), {
          tags: {
            source: 'windowOnError',
            filename: event.filename,
            lineno: String(event.lineno ?? ''),
            colno: String(event.colno ?? ''),
          },
        })
      } catch {}
    }
    window.addEventListener('unhandledrejection', rejectionHandler)
    window.addEventListener('error', errorHandler)
    return () => {
      window.removeEventListener('unhandledrejection', rejectionHandler)
      window.removeEventListener('error', errorHandler)
    }
  }, [])

  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            try {
              posthog.captureException(error, {
                tags: {
                  source: 'reactQueryQuery',
                  queryKey: JSON.stringify(query.queryKey).slice(0, 200),
                },
              })
            } catch {}
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: (failureCount, error) => {
              // AbortError(StrictMode 더블마운트)도 무조건 재시도
              return failureCount < 3
            },
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
            // queryKey 변경 시(필터/탭 전환) 이전 데이터를 유지하면서 백그라운드에서 새 데이터 fetch.
            // `isLoading=false, isFetching=true` 상태 활용 가능 — 전체 skeleton flash 대신 subtle
            // 인디케이터 표시 가능. React Query v5 의 keepPreviousData 와 동일 동작.
            // 사이드 이펙트:
            //   - 카테고리 탭 전환 시 이전 카테고리 목록이 잠깐 보임 (< 200ms) → 부드러운 전환
            //   - mutate 후 invalidate 시에도 이전 값 유지 — 새 값 직접 옵티미스틱 업데이트 시 문제 없음
            //   - enabled 토글로 시작되는 쿼리는 이전 데이터 없음이므로 정상 로딩
            placeholderData: (previousData: unknown) => previousData,
          },
          mutations: {
            onError: (error) => {
              posthog.captureException(error, { tags: { source: 'reactQueryMutation' } })
            },
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <PostHogProvider>
        <ThemeProvider>
          <AuthProvider initialUser={initialUser}>{children}</AuthProvider>
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
