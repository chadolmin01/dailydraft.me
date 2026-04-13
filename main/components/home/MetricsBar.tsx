'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

/* ── 숫자 카운터 애니메이션 훅 ── */
function useCounter(target: number, duration: number, shouldStart: boolean) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!shouldStart) return

    const start = performance.now()
    let rafId: number

    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic: 빠르게 올라가다 서서히 멈추는 느낌
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * target))
      if (progress < 1) {
        rafId = requestAnimationFrame(tick)
      }
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [target, duration, shouldStart])

  return value
}

/* ── 개별 Metric 아이템 ── */
interface MetricProps {
  /** 카운터 애니메이션 대상 숫자. null이면 displayValue를 그대로 표시 */
  numericTarget: number | null
  /** 화면에 표시할 최종 텍스트 (카운터 불가 형식용) */
  displayValue: string
  label: string
  suffix?: string
  prefix?: string
  inView: boolean
  delay: number
}

const MetricItem: React.FC<MetricProps> = ({
  numericTarget,
  displayValue,
  label,
  suffix = '',
  prefix = '',
  inView,
  delay,
}) => {
  const counter = useCounter(numericTarget ?? 0, 1600, inView)

  // 카운터 가능한 경우 숫자 애니메이션, 아니면 displayValue 그대로
  const rendered =
    numericTarget !== null
      ? `${prefix}${counter.toLocaleString()}${suffix}`
      : displayValue

  return (
    <motion.div
      className="flex flex-col items-center gap-1.5 px-4 sm:px-8"
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] as const }}
    >
      <span className="text-3xl sm:text-4xl font-extrabold text-txt-primary tracking-tight">
        {rendered}
      </span>
      <span className="text-sm text-txt-tertiary">{label}</span>
    </motion.div>
  )
}

/* ── MetricsBar 메인 ── */
const metrics: Omit<MetricProps, 'inView' | 'delay'>[] = [
  {
    numericTarget: 47,
    displayValue: '47',
    label: '등록 동아리',
  },
  {
    numericTarget: 1200,
    displayValue: '1,200+',
    label: '활동 멤버',
    suffix: '+',
  },
  {
    numericTarget: null,
    displayValue: '3시간 → 0분',
    label: '주간 추적 시간',
  },
  {
    numericTarget: 5,
    displayValue: '5분',
    label: '평균 인수인계 시간',
    suffix: '분',
  },
]

export const MetricsBar: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })

  return (
    <section ref={ref} className="py-20 px-4">
      <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-y-10">
        {metrics.map((m, i) => (
          <MetricItem
            key={m.label}
            {...m}
            inView={inView}
            delay={i * 0.1}
          />
        ))}
      </div>
    </section>
  )
}
