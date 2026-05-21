'use client'

import React, { useState, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ChevronLeft, Settings, ExternalLink, Clock, Users, MessageCircle,
  Pencil, Trash2, Rocket, FileText, Eye, Heart, UserCheck, Activity,
} from 'lucide-react'
import { ProjectTimeline } from '@/components/project/ProjectTimeline'
import { KickoffChecklist } from '@/components/project/KickoffChecklist'
import { RecruitCompletionBanner } from '@/components/project/RecruitCompletionBanner'
import { QuickUpdateActions } from '@/components/project/QuickUpdateActions'
import { toReadableContent } from '@/src/lib/ghostwriter/format-content'
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

export default function ProjectManagePage() {
  return (
    <Suspense>
      <ProjectManageContent />
    </Suspense>
  )
}

type Tab = 'updates' | 'timeline' | 'team' | 'applications'

// 뒤로가기 링크 sanitize — `/` 시작만 허용. 오픈 redirect 방어.
function sanitizeFrom(raw: string | null): { href: string; label: string } {
  const fallback = { href: '/profile', label: '내 프로젝트' }
  if (!raw) return fallback
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return fallback
  // 클럽 팀 구성 탭에서 진입한 경우 — 그 탭으로 복귀
  if (raw.startsWith('/clubs/')) {
    return { href: raw, label: '클럽으로' }
  }
  return { href: raw, label: '뒤로' }
}

function calcWeek(createdAt: string | null | undefined): number {
  if (!createdAt) return 1
  return Math.max(1, Math.ceil((Date.now() - new Date(createdAt).getTime()) / (7 * 24 * 60 * 60 * 1000)))
}

