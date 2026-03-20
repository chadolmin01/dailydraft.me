'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Loader2, UserMinus, ChevronDown, Mail, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { ROLE_OPTIONS } from '@/app/(dashboard)/projects/new/constants'

interface TeamMember {
  id: string
  applicant_id: string
  assigned_role: string | null
  notes: string | null
  status: string
  connected_at: string
  profile: {
    nickname: string
    desired_position: string | null
    skills: Array<{ name: string; level: string }> | null
    contact_email: string | null
    contact_kakao: string | null
  } | null
  application: {
    match_score: number | null
    match_reason: string | null
  } | null
}

interface TeamData {
  opportunity: { id: string; title: string; status: string }
  members: TeamMember[]
  stats: { total: number; active: number; rolesAssigned: number }
}

export function TeamManageSection({ opportunityId }: { opportunityId: string }) {
  const queryClient = useQueryClient()
  const [removingId, setRemovingId] = useState<string | null>(null)

  const { data, isLoading } = useQuery<TeamData>({
    queryKey: ['team', opportunityId],
    queryFn: async () => {
      const res = await fetch(`/api/opportunities/${opportunityId}/team`)
      if (!res.ok) throw new Error('Failed to fetch team')
      const json = await res.json()
      return json.data
    },
  })

  const updateMember = useMutation({
    mutationFn: async ({ memberId, updates }: { memberId: string; updates: Record<string, unknown> }) => {
      const res = await fetch(`/api/opportunities/${opportunityId}/team/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Failed to update')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', opportunityId] })
    },
  })

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const res = await fetch(`/api/opportunities/${opportunityId}/team/${memberId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to remove')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', opportunityId] })
      toast.success('팀원이 제거되었습니다')
      setRemovingId(null)
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="animate-spin text-txt-tertiary" />
      </div>
    )
  }

  const members = data?.members?.filter(m => m.status === 'active') || []
  const leftMembers = data?.members?.filter(m => m.status === 'left') || []

  return (
    <div className="px-4 sm:px-8 py-6 space-y-6">

      {/* Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-txt-tertiary" />
          <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest">
            팀원 관리
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[0.625rem] font-mono text-txt-disabled">
          <span>전체 {data?.stats?.total || 0}명</span>
          <span>활동 {data?.stats?.active || 0}명</span>
        </div>
      </div>

      {/* Active Members */}
      {members.length > 0 ? (
        <div className="space-y-3">
          {members.map(member => (
            <MemberCard
              key={member.id}
              member={member}
              removingId={removingId}
              onRoleChange={(role) => {
                updateMember.mutate({ memberId: member.id, updates: { assigned_role: role } })
              }}
              onRemoveClick={() => setRemovingId(member.id)}
              onRemoveConfirm={() => removeMember.mutate(member.id)}
              onRemoveCancel={() => setRemovingId(null)}
              isUpdating={updateMember.isPending}
            />
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-border py-12 flex flex-col items-center justify-center">
          <div className="w-12 h-12 bg-surface-sunken flex items-center justify-center mb-3">
            <Users size={20} className="text-txt-disabled" />
          </div>
          <p className="text-sm text-txt-tertiary font-medium mb-1">아직 팀원이 없습니다</p>
          <p className="text-xs text-txt-disabled">커피챗이 수락되면 여기에 팀원이 표시됩니다</p>
        </div>
      )}

      {/* Left Members */}
      {leftMembers.length > 0 && (
        <div>
          <h4 className="text-[0.625rem] font-mono font-bold text-txt-disabled uppercase tracking-widest mb-2">
            이전 팀원 ({leftMembers.length})
          </h4>
          <div className="space-y-2 opacity-50">
            {leftMembers.map(member => (
              <div key={member.id} className="flex items-center gap-3 px-4 py-3 bg-surface-sunken border border-border">
                <div className="w-8 h-8 bg-surface-card border border-border flex items-center justify-center text-xs font-bold text-txt-disabled">
                  {member.profile?.nickname?.charAt(0) || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-txt-disabled font-medium">{member.profile?.nickname || '알 수 없음'}</p>
                  <p className="text-xs text-txt-disabled">{member.assigned_role || '역할 미지정'}</p>
                </div>
                <span className="text-[0.625rem] font-mono text-txt-disabled">탈퇴</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MemberCard({
  member,
  removingId,
  onRoleChange,
  onRemoveClick,
  onRemoveConfirm,
  onRemoveCancel,
  isUpdating,
}: {
  member: TeamMember
  removingId: string | null
  onRoleChange: (role: string) => void
  onRemoveClick: () => void
  onRemoveConfirm: () => void
  onRemoveCancel: () => void
  isUpdating: boolean
}) {
  const [showRoleSelect, setShowRoleSelect] = useState(false)
  const isRemoving = removingId === member.id

  return (
    <div className="border border-border-strong bg-surface-card">
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Avatar */}
        <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-bold text-sm shrink-0">
          {member.profile?.nickname?.charAt(0) || '?'}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-sm text-txt-primary">{member.profile?.nickname || '알 수 없음'}</p>
            {member.application?.match_score != null && (
              <span className="text-[0.625rem] font-mono font-bold text-brand bg-brand-bg px-1.5 py-0.5 border border-brand-border">
                {member.application.match_score}% 매치
              </span>
            )}
          </div>
          <p className="text-xs text-txt-disabled">
            {member.profile?.desired_position || '포지션 미설정'}
            {' · '}
            {new Date(member.connected_at).toLocaleDateString('ko-KR')} 합류
          </p>

          {/* Skills */}
          {member.profile?.skills && member.profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {member.profile.skills.slice(0, 5).map((skill, i) => (
                <span key={i} className="text-[0.625rem] font-mono bg-surface-sunken text-txt-secondary px-1.5 py-0.5 border border-border">
                  {skill.name}
                </span>
              ))}
            </div>
          )}

          {/* Contact */}
          <div className="flex items-center gap-3 mt-2">
            {member.profile?.contact_email && (
              <a
                href={`mailto:${member.profile.contact_email}`}
                className="flex items-center gap-1 text-[0.625rem] text-txt-tertiary hover:text-txt-primary transition-colors"
              >
                <Mail size={10} />
                {member.profile.contact_email}
              </a>
            )}
            {member.profile?.contact_kakao && (
              <span className="flex items-center gap-1 text-[0.625rem] text-txt-tertiary">
                <MessageCircle size={10} />
                {member.profile.contact_kakao}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Role selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowRoleSelect(!showRoleSelect)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-border hover:border-border-strong transition-colors bg-surface-card"
            >
              <span className="text-txt-secondary">{member.assigned_role || '역할 선택'}</span>
              <ChevronDown size={12} className="text-txt-disabled" />
            </button>
            {showRoleSelect && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowRoleSelect(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-surface-card border border-border-strong shadow-brutal min-w-[8rem]">
                  {ROLE_OPTIONS.map(({ value }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        onRoleChange(value)
                        setShowRoleSelect(false)
                      }}
                      disabled={isUpdating}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-surface-sunken transition-colors ${
                        member.assigned_role === value ? 'font-bold text-txt-primary bg-surface-sunken' : 'text-txt-secondary'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Remove button */}
          <button
            type="button"
            onClick={onRemoveClick}
            className="p-1.5 text-txt-disabled hover:text-status-danger-text transition-colors"
            title="팀원 제거"
          >
            <UserMinus size={14} />
          </button>
        </div>
      </div>

      {/* Remove confirmation */}
      {isRemoving && (
        <div className="px-4 py-2.5 bg-status-danger-bg/50 border-t border-status-danger-text/10 flex items-center justify-between">
          <p className="text-xs text-status-danger-text">이 팀원을 제거하시겠습니까?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRemoveConfirm}
              className="px-3 py-1 bg-status-danger-text text-white text-xs font-bold hover:opacity-90 transition-opacity"
            >
              제거
            </button>
            <button
              type="button"
              onClick={onRemoveCancel}
              className="px-3 py-1 border border-border text-xs text-txt-secondary hover:bg-surface-card transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
