// PermissionsSettings 도메인 타입.
// PermissionsSettingsClient.tsx 에서 분리 — 메인 컴포넌트 + helpers + modals 가 공유.

export type WizardStep =
  | 'loading'
  | 'connect-account'
  | 'invite-bot'
  | 'pending-link'
  | 'source'
  | 'preset'
  | 'members'
  | 'done'

export type MemberSource = 'discord-sync' | 'draft-match' | 'manual'

export type Channel = { name: string; category: string }

export type PresetRoleSeed = {
  name: string
  desc: string
  admin: boolean
  dot: string
  access: 'all' | string[]
}

export type Role = {
  name: string
  desc: string
  admin: boolean
  dot: string
  access: Set<string>
}

export type Member = { id: string; name: string; team: string; dot: string }

export type ServerConfig = {
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
  available_members: {
    user_id: string
    display_name: string
    avatar_url: string | null
    club_member_role: string
  }[]
}

export type UserConnection = {
  discord_linked: boolean
  pending_setups: { discord_guild_id: string; discord_guild_name: string | null }[]
}

// SafetyBlock 등에서 사용하는 경고 형태.
// computeWarnings 가 생성. SafetyBlock 이 시각화.
export type Warning = {
  level: 'critical' | 'warning' | 'info'
  text: string
  hint?: string
}
