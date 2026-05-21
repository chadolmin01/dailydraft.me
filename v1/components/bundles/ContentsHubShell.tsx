'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft,
  CalendarRange,
  FolderOpen,
  Lightbulb,
  Repeat,
  TrendingUp,
  Plus,
  type LucideIcon,
} from 'lucide-react'
import { useClub } from '@/src/hooks/useClub'
import { usePersonaByOwner } from '@/src/hooks/usePersona'
import { AutomationsShell } from './AutomationsShell'
import { DeckListShell } from './DeckListShell'
import { ContentPlanningShell } from './ContentPlanningShell'
import { AutomationSettingsShell } from './AutomationSettingsShell'
import { AnalyticsShell } from './AnalyticsShell'

interface Props {
  slug: string
}

type TabKey = 'calendar' | 'decks' | 'planning' | 'automations' | 'analytics'

interface TabDef {
  key: TabKey
  label: string
  icon: LucideIcon
  action?: {
    label: string
    href: (slug: string) => string
  }
  /**
   * 탭 호버 시 미리 fetch할 쿼리. 실제 fetch 트리거는 queryClient.prefetchQuery.
   * fn은 personaId를 받아 key와 url 반환. personaId 없으면 prefetch 스킵.
   */
  prefetch?: (personaId: string) => { queryKey: readonly unknown[]; url: string }
}

const TABS: TabDef[] = [
  {
    key: 'calendar',
    label: '캘린더',
    icon: CalendarRange,
    action: {
      label: '새 예약',
      href: (slug) => `/clubs/${slug}/bundles/new?schedule=1`,
    },
    // 캘린더는 현재 월 기준 range가 필요 — 호버 prefetch는 생략 (동적 range)
  },
  {
    key: 'decks',
    label: '내 덱',
    icon: FolderOpen,
    action: {
      label: '새 덱',
      href: (slug) => `/clubs/${slug}/bundles/new`,
    },
    prefetch: (personaId) => ({
      queryKey: ['persona-bundles', personaId],
      url: `/api/personas/${personaId}/bundles?limit=50`,
    }),
  },
  {
    key: 'planning',
    label: '기획',
    icon: Lightbulb,
    prefetch: (personaId) => ({
      queryKey: ['idea-cards', personaId],
      url: `/api/personas/${personaId}/idea-cards`,
    }),
  },
  {
    key: 'automations',
    label: '자동화',
    icon: Repeat,
    prefetch: (personaId) => ({
      queryKey: ['persona-automations', personaId],
      url: `/api/personas/${personaId}/automations`,
    }),
  },
  {
    key: 'analytics',
    label: '성과',
    icon: TrendingUp,
    prefetch: (personaId) => ({
      queryKey: ['persona-analytics', personaId, 30],
      url: `/api/personas/${personaId}/analytics?days=30`,
    }),
  },
]

const VALID_TABS = new Set<TabKey>(TABS.map((t) => t.key))

/**
 * 콘텐츠 스튜디오 허브.
 *
 * 성능 설계:
 *   - B: 탭 버튼 호버 → queryClient.prefetchQuery로 해당 탭 주요 쿼리 예열
 *   - D: 한번 방문한 탭은 언마운트하지 않고 CSS hidden으로 유지
 *        첫 방문에만 fetch, 재방문은 즉시 렌더. 아직 안 가본 탭은 미탑재(초기 부담 없음).
 *   - E: 각 훅에 staleTime + placeholderData 설정되어 있어 로딩 스피너 대신 이전 값 유지
 */
export function ContentsHubShell({ slug }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const qc = useQueryClient()

  const rawTab = searchParams.get('tab') ?? 'calendar'
  const tab: TabKey = (VALID_TABS.has(rawTab as TabKey)
    ? rawTab
    : 'calendar') as TabKey
  const active = useMemo(
    () => TABS.find((t) => t.key === tab) ?? TABS[0]!,
    [tab],
  )

  const { data: club } = useClub(slug)
  const { data: personaData } = usePersonaByOwner('club', club?.id)
  const personaId = personaData?.persona?.id
  const isAdmin = club?.my_role === 'owner' || club?.my_role === 'admin'

  // D: 방문한 탭 추적 — 한번 들어갔으면 계속 마운트 유지
  const [visitedTabs, setVisitedTabs] = useState<Set<TabKey>>(
    () => new Set([tab]),
  )
  useEffect(() => {
    setVisitedTabs((prev) => {
      if (prev.has(tab)) return prev
      const next = new Set(prev)
      next.add(tab)
      return next
    })
  }, [tab])

  const switchTab = useCallback(
    (next: TabKey) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', next)
      router.replace(`/clubs/${slug}/contents?${params.toString()}`, {
        scroll: false,
      })
    },
    [router, searchParams, slug],
  )

  // B: 탭 버튼 호버 시 다음 탭의 쿼리를 미리 예열
  const handleTabHover = useCallback(
    (def: TabDef) => {
      if (!personaId || !def.prefetch) return
      const { queryKey, url } = def.prefetch(personaId)
      qc.prefetchQuery({
        queryKey,
        queryFn: async () => {
          const res = await fetch(url)
          if (!res.ok) throw new Error('prefetch fail')
          return res.json()
        },
        staleTime: 1000 * 30,
      })
    },
    [personaId, qc],
  )

  return (
    <>
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-5">
        <Link
          href={`/clubs/${slug}`}
          prefetch
          className="text-txt-tertiary hover:text-txt-primary transition-colors shrink-0"
          aria-label="뒤로"
        >
          <ChevronLeft size={20} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-txt-primary">콘텐츠 스튜디오</h1>
          <p className="text-xs text-txt-tertiary leading-relaxed">
            {club?.name ?? '우리 동아리'}의 콘텐츠를 한 곳에서 관리합니다
          </p>
        </div>
        {isAdmin && active.action && (
          <Link
            href={active.action.href(slug)}
            prefetch
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors shrink-0"
          >
            <Plus size={14} />
            {active.action.label}
          </Link>
        )}
      </div>

      {/* Pill 탭바 */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4" role="tablist">
        {TABS.map((t) => {
          const Icon = t.icon
          const isActive = t.key === tab
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => switchTab(t.key)}
              onMouseEnter={() => handleTabHover(t)}
              onFocus={() => handleTabHover(t)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-txt-primary text-surface-card'
                  : 'bg-surface-card text-txt-secondary border border-border hover:bg-surface-bg'
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* 내용 — 방문한 탭은 언마운트하지 않고 hidden 유지 */}
      <div role="tabpanel">
        {visitedTabs.has('calendar') && (
          <div hidden={tab !== 'calendar'}>
            <AutomationsShell slug={slug} embedded />
          </div>
        )}
        {visitedTabs.has('decks') && (
          <div hidden={tab !== 'decks'}>
            <DeckListShell slug={slug} embedded />
          </div>
        )}
        {visitedTabs.has('planning') && (
          <div hidden={tab !== 'planning'}>
            <ContentPlanningShell slug={slug} embedded />
          </div>
        )}
        {visitedTabs.has('automations') && (
          <div hidden={tab !== 'automations'}>
            <AutomationSettingsShell slug={slug} embedded />
          </div>
        )}
        {visitedTabs.has('analytics') && (
          <div hidden={tab !== 'analytics'}>
            <AnalyticsShell slug={slug} embedded />
          </div>
        )}
      </div>
    </>
  )
}
