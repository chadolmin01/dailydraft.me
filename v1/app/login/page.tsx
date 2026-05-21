import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import LoginClient, { type LoginShowcaseProject, type LoginShowcasePeople } from '@/components/login/LoginClient'

// 유저별 로그인 상태 체크가 있어 ISR 불가
export const dynamic = 'force-dynamic'

// /login?redirect= 파라미터 sanitize — 서버에서도 1차 검증 (client에서 2차).
function sanitizeRedirect(raw: string | undefined): string {
  if (!raw) return '/dashboard'
  if (!raw.startsWith('/')) return '/dashboard'
  if (raw.startsWith('//') || raw.startsWith('/\\')) return '/dashboard'
  if (/^\/(login|signup|oauth|api\/)/i.test(raw)) return '/dashboard'
  return raw
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const { redirect: rawRedirect } = await searchParams
  const redirectTo = sanitizeRedirect(rawRedirect)

  const supabase = await createServerSupabaseClient()

  // 이미 로그인 — 클라이언트 hydrate 거치지 않고 즉시 리다이렉트.
  // FOUC 없음. L3(리다이렉트가 애니메이션 끝난 뒤) 근본 해결.
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect(redirectTo)

  // 마퀴용 실데이터 prefetch — Featured 프로젝트/프로필 3~5개씩.
  // 왜 parallel: 두 쿼리 독립적이고 로그인 페이지 TTFB에 직접 영향.
  // 실패해도 render는 빈 마퀴로라도 보여야 하므로 throw 금지.
  const [projectsResult, profilesResult] = await Promise.all([
    supabase
      .from('opportunities')
      .select('title, description, needed_roles, interest_tags')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('profiles')
      .select('nickname, desired_position, university, interest_tags')
      .eq('profile_visibility', 'public')
      .not('nickname', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(5),
  ])

  const projects: LoginShowcaseProject[] = (projectsResult.data ?? []).map(p => ({
    title: p.title ?? '',
    desc: p.description ?? '',
    roles: (p.needed_roles as string[] | null)?.slice(0, 2) ?? [],
    tags: (p.interest_tags as string[] | null)?.slice(0, 3) ?? [],
  }))

  const people: LoginShowcasePeople[] = (profilesResult.data ?? []).map(p => ({
    name: p.nickname ?? '익명',
    initial: (p.nickname ?? 'U').charAt(0).toUpperCase(),
    role: p.desired_position ?? 'Explorer',
    univ: p.university ?? '',
    tags: (p.interest_tags as string[] | null)?.slice(0, 3) ?? [],
    status: 'OPEN' as const,
  }))

  // 실데이터 부족 시 최소 보장용 더미 — 마퀴가 빈 상태로 뜨는 걸 방지
  const FALLBACK_PROJECTS: LoginShowcaseProject[] = [
    { title: '함께 만들기', desc: '함께 만들어갈 팀원을 찾고 있습니다', roles: ['프론트엔드'], tags: ['React'] },
    { title: 'AI 프로젝트', desc: 'AI 기반 서비스를 함께 만듭니다', roles: ['백엔드'], tags: ['Python'] },
  ]
  const FALLBACK_PEOPLE: LoginShowcasePeople[] = [
    { name: '프론트엔드 개발자', initial: 'F', role: '프론트엔드', univ: '대학생', tags: ['React'], status: 'OPEN' },
    { name: '디자이너', initial: 'D', role: 'UI/UX', univ: '대학생', tags: ['Figma'], status: 'OPEN' },
  ]

  return (
    <LoginClient
      projects={projects.length > 0 ? projects : FALLBACK_PROJECTS}
      people={people.length > 0 ? people : FALLBACK_PEOPLE}
    />
  )
}
