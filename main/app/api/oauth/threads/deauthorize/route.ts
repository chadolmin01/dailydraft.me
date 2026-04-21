import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { verifyMetaSignedRequest } from '@/src/lib/personas/meta-signed-request'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Meta 앱 콘솔의 "Deauthorize Callback URL" 이 가리키는 엔드포인트.
// 사용자가 Threads 설정에서 앱 연결을 끊으면 Meta 가 signed_request 로 POST 함.
// 우리가 할 일: 해당 Threads account_ref 의 persona_channel_credentials 을 active=false 로 끈다.
// 200 을 돌려주지 않으면 Meta 는 retry 하며, 장기적으로 App Review 반려 사유가 됨.
export async function POST(request: NextRequest) {
  const clientSecret = process.env.THREADS_CLIENT_SECRET
  if (!clientSecret) {
    console.error('[threads_deauth] THREADS_CLIENT_SECRET 미설정')
    return NextResponse.json({ error: 'misconfigured' }, { status: 500 })
  }

  let signedRequest: string | null = null
  const contentType = request.headers.get('content-type') ?? ''

  try {
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const form = await request.formData()
      signedRequest = form.get('signed_request')?.toString() ?? null
    } else if (contentType.includes('application/json')) {
      const body = (await request.json()) as { signed_request?: string }
      signedRequest = body.signed_request ?? null
    } else {
      const text = await request.text()
      const params = new URLSearchParams(text)
      signedRequest = params.get('signed_request')
    }
  } catch (err) {
    console.error('[threads_deauth] body 파싱 실패:', err)
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  if (!signedRequest) {
    return NextResponse.json({ error: 'missing_signed_request' }, { status: 400 })
  }

  const data = verifyMetaSignedRequest(signedRequest, clientSecret)
  if (!data) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('persona_channel_credentials')
    .update({ active: false } as never)
    .eq('channel_type', 'threads')
    .eq('account_ref', data.user_id)

  if (error) {
    console.error('[threads_deauth] credential 비활성화 실패:', error)
    // Meta 에게는 200 을 줘야 retry 폭주가 안 생김. 내부 로깅만.
  }

  return NextResponse.json({ ok: true })
}
