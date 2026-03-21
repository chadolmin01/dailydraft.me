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

export const supabase = (() => {
  if (typeof window === 'undefined') {
    return createBrowserClient<Database>(
      supabaseUrl || 'http://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder',
      clientOptions
    )
  }

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!, clientOptions)
  }

  return browserClient
})()
