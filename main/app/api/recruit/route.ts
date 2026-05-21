import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { sendRecruitNotification } from '@/src/lib/email/send-recruit-notification'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

// FLIP 1기 AI 빌더 스터디 사전 신청 API
// 익명 INSERT 허용 (RLS 정책에 의해 anon role insert 가능)

const submitSchema = z
  .object({
    // 섹션 1
    name: z.string().trim().min(1, '이름을 입력해주세요').max(50),
    team_name: z.string().trim().min(1, '소속 팀을 입력해주세요').max(100),
    team_role: z.enum(['leader', 'member']),

    // 섹션 2
    ai_content_freq: z.enum(['rarely', 'monthly', 'weekly', 'daily']),
    ai_recent_use: z.string().trim().min(1, 'AI를 가장 많이 쓴 용도를 적어주세요').max(300),
    ai_build_attitude: z.enum([
      'no_interest',
      'interested_far',
      'want_start',
      'trying',
      'actively',
    ]),
    willingness: z.number().int().min(1).max(5),

    // 섹션 3
    experience: z.array(z.string()).min(1, '경험 항목을 1개 이상 선택해주세요'),
    self_skill: z.number().int().min(1).max(5),
    recent_build: z.string().trim().max(500).optional().default(''),

    // 섹션 4
    paid_tools: z.array(z.string()).min(1, '결제 도구 항목을 1개 이상 선택해주세요'),
    paid_tools_other: z.string().trim().max(200).optional().default(''),
    monthly_spend: z.enum(['0', 'lt1', '1_3', '3_6', '6_10', '10plus']),
    claude_status: z.enum([
      'paid_want_subsidy',
      'paid_ok',
      'unpaid_self',
      'unpaid_want_subsidy',
      'unsure',
    ]),

    // 섹션 5
    team_asset_status: z.enum(['none', 'idea', 'wip', 'has_url', 'almost_done']),
    desired_outcome: z.enum([
      'landing',
      'mvp_feature',
      'preorder_data',
      'experience',
      'founder_proof',
      'other',
    ]),
    desired_outcome_other: z.string().trim().max(200).optional().default(''),
    ai_feature_idea: z.string().trim().max(500).optional().default(''),

    // 섹션 6
    attendance: z.enum(['all_6', '5', 'lt_4', 'unsure']),
    available_slots: z.array(z.string()).min(1, '가능한 시간대를 1개 이상 선택해주세요'),
    has_laptop: z.boolean(),
    notes: z.string().trim().max(1000).optional().default(''),

    // 동의
    agreed: z.literal(true),
  })
  // "기타" 선택 시 직접 입력값이 비어 있으면 에러 — 의도: UI에서 라벨만 누르고 입력란을 비우는 사고 방지
  .refine(
    (d) => !d.paid_tools.includes('other') || (d.paid_tools_other ?? '').trim().length > 0,
    { message: '결제 도구 "기타"를 선택하면 도구 이름을 적어주세요', path: ['paid_tools_other'] }
  )
  .refine(
    (d) => d.desired_outcome !== 'other' || (d.desired_outcome_other ?? '').trim().length > 0,
    { message: '"기타"를 선택하면 내용을 적어주세요', path: ['desired_outcome_other'] }
  )

export const POST = withErrorCapture(async (request) => {
  const body = await request.json()
  const parsed = submitSchema.safeParse(body)

  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return ApiResponse.badRequest(first?.message || '입력값이 올바르지 않습니다')
  }

  const data = parsed.data
  const supabase = await createClient()
  const userAgent = request.headers.get('user-agent') || null

  // flip_1_applications 테이블은 별도 마이그레이션으로 생성되며 generated types에 아직 미반영.
  // 타입 재생성 후 이 캐스팅 제거.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('flip_1_applications').insert({
    name: data.name,
    team_name: data.team_name,
    team_role: data.team_role,
    ai_content_freq: data.ai_content_freq,
    ai_recent_use: data.ai_recent_use,
    ai_build_attitude: data.ai_build_attitude,
    willingness: data.willingness,
    experience: data.experience,
    self_skill: data.self_skill,
    recent_build: data.recent_build || null,
    paid_tools: data.paid_tools,
    paid_tools_other: data.paid_tools_other || null,
    monthly_spend: data.monthly_spend,
    claude_status: data.claude_status,
    team_asset_status: data.team_asset_status,
    desired_outcome: data.desired_outcome,
    desired_outcome_other: data.desired_outcome_other || null,
    ai_feature_idea: data.ai_feature_idea || null,
    attendance: data.attendance,
    available_slots: data.available_slots,
    has_laptop: data.has_laptop,
    notes: data.notes || null,
    agreed_at: new Date().toISOString(),
    user_agent: userAgent,
    cohort: 'flip-1-ai-builder',
  })

  if (error) {
    return ApiResponse.internalError('지원서 제출에 실패했습니다', error.message)
  }

  // 운영자 알림 이메일 — best-effort, 실패해도 사용자 응답은 성공
  sendRecruitNotification(data).catch((err) =>
    console.error('recruit notification error', err)
  )

  return NextResponse.json({ ok: true }, { status: 201 })
})
