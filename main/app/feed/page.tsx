import { createClient as createAnonClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { Sparkles, FileText, ArrowRight, Building2 } from 'lucide-react'
import { UPDATE_TYPE_CONFIG } from '@/components/project/types'
import { APP_URL } from '@/src/constants'

export const revalidate = 300 // 5분 ISR — 공개 피드는 캐시하면서도 신선함 유지

/**
 * /feed — 공개 클럽 활동 피드.
 *
 * 바이럴 루프: 비로그인 방문자 → 다양한 클럽 활동 → 클럽 디렉토리 → 가입 유입.
 * SEO: 각 업데이트 스니펫이 검색 엔진에 노출되어 long-tail 유입.
 *
 * 보안:
 *   - visibility='public' 클럽 only
 *   - show_updates=true 프로젝트 only
 *   - anon client 사용 — RLS 존중
 */

interface FeedItem {
  update_id: string
  week_number: number
  title: string
  content: string
  update_type: string
  created_at: string | null
  opportunity: {
    id: string
    title: string
    type: string | null
  }
  club: {
    slug: string
    name: string
    logo_url: string | null
    category: string | null
  } | null
}

async function fetchFeedItems(filter: { category?: string }): Promise<{ items: FeedItem[]; categories: string[] }> {
  const supabase = createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { data: opps } = await supabase
    .from('opportunities')
    .select('id, title, type, club_id, show_updates')
    .eq('show_updates', true)
    .eq('status', 'active')
    .not('club_id', 'is', null)
    .limit(200)

  const oppIds = (opps ?? []).map(o => o.id)
  if (oppIds.length === 0) return { items: [], categories: [] }

  const clubIds = Array.from(new Set((opps ?? []).map(o => o.club_id).filter((v): v is string => !!v)))
  let clubsQuery = supabase
    .from('clubs')
    .select('id, slug, name, logo_url, category, visibility')
    .in('id', clubIds)
    .eq('visibility', 'public')

  if (filter.category) clubsQuery = clubsQuery.eq('category', filter.category)

  const { data: clubs } = clubIds.length > 0
    ? await clubsQuery
    : { data: [] as Array<{ id: string; slug: string; name: string; logo_url: string | null; category: string | null; visibility: string }> }

  // 카테고리 목록 집계 — 필터 미적용 상태에서 쿼리
  const { data: allClubs } = clubIds.length > 0
    ? await supabase
        .from('clubs')
        .select('category, visibility')
        .in('id', clubIds)
        .eq('visibility', 'public')
    : { data: [] as Array<{ category: string | null; visibility: string }> }
  const categories = Array.from(new Set((allClubs ?? [])
    .map(c => c.category)
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
  )).sort((a, b) => a.localeCompare(b, 'ko'))

  const publicClubIds = new Set((clubs ?? []).map(c => c.id))
  const publicOpps = (opps ?? []).filter(o => o.club_id && publicClubIds.has(o.club_id))
  const publicOppIds = publicOpps.map(o => o.id)

  if (publicOppIds.length === 0) return { items: [], categories }

  const { data: updates } = await supabase
    .from('project_updates')
    .select('id, opportunity_id, week_number, title, content, update_type, created_at')
    .in('opportunity_id', publicOppIds)
    .order('created_at', { ascending: false })
    .limit(40)

  const clubById = new Map((clubs ?? []).map(c => [c.id, c]))
  const oppById = new Map(publicOpps.map(o => [o.id, o]))

  const items: FeedItem[] = (updates ?? []).filter(u => oppById.has(u.opportunity_id)).map(u => {
    const opp = oppById.get(u.opportunity_id)!
    const club = opp?.club_id ? clubById.get(opp.club_id) ?? null : null
    return {
      update_id: u.id,
      week_number: u.week_number,
      title: u.title,
      content: u.content,
      update_type: u.update_type,
      created_at: u.created_at,
      opportunity: { id: opp.id, title: opp.title, type: opp.type },
      club: club ? { slug: club.slug, name: club.name, logo_url: club.logo_url, category: club.category } : null,
    }
  })

  return { items, categories }
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1) return '방금'
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

/**
 * 업데이트를 시간 버킷별로 그룹핑. 주단위 경계 기준.
 * 버킷: 이번 주(7일 이내), 지난 주(7~14일), 이달(14~30일), 더 이전(30일+).
 */
type TimeBucket = 'this-week' | 'last-week' | 'this-month' | 'older'

function bucketOf(dateStr: string | null): TimeBucket {
  if (!dateStr) return 'older'
  const days = (Date.now() - new Date(dateStr).getTime()) / 86_400_000
  if (days <= 7) return 'this-week'
  if (days <= 14) return 'last-week'
  if (days <= 30) return 'this-month'
  return 'older'
}

const BUCKET_LABEL: Record<TimeBucket, string> = {
  'this-week': '이번 주',
  'last-week': '지난 주',
  'this-month': '이번 달',
  'older': '더 이전',
}

const BUCKET_ORDER: TimeBucket[] = ['this-week', 'last-week', 'this-month', 'older']

function groupByBucket(items: FeedItem[]): Array<{ bucket: TimeBucket; items: FeedItem[] }> {
  const map = new Map<TimeBucket, FeedItem[]>()
  for (const b of BUCKET_ORDER) map.set(b, [])
  for (const item of items) {
    map.get(bucketOf(item.created_at))!.push(item)
  }
  return BUCKET_ORDER
    .map(b => ({ bucket: b, items: map.get(b)! }))
    .filter(g => g.items.length > 0)
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string }>
}) {
  const params = (await searchParams) ?? {}
  const cat = params.category?.trim()
  const title = cat ? `${cat} 클럽 활동 피드 · Draft` : '클럽 활동 피드 · Draft'
  const description = cat
    ? `${cat} 카테고리 대학 창업동아리·학회·프로젝트 그룹의 최신 주간 활동`
    : '대학 창업동아리·학회·프로젝트 그룹의 최신 주간 활동을 한곳에서 확인하세요'
  const url = cat
    ? `${APP_URL}/feed?category=${encodeURIComponent(cat)}`
    : `${APP_URL}/feed`

  return {
    title,
    description,
    // SEO: 카테고리 필터된 URL 도 각자 canonical 로 → 각 카테고리 페이지가 독립 색인
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: 'website' as const,
    },
    twitter: { card: 'summary_large_image' as const, title, description },
  }
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string }>
}) {
  const params = (await searchParams) ?? {}
  const activeCategory = params.category?.trim() || undefined
  const { items, categories } = await fetchFeedItems({ category: activeCategory })

  // 상단 stats — SEO·첫인상·정보 밀도. 중복 제거로 실 숫자.
  const uniqueClubs = new Set(items.map(i => i.club?.slug).filter(Boolean)).size
  const uniqueProjects = new Set(items.map(i => i.opportunity.id)).size
  const thisWeekCount = items.filter(i => bucketOf(i.created_at) === 'this-week').length

  const groups = groupByBucket(items)

  return (
    <div className="min-h-screen bg-surface-bg">
      <div className="max-w-[780px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        <header className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-brand" />
            <p className="text-[12px] font-semibold text-brand">공개 활동 피드</p>
          </div>
          <h1 className="text-[28px] sm:text-[32px] font-bold text-txt-primary tracking-tight">
            {activeCategory ? `${activeCategory} 클럽들의 기록` : '클럽들의 이번 주'}
          </h1>
          <p className="text-[14px] text-txt-secondary mt-1.5">
            공개된 창업동아리·학회·프로젝트 그룹의 최신 주간 기록입니다
          </p>
        </header>

        {/* Stats strip — 정보 밀도 + SEO 시그널 */}
        {items.length > 0 && (
          <div className="flex items-center gap-4 mb-6 px-4 py-3 bg-surface-card border border-border rounded-2xl text-[13px]">
            <div>
              <span className="text-txt-tertiary">이번 주 </span>
              <span className="font-bold text-txt-primary tabular-nums">{thisWeekCount}</span>
              <span className="text-txt-tertiary">건</span>
            </div>
            <span className="text-border">·</span>
            <div>
              <span className="text-txt-tertiary">클럽 </span>
              <span className="font-bold text-txt-primary tabular-nums">{uniqueClubs}</span>
              <span className="text-txt-tertiary">개</span>
            </div>
            <span className="text-border">·</span>
            <div>
              <span className="text-txt-tertiary">프로젝트 </span>
              <span className="font-bold text-txt-primary tabular-nums">{uniqueProjects}</span>
              <span className="text-txt-tertiary">개</span>
            </div>
          </div>
        )}

        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto mb-6 pb-1" style={{ scrollbarWidth: 'none' }}>
            <Link
              href="/feed"
              className={`shrink-0 px-3.5 py-1.5 text-[13px] font-medium rounded-full border transition-colors ${
                !activeCategory
                  ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                  : 'text-txt-secondary border-border bg-surface-card hover:border-txt-tertiary'
              }`}
            >
              전체
            </Link>
            {categories.map(c => (
              <Link
                key={c}
                href={`/feed?category=${encodeURIComponent(c)}`}
                className={`shrink-0 px-3.5 py-1.5 text-[13px] font-medium rounded-full border transition-colors ${
                  activeCategory === c
                    ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                    : 'text-txt-secondary border-border bg-surface-card hover:border-txt-tertiary'
                }`}
              >
                {c}
              </Link>
            ))}
          </div>
        )}

        {items.length === 0 ? (
          <div className="bg-surface-card border border-border rounded-2xl p-10 sm:p-12">
            <div className="max-w-md mx-auto text-center">
              <FileText size={28} className="text-txt-disabled mx-auto mb-4" />
              {activeCategory ? (
                <>
                  <p className="text-[15px] font-semibold text-txt-primary mb-2">
                    <span className="text-brand">{activeCategory}</span> 카테고리에 공개된 기록이 아직 없습니다
                  </p>
                  <p className="text-[13px] text-txt-tertiary mb-5 leading-relaxed">
                    이 카테고리의 프로젝트가 <code className="text-[11px] px-1 py-0.5 rounded bg-surface-sunken font-mono">공개 업데이트</code>를
                    활성화하면 여기에 표시됩니다. 다른 카테고리를 둘러보시거나 전체 피드로 이동해 보세요.
                  </p>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <Link
                      href="/feed"
                      className="inline-flex items-center gap-1 px-4 py-2 text-[13px] font-semibold bg-surface-inverse text-txt-inverse rounded-full hover:opacity-90 transition-opacity"
                    >
                      전체 피드로 돌아가기
                    </Link>
                    <Link
                      href="/explore"
                      className="inline-flex items-center gap-1 px-4 py-2 text-[13px] font-semibold text-txt-primary border border-border rounded-full hover:border-txt-tertiary transition-colors"
                    >
                      프로젝트 탐색
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[15px] font-semibold text-txt-primary mb-2">
                    공개된 주간 기록이 아직 없습니다
                  </p>
                  <p className="text-[13px] text-txt-tertiary mb-5 leading-relaxed">
                    이 페이지는 클럽이 <code className="text-[12px] px-1 py-0.5 rounded bg-surface-sunken font-mono">공개 업데이트</code>를 켠 프로젝트의 주간 기록만 모읍니다.
                    Draft 의 기본값은 비공개 운영이며, 대부분 클럽은 외부에 공개하지 않습니다.
                  </p>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <Link
                      href="/explore?tab=clubs"
                      className="inline-flex items-center gap-1 px-4 py-2 text-[13px] font-semibold bg-surface-inverse text-txt-inverse rounded-full hover:opacity-90 transition-opacity"
                    >
                      클럽 둘러보기
                    </Link>
                    <Link
                      href="/clubs/new"
                      className="inline-flex items-center gap-1 px-4 py-2 text-[13px] font-semibold text-txt-primary border border-border rounded-full hover:border-txt-tertiary transition-colors"
                    >
                      내 클럽 만들기
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
          {groups.map(group => (
          <section key={group.bucket}>
            <h2 className="text-[11px] font-bold text-txt-tertiary uppercase tracking-wider mb-3 sticky top-0 bg-surface-bg/80 backdrop-blur-xs py-1 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 z-1">
              {BUCKET_LABEL[group.bucket]}
              <span className="ml-2 text-txt-disabled normal-case tracking-normal font-medium">
                {group.items.length}건
              </span>
            </h2>
          <ul className="space-y-3">
            {group.items.map(item => {
              const cfg = UPDATE_TYPE_CONFIG[item.update_type] ?? UPDATE_TYPE_CONFIG.general
              const [firstLine, ...rest] = item.content.split('\n')
              return (
                <li key={item.update_id}>
                  <Link
                    href={`/p/${item.opportunity.id}`}
                    className="block bg-surface-card border border-border rounded-2xl p-5 ob-ring-glow group no-underline"
                  >
                    {/* Club chip */}
                    {item.club && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg bg-brand-bg flex items-center justify-center text-[11px] font-bold text-brand shrink-0">
                          {item.club.name[0]}
                        </div>
                        <Link
                          href={`/clubs/${item.club.slug}`}
                          onClick={e => e.stopPropagation()}
                          className="text-[12px] font-semibold text-txt-primary hover:text-brand transition-colors"
                        >
                          {item.club.name}
                        </Link>
                        {item.club.category && (
                          <span className="text-[10px] font-medium text-brand bg-brand-bg px-1.5 py-0.5 rounded-full">
                            {item.club.category}
                          </span>
                        )}
                        <span className="text-[11px] text-txt-tertiary ml-auto">
                          {timeAgo(item.created_at)}
                        </span>
                      </div>
                    )}

                    {/* Project title */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 border rounded-full ${cfg.badgeColor}`}>
                        {cfg.label}
                      </span>
                      <span className="text-[11px] text-txt-tertiary">{item.week_number}주차</span>
                      <span className="text-[11px] text-txt-tertiary">·</span>
                      <span className="text-[13px] font-bold text-txt-secondary">{item.opportunity.title}</span>
                    </div>

                    <h3 className="text-[15px] font-bold text-txt-primary mb-1">{item.title}</h3>
                    <p className="text-[13px] text-txt-secondary line-clamp-3 whitespace-pre-line leading-relaxed">
                      {firstLine}
                      {rest.length > 0 && ' …'}
                    </p>

                    <div className="flex items-center gap-1 mt-3 text-[12px] font-semibold text-brand group-hover:gap-2 transition-all">
                      전체 보기
                      <ArrowRight size={12} />
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
          </section>
          ))}
          </div>
        )}

        <div className="mt-10 bg-linear-to-br from-brand to-brand/80 text-white rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
            <Building2 size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold">우리 동아리 기록도 이렇게 남기고 싶다면</p>
            <p className="text-[12px] opacity-90 mt-0.5">
              Draft에서 3분이면 클럽 운영 준비가 끝납니다
            </p>
          </div>
          <Link
            href="/clubs/new"
            className="shrink-0 px-4 py-2 text-[13px] font-semibold bg-white text-brand rounded-full hover:opacity-90 transition-opacity"
          >
            클럽 만들기
          </Link>
        </div>
      </div>
    </div>
  )
}
