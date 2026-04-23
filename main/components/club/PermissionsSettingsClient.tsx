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

// ============================================
// Types
// ============================================
type WizardStep = 'loading' | 'connect-account' | 'invite-bot' | 'pending-link' | 'source' | 'preset' | 'members' | 'done'
type MemberSource = 'discord-sync' | 'draft-match' | 'manual'
type Channel = { name: string; category: string }
type PresetRoleSeed = { name: string; desc: string; admin: boolean; dot: string; access: 'all' | string[] }
type Role = { name: string; desc: string; admin: boolean; dot: string; access: Set<string> }
type Member = { id: string; name: string; team: string; dot: string }

type ServerConfig = {
  club: {
    id: string
    name: string
    slug: string
    permission_preset: string | null
    permission_member_source: MemberSource | null
  }
  discord: {
    connected: boolean
    guild_id: string | null
    guild_name: string | null
    connected_at: string | null
  }
  roles: {
    id: string
    name: string
    description: string
    is_admin: boolean
    dot_color: string
    display_order: number
    channel_names: string[]
    member_user_ids: string[]
  }[]
  channels: { id: string; name: string; category: string; display_order: number }[]
  available_members: { user_id: string; display_name: string; avatar_url: string | null; club_member_role: string }[]
}

type UserConnection = {
  discord_linked: boolean
  pending_setups: { discord_guild_id: string; discord_guild_name: string | null }[]
}

// ============================================
// 프리셋
// ============================================
const PRESETS: Record<string, {
  icon: string; name: string; desc: string; meta: string;
  channels: Channel[]; roles: PresetRoleSeed[];
}> = {
  general: {
    icon: '🎓', name: '일반형', desc: '대부분의 학생 동아리·학회', meta: '5개 역할 · 4개 채널',
    channels: [
      { name: '공지', category: '일반' },
      { name: '자유', category: '일반' },
      { name: '라운지', category: '일반' },
      { name: '임원진', category: '운영' },
    ],
    roles: [
      { name: '회장', desc: '최고 권한', admin: true, dot: '#8b5cf6', access: 'all' },
      { name: '부회장', desc: '운영 전반', admin: true, dot: '#3b82f6', access: 'all' },
      { name: '임원진', desc: '총무·기획·홍보 등', admin: true, dot: '#10b981', access: 'all' },
      { name: '회원', desc: '정식 구성원', admin: false, dot: '#6b7280', access: ['공지','자유','라운지'] },
      { name: '게스트', desc: '견학·초대 인원', admin: false, dot: '#9ca3af', access: ['공지','라운지'] },
    ],
  },
  academic: {
    icon: '📚', name: '학술형', desc: '세미나·연구·스터디 중심', meta: '5개 역할 · 5개 채널',
    channels: [
      { name: '공지', category: '일반' },
      { name: '라운지', category: '일반' },
      { name: '임원진', category: '운영' },
      { name: '세미나', category: '활동' },
      { name: '스터디', category: '활동' },
    ],
    roles: [
      { name: '회장', desc: '최고 권한', admin: true, dot: '#8b5cf6', access: 'all' },
      { name: '부회장', desc: '운영 전반', admin: true, dot: '#3b82f6', access: 'all' },
      { name: '임원진', desc: '총무·세미나장 등', admin: true, dot: '#10b981', access: 'all' },
      { name: '정회원', desc: '스터디 정규 참여', admin: false, dot: '#6b7280', access: ['공지','세미나','스터디','라운지'] },
      { name: '게스트', desc: '체험·청강', admin: false, dot: '#9ca3af', access: ['공지','라운지'] },
    ],
  },
  sports: {
    icon: '⚽', name: '운동형', desc: '체육·스포츠 동아리', meta: '6개 역할 · 6개 채널',
    channels: [
      { name: '공지', category: '일반' },
      { name: '라운지', category: '일반' },
      { name: '임원진', category: '운영' },
      { name: '경기-일정', category: '활동' },
      { name: '훈련', category: '활동' },
      { name: '경기-결과', category: '활동' },
    ],
    roles: [
      { name: '회장', desc: '최고 권한', admin: true, dot: '#8b5cf6', access: 'all' },
      { name: '부회장', desc: '운영 전반', admin: true, dot: '#3b82f6', access: 'all' },
      { name: '주장', desc: '팀 운영', admin: true, dot: '#10b981', access: 'all' },
      { name: '매니저', desc: '경기·훈련 관리', admin: false, dot: '#f59e0b', access: ['공지','임원진','경기-일정','훈련','경기-결과','라운지'] },
      { name: '선수', desc: '정식 선수', admin: false, dot: '#6b7280', access: ['공지','경기-일정','훈련','경기-결과','라운지'] },
      { name: '게스트', desc: '체험·견학', admin: false, dot: '#9ca3af', access: ['공지','라운지'] },
    ],
  },
  startup: {
    icon: '🚀', name: '프로젝트형', desc: '프로덕트 제작 · 팀 단위 (예: FLIP)', meta: '6개 역할 · 7개 채널',
    channels: [
      { name: '공지', category: '일반' },
      { name: '라운지', category: '일반' },
      { name: '임원진', category: '운영' },
      { name: '개발팀', category: '팀' },
      { name: '디자인팀', category: '팀' },
      { name: '기획팀', category: '팀' },
      { name: '개발-피드', category: '팀' },
    ],
    roles: [
      { name: '회장', desc: '최고 권한', admin: true, dot: '#8b5cf6', access: 'all' },
      { name: '부회장', desc: '운영 전반', admin: true, dot: '#3b82f6', access: 'all' },
      { name: '팀장 · 개발', desc: '개발팀 리드', admin: false, dot: '#10b981', access: ['공지','임원진','개발팀','라운지','개발-피드'] },
      { name: '팀장 · 디자인', desc: '디자인팀 리드', admin: false, dot: '#f59e0b', access: ['공지','임원진','디자인팀','라운지'] },
      { name: '팀원', desc: '소속 팀 활동', admin: false, dot: '#6b7280', access: ['공지','개발팀','디자인팀','기획팀','라운지','개발-피드'] },
      { name: '게스트', desc: '견학·초대 인원', admin: false, dot: '#9ca3af', access: ['공지','라운지'] },
    ],
  },
}

