'use client'

import { useState, useEffect, useCallback } from 'react'
import { Webhook, Plus, Trash2, Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface Channel {
  id: string
  channel_type: 'discord_webhook' | 'slack_webhook' | string
  label: string | null
  event_types: string[]
  enabled: boolean
  created_at: string
}

const TYPE_META: Record<string, { label: string; prefix: string; hint: string }> = {
  discord_webhook: {
    label: 'Discord',
    prefix: 'https://discord.com/api/webhooks/',
    hint: 'Discord 채널 설정 → 연동 → 웹훅에서 URL 복사',
  },
  slack_webhook: {
    label: 'Slack',
    prefix: 'https://hooks.slack.com/',
    hint: 'Slack 앱 → Incoming Webhooks → Add New Webhook 에서 URL 복사',
  },
}

/**
 * 클럽 알림 채널 관리 섹션 — Discord/Slack Incoming Webhook 등록/삭제.
 *
 * 왜 별도 섹션: /settings 페이지가 Discord Bot 과 페르소나 등 복합 UI 구조라
 * 이 UI 는 웹훅 전용으로 분리해 운영자가 직관적으로 찾도록 함.
 */
export function NotificationChannelsSection({ clubId }: { clubId: string }) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState<'discord_webhook' | 'slack_webhook' | null>(null)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [label, setLabel] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Channel | null>(null)

  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch(`/api/clubs/${clubId}/notification-channels`)
      if (res.ok) {
        const body = await res.json()
        setChannels(body.data ?? body)
      }
    } finally {
      setLoading(false)
    }
  }, [clubId])

  useEffect(() => {
    fetchChannels()
  }, [fetchChannels])

  const handleAdd = async () => {
    if (!adding || !webhookUrl.trim()) return
    const meta = TYPE_META[adding]
    if (!webhookUrl.trim().startsWith(meta.prefix)) {
      toast.error(`${meta.label} 웹훅 URL 형식이 아닙니다`)
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/clubs/${clubId}/notification-channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_type: adding,
          webhook_url: webhookUrl.trim(),
          label: label.trim() || meta.label,
          event_types: ['update_posted', 'update_remind', 'announcement'],
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(body?.error?.message ?? '추가에 실패했습니다')
        return
      }
      toast.success(`${meta.label} 웹훅을 등록했습니다`)
      setAdding(null)
      setWebhookUrl('')
      setLabel('')
      fetchChannels()
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/clubs/${clubId}/notification-channels/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('삭제되었습니다')
      fetchChannels()
    } else {
      toast.error('삭제에 실패했습니다')
    }
  }

  return (
    <section className="bg-surface-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center shrink-0">
          <Webhook size={18} className="text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-txt-primary">알림 채널 (웹훅)</h2>
          <p className="text-[11px] text-txt-tertiary">
            Discord · Slack 채널로 주간 업데이트·리마인드·공지 자동 전송
          </p>
        </div>
      </div>

      {loading ? (
        <div className="h-16 bg-surface-sunken rounded-xl animate-pulse" />
      ) : channels.length > 0 ? (
        <ul className="space-y-2 mb-4">
          {channels.map(ch => {
            const meta = TYPE_META[ch.channel_type] ?? { label: ch.channel_type, prefix: '', hint: '' }
            return (
              <li
                key={ch.id}
                className="flex items-center gap-3 px-4 py-3 bg-surface-bg border border-border rounded-xl"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-bg flex items-center justify-center shrink-0">
                  <Check size={14} className="text-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-txt-primary truncate">
                    {ch.label || meta.label}
                  </p>
                  <p className="text-[11px] text-txt-tertiary">
                    {meta.label} · {ch.event_types.length} 이벤트 구독
                  </p>
                </div>
                <button
                  onClick={() => setDeleteTarget(ch)}
                  className="text-txt-disabled hover:text-status-danger-text transition-colors"
                  aria-label="삭제"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-[12px] text-txt-tertiary mb-4">
          아직 등록된 웹훅이 없습니다. 주간 업데이트가 발행될 때마다 설정한 채널로 알림이 전송됩니다
        </p>
      )}

      {!adding ? (
        <div className="flex gap-2">
          <button
            onClick={() => setAdding('discord_webhook')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[13px] font-medium text-txt-secondary border border-border rounded-xl hover:border-brand hover:text-brand transition-colors"
          >
            <Plus size={13} />
            Discord 웹훅
          </button>
          <button
            onClick={() => setAdding('slack_webhook')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[13px] font-medium text-txt-secondary border border-border rounded-xl hover:border-brand hover:text-brand transition-colors"
          >
            <Plus size={13} />
            Slack 웹훅
          </button>
        </div>
      ) : (
        <div className="space-y-2 p-4 bg-surface-bg border border-border rounded-xl">
          <div>
            <label className="text-[11px] font-semibold text-txt-secondary block mb-1">
              {TYPE_META[adding].label} 웹훅 URL
            </label>
            <input
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              placeholder={`${TYPE_META[adding].prefix}...`}
              className="w-full px-3 py-2 text-[12px] font-mono bg-surface-card border border-border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand/40"
            />
            <p className="text-[11px] text-txt-tertiary mt-1">{TYPE_META[adding].hint}</p>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-txt-secondary block mb-1">
              라벨 <span className="font-normal text-txt-disabled">(선택)</span>
            </label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value.slice(0, 30))}
              placeholder="예: 운영 채널, 마케팅 공유"
              aria-label="채널 라벨 (선택)"
              className="w-full px-3 py-2 text-[13px] bg-surface-card border border-border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand/40"
            />
            <p className="text-[11px] text-txt-tertiary mt-1">
              여러 채널을 등록하실 때 구분하기 좋은 이름을 달아 주세요.
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => { setAdding(null); setWebhookUrl(''); setLabel('') }}
              className="px-3 py-2 text-[13px] font-medium text-txt-secondary hover:text-txt-primary transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleAdd}
              disabled={submitting || !webhookUrl.trim()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[13px] font-semibold bg-surface-inverse text-txt-inverse rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {submitting ? <Loader2 size={13} className="animate-spin" /> : null}
              {submitting ? '테스트 중' : '등록 + 테스트 메시지'}
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return
          await handleDelete(deleteTarget.id)
          setDeleteTarget(null)
        }}
        title="알림 채널 삭제"
        message={deleteTarget ? `"${deleteTarget.label || deleteTarget.channel_type}" 알림 채널을 삭제합니다. 이 채널로 더 이상 알림이 전송되지 않습니다.` : ''}
        confirmText="삭제"
        variant="danger"
      />
    </section>
  )
}
