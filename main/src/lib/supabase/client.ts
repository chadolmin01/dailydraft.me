import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/src/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error(
    'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set'
  )
}

// Shared config: disable navigator.locks to prevent AbortError in React Strict Mode
const clientOptions = {
  auth: {
    flowType: 'pkce' as const,
    persistSession: true,
    detectSessionInUrl: true,
    lock: async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => await fn(),
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
