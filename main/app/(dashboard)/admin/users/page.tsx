'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAdmin } from '@/src/hooks/useAdmin'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import {
  Users,
  Search,
  Trash2,
  Loader2,
  ShieldX,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react'

interface UserProfile {
  user_id: string
  nickname: string | null
  university: string | null
  contact_email: string | null
  location: string | null
  desired_position: string | null
  skills: string[] | null
  interest_tags: string[] | null
  onboarding_completed: boolean
  is_premium: boolean
  created_at: string
  updated_at: string
}

interface UsersResponse {
  users: UserProfile[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { isAdmin, isLoading: isAdminLoading } = useAdmin()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null)

  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      router.push('/explore')
    }
  }, [isAdmin, isAdminLoading, router])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading, refetch } = useQuery<UsersResponse>({
    queryKey: ['admin-users', debouncedSearch, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (debouncedSearch) params.set('search', debouncedSearch)
      const res = await fetch(`/api/admin/users?${params}`)
      if (!res.ok) throw new Error('Failed to fetch users')
      return res.json()
    },
    enabled: isAdmin,
  })

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete user')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      setDeleteTarget(null)
    },
  })

  if (isAdminLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-surface-sunken">
        <Loader2 className="animate-spin text-txt-disabled" size={32} />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-surface-sunken">
        <ShieldX size={48} className="text-status-danger-text/70 mb-4" />
        <p className="text-txt-secondary">접근 권한이 없습니다</p>
      </div>
    )
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="flex-1 overflow-y-auto h-screen bg-surface-sunken">
      <div className="max-w-[87.5rem] mx-auto p-8 lg:p-12 space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <Link href="/admin" className="hidden sm:inline-flex items-center gap-1 text-sm text-txt-tertiary hover:text-txt-primary mb-3 transition-colors">
            <ArrowLeft size={14} />
            대시보드
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[0.625rem] font-medium text-txt-tertiary mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-black" />
                Admin / Users
              </div>
              <h1 className="text-3xl font-bold text-txt-primary tracking-tight">사용자 관리</h1>
            </div>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 bg-surface-inverse text-txt-inverse text-sm font-medium border border-surface-inverse hover:bg-surface-inverse/90 transition-colors hover:opacity-90 active:scale-[0.97]"
            >
              <RefreshCw size={16} />
              새로고침
            </button>
          </div>
        </div>

        {/* Search & Stats */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative flex-1 max-w-md w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-disabled" />
            <input
              type="text"
              placeholder="닉네임, 대학, 이메일 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-card rounded-lg border border-border text-sm focus:outline-none focus:border-brand transition-colors"
            />
          </div>
          <div className="text-sm text-txt-tertiary font-mono">
            총 {data?.total ?? 0}명
          </div>
        </div>

        {/* Table */}
        <Card padding="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-txt-disabled" size={24} />
            </div>
          ) : !data?.users.length ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Users size={40} className="text-txt-disabled mb-3" />
              <p className="text-txt-tertiary text-sm">사용자가 없습니다</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-sunken border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-[0.625rem] font-medium text-txt-tertiary">닉네임</th>
                    <th className="text-left px-4 py-3 text-[0.625rem] font-medium text-txt-tertiary hidden md:table-cell">대학</th>
                    <th className="text-left px-4 py-3 text-[0.625rem] font-medium text-txt-tertiary hidden lg:table-cell">이메일</th>
                    <th className="text-left px-4 py-3 text-[0.625rem] font-medium text-txt-tertiary hidden lg:table-cell">포지션</th>
                    <th className="text-left px-4 py-3 text-[0.625rem] font-medium text-txt-tertiary">상태</th>
                    <th className="text-left px-4 py-3 text-[0.625rem] font-medium text-txt-tertiary hidden md:table-cell">가입일</th>
                    <th className="text-right px-4 py-3 text-[0.625rem] font-medium text-txt-tertiary">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashed divide-border">
                  {data.users.map((u) => (
                    <tr key={u.user_id} className="hover:bg-surface-sunken transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-txt-primary">{u.nickname || '-'}</span>
                      </td>
                      <td className="px-4 py-3 text-txt-secondary hidden md:table-cell">{u.university || '-'}</td>
                      <td className="px-4 py-3 text-txt-secondary hidden lg:table-cell">
                        <span className="font-mono text-xs">{u.contact_email || '-'}</span>
                      </td>
                      <td className="px-4 py-3 text-txt-secondary hidden lg:table-cell text-xs">{u.desired_position || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {u.onboarding_completed ? (
                            <span className="px-2 py-0.5 text-[0.625rem] font-mono font-bold border border-status-success-text text-status-success-text">완료</span>
                          ) : (
                            <span className="px-2 py-0.5 text-[0.625rem] font-mono font-bold border border-border text-txt-tertiary">미완</span>
                          )}
                          {u.is_premium && (
                            <span className="px-2 py-0.5 text-[0.625rem] font-mono font-bold border border-status-warning-text text-status-warning-text">PRO</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-txt-tertiary text-xs font-mono hidden md:table-cell">{formatDate(u.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="p-1.5 hover:bg-status-danger-bg text-txt-disabled hover:text-status-danger-text transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-txt-tertiary font-mono">
                {data.page} / {data.totalPages} 페이지
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 hover:bg-surface-sunken disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-border"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="p-1.5 hover:bg-surface-sunken disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-border"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card padding="p-6" className="w-full max-w-md bg-surface-card">
            <h3 className="text-lg font-bold text-txt-primary mb-2">사용자 삭제</h3>
            <p className="text-sm text-txt-secondary mb-1">
              <span className="font-semibold">{deleteTarget.nickname || deleteTarget.user_id}</span> 사용자를 삭제하시겠습니까?
            </p>
            <p className="text-xs text-status-danger-text mb-6">이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm text-txt-secondary border border-border hover:bg-black hover:text-white transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.user_id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm bg-status-danger-text text-white border border-status-danger-text hover:bg-status-danger-text/90 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {deleteMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                삭제
              </button>
            </div>
            {deleteMutation.isError && (
              <p className="text-xs text-status-danger-text mt-3">삭제에 실패했습니다. 다시 시도해주세요.</p>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
