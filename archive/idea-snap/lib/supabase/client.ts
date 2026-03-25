import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Export a singleton for client-side use
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export const supabase = (() => {
  if (typeof window === 'undefined') {
    // Return a placeholder for SSR - actual client will be created in components
    return createBrowserClient<Database>(
      supabaseUrl || 'http://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder'
    )
  }

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  }

  return browserClient
})()
