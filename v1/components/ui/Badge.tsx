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
    className: 'bg-surface-inverse text-txt-inverse border-surface-inverse',
  },
  new: {
    label: 'NEW',
    className: 'bg-surface-sunken text-txt-primary border-border',
  },
  verified: {
    label: 'VERIFIED',
    className: 'bg-surface-sunken text-txt-secondary border-border',
  },
  trending: {
    label: 'TRENDING',
    className: 'bg-surface-inverse text-txt-inverse border-surface-inverse',
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
      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${config.className} ${className}`}
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