const ASSIGNMENT_TEMPLATES: Record<string, Record<number, number[]>> = {
  general:  { 0: [0], 1: [1], 2: [2,3,4], 3: [5,6,7,8,9,10,11], 4: [] },
  academic: { 0: [0], 1: [1], 2: [2,3,4], 3: [5,6,7,8,9,10,11], 4: [] },
  sports:   { 0: [0], 1: [1], 2: [2], 3: [3,4], 4: [5,6,7,8,9,10,11], 5: [] },
  startup:  { 0: [0], 1: [1], 2: [2], 3: [3], 4: [4,5,6,7,8,9,10,11], 5: [] },
}

const DOT_PALETTE = ['#8b5cf6','#3b82f6','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6','#6b7280']

// ============================================
// Helpers
// ============================================
function seedToRoles(seeds: PresetRoleSeed[], chs: Channel[]): Role[] {
  return seeds.map((r) => ({
    ...r,
    access: new Set(r.access === 'all' ? chs.map((c) => c.name) : r.access),
  }))
}
function groupChannels(chs: Channel[]): Record<string, Channel[]> {
  return chs.reduce<Record<string, Channel[]>>((acc, c) => {
    if (!acc[c.category]) acc[c.category] = []
    acc[c.category].push(c)
    return acc
  }, {})
}
function avatarInitial(name: string) { return name.slice(-2) }

function takeSnapshot(roles: Role[], channels: Channel[], assignments: Record<number, string[]>, preset: string | null, memberSource: MemberSource | null): string {
  return JSON.stringify({
    roles: roles.map((r) => ({ ...r, access: [...r.access].sort() })),
    channels,
    assignments: Object.entries(assignments).map(([k, v]) => [k, [...v].sort()]),
    preset,
    memberSource,
  })
}

function applyTemplate(template: Record<number, number[]>, members: Member[]): Record<number, string[]> {
  const out: Record<number, string[]> = {}
  Object.entries(template).forEach(([roleIdx, indices]) => {
    out[Number(roleIdx)] = indices
      .map((i) => members[i]?.id)
      .filter((x): x is string => Boolean(x))
  })
  return out
}

function teamLabel(role: string): string {
  if (role === 'owner') return '창립자'
  if (role === 'admin') return '운영진'
  if (role === 'alumni') return '졸업생'
  return '회원'
}

function makeMembers(srv: ServerConfig['available_members']): Member[] {
  return srv.map((m, i) => ({
    id: m.user_id,
    name: m.display_name,
    team: teamLabel(m.club_member_role),
    dot: DOT_PALETTE[i % DOT_PALETTE.length],
  }))
}

function serverToLocal(data: ServerConfig): {
  roles: Role[]
  channels: Channel[]
  assignments: Record<number, string[]>
} {
  const channels = data.channels.map((c) => ({ name: c.name, category: c.category }))
  const roles: Role[] = data.roles.map((r) => ({
    name: r.name, desc: r.description, admin: r.is_admin, dot: r.dot_color,
    access: new Set(r.channel_names),
  }))
  const assignments: Record<number, string[]> = {}
  data.roles.forEach((r, i) => { assignments[i] = [...r.member_user_ids] })
  return { roles, channels, assignments }
}

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

// ============================================
// Warnings
// ============================================
type Warning = { level: 'critical' | 'warning' | 'info'; text: string; hint: string }

function computeWarnings(roles: Role[], channels: Channel[], assignments: Record<number, string[]>, members: Member[]): Warning[] {
  const warnings: Warning[] = []
  const admins = roles.filter((r) => r.admin)
  const adminMembers = admins.reduce((n, r) => n + (assignments[roles.indexOf(r)]?.length || 0), 0)
  if (admins.length === 0) {
    warnings.push({ level: 'critical', text: '관리자 역할이 없습니다.', hint: '최소 1개가 필요합니다.' })
  } else if (adminMembers === 0) {
    warnings.push({ level: 'critical', text: '관리자 역할에 배정된 멤버가 없습니다.', hint: '최소 1명을 지정해주세요.' })
  }
  channels.forEach((ch) => {
    const any = roles.some((r, ri) => r.access.has(ch.name) && (assignments[ri]?.length || 0) > 0)
    if (!any) warnings.push({
      level: 'warning',
      text: `# ${ch.name} 채널에 접근 가능한 멤버가 없습니다.`,
      hint: '아무도 이 채널을 볼 수 없습니다.',
    })
  })
  const assigned = new Set(Object.values(assignments).flat())
  const unassigned = members.filter((m) => !assigned.has(m.id))
  if (unassigned.length > 0) {
    warnings.push({
      level: 'info',
      text: `${unassigned.length}명의 멤버가 아직 배정되지 않았습니다.`,
      hint: '역할 카드의 "멤버 배정"에서 지정해주세요.',
    })
  }
  return warnings
}

