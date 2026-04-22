'use client'

/**
 * MiniLoader — loading.tsx 및 페이지 내부 비동기 영역에서 쓰는 미니멀 로더.
 *
 * 철학: 페이지 전환 < 400ms 인 대부분 케이스는 스켈레톤 자체가 안 보이는 게 낫다.
 * 그것보다 긴 로딩엔 "무언가 준비 중" 힌트만 최소한으로. wireframe 은 오히려
 * 인지 부하.
 *
 * variants:
 *   - page (default): route-level 로더. 상하 큰 여백 + 중앙 정렬. loading.tsx 에서 사용.
 *   - inline: 페이지 내부 섹션 로딩. 여백 최소화. <AsyncBoundary> 기본 fallback.
 *   - tiny: 버튼 내부·토스트 옆 등 매우 작은 공간. 텍스트 없음, 14px 스피너만.
 *
 * 첫 280ms 는 opacity 0 (skeleton-shimmer 와 동일 타이밍) → 빠른 전환엔 안 보임.
 */

type Variant = 'page' | 'inline' | 'tiny'

interface MiniLoaderProps {
  heading?: string
  /** 부가 설명 — heading 아래 더 작은 글씨. 로딩이 2초 이상일 때 맥락 전달용. */
  subheading?: string
  variant?: Variant
  /** Tailwind 클래스로 outer wrapper 추가 조정 가능 */
  className?: string
}

const VARIANT_STYLES: Record<Variant, { wrapper: string; spinner: string }> = {
  page: {
    wrapper:
      'skeleton-delayed max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex flex-col items-center justify-center gap-4',
    spinner: 'w-8 h-8 border-2',
  },
  inline: {
    wrapper:
      'skeleton-delayed w-full py-10 flex flex-col items-center justify-center gap-3',
    spinner: 'w-6 h-6 border-2',
  },
  tiny: {
    wrapper: 'inline-flex items-center justify-center',
    spinner: 'w-3.5 h-3.5 border-[1.5px]',
  },
}

export function MiniLoader({
  heading,
  subheading,
  variant = 'page',
  className = '',
}: MiniLoaderProps) {
  const styles = VARIANT_STYLES[variant]

  return (
    <div
      className={`${styles.wrapper} ${className}`}
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      {/* 부드러운 원형 스피너 — border 방식, GPU-efficient */}
      <div className={`relative ${styles.spinner.split(' ')[0]} ${styles.spinner.split(' ')[1]}`}>
        <div className={`absolute inset-0 rounded-full ${styles.spinner.split(' ')[2]} border-border`} />
        <div className={`absolute inset-0 rounded-full ${styles.spinner.split(' ')[2]} border-transparent border-t-brand animate-spin`} />
      </div>
      {heading && variant !== 'tiny' && (
        <p
          className={
            variant === 'inline'
              ? 'text-[12px] text-txt-tertiary font-medium'
              : 'text-[13px] text-txt-tertiary font-medium'
          }
        >
          {heading}
        </p>
      )}
      {subheading && variant !== 'tiny' && (
        <p className="text-[11px] text-txt-disabled max-w-xs text-center leading-relaxed">
          {subheading}
        </p>
      )}
      {/* sr-only 라벨 — tiny variant 에서는 heading 생략되지만 스크린리더 안내는 유지 */}
      {variant === 'tiny' && (
        <span className="sr-only">{heading ?? '불러오는 중'}</span>
      )}
    </div>
  )
}
