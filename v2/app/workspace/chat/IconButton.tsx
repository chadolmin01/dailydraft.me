'use client'

import { forwardRef } from 'react'

/**
 * 다크 패널 안에서 사용할 원형 아이콘 버튼.
 * 의도: 챗 입력창 우측 send 버튼, 메시지 호버 시 복사 버튼 등 공통 패턴 통일.
 * 안 만들면 매번 className 중복 + hover/disabled 미스매치 발생.
 */

type Variant = 'solid' | 'ghost'
type Size = 'sm' | 'md'

const sizeMap: Record<Size, string> = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
}

const variantMap: Record<Variant, string> = {
  // solid: 밝은 ink-on-canvas — 주요 액션 (send 등). 다크 패널 안에서 대비 최대.
  solid:
    'bg-on-dark text-surface-dark hover:bg-on-dark/90 disabled:bg-on-dark-soft disabled:cursor-not-allowed',
  // ghost: 호버 시에만 배경. 보조 액션 (copy, cancel 등).
  ghost:
    'text-on-dark-soft hover:text-on-dark hover:bg-surface-dark-elevated disabled:opacity-40 disabled:cursor-not-allowed',
}

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  label: string
  children: React.ReactNode
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = 'ghost', size = 'md', label, children, className = '', ...rest }, ref) => {
    return (
      <button
        ref={ref}
        type={rest.type ?? 'button'}
        aria-label={label}
        title={label}
        className={`${sizeMap[size]} ${variantMap[variant]} inline-flex items-center justify-center rounded-full transition-colors shrink-0 ${className}`}
        {...rest}
      >
        {children}
      </button>
    )
  },
)
IconButton.displayName = 'IconButton'
