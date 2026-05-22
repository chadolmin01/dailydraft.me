'use client'

import { forwardRef } from 'react'

/**
 * 라이트 패널용 원형 아이콘 버튼.
 * 의도: 챗 입력창 send 버튼, 메시지 호버 시 복사 버튼 등 공통 패턴 통일.
 */

type Variant = 'solid' | 'ghost'
type Size = 'sm' | 'md'

const sizeMap: Record<Size, string> = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
}

const variantMap: Record<Variant, string> = {
  // solid: ink 채움 + canvas 텍스트 — 주요 액션 (send 등). 라이트 배경에 강한 대비.
  solid:
    'bg-ink text-canvas hover:bg-body-strong disabled:bg-disabled disabled:cursor-not-allowed',
  // ghost: 호버 시 surface-card 배경. 보조 액션.
  ghost:
    'text-muted hover:text-ink hover:bg-surface-card disabled:opacity-40 disabled:cursor-not-allowed',
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
