'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Loader2, UserMinus, UserPlus, ChevronDown, Mail, MessageCircle, Coffee } from 'lucide-react'
import { toast } from 'sonner'
import { SkeletonFeed } from '@/components/ui/Skeleton'
import { supabase } from '@/src/lib/supabase/client'
import { useAuth } from '@/src/context/AuthContext'
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

interface AcceptedChat {
  id: string
  requester_user_id: string
  requester_name: string | null
  message: string | null
  created_at: string
  profile: {
    nickname: string
    desired_position: string | null
  } | null
}

export function TeamManageSection({ opportunityId }: { opportunityId: string }) {
  const queryClient = useQueryClient()
  const { user, isLoading: isAuthLoading } = useAuth()
  const [removingId, setRemovingId] = useState<string | null>(null)

  // Fetch team members
  const { data, isLoading } = useQuery<TeamData>({
    queryKey: ['team', opportunityId],
    queryFn: async () => {
      const res = await fetch(`/api/opportunities/${opportunityId}/team`)
      if (!res.ok) throw new Error('Failed to fetch team')
      const json = await res.json()
      return json.data
    },
  })

  // Fetch accepted coffee chats (not yet added to team)
  const { data: acceptedChats = [] as AcceptedChat[], isLoading: chatsLoading } = useQuery({
    queryKey: ['accepted-chats', opportunityId],
    queryFn: async (): Promise<AcceptedChat[]> => {
      // Get accepted coffee chats for this opportunity
      const { data: chats, error } = await supabase
        .from('coffee_chats')
        .select('id, requester_user_id, requester_name, message, created_at')
        .eq('opportunity_id', opportunityId)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })
      if (error || !chats) return []

      // Get team member user IDs to filter out already-added
      const { data: existing } = await supabase
        .from('accepted_connections')
        .select('applicant_id')
        .eq('opportunity_id', opportunityId)
        .eq('status', 'active')
      const addedUserIds = new Set((existing || []).map((e: any) => e.applicant_id))

      // Filter: only chats not yet in team
      const available = chats.filter(
        (c: any) => c.requester_user_id && !addedUserIds.has(c.requester_user_id)
      )
      if (available.length === 0) return []

      // Fetch profiles
      const userIds = available.map((c: any) => c.requester_user_id).filter(Boolean) as string[]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, nickname, desired_position')
        .in('user_id', userIds)
      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]))

      return available.map((c: any) => ({
        ...c,
        profile: profileMap.get(c.requester_user_id) || null,
      }))
    },
    enabled: !isAuthLoading && !!user,
  })

  // Add to team mutation — uses API so notification is sent server-side
  const addToTeam = useMutation({
    mutationFn: async (chat: AcceptedChat) => {
      const res = await fetch(`/api/opportunities/${opportunityId}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicant_id: chat.requester_user_id,
          coffee_chat_id: chat.id,
        }),
      })
      if (!res.ok) throw new Error('Failed to add team member')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', opportunityId] })
      queryClient.invalidateQueries({ queryKey: ['accepted-chats', opportunityId] })
      queryClient.invalidateQueries({ queryKey: ['team-public', opportunityId] })
      toast.success('팀원이 추가되었습니다')
    },
    onError: () => {
      toast.error('팀원 추가에 실패했습니다')
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
      toast.success('역할이 수정되었습니다')
    },
    onError: () => {
      toast.error('역할 수정에 실패했어요')
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
      queryClient.invalidateQueries({ queryKey: ['team-public', opportunityId] })
      toast.success('팀원이 제거되었습니다')
      setRemovingId(null)
    },
    onError: () => {
      toast.error('팀원 제거에 실패했어요')
      setRemovingId(null)
    },
  })

  if (isLoading) {
    return (
      <div className="px-4 sm:px-8 py-6">
        <SkeletonFeed count={3} />
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
          <h3 className="text-[0.625rem] font-medium text-txt-tertiary">
            팀원 관리
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[0.625rem] font-mono text-txt-disabled">
          <span>전체 {data?.stats?.total || 0}명</span>
          <span>활동 {data?.stats?.active || 0}명</span>
        </div>
      </div>

      {/* Accepted Coffee Chats — Add to Team */}
      {acceptedChats.length > 0 && (
        <div>
          <h4 className="text-[0.625rem] font-medium text-status-success-text mb-2 flex items-center gap-1.5">
            <Coffee size={11} />
            수락된 커피챗 ({acceptedChats.length})
          </h4>
          <div className="space-y-2">
            {acceptedChats.map(chat => (
              <div key={chat.id} className="flex items-center gap-3 px-4 py-3 bg-status-success-bg/30 border border-status-success-text/20">
                <div className="w-9 h-9 bg-status-success-text text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {(chat.profile?.nickname || chat.requester_name || '?').charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-txt-primary">
                    {chat.profile?.nickname || chat.requester_name || '알 수 없음'}
                  </p>
                  <p className="text-xs text-txt-disabled truncate">
                    {chat.profile?.desired_position || '포지션 미설정'}
                    {' · '}
                    {new Date(chat.created_at).toLocaleDateString('ko-KR')} 커피챗
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => addToTeam.mutate(chat)}
                  disabled={addToTeam.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-inverse text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
                  aria-label="팀에 추가"
                >
                  {addToTeam.isPending ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <UserPlus size={12} />
                  )}
                  팀에 추가
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No accepted chats, no members */}
      {acceptedChats.length === 0 && members.length === 0 && !chatsLoading && (
        <div className="border border-border py-12 flex flex-col items-center justify-center">
          <div className="w-12 h-12 bg-surface-sunken flex items-center justify-center mb-3">
            <Users size={20} className="text-txt-disabled" />
          </div>
          <p className="text-sm text-txt-tertiary font-medium mb-1">아직 팀원이 없습니다</p>
          <p className="text-xs text-txt-disabled">커피챗이 수락되면 여기서 팀에 추가할 수 있습니다</p>
        </div>
      )}

      {/* Active Members */}
      {members.length > 0 && (
        <div>
          <h4 className="text-[0.625rem] font-medium text-txt-tertiary mb-2">
            현재 팀원 ({members.length})
          </h4>
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
        </div>
      )}

      {/* Left Members */}
      {leftMembers.length > 0 && (
        <div>
          <h4 className="text-[0.625rem] font-medium text-txt-disabled mb-2">
            이전 팀원 ({leftMembers.length})
          </h4>
          <div className="space-y-2 opacity-50">
            {leftMembers.map(member => (
              <div key={member.id} className="flex items-center gap-3 px-4 py-3 bg-surface-sunken rounded-xl border border-border">
                <div className="w-8 h-8 bg-surface-card rounded-xl border border-border flex items-center justify-center text-xs font-bold text-txt-disabled">
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
    <div className="border border-border bg-surface-card rounded-xl">
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Avatar */}
        <div className="w-10 h-10 bg-surface-inverse text-txt-inverse flex items-center justify-center font-bold text-sm shrink-0">
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
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-border hover:border-border transition-colors bg-surface-card rounded-xl"
              aria-label="역할 선택"
              aria-haspopup="listbox"
            >
              <span className="text-txt-secondary">{member.assigned_role || '역할 선택'}</span>
              <ChevronDown size={12} className="text-txt-disabled" />
            </button>
            {showRoleSelect && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowRoleSelect(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-surface-card rounded-xl border border-border shadow-lg min-w-[8rem]">
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
              className="px-3 py-1 border border-border text-xs text-txt-secondary hover:bg-surface-card rounded-xl transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
