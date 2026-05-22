'use client'

/**
 * 다크 패널 안에서 사용할 알약(pill) 버튼.
 * Suggestion / Quick action chip 공통.
 */

interface ChipButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  active?: boolean
}

export function ChipButton({ children, active = false, className = '', ...rest }: ChipButtonProps) {
  const base =
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-caption border transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed'
  const tone = active
    ? 'bg-on-dark text-surface-dark border-on-dark'
    : 'bg-transparent text-on-dark-soft border-hairline-dark hover:text-on-dark hover:border-on-dark-soft hover:bg-surface-dark-elevated'
  return (
    <button type="button" className={`${base} ${tone} ${className}`} {...rest}>
      {children}
    </button>
  )
}
