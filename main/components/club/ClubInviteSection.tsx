'use client'

import { useEffect, useState } from 'react'
import { UserPlus, Copy, Check, Loader2, Plus, Link2, MessageSquare, FileText, Power, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { APP_URL } from '@/src/constants'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface InviteCode {
  id: string
  code: string
  cohort: string | null
  role: string | null
  max_uses: number | null
  use_count: number | null
  expires_at: string | null
  created_at: string
  is_active: boolean
}

type TemplateKind = 'kakao' | 'discord' | 'poster'

const TEMPLATES: Record<TemplateKind, (args: { clubName: string; inviteUrl: string; code: string; cohort: string | null }) => string> = {
  kakao: ({ clubName, inviteUrl, code, cohort }) =>
    `안녕하세요! ${clubName}${cohort ? ` ${cohort}기` : ''} 가입 안내입니다 🙂\n\n아래 링크로 초대 코드를 입력하면 바로 가입할 수 있어요.\n\n${inviteUrl}\n\n초대 코드: ${code}\n\n기수 활동에서 만나요!`,
  discord: ({ clubName, inviteUrl, code, cohort }) =>
    `@everyone ${clubName}${cohort ? ` ${cohort}기` : ''} 신규 모집이 시작됐습니다.\n\n✅ 가입 링크: ${inviteUrl}\n✅ 초대 코드: \`${code}\`\n\n질문은 이 채널에 남겨주세요.`,
  poster: ({ clubName, inviteUrl, code, cohort }) =>
    `${clubName}${cohort ? ` ${cohort}기 모집` : ''}\n\nDraft에서 기수 활동을 운영합니다.\n초대 코드: ${code}\n${inviteUrl}`,
}

const TEMPLATE_META: Record<TemplateKind, { label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  kakao: { label: '카톡·문자용', icon: MessageSquare },
  discord: { label: 'Discord 공지용', icon: Link2 },
  poster: { label: '포스터·오프라인용', icon: FileText },
}

export function ClubInviteSection({ slug, clubName, viewerRole }: {
  slug: string
  clubName: string
  viewerRole?: 'owner' | 'admin' | null
}) {
  const [codes, setCodes] = useState<InviteCode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [cohortInput, setCohortInput] = useState('')
  const [roleInput, setRoleInput] = useState<'member' | 'admin'>('member')
  const [activeCodeId, setActiveCodeId] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [activeTemplate, setActiveTemplate] = useState<TemplateKind>('kakao')
  const [mutating, setMutating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<InviteCode | null>(null)

  const toggleActive = async (code: InviteCode) => {
    setMutating(true)
    try {
      const res = await fetch(`/api/clubs/${slug}/invite-codes/${code.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !code.is_active }),
      })
      if (!res.ok) throw new Error()
      setCodes(prev => prev.map(c => c.id === code.id ? { ...c, is_active: !code.is_active } : c))
      toast.success(
        code.is_active ? '코드를 비활성화했습니다' : '코드를 다시 활성화했습니다',
        {
          description: code.is_active
            ? '이 코드로는 더 이상 가입할 수 없습니다. 기존 멤버십은 유지됩니다.'
            : '이제 이 코드로 다시 가입이 가능합니다. 링크를 재공유하시면 됩니다.',
        },
      )
    } catch {
      toast.error('상태 변경에 실패했습니다', {
        description: '잠시 후 다시 시도해 주세요. 문제가 계속되면 /status 를 확인해 주세요.',
      })
    } finally {
      setMutating(false)
    }
  }

  const deleteCode = async (code: InviteCode) => {
    setMutating(true)
    try {
      const res = await fetch(`/api/clubs/${slug}/invite-codes/${code.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setCodes(prev => prev.filter(c => c.id !== code.id))
      if (activeCodeId === code.id) setActiveCodeId(null)
      toast.success('초대 코드를 삭제했습니다', {
        description: '이미 가입한 멤버에게는 영향이 없습니다. 새 초대가 필요하면 아래에서 코드를 새로 발급하실 수 있습니다.',
      })
    } catch {
      toast.error('삭제에 실패했습니다', {
        description: '이미 여러 명이 사용한 코드는 감사 로그 보존을 위해 비활성화만 가능할 수 있습니다.',
      })
    } finally {
      setMutating(false)
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/clubs/${slug}/invite-codes`)
        if (res.ok) {
          const data = await res.json() as InviteCode[]
          setCodes(data)
          if (data.length > 0) setActiveCodeId(data[0].id)
        }
      } finally {
        setIsLoading(false)
      }
    })()
  }, [slug])

  const active = codes.find(c => c.id === activeCodeId) ?? codes[0] ?? null
  const inviteUrl = active ? `${APP_URL}/clubs/${slug}/join?code=${encodeURIComponent(active.code)}` : ''

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      const body: Record<string, unknown> = {}
      if (cohortInput) body.cohort = cohortInput
      if (roleInput === 'admin') body.role = 'admin'
      const res = await fetch(`/api/clubs/${slug}/invite-codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      const newCode = await res.json() as InviteCode
      setCodes(prev => [newCode, ...prev])
      setActiveCodeId(newCode.id)
      setCohortInput('')
      setRoleInput('member')
      toast.success(
        roleInput === 'admin' ? '운영진 초대 코드를 만들었습니다' : '초대 코드를 만들었습니다',
        {
          description:
            roleInput === 'admin'
              ? '이 코드로 가입한 유저는 자동으로 운영진(admin) 권한을 갖습니다. 신뢰할 수 있는 사람에게만 공유해 주세요.'
              : '아래 링크를 복사해서 카톡·Slack·Discord 등 원하시는 곳으로 공유하실 수 있습니다.',
        },
      )
    } catch {
      toast.error('초대 코드를 만들지 못했습니다', {
        description: '클럽 owner 또는 admin 권한이 필요합니다. 권한이 있는데도 실패한다면 잠시 후 다시 시도해 주세요.',
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      toast.error('복사에 실패했습니다')
    }
  }

  const handleTemplateCopy = async () => {
    if (!active) return
    const template = TEMPLATES[activeTemplate]({
      clubName,
      inviteUrl,
      code: active.code,
      cohort: active.cohort,
    })
    await handleCopy(template, `template-${activeTemplate}`)
  }

  // 자체 QR 엔드포인트로 교체 — 외부 서비스(api.qrserver.com) 의존성 제거.
  // 같은 URL 은 1시간 edge cache 되어 재방문 시 즉시 반환. SVG 기반이라 고해상도 인쇄 대응.
  const qrSrc = inviteUrl
    ? `/api/qr?value=${encodeURIComponent(inviteUrl)}&size=400`
    : null

  return (
    <section id="invite" className="bg-surface-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center shrink-0">
          <UserPlus size={18} className="text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-txt-primary">멤버 초대</h2>
          <p className="text-[11px] text-txt-tertiary">
            초대 코드·링크·QR·공유 템플릿을 한 번에 준비합니다
          </p>
        </div>
      </div>

      {/* 신규 발급 */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <input
            value={cohortInput}
            onChange={e => setCohortInput(e.target.value.slice(0, 20))}
            placeholder="기수 (예: 3)"
            className="flex-1 min-w-0 px-3 py-2 text-[13px] border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold bg-surface-inverse text-txt-inverse rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {isCreating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            새 코드
          </button>
        </div>

        {/* 역할 선택 — owner 만 admin 발급 가능 */}
        {viewerRole === 'owner' && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-txt-tertiary mr-1">부여 역할:</span>
            <button
              type="button"
              onClick={() => setRoleInput('member')}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                roleInput === 'member'
                  ? 'bg-brand-bg text-brand border-brand-border'
                  : 'text-txt-tertiary border-border hover:border-txt-tertiary'
              }`}
            >
              일반 멤버
            </button>
            <button
              type="button"
              onClick={() => setRoleInput('admin')}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                roleInput === 'admin'
                  ? 'bg-brand-bg text-brand border-brand-border'
                  : 'text-txt-tertiary border-border hover:border-txt-tertiary'
              }`}
            >
              운영진
            </button>
            {roleInput === 'admin' && (
              <span className="text-[10px] text-status-warning-text ml-1">
                ⚠️ 공유에 주의 — 받는 사람이 자동으로 운영진이 됩니다
              </span>
            )}
          </div>
        )}
      </div>

      {/* 코드 리스트 */}
      {isLoading ? (
        <div className="h-24 bg-surface-sunken rounded-xl animate-pulse" />
      ) : codes.length === 0 ? (
        <p className="text-[13px] text-txt-tertiary text-center py-6">
          첫 초대 코드를 생성해보세요
        </p>
      ) : (
        <>
          {codes.length > 1 && (
            <div className="flex gap-2 overflow-x-auto mb-4 pb-1" style={{ scrollbarWidth: 'none' }}>
              {codes.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveCodeId(c.id)}
                  className={`shrink-0 px-3 py-1.5 text-[12px] font-medium rounded-full border transition-colors ${
                    activeCodeId === c.id
                      ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                      : 'text-txt-secondary border-border bg-surface-card hover:border-txt-tertiary'
                  }`}
                >
                  {c.cohort ? `${c.cohort}기 · ` : ''}{c.code}
                </button>
              ))}
            </div>
          )}

          {active && (
            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4 mb-4">
              {/* QR */}
              {qrSrc && (
                <div className="flex flex-col items-center justify-center bg-surface-bg border border-border rounded-xl p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrSrc} alt="초대 QR" width={120} height={120} />
                  <p className="text-[10px] text-txt-tertiary mt-1.5">QR 스캔으로 가입</p>
                </div>
              )}

              {/* 코드/링크 */}
              <div className="space-y-2 min-w-0">
                <div className="bg-surface-bg border border-border rounded-xl p-3">
                  <p className="text-[11px] text-txt-tertiary mb-1">초대 코드</p>
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-[20px] font-bold tabular-nums text-txt-primary tracking-wider">
                      {active.code}
                    </span>
                    <button
                      onClick={() => handleCopy(active.code, 'code')}
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold text-txt-secondary border border-border rounded-lg hover:border-brand hover:text-brand transition-colors"
                    >
                      {copied === 'code' ? <Check size={12} /> : <Copy size={12} />}
                      {copied === 'code' ? '복사됨' : '복사'}
                    </button>
                  </div>
                </div>

                <div className="bg-surface-bg border border-border rounded-xl p-3">
                  <p className="text-[11px] text-txt-tertiary mb-1">가입 링크</p>
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-[12px] text-txt-secondary truncate font-mono">
                      {inviteUrl}
                    </span>
                    <button
                      onClick={() => handleCopy(inviteUrl, 'url')}
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold text-txt-secondary border border-border rounded-lg hover:border-brand hover:text-brand transition-colors"
                    >
                      {copied === 'url' ? <Check size={12} /> : <Copy size={12} />}
                      {copied === 'url' ? '복사됨' : '복사'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-txt-tertiary pt-1 flex-wrap">
                  {active.max_uses && <span>사용 {active.use_count ?? 0}/{active.max_uses}</span>}
                  {active.expires_at && (
                    <span>만료 {new Date(active.expires_at).toLocaleDateString('ko-KR')}</span>
                  )}
                  {active.is_active === false && (
                    <span className="inline-flex items-center gap-1 text-status-danger-text font-semibold">
                      <Power size={10} />
                      비활성화됨
                    </span>
                  )}
                </div>

                {/* 관리 — 비활성화/삭제 */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => toggleActive(active)}
                    disabled={mutating}
                    className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full border transition-colors disabled:opacity-50 ${
                      active.is_active
                        ? 'text-txt-secondary border-border hover:border-status-danger-text hover:text-status-danger-text'
                        : 'text-brand border-brand-border bg-brand-bg'
                    }`}
                  >
                    <Power size={10} />
                    {active.is_active ? '비활성화' : '다시 활성화'}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(active)}
                    disabled={mutating}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-txt-tertiary border border-border rounded-full hover:border-status-danger-text hover:text-status-danger-text transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={10} />
                    삭제
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 템플릿 */}
          {active && (
            <div className="bg-surface-bg border border-border rounded-xl p-4">
              <p className="text-[12px] font-semibold text-txt-primary mb-2">공유 메시지 템플릿</p>
              <div className="flex gap-1.5 mb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {(Object.keys(TEMPLATES) as TemplateKind[]).map(k => {
                  const Meta = TEMPLATE_META[k]
                  const Icon = Meta.icon
                  return (
                    <button
                      key={k}
                      onClick={() => setActiveTemplate(k)}
                      className={`shrink-0 flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium rounded-full border transition-colors ${
                        activeTemplate === k
                          ? 'bg-brand-bg text-brand border-brand-border'
                          : 'text-txt-secondary border-border bg-surface-card hover:border-txt-tertiary'
                      }`}
                    >
                      <Icon size={11} />
                      {Meta.label}
                    </button>
                  )
                })}
              </div>
              <pre className="text-[12px] text-txt-secondary bg-surface-card border border-border rounded-lg p-3 whitespace-pre-wrap font-sans max-h-48 overflow-y-auto">
                {TEMPLATES[activeTemplate]({
                  clubName,
                  inviteUrl,
                  code: active.code,
                  cohort: active.cohort,
                })}
              </pre>
              <button
                onClick={handleTemplateCopy}
                className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 text-[13px] font-semibold bg-surface-inverse text-txt-inverse rounded-xl hover:opacity-90 transition-all"
              >
                {copied === `template-${activeTemplate}` ? <Check size={13} /> : <Copy size={13} />}
                {copied === `template-${activeTemplate}` ? '복사 완료' : '템플릿 복사'}
              </button>
            </div>
          )}
        </>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return
          await deleteCode(deleteTarget)
        }}
        title="초대 코드 삭제"
        message={deleteTarget ? `초대 코드 "${deleteTarget.code}" 를 삭제합니다. 이미 공유한 링크는 작동하지 않게 됩니다.` : ''}
        confirmText="삭제"
        variant="danger"
      />
    </section>
  )
}
