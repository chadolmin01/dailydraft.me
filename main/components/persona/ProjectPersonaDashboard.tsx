'use client'

import Link from 'next/link'
import { Sparkles, ArrowRight, LayoutGrid } from 'lucide-react'
import { usePersonaByOwner, useCreatePersona } from '@/src/hooks/usePersona'
import { usePersonaByOwner as usePersonaByOwnerAlt } from '@/src/hooks/usePersona'
import { ProjectPersonaEmptyState } from './ProjectPersonaEmptyState'
import { PersonaSlotList } from './PersonaSlotList'
import { PersonaChannelConnections } from './PersonaChannelConnections'
import { PersonaTemplateLibrary } from './PersonaTemplateLibrary'
import { PersonaDangerCard } from './PersonaDangerCard'
import { PersonaActivityPanel } from './PersonaActivityPanel'
import { PersonaInheritanceToggle } from './PersonaInheritanceToggle'
import { PersonaLifecycleCard } from './PersonaLifecycleCard'

void usePersonaByOwnerAlt

interface Props {
  projectId: string
  projectTitle: string
  clubSlug: string | null
  clubName: string | null
  clubId: string | null
  canEdit: boolean
}

/**
 * 프로젝트 페르소나 대시보드.
 *
 * 클럽 페르소나와의 차이:
 *  - 상속 토글 섹션 (선택적 상속)
 *  - 라이프사이클 카드 (기수 종료·아카이브)
 *  - 상단 CTA 의 번들 생성 / 콘텐츠 허브 링크가 프로젝트 scope 으로
 *  - Empty state 가 클럽 vs 프로젝트 차이 설명
 *  - 열람 전용 (canEdit=false) 모드에서 모든 액션 숨김
 */
export function ProjectPersonaDashboard({
  projectId,
  projectTitle,
  clubSlug,
  clubName,
  clubId,
  canEdit,
}: Props) {
  const { data, isLoading, error } = usePersonaByOwner('project', projectId)
  const createPersona = useCreatePersona()

  // 클럽 페르소나를 parent 로 사용 (상속 체인). clubId 있을 때만 fetch
  const { data: clubPersonaData } = usePersonaByOwner('club', clubId ?? undefined)
  const clubPersonaId = clubPersonaData?.persona?.id ?? null

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-surface-sunken rounded-2xl animate-pulse" />
        <div className="h-64 bg-surface-sunken rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-surface-card border border-border rounded-2xl p-5">
        <p className="text-sm text-txt-secondary">{error.message}</p>
      </div>
    )
  }

  if (!data?.persona) {
    return (
      <ProjectPersonaEmptyState
        projectTitle={projectTitle}
        clubName={clubName}
        canCreate={canEdit}
        isCreating={createPersona.isPending}
        onCreate={() =>
          createPersona.mutate({
            type: 'project',
            owner_id: projectId,
            name: `${projectTitle} 페르소나`,
            parent_persona_id: clubPersonaId,
          })
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* 상단 CTA — 편집 권한 있을 때만 노출 */}
      {canEdit && (
        <div className="grid md:grid-cols-[2fr_1fr] gap-3">
          <Link
            href={`/projects/${projectId}`}
            className="group flex items-center gap-4 bg-linear-to-r from-brand to-brand-hover rounded-2xl p-5 hover:shadow-md transition-shadow text-white"
          >
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold mb-0.5">지금 AI 에게 글 부탁하기</h3>
              <p className="text-xs text-white/80 leading-relaxed">
                주간 업데이트·Threads·LinkedIn 포스트 초안을 {projectTitle} 톤으로 준비합니다.
              </p>
            </div>
            <ArrowRight
              size={18}
              className="shrink-0 group-hover:translate-x-0.5 transition-transform"
            />
          </Link>
          {clubSlug && (
            <Link
              href={`/clubs/${clubSlug}/contents`}
              prefetch
              className="group flex items-center gap-3 bg-surface-card border border-border rounded-2xl p-5 hover:border-brand-border hover:shadow-sm transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-brand-bg flex items-center justify-center shrink-0">
                <LayoutGrid size={20} className="text-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-txt-primary mb-0.5">콘텐츠 허브</h3>
                <p className="text-[11px] text-txt-tertiary leading-relaxed">
                  캘린더·내 덱·자동화·성과를 한 곳에서 관리합니다.
                </p>
              </div>
              <ArrowRight
                size={16}
                className="shrink-0 text-txt-tertiary group-hover:text-brand group-hover:translate-x-0.5 transition-all"
              />
            </Link>
          )}
        </div>
      )}

      {/* 활동 요약 (ROI 대시보드) */}
      <PersonaActivityPanel personaId={data.persona.id} personaName={projectTitle} />

      {/* 슬롯 */}
      <PersonaSlotList
        persona={data.persona}
        fields={data.fields}
        canEdit={canEdit}
      />

      {/* 선택적 상속 토글 (클럽 페르소나가 있을 때만) */}
      {clubPersonaId && (
        <PersonaInheritanceToggle
          persona={data.persona}
          parentPersonaId={clubPersonaId}
          parentLabel={clubName ?? '클럽'}
          canEdit={canEdit}
        />
      )}

      {/* 채널 연결 */}
      {clubSlug && (
        <PersonaChannelConnections
          personaId={data.persona.id}
          clubSlug={clubSlug}
          canEdit={canEdit}
        />
      )}

      {/* 라이프사이클 (기수 종료 · 아카이브) */}
      <PersonaLifecycleCard
        persona={data.persona}
        clubName={clubName}
        canEdit={canEdit}
      />

      {/* 템플릿 라이브러리 */}
      <PersonaTemplateLibrary personaId={data.persona.id} canEdit={canEdit} />

      {/* 위험 영역 — 프로젝트 리드만 */}
      {canEdit && <PersonaDangerCard personaId={data.persona.id} />}
    </div>
  )
}
