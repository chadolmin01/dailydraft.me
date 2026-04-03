'use client'

import React, { useState } from 'react'
import { GripVertical, ChevronUp, ChevronDown, Check } from 'lucide-react'
import type { DragRankItem } from '@/src/lib/onboarding/types'

interface DragRankProps {
  items: DragRankItem[]
  onConfirm: (orderedItems: DragRankItem[]) => void
}

export const DragRank: React.FC<DragRankProps> = ({ items: initialItems, onConfirm }) => {
  const [items, setItems] = useState(initialItems)
  const [confirmed, setConfirmed] = useState(false)
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null)

  const moveItem = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= items.length || confirmed) return
    const next = [...items]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    setItems(next)
  }

  const handleConfirm = () => {
    if (confirmed) return
    setConfirmed(true)
    setTimeout(() => onConfirm(items), 300)
  }

  // Touch drag handlers
  const handleDragStart = (e: React.DragEvent, idx: number) => {
    if (confirmed) return
    setDraggingIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(idx))
  }

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (draggingIdx === null || draggingIdx === idx) return
    moveItem(draggingIdx, idx)
    setDraggingIdx(idx)
  }

  const handleDragEnd = () => {
    setDraggingIdx(null)
  }

  return (
    <div className="mt-3">
      <div className="space-y-1.5">
        {items.map((item, idx) => (
          <div
            key={item.id}
            draggable={!confirmed}
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            className={`ob-chip flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all duration-200 ${
              confirmed
                ? idx < 2
                  ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                  : 'bg-surface-sunken border-border opacity-60'
                : draggingIdx === idx
                  ? 'bg-brand/5 border-brand shadow-md scale-[1.02]'
                  : 'bg-surface-card border-border hover:border-surface-inverse'
            }`}
            style={{ animationDelay: `${idx * 50}ms`, cursor: confirmed ? 'default' : 'grab' }}
          >
            {!confirmed && (
              <GripVertical size={14} className="text-txt-disabled shrink-0" />
            )}
            <span className={`text-[13px] font-bold tabular-nums w-5 ${
              confirmed && idx < 2 ? 'text-white/70' : 'text-txt-disabled'
            }`}>
              {idx + 1}
            </span>
            <span className="text-base">{item.emoji}</span>
            <span className={`text-[13px] font-medium flex-1 ${
              confirmed && idx >= 2 ? 'text-txt-disabled' : confirmed ? '' : 'text-txt-primary'
            }`}>
              {item.label}
            </span>
            {!confirmed && (
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveItem(idx, idx - 1)}
                  disabled={idx === 0}
                  className="p-0.5 text-txt-disabled hover:text-txt-primary disabled:opacity-30 transition-colors"
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  onClick={() => moveItem(idx, idx + 1)}
                  disabled={idx === items.length - 1}
                  className="p-0.5 text-txt-disabled hover:text-txt-primary disabled:opacity-30 transition-colors"
                >
                  <ChevronDown size={12} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      {!confirmed && (
        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-[10px] text-txt-disabled font-mono">드래그하거나 화살표로 순서 변경</span>
          <button
            onClick={handleConfirm}
            className="ob-hover flex items-center gap-1.5 px-4 py-2 bg-surface-inverse text-txt-inverse text-[12px] font-bold rounded-lg hover:opacity-90 active:scale-[0.97] transition-all"
          >
            <Check size={12} />
            확인
          </button>
        </div>
      )}
    </div>
  )
}
