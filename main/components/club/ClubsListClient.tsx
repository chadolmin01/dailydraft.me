'use client'

import { useState, useMemo } from 'react'
import { PrefetchLink as Link } from '@/components/ui/PrefetchLink'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/src/context/AuthContext'
import { Users, Plus, Search, Building2, GraduationCap, Sparkles } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { SkeletonGrid } from '@/components/ui/Skeleton'
import type { ClubCard } from '@/components/explore/types'

const CATEGORIES = ['전체', '사이드프로젝트', '스타트업', '스터디', '학회']

export default function ClubsListClient() {
  const { user, isLoading: authLoading } = useAuth()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('전체')
  const [university, setUniversity] = useState<string | null>(null)

  const { data: allClubs = [], isLoading, isError, refetch } = useQuery<ClubCard[]>({
    queryKey: ['clubs', 'list', category],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' })
      if (category !== '전체') params.set('category', category)
      const res = await fetch(`/api/clubs?${params}`)
      if (!res.ok) throw new Error('클럽 목록 로딩 실패')
      const data = await res.json()
      return data.items ?? []
    },
    staleTime: 1000 * 60 * 2,
  })

  const { data: myClubs = [] } = useQuery<ClubCard[]>({
    queryKey: ['clubs', 'my', user?.id],
    queryFn: async () => {
      const res = await fetch('/api/clubs?my=1&limit=20')
      if (!res.ok) throw new Error('내 클럽 로딩 실패')
      const data = await res.json()
      return data.items ?? []
    },
    enabled: !authLoading && !!user,
    staleTime: 1000 * 60 * 2,
  })

  const filtered = useMemo(() => {
    let list = allClubs
    if (university) {
      list = list.filter(c => {
        const badges = (c as unknown as { badges?: Array<{ type: string; university?: { name?: string } }> }).badges ?? []
        return badges.some(b => b.type === 'university' && b.university?.name === university)
      })
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
      )
    }
    return list
  }, [allClubs, search, university])

  const universities = useMemo(() => {
    const set = new Set<string>()
    for (const c of allClubs) {
      const badges = (c as unknown as { badges?: Array<{ type: string; university?: { name?: string } }> }).badges ?? []
      for (const b of badges) {
        if (b.type === 'university' && b.university?.name) set.add(b.university.name)
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ko'))
  }, [allClubs])

  const myClubIds = new Set(myClubs.map(c => c.id))
  const otherClubs = filtered.filter(c => !myClubIds.has(c.id))

  return (
    <div className="bg-surface-bg min-h-full">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">

        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap size={16} className="text-brand" />
                <p className="text-[12px] font-semibold text-brand">공개 디렉토리</p>
              </div>
              <h1 className="text-[24px] sm:text-[28px] font-bold text-txt-primary tracking-tight">클럽 찾기</h1>
              <p className="text-[13px] text-txt-secondary mt-1">
                {allClubs.length > 0 && (
                  <>총 {allClubs.length}개 · </>
                )}
                창업동아리·학회·프로젝트 그룹을 탐색해보세요
              </p>
            </div>
            {user && (
              <Link
                href="/clubs/new"
                className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-txt-inverse bg-surface-inverse rounded-full hover:opacity-90 transition-opacity no-underline"
              >
                <Plus size={14} />
                클럽 만들기
              </Link>
            )}
          </div>

          {/* 비로그인 방문자용 배너 */}
          {!authLoading && !user && (
            <div className="mt-5 bg-gradient-to-br from-brand to-brand/80 text-white rounded-2xl p-5 flex items-center gap-4 flex-wrap">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Sparkles size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold">Draft는 동아리의 세대를 잇는 기록입니다</p>
                <p className="text-[12px] opacity-90 mt-0.5">
                  Discord는 현재, Draft는 히스토리. 기수별 프로젝트 · 주간 업데이트 · 알럼나이 포트폴리오가 한곳에
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/feed"
                  className="px-3 py-2 text-[12px] font-semibold bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-colors"
                >
                  활동 피드
                </Link>
                <Link
                  href="/login?redirect=/clubs"
                  className="px-4 py-2 text-[13px] font-semibold bg-white text-brand rounded-full hover:opacity-90 transition-opacity"
                >
                  시작하기
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* 검색 */}
        <div className="relative mb-5">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-tertiary pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="클럽 이름 또는 설명으로 검색"
            className="w-full pl-11 pr-4 py-3 text-[15px] bg-surface-sunken border border-border rounded-full text-txt-primary placeholder:text-txt-disabled focus:outline-none focus:border-brand focus:bg-surface-card focus:shadow-[0_0_0_3px_rgba(0,149,246,0.1)] transition-all"
          />
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-2 mb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 px-3.5 py-1.5 text-[13px] font-medium rounded-full border transition-colors ${
                category === c
                  ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                  : 'text-txt-secondary border-border bg-surface-card hover:border-txt-tertiary'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* 대학 필터 */}
        {universities.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            <button
              onClick={() => setUniversity(null)}
              className={`shrink-0 flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium rounded-full border transition-colors ${
                !university
                  ? 'bg-brand-bg text-brand border-brand-border'
                  : 'text-txt-tertiary border-border bg-surface-card hover:border-txt-tertiary'
              }`}
            >
              <Building2 size={11} />
              전체 대학
            </button>
            {universities.map(u => (
              <button
                key={u}
                onClick={() => setUniversity(u)}
                className={`shrink-0 px-3 py-1.5 text-[12px] font-medium rounded-full border transition-colors ${
                  university === u
                    ? 'bg-brand-bg text-brand border-brand-border'
                    : 'text-txt-tertiary border-border bg-surface-card hover:border-txt-tertiary'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        )}

        {/* 내 클럽 */}
        {myClubs.length > 0 && !search && (
          <section className="mb-8">
            <h2 className="text-[16px] font-bold text-txt-primary mb-3">내 클럽</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {myClubs.map(club => (
                <ClubCardItem key={club.id} club={club} />
              ))}
            </div>
          </section>
        )}

        {/* 전체 클럽 */}
        <section>
          {myClubs.length > 0 && !search && (
            <h2 className="text-[16px] font-bold text-txt-primary mb-3">전체 클럽</h2>
          )}
          {isError ? (
            <ErrorState message="클럽 목록을 불러오는 데 실패했습니다" onRetry={() => refetch()} />
          ) : isLoading ? (
            <SkeletonGrid count={6} cols={3} />
          ) : (search ? filtered : otherClubs).length === 0 ? (
            <EmptyState
              icon={Building2}
              title={search ? '검색 결과가 없습니다' : '등록된 클럽이 없습니다'}
              description={search ? '다른 키워드로 검색해보세요' : user ? '첫 번째 클럽을 만들어보세요' : '로그인하면 클럽을 만들 수 있어요'}
              actionLabel={search ? undefined : user ? '클럽 만들기' : '로그인하기'}
              actionHref={search ? undefined : user ? '/clubs/new' : '/login?redirect=/clubs'}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(search ? filtered : otherClubs).map(club => (
                <ClubCardItem key={club.id} club={club} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

/* 카드 스타일은 ExploreClubGrid와 동일 — design tokens 사용 */
function ClubCardItem({ club }: { club: ClubCard }) {
  // 활동 배지 — member_count 기반 간단 분류. 추후 activity_score 로 교체 가능
  const activityBadge = club.member_count >= 30
    ? { label: '활발', tone: 'bg-status-success-bg text-status-success-text' }
    : club.member_count >= 10
    ? { label: '성장 중', tone: 'bg-status-info-bg text-status-info-text' }
    : null

  return (
    <Link
      href={`/clubs/${club.slug}`}
      className="h-[108px] flex items-start gap-3.5 p-4 bg-surface-card border border-border rounded-xl shadow-sm hover:shadow-md hover:-translate-y-[2px] transition-all duration-200 ease-out no-underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 outline-none active:scale-[0.985]"
    >
      {club.logo_url ? (
        <Image src={club.logo_url} alt={club.name} width={52} height={52} className="w-[52px] h-[52px] rounded-md object-cover shrink-0" />
      ) : (
        <div className="w-[52px] h-[52px] rounded-md bg-surface-sunken flex items-center justify-center shrink-0">
          <span className="text-lg font-extrabold text-txt-secondary">{club.name[0]}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-txt-primary truncate">{club.name}</span>
          {club.category && (
            <span className="shrink-0 text-[10px] font-semibold text-brand bg-brand-bg px-2 py-0.5 rounded-full">
              {club.category}
            </span>
          )}
          {activityBadge && (
            <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${activityBadge.tone}`}>
              {activityBadge.label}
            </span>
          )}
        </div>
        {club.description && (
          <p className="text-xs text-txt-secondary truncate mt-1">{club.description}</p>
        )}
        <span className="flex items-center gap-1 text-xs text-txt-tertiary mt-1.5">
          <Users size={12} />
          멤버 {club.member_count}명
        </span>
      </div>
    </Link>
  )
}
