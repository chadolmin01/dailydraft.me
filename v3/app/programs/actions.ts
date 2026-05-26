'use server'

import { revalidatePath } from 'next/cache'
import { run, asInt } from '@/src/lib/queries'

// 의도: server actions = formData 받아서 DB 쓰고 revalidate. API 라우트 없이 단순.
//       v3 single-user 라 권한 검증 없음. 추후 multi-user 가면 여기에 user_id 분기.

export async function createProgram(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const totalWeeks = asInt(formData.get('total_weeks'))
  const startDate = String(formData.get('start_date') ?? '').trim() || null
  const endDate = String(formData.get('end_date') ?? '').trim() || null
  if (!name) throw new Error('프로그램 이름이 필요합니다')
  if (totalWeeks < 1 || totalWeeks > 52) throw new Error('주차 수는 1~52 사이')

  await run(
    'insert into programs (name, total_weeks, start_date, end_date) values (?, ?, ?, ?)',
    [name, totalWeeks, startDate, endDate],
  )
  revalidatePath('/programs')
  revalidatePath('/')
}

export async function deleteProgram(id: number) {
  await run('delete from programs where id = ?', [id])
  revalidatePath('/programs')
  revalidatePath('/')
}

export async function addMilestone(programId: number, formData: FormData) {
  const weekNo = asInt(formData.get('week_no'))
  const title = String(formData.get('title') ?? '').trim()
  const dueDate = String(formData.get('due_date') ?? '').trim() || null
  if (weekNo < 1) throw new Error('주차 번호는 1 이상')
  if (!title) throw new Error('마일스톤 제목이 필요합니다')

  await run(
    'insert into milestones (program_id, week_no, title, due_date) values (?, ?, ?, ?)',
    [programId, weekNo, title, dueDate],
  )
  revalidatePath(`/programs/${programId}`)
}

export async function deleteMilestone(id: number, programId: number) {
  await run('delete from milestones where id = ?', [id])
  revalidatePath(`/programs/${programId}`)
}
