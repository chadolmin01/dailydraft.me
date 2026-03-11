import { createBrowserClient } from '@supabase/ssr'

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
    lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<unknown>) => await fn(),
  },
}

export function createClient() {
  return createBrowserClient(supabaseUrl!, supabaseAnonKey!, clientOptions)
}

// Export a singleton for client-side use
let browserClient: ReturnType<typeof createBrowserClient> | null = null

export const supabase = (() => {
  if (typeof window === 'undefined') {
    return createBrowserClient(
      supabaseUrl || 'http://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder',
      clientOptions
    )
  }

  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl!, supabaseAnonKey!, clientOptions)
  }

  return browserClient
})()
