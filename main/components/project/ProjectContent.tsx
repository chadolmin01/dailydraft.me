import React, { useState } from 'react'
import { Clock, AlertTriangle, CheckCircle2, Circle, ChevronDown } from 'lucide-react'
import { CommentSection } from '@/components/CommentSection'
import { EmptyState } from '@/components/ui/EmptyState'
import { timeAgo } from '@/src/lib/utils'
import { safeParseContent } from '@/src/lib/ghostwriter/parse-content'
import { ProjectContentProps, UPDATE_TYPE_CONFIG } from './types'

type Tab = 'intro' | 'activity'

/**
 * 주간 업데이트 content 상세 (펼쳤을 때).
 * JSON 구조(ghostwriter 생성)면 summary + tasks + nextPlan,
 * 일반 텍스트면 그대로.
 */
function UpdateDetail({ content }: { content: string }) {
  let isStructured = false
  try {
    const raw = JSON.parse(content)
    if (typeof raw === 'object' && raw !== null && raw.summary) isStructured = true
  } catch { /* plain text */ }

  if (!isStructured) {
    return (
      <p className="text-[14px] text-txt-secondary leading-relaxed break-keep whitespace-pre-line">
        {content}
      </p>
    )
  }

  const parsed = safeParseContent(content)

  return (
    <div className="space-y-3 mt-3">
      <p className="text-[14px] text-txt-secondary leading-relaxed break-keep">
        {parsed.summary}
      </p>

      {parsed.tasks.length > 0 && (
        <div className="space-y-1.5">
          {parsed.tasks.map((task, i) => (
            <div key={i} className="flex items-start gap-2 text-[13px]">
              {task.done ? (
                <CheckCircle2 size={15} className="text-[#34C759] shrink-0 mt-0.5" />
              ) : (
                <Circle size={15} className="text-txt-disabled shrink-0 mt-0.5" />
              )}
              <span className={task.done ? 'text-txt-tertiary line-through' : 'text-txt-secondary'}>
                {task.text}
              </span>
            </div>
          ))}
        </div>
      )}

      {parsed.nextPlan && (
        <div className="bg-[#EDF5FF] dark:bg-[#1A2A3A] rounded-xl px-3.5 py-2.5">
          <span className="text-[12px] font-semibold text-[#3182F6] block mb-0.5">다음 주 계획</span>
          <p className="text-[13px] text-txt-secondary leading-relaxed break-keep">{parsed.nextPlan}</p>
        </div>
      )}
    </div>
  )
}

/** 접힘 헤더에서 보여줄 요약 정보 추출 */
function getUpdateSummaryInfo(content: string) {
  try {
    const raw = JSON.parse(content)
    if (typeof raw === 'object' && raw !== null && Array.isArray(raw.tasks)) {
      const done = raw.tasks.filter((t: { done?: boolean }) => t.done).length
      const total = raw.tasks.length
      return { tasksDone: done, tasksTotal: total }
    }
  } catch { /* plain text */ }
  return { tasksDone: 0, tasksTotal: 0 }
}

