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

          {/* SLO / 목표치 — 엔터프라이즈 실사 대응 공개 지표 */}
          <section className="space-y-3">
            <h2 className="text-[13px] font-semibold text-txt-tertiary uppercase tracking-wider">
              서비스 수준 목표 (SLO)
            </h2>
            <div className="bg-surface-card border border-border rounded-xl divide-y divide-border">
              <SloRow label="가용성 (Uptime)" target="99.9%" description="월간 누적, 계획 유지보수 제외" />
              <SloRow label="P95 API 응답" target="< 800ms" description="/api/* 경로, 콜드 스타트 제외" />
              <SloRow label="인시던트 복구 (RTO)" target="< 4시간" description="서비스 등급 SEV-0·SEV-1 기준" />
              <SloRow label="데이터 손실 허용 (RPO)" target="< 24시간" description="Supabase 자동 백업 주기" />
              <SloRow label="보안 이슈 초기 응답" target="< 72시간" description="공개 또는 비공개 디스클로저 수령 시점부터" />
            </div>
          </section>

          {/* 인시던트 이력 — 공개 투명성 */}
          <IncidentHistory />


          {/* 메타 */}
          <footer className="text-[11px] text-txt-tertiary font-mono flex flex-wrap items-center gap-x-4 gap-y-1 pt-4 border-t border-border">
            <span>릴리스: {state.data.release}</span>
            <span>환경: {state.data.env}</span>
            <span>업데이트: {state.fetchedAt.toLocaleTimeString('ko-KR')}</span>
          </footer>
        </>
      )}

      {/* 연락처 */}
      <section className="text-[12px] text-txt-tertiary pt-4 space-y-1">
        <p>
          장애·보안 관련 문의:{' '}
          <a href="mailto:team@dailydraft.me" className="text-brand underline">
            team@dailydraft.me
          </a>
        </p>
        <p>
          응답 SLA: 영업일 기준 72시간 이내 초기 응답, 심각도 SEV-0·SEV-1 사안은 24시간 이내.
        </p>
      </section>
    </article>
  )
}

// 공개 인시던트 이력 — /api/status/incidents 를 polling 하여 최근 30일 표시.
// 비어있으면 "공개된 인시던트 없음" placeholder, 있으면 타임라인 카드 리스트.
interface IncidentRow {
  id: string
  title: string
  severity: 'sev0' | 'sev1' | 'sev2' | 'sev3'
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
  started_at: string
  resolved_at: string | null
  affected_components: string[] | null
  summary: string
}

const SEVERITY_STYLE: Record<IncidentRow['severity'], { label: string; color: string }> = {
  sev0: { label: 'SEV-0', color: 'bg-status-danger-text text-white' },
  sev1: { label: 'SEV-1', color: 'bg-status-danger-text/80 text-white' },
  sev2: { label: 'SEV-2', color: 'bg-status-warn-text text-white' },
  sev3: { label: 'SEV-3', color: 'bg-txt-tertiary text-white' },
}

const STATUS_LABEL: Record<IncidentRow['status'], string> = {
  investigating: '조사 중',
  identified: '원인 파악',
  monitoring: '모니터링',
  resolved: '해결됨',
}

function IncidentHistory() {
  const [incidents, setIncidents] = useState<IncidentRow[] | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/status/incidents', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { incidents: [] }))
      .then((d: { incidents?: IncidentRow[] }) => {
        if (!cancelled) {
          setIncidents(d.incidents ?? [])
          setLoaded(true)
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!loaded) {
    return (
      <section className="space-y-3">
        <h2 className="text-[13px] font-semibold text-txt-tertiary uppercase tracking-wider">
          최근 30일 인시던트
        </h2>
        <div className="h-20 bg-surface-card border border-border rounded-xl skeleton-shimmer" />
      </section>
    )
  }

  const isEmpty = !incidents || incidents.length === 0

  return (
    <section className="space-y-3">
      <h2 className="text-[13px] font-semibold text-txt-tertiary uppercase tracking-wider">
        최근 30일 인시던트
      </h2>
      {isEmpty ? (
        <div className="bg-surface-card border border-border rounded-xl p-5 flex items-center gap-3">
          <CheckCircle2 size={18} className="text-brand shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-txt-primary">공개된 인시던트 없음</p>
            <p className="text-[11px] text-txt-tertiary mt-0.5">
              SEV-0·SEV-1 등급 장애가 발생하면 이 섹션에서 타임라인·원인·후속 조치를 공개합니다.
            </p>
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {(incidents ?? []).map((i) => {
            const sev = SEVERITY_STYLE[i.severity]
            return (
              <li key={i.id} className="bg-surface-card border border-border rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className={`shrink-0 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${sev.color}`}>
                    {sev.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-txt-primary">{i.title}</p>
                    <p className="text-[12px] text-txt-secondary mt-1 leading-relaxed">{i.summary}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-2 text-[11px] text-txt-tertiary">
                      <span>{STATUS_LABEL[i.status]}</span>
                      <span>·</span>
                      <span>시작 {new Date(i.started_at).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      {i.resolved_at && (
                        <>
                          <span>·</span>
                          <span>해결 {new Date(i.resolved_at).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </>
                      )}
                      {i.affected_components && i.affected_components.length > 0 && (
                        <>
                          <span>·</span>
                          <span>영향: {i.affected_components.join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function SloRow({ label, target, description }: { label: string; target: string; description: string }) {
  return (
    <div className="p-4 flex items-start gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-txt-primary">{label}</div>
        <div className="text-[11px] text-txt-tertiary mt-0.5">{description}</div>
      </div>
      <div className="text-[13px] font-mono font-bold text-brand tabular-nums shrink-0">
        {target}
      </div>
    </div>
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
