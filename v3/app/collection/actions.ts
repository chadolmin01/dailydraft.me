'use server'

import { revalidatePath } from 'next/cache'
import { run, all, one, asInt, genToken } from '@/src/lib/queries'
import type { FormField } from '@/src/lib/forms'

interface Team { id: number }

// 폼 생성 + 마일스톤 연결 + 팀별 token 링크 자동 생성.
// 의도: 매니저가 "주차 X 의 폼 만들기" 한 번 누르면 그 프로그램의 모든 팀에 링크 자동.
//       각 팀이 token 으로 접근 → 제출 → submitted_at 기록.
export async function createFormAndLinks(
  programId: number,
  milestoneId: number,
  formData: FormData,
): Promise<void> {
  const name = String(formData.get('name') ?? '').trim()
  const fieldsRaw = String(formData.get('fields_json') ?? '[]')
  if (!name) throw new Error('폼 이름이 필요합니다')

  // 필드 검증: 최소 1개, 각 필드 key/label/type 유효성.
  let fields: FormField[]
  try {
    fields = JSON.parse(fieldsRaw)
  } catch {
    throw new Error('폼 필드 JSON 이 잘못됨')
  }
  if (!Array.isArray(fields) || fields.length === 0) {
    throw new Error('필드를 최소 1개 추가하세요')
  }

  // 1) form 생성
  const formResult = await run(
    'insert into forms (program_id, name, fields_json) values (?, ?, ?)',
    [programId, name, JSON.stringify(fields)],
  )
  const formId = formResult.lastInsertRowid ? Number(formResult.lastInsertRowid) : 0

  // 2) 마일스톤에 form_id 연결
  await run('update milestones set form_id = ? where id = ?', [formId, milestoneId])

  // 3) 이 프로그램의 모든 팀에 token 링크 자동 생성 (이미 있으면 skip)
  const teams = await all<Team>('select id from teams where program_id = ?', [programId])
  for (const t of teams) {
    const teamId = asInt(t.id)
    const existing = await one(
      'select id from submission_links where milestone_id = ? and team_id = ?',
      [milestoneId, teamId],
    )
    if (existing) continue
    await run(
      'insert into submission_links (milestone_id, team_id, token) values (?, ?, ?)',
      [milestoneId, teamId, genToken()],
    )
  }

  revalidatePath('/collection')
  revalidatePath('/dashboard')
  revalidatePath('/')
}

// "발송" — 실제 SMS/이메일 안 보냄. sent_at 만 stamp (시뮬레이션).
// 의도: Phase 1 데모용. 실제 통합은 Twilio/카카오 알림톡 추후.
export async function markLinksSent(milestoneId: number) {
  await run(
    `update submission_links set sent_at = current_timestamp
     where milestone_id = ? and sent_at is null`,
    [milestoneId],
  )
  revalidatePath('/collection')
}
