'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAdmin } from '@/src/hooks/useAdmin'
import { Card } from '@/components/ui/Card'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import type { InstitutionType } from '@/src/types/institution'
import {
  Building2,
  Plus,
  Search,
  Trash2,
  Edit3,
  Users,
  UserPlus,
  ShieldX,
  ChevronLeft,
  X,
  Loader2,
  ArrowLeft,
} from 'lucide-react'

interface InstitutionItem {
  id: string
  name: string
  university: string
  type: InstitutionType
  description: string | null
  email_domains: string[]
  contact_email: string | null
  member_count: number
  created_at: string
}

const TYPE_LABELS: Record<string, string> = {
  startup_center: '창업지원센터',
  linc_plus: 'LINC+',
  incubator: '인큐베이터',
}

export default function AdminInstitutionsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isAdmin, isLoading: isAdminLoading } = useAdmin()

  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingInst, setEditingInst] = useState<InstitutionItem | null>(null)
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null) // institution id
  const [formError, setFormError] = useState('')

  // Create/Edit form state
  const [formName, setFormName] = useState('')
  const [formUniversity, setFormUniversity] = useState('')
  const [formType, setFormType] = useState<InstitutionType>('startup_center')
  const [formDescription, setFormDescription] = useState('')
  const [formEmailDomains, setFormEmailDomains] = useState('')
  const [formContactEmail, setFormContactEmail] = useState('')

  // Assign form state
  const [assignEmail, setAssignEmail] = useState('')
  const [assignRole, setAssignRole] = useState<'student' | 'mentor' | 'admin'>('student')
  const [deleteTarget, setDeleteTarget] = useState<InstitutionItem | null>(null)

  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      router.push('/explore')
    }
  }, [isAdmin, isAdminLoading, router])

  const { data: institutions, isLoading } = useQuery<InstitutionItem[]>({
    queryKey: ['admin-institutions'],
    queryFn: async () => {
      const res = await fetch('/api/admin/institutions')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    enabled: isAdmin,
    staleTime: 1000 * 60, // 1분 — 기관 목록은 자주 바뀌지 않음
  })

  const createMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch('/api/admin/institutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message || '기관 생성 실패')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-institutions'] })
      resetForm()
      setShowCreateModal(false)
    },
    onError: (err: Error) => setFormError(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      const res = await fetch(`/api/admin/institutions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message || '기관 수정 실패')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-institutions'] })
      setEditingInst(null)
      resetForm()
    },
    onError: (err: Error) => setFormError(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/institutions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('삭제 실패')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-institutions'] })
    },
  })

  const assignMutation = useMutation({
    mutationFn: async ({ institutionId, email, role }: { institutionId: string; email: string; role: string }) => {
      const res = await fetch(`/api/admin/institutions/${institutionId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message || '멤버 배정 실패')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-institutions'] })
      setShowAssignModal(null)
      setAssignEmail('')
      setAssignRole('student')
      setFormError('')
    },
    onError: (err: Error) => setFormError(err.message),
  })

  const resetForm = useCallback(() => {
    setFormName('')
    setFormUniversity('')
    setFormType('startup_center')
    setFormDescription('')
    setFormEmailDomains('')
    setFormContactEmail('')
    setFormError('')
  }, [])

  const openEditModal = useCallback((inst: InstitutionItem) => {
    setEditingInst(inst)
    setFormName(inst.name)
    setFormUniversity(inst.university)
    setFormType(inst.type)
    setFormDescription(inst.description || '')
    setFormEmailDomains((inst.email_domains || []).join(', '))
    setFormContactEmail(inst.contact_email || '')
    setFormError('')
  }, [])

  const handleCreateSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    const domains = formEmailDomains.split(',').map(d => d.trim()).filter(Boolean)
    createMutation.mutate({
      name: formName,
      university: formUniversity,
      type: formType,
      description: formDescription || undefined,
      email_domains: domains,
      contact_email: formContactEmail || undefined,
    })
  }, [formName, formUniversity, formType, formDescription, formEmailDomains, formContactEmail, createMutation])

  const handleEditSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!editingInst) return
    setFormError('')
    const domains = formEmailDomains.split(',').map(d => d.trim()).filter(Boolean)
    updateMutation.mutate({
      id: editingInst.id,
      body: {
        name: formName,
        university: formUniversity,
        type: formType,
        description: formDescription || null,
        email_domains: domains,
        contact_email: formContactEmail || null,
      },
    })
  }, [editingInst, formName, formUniversity, formType, formDescription, formEmailDomains, formContactEmail, updateMutation])

  const handleAssignSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!showAssignModal) return
    setFormError('')
    assignMutation.mutate({
      institutionId: showAssignModal,
      email: assignEmail,
      role: assignRole,
    })
  }, [showAssignModal, assignEmail, assignRole, assignMutation])

  const filtered = (institutions || []).filter(inst =>
    !search || inst.name.toLowerCase().includes(search.toLowerCase()) || inst.university.toLowerCase().includes(search.toLowerCase())
  )

  if (isAdminLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-surface-bg">
        <Loader2 size={24} className="animate-spin text-txt-tertiary" />
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

  return (
    <div className="flex-1 overflow-y-auto h-screen bg-surface-bg">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <Link
            href="/admin"
            className="text-[10px] font-medium text-txt-tertiary mb-2 flex items-center gap-1 hover:text-txt-primary transition-colors"
          >
            <ArrowLeft size={12} />
            Admin Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-txt-primary tracking-tight">기관 관리</h1>
          <p className="text-txt-tertiary text-sm mt-1">기관 생성, 수정, 삭제 및 멤버 배정</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-disabled" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="기관명 또는 대학명으로 검색..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-card rounded-xl border border-border text-base sm:text-sm text-txt-primary placeholder:text-txt-disabled ob-input"
            />
          </div>
          <button
            onClick={() => { resetForm(); setShowCreateModal(true) }}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-inverse text-txt-inverse text-xs font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={14} />
            기관 추가
          </button>
        </div>

        {/* Institutions List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0,1,2,3].map(i => (
              <div key={i} className="h-40 bg-surface-card rounded-xl border border-border skeleton-shimmer" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card padding="p-12" className="text-center">
            <Building2 size={48} className="mx-auto text-txt-disabled mb-4" />
            <p className="text-txt-secondary text-sm">
              {search ? '검색 결과가 없습니다' : '등록된 기관이 없습니다'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(inst => (
              <Card key={inst.id} padding="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-sm text-txt-primary">{inst.name}</h3>
                    <p className="text-xs text-txt-tertiary mt-0.5">{inst.university}</p>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-surface-sunken border border-border text-txt-secondary">
                    {TYPE_LABELS[inst.type] || inst.type}
                  </span>
                </div>

                {inst.description && (
                  <p className="text-xs text-txt-secondary mb-3 line-clamp-2">{inst.description}</p>
                )}

                <div className="flex flex-wrap gap-3 text-[10px] text-txt-tertiary mb-4">
                  <span className="flex items-center gap-1">
                    <Users size={12} /> {inst.member_count}명
                  </span>
                  {inst.email_domains?.length > 0 && (
                    <span className="font-mono">
                      {inst.email_domains.join(', ')}
                    </span>
                  )}
                  {inst.contact_email && (
                    <span className="font-mono">{inst.contact_email}</span>
                  )}
                </div>

                <div className="flex gap-2 border-t border-border pt-3">
                  <button
                    onClick={() => openEditModal(inst)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium border border-border hover:bg-surface-sunken transition-colors"
                  >
                    <Edit3 size={12} /> 수정
                  </button>
                  <button
                    onClick={() => { setFormError(''); setShowAssignModal(inst.id) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium border border-border hover:bg-surface-sunken transition-colors"
                  >
                    <UserPlus size={12} /> 멤버 배정
                  </button>
                  <button
                    onClick={() => setDeleteTarget(inst)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium border border-status-danger-accent text-status-danger-text hover:bg-status-danger-bg transition-colors ml-auto"
                  >
                    <Trash2 size={12} /> 삭제
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingInst) && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card padding="p-0" className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-surface-card z-10">
              <h3 className="font-medium text-sm tracking-tight text-txt-primary">
                {editingInst ? '기관 수정' : '기관 추가'}
              </h3>
              <button
                onClick={() => { setShowCreateModal(false); setEditingInst(null); resetForm() }}
                className="text-txt-disabled hover:text-txt-primary"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={editingInst ? handleEditSubmit : handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-medium text-txt-tertiary block mb-1.5">기관명 *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="예: FLIP 창업지원센터"
                  required
                  className="w-full px-3 py-2.5 bg-surface-sunken rounded-xl border border-border text-base sm:text-sm text-txt-primary placeholder:text-txt-disabled ob-input"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-txt-tertiary block mb-1.5">대학교 *</label>
                <input
                  type="text"
                  value={formUniversity}
                  onChange={(e) => setFormUniversity(e.target.value)}
                  placeholder="예: 경희대학교"
                  required
                  className="w-full px-3 py-2.5 bg-surface-sunken rounded-xl border border-border text-base sm:text-sm text-txt-primary placeholder:text-txt-disabled ob-input"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-txt-tertiary block mb-1.5">유형</label>
                <div className="flex gap-2">
                  {(['startup_center', 'linc_plus', 'incubator'] as InstitutionType[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormType(t)}
                      className={`flex-1 py-2 text-xs font-medium border transition-colors ${
                        formType === t
                          ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                          : 'bg-surface-card text-txt-secondary border-border hover:border-surface-inverse'
                      }`}
                    >
                      {TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-medium text-txt-tertiary block mb-1.5">설명</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="기관 설명 (선택)"
                  rows={2}
                  className="w-full px-3 py-2.5 bg-surface-sunken rounded-xl border border-border text-base sm:text-sm text-txt-primary placeholder:text-txt-disabled ob-input resize-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-txt-tertiary block mb-1.5">
                  이메일 도메인 (자동 등록용, 쉼표 구분)
                </label>
                <input
                  type="text"
                  value={formEmailDomains}
                  onChange={(e) => setFormEmailDomains(e.target.value)}
                  placeholder="예: khu.ac.kr, khu.edu"
                  className="w-full px-3 py-2.5 bg-surface-sunken rounded-xl border border-border text-base sm:text-sm text-txt-primary placeholder:text-txt-disabled ob-input"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-txt-tertiary block mb-1.5">연락 이메일</label>
                <input
                  type="email"
                  value={formContactEmail}
                  onChange={(e) => setFormContactEmail(e.target.value)}
                  placeholder="기관 담당자 이메일 (선택)"
                  className="w-full px-3 py-2.5 bg-surface-sunken rounded-xl border border-border text-base sm:text-sm text-txt-primary placeholder:text-txt-disabled ob-input"
                />
              </div>
              {formError && (
                <p className="text-xs text-status-danger-text bg-status-danger-bg border border-status-danger-accent px-3 py-2">
                  {formError}
                </p>
              )}
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full py-2.5 bg-surface-inverse text-txt-inverse text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {(createMutation.isPending || updateMutation.isPending) ? '처리 중...' : editingInst ? '수정 완료' : '기관 추가'}
              </button>
            </form>
          </Card>
        </div>
      )}

      {/* Assign Member Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card padding="p-0" className="w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-medium text-sm tracking-tight text-txt-primary">멤버 배정</h3>
              <button
                onClick={() => { setShowAssignModal(null); setFormError('') }}
                className="text-txt-disabled hover:text-txt-primary"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-medium text-txt-tertiary block mb-1.5">이메일</label>
                <input
                  type="email"
                  value={assignEmail}
                  onChange={(e) => setAssignEmail(e.target.value)}
                  placeholder="유저의 Draft 가입 이메일"
                  required
                  className="w-full px-3 py-2.5 bg-surface-sunken rounded-xl border border-border text-base sm:text-sm text-txt-primary placeholder:text-txt-disabled ob-input"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-txt-tertiary block mb-1.5">역할</label>
                <div className="flex gap-2">
                  {(['student', 'mentor', 'admin'] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setAssignRole(r)}
                      className={`flex-1 py-2 text-xs font-medium border transition-colors ${
                        assignRole === r
                          ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                          : 'bg-surface-card text-txt-secondary border-border hover:border-surface-inverse'
                      }`}
                    >
                      {r === 'student' ? '학생' : r === 'mentor' ? '멘토' : '관리자'}
                    </button>
                  ))}
                </div>
              </div>
              {formError && (
                <p className="text-xs text-status-danger-text bg-status-danger-bg border border-status-danger-accent px-3 py-2">
                  {formError}
                </p>
              )}
              <button
                type="submit"
                disabled={assignMutation.isPending}
                className="w-full py-2.5 bg-surface-inverse text-txt-inverse text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {assignMutation.isPending ? '배정 중...' : '멤버 배정'}
              </button>
            </form>
          </Card>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return
          deleteMutation.mutate(deleteTarget.id)
          setDeleteTarget(null)
        }}
        title="기관 삭제"
        message={deleteTarget ? `"${deleteTarget.name}" 기관을 삭제합니다. 소속 멤버 권한도 모두 해제됩니다.` : ''}
        confirmText={deleteMutation.isPending ? '삭제 중...' : '삭제'}
        variant="danger"
      />
    </div>
  )
}
