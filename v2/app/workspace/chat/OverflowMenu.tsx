'use client'

import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal } from 'lucide-react'

/**
 * 라이트 패널용 dropdown menu — 좌상단 요소들 (email · 도움말 · 설정 · 로그아웃 · 대화 액션) 컴팩트화.
 * 의도: 헤더가 워크스페이스 이름만 보이고 나머지는 ⋯ 버튼 안에 숨김.
 *
 * 외부 click / Escape / focus loss 로 닫힘. 메뉴 항목 click → onSelect 호출 후 자동 닫힘.
 */

export interface MenuItem {
  /** divider 라면 'divider' — 그 외엔 보통 button. label 은 사용자 보이는 텍스트. */
  kind?: 'item' | 'divider' | 'label'
  label?: string
  /** label item 의 보조 텍스트 (예: email 표시) */
  hint?: string
  icon?: React.ReactNode
  onClick?: () => void
  /** danger 색상으로 (logout, clear 등) */
  danger?: boolean
  disabled?: boolean
}

interface OverflowMenuProps {
  label?: string
  items: MenuItem[]
  align?: 'left' | 'right'
}

export function OverflowMenu({ label = '더 보기', items, align = 'right' }: OverflowMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className="h-8 w-8 inline-flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-surface-card transition-colors"
      >
        <MoreHorizontal size={16} />
      </button>
      {open ? (
        <div
          role="menu"
          className={`absolute top-full mt-1 min-w-[200px] rounded-lg border border-hairline bg-canvas shadow-lg py-1 z-30 chat-bubble-in ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {items.map((item, i) => {
            if (item.kind === 'divider') {
              return <div key={i} className="my-1 border-t border-hairline-soft" aria-hidden />
            }
            if (item.kind === 'label') {
              return (
                <div
                  key={i}
                  className="px-3 py-1.5 text-caption text-muted-soft truncate"
                  title={item.label}
                >
                  {item.label}
                  {item.hint ? (
                    <span className="block text-caption text-muted-soft truncate">
                      {item.hint}
                    </span>
                  ) : null}
                </div>
              )
            }
            return (
              <button
                key={i}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  item.onClick?.()
                  setOpen(false)
                }}
                className={`w-full px-3 py-2 flex items-center gap-2.5 text-body-sm text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  item.danger
                    ? 'text-ink hover:bg-surface-soft'
                    : 'text-body hover:bg-surface-soft hover:text-ink'
                }`}
              >
                {item.icon ? (
                  <span className="shrink-0 text-muted-soft inline-flex items-center justify-center w-4">
                    {item.icon}
                  </span>
                ) : null}
                <span className="truncate">{item.label}</span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
