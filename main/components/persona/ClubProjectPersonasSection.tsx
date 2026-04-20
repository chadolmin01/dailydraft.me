'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Rocket, ArrowRight, Plus } from 'lucide-react'
import { supabase } from '@/src/lib/supabase/client'

interface Props {
  clubId: string
  clubSlug: string
}

interface ProjectWithPersona {
  project_id: string
  project_title: string
  persona_id: string | null
  persona_status: 'draft' | 'active' | 'archived' | null
  last_edited_at: string | null
}

/**
 * 클럽 페르소나 페이지 하단에 표시되는 "이 클럽의 프로젝트 페르소나" 섹션.
 *
 * 3계층 가시성 확보:
 *   - 클럽 페르소나 페이지 방문자 (주로 클럽 ops) 가
 *     하위 프로젝트 페르소나까지 한눈에 확인·열람 가능.
 *   - 각 프로젝트마다 페르소나 생성/수정 상태 배지 + 이동 링크.
 *
 * 권한:
 *   - 클럽 ops: 모든 프로젝트 페르소나 상태 열람 (수정은 프로젝트 리드 전용)
 *   - 일반 멤버: 활성 상태만 보임 (RLS can_view_persona)
 */
export function ClubProjectPersonasSection({ clubId }: Props) {
  const { data, isLoading } = useQuery<ProjectWithPersona[]>({
    queryKey: ['club-project-personas', clubId],
    queryFn: async () => {
      // 1) 이 클럽의 프로젝트 목록
      const { data: projects } = await supabase
        .from('opportunities')
        .select('id, title')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (!projects?.length) return []

      // 2) 해당 프로젝트들의 페르소나 (type=project, owner_id in projectIds)
      const projectIds = projects.map(p => p.id)
      const { data: personas } = await supabase
        .from('personas')
        .select('id, owner_id, status, updated_at, owner_last_edited_at')
        .eq('type', 'project')
        .in('owner_id', projectIds)

      const personaByProject = new Map(
        (personas ?? []).map(p => [p.owner_id, p]),
      )

      return projects.map(p => {
        const persona = personaByProject.get(p.id)
        return {
          project_id: p.id,
          project_title: p.title,
          persona_id: persona?.id ?? null,
          persona_status: (persona?.status as 'draft' | 'active' | 'archived' | undefined) ?? null,
          last_edited_at: persona?.owner_last_edited_at ?? persona?.updated_at ?? null,
        }
      })
    },
    staleTime: 1000 * 60,
  })

  if (isLoading) {
    return (
      <section className="bg-surface-card border border-border rounded-2xl p-5 md:p-6">
        <div className="h-4 w-32 rounded bg-surface-sunken animate-pulse mb-4" />
        <div className="space-y-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-12 rounded-xl bg-surface-sunken animate-pulse" />
          ))}
        </div>
      </section>
    )
  }

  if (!data?.length) {
    return null
  }

  const withPersona = data.filter(p => p.persona_id)
  const withoutPersona = data.filter(p => !p.persona_id)

  return (
    <section className="bg-surface-card border border-border rounded-2xl p-5 md:p-6">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-txt-primary">이 클럽의 프로젝트 페르소나</h2>
          <p className="text-[11px] text-txt-tertiary mt-0.5">
            각 프로젝트는 독립 페르소나를 가집니다. 클럽 운영진은 열람만 가능합니다.
          </p>
        </div>
        <span className="text-[11px] text-txt-tertiary">
          {withPersona.length} / {data.length}
        </span>
      </div>

      <ul className="space-y-1.5">
        {data.map(p => (
          <li key={p.project_id}>
            <Link
              href={
                p.persona_id
                  ? `/projects/${p.project_id}/settings/persona`
                  : `/projects/${p.project_id}`
              }
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-bg transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-surface-sunken flex items-center justify-center shrink-0">
                <Rocket size={14} className="text-txt-tertiary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-txt-primary truncate">
                  {p.project_title}
                </p>
                <p className="text-[11px] text-txt-tertiary">
                  {p.persona_status === 'active' && '활성 페르소나'}
                  {p.persona_status === 'draft' && '페르소나 초안'}
                  {p.persona_status === 'archived' && '아카이브됨'}
                  {!p.persona_status && '페르소나 없음'}
                  {p.last_edited_at && ` · ${formatRelative(p.last_edited_at)} 편집`}
                </p>
              </div>
              {p.persona_id ? (
                <ArrowRight
                  size={14}
                  className="shrink-0 text-txt-tertiary group-hover:translate-x-0.5 transition-transform"
                />
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-txt-tertiary group-hover:text-brand transition-colors">
                  <Plus size={11} />
                  시작
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>

      {withoutPersona.length > 0 && (
        <p className="text-[11px] text-txt-tertiary mt-4 pt-4 border-t border-border-subtle leading-relaxed">
          {withoutPersona.length}개 프로젝트가 아직 페르소나를 설정하지 않았습니다. 프로젝트 리드가 직접 생성해야 합니다.
        </p>
      )}
    </section>
  )
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86400000)
  if (d < 1) return '오늘'
  if (d < 7) return `${d}일 전`
  if (d < 30) return `${Math.floor(d / 7)}주 전`
  return new Date(iso).toLocaleDateString('ko-KR')
}
