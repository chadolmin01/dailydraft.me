import { NextResponse } from 'next/server'

// 운영 모니터링 — Vercel / uptime 서비스가 ping 할 때 200 + 빌드 시점 반환.
// DB 연결 검사는 일부러 안 함 — Supabase 다운이어도 헬스체크는 통과해야 (앱 자체는 살아있음).
// DB 헬스는 별도 /api/health/db 가 필요해지면 추가.

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const BUILD_TIME = new Date().toISOString()

export function GET() {
  return NextResponse.json({
    status: 'ok',
    build: BUILD_TIME,
    now: new Date().toISOString(),
  })
}
