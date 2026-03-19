import React from 'react'
import { Clock } from 'lucide-react'
import { CommentSection } from '@/components/CommentSection'
import { ProjectContentProps, updateTypeColors, updateTypeLabels } from './types'

export const ProjectContent: React.FC<ProjectContentProps> = ({
  opportunity,
  updates,
  isOwner,
  setShowWriteUpdate,
  handleSignup,
  updateOpportunity,
}) => {
  return (
    <div className="md:col-span-3 space-y-8">
      {/* Description */}
      <section>
        <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3">
          프로젝트 소개
        </h3>
        <p className="text-[0.9375rem] text-txt-secondary leading-[1.8] break-keep whitespace-pre-line">
          {opportunity.description}
        </p>
      </section>

      {/* Pain Point */}
      {opportunity.pain_point && (
        <section className="bg-surface-card border border-border-strong p-5">
          <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-2">
            해결하려는 문제
          </h3>
          <p className="text-sm text-txt-secondary leading-relaxed break-keep">
            {opportunity.pain_point}
          </p>
        </section>
      )}

      {/* Weekly Updates Timeline -- owner always sees, others only when show_updates */}
      {(isOwner || opportunity.show_updates) && (
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest">
              주간 업데이트
            </h3>
            {!opportunity.show_updates && isOwner && (
              <span className="text-[0.5rem] font-mono text-txt-disabled px-1.5 py-0.5 border border-dashed border-border">
                비공개
              </span>
            )}
          </div>
          {isOwner && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  updateOpportunity.mutate({
                    id: opportunity.id,
                    updates: { show_updates: !opportunity.show_updates },
                  })
                }}
                className={`text-[0.625rem] font-mono px-2 py-0.5 border transition-colors ${
                  opportunity.show_updates
                    ? 'bg-status-success-bg text-status-success-text border-status-success-text/30'
                    : 'bg-surface-sunken text-txt-disabled border-border hover:border-border-strong'
                }`}
              >
                {opportunity.show_updates ? '공개 중' : '비공개'}
              </button>
              <button
                onClick={() => setShowWriteUpdate(true)}
                className="text-xs text-txt-tertiary hover:text-txt-primary transition-colors font-medium"
              >
                + 작성하기
              </button>
            </div>
          )}
        </div>

        {updates.length > 0 ? (
          <div className="relative pl-6">
            <div className="absolute left-[0.4375rem] top-1 bottom-1 w-[2px] bg-border" />
            <div className="space-y-5">
              {updates.map((update) => (
                <div key={update.id} className="relative">
                  <div className={`absolute -left-6 top-1 w-4 h-4 border-[3px] border-surface-card ${updateTypeColors[update.update_type] || 'bg-txt-disabled'} shadow-sm`} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-txt-tertiary">
                        {updateTypeLabels[update.update_type] || update.update_type}
                      </span>
                      <span className="text-[0.625rem] font-mono text-txt-disabled">Week {update.week_number}</span>
                    </div>
                    <h4 className="font-semibold text-txt-primary text-sm mb-0.5">{update.title}</h4>
                    <p className="text-xs text-txt-tertiary leading-relaxed break-keep">{update.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Clock size={20} className="text-txt-disabled mx-auto mb-2" />
            <p className="text-xs text-txt-disabled">아직 업데이트가 없습니다</p>
            {isOwner && (
              <button
                onClick={() => setShowWriteUpdate(true)}
                className="mt-2 text-xs text-txt-tertiary hover:text-txt-primary transition-colors font-medium"
              >
                첫 번째 업데이트를 작성해보세요
              </button>
            )}
          </div>
        )}
      </section>
      )}

      {/* Feedback Comments */}
      <section>
        <CommentSection
          opportunityId={opportunity.id}
          onLoginClick={handleSignup}
        />
      </section>
    </div>
  )
}
