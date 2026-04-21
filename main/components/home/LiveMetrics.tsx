'use client'

import { useEffect, useState } from 'react'

/**
 * LiveMetrics — 랜딩 Hero 하단에 공개 지표를 라이브로 노출.
 *
 * 원칙:
 *   - 각 지표가 baseline 이하면 노출하지 않음. "10+ 학생" 을 0 에서 과장하는 리스크 회피.
 *   - 실측 없을 때 컴포넌트 자체가 null 반환 — UI 에 아무것도 추가되지 않음.
 *   - 10분 edge cache 된 /api/metrics/public 을 단 한 번 fetch.
 */

interface Metrics {
  clubs_public: number
  active_opportunities: number
  profiles_public: number
  weekly_updates_recent: number
  public_universities: number
}

const BASELINE = {
  clubs_public: 5,
  active_opportunities: 10,
  profiles_public: 20,
  weekly_updates_recent: 10,
  public_universities: 2,
}

export function LiveMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/metrics/public', { cache: 'default' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setMetrics(d as Metrics)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  if (!metrics) return null

  // 지표별 baseline 통과한 것만 노출
  const items: { label: string; value: string }[] = []
  if (metrics.public_universities >= BASELINE.public_universities) {
    items.push({ label: '참여 대학', value: `${metrics.public_universities}곳` })
  }
  if (metrics.clubs_public >= BASELINE.clubs_public) {
    items.push({ label: '공개 동아리', value: `${metrics.clubs_public}개` })
  }
  if (metrics.active_opportunities >= BASELINE.active_opportunities) {
    items.push({ label: '진행 중 프로젝트', value: `${metrics.active_opportunities}개` })
  }
  if (metrics.weekly_updates_recent >= BASELINE.weekly_updates_recent) {
    items.push({ label: '최근 90일 주간 기록', value: `${metrics.weekly_updates_recent}건` })
  }

  if (items.length === 0) return null // 아직 baseline 부족 — 과장 방지

  return (
    <section
      aria-label="Draft 운영 지표"
      className="max-w-5xl mx-auto px-6 py-8"
    >
      <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 text-center">
        {items.map((item) => (
          <div key={item.label} className="flex items-baseline gap-2">
            <span className="text-[22px] font-bold text-txt-primary tabular-nums">{item.value}</span>
            <span className="text-[12px] text-txt-tertiary">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
