'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface Props {
  personaId: string
}

/**
 * 페르소나 초기화 카드.
 * "초기화"는 모든 슬롯 값을 삭제하고 페르소나를 비어있는 상태로 되돌림.
 * 페르소나 자체를 삭제하지는 않음 (DB row는 유지, fields만 비움).
 *
 * R1: UI만 먼저 두고 실제 reset API는 백엔드 엔드포인트 추가되면 연결.
 */
export function PersonaDangerCard({ personaId }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [resetting, setResetting] = useState(false)

  const handleReset = async () => {
    setResetting(true)
    try {
      const res = await fetch(`/api/personas/${personaId}/reset`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error()
      toast.success('페르소나가 초기화되었습니다')
      setConfirming(false)
    } catch {
      toast.error('초기화에 실패했습니다')
    } finally {
      setResetting(false)
    }
  }

  return (
    <>
      <section>
        <div className="mb-3">
          <h2 className="text-sm font-bold text-txt-primary">위험 영역</h2>
        </div>
        <div className="bg-surface-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-txt-primary mb-1">
            이 페르소나 초기화
          </h3>
          <p className="text-xs text-txt-secondary leading-relaxed mb-4">
            모든 슬롯의 내용이 지워집니다. 발행 이력과 학습 이력은 유지되지만,
            상속된 필드를 제외한 본인 필드는 되돌릴 수 없습니다.{' '}
            <span className="text-txt-tertiary">
              초기화 전에 현재 상태를 <strong className="font-semibold text-txt-secondary">"내 템플릿"</strong>에
              저장해두면 언제든 복원할 수 있습니다.
            </span>
          </p>
          <button
            onClick={() => setConfirming(true)}
            className="h-9 px-4 rounded-lg border border-status-danger-text/30 text-status-danger-text text-sm font-semibold hover:bg-status-danger-text/5 transition-colors"
          >
            페르소나 초기화
          </button>
        </div>
      </section>

      <ConfirmModal
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={handleReset}
        title="이 페르소나를 초기화합니다"
        message="모든 슬롯이 빈 상태로 돌아갑니다. 이 작업은 되돌릴 수 없으니, 현재 상태를 '내 템플릿'에 먼저 저장하셨는지 확인해주세요."
        confirmText={resetting ? '초기화 중...' : '초기화'}
        variant="danger"
      />
    </>
  )
}
