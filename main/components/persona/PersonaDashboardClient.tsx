'use client'

import Link from 'next/link'
import { Sparkles, ArrowRight, FolderOpen, Clock } from 'lucide-react'
import { usePersonaByOwner, useCreatePersona } from '@/src/hooks/usePersona'
import { PersonaEmptyState } from './PersonaEmptyState'
import { PersonaActionCardsSection } from './PersonaActionCardsSection'
import { PersonaSlotList } from './PersonaSlotList'
import { PersonaTemplateLibrary } from './PersonaTemplateLibrary'
import { PersonaChannelConnections } from './PersonaChannelConnections'
import { PersonaDangerCard } from './PersonaDangerCard'

interface Props {
  clubId: string
  clubName: string
  clubSlug: string
  isAdmin: boolean
}

/**
 * 클럽 페르소나 대시보드 (클라이언트).
 *
 * R1에선 동아리 페르소나만 활성. 프로젝트/개인 탭은 R5에 추가.
 * 권한: 대표/운영진만 편집 가능 (내부 RLS가 최종 게이트).
 */
export function PersonaDashboardClient({ clubId, clubName, clubSlug, isAdmin }: Props) {
  const { data, isLoading, error } = usePersonaByOwner('club', clubId)
  const createPersona = useCreatePersona()

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
      <PersonaEmptyState
        clubName={clubName}
        canCreate={isAdmin}
        isCreating={createPersona.isPending}
        onCreate={() =>
          createPersona.mutate({
            type: 'club',
            owner_id: clubId,
            name: `${clubName} 브랜드 페르소나`,
          })
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* 상단 CTA — AI에게 글 부탁 + 내 덱 모음 보기 */}
      {isAdmin && (
        <div className="grid md:grid-cols-[2fr_1fr] gap-3">
          <Link
            href={`/clubs/${clubSlug}/bundles/new`}
            className="group flex items-center gap-4 bg-gradient-to-r from-brand to-brand-hover rounded-2xl p-5 hover:shadow-md transition-shadow text-white"
          >
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold mb-0.5">
                지금 바로 AI에게 글 부탁하기
              </h3>
              <p className="text-xs text-white/80 leading-relaxed">
                모집 공고·주간 업데이트·쇼케이스 홍보 등, 5개 채널에 올릴 글을 한 번에 준비해드립니다.
              </p>
            </div>
            <ArrowRight
              size={18}
              className="shrink-0 group-hover:translate-x-0.5 transition-transform"
            />
          </Link>
          <Link
            href={`/clubs/${clubSlug}/decks`}
            className="group flex items-center gap-3 bg-surface-card border border-border rounded-2xl p-5 hover:border-brand-border hover:shadow-sm transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-brand-bg flex items-center justify-center shrink-0">
              <FolderOpen size={20} className="text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-txt-primary mb-0.5">
                내 덱 모음
              </h3>
              <p className="text-[11px] text-txt-tertiary leading-relaxed">
                지금까지 만든 글들을 승인·발행 상태별로 관리합니다.
              </p>
            </div>
            <ArrowRight
              size={16}
              className="shrink-0 text-txt-tertiary group-hover:text-brand group-hover:translate-x-0.5 transition-all"
            />
          </Link>
        </div>
      )}

      {/* 자동화 진입 — 예약된 발행 관리 */}
      {isAdmin && (
        <Link
          href={`/clubs/${clubSlug}/automations`}
          className="group flex items-center gap-3 bg-surface-card border border-border rounded-2xl p-4 hover:border-brand-border hover:shadow-sm transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center shrink-0">
            <Clock size={18} className="text-brand" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-txt-primary mb-0.5">
              자동 발행 예약
            </h3>
            <p className="text-[11px] text-txt-tertiary leading-relaxed">
              &quot;내일 9시에 공지 올리기&quot;처럼 AI가 글을 쓰고 원하는 시간에 자동 발행합니다.
            </p>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-brand">
            열기
            <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </Link>
      )}

      <PersonaActionCardsSection personaId={data.persona.id} disabled={!isAdmin} />

      <PersonaSlotList
        persona={data.persona}
        fields={data.fields}
        canEdit={isAdmin}
      />

      <PersonaChannelConnections
        personaId={data.persona.id}
        clubSlug={clubSlug}
        canEdit={isAdmin}
      />

      <PersonaTemplateLibrary personaId={data.persona.id} canEdit={isAdmin} />

      {isAdmin && <PersonaDangerCard personaId={data.persona.id} />}
    </div>
  )
}
