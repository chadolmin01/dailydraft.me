'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useClub } from '@/src/hooks/useClub'
import { toast } from 'sonner'
import { PROJECT_ROLES } from '@/src/constants/roles'
import { RefreshCw, Plus, Trash2 } from 'lucide-react'

interface DiscordRole {
  id: string
  name: string
  color: number
  managed: boolean
}

interface RoleMapping {
  id: string
  mapping_type: 'position' | 'cohort' | 'club_role'
  draft_value: string
  discord_role_id: string
  discord_role_name: string | null
}

interface RolesData {
  mappings: RoleMapping[]
  discord_roles: DiscordRole[]
  guild: { id: string; name: string } | null
}

// Draft 값 → 한국어 라벨
const POSITION_LABELS: Record<string, string> = Object.fromEntries(
  PROJECT_ROLES.map(r => [r.slug, r.label])
)

const CLUB_ROLE_LABELS: Record<string, string> = {
  owner: '클럽장',
  admin: '관리자',
}

/**
 * Discord 역할 매핑 UI
 * Draft 개념(포지션/기수/클럽역할) → Discord 역할 매핑을 관리
 */
export function ClubDiscordRoleMappings({ clubSlug }: { clubSlug: string }) {
  const { data: club } = useClub(clubSlug)
  const queryClient = useQueryClient()
  const [newCohort, setNewCohort] = useState('')

  const { data, isLoading } = useQuery<RolesData>({
    queryKey: ['discord-roles', club?.id],
    enabled: !!club?.id,
    queryFn: async () => {
      const res = await fetch(`/api/clubs/${club!.id}/discord-roles`)
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
  })

  const upsertMutation = useMutation({
    mutationFn: async (params: { mapping_type: string; draft_value: string; discord_role_id: string; discord_role_name?: string }) => {
      const res = await fetch(`/api/clubs/${club!.id}/discord-roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discord-roles', club?.id] })
    },
    onError: () => {
      toast.error('매핑 저장에 실패했습니다')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (mappingId: string) => {
      const res = await fetch(`/api/clubs/${club!.id}/discord-roles?id=${mappingId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discord-roles', club?.id] })
    },
    onError: () => {
      toast.error('매핑 삭제에 실패했습니다')
    },
  })

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/discord/sync-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ club_id: club!.id, bulk: true }),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: (result) => {
      const synced = result?.synced ?? 0
      const failed = result?.failed ?? 0
      toast.success(`${synced}명 동기화 완료${failed > 0 ? `, ${failed}명 실패` : ''}`)
    },
    onError: () => {
      toast.error('동기화에 실패했습니다')
    },
  })

  // Discord 미연결 또는 로딩 중이면 렌더하지 않음
  if (isLoading || !data?.guild) return null

  const { mappings, discord_roles } = data

  // 매핑 타입별 그룹핑
  const getMappings = (type: string) => mappings.filter(m => m.mapping_type === type)
  const getMapping = (type: string, value: string) => mappings.find(m => m.mapping_type === type && m.draft_value === value)

  // Discord 역할 선택 핸들러
  const handleSelect = (mappingType: string, draftValue: string, discordRoleId: string) => {
    if (!discordRoleId) {
      // 매핑 삭제
      const existing = getMapping(mappingType, draftValue)
      if (existing) deleteMutation.mutate(existing.id)
      return
    }
    const role = discord_roles.find(r => r.id === discordRoleId)
    upsertMutation.mutate({
      mapping_type: mappingType,
      draft_value: draftValue,
      discord_role_id: discordRoleId,
      discord_role_name: role?.name,
    })
  }

  // 기수 추가
  const handleAddCohort = () => {
    const value = newCohort.trim()
    if (!value) return
    // 이미 존재하는지 확인
    if (getMapping('cohort', value)) {
      toast.error('이미 존재하는 기수입니다')
      return
    }
    setNewCohort('')
    // 기수만 추가 (Discord 역할은 아직 미선택) — 빈 매핑은 API가 거부하므로 UI에서만 표시
    // 사용자가 드롭다운에서 역할을 선택해야 저장됨
  }

  // 기수 목록: 기존 매핑 + 새로 입력 중인 것
  const cohortMappings = getMappings('cohort')

  return (
    <div className="bg-surface-card border border-border rounded-2xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-txt-secondary">역할 매핑</h4>
        <button
          type="button"
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-brand border border-brand/30 rounded-lg hover:bg-brand-bg transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={syncMutation.isPending ? 'animate-spin' : ''} />
          {syncMutation.isPending ? '동기화 중...' : '전체 동기화'}
        </button>
      </div>

      <p className="text-[11px] text-txt-disabled -mt-3">
        Draft 역할을 Discord 역할에 매핑하면 멤버의 Discord 역할이 자동으로 설정됩니다.
      </p>

      {discord_roles.length === 0 ? (
        <p className="text-xs text-txt-disabled py-4 text-center">
          Discord 서버에서 역할을 먼저 만들어주세요.
        </p>
      ) : (
        <>
          {/* 포지션 매핑 */}
          <MappingSection
            title="포지션"
            description="멤버의 활동 분야에 따라 역할을 부여합니다"
            items={PROJECT_ROLES.map(r => ({ value: r.slug, label: POSITION_LABELS[r.slug] || r.slug }))}
            mappings={getMappings('position')}
            discordRoles={discord_roles}
            mappingType="position"
            onSelect={handleSelect}
          />

          {/* 기수 매핑 */}
          <div className="space-y-2">
            <div>
              <span className="text-sm text-txt-primary">기수</span>
              <p className="text-[10px] text-txt-disabled">멤버의 기수에 따라 역할을 부여합니다</p>
            </div>

            {cohortMappings.map(m => (
              <MappingRow
                key={m.id}
                label={m.draft_value}
                selectedRoleId={m.discord_role_id}
                discordRoles={discord_roles}
                onChange={(roleId) => handleSelect('cohort', m.draft_value, roleId)}
                onDelete={() => deleteMutation.mutate(m.id)}
                showDelete
              />
            ))}

            <div className="flex gap-2">
              <input
                type="text"
                value={newCohort}
                onChange={e => setNewCohort(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const value = newCohort.trim()
                    if (!value) return
                    if (getMapping('cohort', value)) {
                      toast.error('이미 존재하는 기수입니다')
                      return
                    }
                    // 기수 추가 시 첫 번째 Discord 역할로 임시 저장 (사용자가 변경 가능)
                    handleSelect('cohort', value, discord_roles[0].id)
                    setNewCohort('')
                  }
                }}
                placeholder="예: 1기, 2기"
                className="flex-1 px-3 py-1.5 border border-border rounded-lg text-sm text-txt-primary bg-surface-card focus:outline-none focus:border-brand transition-colors placeholder:text-txt-disabled"
              />
              <button
                type="button"
                onClick={() => {
                  const value = newCohort.trim()
                  if (!value) return
                  if (getMapping('cohort', value)) {
                    toast.error('이미 존재하는 기수입니다')
                    return
                  }
                  handleSelect('cohort', value, discord_roles[0].id)
                  setNewCohort('')
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-brand border border-brand/30 rounded-lg hover:bg-brand-bg transition-colors"
              >
                <Plus size={14} />
                추가
              </button>
            </div>
          </div>

          {/* 클럽 역할 매핑 */}
          <MappingSection
            title="클럽 역할"
            description="클럽 내 권한에 따라 역할을 부여합니다"
            items={[
              { value: 'owner', label: '클럽장' },
              { value: 'admin', label: '관리자' },
            ]}
            mappings={getMappings('club_role')}
            discordRoles={discord_roles}
            mappingType="club_role"
            onSelect={handleSelect}
          />
        </>
      )}
    </div>
  )
}

