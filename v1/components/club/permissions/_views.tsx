'use client'

import { X } from 'lucide-react'
import { Button, IconButton } from '@/components/ui/Button'
import { cn } from '@/src/lib/utils'
import type { Channel, Member, MemberSource, Role, Warning } from './_types'
import { PRESETS } from './_constants'
import { avatarInitial, groupChannels } from './_helpers'

// MainView (역할 카드 + 헤더 + 저장 바) + SafetyBlock + RoleCard.
// PermissionsSettingsClient.tsx 에서 분리. 동작 1:1 보존.

// ──────────────────────────────────────────────
// MainView — 권한이 이미 구성된 후 메인 편집 화면
// ──────────────────────────────────────────────
export function MainView(p: {
  clubName: string
  discordGuildName: string | null
  memberCount: number
  roles: Role[]
  channels: Channel[]
  assignments: Record<number, string[]>
  allMembers: Member[]
  currentPreset: string | null
  memberSource: MemberSource | null
  warnings: Warning[]
  dirty: boolean
  saving: boolean
  onDisconnect: () => void
  onResetPreset: () => void
  onAddRoleOpen: () => void
  onAddChannelOpen: () => void
  onChannelEdit: (ri: number) => void
  onMemberEdit: (ri: number) => void
  onToggleAdmin: (ri: number) => void
  onRemoveRole: (ri: number) => void
  onApply: () => void
}) {
  const presetName =
    p.currentPreset === 'custom'
      ? '직접 만들기'
      : p.currentPreset === 'imported'
      ? '가져온 구조'
      : p.currentPreset
      ? PRESETS[p.currentPreset]?.name ?? p.currentPreset
      : '—'
  const memberSourceLabel =
    p.memberSource === 'discord-sync'
      ? 'Discord 자동 동기화'
      : p.memberSource === 'draft-match'
      ? 'Draft 매칭'
      : '수동 관리'
  const categoriesCount = new Set(p.channels.map((c) => c.category)).size

  return (
    <>
      <div className="mb-4 p-4 bg-surface-card rounded-2xl border border-border flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#5865F2] text-white font-bold flex items-center justify-center">
            D
          </div>
          <div className="min-w-0">
            <div className="text-xs text-txt-tertiary">연결됨 · {memberSourceLabel}</div>
            <div className="font-semibold text-txt-primary truncate">
              {p.discordGuildName ?? p.clubName} · 멤버 {p.memberCount}명
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg ring-1 ring-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            연결됨
          </span>
          <button
            onClick={p.onDisconnect}
            className="text-xs text-txt-tertiary hover:text-status-danger-text font-medium"
          >
            연결 해제
          </button>
        </div>
      </div>

      <div className="mb-5 p-3 bg-surface-sunken rounded-xl flex items-center justify-between gap-3 flex-wrap text-xs">
        <div className="text-txt-secondary">
          <span className="text-txt-tertiary">현재 구조:</span>
          <span className="font-semibold text-txt-primary ml-1">{presetName}</span>
          <span className="text-txt-tertiary ml-2">
            · {p.roles.length}개 역할 · {p.channels.length}개 채널 · {categoriesCount}개 카테고리
          </span>
        </div>
        <button
          onClick={p.onResetPreset}
          className="text-txt-secondary hover:text-brand font-medium"
        >
          구조 다시 설정
        </button>
      </div>

      <div className="mb-6 flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight mb-1">역할별 권한 설정</h1>
          <p className="text-txt-secondary text-sm">
            역할 카드의 액션으로 채널 접근과 멤버를 편집합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={p.onAddRoleOpen}>
            + 역할
          </Button>
          <Button variant="secondary" size="sm" onClick={p.onAddChannelOpen}>
            + 채널
          </Button>
        </div>
      </div>

      {p.warnings.length > 0 && <SafetyBlock warnings={p.warnings} />}

      <div className="space-y-3">
        {p.roles.map((role, ri) => (
          <RoleCard
            key={`${role.name}-${ri}`}
            role={role}
            ri={ri}
            channels={p.channels}
            assignments={p.assignments}
            allMembers={p.allMembers}
            onChannelEdit={p.onChannelEdit}
            onMemberEdit={p.onMemberEdit}
            onToggleAdmin={p.onToggleAdmin}
            onRemove={p.onRemoveRole}
          />
        ))}
      </div>

      <div className="mt-8 sticky bottom-4 z-20">
        <div className="bg-surface-card rounded-2xl border border-border shadow-lg p-4 flex items-center justify-between gap-3 flex-wrap">
          <div
            className={cn(
              'text-sm inline-flex items-center gap-2',
              p.dirty ? 'text-brand font-medium' : 'text-txt-tertiary'
            )}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                p.dirty ? 'bg-brand animate-pulse' : 'bg-border-strong'
              )}
            />
            <span>
              {p.dirty ? '저장되지 않은 변경 사항이 있습니다' : '변경 사항 없음'}
            </span>
          </div>
          <Button variant="blue" onClick={p.onApply} disabled={!p.dirty || p.saving}>
            {p.saving ? '저장 중...' : '변경 사항 저장'}
          </Button>
        </div>
      </div>
    </>
  )
}

