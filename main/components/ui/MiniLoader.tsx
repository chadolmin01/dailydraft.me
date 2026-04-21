'use client'

/**
 * MiniLoader — loading.tsx 에서 복잡한 wireframe skeleton 대신 사용하는 미니멀 로더.
 *
 * 철학: 페이지 전환 < 400ms 인 대부분 케이스는 스켈레톤 자체가 안 보이는 게 낫다.
 * 그것보다 긴 로딩엔 "무언가 준비 중" 힌트만 최소한으로. wireframe 은 오히려
 * 인지 부하.
 *
 * 구성: 상단 여백 + 작은 스피너 + 옵션 heading.
 * 첫 280ms 는 opacity 0 (skeleton-shimmer 와 동일 타이밍) → 빠른 전환엔 안 보임.
 */
export function MiniLoader({ heading }: { heading?: string }) {
  return (
    <div
      className="skeleton-delayed max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex flex-col items-center justify-center gap-4"
      aria-busy="true"
      aria-live="polite"
    >
      {/* 부드러운 원형 스피너 — border 방식, GPU-efficient */}
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 rounded-full border-2 border-border" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand animate-spin" />
      </div>
      {heading && (
        <p className="text-[13px] text-txt-tertiary font-medium">{heading}</p>
      )}
    </div>
  )
}
