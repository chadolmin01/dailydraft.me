import Link from 'next/link'
import { Check } from 'lucide-react'

export interface ConsentRowProps {
  checked: boolean
  onToggle: () => void
  label: string
  required?: boolean
  emphasis?: boolean
  hint?: string
  link?: { href: string; label: string }
}

export function ConsentRow({ checked, onToggle, label, required, emphasis, hint, link }: ConsentRowProps) {
  return (
    <label
      className="flex items-start gap-3 py-1.5 cursor-pointer group rounded-lg px-1 -mx-1 hover:bg-surface-sunken/40 ob-smooth-colors"
      onClick={(e) => {
        // Link 클릭은 체크 동작으로 바꾸지 않음
        const target = e.target as HTMLElement
        if (target.closest('a')) return
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`ob-ring-glow w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
          checked
            ? 'bg-brand text-white border border-brand'
            : 'bg-surface-card border border-border group-hover:border-brand/40'
        }`}
        aria-label={label}
        aria-checked={checked}
        role="checkbox"
      >
        {checked && (
          <span className="ob-check-pop inline-flex">
            <Check size={12} strokeWidth={3} aria-hidden="true" />
          </span>
        )}
      </button>
      <div className="flex-1 min-w-0" onClick={onToggle}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[13px] ob-smooth-colors ${emphasis ? 'font-bold text-txt-primary' : checked ? 'text-txt-primary' : 'text-txt-secondary'}`}>
            {required && <span className="text-status-danger-text mr-1">*</span>}
            {label}
          </span>
          {link && (
            <Link
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] text-brand underline underline-offset-2 hover:opacity-80"
            >
              {link.label}
            </Link>
          )}
        </div>
        {hint && <p className="text-[11px] text-txt-tertiary mt-0.5">{hint}</p>}
      </div>
    </label>
  )
}
