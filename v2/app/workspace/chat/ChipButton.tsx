'use client'

/**
 * 라이트 패널용 알약(pill) 버튼.
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
    ? 'bg-ink text-canvas border-ink'
    : 'bg-canvas text-muted border-hairline hover:text-ink hover:border-muted hover:bg-surface-soft'
  return (
    <button type="button" className={`${base} ${tone} ${className}`} {...rest}>
      {children}
    </button>
  )
}
