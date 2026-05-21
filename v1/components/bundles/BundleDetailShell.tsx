'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { useClub } from '@/src/hooks/useClub'
import { BundleDetailClient } from '@/components/bundles/BundleDetailClient'

/**
 * 번들 상세 페이지 클라이언트 셸.
 * 서버 prefetch + HydrationBoundary 이후 렌더.
 */
export function BundleDetailShell({
  slug,
  bundleId,
}: {
  slug: string
  bundleId: string
}) {
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
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/clubs/${slug}`}
          className="text-txt-tertiary hover:text-txt-primary transition-colors"
          aria-label="뒤로"
        >
          <ChevronLeft size={20} />
        </Link>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-txt-primary">번들 상세</h1>
          <p className="text-xs text-txt-tertiary">
            {club ? (
              <>{club.name}의 발행 번들을 검토하고 승인합니다</>
            ) : (
              <span className="inline-block h-3.5 w-64 rounded skeleton-shimmer align-middle" />
            )}
          </p>
        </div>
      </div>

      <BundleDetailClient
        bundleId={bundleId}
        canApprove={!!isAdmin}
        slug={slug}
      />
    </>
  )
}
