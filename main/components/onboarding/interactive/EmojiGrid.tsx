'use client'

import React, { useState } from 'react'
import { Check } from 'lucide-react'
import type { EmojiGridOption } from '@/src/lib/onboarding/types'

interface EmojiGridProps {
  options: EmojiGridOption[]
  minSelect: number
  maxSelect: number
  onChange: (selected: EmojiGridOption[], ready: boolean) => void
}

// All 15 pairs (6C2), stored as sorted key for easy lookup
const STRENGTH_COMMENTS: Record<string, string> = {
  'communication,planning': 'PM 타입이시네요!',
  'implementation,problem_solving': '팀의 해결사 스타일!',
  'design,planning': '기획부터 디자인까지 👀',
  'communication,leadership': '팀을 이끄는 타입!',
  'design,implementation': '만들면서 다듬는 타입!',
  'implementation,leadership': '직접 뛰는 리더!',
  'planning,problem_solving': '전략적 사고의 달인!',
  'communication,design': '감각과 소통 둘 다! ✨',
  'leadership,problem_solving': '위기에 강한 리더!',
  'leadership,planning': '계획형 리더 스타일!',
  'implementation,planning': '기획도 하고 직접 만드는 타입!',
  'communication,implementation': '소통하면서 바로 실행!',
  'design,problem_solving': '디테일에 강한 문제 해결사!',
  'design,leadership': '비전을 그리는 리더!',
  'communication,problem_solving': '대화로 풀어내는 스타일!',
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join(',')
}

function getComment(ids: string[]): string {
  if (ids.length === 0) return '자신 있는 걸 골라주세요'
  if (ids.length === 1) return '더 골라도 돼요!'

  // Try latest 2 first, then all pairs
  const pairs: [number, number][] = ids.length === 2
    ? [[0, 1]]
    : [[1, 2], [0, 2], [0, 1]]

  for (const [i, j] of pairs) {
    const key = pairKey(ids[i], ids[j])
    if (STRENGTH_COMMENTS[key]) return STRENGTH_COMMENTS[key]
  }

  return '멋진 조합이에요! 💪'
}

export const EmojiGrid: React.FC<EmojiGridProps> = ({ options, minSelect, maxSelect, onChange }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [orderedIds, setOrderedIds] = useState<string[]>([])

  const toggleOption = (id: string) => {
    const next = new Set(selected)
    let nextOrdered = [...orderedIds]
    if (next.has(id)) {
      next.delete(id)
      nextOrdered = nextOrdered.filter(i => i !== id)
    } else if (next.size < maxSelect) {
      next.add(id)
      nextOrdered.push(id)
    }
    setSelected(next)
    setOrderedIds(nextOrdered)
    const selectedOptions = options.filter(o => next.has(o.id))
    onChange(selectedOptions, next.size >= minSelect)
  }

  const cols = options.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'
  const comment = getComment(orderedIds)

  return (
    <div>
      <p className="text-[15px] font-semibold text-txt-secondary text-center mb-4 transition-all duration-200">
        {comment}
      </p>
      <div className={`grid ${cols} gap-3`}>
        {options.map((option, i) => {
          const isSelected = selected.has(option.id)
          return (
            <button
              key={option.id}
              onClick={() => toggleOption(option.id)}
              className={`relative flex flex-col items-center justify-center px-3 py-5 rounded-2xl border-2 transition-all duration-200 active:scale-[0.95] ${
                isSelected
                  ? 'bg-brand border-brand scale-[0.97]'
                  : 'bg-surface-card border-border hover:border-brand'
              }`}
              style={{
                animation: 'ob-chip-in 0.35s cubic-bezier(0.34,1.4,0.64,1) both',
                animationDelay: `${i * 35}ms`,
              }}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-white/90 rounded-full flex items-center justify-center">
                  <Check size={11} className="text-brand" strokeWidth={2.5} />
                </div>
              )}
              <span className="text-3xl mb-2 leading-none">{option.emoji}</span>
              <span className={`text-[12px] font-bold ${isSelected ? 'text-white' : 'text-txt-primary'}`}>
                {option.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
