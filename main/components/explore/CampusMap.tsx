'use client'

import React, { useRef, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'

/* ──────────────────────────────────────
 * 대학/클럽 데이터
 * active: 실제 Draft에 등록된 대학만 true
 * ────────────────────────────────────── */
type Club = {
  name: string
  abbr: string
  color: string
  members: number
  category: string
  badge?: string
  recruiting: boolean
  clubId?: string // DB clubs.id — 업데이트 수 매칭용
  slug?: string   // 클럽 페이지 이동용
}

type University = {
  id: string
  name: string
  abbr: string
  region: string
  color: string
  active: boolean
  clubs: Club[]
}

const UNIVERSITIES: University[] = [
  {
    id: 'kyunghee', name: '경희대', abbr: '경희', region: '서울', color: '#8B1A1A', active: true,
    clubs: [
      { name: 'FLIP', abbr: 'FL', color: '#0095F6', members: 12, category: '사이드프로젝트', badge: '프론트엔드 모집 중', recruiting: true, slug: 'flip' },
    ],
  },
  { id: 'snu', name: '서울대', abbr: '서울', region: '서울', color: '#003876', active: false, clubs: [] },
  { id: 'yonsei', name: '연세대', abbr: '연세', region: '서울', color: '#003A70', active: false, clubs: [] },
  { id: 'korea', name: '고려대', abbr: '고려', region: '서울', color: '#8B0029', active: false, clubs: [] },
  { id: 'hanyang', name: '한양대', abbr: '한양', region: '서울', color: '#004B8D', active: false, clubs: [] },
  { id: 'hongik', name: '홍익대', abbr: '홍익', region: '서울', color: '#C41E3A', active: false, clubs: [] },
  { id: 'skku', name: '성균관대', abbr: '성균', region: '수원', color: '#00573F', active: false, clubs: [] },
  { id: 'sogang', name: '서강대', abbr: '서강', region: '서울', color: '#8B0000', active: false, clubs: [] },
]

/**
 * 주간 활동 막대 — 최근 8주간 업데이트 수를 시각화.
 * weeklyCounts: 최근 8주 업데이트 수 배열 (ex: [0,1,3,2,0,5,1,4]).
 * 데이터가 없으면 빈 막대(높이 2px)로 표시.
 */
function ActivityBars({ color, weeklyCounts }: { color: string; weeklyCounts: number[] }) {
  const max = Math.max(...weeklyCounts, 1) // 0 나누기 방지
  return (
    <div className="flex items-end gap-[2px] h-4 mt-2">
      {weeklyCounts.map((count, i) => {
        const ratio = count / max
        const h = count > 0 ? Math.round(3 + ratio * 13) : 2
        return (
          <div
            key={i}
            className="w-1 rounded-sm transition-opacity group-hover:opacity-70"
            style={{
              height: h,
              background: count > 0 ? color : '#E5E5E5',
              opacity: count > 0 ? 0.5 : 0.15,
            }}
          />
        )
      })}
    </div>
  )
}

/** 대학 노드 (4-col 그리드 셀) */
function UniNode({ uni, weeklyCounts, onClick }: { uni: University; weeklyCounts: number[]; onClick: () => void }) {
  const totalMembers = uni.clubs.reduce((s, c) => s + c.members, 0)
  const hasRecruiting = uni.clubs.some(c => c.recruiting)

  return (
    <button
      onClick={uni.active ? onClick : undefined}
      className={`group relative flex flex-col items-center py-7 px-3 transition-colors border-r border-b border-[#F0F0F0] dark:border-[#2C2C2E] last:border-r-0 nth-[4n]:border-r-0 ${
        uni.active
          ? 'cursor-pointer hover:bg-[#F5F5F5] dark:hover:bg-[#252527]'
          : 'cursor-default'
      }`}
      disabled={!uni.active}
    >
      {/* 로고 원 */}
      <div className="relative mb-2.5">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center text-[12px] font-extrabold text-white transition-all ${
            uni.active
              ? 'shadow-[0_2px_8px_rgba(0,0,0,0.1)] group-hover:scale-[1.08] group-hover:shadow-[0_4px_16px_rgba(0,0,0,0.15)]'
              : 'opacity-25'
          }`}
          style={{ background: uni.color }}
        >
          {uni.active ? uni.abbr : '?'}
        </div>
        {/* 브랜드 링 (hover) */}
        {uni.active && (
          <div className="absolute -inset-1 rounded-full border-2 border-transparent group-hover:border-[#0095F6] transition-colors pointer-events-none" />
        )}
        {/* 모집 중 초록 뱃지 */}
        {hasRecruiting && (
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#10B981] border-[2.5px] border-white shadow-[0_0_4px_rgba(16,185,129,0.4)]" />
        )}
      </div>

      {/* 대학명 */}
      <span className={`text-[14px] font-bold text-center mb-0.5 ${
        uni.active ? 'text-[#262626] dark:text-white' : 'text-[#C7C7C7] dark:text-[#555]'
      }`}>
        {uni.name}
      </span>

      {/* 메타 정보 */}
      {uni.active ? (
        <>
          <span className="text-[12px] text-[#8E8E8E] text-center leading-snug">
            {uni.region} · 멤버 {totalMembers}명
          </span>
          <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-[#0095F6] bg-[#E8F4FD] px-2 py-0.5 rounded-full">
            {uni.clubs.length}개 클럽 활동 중
          </span>
          <ActivityBars color={uni.color} weeklyCounts={weeklyCounts} />
        </>
      ) : (
        <>
          <span className="text-[12px] text-[#C7C7C7] dark:text-[#555] text-center">
            준비 중
          </span>
        </>
      )}
    </button>
  )
}

/** 대학 드릴다운 헤더 */
function UniDetailHeader({ uni }: { uni: University }) {
  const totalMembers = uni.clubs.reduce((s, c) => s + c.members, 0)
  return (
    <div className="flex items-center gap-4 px-5 py-5 border-b border-[#F0F0F0] dark:border-[#2C2C2E]">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-[11px] font-extrabold text-white shrink-0"
        style={{ background: uni.color }}
      >
        {uni.abbr}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-bold text-[#262626] dark:text-white">{uni.name}</h3>
        <p className="text-[13px] text-[#8E8E8E] mt-0.5">
          {uni.clubs.length}개 클럽 · 멤버 {totalMembers}명
        </p>
      </div>
    </div>
  )
}

/** 클럽 행 — slug가 있으면 클럽 페이지로 이동 */
function ClubRow({ club }: { club: Club }) {
  const content = (
    <>
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-extrabold text-white shrink-0"
        style={{ background: club.color }}
      >
        {club.abbr}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[14px] font-bold text-[#262626] dark:text-white">{club.name}</span>
          {club.recruiting && (
            <span className="text-[10px] font-semibold text-[#0095F6] bg-[#E8F4FD] px-1.5 py-0.5 rounded-full">모집 중</span>
          )}
        </div>
        <p className="text-[12px] text-[#8E8E8E] mt-0.5 truncate">
          {club.category}{club.badge ? ` · ${club.badge}` : ''}
        </p>
      </div>
      <div className="flex flex-col items-end shrink-0">
        <span className="text-[12px] text-[#8E8E8E]">멤버 {club.members}명</span>
      </div>
    </>
  )

  const className = "flex items-center gap-3.5 px-5 py-4 border-b border-[#F0F0F0] dark:border-[#2C2C2E] last:border-b-0 hover:bg-[#F5F5F5] dark:hover:bg-[#252527] transition-colors cursor-pointer"

  if (club.slug) {
    return <Link href={`/clubs/${club.slug}`} className={className}>{content}</Link>
  }
  return <div className={className}>{content}</div>
}

/**
 * 최근 8주간 주별 업데이트 수를 계산.
 * updates: { created_at: string }[]
 * → [week-8, week-7, ..., week-1] 형태의 8개 숫자 배열.
 */
function toWeeklyCounts(updates: { created_at: string }[]): number[] {
  const now = Date.now()
  const WEEK = 7 * 24 * 60 * 60 * 1000
  const counts = Array(8).fill(0) as number[]
  for (const u of updates) {
    const age = now - new Date(u.created_at).getTime()
    const weekIdx = Math.floor(age / WEEK)
    if (weekIdx >= 0 && weekIdx < 8) {
      counts[7 - weekIdx]++ // 오래된 게 왼쪽
    }
  }
  return counts
}

/* ════════════════════════════════════════ */
/* CampusMap 본체                           */
/* ════════════════════════════════════════ */
export function CampusMap() {
  const [drillUni, setDrillUni] = useState<University | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [lockedHeight, setLockedHeight] = useState<number>()

  const handleDrill = (uni: University) => {
    if (contentRef.current) setLockedHeight(contentRef.current.offsetHeight)
    setDrillUni(uni)
  }
  const handleBack = () => {
    setLockedHeight(undefined)
    setDrillUni(null)
  }

  // 최근 업데이트를 가져와 주간 활동 막대에 사용
  const { data: recentUpdates = [] } = useQuery<{ created_at: string }[]>({
    queryKey: ['campus-activity'],
    queryFn: async () => {
      const res = await fetch('/api/project-updates/recent?limit=50')
      if (!res.ok) return []
      return res.json()
    },
    staleTime: 1000 * 60 * 5,
  })

  const weeklyCounts = toWeeklyCounts(recentUpdates)
  // 비활성 대학은 빈 막대
  const emptyCounts = Array(8).fill(0) as number[]

  const activeCount = UNIVERSITIES.filter(u => u.active).length
  const clubCount = UNIVERSITIES.reduce((s, u) => s + u.clubs.length, 0)

  return (
    <div className="mb-8">
      {/* 섹션 헤더 */}
      <div className="flex items-baseline justify-between mb-4">
        <span className="text-lg font-bold text-[#262626] dark:text-white">캠퍼스 맵</span>
        <span className="text-[13px] text-[#8E8E8E]">
          {drillUni ? `${drillUni.name} 소속 클럽` : `${activeCount}개 대학, ${clubCount}개 클럽이 활동 중`}
        </span>
      </div>

      {/* 캠퍼스 맵 컨테이너 */}
      <div className="rounded-[20px] overflow-hidden border border-[#E5E5E5] dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E]">
        {/* 브레드크럼 */}
        <div className="flex items-center gap-1.5 px-5 py-3.5 text-[13px] font-semibold text-[#555] border-b border-[#F0F0F0] dark:border-[#2C2C2E]">
          <span
            onClick={handleBack}
            className={`transition-colors ${drillUni ? 'cursor-pointer hover:text-[#262626] dark:hover:text-white' : 'text-[#262626] dark:text-white cursor-default'}`}
          >
            전체 대학
          </span>
          {drillUni && (
            <>
              <span className="text-[#D1D5DB] text-[11px]">›</span>
              <span className="text-[#262626] dark:text-white cursor-default">{drillUni.name}</span>
            </>
          )}
        </div>

        <div ref={contentRef} style={lockedHeight ? { minHeight: lockedHeight } : undefined}>
          {/* Level: 전체 대학 그리드 */}
          {!drillUni && (
            <div className="grid grid-cols-2 sm:grid-cols-4">
              {UNIVERSITIES.map(uni => (
                <UniNode
                  key={uni.id}
                  uni={uni}
                  weeklyCounts={uni.active ? weeklyCounts : emptyCounts}
                  onClick={() => handleDrill(uni)}
                />
              ))}
            </div>
          )}

          {/* Level: 대학 상세 (클럽 목록) */}
          {drillUni && (
            <div>
              <UniDetailHeader uni={drillUni} />
              {drillUni.clubs.length > 0 ? (
                <div className="flex flex-col">
                  {drillUni.clubs.map(club => (
                    <ClubRow key={club.name} club={club} />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-[13px] text-[#8E8E8E]">
                  등록된 클럽이 없습니다
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
