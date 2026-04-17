'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/src/context/AuthContext'
import { Users, Plus, Search, Building2 } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { SkeletonGrid } from '@/components/ui/Skeleton'
import type { ClubCard } from '@/components/explore/types'

const CATEGORIES = ['전체', '사이드프로젝트', '스타트업', '스터디', '학회']

export default function ClubsListClient() {
  const { user, isLoading: authLoading } = useAuth()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('전체')

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
    if (!search.trim()) return allClubs
    const q = search.trim().toLowerCase()
    return allClubs.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    )
  }, [allClubs, search])

  const myClubIds = new Set(myClubs.map(c => c.id))
  const otherClubs = filtered.filter(c => !myClubIds.has(c.id))

  return (
    <div className="bg-surface-bg min-h-full">
      <div className="max-w-[1200px] mx-auto px-5 pt-6 pb-16">

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[22px] font-bold text-txt-primary">클럽</h1>
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
        <div className="flex gap-2 mb-6 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
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
              description={search ? '다른 키워드로 검색해보세요' : '클럽을 만들면 여기에 표시됩니다'}
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
  return (
    <Link
      href={`/clubs/${club.slug}`}
      className="flex items-start gap-3.5 p-4 bg-surface-card border border-border rounded-xl shadow-sm hover:shadow-md hover:-translate-y-[2px] transition-all duration-200 ease-out no-underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 outline-none active:scale-[0.985]"
    >
      {club.logo_url ? (
        <img src={club.logo_url} alt={club.name} className="w-[52px] h-[52px] rounded-md object-cover shrink-0" />
      ) : (
        <div className="w-[52px] h-[52px] rounded-md bg-surface-sunken flex items-center justify-center shrink-0">
          <span className="text-lg font-extrabold text-txt-secondary">{club.name[0]}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-txt-primary truncate">{club.name}</span>
          {club.category && (
            <span className="shrink-0 text-[10px] font-semibold text-brand bg-brand-bg px-2 py-0.5 rounded-full">
              {club.category}
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
