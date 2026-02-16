import { createClient } from '@/src/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Simple connectivity check without exposing schema details
    const { error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .limit(1)

    return NextResponse.json({
      status: error ? 'degraded' : 'ok',
      timestamp: new Date().toISOString()
    })
  } catch {
    return NextResponse.json({
      status: 'error'
    }, { status: 500 })
  }
}
