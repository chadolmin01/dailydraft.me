'use server'

import { revalidatePath } from 'next/cache'
import { run, one, asInt } from '@/src/lib/queries'
import { parseFields, extractSubmission } from '@/src/lib/forms'

interface LinkWithForm {
  link_id: number
  milestone_id: number
  team_id: number
  submitted_at: string | null
  fields_json: string
}

// 멤버 제출 — 토큰 검증 + 폼 필드 검증 + submissions insert + 토큰 submitted_at 마킹.
export async function submitMemberForm(token: string, formData: FormData): Promise<void> {
  const link = await one<LinkWithForm>(`
    select sl.id as link_id, sl.milestone_id, sl.team_id, sl.submitted_at, f.fields_json
    from submission_links sl
    join milestones m on m.id = sl.milestone_id
    join forms f on f.id = m.form_id
    where sl.token = ?
  `, [token])

  if (!link) throw new Error('유효하지 않은 링크입니다')
  if (link.submitted_at) throw new Error('이미 제출 완료된 링크입니다 (재제출 불가)')

  const fields = parseFields(link.fields_json)
  const memberName = String(formData.get('__member_name') ?? '').trim() || null
  const data = extractSubmission(fields, formData)

  await run(
    `insert into submissions (milestone_id, team_id, submission_link_id, member_name, data_json)
     values (?, ?, ?, ?, ?)`,
    [
      asInt(link.milestone_id),
      asInt(link.team_id),
      asInt(link.link_id),
      memberName,
      JSON.stringify(data),
    ],
  )
  await run(
    'update submission_links set submitted_at = current_timestamp where id = ?',
    [asInt(link.link_id)],
  )

  revalidatePath(`/m/${token}`)
  revalidatePath('/collection')
  revalidatePath('/dashboard')
}
