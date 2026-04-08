import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { sendRecruitNotification } from '@/src/lib/email/send-recruit-notification'

// Draft 1기 모집 지원서 제출 API
// 익명 INSERT 허용 (RLS 정책에 의해 anon role insert 가능)
// 동일 카카오 ID 중복 제출 방지는 제출 시 체크 (RLS는 조회 못 하므로 service_role 없이 best-effort)

const submitSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요').max(50),
  team_idea: z.string().min(2, '팀 아이디어를 입력해주세요').max(200),
  team_role: z.enum(['plan', 'design', 'dev', 'etc']),
  ai_experience: z.string().min(1, 'AI 활용 경험을 입력해주세요').max(1000),
  learning_goal: z.string().min(1, '8주 동안 경험하고 싶은 것을 입력해주세요').max(1000),
  motivation: z.string().min(1, '지원 동기를 입력해주세요').max(2000),
  available_slots: z.array(z.string()).min(1, '가능한 시간대를 1개 이상 선택해주세요'),
  weekly_hours: z.enum(['3-5', '5-8', '8+']),
  offline_available: z.enum(['yes', 'discuss']),
  agreed: z.literal(true),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = submitSchema.safeParse(body)

    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return ApiResponse.badRequest(first?.message || '입력값이 올바르지 않습니다')
    }

    const data = parsed.data
    const supabase = await createClient()
    const userAgent = request.headers.get('user-agent') || null

    // recruit_applications 테이블은 별도 마이그레이션으로 생성되며 generated types에 아직 미반영.
    // 타입 생성 후 이 캐스팅 제거.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('recruit_applications').insert({
      name: data.name.trim(),
      team_idea: data.team_idea.trim(),
      team_role: data.team_role,
      ai_experience: data.ai_experience.trim(),
      learning_goal: data.learning_goal.trim(),
      motivation: data.motivation.trim(),
      available_slots: data.available_slots,
      weekly_hours: data.weekly_hours,
      offline_available: data.offline_available,
      agreed_at: new Date().toISOString(),
      user_agent: userAgent,
      cohort: 'draft-1',
    })


    if (error) {
      return ApiResponse.internalError('지원서 제출에 실패했습니다', error.message)
    }

    // 운영자 알림 이메일 — best-effort, 실패해도 사용자 응답은 성공
    sendRecruitNotification({
      name: data.name,
      team_idea: data.team_idea,
      team_role: data.team_role,
      ai_experience: data.ai_experience,
      learning_goal: data.learning_goal,
      motivation: data.motivation,
      available_slots: data.available_slots,
      weekly_hours: data.weekly_hours,
      offline_available: data.offline_available,
    }).catch((err) => console.error('recruit notification error', err))

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    return ApiResponse.internalError(
      '지원서 제출 중 오류가 발생했습니다',
      error instanceof Error ? error.message : undefined
    )
  }
}
