import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export const revalidate = 3600 // ISR: 1시간 캐시

export async function GET() {
  try {
    const [
      { count: users },
      { count: projects },
      { count: coffeeChats },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('opportunities').select('*', { count: 'exact', head: true }),
      supabase.from('coffee_chats').select('*', { count: 'exact', head: true }),
    ])

    return NextResponse.json({
      users: users ?? 0,
      projects: projects ?? 0,
      coffeeChats: coffeeChats ?? 0,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    })
  } catch {
    return NextResponse.json({ users: 0, projects: 0, coffeeChats: 0 })
  }
}
