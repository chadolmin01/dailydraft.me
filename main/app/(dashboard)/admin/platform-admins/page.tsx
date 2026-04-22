'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdmin } from '@/src/hooks/useAdmin'
import { Shield, UserPlus, Trash2, Loader2, X, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

/**
 * /admin/platform-admins — Platform admin 관리 UI.
 *
 * Bundle Z (platform_admins 테이블) + Bundle PlatformAdmins-API 의 UI 짝.
 *
 * 권한 정책:
 *   - 조회: platform admin 이상 (useAdmin)
 *   - 부여·박탈: superadmin 만 (API 가 강제, UI 도 버튼 비활성)
 *   - 자기 자신 박탈 불가 (API 가 거부, UI 도 버튼 숨김)
 */

interface PlatformAdminRow {
  user_id: string
  role: 'admin' | 'superadmin'
  notes: string | null
  granted_at: string
  granted_by: string | null
  nickname: string | null
  granted_by_nickname: string | null
}

export default function PlatformAdminsPage() {
  const router = useRouter()
  const { isAdmin, isLoading: adminLoading } = useAdmin()
  const [rows, setRows] = useState<PlatformAdminRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showGrant, setShowGrant] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)

  useEffect(() => {
    if (!adminLoading && !isAdmin) router.push('/explore')
  }, [adminLoading, isAdmin, router])

  useEffect(() => {
    if (!isAdmin) return
    fetch('/api/admin/platform-admins', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        setRows((d.data?.admins ?? d.admins ?? []) as PlatformAdminRow[])
        setLoading(false)
      })
    // 현 유저 id — 자기 자신 박탈 방지용
    fetch('/api/me/profile', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setCurrentUserId(d?.data?.user_id ?? d?.user_id ?? null))
      .catch(() => {})
  }, [isAdmin])

  const refresh = async () => {
    const res = await fetch('/api/admin/platform-admins', { cache: 'no-store' })
    const data = await res.json()
    setRows((data.data?.admins ?? data.admins ?? []) as PlatformAdminRow[])
  }

  const revoke = async (userId: string) => {
    if (!confirm('이 admin 의 권한을 박탈합니다. 계속하시겠습니까?')) return
    setRevoking(userId)
    const res = await fetch(`/api/admin/platform-admins?user_id=${userId}`, { method: 'DELETE' })
    setRevoking(null)
    if (res.ok) {
      toast.success('권한을 박탈했습니다', {
        description: '이 작업은 audit_logs 에 자동 기록됩니다. 필요하면 /admin/audit 에서 이력을 확인하실 수 있습니다.',
      })
      refresh()
    } else {
      const data = await res.json().catch(() => null)
      toast.error(data?.error?.message ?? '박탈에 실패했습니다', {
        description: '본인 자신을 박탈하거나 superadmin 권한이 없으면 차단됩니다.',
      })
    }
  }

  if (adminLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-txt-tertiary" size={24} /></div>
  }
  if (!isAdmin) return null

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <div className="text-[10px] font-medium text-txt-tertiary mb-2 flex items-center gap-2">
            <Shield size={14} />
            Admin / Platform Admins
          </div>
          <h1 className="text-3xl font-bold text-txt-primary tracking-tight">플랫폼 관리자</h1>
          <p className="text-txt-tertiary text-sm mt-1">
            JWT app_metadata.is_admin 을 대체하는 DB 기반 admin 목록 (H4 하드닝).
            부여·박탈은 superadmin 권한 필요.
          </p>
        </div>
        <button
          onClick={() => setShowGrant(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-surface-inverse text-txt-inverse text-[13px] font-bold rounded-xl hover:opacity-90 transition-opacity"
        >
          <UserPlus size={14} />
          admin 부여
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-16 skeleton-shimmer rounded-xl" />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-surface-card border border-border rounded-2xl p-10 text-center">
          <AlertTriangle size={28} className="text-status-warn-text mx-auto mb-3" aria-hidden="true" />
          <p className="text-[15px] font-semibold text-txt-primary mb-1">등록된 admin 없음</p>
          <p className="text-[13px] text-txt-tertiary">platform_admins 테이블이 비어 있습니다. superadmin 을 먼저 DB 에 직접 삽입하세요.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.user_id} className="bg-surface-card border border-border rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[14px] font-semibold text-txt-primary">
                    {r.nickname ?? '(닉네임 없음)'}
                  </p>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${r.role === 'superadmin' ? 'bg-brand text-white' : 'bg-surface-sunken text-txt-secondary'}`}>
                    {r.role}
                  </span>
                </div>
                <code className="text-[11px] font-mono text-txt-tertiary">{r.user_id}</code>
                {r.notes && <p className="text-[12px] text-txt-secondary mt-1">{r.notes}</p>}
                <p className="text-[11px] text-txt-tertiary mt-1">
                  부여: {new Date(r.granted_at).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}
                  {r.granted_by_nickname && ` · by ${r.granted_by_nickname}`}
                </p>
              </div>
              {r.user_id !== currentUserId && (
                <button
                  onClick={() => revoke(r.user_id)}
                  disabled={revoking === r.user_id}
                  className="shrink-0 p-2 rounded-lg hover:bg-surface-sunken text-txt-tertiary hover:text-status-danger-text transition-colors"
                  aria-label="권한 박탈"
                >
                  {revoking === r.user_id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {showGrant && <GrantAdminModal onClose={() => setShowGrant(false)} onGranted={refresh} />}

      <p className="text-[11px] text-txt-tertiary pt-6 border-t border-border-subtle">
        자기 자신을 박탈하는 것은 lock-out 방지를 위해 API 에서 거부됩니다.
        모든 부여·박탈은 audit_logs 에 자동 기록됩니다.
      </p>
    </div>
  )
}

function GrantAdminModal({ onClose, onGranted }: { onClose: () => void; onGranted: () => void }) {
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState<'admin' | 'superadmin'>('admin')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!userId.trim()) return
    setSubmitting(true)
    const res = await fetch('/api/admin/platform-admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId.trim(), role, notes: notes.trim() || undefined }),
    })
    setSubmitting(false)
    if (res.ok) {
      toast.success('admin 권한을 부여했습니다', {
        description: '해당 유저가 다음 로그인부터 /admin 허브에 접근할 수 있습니다. 작업 이력은 audit_logs 에 기록됩니다.',
      })
      onGranted()
      onClose()
    } else {
      const data = await res.json().catch(() => null)
      toast.error(data?.error?.message ?? '부여에 실패했습니다', {
        description: 'superadmin 권한이 필요하거나 user_id 형식(uuid)이 잘못된 경우입니다.',
      })
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="admin 부여" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-surface-card rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-txt-primary">admin 권한 부여</h2>
          <button onClick={onClose} aria-label="닫기"><X size={18} className="text-txt-tertiary" aria-hidden="true" /></button>
        </div>
        <div className="space-y-2">
          <label className="block text-[11px] font-semibold text-txt-secondary">user_id (uuid)</label>
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="00000000-0000-0000-0000-000000000000"
            className="w-full px-3 py-2 text-[12px] font-mono bg-surface-sunken border border-border rounded-lg"
          />
          <p className="text-[10px] text-txt-tertiary">Supabase dashboard Auth → Users 에서 복사</p>
        </div>
        <div className="space-y-2">
          <label className="block text-[11px] font-semibold text-txt-secondary">권한</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'superadmin')}
            className="w-full px-3 py-2 text-[13px] bg-surface-sunken border border-border rounded-lg"
          >
            <option value="admin">admin — 일반 관리 기능</option>
            <option value="superadmin">superadmin — 다른 admin 부여·박탈 포함</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-[11px] font-semibold text-txt-secondary">메모 (선택)</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="예: FLIP 회장 이성민 — 2026-04 위임"
            className="w-full px-3 py-2 text-[13px] bg-surface-sunken border border-border rounded-lg"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-[13px] font-semibold border border-border rounded-lg hover:border-txt-tertiary">취소</button>
          <button
            onClick={submit}
            disabled={!userId.trim() || submitting}
            className="flex-1 px-4 py-2 text-[13px] font-bold bg-surface-inverse text-txt-inverse rounded-lg disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
            부여
          </button>
        </div>
      </div>
    </div>
  )
}
