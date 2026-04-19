'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react'

/**
 * 공개 상태 페이지.
 * 30초 간격으로 /api/health polling.
 */

interface HealthCheck {
  ok: boolean
  durationMs: number
  error?: string
}

interface HealthResponse {
  status: 'ok' | 'degraded'
  timestamp: string
  release: string
  env: string
  checks: {
    db: HealthCheck
    auth: HealthCheck
  }
}

type FetchState =
  | { phase: 'loading' }
  | { phase: 'ready'; data: HealthResponse; fetchedAt: Date }
  | { phase: 'error'; message: string }

export function StatusPageClient() {
  const [state, setState] = useState<FetchState>({ phase: 'loading' })

  useEffect(() => {
    let cancelled = false

    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' })
        if (!res.ok) {
          if (!cancelled) setState({ phase: 'error', message: `HTTP ${res.status}` })
          return
        }
        const data = (await res.json()) as HealthResponse
        if (!cancelled) setState({ phase: 'ready', data, fetchedAt: new Date() })
      } catch (err) {
        if (!cancelled) {
          setState({
            phase: 'error',
            message: err instanceof Error ? err.message : 'unknown',
          })
        }
      }
    }

    fetchHealth()
    const interval = setInterval(fetchHealth, 30_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return (
    <article className="max-w-none space-y-6">
      <header>
        <h1 className="text-[26px] font-black text-txt-primary mb-2">시스템 상태</h1>
        <p className="text-[13px] text-txt-secondary">
          Draft 핵심 시스템의 실시간 가용성을 공개합니다. 30초마다 자동 갱신됩니다.
        </p>
      </header>

      {state.phase === 'loading' && (
        <div className="bg-surface-card border border-border rounded-2xl p-6 flex items-center gap-3">
          <Clock size={18} className="text-txt-tertiary" />
          <span className="text-[13px] text-txt-tertiary">상태 확인 중...</span>
        </div>
      )}

      {state.phase === 'error' && (
        <div className="bg-status-danger-text/5 border border-status-danger-text/30 rounded-2xl p-6 flex items-start gap-3">
          <AlertTriangle size={18} className="text-status-danger-text shrink-0 mt-0.5" />
          <div>
            <h3 className="text-[14px] font-bold text-txt-primary mb-1">상태 확인 실패</h3>
            <p className="text-[12px] text-txt-secondary">{state.message}</p>
            <p className="text-[11px] text-txt-tertiary mt-2">
              이 화면이 계속 보이면 서비스에 광범위한 장애가 있을 수 있습니다.
            </p>
          </div>
        </div>
      )}

      {state.phase === 'ready' && (
        <>
          {/* 종합 상태 */}
          <OverallStatusCard status={state.data.status} />

          {/* 개별 체크 */}
          <section className="space-y-3">
            <h2 className="text-[13px] font-semibold text-txt-tertiary uppercase tracking-wider">
              개별 컴포넌트
            </h2>
            <div className="space-y-2">
              <CheckRow name="데이터베이스 (Supabase Postgres)" check={state.data.checks.db} />
              <CheckRow name="인증 서버 (Supabase Auth)" check={state.data.checks.auth} />
            </div>
          </section>

          {/* 메타 */}
          <footer className="text-[11px] text-txt-tertiary font-mono flex flex-wrap items-center gap-x-4 gap-y-1 pt-4 border-t border-border">
            <span>릴리스: {state.data.release}</span>
            <span>환경: {state.data.env}</span>
            <span>업데이트: {state.fetchedAt.toLocaleTimeString('ko-KR')}</span>
          </footer>
        </>
      )}

      {/* 연락처 */}
      <section className="text-[12px] text-txt-tertiary pt-4">
        <p>
          장애 관련 문의: <a href="mailto:ops@dailydraft.me" className="text-brand underline">ops@dailydraft.me</a>
        </p>
      </section>
    </article>
  )
}

function OverallStatusCard({ status }: { status: 'ok' | 'degraded' }) {
  const isOk = status === 'ok'
  return (
    <div
      className={`rounded-2xl p-6 flex items-center gap-4 ${
        isOk
          ? 'bg-brand/5 border border-brand/20'
          : 'bg-status-warn-bg border border-status-warn-text/30'
      }`}
    >
      {isOk ? (
        <CheckCircle2 size={28} className="text-brand shrink-0" />
      ) : (
        <AlertTriangle size={28} className="text-status-warn-text shrink-0" />
      )}
      <div>
        <h2 className="text-[18px] font-black text-txt-primary">
          {isOk ? '모든 시스템 정상' : '일부 시스템 장애'}
        </h2>
        <p className="text-[12px] text-txt-secondary mt-0.5">
          {isOk
            ? '핵심 서비스가 모두 정상 동작 중입니다.'
            : '일부 컴포넌트에 문제가 있습니다. 아래 상세를 확인해 주세요.'}
        </p>
      </div>
    </div>
  )
}

function CheckRow({ name, check }: { name: string; check: HealthCheck }) {
  return (
    <div className="bg-surface-card border border-border rounded-xl p-4 flex items-center gap-3">
      {check.ok ? (
        <CheckCircle2 size={16} className="text-brand shrink-0" />
      ) : (
        <AlertTriangle size={16} className="text-status-danger-text shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-txt-primary">{name}</div>
        {check.error && (
          <div className="text-[11px] text-status-danger-text mt-0.5 truncate">{check.error}</div>
        )}
      </div>
      <div className="text-[11px] font-mono text-txt-tertiary tabular-nums">
        {check.durationMs}ms
      </div>
    </div>
  )
}
