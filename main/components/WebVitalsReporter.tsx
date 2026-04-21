'use client'

import { useEffect } from 'react'
import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals'
import posthog from 'posthog-js'

/**
 * WebVitalsReporter — 클라이언트에서 Core Web Vitals 측정 → PostHog 이벤트 발송.
 *
 * 측정 지표:
 *   - LCP  Largest Contentful Paint  (사용자가 주요 콘텐츠 볼 때까지)
 *   - INP  Interaction to Next Paint (입력 반응성, FID 대체)
 *   - CLS  Cumulative Layout Shift   (레이아웃 튕김)
 *   - FCP  First Contentful Paint
 *   - TTFB Time To First Byte
 *
 * PostHog 로 전송 — dashboards 에서 routes·디바이스별 p75·p95 추적 가능.
 * 별도 Vercel Speed Insights 계약 없이 자체 데이터 축적.
 *
 * 루트 layout 에서 한 번만 마운트. navigation 간에도 계속 살아있음.
 */
export function WebVitalsReporter() {
  useEffect(() => {
    const report = (metric: Metric) => {
      try {
        posthog.capture('web_vitals', {
          name: metric.name,
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          rating: metric.rating, // 'good' | 'needs-improvement' | 'poor'
          delta: metric.delta,
          id: metric.id,
          navigation_type: metric.navigationType,
          page: typeof window !== 'undefined' ? window.location.pathname : undefined,
        })
      } catch {
        // PostHog 미초기화 상태 등에서 조용히 skip
      }
    }

    onLCP(report)
    onINP(report)
    onCLS(report)
    onFCP(report)
    onTTFB(report)
  }, [])

  return null
}
