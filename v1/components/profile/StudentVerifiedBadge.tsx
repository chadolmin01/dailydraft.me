'use client'

import { BadgeCheck } from 'lucide-react'

interface Props {
  /** 인증 시점 — ISO. null 이면 렌더 안 됨 */
  verifiedAt: string | null | undefined
  /** 인증 방법 (email_domain / sso / ocr / manual_admin) */
  method?: string | null
  /** 대학명 — 있으면 툴팁에 노출 */
  universityName?: string | null
  /** 인라인 사이즈 */
  size?: 'sm' | 'md'
}

const METHOD_LABEL: Record<string, string> = {
  email_domain: '학교 이메일 인증',
  sso: 'SSO 인증',
  ocr: '학생증 인증',
  manual_admin: '관리자 수동 인증',
}

/**
 * `<StudentVerifiedBadge>` — "이 프로필 주인이 해당 대학의 실제 학생임을 확인" 표시.
 *
 * Phase 1-a: 로그인 이메일이 학교 도메인과 매칭되면 자동으로 `student_verified_at`
 * 이 찍힘. UI 에서 이 뱃지를 노출해야 유저·매칭 대상이 신뢰할 수 있음.
 *
 * - 접근성: aria-label 에 전체 정보 (대학·방법·시점)
 * - 호버 툴팁: title 속성
 * - 시각 포인트: lucide BadgeCheck + brand color
 */
export function StudentVerifiedBadge({
  verifiedAt,
  method,
  universityName,
  size = 'sm',
}: Props) {
  if (!verifiedAt) return null

  const methodLabel = method ? METHOD_LABEL[method] ?? '학적 인증' : '학적 인증'
  const dateLabel = (() => {
    try {
      return new Date(verifiedAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
      })
    } catch {
      return null
    }
  })()

  const ariaLabel = [
    universityName ? `${universityName} 재학생 인증 완료` : '재학생 인증 완료',
    methodLabel,
    dateLabel && `${dateLabel} 기준`,
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
      인증된 학생
    </span>
  )
}
