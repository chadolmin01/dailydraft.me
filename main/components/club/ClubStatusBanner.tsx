'use client'

import Link from 'next/link'
import { Clock, ShieldCheck, AlertCircle, ArrowRight, RotateCw } from 'lucide-react'

type ClaimStatus = 'pending' | 'verified' | 'rejected' | string | null | undefined

interface Props {
  claimStatus: ClaimStatus
  universityId?: string | null
  verificationNote?: string | null
  submittedAt?: string | null
  clubSlug: string
  /** 현재 유저가 creator 인지 — rejected 시 재제출 버튼 노출 여부 결정 */
  isOwner?: boolean
}

/**
 * `<ClubStatusBanner>` — 클럽 페이지 상단에 4가지 상태 배너.
 *
 * 상태:
 * 1. pending — 노란 배너 (승인 대기)
 * 2. rejected — 빨간 배너 + 사유 + 재제출 버튼 (owner 만)
 * 3. verified + university_id 없음 (legacy) — 회색 배너 + 업그레이드 링크
 * 4. verified + university_id 있음 — 배너 숨김 (ClubVerifiedBadge 로 대체)
 *
 * 비노출: null 반환.
 */
export function ClubStatusBanner({
  claimStatus,
  universityId,
  verificationNote,
  submittedAt,
  clubSlug,
  isOwner,
}: Props) {
  // 4번: 완전 인증된 클럽 — 배너 숨김
  if (claimStatus === 'verified' && universityId) return null

  if (claimStatus === 'pending') {
    const submitted = submittedAt ? new Date(submittedAt).toLocaleDateString('ko-KR') : null
    return (
      <div
        role="status"
        className="mb-6 rounded-2xl border border-status-warn-text/25 bg-status-warn-bg p-4 flex items-start gap-3"
      >
        <Clock size={18} className="text-status-warn-text shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-status-warn-text">
            공식 등록 검토 중입니다
          </p>
          <p className="text-[12px] text-txt-secondary mt-1 leading-relaxed break-keep">
            검토가 끝날 때까지 공개 클럽 목록에는 노출되지 않습니다. 보통 1~3영업일 안에 결과를
            알려 드립니다.
            {submitted && <span className="text-txt-tertiary"> · {submitted} 접수</span>}
          </p>
        </div>
      </div>
    )
  }

  if (claimStatus === 'rejected') {
    return (
      <div
        role="alert"
        className="mb-6 rounded-2xl border border-status-danger-text/25 bg-status-danger-bg p-4 flex items-start gap-3"
      >
        <AlertCircle size={18} className="text-status-danger-text shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-status-danger-text">
            공식 등록이 반려되었습니다
          </p>
          {verificationNote && (
            <p className="text-[12px] text-txt-secondary mt-1 leading-relaxed break-keep">
              {verificationNote}
            </p>
          )}
          {isOwner && (
            <Link
              href={`/clubs/${clubSlug}/verify`}
              className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-status-danger-text hover:opacity-80"
            >
              <RotateCw size={12} aria-hidden="true" />
              증빙을 수정하고 다시 제출하기
            </Link>
          )}
        </div>
      </div>
    )
  }

  // 3번: legacy verified (university_id 없음) — 업그레이드 유도
  if (claimStatus === 'verified' && !universityId) {
    if (!isOwner) return null // 일반 유저에겐 숨김
    return (
      <div
        role="status"
        className="mb-6 rounded-2xl border border-border bg-surface-sunken p-4 flex items-start gap-3"
      >
        <ShieldCheck size={18} className="text-txt-secondary shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-txt-primary">
            공식 등록을 완료하시면 학교 뱃지가 부여됩니다
          </p>
          <p className="text-[12px] text-txt-secondary mt-1 leading-relaxed break-keep">
            소속 학교와 증빙 자료만 추가로 등록하시면 "{'{'}학교명{'}'} 공식 등록" 뱃지가 붙고, 학교 단위 탐색
            결과에도 노출됩니다.
          </p>
          <Link
            href={`/clubs/${clubSlug}/verify`}
            className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-brand hover:opacity-80"
          >
            지금 등록 신청하기
            <ArrowRight size={12} aria-hidden="true" />
          </Link>
        </div>
      </div>
    )
  }

  return null
}
