'use client'

import { useState, useRef, useEffect } from 'react'
import { Pencil } from 'lucide-react'

/* ── Shared base props ── */
interface EditableFieldBaseProps {
  value: string
  draft: string | undefined
  placeholder?: string
  onEdit: (val: string) => void
  /** Display text when not editing (e.g. slug→label). Falls back to draft ?? value. */
  displayValue?: string
}

/* ── Inline variant (text / textarea) ── */
interface InlineVariantProps extends EditableFieldBaseProps {
  variant: 'inline'
  className?: string
  multiline?: boolean
}

/* ── Link variant (icon + label) ── */
interface LinkVariantProps extends EditableFieldBaseProps {
  variant: 'link'
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
}

type EditableFieldProps = InlineVariantProps | LinkVariantProps

export function EditableField(props: EditableFieldProps) {
  const { value, draft, placeholder, onEdit, displayValue } = props
  const [editing, setEditing] = useState(false)
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const editValue = draft ?? value
  const display = displayValue && !editing ? displayValue : editValue
  const isChanged = draft !== undefined && draft !== value

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus()
      if ('select' in ref.current) ref.current.select()
    }
  }, [editing])

  const close = () => setEditing(false)

  /* ═══════════ INLINE variant ═══════════ */
  if (props.variant === 'inline') {
    const { className, multiline } = props

    if (editing) {
      if (multiline) {
        return (
          <textarea
            ref={ref as React.RefObject<HTMLTextAreaElement>}
            value={display}
            onChange={(e) => onEdit(e.target.value)}
            onBlur={close}
            onKeyDown={(e) => { if (e.key === 'Escape') close() }}
            placeholder={placeholder}
            rows={3}
            className={`bg-surface-bg border border-border rounded-xl outline-hidden w-full px-2 py-1.5 resize-none focus:border-brand transition-colors ${className || ''}`}
          />
        )
      }

      return (
        <input
          ref={ref as React.RefObject<HTMLInputElement>}
          value={display}
          onChange={(e) => onEdit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Escape') close()
          }}
          onBlur={close}
          placeholder={placeholder}
          className={`bg-surface-bg border border-border rounded-xl outline-hidden w-full px-2 py-0.5 focus:border-brand transition-colors ${className || ''}`}
        />
      )
    }

    return (
      <span
        className="group/edit inline-flex items-center gap-1 cursor-pointer rounded-lg px-1 -mx-1 hover:bg-surface-sunken/60 transition-colors"
        onClick={() => setEditing(true)}
        title="클릭하여 수정"
      >
        <span className={`${display ? '' : 'text-txt-disabled italic'} ${isChanged ? 'text-brand' : ''}`}>
          {display || placeholder}
        </span>
        <Pencil size={9} className="opacity-0 group-hover/edit:opacity-40 transition-opacity shrink-0" />
      </span>
    )
  }

  /* ═══════════ LINK variant ═══════════ */
  const { icon: Icon, label } = props

  if (editing) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 border border-border">
        <Icon size={13} className="text-txt-tertiary shrink-0" />
        <input
          ref={ref as React.RefObject<HTMLInputElement>}
          value={display}
          onChange={(e) => onEdit(e.target.value)}
          onBlur={close}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') close() }}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent outline-hidden text-xs text-txt-primary placeholder:text-txt-disabled"
        />
      </div>
    )
  }

  if (display) {
    return (
      <div
        className="group/link flex items-center gap-2.5 px-2 py-1.5 text-xs text-txt-secondary hover:bg-surface-sunken hover:text-txt-primary transition-colors border border-transparent hover:border-border cursor-pointer"
        onClick={() => setEditing(true)}
        title="클릭하여 수정"
      >
        <Icon size={13} className="text-txt-tertiary" />
        <span className={`flex-1 truncate ${isChanged ? 'text-brand' : ''}`}>{display}</span>
        <Pencil size={9} className="opacity-0 group-hover/link:opacity-40 transition-opacity shrink-0" />
      </div>
    )
  }

  return (
    <div
      className="group/link flex items-center gap-2.5 px-2 py-1.5 text-xs text-txt-disabled hover:bg-surface-sunken hover:text-txt-tertiary transition-colors border border-border cursor-pointer"
      onClick={() => setEditing(true)}
      title="클릭하여 추가"
    >
      <Icon size={13} />
      <span className="flex-1 italic">{label} 추가</span>
      <Pencil size={9} className="opacity-0 group-hover/link:opacity-40 transition-opacity shrink-0" />
    </div>
  )
}
