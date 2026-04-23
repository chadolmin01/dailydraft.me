'use client'

import { PROJECT_CATEGORIES } from '@/src/constants/categories'
import { chipClass } from '../parts/chipClass'

interface InterestsStepProps {
  interests: string[]
  attempted: boolean
  onToggle: (slug: string) => void
}

export function InterestsStep({ interests, attempted, onToggle }: InterestsStepProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PROJECT_CATEGORIES.map((c) => (
        <button
          key={c.slug}
          onClick={() => onToggle(c.slug)}
          className={chipClass(interests.includes(c.slug), 'md', attempted && interests.length === 0)}
        >
          {c.label}
        </button>
      ))}
    </div>
  )
}
