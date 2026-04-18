'use client'

import { usePersonaByOwner, useCreatePersona } from '@/src/hooks/usePersona'
import { PersonaEmptyState } from './PersonaEmptyState'
import { PersonaActionCardsSection } from './PersonaActionCardsSection'
import { PersonaSlotList } from './PersonaSlotList'
import { PersonaTemplateLibrary } from './PersonaTemplateLibrary'
import { PersonaDangerCard } from './PersonaDangerCard'

interface Props {
  clubId: string
  clubName: string
  isAdmin: boolean
}

/**
 * 클럽 페르소나 대시보드 (클라이언트).
 *
 * R1에선 동아리 페르소나만 활성. 프로젝트/개인 탭은 R5에 추가.
 * 권한: 대표/운영진만 편집 가능 (내부 RLS가 최종 게이트).
 */
export function PersonaDashboardClient({ clubId, clubName, isAdmin }: Props) {
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
      <PersonaActionCardsSection personaId={data.persona.id} disabled={!isAdmin} />

      <PersonaSlotList
        persona={data.persona}
        fields={data.fields}
        canEdit={isAdmin}
      />

      <PersonaTemplateLibrary personaId={data.persona.id} canEdit={isAdmin} />

      {isAdmin && <PersonaDangerCard personaId={data.persona.id} />}
    </div>
  )
}
