'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Button, IconButton } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/src/lib/utils'
import type { Channel, Member, Role } from './_types'
import { avatarInitial, groupChannels } from './_helpers'

// PermissionsSettings 모달 모음.
// PermissionsSettingsClient.tsx 에서 분리. 동작 1:1 보존.

// ──────────────────────────────────────────────
// ChannelEditorModal — 역할의 채널 접근 권한 편집
// ──────────────────────────────────────────────
export function ChannelEditorModal({
  role,
  channels,
  onClose,
  onSave,
}: {
  role: Role
  channels: Channel[]
  onClose: () => void
  onSave: (next: Set<string>) => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(role.access))
  const grouped = groupChannels(channels)

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }
  const toggleCategory = (cat: string, on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      channels
        .filter((c) => c.category === cat)
        .forEach((c) => {
          on ? next.add(c.name) : next.delete(c.name)
        })
      return next
    })
  }

  return (
    <Modal isOpen={true} onClose={onClose} size="md" showClose={false}>
      <div className="flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: role.dot }} />
            <span className="text-xs text-txt-tertiary">{role.name}</span>
          </div>
          <h3 className="text-lg font-bold mb-1.5">어떤 채널에 접근할 수 있나요?</h3>
          <p className="text-sm text-txt-secondary">카테고리별로 모두 선택하거나 개별 지정합니다.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {Object.entries(grouped).map(([cat, chs]) => {
            const allOn = chs.every((c) => selected.has(c.name))
            return (
              <div key={cat}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-txt-primary uppercase tracking-wide">
                    📂 {cat}
                  </div>
                  <button
                    onClick={() => toggleCategory(cat, !allOn)}
                    className={cn(
                      'text-xs font-medium hover:underline',
                      allOn ? 'text-txt-tertiary' : 'text-brand'
                    )}
                  >
                    {allOn ? '전체 해제' : '전체 선택'}
                  </button>
                </div>
                <div className="space-y-1">
                  {chs.map((c) => {
                    const on = selected.has(c.name)
                    return (
                      <label
                        key={c.name}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-sunken cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => toggle(c.name)}
                          className="w-4 h-4 rounded-md border-border-strong text-brand focus:ring-brand"
                        />
                        <span className="flex-1 text-sm text-txt-primary"># {c.name}</span>
                        {on ? (
                          <span className="text-xs text-brand font-medium">접근 가능</span>
                        ) : (
                          <span className="text-xs text-txt-tertiary">접근 불가</span>
                        )}
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        <div className="p-5 border-t border-border flex gap-2">
          <Button variant="secondary" fullWidth onClick={onClose}>
            취소
          </Button>
          <Button variant="blue" fullWidth onClick={() => onSave(selected)}>
            저장 — {selected.size}개
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ──────────────────────────────────────────────
// MemberDrawer — 우측 슬라이드 패널, 역할에 멤버 배정/해제
// ──────────────────────────────────────────────
export function MemberDrawer({
  ri,
  role,
  members,
  assignments,
  roles,
  onClose,
  onAssign,
  onUnassign,
}: {
  ri: number
  role: Role
  members: Member[]
  assignments: Record<number, string[]>
  roles: Role[]
  onClose: () => void
  onAssign: (ri: number, mid: string) => void
  onUnassign: (ri: number, mid: string) => void
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  if (!mounted) return null

  const ids = assignments[ri] || []
  const assignedSet = new Set(ids)
  const memberMap = new Map(members.map((m) => [m.id, m]))
  const assigned = ids.map((id) => memberMap.get(id)).filter(Boolean) as Member[]
  const unassigned = members.filter((m) => !assignedSet.has(m.id))
  const otherRoleOf = (mid: string) => {
    for (const [k, v] of Object.entries(assignments)) {
      if (Number(k) !== ri && v.includes(mid)) return roles[Number(k)]?.name
    }
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-popover" onClick={onClose}>
      <div className="absolute inset-0 bg-surface-inverse/40 backdrop-blur-xs" />
      <div
        className="absolute top-0 right-0 bottom-0 w-full sm:w-[420px] bg-surface-elevated shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: role.dot }} />
            <div className="min-w-0">
              <div className="text-xs text-txt-tertiary">멤버 배정</div>
              <h3 className="font-bold text-txt-primary truncate">{role.name}</h3>
            </div>
          </div>
          <IconButton variant="ghost" size="sm" onClick={onClose} aria-label="닫기">
            <X size={14} />
          </IconButton>
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-txt-primary">배정된 멤버</div>
              <div className="text-xs text-txt-tertiary">{assigned.length}명</div>
            </div>
            {assigned.length ? (
              <div className="space-y-1">
                {assigned.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-sunken group"
                  >
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: m.dot }}
                    >
                      {avatarInitial(m.name)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-txt-primary truncate">{m.name}</div>
                      <div className="text-xs text-txt-tertiary">{m.team}</div>
                    </div>
                    <button
                      onClick={() => onUnassign(ri, m.id)}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg hover:bg-red-50 text-txt-tertiary hover:text-red-500 inline-flex items-center justify-center transition"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-txt-tertiary py-8 text-center bg-surface-sunken rounded-xl">
                아직 배정된 멤버가 없습니다.
              </div>
            )}
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-txt-primary">다른 멤버 배정</div>
              <div className="text-xs text-txt-tertiary">{unassigned.length}명</div>
            </div>
            {unassigned.length ? (
              <div className="space-y-1">
                {unassigned.map((m) => {
                  const other = otherRoleOf(m.id)
                  return (
                    <button
                      key={m.id}
                      onClick={() => onAssign(ri, m.id)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-brand/5 text-left transition"
                    >
                      <span
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: m.dot }}
                      >
                        {avatarInitial(m.name)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-txt-primary truncate">{m.name}</div>
                        <div className="text-xs text-txt-tertiary">
                          {m.team}
                          {other ? ` · 현재 ${other}` : ' · 미배정'}
                        </div>
                      </div>
                      <span className="text-brand text-xs font-semibold shrink-0">배정 +</span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="text-sm text-txt-tertiary py-8 text-center bg-surface-sunken rounded-xl">
                배정 가능한 멤버가 없습니다.
              </div>
            )}
          </div>
        </div>
        <footer className="p-4 border-t border-border bg-surface-sunken/60">
          <div className="text-xs text-txt-tertiary">한 멤버는 하나의 역할만 가집니다.</div>
        </footer>
      </div>
    </div>,
    document.body
  )
}

// ──────────────────────────────────────────────
// DiffModal — 저장 전 변경 사항 확인
// ──────────────────────────────────────────────
type Change = {
  kind: 'role-add' | 'admin' | 'access-add' | 'access-remove'
  role: string
  ri: number
  channel?: string
  to?: boolean
}

export function DiffModal({
  clubName,
  roles,
  channels,
  assignments,
  snapshot,
  saving,
  onClose,
  onConfirm,
}: {
  clubName: string
  roles: Role[]
  channels: Channel[]
  assignments: Record<number, string[]>
  snapshot: string | null
  saving: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const { changes, byRole, affectedMembers, affectedRoles } = useMemo(() => {
    if (!snapshot)
      return {
        changes: [] as Change[],
        byRole: {} as Record<string, Change[]>,
        affectedMembers: 0,
        affectedRoles: 0,
      }
    const before = JSON.parse(snapshot) as {
      roles: (Role & { access: string[] })[]
      channels: Channel[]
    }
    const out: Change[] = []
    const roleSet = new Set<number>()
    roles.forEach((role, ri) => {
      const br = before.roles[ri]
      if (!br) {
        out.push({ kind: 'role-add', role: role.name, ri })
        roleSet.add(ri)
        return
      }
      if (br.admin !== role.admin) {
        out.push({ kind: 'admin', role: role.name, ri, to: role.admin })
        roleSet.add(ri)
      }
      const beforeSet = new Set(br.access)
      channels.forEach((c) => {
        const wasIn = beforeSet.has(c.name)
        const isIn = role.access.has(c.name)
        if (wasIn && !isIn) {
          out.push({ kind: 'access-remove', role: role.name, ri, channel: c.name })
          roleSet.add(ri)
        }
        if (!wasIn && isIn) {
          out.push({ kind: 'access-add', role: role.name, ri, channel: c.name })
          roleSet.add(ri)
        }
      })
    })
    const group: Record<string, Change[]> = {}
    out.forEach((c) => {
      if (!group[c.role]) group[c.role] = []
      group[c.role].push(c)
    })
    const mem = [...roleSet].reduce((n, ri) => n + (assignments[ri]?.length || 0), 0)
    return { changes: out, byRole: group, affectedMembers: mem, affectedRoles: roleSet.size }
  }, [roles, channels, assignments, snapshot])

  if (changes.length === 0) {
    return (
      <Modal isOpen={true} onClose={onClose} size="md" showClose={false}>
        <div className="p-6">
          <h3 className="text-lg font-bold mb-2">변경 사항 없음</h3>
          <p className="text-sm text-txt-secondary mb-6">저장된 설정과 차이가 없습니다.</p>
          <Button variant="secondary" fullWidth onClick={onClose}>
            닫기
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={true} onClose={onClose} size="lg" showClose={false}>
      <div className="flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-bold mb-1">설정 저장 전 확인</h3>
          <p className="text-sm text-txt-secondary">
            아래 변경 사항이 <span className="font-medium text-txt-primary">{clubName}</span> 권한 설정에 반영됩니다. Discord에도 반영하려면 별도 작업(Phase 3)이 필요합니다.
          </p>
        </div>
        <div className="px-6 py-4 border-b border-border bg-surface-sunken/60">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs text-txt-tertiary mb-1">변경 사항</div>
              <div className="font-bold text-lg text-txt-primary">{changes.length}건</div>
            </div>
            <div>
              <div className="text-xs text-txt-tertiary mb-1">영향받는 역할</div>
              <div className="font-bold text-lg text-txt-primary">{affectedRoles}개</div>
            </div>
            <div>
              <div className="text-xs text-txt-tertiary mb-1">영향받는 멤버</div>
              <div className="font-bold text-lg text-brand">{affectedMembers}명</div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {Object.entries(byRole).map(([roleName, items]) => {
            const role = roles.find((r) => r.name === roleName)
            return (
              <div key={roleName} className="mb-5 last:mb-0">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: role?.dot || '#9ca3af' }}
                  />
                  <span className="font-semibold text-sm text-txt-primary">{roleName}</span>
                  <span className="text-xs text-txt-tertiary">{items.length}건</span>
                </div>
                <div className="space-y-1.5">
                  {items.map((c, i) => {
                    if (c.kind === 'access-add')
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-2.5 rounded-xl bg-brand/5 text-sm"
                        >
                          <span className="text-brand font-semibold text-xs px-2 py-0.5 rounded-md bg-surface-card ring-1 ring-brand/20">
                            접근 가능
                          </span>
                          <span className="text-txt-primary flex-1"># {c.channel}</span>
                        </div>
                      )
                    if (c.kind === 'access-remove')
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-sunken text-sm"
                        >
                          <span className="text-txt-tertiary font-semibold text-xs px-2 py-0.5 rounded-md bg-surface-card ring-1 ring-border">
                            접근 불가
                          </span>
                          <span className="text-txt-tertiary flex-1"># {c.channel}</span>
                        </div>
                      )
                    if (c.kind === 'admin')
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-2.5 rounded-xl bg-violet-50 text-sm"
                        >
                          <span className="text-violet-700 font-semibold text-xs px-2 py-0.5 rounded-md bg-surface-card ring-1 ring-violet-200">
                            {c.to ? '관리자 지정' : '관리자 해제'}
                          </span>
                        </div>
                      )
                    return null
                  })}
                </div>
              </div>
            )
          })}
        </div>
        <div className="p-5 border-t border-border flex items-center gap-2">
          <Button variant="secondary" fullWidth onClick={onClose} disabled={saving}>
            취소
          </Button>
          <Button variant="blue" fullWidth onClick={onConfirm} loading={saving}>
            저장하기
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ──────────────────────────────────────────────
// AddRoleModal — 새 역할 추가
// ──────────────────────────────────────────────
export function AddRoleModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (name: string, desc: string) => void
}) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [err, setErr] = useState(false)
  return (
    <Modal isOpen={true} onClose={onClose} size="md" showClose={false}>
      <div className="p-6">
        <h3 className="text-lg font-bold mb-1.5">새 역할 추가</h3>
        <p className="text-sm text-txt-secondary mb-5">역할 이름과 간단한 설명을 입력해주세요.</p>
        <label className="block mb-3.5">
          <span className="text-xs font-medium text-txt-secondary block mb-1.5">
            역할 이름 <span className="text-brand">*</span>
          </span>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setErr(false)
            }}
            placeholder="예: 팀장 · 마케팅"
            className={cn(
              'w-full px-4 py-2.5 rounded-xl border outline-hidden transition text-sm bg-surface-sunken focus:bg-surface-card focus:ring-4',
              err
                ? 'border-red-400 ring-4 ring-red-100'
                : 'border-border focus:border-brand focus:ring-brand/20'
            )}
            autoFocus
          />
        </label>
        <label className="block mb-3.5">
          <span className="text-xs font-medium text-txt-secondary block mb-1.5">설명</span>
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="예: 마케팅팀 관리"
            className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-brand focus:ring-4 focus:ring-brand/20 outline-hidden transition text-sm bg-surface-sunken focus:bg-surface-card"
          />
          <span className="text-xs text-txt-tertiary mt-1 block">생략할 수 있습니다.</span>
        </label>
        <div className="flex gap-2 mt-6">
          <Button variant="secondary" fullWidth onClick={onClose}>
            취소
          </Button>
          <Button
            variant="blue"
            fullWidth
            onClick={() => {
              if (!name.trim()) {
                setErr(true)
                return
              }
              onSubmit(name.trim(), desc.trim())
            }}
          >
            추가
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ──────────────────────────────────────────────
// AddChannelModal — 새 채널 추가
// ──────────────────────────────────────────────
export function AddChannelModal({
  existingCategories,
  onClose,
  onSubmit,
}: {
  existingCategories: string[]
  onClose: () => void
  onSubmit: (name: string, cat: string) => void
}) {
  const [name, setName] = useState('')
  const [cat, setCat] = useState(existingCategories[0] || '일반')
  const [err, setErr] = useState(false)
  return (
    <Modal isOpen={true} onClose={onClose} size="md" showClose={false}>
      <div className="p-6">
        <h3 className="text-lg font-bold mb-1.5">새 채널 추가</h3>
        <p className="text-sm text-txt-secondary mb-5">
          Discord에 생성될 채널 이름과 카테고리를 입력해주세요.
        </p>
        <label className="block mb-3.5">
          <span className="text-xs font-medium text-txt-secondary block mb-1.5">
            채널 이름 <span className="text-brand">*</span>
          </span>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setErr(false)
            }}
            placeholder="예: 마케팅"
            className={cn(
              'w-full px-4 py-2.5 rounded-xl border outline-hidden transition text-sm bg-surface-sunken focus:bg-surface-card focus:ring-4',
              err
                ? 'border-red-400 ring-4 ring-red-100'
                : 'border-border focus:border-brand focus:ring-brand/20'
            )}
            autoFocus
          />
          <span className="text-xs text-txt-tertiary mt-1 block">
            # 기호는 자동으로 붙습니다.
          </span>
        </label>
        <label className="block mb-3.5">
          <span className="text-xs font-medium text-txt-secondary block mb-1.5">카테고리</span>
          <input
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-brand focus:ring-4 focus:ring-brand/20 outline-hidden transition text-sm bg-surface-sunken focus:bg-surface-card"
          />
          <span className="text-xs text-txt-tertiary mt-1 block">
            기존: {existingCategories.join(', ') || '없음'}
          </span>
        </label>
        <div className="flex gap-2 mt-6">
          <Button variant="secondary" fullWidth onClick={onClose}>
            취소
          </Button>
          <Button
            variant="blue"
            fullWidth
            onClick={() => {
              if (!name.trim()) {
                setErr(true)
                return
              }
              onSubmit(name.trim(), cat.trim() || '일반')
            }}
          >
            추가
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ──────────────────────────────────────────────
// ConfirmModal — 일반 확인 다이얼로그 (destructive 옵션)
// ──────────────────────────────────────────────
export function ConfirmModal({
  title,
  description,
  confirmText = '확인',
  destructive = false,
  onCancel,
  onConfirm,
}: {
  title: string
  description: string
  confirmText?: string
  destructive?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Modal isOpen={true} onClose={onCancel} size="md" showClose={false}>
      <div className="p-6">
        <h3 className="text-lg font-bold mb-1.5">{title}</h3>
        <p className="text-sm text-txt-secondary mb-6 leading-relaxed">{description}</p>
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={onCancel}>
            취소
          </Button>
          <Button
            variant={destructive ? 'danger' : 'blue'}
            fullWidth
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
