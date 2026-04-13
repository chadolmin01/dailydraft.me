'use client'

import React from 'react'

const clubs = [
  'FLIP',
  '멋쟁이사자처럼',
  'GDSC',
  '프로그라피',
  '넥스터즈',
  'UPF',
  'SOPT',
  'DND',
]

export const TrustMarquee: React.FC = () => {
  // animate-marquee(tailwind.config): translateX(0) → translateX(-50%)
  // 동일 목록을 2번 나열하면 -50%가 정확히 한 세트 분량 → 심리스 루프
  const doubled = [...clubs, ...clubs]

  return (
    <section className="border-y border-border py-5 overflow-hidden">
      <div className="flex animate-marquee w-max">
        {doubled.map((name, i) => (
          <span
            key={i}
            className="text-sm font-semibold text-txt-tertiary whitespace-nowrap mx-4 sm:mx-6"
          >
            {name}
            <span className="ml-4 sm:ml-6 select-none" aria-hidden="true">
              ·
            </span>
          </span>
        ))}
        {/* 끊김 방지: 앞쪽이 빠져나가는 순간 뒤쪽이 채워지도록 동일 세트 한 번 더 */}
        {doubled.map((name, i) => (
          <span
            key={`dup-${i}`}
            className="text-sm font-semibold text-txt-tertiary whitespace-nowrap mx-4 sm:mx-6"
            aria-hidden="true"
          >
            {name}
            <span className="ml-4 sm:ml-6 select-none" aria-hidden="true">
              ·
            </span>
          </span>
        ))}
      </div>
    </section>
  )
}
