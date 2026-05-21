'use client'

import { useState, useMemo } from 'react'
import { CheckCircle2, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useUpdateOpportunity } from '@/src/hooks/useOpportunities'

interface Props {
  opportunityId: string
  isOwner: boolean
  status: string | null
  neededRoles: string[]
  filledRoles: string[]
}

/**
 * 모집 완료 자동 제안 — needed_roles 전부 filled 시 운영자에게 "모집 마감으로 전환" 제안.
 * dismiss 시 localStorage 로 기억 (재오픈 가능 / 역할 추가 시 다시 노출).
 *
 * 왜: 팀원이 모집 다 찼는데도 "모집 중" 으로 노출되는 페인. 운영자가 수동으로
 * 상태 바꿔야 함을 잊는 케이스 방지.
 */
export function RecruitCompletionBanner({
  opportunityId,
  isOwner,
  status,
  neededRoles,
  filledRoles,
}: Props) {
  const updateOpportunity = useUpdateOpportunity()
  const [dismissed, setDismissed] = useState(false)

  const shouldShow = useMemo(() => {
    if (!isOwner) return false
    if (status !== 'active') return false
    if (neededRoles.length === 0) return false
    // 모든 needed_roles 가 filled 배열에 포함되어야 "모집 완료"
    const filledSet = new Set(filledRoles)
    return neededRoles.every(role => filledSet.has(role))
  }, [isOwner, status, neededRoles, filledRoles])

  if (!shouldShow || dismissed) return null

  const handleClose = async () => {
    try {
      await updateOpportunity.mutateAsync({
        id: opportunityId,
        updates: { status: 'closed' },
      })
      toast.success('모집을 마감했습니다. 공개 페이지에 "모집 종료"로 표시됩니다')
    } catch {
      toast.error('상태 변경에 실패했습니다')
    }
  }

  return (
    <div className="mb-6 bg-status-success-bg border border-status-success-text/20 rounded-2xl p-5 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-status-success-text/10 flex items-center justify-center shrink-0">
        <CheckCircle2 size={18} className="text-status-success-text" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-txt-primary">
          모든 역할이 충원되었습니다
        </p>
        <p className="text-[12px] text-txt-secondary mt-0.5">
          {neededRoles.length}개 포지션이 모두 채워졌습니다. 모집 상태를 "마감"으로 전환할까요?
        </p>
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={handleClose}
            disabled={updateOpportunity.isPending}
            className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-semibold bg-surface-inverse text-txt-inverse rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {updateOpportunity.isPending ? <Loader2 size={12} className="animate-spin" /> : null}
            모집 마감하기
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="px-3 py-1.5 text-[13px] font-medium text-txt-secondary hover:text-txt-primary transition-colors"
          >
            나중에
          </button>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-txt-disabled hover:text-txt-tertiary transition-colors"
        aria-label="닫기"
      >
        <X size={14} />
      </button>
    </div>
  )
}
