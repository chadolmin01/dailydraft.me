'use client'

import { toast } from 'sonner'

/**
 * 에러 토스트 + 재시도 액션. 네트워크·일시적 실패에 유용.
 *
 * 사용:
 *   toastErrorWithRetry('저장에 실패했습니다', () => saveMutation.mutate())
 *
 * 재시도 클릭 시 onRetry 호출. 토스트는 dismiss.
 */
export function toastErrorWithRetry(message: string, onRetry: () => void) {
  toast.error(message, {
    action: {
      label: '다시 시도',
      onClick: onRetry,
    },
    duration: 8000, // 재시도 선택권 주기 위해 길게
  })
}

/**
 * 성공 토스트 + undo 액션.
 *
 * 서버측 소프트 삭제 지원 시에만 의미. 하드 삭제 후에는 사용 금지.
 */
export function toastSuccessWithUndo(message: string, onUndo: () => void) {
  toast.success(message, {
    action: {
      label: '실행 취소',
      onClick: onUndo,
    },
    duration: 6000,
  })
}
