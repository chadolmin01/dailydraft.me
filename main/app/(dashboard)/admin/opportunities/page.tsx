'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAdmin } from '@/src/hooks/useAdmin'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import {
  Briefcase,
  Search,
  Trash2,
  Loader2,
  ShieldX,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  Eye,
  FileText,
  Filter,
} from 'lucide-react'

interface AdminOpportunityRow {
  id: string
  title: string
  type: string
  status: string
  creator_id: string
  creator_nickname: string
  views_count: number
  applications_count: number
  created_at: string
  updated_at: string
}

interface OpportunitiesResponse {
  opportunities: AdminOpportunityRow[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const statusLabels: Record<string, { label: string; cls: string }> = {
  active: { label: '활성', cls: 'border border-status-success-text text-status-success-text' },
  closed: { label: '마감', cls: 'border border-border text-txt-tertiary' },
  draft: { label: '임시', cls: 'border border-status-warning-text text-status-warning-text' },
}

const typeLabels: Record<string, string> = {
  project: '프로젝트',
  study: '함께 배우기',
  competition: '공모전',
  club: '동아리',
  other: '기타',
}

export default function AdminOpportunitiesPage() {
  const router = useRouter()
  const { isAdmin, isLoading: isAdminLoading } = useAdmin()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [sort, setSort] = useState('recent')
  const [deleteTarget, setDeleteTarget] = useState<AdminOpportunityRow | null>(null)

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

  const { data, isLoading, refetch } = useQuery<OpportunitiesResponse>({
    queryKey: ['admin-opportunities', debouncedSearch, statusFilter, sort, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20', sort })
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/admin/opportunities?${params}`)
      if (!res.ok) throw new Error('Failed to fetch opportunities')
      return res.json()
    },
    enabled: isAdmin,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/opportunities/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete opportunity')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-opportunities'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      setDeleteTarget(null)
    },
  })

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

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-surface-bg">
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
    <div className="flex-1 overflow-y-auto h-screen bg-surface-bg">
      <div className="max-w-[87.5rem] mx-auto p-8 lg:p-12 space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <Link href="/admin" className="hidden sm:inline-flex items-center gap-1 text-sm text-txt-tertiary hover:text-txt-primary mb-3 transition-colors">
            <ArrowLeft size={14} />
            대시보드
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-medium text-txt-tertiary mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-surface-inverse" />
                Admin / Opportunities
              </div>
              <h1 className="text-3xl font-bold text-txt-primary tracking-tight">Opportunity 관리</h1>
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

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center flex-1">
            <div className="relative flex-1 max-w-md min-w-[12.5rem]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-disabled" />
              <input
                type="text"
                placeholder="제목, 설명 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-card rounded-xl border border-border text-base sm:text-sm focus:outline-none focus:border-brand transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-txt-disabled" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                className="px-3 py-2.5 bg-surface-card rounded-xl border border-border text-sm focus:outline-none focus:border-brand"
              >
                <option value="">전체 상태</option>
                <option value="active">활성</option>
                <option value="closed">마감</option>
                <option value="draft">임시</option>
              </select>
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1) }}
                className="px-3 py-2.5 bg-surface-card rounded-xl border border-border text-sm focus:outline-none focus:border-brand"
              >
                <option value="recent">최신순</option>
                <option value="views">조회순</option>
                <option value="applications">지원순</option>
              </select>
            </div>
          </div>
          <div className="text-sm text-txt-tertiary font-mono">
            총 {data?.total ?? 0}개
          </div>
        </div>

        {/* Table */}
        <Card padding="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[0,1,2,3,4].map(i => (
                <div key={i} className="h-12 bg-surface-sunken rounded skeleton-shimmer" />
              ))}
            </div>
          ) : !data?.opportunities.length ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Briefcase size={40} className="text-txt-disabled mb-3" />
              <p className="text-txt-tertiary text-sm">결과가 없습니다</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-sunken border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-[10px] font-medium text-txt-tertiary">제목</th>
                    <th className="text-left px-4 py-3 text-[10px] font-medium text-txt-tertiary hidden md:table-cell">유형</th>
                    <th className="text-left px-4 py-3 text-[10px] font-medium text-txt-tertiary">상태</th>
                    <th className="text-left px-4 py-3 text-[10px] font-medium text-txt-tertiary hidden lg:table-cell">작성자</th>
                    <th className="text-right px-4 py-3 text-[10px] font-medium text-txt-tertiary hidden md:table-cell">조회</th>
                    <th className="text-right px-4 py-3 text-[10px] font-medium text-txt-tertiary hidden md:table-cell">지원</th>
                    <th className="text-left px-4 py-3 text-[10px] font-medium text-txt-tertiary hidden lg:table-cell">작성일</th>
                    <th className="text-right px-4 py-3 text-[10px] font-medium text-txt-tertiary">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashed divide-border">
                  {data.opportunities.map((opp) => {
                    const statusInfo = statusLabels[opp.status] || { label: opp.status, cls: 'border border-border text-txt-tertiary' }
                    return (
                      <tr key={opp.id} className="hover:bg-surface-sunken transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-medium text-txt-primary line-clamp-1">{opp.title}</span>
                        </td>
                        <td className="px-4 py-3 text-txt-secondary text-xs hidden md:table-cell">
                          {typeLabels[opp.type] || opp.type}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-[10px] font-mono font-bold ${statusInfo.cls}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-txt-secondary text-xs hidden lg:table-cell">
                          {opp.creator_nickname}
                        </td>
                        <td className="px-4 py-3 text-right hidden md:table-cell">
                          <span className="inline-flex items-center gap-1 text-xs text-txt-tertiary font-mono">
                            <Eye size={12} />
                            {opp.views_count}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right hidden md:table-cell">
                          <span className="inline-flex items-center gap-1 text-xs text-txt-tertiary font-mono">
                            <FileText size={12} />
                            {opp.applications_count}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-txt-tertiary text-xs font-mono hidden lg:table-cell">{formatDate(opp.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setDeleteTarget(opp)}
                            className="p-1.5 hover:bg-status-danger-bg text-txt-disabled hover:text-status-danger-text transition-colors"
                            title="삭제"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
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
            <h3 className="text-lg font-bold text-txt-primary mb-2">Opportunity 삭제</h3>
            <p className="text-sm text-txt-secondary mb-1">
              <span className="font-semibold">&ldquo;{deleteTarget.title}&rdquo;</span> 를 삭제하시겠습니까?
            </p>
            <p className="text-xs text-status-danger-text mb-6">이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm text-txt-secondary border border-border hover:bg-surface-inverse hover:text-txt-inverse transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
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
