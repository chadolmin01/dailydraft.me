import { notFound } from 'next/navigation'
import { one, asInt } from '@/src/lib/queries'
import { parseFields, type FormField } from '@/src/lib/forms'
import { submitMemberForm } from './actions'

interface LinkRow {
  link_id: number
  milestone_id: number
  team_id: number
  team_name: string
  program_name: string
  week_no: number
  milestone_title: string
  due_date: string | null
  form_name: string
  fields_json: string
  submitted_at: string | null
}

// 멤버 폼 페이지. 인증 X — token 으로만 식별.
// 의도: 같은 token 두 번 사용 차단 (submitted_at 이미 있으면 read-only 표시).
export default async function MemberSubmitPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const link = await one<LinkRow>(`
    select sl.id as link_id, sl.milestone_id, sl.team_id, t.name as team_name,
           p.name as program_name, m.week_no, m.title as milestone_title, m.due_date,
           f.name as form_name, f.fields_json, sl.submitted_at
    from submission_links sl
    join teams t on t.id = sl.team_id
    join milestones m on m.id = sl.milestone_id
    join programs p on p.id = m.program_id
    left join forms f on f.id = m.form_id
    where sl.token = ?
  `, [token])

  if (!link || !link.form_name) notFound()

  const fields = parseFields(link.fields_json)
  const submitted = !!link.submitted_at
  const action = async (formData: FormData) => {
    'use server'
    await submitMemberForm(token, formData)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-6">
        <p className="text-xs text-muted">{link.program_name} · {asInt(link.week_no)}주차</p>
        <h1 className="text-2xl font-bold mt-1">{link.milestone_title}</h1>
        <p className="text-sm text-muted mt-1">팀: {link.team_name} · 마감 {link.due_date ?? '미정'}</p>
      </header>

      {submitted ? (
        <div className="card p-6 bg-green-50 border-green-200">
          <p className="font-semibold text-green-900">제출 완료</p>
          <p className="text-sm text-green-800 mt-1">{link.submitted_at} 에 제출되었습니다.</p>
          <p className="text-xs text-green-700 mt-3">수정이 필요하면 운영진에게 새 링크를 요청하세요.</p>
        </div>
      ) : (
        <form action={action} className="card p-6 space-y-5">
          <div>
            <label className="label">제출자 이름 (선택)</label>
            <input name="__member_name" className="input" placeholder="홍길동" />
          </div>

          <hr className="border-hairline" />

          {fields.map((f) => (
            <FieldInput key={f.key} field={f} />
          ))}

          <div className="pt-2 flex justify-end">
            <button type="submit" className="btn-primary">제출</button>
          </div>
          <p className="text-xs text-muted-soft text-center">제출 후에는 수정할 수 없습니다.</p>
        </form>
      )}
    </div>
  )
}

function FieldInput({ field }: { field: FormField }) {
  const common = `input ${field.type === 'textarea' ? 'min-h-[100px]' : ''}`
  return (
    <div>
      <label className="label">
        {field.label}
        {field.required && <span className="text-red-600 ml-1">*</span>}
      </label>
      {field.type === 'textarea' ? (
        <textarea name={field.key} className={common} placeholder={field.placeholder} required={field.required} />
      ) : field.type === 'select' ? (
        <select name={field.key} className="input" required={field.required} defaultValue="">
          <option value="" disabled>선택하세요</option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input
          name={field.key}
          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
          className="input"
          placeholder={field.placeholder}
          required={field.required}
        />
      )}
    </div>
  )
}
