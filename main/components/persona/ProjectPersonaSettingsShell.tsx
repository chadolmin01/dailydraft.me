'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Eye } from 'lucide-react'
import { supabase } from '@/src/lib/supabase/client'
import { ProjectPersonaDashboard } from '@/components/persona/ProjectPersonaDashboard'

interface Props {
  projectId: string
  currentUserId: string | null
}

interface ProjectMeta {
  id: string
  title: string
  creator_id: string
  club_id: string | null
  clubs: { id: string; slug: string; name: string } | null
}

/**
 * 프로젝트 페르소나 설정 페이지 shell.
 *
 * 권한 분기:
 *   - 프로젝트 리드 (creator) = 편집 가능
 *   - 소속 클럽 운영진 = 열람 전용 (sticky 밴드 노출)
 *   - 그 외 = 접근 거부 배너
 */
export function ProjectPersonaSettingsShell({ projectId, currentUserId }: Props) {
  const { data: project, isLoading } = useQuery<ProjectMeta | null>({
    queryKey: ['project-persona-meta', projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from('opportunities')
        .select('id, title, creator_id, club_id, clubs(id, slug, name)')
        .eq('id', projectId)
        .maybeSingle()
      if (!data) return null
      // supabase 는 1:1 조인을 단일 object 로 반환 (clubs 가 null 또는 object)
      return data as unknown as ProjectMeta
    },
    staleTime: 1000 * 60,
  })

  if (!isLoading && !project) {
    return (
      <div className="text-center py-12">
        <p className="text-txt-tertiary">프로젝트를 찾을 수 없습니다.</p>
      </div>
    )
  }

  const isProjectLead = project?.creator_id === currentUserId
  // 클럽 ops 는 is_club_admin 로 확인해야 하지만, API 에서 검증하므로 여기선
  // canEdit 여부만 결정. 실제 RLS 는 서버단에서 강제.
  const canEdit = isProjectLead

  return (
    <>
      {/* Breadcrumb + 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        {project?.clubs ? (
          <Link
            href={`/projects/${projectId}`}
            className="text-txt-tertiary hover:text-txt-primary transition-colors"
            aria-label="뒤로"
          >
            <ChevronLeft size={20} />
          </Link>
        ) : (
          <span className="text-txt-disabled">
            <ChevronLeft size={20} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          {project?.clubs && (
            <p className="text-[11px] text-txt-tertiary mb-0.5">
              <Link
                href={`/clubs/${project.clubs.slug}`}
                className="hover:text-txt-secondary transition-colors"
              >
                {project.clubs.name}
              </Link>
              <span className="mx-1.5">·</span>
              <Link
                href={`/projects/${projectId}`}
                className="hover:text-txt-secondary transition-colors"
              >
                {project.title}
              </Link>
            </p>
          )}
          <h1 className="text-lg font-bold text-txt-primary">프로젝트 페르소나</h1>
          <p className="text-xs text-txt-tertiary leading-relaxed">
            {project
              ? `${project.title}의 말투·독자·금기를 정의합니다. 주간 업데이트·외부 SNS·팀 공지에 사용됩니다.`
              : null}
          </p>
        </div>
      </div>

      {/* 열람 전용 밴드 (프로젝트 리드 아님) */}
      {!isLoading && project && !canEdit && (
        <div className="mb-6 bg-status-warning-bg border border-status-warning-text/20 rounded-xl px-4 py-3 flex items-start gap-3">
          <Eye size={16} className="text-status-warning-text shrink-0 mt-0.5" />
          <div className="flex-1 text-[13px] leading-relaxed">
            <p className="font-semibold text-txt-primary">열람 전용</p>
            <p className="text-txt-secondary text-xs mt-0.5">
              프로젝트 리드만 수정 가능합니다. 기수 종료 시 {project.clubs?.name ?? '클럽'} 아카이브로 편입됩니다.
            </p>
          </div>
        </div>
      )}

      {/* 대시보드 본체 */}
      {project ? (
        <ProjectPersonaDashboard
          projectId={projectId}
          projectTitle={project.title}
          clubSlug={project.clubs?.slug ?? null}
          clubName={project.clubs?.name ?? null}
          clubId={project.club_id}
          canEdit={canEdit}
        />
      ) : (
        <div className="space-y-4">
          <div className="h-32 rounded-2xl skeleton-shimmer" />
          <div className="h-64 rounded-2xl skeleton-shimmer" />
        </div>
      )}
    </>
  )
}