/** 고정 항목 매핑 섹션 (포지션, 클럽 역할) */
function MappingSection({
  title,
  description,
  items,
  mappings,
  discordRoles,
  mappingType,
  onSelect,
}: {
  title: string
  description: string
  items: { value: string; label: string }[]
  mappings: RoleMapping[]
  discordRoles: DiscordRole[]
  mappingType: string
  onSelect: (type: string, value: string, roleId: string) => void
}) {
  return (
    <div className="space-y-2">
      <div>
        <span className="text-sm text-txt-primary">{title}</span>
        <p className="text-[10px] text-txt-disabled">{description}</p>
      </div>
      {items.map(item => {
        const mapping = mappings.find(m => m.draft_value === item.value)
        return (
          <MappingRow
            key={item.value}
            label={item.label}
            selectedRoleId={mapping?.discord_role_id ?? ''}
            discordRoles={discordRoles}
            onChange={(roleId) => onSelect(mappingType, item.value, roleId)}
          />
        )
      })}
    </div>
  )
}

/** 단일 매핑 행: 라벨 → Discord 역할 드롭다운 */
function MappingRow({
  label,
  selectedRoleId,
  discordRoles,
  onChange,
  onDelete,
  showDelete = false,
}: {
  label: string
  selectedRoleId: string
  discordRoles: DiscordRole[]
  onChange: (roleId: string) => void
  onDelete?: () => void
  showDelete?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-txt-secondary w-24 shrink-0 truncate">{label}</span>
      <span className="text-txt-disabled text-xs shrink-0">&rarr;</span>
      <select
        value={selectedRoleId}
        onChange={e => onChange(e.target.value)}
        className="flex-1 px-2.5 py-1.5 border border-border rounded-lg text-sm text-txt-primary bg-surface-card ob-input appearance-none cursor-pointer"
      >
        <option value="">미지정</option>
        {discordRoles.map(role => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </select>
      {showDelete && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 text-txt-disabled hover:text-status-danger-text transition-colors shrink-0"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )
}
