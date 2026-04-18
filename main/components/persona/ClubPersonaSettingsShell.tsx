'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { useClub } from '@/src/hooks/useClub'
import { PersonaDashboardClient } from '@/components/persona/PersonaDashboardClient'

/**
 * 브랜드 페르소나 설정 페이지 클라이언트 셸.
 * 서버 prefetch + HydrationBoundary 적용 후 호출됨.
 * hydrate 적중 시 isLoading=false로 시작. 네트워크 실패 시에만 inline shimmer 노출.
 */
export function ClubPersonaSettingsShell({ slug }: { slug: string }) {
  const { data: club, isLoading } = useClub(slug)

  if (!isLoading && !club) {
    return (
      <div className="text-center py-12">
        <p className="text-txt-tertiary">동아리를 찾을 수 없습니다.</p>
      </div>
    )
  }

  const isAdmin = club?.my_role === 'owner' || club?.my_role === 'admin'

  return (
    <>
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/clubs/${slug}/settings`}
          className="text-txt-tertiary hover:text-txt-primary transition-colors"
          aria-label="뒤로"
        >
          <ChevronLeft size={20} />
        </Link>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-txt-primary">브랜드 페르소나</h1>
          <p className="text-xs text-txt-tertiary leading-relaxed">
            {club ? (
              <>
                {club.name}의 "말투·독자·금기"를 한 곳에 정해두면, AI가 인스타·뉴스레터·모집공고를 모두 같은 목소리로 써드립니다.
              </>
            ) : (
              <span className="inline-block h-3.5 w-72 rounded skeleton-shimmer align-middle" />
            )}
          </p>
        </div>
      </div>

      {club ? (
        <PersonaDashboardClient
          clubId={club.id}
          clubName={club.name}
          isAdmin={!!isAdmin}
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
