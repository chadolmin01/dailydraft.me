import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ApiResponse } from '@/src/lib/api-utils'
import { createClient } from '@supabase/supabase-js'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function getUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(list: { name: string; value: string; options?: Record<string, unknown> }[]) {
          list.forEach(({ name, value, options }) => {
            try { cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]) } catch {}
          })
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const POST = withErrorCapture(async (req: NextRequest) => {
  const user = await getUser()
  if (!user) return ApiResponse.unauthorized()

  const { endpoint, p256dh, auth } = await req.json()
  if (!endpoint || !p256dh || !auth) return ApiResponse.badRequest('Missing fields')

  await supabaseAdmin
    .from('push_subscriptions')
    .upsert({ user_id: user.id, endpoint, p256dh, auth }, { onConflict: 'user_id,endpoint' })

  return ApiResponse.ok({ success: true })
})

export const DELETE = withErrorCapture(async (req: NextRequest) => {
  const user = await getUser()
  if (!user) return ApiResponse.unauthorized()

  const { endpoint } = await req.json()
  if (!endpoint) return ApiResponse.badRequest('Missing endpoint')

  await supabaseAdmin
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint)

  return ApiResponse.ok({ success: true })
})
