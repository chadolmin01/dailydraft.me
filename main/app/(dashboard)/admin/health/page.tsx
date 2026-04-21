'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAdmin } from '@/src/hooks/useAdmin'
import { Activity, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'

/**
 * /admin/health — Platform 내부 헬스 모니터링.
 *
 * 공개 /status 와 달리:
 *   - 10초 간격 polling (공개 페이지는 30초)
 *   - 최근 60 샘플 시계열 표시 (SVG 스파크라인)
 *   - p50·p95·p99 응답 시간 통계
 *   - 기기 정보(릴리스·환경) 노출
 *
 * Platform admin only.
 */

interface HealthSample {
  t: number
  ok: boolean
  dbMs: number
  authMs: number
  err?: string
}

interface HealthResponse {
  status: 'ok' | 'degraded'
  timestamp: string
  release: string
  env: string
  checks: {
    db: { ok: boolean; durationMs: number; error?: string }
    auth: { ok: boolean; durationMs: number; error?: string }
  }
}

const MAX_SAMPLES = 60
const POLL_MS = 10_000

function quantile(nums: number[], q: number): number {
  if (nums.length === 0) return 0
  const sorted = [...nums].sort((a, b) => a - b)
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  if (lo === hi) return sorted[lo]
  return Math.round(sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo))
}

export default function AdminHealthPage() {
  const router = useRouter()
  const { isAdmin, isLoading: adminLoading } = useAdmin()
  const [samples, setSamples] = useState<HealthSample[]>([])
  const [latest, setLatest] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    if (!adminLoading && !isAdmin) router.push('/explore')
  }, [adminLoading, isAdmin, router])

  useEffect(() => {
    if (!isAdmin) return
    mounted.current = true

    const tick = async () => {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const body = await res.json()
        const data = (body.data ?? body) as HealthResponse
        if (!mounted.current) return
        setLatest(data)
        setError(null)
        setSamples((prev) => {
          const next = [
            ...prev,
            {
              t: Date.now(),
              ok: data.status === 'ok',
              dbMs: data.checks.db.durationMs,
              authMs: data.checks.auth.durationMs,
              err: data.checks.db.error ?? data.checks.auth.error,
            },
          ]
          return next.slice(-MAX_SAMPLES)
        })
      } catch (e) {
        if (!mounted.current) return
        setError(e instanceof Error ? e.message : 'unknown')
      }
    }

    tick()
    const id = setInterval(tick, POLL_MS)
    return () => {
      mounted.current = false
      clearInterval(id)
    }
  }, [isAdmin])

  if (adminLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-txt-tertiary" size={24} /></div>
  }
  if (!isAdmin) return null

  const dbTimes = samples.map((s) => s.dbMs)
  const authTimes = samples.map((s) => s.authMs)
  const uptimePct = samples.length === 0 ? 100 : (samples.filter((s) => s.ok).length / samples.length) * 100

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8">
      <div className="border-b border-border pb-6">
        <div className="text-[10px] font-medium text-txt-tertiary mb-2 flex items-center gap-2">
          <Activity size={14} />
          Admin / Health Monitor
        </div>
        <h1 className="text-3xl font-bold text-txt-primary tracking-tight">실시간 헬스 모니터링</h1>
        <p className="text-txt-tertiary text-sm mt-1">
          10초 간격 /api/health 폴링. 최근 {MAX_SAMPLES} 샘플(최대 10분) 보관, 페이지 벗어나면 초기화.
        </p>
      </div>

      {/* Overall */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className={`bg-surface-card border rounded-2xl p-5 ${latest?.status === 'ok' ? 'border-brand/30' : 'border-status-warn-text/30'}`}>
          <div className="flex items-center gap-3">
            {latest?.status === 'ok' ? (
              <CheckCircle2 size={22} className="text-brand shrink-0" />
            ) : latest?.status === 'degraded' ? (
              <AlertTriangle size={22} className="text-status-warn-text shrink-0" />
            ) : (
              <Loader2 size={22} className="animate-spin text-txt-tertiary shrink-0" />
            )}
            <div>
              <div className="text-[11px] text-txt-tertiary">현 상태</div>
              <div className="text-[16px] font-bold text-txt-primary">
                {latest ? (latest.status === 'ok' ? '정상' : '일부 장애') : '확인 중'}
              </div>
            </div>
          </div>
          {error && <p className="text-[11px] text-status-danger-text mt-2">⚠ {error}</p>}
        </div>
        <div className="bg-surface-card border border-border rounded-2xl p-5">
          <div className="text-[11px] text-txt-tertiary mb-1">최근 {samples.length} 샘플 성공률</div>
          <div className="text-[22px] font-bold font-mono text-txt-primary tabular-nums">{uptimePct.toFixed(1)}%</div>
        </div>
        <div className="bg-surface-card border border-border rounded-2xl p-5">
          <div className="text-[11px] text-txt-tertiary mb-1">릴리스 · 환경</div>
          <div className="text-[13px] font-mono text-txt-primary">
            {latest?.release ?? '-'} · {latest?.env ?? '-'}
          </div>
        </div>
      </section>

      {/* Latency stats */}
      <section>
        <h2 className="text-[10px] font-medium text-txt-tertiary mb-3">응답 시간 분포</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LatencyCard title="Supabase DB" times={dbTimes} />
          <LatencyCard title="Supabase Auth" times={authTimes} />
        </div>
      </section>

      <p className="text-[11px] text-txt-tertiary pt-6 border-t border-border-subtle">
        공개 상태 페이지(/status)는 30초 폴링·최근 30일 인시던트 이력을 외부에 노출합니다. 본 페이지는
        내부 on-call 용이며 샘플은 메모리 전용입니다.
      </p>
    </div>
  )
}

function LatencyCard({ title, times }: { title: string; times: number[] }) {
  const p50 = quantile(times, 0.5)
  const p95 = quantile(times, 0.95)
  const p99 = quantile(times, 0.99)
  const max = Math.max(...times, 100)

  const W = 400
  const H = 80
  const P = 4
  const points = times
    .map((v, i) => {
      const x = (i / Math.max(times.length - 1, 1)) * (W - P * 2) + P
      const y = H - P - (v / max) * (H - P * 2)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <div className="bg-surface-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-semibold text-txt-primary">{title}</h3>
        <div className="text-[11px] font-mono tabular-nums text-txt-tertiary flex gap-3">
          <span>p50 <span className="text-txt-primary font-bold">{p50}ms</span></span>
          <span>p95 <span className="text-txt-primary font-bold">{p95}ms</span></span>
          <span>p99 <span className="text-txt-primary font-bold">{p99}ms</span></span>
        </div>
      </div>
      {times.length < 2 ? (
        <div className="h-20 flex items-center justify-center text-[12px] text-txt-tertiary">샘플 수집 중...</div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20" preserveAspectRatio="none" role="img" aria-label={`${title} 응답 시간 추이`}>
          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-brand"
          />
        </svg>
      )}
      <div className="flex items-center justify-between text-[10px] text-txt-tertiary mt-2">
        <span>샘플 {times.length}</span>
        <span>최대 {max}ms</span>
      </div>
    </div>
  )
}