// ============================================
// Wizard View
// ============================================
function WizardView(p: {
  step: WizardStep
  userDiscordLinked: boolean
  discordConnected: boolean
  discordGuildName: string | null
  pendingSetups: UserConnection['pending_setups']
  memberCount: number
  memberSource: MemberSource | null
  installStarted: boolean
  importing: boolean
  onStartAccountLink: () => void
  onStartBotInstall: () => void
  onRefreshState: () => void
  onLinkPending: (guildId: string) => void
  onImportFromDiscord: () => void
  onGoPreset: () => void
  onPickPreset: (key: string) => void
  onBackSource: () => void
  onBackFromMembers: () => void
  onChooseMemberSource: (src: MemberSource) => void
  onFinish: () => void
}) {
  return (
    <div className="max-w-[720px] mx-auto">
      <WizardProgress step={p.step} />
      {p.step === 'connect-account' && <ConnectAccountStep onStart={p.onStartAccountLink} />}
      {p.step === 'invite-bot' && (
        <InviteBotStep
          installStarted={p.installStarted}
          onStart={p.onStartBotInstall}
          onRefresh={p.onRefreshState}
        />
      )}
      {p.step === 'pending-link' && (
        <PendingLinkStep
          pendingSetups={p.pendingSetups}
          onLink={p.onLinkPending}
          onRefresh={p.onRefreshState}
        />
      )}
      {p.step === 'source' && (
        <SourceStep
          guildName={p.discordGuildName}
          memberCount={p.memberCount}
          importing={p.importing}
          onImport={p.onImportFromDiscord}
          onPreset={p.onGoPreset}
        />
      )}
      {p.step === 'preset' && <PresetPicker onPick={p.onPickPreset} onBack={p.onBackSource} />}
      {p.step === 'members' && (
        <MembersStep
          selected={p.memberSource}
          memberCount={p.memberCount}
          onSelect={p.onChooseMemberSource}
          onBack={p.onBackFromMembers}
          onFinish={p.onFinish}
        />
      )}
    </div>
  )
}

