import { TRAIT_COLORS } from './types'

export function SliderBar({ value, low, high, label, colorKey }: { value: number; low: string; high: string; label: string; colorKey?: string }) {
  const pct = Math.min(Math.max((value / 10) * 100, 5), 100)
  const colors = (colorKey && TRAIT_COLORS[colorKey]) || { bar: 'bg-surface-inverse', dot: 'bg-surface-inverse', text: 'text-txt-disabled' }
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-txt-secondary flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
          {label}
        </span>
        <span className={`text-[10px] font-mono font-bold ${colors.text}`}>{value}/10</span>
      </div>
      <div className="h-2 bg-white rounded-xl border border-border-strong/50 overflow-hidden">
        <div className={`h-full ${colors.bar} rounded-xl transition-all`} style={{ width: `${pct}%`, opacity: 0.6 + (value / 10) * 0.4 }} />
      </div>
      <div className="flex justify-between text-[10px] text-txt-tertiary">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  )
}
