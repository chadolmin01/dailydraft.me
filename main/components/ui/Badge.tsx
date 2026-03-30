/**
 * 범용 뱃지 컴포넌트
 * sample, hot, new, verified, trending 등 다양한 variant 지원
 */

const BADGE_VARIANTS = {
  sample: {
    label: 'SAMPLE',
    className: 'bg-surface-sunken text-txt-tertiary border-border',
  },
  hot: {
    label: 'HOT',
    className: 'bg-red-50 text-red-600 border-red-200',
  },
  new: {
    label: 'NEW',
    className: 'bg-blue-50 text-blue-600 border-blue-200',
  },
  verified: {
    label: 'VERIFIED',
    className: 'bg-status-success-bg text-status-success-text border-indicator-online/20',
  },
  trending: {
    label: 'TRENDING',
    className: 'bg-amber-50 text-amber-600 border-amber-200',
  },
} as const

export type BadgeVariant = keyof typeof BADGE_VARIANTS

interface BadgeProps {
  variant: BadgeVariant
  className?: string
}

export function Badge({ variant, className = '' }: BadgeProps) {
  const config = BADGE_VARIANTS[variant]
  if (!config) return null

  return (
    <span
      className={`text-[0.5625rem] font-medium px-1.5 py-0.5 border shrink-0 ${config.className} ${className}`}
    >
      {config.label}
    </span>
  )
}

/** badges 배열에서 Badge 컴포넌트들을 렌더링 */
export function Badges({ badges, className = '' }: { badges?: string[] | null; className?: string }) {
  if (!badges || badges.length === 0) return null
  return (
    <>
      {badges.map(b => (
        <Badge key={b} variant={b as BadgeVariant} className={className} />
      ))}
    </>
  )
}
