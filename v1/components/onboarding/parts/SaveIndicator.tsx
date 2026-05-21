import { Check } from 'lucide-react'

// progress bar 옆 미니 배지. "저장 중 / 저장됨 / 오류" 를 조용히 보여 줌.
export function SaveIndicator({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' }) {
  if (status === 'idle') return null
  // status 를 key 로 사용해 상태 변경 시 crossfade in
  if (status === 'saving') {
    return (
      <span
        key="saving"
        className="ob-crossfade hidden sm:inline-flex items-center gap-1 text-[10px] text-txt-tertiary"
        title="입력하신 내용을 기기에 저장 중입니다"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-txt-tertiary animate-pulse" />
        저장 중
      </span>
    )
  }
  if (status === 'saved') {
    return (
      <span
        key="saved"
        className="ob-crossfade hidden sm:inline-flex items-center gap-1 text-[10px] text-brand"
        title="브라우저를 닫으셔도 내용이 유지됩니다"
      >
        <span className="ob-check-pop inline-flex">
          <Check size={10} strokeWidth={2.5} aria-hidden="true" />
        </span>
        저장됨
      </span>
    )
  }
  return (
    <span
      key="error"
      className="ob-crossfade hidden sm:inline-flex items-center gap-1 text-[10px] text-status-danger-text"
      title="기기 저장 실패. 서버에는 단계 이동 시 저장됩니다"
    >
      ⚠ 저장 실패
    </span>
  )
}
