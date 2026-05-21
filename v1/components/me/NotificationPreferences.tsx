'use client'

import { useEffect, useState } from 'react'
import { Bell, Mail, Check, Loader2 } from 'lucide-react'

/**
 * 알림·이메일 수신 설정 패널.
 *
 * /me/data 에서 사용. API 는 /api/me/notification-settings.
 * 각 토글은 변경 시 즉시 PATCH — "저장하기" 버튼 없이 자연스럽게.
 */

interface Settings {
  email_enabled: boolean
  email_deadline_days: number
  inapp_bookmark_reminder: boolean
  inapp_deadline: boolean
  inapp_new_match: boolean
  preferred_time: string | null
}

const DEFAULTS: Settings = {
  email_enabled: true,
  email_deadline_days: 3,
  inapp_bookmark_reminder: true,
  inapp_deadline: true,
  inapp_new_match: true,
  preferred_time: null,
}

export function NotificationPreferences() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<keyof Settings | null>(null)
  const [recentlySavedKey, setRecentlySavedKey] = useState<keyof Settings | null>(null)

  useEffect(() => {
    fetch('/api/me/notification-settings', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setSettings((prev) => ({ ...prev, ...(d.data ?? d) }))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const patch = async (key: keyof Settings, value: Settings[keyof Settings]) => {
    setSavingKey(key)
    const prev = settings
    // 옵티미스틱 업데이트
    setSettings({ ...prev, [key]: value })
    try {
      const res = await fetch('/api/me/notification-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ [key]: value }),
      })
      if (!res.ok) throw new Error('save failed')
      setRecentlySavedKey(key)
      setTimeout(() => setRecentlySavedKey(null), 1500)
    } catch {
      // 롤백
      setSettings(prev)
    } finally {
      setSavingKey(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-surface-card border border-border rounded-2xl p-6 animate-pulse">
        <div className="h-4 w-32 bg-surface-sunken rounded mb-3" />
        <div className="h-3 w-full bg-surface-sunken rounded" />
      </div>
    )
  }

  return (
    <section aria-labelledby="notif-prefs-heading" className="bg-surface-card border border-border rounded-2xl p-6 space-y-5">
      <div className="flex items-start gap-3">
        <Bell size={18} className="text-brand shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1">
          <h3 id="notif-prefs-heading" className="text-[15px] font-bold text-txt-primary">알림·이메일 수신 설정</h3>
          <p className="text-[12px] text-txt-tertiary mt-0.5">변경은 즉시 저장됩니다.</p>
        </div>
      </div>

      <Toggle
        label="이메일 수신"
        icon={Mail}
        checked={settings.email_enabled}
        saving={savingKey === 'email_enabled'}
        recentlySaved={recentlySavedKey === 'email_enabled'}
        onChange={(v) => patch('email_enabled', v)}
        desc="주간 다이제스트·중요 알림을 이메일로 수신합니다."
      />

      <Toggle
        label="인앱 알림 — 새 매칭"
        checked={settings.inapp_new_match}
        saving={savingKey === 'inapp_new_match'}
        recentlySaved={recentlySavedKey === 'inapp_new_match'}
        onChange={(v) => patch('inapp_new_match', v)}
        desc="새로운 팀원·프로젝트 추천이 도착하면 앱 내 알림."
      />

      <Toggle
        label="인앱 알림 — 마감 임박"
        checked={settings.inapp_deadline}
        saving={savingKey === 'inapp_deadline'}
        recentlySaved={recentlySavedKey === 'inapp_deadline'}
        onChange={(v) => patch('inapp_deadline', v)}
        desc="지원 마감 D-3 이내 프로젝트 알림."
      />

      <Toggle
        label="인앱 알림 — 북마크 리마인더"
        checked={settings.inapp_bookmark_reminder}
        saving={savingKey === 'inapp_bookmark_reminder'}
        recentlySaved={recentlySavedKey === 'inapp_bookmark_reminder'}
        onChange={(v) => patch('inapp_bookmark_reminder', v)}
        desc="북마크한 프로젝트 업데이트 시 알림."
      />

      {/* 이메일 마감 알림 며칠 전 */}
      <div className="space-y-2 pt-2 border-t border-border/50">
        <label className="text-[13px] font-semibold text-txt-primary">
          이메일 마감 알림 발송 시점
        </label>
        <select
          value={String(settings.email_deadline_days)}
          onChange={(e) => patch('email_deadline_days', Number(e.target.value))}
          disabled={!settings.email_enabled || savingKey === 'email_deadline_days'}
          className="w-full px-3 py-2 text-[13px] bg-surface-sunken border border-border rounded-lg text-txt-primary disabled:opacity-50"
        >
          <option value="1">1일 전</option>
          <option value="3">3일 전 (기본)</option>
          <option value="7">7일 전</option>
          <option value="0">비활성</option>
        </select>
        <p className="text-[11px] text-txt-tertiary">이메일 수신이 꺼져 있으면 이 설정도 동작하지 않습니다.</p>
      </div>
    </section>
  )
}

function Toggle({
  label,
  icon: Icon,
  checked,
  saving,
  recentlySaved,
  onChange,
  desc,
}: {
  label: string
  icon?: React.ComponentType<{ size?: number; className?: string }>
  checked: boolean
  saving: boolean
  recentlySaved: boolean
  onChange: (v: boolean) => void
  desc?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-2 flex-1 min-w-0">
        {Icon && <Icon size={14} className="text-txt-tertiary shrink-0 mt-0.5" aria-hidden="true" />}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-txt-primary">{label}</p>
          {desc && <p className="text-[11px] text-txt-tertiary mt-0.5 leading-relaxed">{desc}</p>}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={`${label} · ${checked ? '켜짐' : '꺼짐'} (누르시면 변경됩니다)`}
        title={saving ? '저장 중입니다. 잠시만 기다려 주세요.' : checked ? '끄려면 누르세요' : '켜려면 누르세요'}
        onClick={() => onChange(!checked)}
        disabled={saving}
        className={`relative shrink-0 w-10 h-6 rounded-full transition-colors ${checked ? 'bg-brand' : 'bg-surface-sunken'} ${saving ? 'opacity-60' : ''}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'}`}
        />
        {saving && (
          <Loader2 size={10} className="absolute inset-0 m-auto text-white animate-spin" aria-hidden="true" />
        )}
        {recentlySaved && !saving && (
          <Check size={10} className="absolute inset-0 m-auto text-white" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}