function WizardProgress({ step }: { step: WizardStep }) {
  const steps = [
    { key: 'connect-account', label: '1  계정 연결' },
    { key: 'invite-bot', label: '2  봇 초대' },
    { key: 'source', label: '3  구조 선택' },
    { key: 'members', label: '4  멤버' },
  ]
  const currentKey =
    step === 'connect-account' ? 'connect-account'
    : step === 'invite-bot' || step === 'pending-link' ? 'invite-bot'
    : step === 'source' || step === 'preset' ? 'source'
    : 'members'
  const activeIdx = steps.findIndex((s) => s.key === currentKey)
  return (
    <div className="flex items-center gap-2 mb-8 text-xs flex-wrap">
      {steps.map((s, i) => {
        const done = i < activeIdx
        const active = i === activeIdx
        const cls = done ? 'text-brand' : active ? 'text-txt-primary font-semibold' : 'text-txt-tertiary/60'
        return (
          <React.Fragment key={s.key}>
            <span className={cls}>{s.label}</span>
            {i < steps.length - 1 && <span className="text-txt-tertiary/40">—</span>}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function ConnectAccountStep({ onStart }: { onStart: () => void }) {
  return (
    <div>
      <h1 className="text-[28px] font-bold tracking-tight mb-2">Discord 계정을 먼저 연결해주세요</h1>
      <p className="text-txt-secondary mb-8">봇을 서버에 초대하려면 내 Discord 계정을 Draft에 연결해야 합니다.</p>

      <div className="bg-surface-card rounded-2xl border border-border p-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#5865F2] flex items-center justify-center text-white text-2xl font-bold mb-4">D</div>
        <h3 className="font-bold text-txt-primary mb-2">Discord 계정 연결</h3>
        <p className="text-sm text-txt-secondary mb-6 max-w-sm mx-auto">한 번만 연결하면 이후 봇 초대·서버 감지가 자동으로 진행됩니다.</p>
        <button
          onClick={onStart}
          className="w-full max-w-xs mx-auto px-5 py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-sm inline-flex items-center justify-center gap-2 shadow-sm transition"
        >
          Discord로 연결하기
        </button>
      </div>

      <div className="mt-6 bg-surface-sunken rounded-2xl p-5 text-xs text-txt-secondary leading-relaxed">
        <div className="font-semibold text-txt-primary mb-2">이 단계에서 요청하는 권한</div>
        <ul className="space-y-1">
          <li>· Discord 유저 ID·닉네임 (본인 확인용)</li>
          <li>· 가입한 서버 목록 열람</li>
        </ul>
        <p className="mt-3 text-txt-tertiary">메시지 내용은 읽지 않습니다.</p>
      </div>
    </div>
  )
}

function InviteBotStep({
  installStarted, onStart, onRefresh,
}: { installStarted: boolean; onStart: () => void; onRefresh: () => void }) {
  return (
    <div>
      <h1 className="text-[28px] font-bold tracking-tight mb-2">봇을 Discord 서버에 초대해주세요</h1>
      <p className="text-txt-secondary mb-8">새 탭에서 Discord로 이동합니다. 봇 초대 완료 후 아래 버튼을 눌러 상태를 확인해주세요.</p>

      <div className="bg-surface-card rounded-2xl border border-border p-6 space-y-4">
        <Button variant="blue" fullWidth onClick={onStart}>
          {installStarted ? '봇 초대 다시 열기' : '봇 초대 페이지 열기'}
        </Button>
        {installStarted && (
          <>
            <div className="text-xs text-txt-secondary text-center pt-2 border-t border-border">
              초대 완료하셨나요?
            </div>
            <Button variant="secondary" fullWidth onClick={onRefresh}>
              연결 상태 확인
            </Button>
          </>
        )}
      </div>

      <div className="mt-6 bg-surface-sunken rounded-2xl p-5 text-xs text-txt-secondary leading-relaxed space-y-2">
        <div className="font-semibold text-txt-primary">초대 후 진행 순서</div>
        <div>1. 열린 Discord 탭에서 이 클럽에 연결할 서버 선택</div>
        <div>2. 봇 권한 확인 후 "승인"</div>
        <div>3. Draft 탭으로 돌아와 "연결 상태 확인" 클릭</div>
      </div>
    </div>
  )
}

function PendingLinkStep({
  pendingSetups, onLink, onRefresh,
}: { pendingSetups: UserConnection['pending_setups']; onLink: (gid: string) => void; onRefresh: () => void }) {
  return (
    <div>
      <h1 className="text-[28px] font-bold tracking-tight mb-2">연결할 서버를 선택해주세요</h1>
      <p className="text-txt-secondary mb-8">봇이 초대된 서버 중 이 클럽과 연결할 서버를 골라주세요.</p>

      <div className="space-y-3 mb-6">
        {pendingSetups.map((s) => (
          <button
            key={s.discord_guild_id}
            onClick={() => onLink(s.discord_guild_id)}
            className="w-full text-left bg-surface-card border-2 border-brand/30 rounded-2xl p-5 hover:border-brand transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-700 font-bold">
                {s.discord_guild_name?.slice(0, 1) ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-txt-primary truncate">{s.discord_guild_name ?? '이름 없음'}</div>
                <div className="text-xs text-txt-tertiary">연결 대기</div>
              </div>
              <span className="text-brand font-semibold text-sm">이 서버 선택 →</span>
            </div>
          </button>
        ))}
      </div>

      <Button variant="secondary" fullWidth onClick={onRefresh}>목록 새로고침</Button>
    </div>
  )
}

function SourceStep({
  guildName, memberCount, importing, onImport, onPreset,
}: {
  guildName: string | null
  memberCount: number
  importing: boolean
  onImport: () => void
  onPreset: () => void
}) {
  return (
    <div>
      <h1 className="text-[28px] font-bold tracking-tight mb-2">어떻게 시작하시겠어요?</h1>
      <p className="text-txt-secondary mb-8">
        <span className="font-medium text-txt-primary">{guildName ?? '연결된 서버'}</span> 의 구조를 그대로 가져오거나, 프리셋으로 새로 시작할 수 있습니다.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <button
          onClick={onImport}
          disabled={importing}
          className="text-left bg-surface-card border-2 border-brand/30 rounded-2xl p-6 hover:border-brand transition relative disabled:opacity-60 disabled:cursor-wait"
        >
          <span className="absolute top-4 right-4 inline-flex items-center text-xs font-semibold text-brand bg-brand/5 px-2 py-0.5 rounded-md ring-1 ring-brand/20">추천</span>
          <div className="text-2xl mb-3">📥</div>
          <div className="font-bold text-txt-primary mb-1">기존 서버 구조 가져오기</div>
          <p className="text-sm text-txt-secondary mb-4">
            {guildName ?? '서버'}의 역할·채널·멤버를 지금 권한 시스템으로 불러옵니다.
          </p>
          <div className="text-xs text-txt-secondary space-y-1 bg-surface-sunken rounded-xl p-3">
            <div>· 역할 = Discord 역할 (관리자 비트 자동 감지)</div>
            <div>· 채널 = 카테고리별로 그룹핑</div>
            <div>· 멤버 = Draft 가입자 {memberCount}명과 매칭</div>
          </div>
          {importing && (
            <div className="mt-3 text-xs text-brand flex items-center gap-2">
              <span className="inline-block w-3 h-3 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
              가져오는 중...
            </div>
          )}
        </button>
        <button onClick={onPreset} disabled={importing} className="text-left bg-surface-card border border-border rounded-2xl p-6 hover:border-txt-tertiary transition disabled:opacity-60">
          <div className="text-2xl mb-3">✨</div>
          <div className="font-bold text-txt-primary mb-1">프리셋으로 시작</div>
          <p className="text-sm text-txt-secondary mb-4">Draft 표준 구조 중에서 고릅니다.</p>
          <div className="text-xs text-txt-secondary space-y-1 bg-surface-sunken rounded-xl p-3">
            <div>· 일반형 / 학술형 / 운동형 / 프로젝트형</div>
            <div>· 나중에 Discord에 반영 (Phase 3)</div>
          </div>
        </button>
      </div>
    </div>
  )
}

function PresetPicker({ onPick, onBack }: { onPick: (key: string) => void; onBack: () => void }) {
  return (
    <div>
      <h1 className="text-[28px] font-bold tracking-tight mb-2">어떤 동아리이신가요?</h1>
      <p className="text-txt-secondary mb-8">가장 가까운 구조를 선택해주세요. 나중에 자유롭게 바꿀 수 있습니다.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {Object.entries(PRESETS).map(([key, p]) => (
          <button key={key} onClick={() => onPick(key)} className="text-left bg-surface-card border border-border rounded-2xl p-6 hover:border-brand/40 hover:-translate-y-0.5 transition shadow-sm">
            <div className="text-3xl mb-3">{p.icon}</div>
            <div className="font-bold text-txt-primary mb-1">{p.name}</div>
            <div className="text-sm text-txt-secondary mb-3">{p.desc}</div>
            <div className="text-xs text-txt-tertiary">{p.meta}</div>
          </button>
        ))}
      </div>

      <button onClick={() => onPick('custom')} className="w-full bg-surface-card border border-dashed border-border-strong rounded-2xl p-5 text-left hover:border-txt-tertiary transition">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-sunken flex items-center justify-center text-txt-tertiary">+</div>
          <div className="flex-1">
            <div className="font-semibold text-txt-primary">직접 만들기</div>
            <div className="text-sm text-txt-secondary">빈 상태에서 역할·채널을 하나씩 추가합니다.</div>
          </div>
        </div>
      </button>

      <div className="mt-6">
        <button onClick={onBack} className="text-sm text-txt-tertiary hover:text-txt-primary">← 이전으로</button>
      </div>
    </div>
  )
}

function MembersStep(p: {
  selected: MemberSource | null
  memberCount: number
  onSelect: (s: MemberSource) => void
  onBack: () => void
  onFinish: () => void
}) {
  const options: { key: MemberSource; icon: string; title: string; desc: string; badge?: '추천' | '엔터프라이즈' | null }[] = [
    { key: 'discord-sync', icon: '🔄', title: 'Discord 서버 멤버 자동 가져오기', desc: `Discord 역할에 맞춰 ${p.memberCount}명 배정`, badge: '추천' },
    { key: 'draft-match', icon: '🎯', title: 'Draft 가입자와 매칭', desc: '프로필 검증된 멤버만 가져옴', badge: '엔터프라이즈' },
    { key: 'manual', icon: '✍️', title: '수동으로 추가', desc: '직접 배정', badge: null },
  ]
  return (
    <div>
      <h1 className="text-[28px] font-bold tracking-tight mb-2">멤버를 어떻게 가져올까요?</h1>
      <p className="text-txt-secondary mb-8">프리셋 적용 후 멤버 배정 방식을 선택합니다.</p>

      <div className="space-y-3 mb-6">
        {options.map((o) => {
          const selected = p.selected === o.key
          return (
            <button key={o.key} onClick={() => p.onSelect(o.key)}
              className={cn('w-full text-left bg-surface-card border-2 rounded-2xl p-5 hover:border-brand/40 transition',
                selected ? 'border-brand bg-brand/5' : 'border-border')}>
              <div className="flex items-start gap-4">
                <div className="text-2xl">{o.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-txt-primary">{o.title}</span>
                    {o.badge && (
                      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-md ring-1',
                        o.badge === '추천' ? 'text-brand bg-brand/5 ring-brand/20' : 'text-violet-700 bg-violet-50 ring-violet-100')}>
                        {o.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-txt-secondary">{o.desc}</div>
                </div>
                <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5',
                  selected ? 'border-brand bg-brand' : 'border-border-strong')}>
                  {selected && <span className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={p.onBack}>이전</Button>
        <Button variant="blue" fullWidth onClick={p.onFinish} disabled={!p.selected}>
          {p.selected ? '완료 — 편집 화면으로' : '멤버 가져오기 방식을 선택해주세요'}
        </Button>
      </div>
    </div>
  )
}

// ============================================
// Main View (Role Cards)
// ============================================
function MainView(p: {
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
  const presetName = p.currentPreset === 'custom' ? '직접 만들기'
    : p.currentPreset === 'imported' ? '가져온 구조'
    : p.currentPreset ? PRESETS[p.currentPreset]?.name ?? p.currentPreset : '—'
  const memberSourceLabel = p.memberSource === 'discord-sync' ? 'Discord 자동 동기화'
    : p.memberSource === 'draft-match' ? 'Draft 매칭' : '수동 관리'
  const categoriesCount = new Set(p.channels.map((c) => c.category)).size

  return (
    <>
      <div className="mb-4 p-4 bg-surface-card rounded-2xl border border-border flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#5865F2] text-white font-bold flex items-center justify-center">D</div>
          <div className="min-w-0">
            <div className="text-xs text-txt-tertiary">연결됨 · {memberSourceLabel}</div>
            <div className="font-semibold text-txt-primary truncate">{p.discordGuildName ?? p.clubName} · 멤버 {p.memberCount}명</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg ring-1 ring-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />연결됨
          </span>
          <button onClick={p.onDisconnect} className="text-xs text-txt-tertiary hover:text-status-danger-text font-medium">연결 해제</button>
        </div>
      </div>

      <div className="mb-5 p-3 bg-surface-sunken rounded-xl flex items-center justify-between gap-3 flex-wrap text-xs">
        <div className="text-txt-secondary">
          <span className="text-txt-tertiary">현재 구조:</span>
          <span className="font-semibold text-txt-primary ml-1">{presetName}</span>
          <span className="text-txt-tertiary ml-2">· {p.roles.length}개 역할 · {p.channels.length}개 채널 · {categoriesCount}개 카테고리</span>
        </div>
        <button onClick={p.onResetPreset} className="text-txt-secondary hover:text-brand font-medium">구조 다시 설정</button>
      </div>

      <div className="mb-6 flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight mb-1">역할별 권한 설정</h1>
          <p className="text-txt-secondary text-sm">역할 카드의 액션으로 채널 접근과 멤버를 편집합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={p.onAddRoleOpen}>+ 역할</Button>
          <Button variant="secondary" size="sm" onClick={p.onAddChannelOpen}>+ 채널</Button>
        </div>
      </div>

      {p.warnings.length > 0 && <SafetyBlock warnings={p.warnings} />}

      <div className="space-y-3">
        {p.roles.map((role, ri) => (
          <RoleCard
            key={`${role.name}-${ri}`}
            role={role} ri={ri}
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
          <div className={cn('text-sm inline-flex items-center gap-2', p.dirty ? 'text-brand font-medium' : 'text-txt-tertiary')}>
            <span className={cn('w-2 h-2 rounded-full', p.dirty ? 'bg-brand animate-pulse' : 'bg-border-strong')} />
            <span>{p.dirty ? '저장되지 않은 변경 사항이 있습니다' : '변경 사항 없음'}</span>
          </div>
          <Button variant="blue" onClick={p.onApply} disabled={!p.dirty || p.saving}>
            {p.saving ? '저장 중...' : '변경 사항 저장'}
          </Button>
        </div>
      </div>
    </>
  )
}

function SafetyBlock({ warnings }: { warnings: Warning[] }) {
  const hasCritical = warnings.some((w) => w.level === 'critical')
  const hasWarning = warnings.some((w) => w.level === 'warning')
  const theme = hasCritical
    ? { bg: 'bg-red-50', border: 'border-red-200', icon: 'bg-red-100 text-red-700', title: 'text-red-900', num: 'text-red-700' }
    : hasWarning
      ? { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-100 text-amber-700', title: 'text-amber-900', num: 'text-amber-700' }
      : { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'bg-blue-100 text-blue-700', title: 'text-blue-900', num: 'text-blue-700' }
  const iconChar = hasCritical || hasWarning ? '!' : 'i'
  return (
    <div className={cn('mb-5 p-4 border rounded-2xl', theme.bg, theme.border)}>
      <div className="flex items-center gap-3 mb-2">
        <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold', theme.icon)}>{iconChar}</div>
        <div className={cn('font-semibold text-sm', theme.title)}>
          <span className={theme.num}>{warnings.length}건</span>의 확인이 필요합니다
        </div>
      </div>
      <ul className="space-y-1 pl-10">
        {warnings.map((w, i) => {
          const dot = w.level === 'critical' ? 'bg-red-400' : w.level === 'warning' ? 'bg-amber-400' : 'bg-blue-400'
          const tc = w.level === 'critical' ? 'text-red-900' : w.level === 'warning' ? 'text-amber-900' : 'text-blue-900'
          return (
            <li key={i} className="flex items-start gap-2 text-xs">
              <span className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', dot)} />
              <div><span className={cn('font-medium', tc)}>{w.text}</span> <span className="text-txt-tertiary">{w.hint}</span></div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function RoleCard({
  role, ri, channels, assignments, allMembers, onChannelEdit, onMemberEdit, onToggleAdmin, onRemove,
}: {
  role: Role; ri: number; channels: Channel[]; assignments: Record<number, string[]>; allMembers: Member[]
  onChannelEdit: (ri: number) => void; onMemberEdit: (ri: number) => void
  onToggleAdmin: (ri: number) => void; onRemove: (ri: number) => void
}) {
  const accessList = channels.filter((c) => role.access.has(c.name))
  const grouped = groupChannels(accessList)
  const mids = assignments[ri] || []
  const memberMap = new Map(allMembers.map((m) => [m.id, m]))
  const members = mids.map((id) => memberMap.get(id)).filter(Boolean).slice(0, 4) as Member[]
  const moreCount = Math.max(0, mids.length - members.length)

  return (
    <div className="bg-surface-card rounded-2xl border border-border p-5 hover:border-border-strong transition">
      <div className="flex items-start gap-4">
        <span className="w-3 h-3 rounded-full shrink-0 mt-2" style={{ background: role.dot }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="font-bold text-txt-primary text-[15px]">{role.name}</span>
            {role.admin && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md ring-1 ring-violet-100">
                <span>🛡</span><span>관리자</span>
              </span>
            )}
          </div>
          <div className="text-sm text-txt-secondary mb-4">{role.desc}</div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-txt-tertiary">접근 가능한 채널 · {accessList.length}개</div>
            </div>
            {accessList.length ? (
              <div className="space-y-2">
                {Object.entries(grouped).map(([cat, chs]) => (
                  <div key={cat}>
                    <div className="text-[10px] font-semibold text-txt-tertiary uppercase tracking-wide mb-1">📂 {cat}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {chs.map((c) => (
                        <span key={c.name} className="inline-flex items-center text-xs px-2.5 py-1 rounded-lg bg-brand/5 text-brand ring-1 ring-brand/10"># {c.name}</span>
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
            <div className="text-xs font-medium text-txt-tertiary mb-2">배정된 멤버 · {mids.length}명</div>
            <div className="flex items-center gap-1.5">
              {members.length ? members.map((m) => (
                <span key={m.id} className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-surface-card" style={{ background: m.dot }} title={m.name}>
                  {avatarInitial(m.name)}
                </span>
              )) : <span className="text-xs text-txt-tertiary">배정된 멤버가 없습니다</span>}
              {moreCount > 0 && <span className="text-xs text-txt-tertiary ml-1">+{moreCount}명</span>}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={() => onChannelEdit(ri)} className="px-3 py-1.5 text-xs rounded-lg bg-surface-sunken hover:bg-border text-txt-primary font-medium">채널 편집</button>
            <button onClick={() => onMemberEdit(ri)} className="px-3 py-1.5 text-xs rounded-lg bg-surface-sunken hover:bg-border text-txt-primary font-medium">멤버 배정</button>
            <button onClick={() => onToggleAdmin(ri)} className="px-3 py-1.5 text-xs rounded-lg bg-surface-sunken hover:bg-border text-txt-primary font-medium">
              {role.admin ? '관리자 해제' : '관리자로 지정'}
            </button>
          </div>
        </div>
        <IconButton variant="ghost" size="sm" onClick={() => onRemove(ri)} aria-label="역할 삭제"><X size={14} /></IconButton>
      </div>
    </div>
  )
}

// ============================================
// Modals
// ============================================
function ChannelEditorModal({
  role, channels, onClose, onSave,
}: {
  role: Role; channels: Channel[]; onClose: () => void; onSave: (next: Set<string>) => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(role.access))
  const grouped = groupChannels(channels)

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name); else next.add(name)
      return next
    })
  }
  const toggleCategory = (cat: string, on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      channels.filter((c) => c.category === cat).forEach((c) => { on ? next.add(c.name) : next.delete(c.name) })
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
                  <div className="text-xs font-semibold text-txt-primary uppercase tracking-wide">📂 {cat}</div>
                  <button onClick={() => toggleCategory(cat, !allOn)} className={cn('text-xs font-medium hover:underline', allOn ? 'text-txt-tertiary' : 'text-brand')}>
                    {allOn ? '전체 해제' : '전체 선택'}
                  </button>
                </div>
                <div className="space-y-1">
                  {chs.map((c) => {
                    const on = selected.has(c.name)
                    return (
                      <label key={c.name} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-sunken cursor-pointer">
                        <input type="checkbox" checked={on} onChange={() => toggle(c.name)}
                          className="w-4 h-4 rounded-md border-border-strong text-brand focus:ring-brand" />
                        <span className="flex-1 text-sm text-txt-primary"># {c.name}</span>
                        {on ? <span className="text-xs text-brand font-medium">접근 가능</span> : <span className="text-xs text-txt-tertiary">접근 불가</span>}
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        <div className="p-5 border-t border-border flex gap-2">
          <Button variant="secondary" fullWidth onClick={onClose}>취소</Button>
          <Button variant="blue" fullWidth onClick={() => onSave(selected)}>저장 — {selected.size}개</Button>
        </div>
      </div>
    </Modal>
  )
}

function MemberDrawer({
  ri, role, members, assignments, roles, onClose, onAssign, onUnassign,
}: {
  ri: number; role: Role; members: Member[]
  assignments: Record<number, string[]>; roles: Role[]
  onClose: () => void
  onAssign: (ri: number, mid: string) => void
  onUnassign: (ri: number, mid: string) => void
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
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
    <div className="fixed inset-0 z-[500]" onClick={onClose}>
      <div className="absolute inset-0 bg-surface-inverse/40 backdrop-blur-sm" />
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
          <IconButton variant="ghost" size="sm" onClick={onClose} aria-label="닫기"><X size={14} /></IconButton>
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
                  <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-sunken group">
                    <span className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: m.dot }}>{avatarInitial(m.name)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-txt-primary truncate">{m.name}</div>
                      <div className="text-xs text-txt-tertiary">{m.team}</div>
                    </div>
                    <button onClick={() => onUnassign(ri, m.id)} className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg hover:bg-red-50 text-txt-tertiary hover:text-red-500 inline-flex items-center justify-center transition">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-txt-tertiary py-8 text-center bg-surface-sunken rounded-xl">아직 배정된 멤버가 없습니다.</div>
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
                    <button key={m.id} onClick={() => onAssign(ri, m.id)} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-brand/5 text-left transition">
                      <span className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: m.dot }}>{avatarInitial(m.name)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-txt-primary truncate">{m.name}</div>
                        <div className="text-xs text-txt-tertiary">{m.team}{other ? ` · 현재 ${other}` : ' · 미배정'}</div>
                      </div>
                      <span className="text-brand text-xs font-semibold shrink-0">배정 +</span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="text-sm text-txt-tertiary py-8 text-center bg-surface-sunken rounded-xl">배정 가능한 멤버가 없습니다.</div>
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

function DiffModal({
  clubName, roles, channels, assignments, snapshot, saving, onClose, onConfirm,
}: {
  clubName: string; roles: Role[]; channels: Channel[]
  assignments: Record<number, string[]>; snapshot: string | null
  saving: boolean
  onClose: () => void; onConfirm: () => void
}) {
  const { changes, byRole, affectedMembers, affectedRoles } = useMemo(() => {
    if (!snapshot) return { changes: [] as Change[], byRole: {} as Record<string, Change[]>, affectedMembers: 0, affectedRoles: 0 }
    const before = JSON.parse(snapshot) as { roles: (Role & { access: string[] })[]; channels: Channel[] }
    const out: Change[] = []
    const roleSet = new Set<number>()
    roles.forEach((role, ri) => {
      const br = before.roles[ri]
      if (!br) { out.push({ kind: 'role-add', role: role.name, ri }); roleSet.add(ri); return }
      if (br.admin !== role.admin) { out.push({ kind: 'admin', role: role.name, ri, to: role.admin }); roleSet.add(ri) }
      const beforeSet = new Set(br.access)
      channels.forEach((c) => {
        const wasIn = beforeSet.has(c.name)
        const isIn = role.access.has(c.name)
        if (wasIn && !isIn) { out.push({ kind: 'access-remove', role: role.name, ri, channel: c.name }); roleSet.add(ri) }
        if (!wasIn && isIn) { out.push({ kind: 'access-add', role: role.name, ri, channel: c.name }); roleSet.add(ri) }
      })
    })
    const group: Record<string, Change[]> = {}
    out.forEach((c) => { if (!group[c.role]) group[c.role] = []; group[c.role].push(c) })
    const mem = [...roleSet].reduce((n, ri) => n + (assignments[ri]?.length || 0), 0)
    return { changes: out, byRole: group, affectedMembers: mem, affectedRoles: roleSet.size }
  }, [roles, channels, assignments, snapshot])

  if (changes.length === 0) {
    return (
      <Modal isOpen={true} onClose={onClose} size="md" showClose={false}>
        <div className="p-6">
          <h3 className="text-lg font-bold mb-2">변경 사항 없음</h3>
          <p className="text-sm text-txt-secondary mb-6">저장된 설정과 차이가 없습니다.</p>
          <Button variant="secondary" fullWidth onClick={onClose}>닫기</Button>
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
            <div><div className="text-xs text-txt-tertiary mb-1">변경 사항</div><div className="font-bold text-lg text-txt-primary">{changes.length}건</div></div>
            <div><div className="text-xs text-txt-tertiary mb-1">영향받는 역할</div><div className="font-bold text-lg text-txt-primary">{affectedRoles}개</div></div>
            <div><div className="text-xs text-txt-tertiary mb-1">영향받는 멤버</div><div className="font-bold text-lg text-brand">{affectedMembers}명</div></div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {Object.entries(byRole).map(([roleName, items]) => {
            const role = roles.find((r) => r.name === roleName)
            return (
              <div key={roleName} className="mb-5 last:mb-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: role?.dot || '#9ca3af' }} />
                  <span className="font-semibold text-sm text-txt-primary">{roleName}</span>
                  <span className="text-xs text-txt-tertiary">{items.length}건</span>
                </div>
                <div className="space-y-1.5">
                  {items.map((c, i) => {
                    if (c.kind === 'access-add') return (
                      <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-brand/5 text-sm">
                        <span className="text-brand font-semibold text-xs px-2 py-0.5 rounded-md bg-surface-card ring-1 ring-brand/20">접근 가능</span>
                        <span className="text-txt-primary flex-1"># {c.channel}</span>
                      </div>
                    )
                    if (c.kind === 'access-remove') return (
                      <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-sunken text-sm">
                        <span className="text-txt-tertiary font-semibold text-xs px-2 py-0.5 rounded-md bg-surface-card ring-1 ring-border">접근 불가</span>
                        <span className="text-txt-tertiary flex-1"># {c.channel}</span>
                      </div>
                    )
                    if (c.kind === 'admin') return (
                      <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-violet-50 text-sm">
                        <span className="text-violet-700 font-semibold text-xs px-2 py-0.5 rounded-md bg-surface-card ring-1 ring-violet-200">{c.to ? '관리자 지정' : '관리자 해제'}</span>
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
          <Button variant="secondary" fullWidth onClick={onClose} disabled={saving}>취소</Button>
          <Button variant="blue" fullWidth onClick={onConfirm} loading={saving}>저장하기</Button>
        </div>
      </div>
    </Modal>
  )
}

type Change = { kind: 'role-add' | 'admin' | 'access-add' | 'access-remove'; role: string; ri: number; channel?: string; to?: boolean }

function AddRoleModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (name: string, desc: string) => void }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [err, setErr] = useState(false)
  return (
    <Modal isOpen={true} onClose={onClose} size="md" showClose={false}>
      <div className="p-6">
        <h3 className="text-lg font-bold mb-1.5">새 역할 추가</h3>
        <p className="text-sm text-txt-secondary mb-5">역할 이름과 간단한 설명을 입력해주세요.</p>
        <label className="block mb-3.5">
          <span className="text-xs font-medium text-txt-secondary block mb-1.5">역할 이름 <span className="text-brand">*</span></span>
          <input
            value={name} onChange={(e) => { setName(e.target.value); setErr(false) }}
            placeholder="예: 팀장 · 마케팅"
            className={cn(
              'w-full px-4 py-2.5 rounded-xl border outline-none transition text-sm bg-surface-sunken focus:bg-surface-card focus:ring-4',
              err ? 'border-red-400 ring-4 ring-red-100' : 'border-border focus:border-brand focus:ring-brand/20'
            )}
            autoFocus
          />
        </label>
        <label className="block mb-3.5">
          <span className="text-xs font-medium text-txt-secondary block mb-1.5">설명</span>
          <input
            value={desc} onChange={(e) => setDesc(e.target.value)}
            placeholder="예: 마케팅팀 관리"
            className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-brand focus:ring-4 focus:ring-brand/20 outline-none transition text-sm bg-surface-sunken focus:bg-surface-card"
          />
          <span className="text-xs text-txt-tertiary mt-1 block">생략할 수 있습니다.</span>
        </label>
        <div className="flex gap-2 mt-6">
          <Button variant="secondary" fullWidth onClick={onClose}>취소</Button>
          <Button variant="blue" fullWidth onClick={() => {
            if (!name.trim()) { setErr(true); return }
            onSubmit(name.trim(), desc.trim())
          }}>추가</Button>
        </div>
      </div>
    </Modal>
  )
}

function AddChannelModal({
  existingCategories, onClose, onSubmit,
}: { existingCategories: string[]; onClose: () => void; onSubmit: (name: string, cat: string) => void }) {
  const [name, setName] = useState('')
  const [cat, setCat] = useState(existingCategories[0] || '일반')
  const [err, setErr] = useState(false)
  return (
    <Modal isOpen={true} onClose={onClose} size="md" showClose={false}>
      <div className="p-6">
        <h3 className="text-lg font-bold mb-1.5">새 채널 추가</h3>
        <p className="text-sm text-txt-secondary mb-5">Discord에 생성될 채널 이름과 카테고리를 입력해주세요.</p>
        <label className="block mb-3.5">
          <span className="text-xs font-medium text-txt-secondary block mb-1.5">채널 이름 <span className="text-brand">*</span></span>
          <input
            value={name} onChange={(e) => { setName(e.target.value); setErr(false) }}
            placeholder="예: 마케팅"
            className={cn(
              'w-full px-4 py-2.5 rounded-xl border outline-none transition text-sm bg-surface-sunken focus:bg-surface-card focus:ring-4',
              err ? 'border-red-400 ring-4 ring-red-100' : 'border-border focus:border-brand focus:ring-brand/20'
            )}
            autoFocus
          />
          <span className="text-xs text-txt-tertiary mt-1 block"># 기호는 자동으로 붙습니다.</span>
        </label>
        <label className="block mb-3.5">
          <span className="text-xs font-medium text-txt-secondary block mb-1.5">카테고리</span>
          <input
            value={cat} onChange={(e) => setCat(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-brand focus:ring-4 focus:ring-brand/20 outline-none transition text-sm bg-surface-sunken focus:bg-surface-card"
          />
          <span className="text-xs text-txt-tertiary mt-1 block">기존: {existingCategories.join(', ') || '없음'}</span>
        </label>
        <div className="flex gap-2 mt-6">
          <Button variant="secondary" fullWidth onClick={onClose}>취소</Button>
          <Button variant="blue" fullWidth onClick={() => {
            if (!name.trim()) { setErr(true); return }
            onSubmit(name.trim(), cat.trim() || '일반')
          }}>추가</Button>
        </div>
      </div>
    </Modal>
  )
}

function ConfirmModal({
  title, description, confirmText = '확인', destructive = false, onCancel, onConfirm,
}: {
  title: string; description: string; confirmText?: string; destructive?: boolean
  onCancel: () => void; onConfirm: () => void
}) {
  return (
    <Modal isOpen={true} onClose={onCancel} size="md" showClose={false}>
      <div className="p-6">
        <h3 className="text-lg font-bold mb-1.5">{title}</h3>
        <p className="text-sm text-txt-secondary mb-6 leading-relaxed">{description}</p>
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={onCancel}>취소</Button>
          <Button variant={destructive ? 'danger' : 'blue'} fullWidth onClick={onConfirm}>{confirmText}</Button>
        </div>
      </div>
    </Modal>
  )
}
