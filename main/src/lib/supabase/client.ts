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
// NOTE: navigator.locks MUST be enabled (default) to prevent auth race conditions.
// Without it, concurrent getSession()/getUser() calls corrupt internal auth state,
// causing data queries to fire with malformed auth headers → empty responses.
// AbortError from StrictMode double-mount is handled by withRetry + React Query retry.
const clientOptions = {
  auth: {
    flowType: 'pkce' as const,
    persistSession: true,
    detectSessionInUrl: true,
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
