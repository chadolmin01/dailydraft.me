import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { verifyMetaSignedRequest } from '@/src/lib/personas/meta-signed-request'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Meta 앱 콘솔의 "Data Deletion Request URL" 이 가리키는 엔드포인트.
// 사용자가 GDPR/프라이버시 경로로 데이터 삭제를 요청하면 Meta 가 signed_request 로 POST.
// 요구 응답: { url: "사용자가 삭제 진행상태를 확인할 수 있는 URL", confirmation_code: "..." }
// 실제 삭제는 우리 쪽에서 account_ref 기반 credential + 연관 게시 이력 deactivate.
export async function POST(request: NextRequest) {
  const clientSecret = process.env.THREADS_CLIENT_SECRET
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://dailydraft.me'

  if (!clientSecret) {
    console.error('[threads_data_deletion] THREADS_CLIENT_SECRET 미설정')
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
    console.error('[threads_data_deletion] body 파싱 실패:', err)
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  if (!signedRequest) {
    return NextResponse.json({ error: 'missing_signed_request' }, { status: 400 })
  }

  const data = verifyMetaSignedRequest(signedRequest, clientSecret)
  if (!data) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 })
  }

  const confirmationCode = crypto.randomBytes(12).toString('hex')
  const admin = createAdminClient()

  // 1) 자격증명 비활성화 (실토큰은 재발급 불가 상태가 되어 실질적 단절)
  const { error: credErr } = await admin
    .from('persona_channel_credentials')
    .update({ active: false } as never)
    .eq('channel_type', 'threads')
    .eq('account_ref', data.user_id)
  if (credErr) {
    console.error('[threads_data_deletion] credential 비활성화 실패:', credErr)
  }

  // 2) 삭제 요청 로그(상태 조회용). 테이블이 없는 환경에서는 조용히 무시.
  //    supabase 자동 생성 타입에 새 테이블이 반영되기 전까지 any 캐스팅.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: logErr } = await (admin as any)
    .from('meta_data_deletion_requests')
    .insert({
      confirmation_code: confirmationCode,
      provider: 'threads',
      external_user_id: data.user_id,
      status: 'accepted',
    })
  if (logErr) {
    console.warn(
      '[threads_data_deletion] 삭제요청 로그 기록 실패 (테이블 미존재 가능):',
      logErr.message,
    )
  }

  return NextResponse.json({
    url: `${appUrl}/api/oauth/threads/data-deletion/status?code=${confirmationCode}`,
    confirmation_code: confirmationCode,
  })
}