// ──────────────────────────────────────────────
// SafetyBlock — 경고/주의 알림
// ──────────────────────────────────────────────
function SafetyBlock({ warnings }: { warnings: Warning[] }) {
  const hasCritical = warnings.some((w) => w.level === 'critical')
  const hasWarning = warnings.some((w) => w.level === 'warning')
  const theme = hasCritical
    ? {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'bg-red-100 text-red-700',
        title: 'text-red-900',
        num: 'text-red-700',
      }
    : hasWarning
    ? {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: 'bg-amber-100 text-amber-700',
        title: 'text-amber-900',
        num: 'text-amber-700',
      }
    : {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'bg-blue-100 text-blue-700',
        title: 'text-blue-900',
        num: 'text-blue-700',
      }
  const iconChar = hasCritical || hasWarning ? '!' : 'i'
  return (
    <div className={cn('mb-5 p-4 border rounded-2xl', theme.bg, theme.border)}>
      <div className="flex items-center gap-3 mb-2">
        <div
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold',
            theme.icon
          )}
        >
          {iconChar}
        </div>
        <div className={cn('font-semibold text-sm', theme.title)}>
          <span className={theme.num}>{warnings.length}건</span>의 확인이 필요합니다
        </div>
      </div>
      <ul className="space-y-1 pl-10">
        {warnings.map((w, i) => {
          const dot =
            w.level === 'critical'
              ? 'bg-red-400'
              : w.level === 'warning'
              ? 'bg-amber-400'
              : 'bg-blue-400'
          const tc =
            w.level === 'critical'
              ? 'text-red-900'
              : w.level === 'warning'
              ? 'text-amber-900'
              : 'text-blue-900'
          return (
            <li key={i} className="flex items-start gap-2 text-xs">
              <span className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', dot)} />
              <div>
                <span className={cn('font-medium', tc)}>{w.text}</span>{' '}
                <span className="text-txt-tertiary">{w.hint}</span>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ──────────────────────────────────────────────
// RoleCard — 역할 카드 (채널 접근 + 멤버 + 액션)
// ──────────────────────────────────────────────
function RoleCard({
  role,
  ri,
  channels,
  assignments,
  allMembers,
  onChannelEdit,
  onMemberEdit,
  onToggleAdmin,
  onRemove,
}: {
  role: Role
  ri: number
  channels: Channel[]
  assignments: Record<number, string[]>
  allMembers: Member[]
  onChannelEdit: (ri: number) => void
  onMemberEdit: (ri: number) => void
  onToggleAdmin: (ri: number) => void
  onRemove: (ri: number) => void
}) {
  const accessList = channels.filter((c) => role.access.has(c.name))
  const grouped = groupChannels(accessList)
  const mids = assignments[ri] || []
  const memberMap = new Map(allMembers.map((m) => [m.id, m]))
  const members = mids
    .map((id) => memberMap.get(id))
    .filter(Boolean)
    .slice(0, 4) as Member[]
  const moreCount = Math.max(0, mids.length - members.length)

  return (
    <div className="bg-surface-card rounded-2xl border border-border p-5 hover:border-border-strong transition">
      <div className="flex items-start gap-4">
        <span
          className="w-3 h-3 rounded-full shrink-0 mt-2"
          style={{ background: role.dot }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="font-bold text-txt-primary text-[15px]">{role.name}</span>
            {role.admin && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md ring-1 ring-violet-100">
                <span>🛡</span>
                <span>관리자</span>
              </span>
            )}
          </div>
          <div className="text-sm text-txt-secondary mb-4">{role.desc}</div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-txt-tertiary">
                접근 가능한 채널 · {accessList.length}개
              </div>
            </div>
            {accessList.length ? (
              <div className="space-y-2">
                {Object.entries(grouped).map(([cat, chs]) => (
                  <div key={cat}>
                    <div className="text-[10px] font-semibold text-txt-tertiary uppercase tracking-wide mb-1">
                      📂 {cat}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {chs.map((c) => (
                        <span
                          key={c.name}
                          className="inline-flex items-center text-xs px-2.5 py-1 rounded-lg bg-brand/5 text-brand ring-1 ring-brand/10"
                        >
                          # {c.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-xs text-txt-tertiary">접근 가능한 채널이 없습니다</span>
            )}
          </div>

          <div className="mb-4">
            <div className="text-xs font-medium text-txt-tertiary mb-2">
              배정된 멤버 · {mids.length}명
            </div>
            <div className="flex items-center gap-1.5">
              {members.length ? (
                members.map((m) => (
                  <span
                    key={m.id}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-surface-card"
                    style={{ background: m.dot }}
                    title={m.name}
                  >
                    {avatarInitial(m.name)}
                  </span>
                ))
              ) : (
                <span className="text-xs text-txt-tertiary">배정된 멤버가 없습니다</span>
              )}
              {moreCount > 0 && (
                <span className="text-xs text-txt-tertiary ml-1">+{moreCount}명</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => onChannelEdit(ri)}
              className="px-3 py-1.5 text-xs rounded-lg bg-surface-sunken hover:bg-border text-txt-primary font-medium"
            >
              채널 편집
            </button>
            <button
              onClick={() => onMemberEdit(ri)}
              className="px-3 py-1.5 text-xs rounded-lg bg-surface-sunken hover:bg-border text-txt-primary font-medium"
            >
              멤버 배정
            </button>
            <button
              onClick={() => onToggleAdmin(ri)}
              className="px-3 py-1.5 text-xs rounded-lg bg-surface-sunken hover:bg-border text-txt-primary font-medium"
            >
              {role.admin ? '관리자 해제' : '관리자로 지정'}
            </button>
          </div>
        </div>
        <IconButton
          variant="ghost"
          size="sm"
          onClick={() => onRemove(ri)}
          aria-label="역할 삭제"
        >
          <X size={14} />
        </IconButton>
      </div>
    </div>
  )
}
