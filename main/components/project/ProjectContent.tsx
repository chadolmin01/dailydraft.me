import React, { useState } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'
import { CommentSection } from '@/components/CommentSection'
import { EmptyState } from '@/components/ui/EmptyState'
import { timeAgo } from '@/src/lib/utils'
import { ProjectContentProps, UPDATE_TYPE_CONFIG } from './types'

type Tab = 'intro' | 'activity'

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
      <div className="flex gap-0 border-b border-border mb-5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-4 py-2.5 text-[13px] font-bold transition-colors ${
              activeTab === tab.id
                ? 'text-txt-primary'
                : 'text-txt-tertiary hover:text-txt-secondary'
            }`}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span className="ml-1 text-[10px] text-brand font-mono">{tab.count}</span>
            )}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-txt-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-in fade-in duration-200">

        {/* ── 소개 탭: description + pain_point 통합 ── */}
        {activeTab === 'intro' && (
          <div className="space-y-5">
            <p className="text-[14px] text-txt-secondary leading-[1.8] break-keep whitespace-pre-line">
              {opportunity.description}
            </p>

            {opportunity.pain_point && (
              <div className="bg-surface-sunken rounded-xl border border-border p-4">
                <p className="text-[10px] font-bold text-txt-tertiary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={10} />
                  해결하려는 문제
                </p>
                <p className="text-[13px] text-txt-secondary leading-relaxed break-keep">
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
                  <p className="text-[10px] font-bold text-txt-tertiary uppercase tracking-wider">
                    업데이트
                    {activityCount > 0 && (
                      <span className="ml-1.5 text-brand font-mono">{activityCount}</span>
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
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-colors ${
                          opportunity.show_updates
                            ? 'bg-status-success-bg text-status-success-text border-status-success-text/30'
                            : 'bg-surface-sunken text-txt-disabled border-border'
                        }`}
                      >
                        {opportunity.show_updates ? '공개 중' : '비공개'}
                      </button>
                    )}
                    {isOwner && (
                      <button
                        onClick={() => setShowWriteUpdate(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-black bg-surface-inverse text-txt-inverse rounded-full hover:opacity-90 active:scale-[0.97] transition-all"
                      >
                        + 작성
                      </button>
                    )}
                  </div>
                </div>

                {updates.length > 0 ? (
                  <div className="relative pl-6">
                    <div className="absolute left-[0.4375rem] top-1 bottom-1 w-[2px] bg-border" />
                    <div className="space-y-5">
                      {updates.map((update) => (
                        <div key={update.id} className="relative">
                          <div
                            className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-[3px] border-surface-card ${
                              UPDATE_TYPE_CONFIG[update.update_type]?.dotColor || 'bg-txt-disabled'
                            } shadow-sm`}
                          />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[11px] font-medium text-txt-tertiary">
                                {UPDATE_TYPE_CONFIG[update.update_type]?.label || update.update_type}
                              </span>
                              <span className="text-[10px] font-mono text-txt-disabled">
                                Week {update.week_number}
                              </span>
                              {update.created_at && (
                                <span className="text-[10px] font-mono text-txt-disabled">
                                  · {timeAgo(update.created_at)}
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-txt-primary text-[13px] mb-0.5">
                              {update.title}
                            </h4>
                            <p className="text-[12px] text-txt-tertiary leading-relaxed break-keep whitespace-pre-line">
                              {update.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
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

            {/* 구분선 */}
            {hasActivity && <div className="border-t border-border" />}

            {/* 댓글 섹션 */}
            <div>
              <p className="text-[10px] font-bold text-txt-tertiary uppercase tracking-wider mb-4">
                댓글
              </p>
              <CommentSection
                opportunityId={opportunity.id}
                onLoginClick={handleSignup}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
