'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreVertical, Shield, ShieldOff, UserMinus, GraduationCap, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { clubKeys } from '@/src/hooks/useClub'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface Props {
  slug: string
  clubId: string
  memberId: string
  memberRole: string
  memberName: string | null
  viewerRole: 'owner' | 'admin'
}

/**
 * 멤버 카드의 역할 관리 메뉴 — Owner/Admin 전용.
 *
 * 권한 규칙:
 *   - Owner: admin 임명/해제, 멤버 제거, alumni 처리 가능
 *   - Admin: member/alumni 처리만. 다른 admin 건드릴 수 없음.
 *   - Owner 역할은 이 메뉴로 바꿀 수 없음 (소유권 이전 별도 플로우)
 */
export function MemberRoleMenu({
  slug,
  clubId,
  memberId,
  memberRole,
  memberName,
  viewerRole,
}: Props) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return
      setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // owner 는 건드릴 수 없음
  if (memberRole === 'owner') return null

  const isOwner = viewerRole === 'owner'
  const canPromote = isOwner && memberRole === 'member'
  const canDemote = isOwner && memberRole === 'admin'
  const canRemove = isOwner || (viewerRole === 'admin' && memberRole !== 'admin')
  const canGraduate = (isOwner || viewerRole === 'admin') && memberRole !== 'alumni' && memberRole !== 'admin'

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: clubKeys.all })
    void clubId
  }

  const mutate = async (body: Record<string, unknown>, successMsg: string) => {
    setPending(true)
    try {
      const res = await fetch(`/api/clubs/${slug}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({})) as { error?: { message?: string } }
      if (!res.ok) {
        toast.error(data?.error?.message ?? '처리에 실패했습니다')
        return
      }
      toast.success(successMsg)
      invalidate()
      setOpen(false)
    } finally {
      setPending(false)
    }
  }

  const handlePromote = () => mutate({ role: 'admin' }, `${memberName ?? '멤버'}님을 운영진으로 임명했습니다`)
  const handleDemote = () => mutate({ role: 'member' }, `${memberName ?? '운영진'}님을 일반 멤버로 변경했습니다`)
  const handleGraduate = () => mutate({ role: 'alumni' }, `${memberName ?? '멤버'}님을 알럼나이로 전환했습니다`)
  const handleRemove = () => {
    setShowRemoveConfirm(true)
  }

  const confirmRemove = () => {
    mutate({ action: 'remove' }, '멤버를 제거했습니다')
    setShowRemoveConfirm(false)
  }

  if (!canPromote && !canDemote && !canRemove && !canGraduate) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(v => !v) }}
        disabled={pending}
        className="p-1 text-txt-disabled hover:text-txt-primary hover:bg-surface-sunken rounded-md transition-colors disabled:opacity-50"
        aria-label="멤버 관리"
      >
        {pending ? <Loader2 size={14} className="animate-spin" /> : <MoreVertical size={14} />}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-surface-card border border-border rounded-xl shadow-lg p-1.5 z-30">
          {canPromote && (
            <button
              onClick={e => { e.stopPropagation(); handlePromote() }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] text-txt-primary hover:bg-surface-sunken rounded-lg transition-colors"
            >
              <Shield size={13} className="text-brand" />
              운영진으로 임명
            </button>
          )}
          {canDemote && (
            <button
              onClick={e => { e.stopPropagation(); handleDemote() }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] text-txt-primary hover:bg-surface-sunken rounded-lg transition-colors"
            >
              <ShieldOff size={13} className="text-txt-tertiary" />
              일반 멤버로 변경
            </button>
          )}
          {canGraduate && (
            <button
              onClick={e => { e.stopPropagation(); handleGraduate() }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] text-txt-primary hover:bg-surface-sunken rounded-lg transition-colors"
            >
              <GraduationCap size={13} className="text-txt-tertiary" />
              알럼나이로 전환
            </button>
          )}
          {canRemove && (
            <>
              <div className="my-1 border-t border-border" />
              <button
                onClick={e => { e.stopPropagation(); handleRemove() }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] text-status-danger-text hover:bg-status-danger-bg rounded-lg transition-colors"
              >
                <UserMinus size={13} />
                클럽에서 제거
              </button>
            </>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        onConfirm={async () => confirmRemove()}
        title="멤버 제거"
        message={`${memberName ?? '이 멤버'} 님을 클럽에서 제거합니다. 제거 후에는 새 초대 코드를 통해서만 재가입이 가능하며, 이 멤버가 작성한 주간 업데이트·회의록·프로젝트 기록은 그대로 보존됩니다. 이 작업 자체는 감사 로그에 기록됩니다.`}
        confirmText="제거하기"
        variant="danger"
      />
    </div>
  )
}