function ProjectManageContent() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
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
  const back = sanitizeFrom(searchParams.get('from'))

  const handleDelete = (update: ProjectUpdate) => setDeleteTarget(update)

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
      <div className="bg-surface-bg min-h-full">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-5">
            <div className="h-5 w-24 skeleton-shimmer rounded-full" />
            <div className="flex gap-5 pt-2">
              <div className="w-[72px] h-[72px] skeleton-shimmer rounded-2xl shrink-0" />
              <div className="flex-1 space-y-2.5 pt-1">
                <div className="h-6 skeleton-shimmer rounded-full w-64" />
                <div className="h-4 skeleton-shimmer rounded-full w-full max-w-md" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 pt-4">
              {[0, 1, 2, 3].map(i => <div key={i} className="h-20 skeleton-shimmer rounded-xl" />)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!opportunity) {
    return (
      <div className="bg-surface-bg min-h-full">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-sm text-txt-tertiary">프로젝트를 찾을 수 없습니다.</p>
          <Link href={back.href} className="inline-block mt-4 text-sm text-brand hover:underline">
            {back.label}으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode; ownerOnly?: boolean }[] = [
    { key: 'updates', label: '주간 업데이트', icon: <Clock size={14} /> },
    { key: 'timeline', label: '타임라인', icon: <Activity size={14} /> },
    { key: 'team', label: '팀원', icon: <Users size={14} /> },
    // 지원 관리는 운영자 전용 — 비운영자에게는 탭 자체 숨김
    { key: 'applications', label: '지원 관리', icon: <MessageCircle size={14} />, ownerOnly: true },
  ]
  const visibleTabs = TABS.filter(t => !t.ownerOnly || isOwner)

  const needed = (opportunity.needed_roles || []) as string[]
  const filled = ((opportunity as unknown as { filled_roles?: string[] | null }).filled_roles || []) as string[]
  const tags = (opportunity.interest_tags || []) as string[]
  const week = calcWeek(opportunity.created_at)

  return (
    <div className="bg-surface-bg min-h-full">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">

        {/* Back + Actions */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href={back.href}
            className="flex items-center gap-1.5 text-[13px] text-txt-tertiary hover:text-txt-primary transition-colors"
          >
            <ChevronLeft size={16} />
            {back.label}
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={`/p/${id}`}
              target="_blank"
              className="flex items-center gap-1.5 text-[13px] text-txt-tertiary hover:text-txt-primary transition-colors"
            >
              <ExternalLink size={14} />
              공개 페이지
            </Link>
            {isOwner && (
              <>
                <Link
                  href={`/projects/${id}/settings/persona`}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium text-txt-secondary border border-border rounded-full hover:border-txt-tertiary transition-colors"
                >
                  <Rocket size={14} />
                  페르소나
                </Link>
                <Link
                  href={`/projects/${id}/edit`}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium text-txt-secondary border border-border rounded-full hover:border-txt-tertiary transition-colors"
                >
                  <Settings size={14} />
                  수정
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Hero */}
        <div className="flex items-start gap-5 mb-6">
          <div className="w-[72px] h-[72px] rounded-2xl bg-brand-bg flex items-center justify-center shrink-0">
            <Rocket size={30} className="text-brand" />
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <h1 className="text-[22px] font-bold text-txt-primary">{opportunity.title}</h1>
              <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                opportunity.status === 'active'
                  ? 'bg-status-success-bg text-status-success-text'
                  : 'bg-surface-sunken text-txt-tertiary'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  opportunity.status === 'active' ? 'bg-status-success-text' : 'bg-txt-disabled'
                }`} />
                {opportunity.status === 'active' ? '모집중' : '마감'}
              </span>
            </div>
            {opportunity.description && (
              <p className="text-sm text-txt-secondary line-clamp-2 mb-2.5">{opportunity.description}</p>
            )}
            <div className="flex items-center gap-2 text-[13px] text-txt-tertiary flex-wrap">
              <span>{week}주차 진행중</span>
              {opportunity.created_at && (
                <>
                  <span className="text-border">·</span>
                  <span>개설 {timeAgo(opportunity.created_at)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 킥오프 체크리스트 — 최근 생성된 프로젝트 + 운영자 한정 */}
        {isOwner && (
          <KickoffChecklist
            projectId={id}
            isOwner={isOwner}
            createdAt={opportunity.created_at}
            description={opportunity.description}
            memberCount={1 + filled.length}
            updates={updates}
          />
        )}

        {/* 빠른 기록 액션 — 운영자/팀원 */}
        {isOwner && <QuickUpdateActions opportunityId={id} currentWeek={week} />}

        {/* 모집 자동 마감 제안 */}
        <RecruitCompletionBanner
          opportunityId={id}
          isOwner={isOwner}
          status={opportunity.status}
          neededRoles={needed}
          filledRoles={filled}
        />

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard icon={<UserCheck size={14} />} label="팀원" value={filled.length} />
          <StatCard icon={<FileText size={14} />} label="업데이트" value={updates.length} />
          <StatCard icon={<Eye size={14} />} label="조회" value={opportunity.views_count ?? 0} />
          <StatCard icon={<Heart size={14} />} label="관심" value={opportunity.interest_count ?? 0} />
        </div>

        {/* Tabs — motion underline */}
        <div className="flex gap-1 border-b border-border mb-8">
          {visibleTabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-1.5 px-5 py-3 text-[14px] font-semibold transition-colors ${
                tab === t.key
                  ? 'text-txt-primary'
                  : 'text-txt-tertiary hover:text-txt-secondary'
              }`}
            >
              {t.icon}
              {t.label}
              {t.key === 'updates' && updates.length > 0 && (
                <span className="text-[10px] bg-surface-sunken px-1.5 py-0.5 text-txt-disabled rounded-full">{updates.length}</span>
              )}
              {tab === t.key && (
                <motion.div
                  layoutId="project-tab-underline"
                  className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-txt-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Main Content + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main */}
          <div className="lg:col-span-2 min-w-0">
            {tab === 'updates' && (() => {
              const nextWeekNumber = updates.length > 0
                ? Math.max(...updates.map(u => u.week_number)) + 1
                : 1
              return (
                <div className="space-y-5">
                  {/* 운영자만 업데이트 작성 가능 */}
                  {isOwner && (
                    <InlineUpdateEditor
                      opportunityId={id}
                      nextWeekNumber={nextWeekNumber}
                      onOpenDetail={() => setShowWriteUpdate(true)}
                    />
                  )}

                  {updates.length > 0 ? (
                    <div className="space-y-3">
                      {updates.map(update => {
                        const config = UPDATE_TYPE_CONFIG[update.update_type] || UPDATE_TYPE_CONFIG.general
                        const readable = toReadableContent(update.content)
                        const [firstLine, ...restLines] = readable.split('\n')
                        const restContent = restLines.join('\n').trim()
                        return (
                          <div key={update.id} className="bg-surface-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <span className={`text-[11px] font-bold px-2 py-0.5 border rounded-full ${config.badgeColor}`}>
                                    {config.label}
                                  </span>
                                  <span className="text-[12px] text-txt-tertiary">{update.week_number}주차</span>
                                  {update.created_at && (
                                    <span className="text-[12px] text-txt-disabled">· {timeAgo(update.created_at)}</span>
                                  )}
                                </div>
                                <p className="font-semibold text-[15px] text-txt-primary mb-1.5">{firstLine}</p>
                                {restContent && (
                                  <p className="text-[13px] text-txt-secondary leading-relaxed whitespace-pre-line">{restContent}</p>
                                )}
                              </div>
                              {isOwner && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => setEditingUpdate(update)}
                                    className="p-1.5 text-txt-disabled hover:text-txt-secondary transition-colors rounded-lg hover:bg-surface-sunken"
                                    aria-label="수정"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(update)}
                                    disabled={deleteUpdate.isPending}
                                    className="p-1.5 text-txt-disabled hover:text-status-danger-text transition-colors rounded-lg hover:bg-status-danger-bg disabled:opacity-50"
                                    aria-label="삭제"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Clock}
                      title="아직 업데이트가 없습니다"
                      description={isOwner ? '위 입력창에 이번 주 성과를 간단히 남겨보세요' : '이 팀이 첫 업데이트를 작성하면 여기에 표시됩니다'}
                    />
                  )}
                </div>
              )
            })()}

            {tab === 'timeline' && (
              <ProjectTimeline
                updates={updates}
                createdAt={opportunity.created_at}
                isOwner={isOwner}
              />
            )}

            {tab === 'team' && <TeamManageSection opportunityId={id} />}

            {tab === 'applications' && isOwner && <ApplicationManageSection opportunityId={id} />}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-4">

            {/* 필요 역할 */}
            {needed.length > 0 && (
              <div className="bg-surface-card border border-border rounded-xl p-5">
                <h3 className="text-[13px] font-semibold text-txt-primary mb-3">모집 역할</h3>
                <div className="flex flex-wrap gap-1.5">
                  {needed.map(role => {
                    const isFilled = filled.includes(role)
                    return (
                      <span
                        key={role}
                        className={`text-[12px] font-medium px-2.5 py-1 rounded-full border ${
                          isFilled
                            ? 'bg-status-success-bg text-status-success-text border-status-success-text/20 line-through opacity-70'
                            : 'bg-brand-bg text-brand border-brand-border'
                        }`}
                      >
                        {role}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 태그 */}
            {tags.length > 0 && (
              <div className="bg-surface-card border border-border rounded-xl p-5">
                <h3 className="text-[13px] font-semibold text-txt-primary mb-3">분야</h3>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="text-[12px] text-txt-secondary bg-surface-sunken px-2.5 py-1 rounded-full border border-border"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 빠른 액션 */}
            <div className="bg-surface-card border border-border rounded-xl p-5 space-y-2">
              <h3 className="text-[13px] font-semibold text-txt-primary mb-3">바로가기</h3>
              <Link
                href={`/p/${id}`}
                target="_blank"
                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-surface-sunken transition-colors group"
              >
                <span className="text-[13px] text-txt-secondary group-hover:text-txt-primary">공개 페이지 열기</span>
                <ExternalLink size={14} className="text-txt-disabled group-hover:text-txt-primary" />
              </Link>
              {isOwner && (
                <Link
                  href={`/projects/${id}/edit`}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-surface-sunken transition-colors group"
                >
                  <span className="text-[13px] text-txt-secondary group-hover:text-txt-primary">프로젝트 설정</span>
                  <Settings size={14} className="text-txt-disabled group-hover:text-txt-primary" />
                </Link>
              )}
            </div>

            {/* 메타 정보 */}
            <div className="bg-surface-card border border-border rounded-xl p-5">
              <h3 className="text-[13px] font-semibold text-txt-primary mb-3">정보</h3>
              <dl className="space-y-2 text-[13px]">
                {opportunity.created_at && (
                  <div className="flex justify-between">
                    <dt className="text-txt-tertiary">개설일</dt>
                    <dd className="text-txt-secondary">{new Date(opportunity.created_at).toLocaleDateString('ko-KR')}</dd>
                  </div>
                )}
                {opportunity.updated_at && (
                  <div className="flex justify-between">
                    <dt className="text-txt-tertiary">최근 업데이트</dt>
                    <dd className="text-txt-secondary">{timeAgo(opportunity.updated_at)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-txt-tertiary">지원자</dt>
                  <dd className="text-txt-secondary">{opportunity.applications_count ?? 0}건</dd>
                </div>
                {/* 전환율 — owner 만 */}
                {isOwner && (opportunity.views_count ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-txt-tertiary">관심 → 지원 전환율</dt>
                    <dd className="text-txt-secondary tabular-nums">
                      {Math.round(((opportunity.applications_count ?? 0) / (opportunity.views_count ?? 1)) * 100)}%
                    </dd>
                  </div>
                )}
                {isOwner && (opportunity.interest_count ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-txt-tertiary">관심/조회</dt>
                    <dd className="text-txt-secondary tabular-nums">
                      {opportunity.interest_count ?? 0} / {opportunity.views_count ?? 0}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

          </aside>
        </div>
      </div>

      {/* Modals (변경 없음) */}
      <WriteUpdateForm
        opportunityId={id}
        createdAt={opportunity.created_at}
        isOpen={showWriteUpdate}
        onClose={() => setShowWriteUpdate(false)}
      />

      {editingUpdate && (
        <EditUpdateForm
          update={editingUpdate}
          opportunityId={id}
          isOpen={!!editingUpdate}
          onClose={() => setEditingUpdate(null)}
        />
      )}

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

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-surface-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-1.5 text-txt-tertiary mb-2">
        {icon}
        <span className="text-[12px]">{label}</span>
      </div>
      <div className="text-[22px] font-bold tabular-nums text-txt-primary">{value}</div>
    </div>
  )
}
