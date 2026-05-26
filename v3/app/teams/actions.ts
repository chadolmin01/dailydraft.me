'use server'

import { revalidatePath } from 'next/cache'
import { run, asInt } from '@/src/lib/queries'

export async function createTeam(formData: FormData) {
  const programId = asInt(formData.get('program_id'))
  const name = String(formData.get('name') ?? '').trim()
  if (!programId) throw new Error('프로그램을 선택하세요')
  if (!name) throw new Error('팀 이름이 필요합니다')
  await run('insert into teams (program_id, name) values (?, ?)', [programId, name])
  revalidatePath('/teams')
  revalidatePath('/')
}

export async function deleteTeam(id: number) {
  await run('delete from teams where id = ?', [id])
  revalidatePath('/teams')
  revalidatePath('/')
}

export async function addMember(teamId: number, formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim() || null
  const phone = String(formData.get('phone') ?? '').trim() || null
  const role = String(formData.get('role') ?? '').trim() || null
  if (!name) throw new Error('멤버 이름이 필요합니다')
  await run(
    'insert into team_members (team_id, name, email, phone, role) values (?, ?, ?, ?, ?)',
    [teamId, name, email, phone, role],
  )
  revalidatePath('/teams')
}

export async function deleteMember(id: number) {
  await run('delete from team_members where id = ?', [id])
  revalidatePath('/teams')
}
