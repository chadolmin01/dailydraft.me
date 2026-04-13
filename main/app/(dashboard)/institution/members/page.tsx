'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useInstitutionAdmin } from '@/src/hooks/useInstitutionAdmin'
import { Card } from '@/components/ui/Card'
import type { InstitutionMember, MemberRole } from '@/src/types/institution'
import {
  Users,
  GraduationCap,
  UserCheck,
  Search,
  Plus,
  Loader2,
  ShieldX,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  Trash2,
  RefreshCw,
} from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  all: '전체',
  student: '학생',
  mentor: '멘토',
  admin: '관리자',
}

const ROLE_ICONS: Record<string, React.ElementType> = {
  student: GraduationCap,
  mentor: UserCheck,
  admin: Building2,
}

export default function InstitutionMembersPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isInstitutionAdmin, institution, isLoading: isAdminLoading } = useInstitutionAdmin()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addEmail, setAddEmail] = useState('')
  const [addRole, setAddRole] = useState<MemberRole>('student')
  const [addNotes, setAddNotes] = useState('')
  const [addError, setAddError] = useState('')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (!isAdminLoading && !isInstitutionAdmin) {
      router.push('/explore')
    }
  }, [isInstitutionAdmin, isAdminLoading, router])

  const { data, isLoading } = useQuery<{
    members: InstitutionMember[]
    total: number
    page: number
    limit: number
  }>({
    queryKey: ['institution-members', debouncedSearch, roleFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: debouncedSearch,
        role: roleFilter,
        page: String(page),
        limit: '20',
      })
      const res = await fetch(`/api/institution/members?${params}`)
      if (!res.ok) throw new Error('Failed to fetch members')
      return res.json()
    },
    enabled: isInstitutionAdmin,
  })

  const addMember = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/institution/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addEmail, role: addRole, notes: addNotes }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message || '멤버 추가 실패')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution-members'] })
      queryClient.invalidateQueries({ queryKey: ['institution-stats'] })
      setShowAddModal(false)
      setAddEmail('')
      setAddRole('student')
      setAddNotes('')
      setAddError('')
    },
    onError: (err: Error) => {
      setAddError(err.message)
    },
  })

  const changeRole = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const res = await fetch(`/api/institution/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message || '역할 변경 실패')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution-members'] })
    },
  })

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const res = await fetch(`/api/institution/members/${memberId}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message || '멤버 제거 실패')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution-members'] })
      queryClient.invalidateQueries({ queryKey: ['institution-stats'] })
    },
  })

  const handleAddSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')
    addMember.mutate()
  }, [addMember])

  const totalPages = Math.ceil((data?.total || 0) / 20)

  if (isAdminLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-surface-bg">
        <div className="space-y-4 w-full max-w-xs">
          <div className="h-6 bg-surface-card rounded skeleton-shimmer w-40 mx-auto" />
          <div className="h-4 bg-surface-card rounded skeleton-shimmer w-32 mx-auto" />
        </div>
      </div>
    )
  }

  if (!isInstitutionAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-surface-bg">
        <ShieldX size={48} className="text-status-danger-text/70 mb-4" />
        <p className="text-txt-secondary">기관 관리자 권한이 필요합니다</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto h-screen bg-surface-bg">
      <div className="max-w-[87.5rem] mx-auto p-8 lg:p-12 space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <button
            onClick={() => router.push('/institution')}
            className="text-[10px] font-medium text-txt-tertiary mb-2 flex items-center gap-1 hover:text-txt-primary transition-colors"
          >
            <ChevronLeft size={12} />
            Institution Dashboard
          </button>
          <h1 className="text-3xl font-bold text-txt-primary tracking-tight">소속 학생 관리</h1>
          <p className="text-txt-tertiary text-sm mt-1">
            {institution?.institutionName} · 총 {data?.total ?? 0}명
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-disabled" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름으로 검색..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-card rounded-xl border border-border text-base sm:text-sm text-txt-primary placeholder:text-txt-disabled focus:outline-none focus:border-surface-inverse"
            />
          </div>

          {/* Role Filter */}
          <div className="flex gap-1">
            {Object.entries(ROLE_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setRoleFilter(key); setPage(1) }}
                className={`px-3 py-2 text-xs font-medium border transition-colors
                  ${roleFilter === key
                    ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                    : 'bg-surface-card text-txt-secondary border-border hover:border-surface-inverse'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Add Member */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-inverse text-txt-inverse text-xs font-medium hover:bg-surface-inverse transition-colors"
          >
            <Plus size={14} />
            멤버 추가
          </button>
        </div>

        {/* Members Table */}
        <Card padding="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[0,1,2,3,4].map(i => (
                <div key={i} className="h-14 bg-surface-sunken rounded skeleton-shimmer" />
              ))}
            </div>
          ) : !data?.members?.length ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Users size={48} className="text-txt-disabled mb-4" />
              <p className="text-txt-secondary text-sm">등록된 멤버가 없습니다</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 text-xs font-medium text-txt-primary underline underline-offset-4"
              >
                첫 멤버 추가하기
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-[10px] font-medium text-txt-tertiary px-5 py-3">이름</th>
                    <th className="text-left text-[10px] font-medium text-txt-tertiary px-5 py-3">학과</th>
                    <th className="text-left text-[10px] font-medium text-txt-tertiary px-5 py-3">역할</th>
                    <th className="text-left text-[10px] font-medium text-txt-tertiary px-5 py-3">스킬</th>
                    <th className="text-left text-[10px] font-medium text-txt-tertiary px-5 py-3">상태</th>
                    <th className="text-left text-[10px] font-medium text-txt-tertiary px-5 py-3">가입일</th>
                    <th className="text-right text-[10px] font-medium text-txt-tertiary px-5 py-3">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {data.members.map((member) => {
                    const profile = (member as any).profiles
                    const RoleIcon: React.ElementType = ROLE_ICONS[member.role as string] || Users
                    return (
                      <tr key={member.id} className="border-b border-border hover:bg-surface-sunken transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-sm text-txt-primary">
                            {profile?.nickname || '이름 없음'}
                          </div>
                          {profile?.university && (
                            <div className="text-[10px] text-txt-tertiary">{profile.university}</div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-txt-secondary">
                          {profile?.major || '-'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium border border-border">
                            {/* @ts-expect-error RoleIcon은 lucide 아이콘이므로 size prop 지원 */}
                            <RoleIcon size={12} />
                            {ROLE_LABELS[member.role] || member.role}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {(profile?.skills || []).slice(0, 3).map((skill: any, i: number) => (
                              <span key={i} className="px-1.5 py-0.5 text-[10px] font-mono bg-surface-sunken text-txt-secondary border border-border">
                                {skill.name}
                              </span>
                            ))}
                            {(profile?.skills?.length || 0) > 3 && (
                              <span className="text-[10px] text-txt-disabled">
                                +{profile.skills.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-block w-2 h-2 ${profile?.onboarding_completed ? 'bg-status-success-text' : 'bg-status-warning-text'}`} />
                          <span className="ml-2 text-xs text-txt-secondary">
                            {profile?.onboarding_completed ? '활성' : '미완료'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-txt-tertiary font-mono">
                          {new Date(member.joined_at).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-5 py-3.5">
                          {member.role !== 'admin' && (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => changeRole.mutate({
                                  memberId: member.id,
                                  role: member.role === 'student' ? 'mentor' : 'student',
                                })}
                                disabled={changeRole.isPending}
                                title={member.role === 'student' ? '멘토로 변경' : '학생으로 변경'}
                                className="p-1.5 text-txt-tertiary hover:text-txt-primary hover:bg-surface-sunken transition-colors"
                              >
                                <RefreshCw size={13} />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`"${profile?.nickname || '이름 없음'}" 멤버를 제거하시겠습니까?`)) {
                                    removeMember.mutate(member.id)
                                  }
                                }}
                                disabled={removeMember.isPending}
                                title="멤버 제거"
                                className="p-1.5 text-txt-tertiary hover:text-status-danger-text hover:bg-status-danger-bg transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border">
              <span className="text-[10px] font-mono text-txt-tertiary">
                {data?.total ?? 0}명 중 {((page - 1) * 20) + 1}-{Math.min(page * 20, data?.total ?? 0)}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 border border-border hover:bg-surface-sunken disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 border border-border hover:bg-surface-sunken disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card padding="p-0" className="w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-medium text-sm tracking-tight text-txt-primary">멤버 추가</h3>
              <button onClick={() => { setShowAddModal(false); setAddError('') }} className="text-txt-disabled hover:text-txt-primary">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-medium text-txt-tertiary block mb-1.5">
                  이메일
                </label>
                <input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="학생의 Draft 가입 이메일"
                  inputMode="email"
                  autoComplete="email"
                  required
                  className="w-full px-3 py-2.5 bg-surface-sunken rounded-xl border border-border text-base sm:text-sm text-txt-primary placeholder:text-txt-disabled focus:outline-none focus:border-surface-inverse"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-txt-tertiary block mb-1.5">
                  역할
                </label>
                <div className="flex gap-2">
                  {(['student', 'mentor'] as MemberRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setAddRole(r)}
                      className={`flex-1 py-2 text-xs font-medium border transition-colors
                        ${addRole === r
                          ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                          : 'bg-surface-card text-txt-secondary border-border hover:border-surface-inverse'
                        }`}
                    >
                      {ROLE_LABELS[r]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-medium text-txt-tertiary block mb-1.5">
                  메모 (선택)
                </label>
                <input
                  type="text"
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  placeholder="참고사항"
                  className="w-full px-3 py-2.5 bg-surface-sunken rounded-xl border border-border text-base sm:text-sm text-txt-primary placeholder:text-txt-disabled focus:outline-none focus:border-surface-inverse"
                />
              </div>
              {addError && (
                <p className="text-xs text-status-danger-text bg-status-danger-bg border border-status-danger-accent px-3 py-2">
                  {addError}
                </p>
              )}
              <button
                type="submit"
                disabled={addMember.isPending}
                className="w-full py-2.5 bg-surface-inverse text-txt-inverse text-xs font-medium hover:bg-surface-inverse disabled:opacity-50 transition-colors"
              >
                {addMember.isPending ? '추가 중...' : '멤버 추가'}
              </button>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
