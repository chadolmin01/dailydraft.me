import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Meta 응답의 `url` 로 사용자가 직접 방문했을 때 보여줄 상태 페이지(JSON).
// Meta 정책: 삭제 요청 상태를 사용자가 확인할 수 있는 공개 URL 이 필수.
export async function GET(request: NextRequest) {
  const code = new URL(request.url).searchParams.get('code')
  if (!code) {
    return NextResponse.json({ error: 'missing_code' }, { status: 400 })
  }

  const admin = createAdminClient()
  // supabase 자동 생성 타입에 새 테이블이 반영되기 전까지 any 캐스팅.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('meta_data_deletion_requests')
    .select('status, created_at, provider')
    .eq('confirmation_code', code)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({
      confirmation_code: code,
      status: 'accepted',
      note: '요청이 접수되었으며 영업일 30일 이내 처리됩니다.',
    })
  }

  return NextResponse.json({
    confirmation_code: code,
    provider: data.provider,
    status: data.status,
    submitted_at: data.created_at,
  })
}