/** 개별 업데이트 카드 — 접힘/펼침 */
function UpdateCard({ update, defaultOpen }: {
  update: { id: string; title: string; content: string; update_type: string; week_number: number; created_at: string | null }
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const { tasksDone, tasksTotal } = getUpdateSummaryInfo(update.content)

  return (
    <div className="bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl overflow-hidden">
      {/* 헤더 — 항상 표시, 클릭하면 토글 */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 p-4 text-left bg-transparent border-none cursor-pointer hover:bg-[#F0F1F3] dark:hover:bg-[#252527] transition-colors"
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${UPDATE_TYPE_CONFIG[update.update_type]?.dotColor || 'bg-txt-disabled'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-txt-primary text-[14px] truncate">{update.title}</h4>
            <span className="text-[12px] text-txt-disabled shrink-0">
              {update.week_number}주차
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[12px] text-txt-tertiary">
              {UPDATE_TYPE_CONFIG[update.update_type]?.label || update.update_type}
            </span>
            {tasksTotal > 0 && (
              <>
                <span className="text-[12px] text-txt-disabled">·</span>
                <span className="text-[12px] font-semibold text-[#34C759]">
                  작업 {tasksDone}/{tasksTotal}
                </span>
              </>
            )}
            {update.created_at && (
              <>
                <span className="text-[12px] text-txt-disabled">·</span>
                <span className="text-[12px] text-txt-disabled">{timeAgo(update.created_at)}</span>
              </>
            )}
          </div>
        </div>
        <ChevronDown size={16} className={`text-txt-tertiary shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* 상세 — 열렸을 때만 */}
      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-[#EBEBEB] dark:border-[#2C2C2E]">
          <UpdateDetail content={update.content} />
        </div>
      )}
    </div>
  )
}

export const ProjectContent: React.FC<ProjectContentProps> = ({
  opportunity,
  updates,
  isOwner,
  setShowWriteUpdate,
  handleSignup,
  updateOpportunity,
}) => {
  const hasActivity = isOwner || opportunity.show_updates
  const activityCount = updates.length

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'intro', label: '소개' },
    ...(hasActivity
      ? [{ id: 'activity' as Tab, label: '활동', count: activityCount }]
      : [{ id: 'activity' as Tab, label: '활동' }]),
  ]

  const [activeTab, setActiveTab] = useState<Tab>('intro')

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-0 mb-5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-4 py-2.5 text-[15px] font-bold transition-colors ${
              activeTab === tab.id
                ? 'text-txt-primary'
                : 'text-txt-tertiary hover:text-txt-secondary'
            }`}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span className="ml-1 text-[12px] text-[#3182F6] font-semibold">{tab.count}</span>
            )}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#3182F6] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-in fade-in duration-200">

        {/* ── 소개 탭: description + pain_point 통합 ── */}
        {activeTab === 'intro' && (
          <div className="space-y-5">
            <p className="text-[15px] text-txt-primary leading-[1.8] break-keep whitespace-pre-line">
              {opportunity.description}
            </p>

            {opportunity.pain_point && (
              <div className="bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl p-5">
                <p className="text-[13px] font-semibold text-txt-secondary mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={13} />
                  해결하려는 문제
                </p>
                <p className="text-[15px] text-txt-secondary leading-relaxed break-keep">
                  {opportunity.pain_point}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── 활동 탭: 업데이트 + 댓글 통합 ── */}
        {activeTab === 'activity' && (
          <div className="space-y-8">

            {/* 업데이트 섹션 */}
            {hasActivity && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[15px] font-bold text-txt-primary">
                    업데이트
                    {activityCount > 0 && (
                      <span className="ml-1.5 text-[#3182F6] font-semibold">{activityCount}</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    {isOwner && (
                      <button
                        onClick={() =>
                          updateOpportunity.mutate({
                            id: opportunity.id,
                            updates: { show_updates: !opportunity.show_updates },
                          })
                        }
                        className={`text-[13px] font-semibold px-3 py-1 rounded-full transition-colors ${
                          opportunity.show_updates
                            ? 'bg-[#E8F5E9] dark:bg-[#1B3A2D] text-[#34C759]'
                            : 'bg-[#F2F3F5] dark:bg-[#2C2C2E] text-txt-disabled'
                        }`}
                      >
                        {opportunity.show_updates ? '공개 중' : '비공개'}
                      </button>
                    )}
                    {isOwner && (
                      <button
                        onClick={() => setShowWriteUpdate(true)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-[13px] font-semibold bg-[#3182F6] text-white rounded-full hover:bg-[#2272EB] active:scale-[0.97] transition-all"
                      >
                        + 작성
                      </button>
                    )}
                  </div>
                </div>

                {updates.length > 0 ? (
                  <div className="space-y-2">
                    {updates.map((update, i) => (
                      <UpdateCard key={update.id} update={update} defaultOpen={false} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Clock}
                    title="아직 업데이트가 없습니다"
                    description={
                      isOwner
                        ? '첫 업데이트를 작성하면 팀원에게 알림이 전송됩니다'
                        : undefined
                    }
                    actionLabel={isOwner ? '업데이트 작성하기' : undefined}
                    onAction={isOwner ? () => setShowWriteUpdate(true) : undefined}
                    size="compact"
                  />
                )}
              </div>
            )}

            {/* 구분 밴드 */}
            {hasActivity && <div className="h-2 bg-[#F2F3F5] dark:bg-[#2C2C2E] -mx-5 sm:-mx-8" />}

            {/* 댓글 섹션 */}
            <div>
              <p className="text-[15px] font-bold text-txt-primary mb-4">
                댓글
              </p>
              <CommentSection
                opportunityId={opportunity.id}
                ownerId={opportunity.creator_id}
                onLoginClick={handleSignup}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
