'use client'

import React, { useState } from 'react'
import { Search, Filter, ArrowRight, Zap, Users, Star, Rocket, LayoutGrid, Loader2, Clock, Flame, ChevronRight, Hash, UserCircle, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Card } from './ui/Card'
import { ProjectDetailModal } from './ProjectDetailModal'
import { useOpportunities, type OpportunityWithCreator } from '@/src/hooks/useOpportunities'
import { usePublicProfiles, type PublicProfile } from '@/src/hooks/usePublicProfiles'
import { FALLBACK_CATEGORIES, FALLBACK_TRENDING_TAGS, FALLBACK_TALENTS } from '@/src/lib/fallbacks/explore'
import { useAuth } from '@/src/context/AuthContext'

// 카테고리 아이콘 매핑
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  all: LayoutGrid,
  'AI/ML': Sparkles,
  SaaS: Zap,
  Fintech: Star,
  HealthTech: Zap,
  Social: Users,
}

export const Explore: React.FC = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('trending')
  const [activeTab, setActiveTab] = useState<'projects' | 'people'>('projects')
  const [recruitingOnly, setRecruitingOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { isAuthenticated } = useAuth()

  const PAGE_SIZE = 12
  const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE)

  // Projects via useOpportunities
  const { data: oppData, isLoading: opportunitiesLoading } = useOpportunities({ limit: displayLimit })
  const opportunities = oppData?.items ?? []
  const totalCount = oppData?.totalCount ?? 0
  const hasMore = displayLimit < totalCount

  // People via usePublicProfiles
  const { data: publicProfiles = [], isLoading: profilesLoading } = usePublicProfiles({ limit: 12 })

  const query = searchQuery.toLowerCase().trim()

  // Map opportunities to project card format with filtering + sorting
  const projectCards = opportunities
    .filter((opp: OpportunityWithCreator) => {
      // Recruiting filter
      if (recruitingOnly && opp.status !== 'active') return false
      // Category filter
      if (selectedCategory !== 'all') {
        const tags = (opp.interest_tags || []).map(t => t.toLowerCase())
        if (!tags.some(t => t.includes(selectedCategory.toLowerCase()))) return false
      }
      // Search filter
      if (query) {
        const title = (opp.title || '').toLowerCase()
        const desc = (opp.description || '').toLowerCase()
        const tags = (opp.interest_tags || []).join(' ').toLowerCase()
        const roles = (opp.needed_roles || []).join(' ').toLowerCase()
        if (!title.includes(query) && !desc.includes(query) && !tags.includes(query) && !roles.includes(query)) return false
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'latest') {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      }
      // popular & trending: recently updated first (until engagement metrics exist)
      return new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime()
    })
    .map((opp: OpportunityWithCreator) => ({
      id: opp.id,
      title: opp.title,
      desc: opp.description || '',
      role: opp.needed_roles?.[0] || 'Team Member',
      stack: (opp.interest_tags || []).slice(0, 2),
      members: 0,
      updatedAt: opp.updated_at ?? undefined,
    }))

  // Map public profiles to talent card format with search filter
  const talentCards = (publicProfiles.length > 0
    ? publicProfiles
        .filter((profile: PublicProfile) => {
          if (!query) return true
          const name = (profile.nickname || '').toLowerCase()
          const role = (profile.desired_position || '').toLowerCase()
          const tags = (profile.interest_tags || []).join(' ').toLowerCase()
          return name.includes(query) || role.includes(query) || tags.includes(query)
        })
        .map((profile: PublicProfile) => ({
          id: profile.id,
          name: profile.nickname || 'Anonymous',
          role: profile.desired_position || 'Explorer',
          exp: '',
          tags: (profile.interest_tags || []).slice(0, 2),
          status: 'OPEN' as const,
          visionSummary: profile.vision_summary,
        }))
    : FALLBACK_TALENTS.map(t => ({ ...t, visionSummary: undefined })))

  // Categories with icons
  const categories = FALLBACK_CATEGORIES.map((cat) => ({
    ...cat,
    icon: CATEGORY_ICONS[cat.id] || LayoutGrid,
  }))

  // Trending tags
  const trendingTags = FALLBACK_TRENDING_TAGS

  // "N일 전 업데이트" badge helper
  const getUpdateBadge = (updatedAt: string | undefined) => {
    if (!updatedAt) return null
    const daysAgo = Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24))
    if (daysAgo <= 7) {
      return daysAgo === 0 ? '오늘 업데이트' : `${daysAgo}일 전 업데이트`
    }
    return null
  }

  return (
    <div className="flex-1 overflow-y-auto bg-surface-bg">
      <div className="max-w-container-wide mx-auto px-4 lg:px-6 py-6">

        {/* 3-Column Layout */}
        <div className="flex gap-6">

          {/* ========== 좌측 사이드바 ========== */}
          <aside className="hidden lg:block w-[220px] flex-shrink-0">
            <div className="sticky top-6 space-y-6">

              {/* 카테고리 */}
              <div className="bg-surface-card rounded-xl border border-border p-4">
                <h3 className="text-xs font-bold text-txt-tertiary uppercase tracking-wider mb-3">카테고리</h3>
                <nav className="space-y-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                        selectedCategory === cat.id
                          ? 'bg-accent text-txt-inverse'
                          : 'text-txt-secondary hover:bg-surface-sunken'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <cat.icon size={14} />
                        {cat.label}
                      </span>
                      <span className={`text-xs ${selectedCategory === cat.id ? 'text-txt-inverse/60' : 'text-txt-tertiary'}`}>
                        {cat.count > 0 ? cat.count : ''}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* 트렌딩 태그 */}
              <div className="bg-surface-card rounded-xl border border-border p-4">
                <h3 className="text-xs font-bold text-txt-tertiary uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Flame size={12} /> 트렌딩 태그
                </h3>
                <div className="space-y-2">
                  {trendingTags.map((item, idx) => (
                    <button
                      key={item.tag}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm text-txt-secondary hover:bg-surface-sunken transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-txt-tertiary text-xs">#{idx + 1}</span>
                        <Hash size={12} className="text-txt-tertiary" />
                        {item.tag}
                      </span>
                      <span className="text-xs text-txt-tertiary">{item.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 필터 */}
              <div className="bg-surface-card rounded-xl border border-border p-4">
                <h3 className="text-xs font-bold text-txt-tertiary uppercase tracking-wider mb-3">필터</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-txt-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-border-strong"
                      checked={recruitingOnly}
                      onChange={(e) => setRecruitingOnly(e.target.checked)}
                    />
                    모집 중만 보기
                  </label>
                </div>
              </div>

            </div>
          </aside>

          {/* ========== 메인 콘텐츠 ========== */}
          <main className="flex-1 min-w-0 space-y-6">

            {/* 검색바 */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-txt-disabled" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-surface-card border border-border rounded-xl text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/10"
                  placeholder="프로젝트, 사람, 기술 스택 검색..."
                />
              </div>
              <button className="lg:hidden p-3 bg-surface-card border border-border rounded-xl">
                <Filter size={18} className="text-txt-secondary" />
              </button>
            </div>

            {/* 프로젝트/사람 탭 + 정렬 */}
            <div className="flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('projects')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-[2px] transition-colors ${
                    activeTab === 'projects'
                      ? 'border-accent text-txt-primary'
                      : 'border-transparent text-txt-tertiary hover:text-txt-secondary'
                  }`}
                >
                  <LayoutGrid size={14} />
                  프로젝트
                </button>
                <button
                  onClick={() => setActiveTab('people')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-[2px] transition-colors ${
                    activeTab === 'people'
                      ? 'border-accent text-txt-primary'
                      : 'border-transparent text-txt-tertiary hover:text-txt-secondary'
                  }`}
                >
                  <Users size={14} />
                  사람
                </button>
              </div>

              {activeTab === 'projects' && <div className="flex items-center gap-1">
                {[
                  { id: 'trending', label: '트렌딩', icon: Flame },
                  { id: 'latest', label: '최신', icon: Clock },
                  { id: 'popular', label: '인기', icon: Star },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSortBy(tab.id as typeof sortBy)}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      sortBy === tab.id
                        ? 'bg-surface-sunken text-txt-primary'
                        : 'text-txt-tertiary hover:text-txt-secondary'
                    }`}
                  >
                    <tab.icon size={12} />
                    {tab.label}
                  </button>
                ))}
              </div>}
            </div>

            {/* 프로젝트 탭 */}
            {activeTab === 'projects' && (
              <section>
                {opportunitiesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1,2,3,4].map((i) => (
                      <Card key={i} padding="p-4">
                        <div className="flex gap-3 animate-pulse">
                          <div className="w-10 h-10 rounded-lg bg-surface-sunken flex-shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-surface-sunken rounded w-3/4" />
                            <div className="h-3 bg-border-subtle rounded w-full" />
                            <div className="h-3 bg-border-subtle rounded w-1/2" />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : projectCards.length === 0 ? (
                  <Card className="text-center py-12" padding="p-6">
                    <LayoutGrid className="mx-auto mb-4 text-txt-disabled" size={40} />
                    <p className="text-txt-tertiary text-sm">등록된 프로젝트가 없습니다</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projectCards.map((p) => (
                      <Card key={p.id} className="group hover:border-border-strong cursor-pointer" padding="p-4" onClick={() => setSelectedProjectId(p.id)}>
                        <div className="flex gap-3">
                          <div className="w-10 h-10 rounded-lg bg-surface-sunken flex items-center justify-center text-txt-secondary group-hover:bg-accent group-hover:text-txt-inverse transition-colors flex-shrink-0">
                            <Rocket size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-txt-primary text-sm truncate">{p.title}</h3>
                              {(() => {
                                const badge = getUpdateBadge(p.updatedAt)
                                return badge ? (
                                  <span className="text-xs text-status-success-text font-mono flex-shrink-0">
                                    {badge}
                                  </span>
                                ) : null
                              })()}
                            </div>
                            <p className="text-xs text-txt-tertiary mt-1 line-clamp-2">{p.desc}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs bg-tag-default-bg text-tag-default-text px-2 py-0.5 rounded font-medium">{p.role}</span>
                              {p.stack.slice(0, 2).map(s => (
                                <span key={s} className="text-xs text-txt-tertiary">{s}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Load more */}
                {hasMore && !opportunitiesLoading && (
                  <div className="text-center mt-6">
                    <button
                      onClick={() => setDisplayLimit(prev => prev + PAGE_SIZE)}
                      className="px-6 py-2.5 text-sm font-medium text-txt-secondary border border-border rounded-xl hover:bg-surface-sunken transition-colors"
                    >
                      더 보기{!searchQuery && selectedCategory === 'all' && !recruitingOnly ? ` (${totalCount - projectCards.length}개 남음)` : ''}
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* 사람 탭 */}
            {activeTab === 'people' && (
              <section>
                {profilesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1,2,3,4,5,6].map((i) => (
                      <Card key={i} padding="p-4">
                        <div className="flex gap-3 animate-pulse">
                          <div className="w-10 h-10 rounded-full bg-surface-sunken flex-shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-surface-sunken rounded w-1/2" />
                            <div className="h-3 bg-border-subtle rounded w-3/4" />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : talentCards.length === 0 ? (
                  <Card className="text-center py-12" padding="p-6">
                    <Users className="mx-auto mb-4 text-txt-disabled" size={40} />
                    <p className="text-txt-tertiary text-sm">등록된 사람이 없습니다</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {talentCards.map((t) => (
                      <Card key={t.id} className="group hover:border-border-strong cursor-pointer" padding="p-4">
                        <div className="flex gap-3">
                          <div className="w-10 h-10 bg-surface-sunken rounded-full flex items-center justify-center text-xs font-bold text-txt-secondary flex-shrink-0">
                            {t.name.substring(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-semibold text-txt-primary text-sm">{t.name}</h3>
                                <p className="text-xs text-txt-tertiary">{t.role}</p>
                              </div>
                              <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                                t.status === 'OPEN' ? 'bg-status-success-bg text-status-success-text' : 'bg-status-neutral-bg text-status-neutral-text'
                              }`}>
                                {t.status}
                              </span>
                            </div>
                            {t.visionSummary && (
                              <p className="text-xs text-txt-tertiary mt-1 line-clamp-1">{t.visionSummary}</p>
                            )}
                            {t.tags.length > 0 && (
                              <div className="flex items-center gap-1.5 mt-2">
                                {t.tags.map(tag => (
                                  <span key={tag} className="text-xs bg-tag-default-bg text-tag-default-text px-2 py-0.5 rounded font-medium">{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            )}

          </main>

          {/* ========== 우측 사이드바 ========== */}
          <aside className="hidden xl:block w-[280px] flex-shrink-0">
            <div className="sticky top-6 space-y-6">

              {/* 추천 인재 */}
              <div className="bg-surface-card rounded-xl border border-border p-4">
                <h3 className="text-xs font-bold text-txt-tertiary uppercase tracking-wider mb-3 flex items-center gap-1">
                  <UserCircle size={12} /> 추천 인재
                </h3>
                <div className="space-y-3">
                  {talentCards.slice(0, 4).map((t) => (
                    <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-sunken transition-colors cursor-pointer">
                      <div className="w-9 h-9 bg-surface-sunken rounded-full flex items-center justify-center text-xs font-bold text-txt-secondary">
                        {t.name.substring(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-txt-primary">{t.name}</p>
                        <p className="text-xs text-txt-tertiary">{t.role}</p>
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        t.status === 'OPEN' ? 'bg-status-success-bg text-status-success-text' : 'bg-status-neutral-bg text-status-neutral-text'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setActiveTab('people')}
                  className="w-full mt-3 text-xs text-txt-tertiary hover:text-txt-primary flex items-center justify-center gap-1"
                >
                  더 보기 <ChevronRight size={14} />
                </button>
              </div>

              {/* CTA 배너 */}
              <div className="bg-surface-inverse rounded-xl p-5 text-txt-inverse">
                <div className="w-10 h-10 bg-surface-card/10 rounded-lg flex items-center justify-center mb-4">
                  <Rocket size={20} />
                </div>
                <h3 className="font-bold text-base mb-1">아이디어가 있나요?</h3>
                <p className="text-txt-inverse/70 text-xs mb-4">팀을 구성하고 프로젝트를 시작하세요</p>
                <Link
                  href="/projects/new"
                  className="w-full bg-surface-card text-txt-primary text-sm font-semibold py-2 rounded-lg hover:bg-surface-sunken transition-colors block text-center"
                >
                  프로젝트 시작하기
                </Link>
              </div>

            </div>
          </aside>

        </div>
      </div>

      {/* Project Detail Modal */}
      <ProjectDetailModal
        projectId={selectedProjectId}
        onClose={() => setSelectedProjectId(null)}
      />
    </div>
  )
}
