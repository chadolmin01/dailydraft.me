'use client'

import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { PageContainer } from '@/components/ui/PageContainer'
import { Button, IconButton } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/src/lib/utils'
import type {
  WizardStep,
  MemberSource,
  Channel,
  Role,
  Member,
  ServerConfig,
  UserConnection,
  Warning,
} from './permissions/_types'
import { PRESETS, ASSIGNMENT_TEMPLATES, DOT_PALETTE } from './permissions/_constants'
import {
  seedToRoles,
  groupChannels,
  avatarInitial,
  takeSnapshot,
  applyTemplate,
  makeMembers,
  serverToLocal,
  computeWarnings,
} from './permissions/_helpers'
import {
  ChannelEditorModal,
  MemberDrawer,
  DiffModal,
  AddRoleModal,
  AddChannelModal,
  ConfirmModal,
} from './permissions/_modals'
import { WizardView } from './permissions/_wizard'
import { MainView } from './permissions/_views'

// ============================================
// Main Client Component
// ============================================
interface Props { slug: string; clubName: string; clubId: string }

export default function PermissionsSettingsClient({ slug, clubName, clubId }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [wizardStep, setWizardStep] = useState<WizardStep>('loading')
  const [memberSource, setMemberSource] = useState<MemberSource | null>(null)

  const [currentPreset, setCurrentPreset] = useState<string | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [assignments, setAssignments] = useState<Record<number, string[]>>({})
  const [snapshot, setSnapshot] = useState<string | null>(null)
  const [allMembers, setAllMembers] = useState<Member[]>([])

  // Discord 상태
  const [discordConnected, setDiscordConnected] = useState(false)
  const [discordGuildName, setDiscordGuildName] = useState<string | null>(null)

  // 사용자 OAuth / pending 상태
  const [userDiscordLinked, setUserDiscordLinked] = useState(false)
  const [pendingSetups, setPendingSetups] = useState<UserConnection['pending_setups']>([])

  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [installStarted, setInstallStarted] = useState(false)

  // Modals
  const [channelEditorRi, setChannelEditorRi] = useState<number | null>(null)
  const [memberDrawerRi, setMemberDrawerRi] = useState<number | null>(null)
  const [diffOpen, setDiffOpen] = useState(false)
  const [addRoleOpen, setAddRoleOpen] = useState(false)
  const [addChannelOpen, setAddChannelOpen] = useState(false)
  const [confirmState, setConfirmState] = useState<{
    title: string; description: string; confirmText?: string; destructive?: boolean;
    onConfirm: () => void
  } | null>(null)

  // ----- Load config + user Discord state -----
  const loadConfig = useCallback(async () => {
    try {
      const [cfgRes, userRes] = await Promise.all([
        fetch(`/api/clubs/${slug}/permissions`, { credentials: 'include' }),
        fetch(`/api/discord/connect`, { credentials: 'include' }),
      ])

      if (!cfgRes.ok) throw new Error('config_failed')
      const cfg = (await cfgRes.json()) as ServerConfig

      const userConn = userRes.ok
        ? ((await userRes.json()) as UserConnection)
        : { discord_linked: false, pending_setups: [] }

      setAllMembers(makeMembers(cfg.available_members))
      setDiscordConnected(cfg.discord.connected)
      setDiscordGuildName(cfg.discord.guild_name)
      setUserDiscordLinked(userConn.discord_linked)
      setPendingSetups(userConn.pending_setups ?? [])

      // 권한이 이미 구성돼 있으면 바로 메인뷰
      if (cfg.roles.length > 0) {
        const local = serverToLocal(cfg)
        setRoles(local.roles)
        setChannels(local.channels)
        setAssignments(local.assignments)
        setCurrentPreset(cfg.club.permission_preset ?? 'imported')
        setMemberSource(cfg.club.permission_member_source ?? 'manual')
        setSnapshot(takeSnapshot(local.roles, local.channels, local.assignments, cfg.club.permission_preset, cfg.club.permission_member_source))
        setWizardStep('done')
        return
      }

      // 위저드 진입 단계 결정
      if (!userConn.discord_linked) {
        setWizardStep('connect-account')
      } else if (!cfg.discord.connected) {
        // 클럽에 봇 아직 없음 — pending setup 있으면 연결 대기
        if (userConn.pending_setups && userConn.pending_setups.length > 0) {
          setWizardStep('pending-link')
        } else {
          setWizardStep('invite-bot')
        }
      } else {
        setWizardStep('source')
      }
    } catch {
      toast.error('설정을 불러오지 못했습니다')
    }
  }, [slug])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  // URL 쿼리 ?discord=connected 정리 (OAuth 리턴 직후)
  useEffect(() => {
    if (searchParams.get('discord') === 'connected') {
      const newUrl = `/clubs/${slug}/settings/permissions`
      router.replace(newUrl)
    }
  }, [searchParams, router, slug])

  // ----- Local presets (without Discord import) -----
  const applyPreset = (key: string) => {
    if (key === 'custom') {
      const chs: Channel[] = [
        { name: '공지', category: '일반' },
        { name: '라운지', category: '일반' },
      ]
      const rs: Role[] = [
        { name: '회장', desc: '최고 권한', admin: true, dot: '#8b5cf6', access: new Set(['공지','라운지']) },
        { name: '회원', desc: '정식 구성원', admin: false, dot: '#6b7280', access: new Set(['공지','라운지']) },
      ]
      const asn: Record<number, string[]> = { 0: [], 1: [] }
      if (allMembers[0]) asn[0] = [allMembers[0].id]
      if (allMembers.length > 1) asn[1] = allMembers.slice(1).map((m) => m.id)
      setCurrentPreset('custom')
      setChannels(chs)
      setRoles(rs)
      setAssignments(asn)
      return
    }
    const p = PRESETS[key]
    if (!p) return
    const chs = p.channels.map((c) => ({ ...c }))
    const rs = seedToRoles(p.roles, chs)
    const template = ASSIGNMENT_TEMPLATES[key]
    const asn = template ? applyTemplate(template, allMembers) : {}
    rs.forEach((_, i) => { if (!asn[i]) asn[i] = [] })
    setCurrentPreset(key)
    setChannels(chs)
    setRoles(rs)
    setAssignments(asn)
  }

  const pickPreset = (key: string) => {
    applyPreset(key)
    setWizardStep('members')
  }

  // ----- Actions: real Discord integration -----
  const startAccountLink = () => {
    const returnTo = `/clubs/${slug}/settings/permissions`
    window.location.href = `/api/discord/oauth?returnTo=${encodeURIComponent(returnTo)}`
  }

  const startBotInstall = () => {
    setInstallStarted(true)
    window.open(`/api/discord/install?club=${encodeURIComponent(slug)}`, '_blank', 'noopener')
    // 사용자가 봇을 초대하면 pending_discord_setups에 기록되고 → 다음 refresh 때 감지됨
    toast.success('Discord에서 봇을 초대한 뒤 "연결 상태 확인"을 눌러주세요')
  }

  const linkPendingSetup = async (guildId: string) => {
    try {
      const res = await fetch('/api/discord/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ guild_id: guildId, club_id: clubId }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err?.error?.message as string) || 'link_failed')
      }
      toast.success('Discord 서버가 연결되었습니다')
      await loadConfig()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '서버 연결 실패')
    }
  }

  const importFromDiscord = async () => {
    setImporting(true)
    try {
      const res = await fetch(`/api/clubs/${slug}/permissions/import-from-discord`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err?.error?.message as string) || 'import_failed')
      }
      const body = await res.json() as { imported?: { roles: number; channels: number; matched_members: number; total_discord_members: number } }
      toast.success(
        `가져왔습니다 · 역할 ${body.imported?.roles ?? 0}개, 채널 ${body.imported?.channels ?? 0}개, 매칭 멤버 ${body.imported?.matched_members ?? 0}/${body.imported?.total_discord_members ?? 0}명`
      )
      await loadConfig()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '가져오기 실패')
    } finally {
      setImporting(false)
    }
  }

  const finishWizard = () => {
    if (!memberSource) return
    if (memberSource === 'manual') {
      const asn: Record<number, string[]> = {}
      roles.forEach((_, i) => { asn[i] = [] })
      if (allMembers[0]) asn[0] = [allMembers[0].id]
      setAssignments(asn)
      setSnapshot(takeSnapshot(roles, channels, asn, currentPreset, memberSource))
    } else {
      setSnapshot(takeSnapshot(roles, channels, assignments, currentPreset, memberSource))
    }
    setWizardStep('done')
    toast.success('설정이 완료되었습니다. 저장하려면 "변경 사항 저장"을 눌러주세요')
  }

  const disconnect = () => {
    setConfirmState({
      title: 'Discord 연결을 해제하시겠습니까?',
      description: 'discord_bot_installations · ghostwriter 설정 · 채널 매핑이 함께 삭제됩니다. 권한 시스템 설정은 유지됩니다.',
      confirmText: '연결 해제',
      destructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch('/api/discord/connect', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ club_id: clubId }),
          })
          if (!res.ok) throw new Error('disconnect_failed')
          toast.success('Discord 연결이 해제되었습니다')
          await loadConfig()
        } catch (e) {
          toast.error(e instanceof Error ? e.message : '해제 실패')
        }
      },
    })
  }

  const resetPreset = () => {
    setConfirmState({
      title: '구조를 다시 선택하시겠습니까?',
      description: '역할·채널 설정이 사라집니다. 변경 사항 저장을 누르기 전까지는 DB에 반영되지 않습니다.',
      confirmText: '다시 선택',
      destructive: true,
      onConfirm: () => {
        setWizardStep('source')
        setCurrentPreset(null)
        setRoles([])
        setChannels([])
        setAssignments({})
      },
    })
  }

  // ----- Role/Channel local ops -----
  const toggleAdmin = (ri: number) => {
    setRoles((prev) => prev.map((r, i) => i === ri ? { ...r, admin: !r.admin } : r))
  }

  const addRole = (name: string, desc: string) => {
    const dot = DOT_PALETTE[roles.length % DOT_PALETTE.length]
    setRoles((prev) => [...prev, { name, desc, admin: false, dot, access: new Set() }])
    setAssignments((prev) => ({ ...prev, [roles.length]: [] }))
    toast.success(`"${name}" 역할을 추가했습니다`)
  }

  const removeRole = (ri: number) => {
    const role = roles[ri]
    setConfirmState({
      title: '역할을 삭제하시겠습니까?',
      description: `"${role.name}" 역할과 해당 멤버 배정이 모두 제거됩니다.`,
      confirmText: '삭제',
      destructive: true,
      onConfirm: () => {
        setRoles((prev) => prev.filter((_, i) => i !== ri))
        setAssignments((prev) => {
          const next: Record<number, string[]> = {}
          Object.entries(prev).forEach(([k, v]) => {
            const n = Number(k)
            if (n === ri) return
            next[n > ri ? n - 1 : n] = v
          })
          return next
        })
        toast(`"${role.name}" 역할을 삭제했습니다`)
      },
    })
  }

  const addChannel = (name: string, category: string) => {
    const clean = name.replace(/^#\s*/, '')
    setChannels((prev) => [...prev, { name: clean, category: category || '일반' }])
    toast.success(`"# ${clean}" 채널을 추가했습니다`)
  }

  const saveChannelAccess = (ri: number, next: Set<string>) => {
    setRoles((prev) => prev.map((r, i) => i === ri ? { ...r, access: next } : r))
    toast.success(`"${roles[ri].name}" 채널 접근을 저장했습니다`)
  }

  const assignMember = (ri: number, mid: string) => {
    setAssignments((prev) => {
      const next: Record<number, string[]> = {}
      Object.entries(prev).forEach(([k, v]) => { next[Number(k)] = v.filter((id) => id !== mid) })
      if (!next[ri]) next[ri] = []
      next[ri] = [...next[ri], mid]
      return next
    })
  }
  const unassignMember = (ri: number, mid: string) => {
    setAssignments((prev) => ({ ...prev, [ri]: (prev[ri] || []).filter((id) => id !== mid) }))
  }

  // ----- Save -----
  async function applyToServer() {
    setSaving(true)
    try {
      const body = {
        permission_preset: currentPreset,
        permission_member_source: memberSource,
        channels: channels.map((c, i) => ({ name: c.name, category: c.category, display_order: i })),
        roles: roles.map((r, i) => ({
          name: r.name,
          description: r.desc,
          is_admin: r.admin,
          dot_color: r.dot,
          display_order: i,
          channel_names: [...r.access],
          member_user_ids: (assignments[i] ?? []).filter(Boolean),
        })),
      }
      const res = await fetch(`/api/clubs/${slug}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err?.error?.message as string) || '저장 실패')
      }
      setSnapshot(takeSnapshot(roles, channels, assignments, currentPreset, memberSource))
      setDiffOpen(false)
      toast.success('변경 사항을 저장했습니다')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '저장 실패')
    } finally {
      setSaving(false)
    }
  }

  const dirty = useMemo(
    () => snapshot !== null && takeSnapshot(roles, channels, assignments, currentPreset, memberSource) !== snapshot,
    [roles, channels, assignments, currentPreset, memberSource, snapshot]
  )
  const warnings = useMemo(() => computeWarnings(roles, channels, assignments, allMembers), [roles, channels, assignments, allMembers])

  // ============================================
  // Render
  // ============================================
  if (wizardStep === 'loading') {
    return (
      <PageContainer size="wide" className="py-8 sm:py-10">
        <div className="flex items-center gap-1.5 text-sm text-txt-tertiary mb-3">
          <span>{clubName}</span><span>·</span><span>설정</span><span>·</span>
          <span className="text-txt-primary">역할·권한</span>
        </div>
        <div className="space-y-3 animate-pulse">
          <div className="h-16 bg-surface-sunken rounded-2xl" />
          <div className="h-10 bg-surface-sunken rounded-xl" />
          <div className="h-40 bg-surface-sunken rounded-2xl" />
          <div className="h-40 bg-surface-sunken rounded-2xl" />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer size="wide" className="py-8 sm:py-10">
      <div className="flex items-center gap-1.5 text-sm text-txt-tertiary mb-3">
        <span>{clubName}</span><span>·</span><span>설정</span><span>·</span>
        <span className="text-txt-primary">역할·권한</span>
      </div>

      {wizardStep !== 'done' ? (
        <WizardView
          step={wizardStep}
          userDiscordLinked={userDiscordLinked}
          discordConnected={discordConnected}
          discordGuildName={discordGuildName}
          pendingSetups={pendingSetups}
          memberCount={allMembers.length}
          memberSource={memberSource}
          installStarted={installStarted}
          importing={importing}
          onStartAccountLink={startAccountLink}
          onStartBotInstall={startBotInstall}
          onRefreshState={loadConfig}
          onLinkPending={linkPendingSetup}
          onImportFromDiscord={importFromDiscord}
          onGoPreset={() => setWizardStep('preset')}
          onPickPreset={pickPreset}
          onBackSource={() => setWizardStep('source')}
          onBackFromMembers={() => setWizardStep('preset')}
          onChooseMemberSource={setMemberSource}
          onFinish={finishWizard}
        />
      ) : (
        <MainView
          clubName={clubName}
          discordGuildName={discordGuildName}
          memberCount={allMembers.length}
          roles={roles}
          channels={channels}
          assignments={assignments}
          allMembers={allMembers}
          currentPreset={currentPreset}
          memberSource={memberSource}
          warnings={warnings}
          dirty={dirty}
          saving={saving}
          onDisconnect={disconnect}
          onResetPreset={resetPreset}
          onAddRoleOpen={() => setAddRoleOpen(true)}
          onAddChannelOpen={() => setAddChannelOpen(true)}
          onChannelEdit={setChannelEditorRi}
          onMemberEdit={setMemberDrawerRi}
          onToggleAdmin={toggleAdmin}
          onRemoveRole={removeRole}
          onApply={() => setDiffOpen(true)}
        />
      )}

      {addRoleOpen && (
        <AddRoleModal
          onClose={() => setAddRoleOpen(false)}
          onSubmit={(name, desc) => { addRole(name, desc); setAddRoleOpen(false) }}
        />
      )}
      {addChannelOpen && (
        <AddChannelModal
          existingCategories={[...new Set(channels.map((c) => c.category))]}
          onClose={() => setAddChannelOpen(false)}
          onSubmit={(name, cat) => { addChannel(name, cat); setAddChannelOpen(false) }}
        />
      )}
      {channelEditorRi !== null && (
        <ChannelEditorModal
          role={roles[channelEditorRi]}
          channels={channels}
          onClose={() => setChannelEditorRi(null)}
          onSave={(next) => { saveChannelAccess(channelEditorRi, next); setChannelEditorRi(null) }}
        />
      )}
      {memberDrawerRi !== null && (
        <MemberDrawer
          ri={memberDrawerRi}
          role={roles[memberDrawerRi]}
          members={allMembers}
          assignments={assignments}
          roles={roles}
          onClose={() => setMemberDrawerRi(null)}
          onAssign={assignMember}
          onUnassign={unassignMember}
        />
      )}
      {diffOpen && (
        <DiffModal
          clubName={clubName}
          roles={roles}
          channels={channels}
          assignments={assignments}
          snapshot={snapshot}
          saving={saving}
          onClose={() => { if (!saving) setDiffOpen(false) }}
          onConfirm={applyToServer}
        />
      )}
      {confirmState && (
        <ConfirmModal
          title={confirmState.title}
          description={confirmState.description}
          confirmText={confirmState.confirmText}
          destructive={confirmState.destructive}
          onCancel={() => setConfirmState(null)}
          onConfirm={() => { confirmState.onConfirm(); setConfirmState(null) }}
        />
      )}
    </PageContainer>
  )
}



