import type {
  Channel,
  Member,
  MemberSource,
  PresetRoleSeed,
  Role,
  ServerConfig,
  Warning,
} from './_types'
import { DOT_PALETTE } from './_constants'

// PermissionsSettings 헬퍼 함수 모음.
// PermissionsSettingsClient.tsx 에서 분리. 순수 함수만.

export function seedToRoles(seeds: PresetRoleSeed[], chs: Channel[]): Role[] {
  return seeds.map((r) => ({
    ...r,
    access: new Set(r.access === 'all' ? chs.map((c) => c.name) : r.access),
  }))
}

export function groupChannels(chs: Channel[]): Record<string, Channel[]> {
  return chs.reduce<Record<string, Channel[]>>((acc, c) => {
    if (!acc[c.category]) acc[c.category] = []
    acc[c.category].push(c)
    return acc
  }, {})
}

export function avatarInitial(name: string) {
  return name.slice(-2)
}

/**
 * 변경 감지용 스냅샷. JSON 직렬화로 동등 비교 (Set/배열 정렬 후).
 * roles/channels/assignments/preset/memberSource 모두 포함.
 */
export function takeSnapshot(
  roles: Role[],
  channels: Channel[],
  assignments: Record<number, string[]>,
  preset: string | null,
  memberSource: MemberSource | null
): string {
  return JSON.stringify({
    roles: roles.map((r) => ({ ...r, access: [...r.access].sort() })),
    channels,
    assignments: Object.entries(assignments).map(([k, v]) => [k, [...v].sort()]),
    preset,
    memberSource,
  })
}

/**
 * 프리셋 템플릿(roleIdx → memberIdx[]) 을 실제 멤버 ID 매핑으로 변환.
 */
export function applyTemplate(
  template: Record<number, number[]>,
  members: Member[]
): Record<number, string[]> {
  const out: Record<number, string[]> = {}
  Object.entries(template).forEach(([roleIdx, indices]) => {
    out[Number(roleIdx)] = indices
      .map((i) => members[i]?.id)
      .filter((x): x is string => Boolean(x))
  })
  return out
}

export function teamLabel(role: string): string {
  if (role === 'owner') return '창립자'
  if (role === 'admin') return '운영진'
  if (role === 'alumni') return '졸업생'
  return '회원'
}

export function makeMembers(srv: ServerConfig['available_members']): Member[] {
  return srv.map((m, i) => ({
    id: m.user_id,
    name: m.display_name,
    team: teamLabel(m.club_member_role),
    dot: DOT_PALETTE[i % DOT_PALETTE.length],
  }))
}

export function serverToLocal(data: ServerConfig): {
  roles: Role[]
  channels: Channel[]
  assignments: Record<number, string[]>
} {
  const channels = data.channels.map((c) => ({ name: c.name, category: c.category }))
  const roles: Role[] = data.roles.map((r) => ({
    name: r.name,
    desc: r.description,
    admin: r.is_admin,
    dot: r.dot_color,
    access: new Set(r.channel_names),
  }))
  const assignments: Record<number, string[]> = {}
  data.roles.forEach((r, i) => {
    assignments[i] = [...r.member_user_ids]
  })
  return { roles, channels, assignments }
}

/**
 * 권한 구성 안전성 분석 — SafetyBlock 에서 시각화.
 * - critical: 관리자 역할 부재, 관리자 멤버 0명
 * - warning: 접근 가능 멤버 0명인 채널
 * - info: 미배정 멤버 N명
 */
export function computeWarnings(
  roles: Role[],
  channels: Channel[],
  assignments: Record<number, string[]>,
  members: Member[]
): Warning[] {
  const warnings: Warning[] = []
  const admins = roles.filter((r) => r.admin)
  const adminMembers = admins.reduce(
    (n, r) => n + (assignments[roles.indexOf(r)]?.length || 0),
    0
  )
  if (admins.length === 0) {
    warnings.push({
      level: 'critical',
      text: '관리자 역할이 없습니다.',
      hint: '최소 1개가 필요합니다.',
    })
  } else if (adminMembers === 0) {
    warnings.push({
      level: 'critical',
      text: '관리자 역할에 배정된 멤버가 없습니다.',
      hint: '최소 1명을 지정해주세요.',
    })
  }
  channels.forEach((ch) => {
    const any = roles.some(
      (r, ri) => r.access.has(ch.name) && (assignments[ri]?.length || 0) > 0
    )
    if (!any)
      warnings.push({
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
