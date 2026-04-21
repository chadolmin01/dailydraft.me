'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Plus, Shield, X, Check, Loader2 } from 'lucide-react'
import { useAdmin } from '@/src/hooks/useAdmin'
import { toast } from 'sonner'

/**
 * /admin/incidents — 플랫폼 관리자용 인시던트 관리.
 *
 * 기능:
 *   - 최근 인시던트 리스트
 *   - 새 인시던트 생성 (title·severity·summary·status)
 *   - 상태 전환 (investigating → identified → monitoring → resolved)
 *   - resolved 시 resolved_at 자동
 *
 * 생성 즉시 /status 의 "최근 30일 인시던트" 섹션에 자동 노출.
 */

interface Incident {
  id: string
  title: string
  severity: 'sev0' | 'sev1' | 'sev2' | 'sev3'
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
  started_at: string
  resolved_at: string | null
  summary: string
  affected_components: string[] | null
}

const SEV_LABEL: Record<Incident['severity'], string> = {
  sev0: 'SEV-0',
  sev1: 'SEV-1',
  sev2: 'SEV-2',
  sev3: 'SEV-3',
}

const STATUS_LABEL: Record<Incident['status'], string> = {
  investigating: '조사 중',
  identified: '원인 파악',
  monitoring: '모니터링',
  resolved: '해결됨',
}

export default function AdminIncidentsPage() {
  const router = useRouter()
  const { isAdmin, isLoading: adminLoading } = useAdmin()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    if (!adminLoading && !isAdmin) router.push('/explore')
  }, [adminLoading, isAdmin, router])

  const refresh = async () => {
    const res = await fetch('/api/status/incidents?limit=50', { cache: 'no-store' })
    const data = await res.json()
    setIncidents(data.incidents ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (isAdmin) refresh()
  }, [isAdmin])

  const updateStatus = async (id: string, status: Incident['status']) => {
    const res = await fetch(`/api/admin/incidents?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      toast.success('상태가 업데이트되었습니다')
      refresh()
    } else {
      toast.error('업데이트 실패')
    }
  }

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-txt-tertiary" size={24} />
      </div>
    )
  }
  if (!isAdmin) return null

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <div className="text-[10px] font-medium text-txt-tertiary mb-2 flex items-center gap-2">
            <Shield size={14} />
            Admin / Incidents
          </div>
          <h1 className="text-3xl font-bold text-txt-primary tracking-tight">인시던트 관리</h1>
          <p className="text-txt-tertiary text-sm mt-1">
            생성·업데이트 즉시 <a href="/status" className="text-brand underline">공개 /status 페이지</a> 에 노출됩니다.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-surface-inverse text-txt-inverse text-[13px] font-bold rounded-xl hover:opacity-90 transition-opacity"
        >
          <Plus size={14} />
          새 인시던트
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 skeleton-shimmer rounded-xl" />
          ))}
        </div>
      ) : incidents.length === 0 ? (
        <div className="bg-surface-card border border-border rounded-2xl p-10 text-center">
          <AlertTriangle size={32} className="text-txt-disabled mx-auto mb-3" aria-hidden="true" />
          <p className="text-[15px] font-semibold text-txt-primary mb-1">기록된 인시던트 없음</p>
          <p className="text-[13px] text-txt-tertiary">새 인시던트를 생성하면 /status 페이지에 자동 노출됩니다.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {incidents.map((i) => (
            <li key={i.id} className="bg-surface-card border border-border rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className={`shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded ${severityClass(i.severity)}`}>
                  {SEV_LABEL[i.severity]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-txt-primary">{i.title}</p>
                  <p className="text-[12px] text-txt-secondary mt-1 leading-relaxed">{i.summary}</p>
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-txt-tertiary flex-wrap">
                    <span className="font-mono">{STATUS_LABEL[i.status]}</span>
                    <span>·</span>
                    <span>{new Date(i.started_at).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                    {i.resolved_at && (
                      <>
                        <span>·</span>
                        <span>해결 {new Date(i.resolved_at).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </>
                    )}
                  </div>
                </div>
                {i.status !== 'resolved' && (
                  <select
                    value={i.status}
                    onChange={(e) => updateStatus(i.id, e.target.value as Incident['status'])}
                    className="shrink-0 text-[11px] px-2 py-1 bg-surface-sunken border border-border rounded"
                  >
                    <option value="investigating">조사 중</option>
                    <option value="identified">원인 파악</option>
                    <option value="monitoring">모니터링</option>
                    <option value="resolved">해결됨</option>
                  </select>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {showCreate && <CreateIncidentModal onClose={() => setShowCreate(false)} onCreated={refresh} />}
    </div>
  )
}

function severityClass(sev: Incident['severity']): string {
  switch (sev) {
    case 'sev0': return 'bg-status-danger-text text-white'
    case 'sev1': return 'bg-status-danger-text/80 text-white'
    case 'sev2': return 'bg-status-warn-text text-white'
    case 'sev3': return 'bg-txt-tertiary text-white'
  }
}

function CreateIncidentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [severity, setSeverity] = useState<Incident['severity']>('sev2')
  const [creating, setCreating] = useState(false)

  const submit = async () => {
    if (!title.trim() || !summary.trim()) return
    setCreating(true)
    const res = await fetch('/api/admin/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, summary, severity, status: 'investigating' }),
    })
    setCreating(false)
    if (res.ok) {
      toast.success('인시던트가 생성되었습니다')
      onCreated()
      onClose()
    } else {
      toast.error('생성 실패')
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="인시던트 생성" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-surface-card rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-txt-primary">새 인시던트</h2>
          <button onClick={onClose} aria-label="닫기">
            <X size={18} className="text-txt-tertiary" aria-hidden="true" />
          </button>
        </div>
        <div className="space-y-2">
          <label className="block text-[11px] font-semibold text-txt-secondary">제목</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: DB timeout during morning peak"
            className="w-full px-3 py-2 text-[13px] bg-surface-sunken border border-border rounded-lg"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-[11px] font-semibold text-txt-secondary">심각도</label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as Incident['severity'])}
            className="w-full px-3 py-2 text-[13px] bg-surface-sunken border border-border rounded-lg"
          >
            <option value="sev0">SEV-0 — 전면 장애</option>
            <option value="sev1">SEV-1 — 주요 기능 장애</option>
            <option value="sev2">SEV-2 — 일부 기능 열화</option>
            <option value="sev3">SEV-3 — 경미</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-[11px] font-semibold text-txt-secondary">공개 요약</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="사용자가 보게 될 1~3 문장 요약. /status 에 그대로 노출됨."
            rows={4}
            className="w-full px-3 py-2 text-[13px] bg-surface-sunken border border-border rounded-lg resize-none"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-[13px] font-semibold border border-border rounded-lg hover:border-txt-tertiary"
          >
            취소
          </button>
          <button
            onClick={submit}
            disabled={!title.trim() || !summary.trim() || creating}
            className="flex-1 px-4 py-2 text-[13px] font-bold bg-surface-inverse text-txt-inverse rounded-lg disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            생성
          </button>
        </div>
      </div>
    </div>
  )
}
