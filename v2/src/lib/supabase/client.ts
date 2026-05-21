import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/src/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error(
    'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set'
  )
}

// Shared config
// 개발: lock no-op — React Strict Mode 더블마운트의 AbortError 방지
// 프로덕션: 타임아웃 있는 navigator.locks 래퍼
//   - 기본 supabase lock은 타임아웃 없이 무한 대기 → 다른 탭이 락을 잡고 안 놓으면
//     모든 쿼리가 hang (스켈레톤 영구 고착 버그)
//   - 3초 안에 락 못 잡으면 lock 없이 진행 (refresh token race는 드물고,
//     데드락보다는 낫다)
async function timeoutLock<R>(name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> {
  if (typeof navigator === 'undefined' || !navigator.locks) {
    return await fn()
  }
  // navigator.locks.request with AbortSignal — 3초 후 abort
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 3000)
  try {
    return await navigator.locks.request(name, { mode: 'exclusive', signal: controller.signal }, async () => {
      clearTimeout(timer)
      return await fn()
    })
  } catch (err) {
    // AbortError = 락 획득 실패 → 락 없이 진행 (데드락 회피)
    if (err instanceof DOMException && err.name === 'AbortError') {
      return await fn()
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

const clientOptions = {
  auth: {
    flowType: 'pkce' as const,
    persistSession: true,
    detectSessionInUrl: true,
    lock: process.env.NODE_ENV === 'development'
      ? async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => await fn()
      : timeoutLock,
  },
}

export function createClient() {
  return createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!, clientOptions)
}

// Export a singleton for client-side use
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export const supabase: ReturnType<typeof createBrowserClient<Database>> = (() => {
  if (typeof window === 'undefined') {
    // SSR/prerender: return a proxy that defers the error to actual method access
    // (throwing at module-load time breaks Next.js static generation for 'use client' pages)
    return new Proxy({} as any, {
      get(_, prop) {
        if (prop === 'then') return undefined // prevent thenable detection
        throw new Error(
          'supabase client.ts는 클라이언트(브라우저)에서만 사용 가능합니다. 서버에서는 src/lib/supabase/server.ts를 사용하세요.'
        )
      },
    })
  }

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!, clientOptions)
  }

  return browserClient
})()
