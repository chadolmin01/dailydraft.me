'use client'

import { BadgeCheck } from 'lucide-react'

interface Props {
  /** claim_status — 'verified' 가 아니면 렌더 안 됨 */
  claimStatus: 'pending' | 'verified' | 'rejected' | string | null | undefined
  /** 학교명. 있으면 뱃지에 "{학교명}" 으로 표시 */
  universityName?: string | null
  /** 인증 완료 시점 — ISO. 툴팁에 표시 */
  reviewedAt?: string | null
  /** 인라인 사이즈 */
  size?: 'sm' | 'md'
}

/**
 * `<ClubVerifiedBadge>` — 공식 등록 클럽임을 표시.
 *
 * 노출 조건:
 * - claim_status === 'verified'
 * - universityName 이 있을 때 "{학교명} 공식 등록"
 * - universityName 이 없으면 (legacy) 렌더하지 않음 → ClubStatusBanner 가 업그레이드 유도
 *
 * StudentVerifiedBadge 패턴과 맞춤.
 */
export function ClubVerifiedBadge({
  claimStatus,
  universityName,
  reviewedAt,
  size = 'sm',
}: Props) {
  if (claimStatus !== 'verified') return null
  if (!universityName) return null // legacy — 배너로 대체

  const dateLabel = (() => {
    if (!reviewedAt) return null
    try {
      return new Date(reviewedAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
      })
    } catch {
      return null
    }
  })()

  const ariaLabel = [
    `${universityName} 공식 등록 동아리`,
    dateLabel && `${dateLabel} 인증`,
  ]
    .filter(Boolean)
    .join(' · ')

  const isMd = size === 'md'

  return (
    <span
      role="img"
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`inline-flex items-center gap-1 rounded-full bg-brand/10 text-brand font-semibold ${
        isMd ? 'px-2 py-0.5 text-[11px]' : 'px-1.5 py-0.5 text-[10px]'
      }`}
    >
      <BadgeCheck size={isMd ? 12 : 10} strokeWidth={2.4} aria-hidden="true" />
      {universityName} 공식 등록
    </span>
  )
}
