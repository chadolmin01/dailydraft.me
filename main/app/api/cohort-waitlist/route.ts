import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'

// Draft 다음 기수 웨이팅리스트 — 랜딩 방문자가 이메일만 등록
// 익명 INSERT 허용 (RLS), 동일 이메일은 DB UNIQUE 제약으로 1회만

const schema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요').max(200),
  source: z.string().max(50).optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return ApiResponse.badRequest(parsed.error.issues[0]?.message || '입력값이 올바르지 않습니다')
    }

    const supabase = await createClient()
    const userAgent = request.headers.get('user-agent') || null

    // recruit_applications와 마찬가지로 generated types에 미반영 → any 캐스팅
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('cohort_waitlist').insert({
      email: parsed.data.email.trim().toLowerCase(),
      source: parsed.data.source || 'landing',
      cohort_target: 'next',
      user_agent: userAgent,
    })

    if (error) {
      // UNIQUE 제약 위반 시 이미 등록된 거니까 성공으로 처리 (사용자 입장에선 동일)
      if (error.message?.includes('duplicate') || error.code === '23505') {
        return NextResponse.json({ ok: true, alreadyRegistered: true }, { status: 200 })
      }
      return ApiResponse.internalError('등록에 실패했습니다', error.message)
    }

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    return ApiResponse.internalError(
      '등록 중 오류가 발생했습니다',
      error instanceof Error ? error.message : undefined
    )
  }
}
