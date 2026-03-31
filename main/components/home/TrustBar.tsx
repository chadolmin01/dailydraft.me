'use client'

import React from 'react'

const universities = [
  '서울대', '연세대', '고려대', 'KAIST', '성균관대', '한양대', '경희대', '서강대',
  '중앙대', '이화여대', '포항공대', '건국대', '동국대', '숙명여대', '홍익대', '세종대',
]

export const TrustBar: React.FC = () => {
  // Double the list for seamless loop
  const items = [...universities, ...universities]

  return (
    <section className="py-6 bg-surface-sunken border-y border-border overflow-hidden">
      <div className="group flex gap-4 animate-marquee hover:[animation-play-state:paused]">
        {items.map((uni, i) => (
          <span
            key={`${uni}-${i}`}
            className="shrink-0 px-3 py-1.5 text-xs font-medium text-txt-tertiary bg-surface-card rounded-full border border-border whitespace-nowrap"
          >
            {uni}
          </span>
        ))}
      </div>
    </section>
  )
}
