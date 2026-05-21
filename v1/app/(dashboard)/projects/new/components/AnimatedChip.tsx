'use client'

import React, { useState, useCallback } from 'react'

interface AnimatedChipProps {
  label: string
  selected: boolean
  onToggle: () => void
  selectedClass: string
  unselectedClass: string
}

export function AnimatedChip({ label, selected, onToggle, selectedClass, unselectedClass }: AnimatedChipProps) {
  const [bouncing, setBouncing] = useState(false)

  const handleClick = useCallback(() => {
    onToggle()
    setBouncing(true)
  }, [onToggle])

  return (
    <button
      type="button"
      onClick={handleClick}
      onAnimationEnd={() => setBouncing(false)}
      className={`px-2.5 py-1 text-xs border rounded-lg transition-all active:scale-[0.93] ${bouncing ? 'chip-bounce' : ''} ${selected ? selectedClass : unselectedClass}`}
    >
      {label}
    </button>
  )
}
