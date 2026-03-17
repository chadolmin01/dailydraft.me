'use client'

import React from 'react'
import { Users, Sparkles, Coffee } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { useAuth } from '@/src/context/AuthContext'
import { getMatchColorClass } from './constants'
import type { TalentCard, UserRecommendation } from './types'

interface ExplorePeopleGridProps {
  talentCards: TalentCard[]
  peopleRecs: UserRecommendation[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  hasMore: boolean
  onLoadMore: () => void
  onSelectProfile: (id: string, byUserId: boolean) => void
}

export function ExplorePeopleGrid({
  talentCards,
  peopleRecs,
  isLoading,
  isError,
  onRetry,
  hasMore,
  onLoadMore,
  onSelectProfile,
}: ExplorePeopleGridProps) {
  const { isAuthenticated } = useAuth()

  return (
    <section>
      {/* AI 추천 팀원 섹션 */}
      {isAuthenticated && peopleRecs.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xs font-bold text-txt-tertiary uppercase tracking-wider mb-4 flex items-center gap-1">
            <Sparkles size={12} /> AI 추천 팀원
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {peopleRecs.map((rec) => (
              <div
                key={rec.user_id}
                onClick={() => onSelectProfile(rec.user_id, true)}
                className="bg-surface-card border border-border overflow-hidden group hover:border-border-strong hover:shadow-sharp transition-all cursor-pointer h-[13.75rem] flex flex-col focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                <div className="px-4 pt-4 h-[4.75rem] shrink-0">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-surface-sunken flex items-center justify-center text-base font-bold text-txt-secondary shrink-0">
                      {(rec.nickname || '??').substring(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-base text-txt-primary truncate">{rec.nickname}</h3>
                        <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${getMatchColorClass(rec.match_score)}`}>
                          {rec.match_score}%
                        </span>
                      </div>
                      <p className="text-sm text-txt-secondary truncate">{rec.desired_position || 'Explorer'}{rec.location ? ` · ${rec.location}` : ''}</p>
                    </div>
                  </div>
                </div>
                <div className="px-4 h-[5.75rem] shrink-0 overflow-hidden">
                  <p className="text-sm text-txt-tertiary line-clamp-2 mb-2">{rec.match_reason}</p>
                  {rec.interest_tags.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      {rec.interest_tags.map((tag: string) => (
                        <span key={tag} className="text-xs bg-tag-default-bg text-tag-default-text px-2 py-0.5 rounded font-medium shrink-0">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="px-4 pb-4 h-[3.25rem] shrink-0 flex items-end">
                  <div className="flex items-center justify-between w-full pt-2 border-t border-border-subtle">
                    <span className="text-xs text-txt-tertiary">{rec.founder_type || rec.desired_position || 'Explorer'}</span>
                    <span className="text-xs text-status-success-text flex items-center gap-1"><Coffee size={10} /> 커피챗 가능</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 mb-2 flex items-center gap-3">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-txt-tertiary font-medium">모든 사람</span>
            <div className="flex-1 border-t border-border" />
          </div>
        </div>
      )}

      {isError ? (
        <ErrorState message="프로필을 불러오는 데 실패했습니다" onRetry={onRetry} />
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="bg-surface-card border border-border overflow-hidden h-[13.75rem] flex flex-col animate-pulse">
              <div className="px-4 pt-4 h-[4.75rem] shrink-0 flex gap-3">
                <div className="w-12 h-12 bg-surface-sunken shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 bg-surface-sunken rounded w-1/2" />
                  <div className="h-3 bg-surface-sunken rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : talentCards.length === 0 ? (
        <EmptyState
          icon={Users}
          title="등록된 사람이 없습니다"
          description="프로필을 공개하면 여기에 표시돼요"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {talentCards.map((t) => (
            <div
              key={t.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectProfile(t.id, false)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectProfile(t.id, false) } }}
              className="relative bg-surface-card border border-border-strong overflow-hidden group hover:shadow-solid-sm hover:border-brand/30 transition-all cursor-pointer h-[13.75rem] flex flex-col focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 outline-none"
            >
              <div className="absolute top-1 left-1 w-2 h-2 border-l border-t border-black/15" />
              <div className="absolute top-1 right-1 w-2 h-2 border-r border-t border-black/15" />
              <div className="px-4 pt-4 h-[4.75rem] shrink-0">
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-brand-bg border border-brand-border flex items-center justify-center text-base font-bold text-brand shrink-0 overflow-hidden">
                    {t.avatarUrl ? (
                      <img src={t.avatarUrl} alt={t.name} className="w-full h-full object-cover" />
                    ) : (
                      t.name.substring(0, 2)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-base text-txt-primary truncate">{t.name}</h3>
                      <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${
                        t.status === 'OPEN' ? 'bg-status-success-bg text-status-success-text'
                        : t.status === 'BUSY' ? 'bg-status-neutral-bg text-status-neutral-text'
                        : 'bg-surface-sunken text-txt-tertiary'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                    <p className="text-sm text-txt-secondary truncate">{t.role}{t.location ? ` · ${t.location}` : ''}</p>
                  </div>
                </div>
              </div>
              <div className="px-4 h-[5.75rem] shrink-0 overflow-hidden">
                {t.visionSummary && (
                  <p className="text-sm text-txt-tertiary line-clamp-2 mb-2">{t.visionSummary}</p>
                )}
                {t.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    {t.tags.map(tag => (
                      <span key={tag} className="text-xs bg-tag-default-bg text-tag-default-text px-2 py-0.5 rounded font-medium shrink-0">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-4 pb-4 h-[3.25rem] shrink-0 flex items-end">
                <div className="flex items-center justify-between w-full pt-2 border-t border-dashed border-border">
                  <span className="text-[0.625rem] font-mono text-txt-tertiary">{t.role}</span>
                  {t.status === 'OPEN' ? (
                    <span className="text-[0.625rem] font-mono text-indicator-online flex items-center gap-1 bg-status-success-bg px-1.5 py-0.5 border border-indicator-online/20"><Coffee size={9} /> AVAILABLE</span>
                  ) : (
                    <span className="text-[0.625rem] font-mono text-txt-tertiary flex items-center gap-1 bg-surface-sunken px-1.5 py-0.5 border border-border">{t.status}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {talentCards.length > 0 && hasMore && !isLoading && (
        <div className="text-center mt-6">
          <button
            onClick={onLoadMore}
            className="px-6 py-2.5 text-sm font-bold text-txt-secondary border border-border-strong hover:bg-surface-sunken hover:shadow-sharp transition-all"
          >
            더 보기
          </button>
        </div>
      )}
    </section>
  )
}
