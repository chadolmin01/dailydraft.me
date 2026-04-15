'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Settings, ExternalLink, Clock, Users, MessageCircle, Pencil, Trash2 } from 'lucide-react'
import { SkeletonFeed } from '@/components/ui/Skeleton'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { toast } from 'sonner'
import { useAuth } from '@/src/context/AuthContext'
import { useOpportunity } from '@/src/hooks/useOpportunities'
import { useProjectUpdates, useDeleteProjectUpdate, type ProjectUpdate } from '@/src/hooks/useProjectUpdates'
import { WriteUpdateForm } from '@/components/WriteUpdateForm'
import { EditUpdateForm } from '@/components/EditUpdateForm'
import { InlineUpdateEditor } from '@/components/InlineUpdateEditor'
import { EmptyState } from '@/components/ui/EmptyState'
import { UPDATE_TYPE_CONFIG } from '@/components/project/types'
import { ApplicationManageSection } from '@/components/project/ApplicationManageSection'
import { TeamManageSection } from '@/components/project/TeamManageSection'
import { timeAgo } from '@/src/lib/utils'
import Link from 'next/link'

export default function ProjectManagePage() {
  return (
    <Suspense>
      <ProjectManageContent />
    </Suspense>
  )
}

type Tab = 'updates' | 'team' | 'applications'

function ProjectManageContent() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('updates')
  const [showWriteUpdate, setShowWriteUpdate] = useState(false)
  const [editingUpdate, setEditingUpdate] = useState<ProjectUpdate | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProjectUpdate | null>(null)

  const { data: oppData, isLoading } = useOpportunity(id)
  const { data: updates = [] } = useProjectUpdates(id)
  const deleteUpdate = useDeleteProjectUpdate()

  const opportunity = oppData ?? null
  const isOwner = !!(user && opportunity && user.id === opportunity.creator_id)

  const handleDelete = async (update: ProjectUpdate) => {
    setDeleteTarget(update)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteUpdate.mutateAsync({ id: deleteTarget.id, opportunity_id: id })
      toast.success('업데이트가 삭제되었습니다')
    } catch {
      toast.error('삭제에 실패했습니다. 다시 시도해주세요.')
    }
    setDeleteTarget(null)
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <SkeletonFeed count={3} />
      </div>
    )
  }

  if (!opportunity || !isOwner) {
    router.replace('/profile')
    return null
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'updates', label: '주간 업데이트', icon: <Clock size={14} /> },
    { key: 'team', label: '팀원', icon: <Users size={14} /> },
    { key: 'applications', label: '지원 관리', icon: <MessageCircle size={14} /> },
  ]

  return (
    <div className="min-h-screen bg-surface-bg">
      {/* Header */}
      <div className="bg-surface-card border-b border-border sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => router.push('/profile')}
            className="flex items-center gap-2 text-sm text-txt-secondary hover:text-txt-primary transition-colors"
          >
            <ArrowLeft size={16} />
            내 프로젝트
          </button>
          <div className="flex items-center gap-2">
            <Link
              href={`/p/${id}`}
              target="_blank"
              className="flex items-center gap-1.5 text-xs text-txt-tertiary hover:text-txt-primary transition-colors"
            >
              <ExternalLink size={14} />
              공개 페이지
            </Link>
            <Link
              href={`/projects/${id}/edit`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-border text-txt-secondary hover:border-border hover:text-txt-primary transition-colors rounded-xl"
            >
              <Settings size={14} />
              수정
            </Link>
          </div>
        </div>
      </div>

      {/* Project Summary */}
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-full ${
                opportunity.status === 'active'
                  ? 'bg-status-success-bg text-status-success-text border-status-success-text/30'
                  : 'bg-surface-sunken text-txt-tertiary border-border'
              }`}>
                {opportunity.status === 'active' ? '모집중' : '마감'}
              </span>
              <span className="text-[10px] text-txt-disabled">
                {Math.max(1, Math.ceil((Date.now() - new Date(opportunity.created_at ?? '').getTime()) / (7 * 24 * 60 * 60 * 1000)))}주차 진행중
              </span>
            </div>
            <h1 className="text-xl font-bold text-txt-primary">{opportunity.title}</h1>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex border-b border-border">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-colors -mb-px ${
                tab === t.key
                  ? 'border-surface-inverse text-txt-primary'
                  : 'border-transparent text-txt-tertiary hover:text-txt-secondary'
              }`}
            >
              {t.icon}
              {t.label}
              {t.key === 'updates' && updates.length > 0 && (
                <span className="text-[0.5rem] bg-surface-sunken px-1.5 py-0.5 text-txt-disabled rounded-full">{updates.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {tab === 'updates' && (() => {
          const nextWeekNumber = updates.length > 0
            ? Math.max(...updates.map(u => u.week_number)) + 1
            : 1
          return (
            <div>
              <h2 className="text-[10px] font-medium text-txt-tertiary mb-4">
                주간 업데이트
              </h2>

              <InlineUpdateEditor
                opportunityId={id}
                nextWeekNumber={nextWeekNumber}
                onOpenDetail={() => setShowWriteUpdate(true)}
              />

              {updates.length > 0 ? (
                <div className="space-y-3">
                  {updates.map((update) => {
                    const config = UPDATE_TYPE_CONFIG[update.update_type] || UPDATE_TYPE_CONFIG.general
                    const [firstLine, ...restLines] = update.content.split('\n')
                    const restContent = restLines.join('\n').trim()
                    return (
                      <div key={update.id} className="bg-surface-card rounded-xl border border-border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-full ${config.badgeColor}`}>
                                {config.label}
                              </span>
                              <span className="text-[10px] text-txt-disabled">{update.week_number}주차</span>
                              {update.created_at && (
                                <span className="text-[10px] text-txt-disabled">· {timeAgo(update.created_at)}</span>
                              )}
                            </div>
                            <p className="font-semibold text-sm text-txt-primary mb-1">{firstLine}</p>
                            {restContent && (
                              <p className="text-xs text-txt-secondary leading-relaxed whitespace-pre-line">{restContent}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => setEditingUpdate(update)}
                              className="p-1.5 text-txt-disabled hover:text-txt-secondary transition-colors"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(update)}
                              disabled={deleteUpdate.isPending}
                              className="p-1.5 text-txt-disabled hover:text-status-danger-text transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={Clock}
                  title="아직 업데이트가 없습니다"
                  description="위 입력창에 이번 주 성과를 간단히 남겨보세요"
                />
              )}
            </div>
          )
        })()}

        {tab === 'team' && (
          <TeamManageSection opportunityId={id} />
        )}

        {tab === 'applications' && (
          <ApplicationManageSection opportunityId={id} />
        )}
      </div>

      {/* Write Update Modal */}
      <WriteUpdateForm
        opportunityId={id}
        createdAt={opportunity.created_at}
        isOpen={showWriteUpdate}
        onClose={() => setShowWriteUpdate(false)}
      />

      {/* Edit Update Modal */}
      {editingUpdate && (
        <EditUpdateForm
          update={editingUpdate}
          opportunityId={id}
          isOpen={!!editingUpdate}
          onClose={() => setEditingUpdate(null)}
        />
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="업데이트를 삭제할까요?"
        message="삭제된 업데이트는 복구할 수 없습니다."
        confirmText="삭제하기"
        cancelText="취소"
        variant="danger"
      />
    </div>
  )
}
