'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  Sparkles,
  Globe,
  Archive,
  Trash2,
  ArrowRight,
  Lightbulb,
} from 'lucide-react'
import { toast } from 'sonner'
import { useClub } from '@/src/hooks/useClub'
import { usePersonaByOwner } from '@/src/hooks/usePersona'
import {
  useIdeaCards,
  useGenerateIdeaCards,
  useUpdateIdeaCard,
  useDeleteIdeaCard,
  type IdeaCardRow,
  type IdeaCardStatus,
  type IdeaSource,
} from '@/src/hooks/useIdeaCards'

interface Props {
  slug: string
  embedded?: boolean
}

const SOURCE_CONFIG: Record<
  IdeaSource,
  { label: string; short: string; hint: string; icon: typeof Sparkles }
> = {
  self: {
    label: '자체 창작',
    short: '창작',
    hint: '페르소나 톤 기반',
    icon: Sparkles,
  },
  internet: {
    label: '트렌드 반영',
    short: '트렌드',
    hint: '요즘 이슈 반영 (준비 중)',
    icon: Globe,
  },
  internal: {
    label: '내부 자료',
    short: '내부',
    hint: 'Discord·활동 기록 기반',
    icon: Archive,
  },
}

const COUNT_OPTIONS = [5, 10, 15]

const KOREAN_MONTH_HINTS: Record<number, string> = {
  0: '방학 회고·신학기 준비 콘텐츠가 효과적입니다',
  1: '신학기 모집·오리엔테이션 공지가 피크 시기입니다',
  2: '신입 환영·1학기 시작 공지가 많이 쓰입니다',
  3: '초기 프로젝트 킥오프·중간 점검 콘텐츠가 유효합니다',
  4: '중간 성과·멤버 인터뷰 중심 콘텐츠가 반응이 좋습니다',
  5: '1학기 마무리·쇼케이스 홍보가 중심입니다',
  6: '방학 기간 활동·컨퍼런스 참여 후기가 효과적입니다',
  7: '하반기 프로젝트 예고·여름 성과 모음을 씁니다',
  8: '2학기 모집·복귀 인사 콘텐츠 시기입니다',
  9: '중간 점검·미드쇼케이스가 피크입니다',
  10: '후원·스폰서 아웃리치 콘텐츠가 효과적입니다',
  11: '연말 회고·학기 마감 쇼케이스가 중심입니다',
}

/**
 * 콘텐츠 대량 기획 칸반 (mirra 020626 패턴).
 *
 * 상단: 소스 3종 선택 + 개수 + 추천받기 버튼
 * 하단: 3컬럼 칸반 (pending → drafted → used)
 *
 * 카드 클릭 → 해당 아이디어로 /bundles/new?idea_card_id=... 프리필 생성
 *   (NewBundleShell이 idea_card_id 쿼리 파라미터 있으면 title/event_type 프리필)
 */
export function ContentPlanningShell({ slug, embedded = false }: Props) {
  const router = useRouter()
  const { data: club } = useClub(slug)
  const { data: personaData } = usePersonaByOwner('club', club?.id)
  const persona = personaData?.persona
  const isAdmin = club?.my_role === 'owner' || club?.my_role === 'admin'

  const { data, isLoading } = useIdeaCards(persona?.id)
  const generate = useGenerateIdeaCards(persona?.id)
  const update = useUpdateIdeaCard(persona?.id)
  const del = useDeleteIdeaCard(persona?.id)

  const [source, setSource] = useState<IdeaSource>('self')
  const [count, setCount] = useState(10)

  const grouped = useMemo(() => {
    const g: Record<IdeaCardStatus, IdeaCardRow[]> = {
      pending: [],
      drafted: [],
      used: [],
      dismissed: [],
    }
    for (const c of data?.cards ?? []) g[c.status]?.push(c)
    return g
  }, [data])

  const handleGenerate = () => {
    generate.mutate({ source, count })
  }

  const handleUseCard = (card: IdeaCardRow) => {
    // NewBundleShell이 받는 쿼리 파라미터로 이동 — 현 단계에선 단순 프리필 없이 pick-event부터
    // idea_card_id 를 넘겨 NewBundleShell 쪽에서 처리 예정. 현재는 단순 href.
    router.push(
      `/clubs/${slug}/bundles/new?idea_card_id=${card.id}&event_type=${encodeURIComponent(card.event_type_hint)}`,
    )
  }

  return (
    <>
      {!embedded && (
        <div className="flex items-start gap-3 mb-4">
          <Link
            href={`/clubs/${slug}`}
            className="text-txt-tertiary hover:text-txt-primary transition-colors shrink-0 mt-1"
            aria-label="뒤로"
          >
            <ChevronLeft size={20} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-txt-primary">콘텐츠 대량 기획</h1>
            <p className="text-xs text-txt-tertiary leading-relaxed">
              {club?.name ?? '우리 동아리'}의 브랜드 톤에 맞춰 AI가 글감 아이디어를 일괄로 제안합니다. 마음에 드는 아이디어만 골라 실제 덱으로 만드십시오.
            </p>
          </div>
        </div>
      )}

      {!persona ? (
        <EmptyBlock hint="페르소나가 먼저 필요합니다." />
      ) : (
        <>
          {/* 상단 컴팩트 제너레이터 — 한 줄 바 */}
          {isAdmin && (
            <section className="bg-surface-card border border-border rounded-2xl p-3 mb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-txt-primary px-1">
                  AI 글감 제안
                </span>

                {/* 소스 pill segmented */}
                <div className="inline-flex items-center gap-0.5 bg-surface-bg border border-border rounded-lg p-0.5">
                  {(Object.keys(SOURCE_CONFIG) as IdeaSource[]).map((s) => {
                    const cfg = SOURCE_CONFIG[s]
                    const Icon = cfg.icon
                    const active = source === s
                    return (
                      <button
                        key={s}
                        onClick={() => setSource(s)}
                        title={cfg.hint}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                          active
                            ? 'bg-txt-primary text-surface-card'
                            : 'text-txt-secondary hover:text-txt-primary'
                        }`}
                      >
                        <Icon size={11} />
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>

                {/* 개수 — 숫자만 pill */}
                <div className="inline-flex items-center gap-0.5 bg-surface-bg border border-border rounded-lg p-0.5">
                  {COUNT_OPTIONS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setCount(n)}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-semibold tabular-nums transition-colors ${
                        count === n
                          ? 'bg-txt-primary text-surface-card'
                          : 'text-txt-secondary hover:text-txt-primary'
                      }`}
                    >
                      {n}개
                    </button>
                  ))}
                </div>

                {/* 생성 버튼 — 오른쪽 정렬 */}
                <button
                  onClick={handleGenerate}
                  disabled={generate.isPending}
                  className="ml-auto inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors disabled:opacity-60"
                >
                  <Sparkles size={12} />
                  {generate.isPending ? '기획 중...' : `${count}개 받기`}
                </button>
              </div>
            </section>
          )}

          {/* 인사이트 카드 — 시즌 팁 + 사용률 */}
          <div className="grid md:grid-cols-2 gap-3 mb-4">
            <SeasonTipCard />
            <UsageStatsCard
              pending={grouped.pending.length}
              drafted={grouped.drafted.length}
              used={grouped.used.length}
            />
          </div>

          {/* 3컬럼 칸반 */}
          {isLoading ? (
            <div className="grid md:grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-96 rounded-2xl skeleton-shimmer" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-3">
              <KanbanColumn
                title="작성 대기"
                tone="pending"
                count={grouped.pending.length}
                cards={grouped.pending}
                onUse={handleUseCard}
                onDismiss={(id) =>
                  update.mutate(
                    { id, patch: { status: 'dismissed' } },
                    { onSuccess: () => toast.success('아이디어를 제외했습니다') },
                  )
                }
                onDelete={(id) => del.mutate(id)}
                canEdit={isAdmin}
              />
              <KanbanColumn
                title="초안 생성"
                tone="drafted"
                count={grouped.drafted.length}
                cards={grouped.drafted}
                slug={slug}
                canEdit={false}
              />
              <KanbanColumn
                title="발행 완료"
                tone="used"
                count={grouped.used.length}
                cards={grouped.used}
                slug={slug}
                canEdit={false}
              />
            </div>
          )}
        </>
      )}
    </>
  )
}

// ============================================================
// Column — Draft 플랫 리스트 (tinted bg·두꺼운 border 제거)
// ============================================================
const COLUMN_DOTS: Record<'pending' | 'drafted' | 'used', string> = {
  pending: 'bg-txt-tertiary',
  drafted: 'bg-brand',
  used: 'bg-status-success-text',
}

function KanbanColumn({
  title,
  tone,
  count,
  cards,
  slug,
  onUse,
  onDismiss,
  onDelete,
  canEdit,
}: {
  title: string
  tone: 'pending' | 'drafted' | 'used'
  count: number
  cards: IdeaCardRow[]
  slug?: string
  onUse?: (card: IdeaCardRow) => void
  onDismiss?: (id: string) => void
  onDelete?: (id: string) => void
  canEdit: boolean
}) {
  const dot = COLUMN_DOTS[tone]
  return (
    <section className="min-h-[300px]">
      {/* 컬럼 헤더 — 배경 없음, dot + 제목 + 개수만 */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        <h3 className="text-xs font-bold text-txt-primary">{title}</h3>
        <span className="text-[11px] font-semibold text-txt-tertiary tabular-nums">
          {count}
        </span>
      </div>
      {cards.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl py-8 px-4 text-center">
          <p className="text-[11px] text-txt-tertiary leading-relaxed">
            {tone === 'pending'
              ? 'AI 제안을 받으시면 여기에 쌓입니다'
              : tone === 'drafted'
                ? '카드에서 덱을 만드시면 여기로 옮겨집니다'
                : '초안이 발행되면 여기로 옮겨집니다'}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {cards.map((c) => (
            <li key={c.id}>
              <KanbanCard
                card={c}
                slug={slug}
                onUse={onUse}
                onDismiss={onDismiss}
                onDelete={onDelete}
                canEdit={canEdit}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function KanbanCard({
  card,
  slug,
  onUse,
  onDismiss,
  onDelete,
  canEdit,
}: {
  card: IdeaCardRow
  slug?: string
  onUse?: (card: IdeaCardRow) => void
  onDismiss?: (id: string) => void
  onDelete?: (id: string) => void
  canEdit: boolean
}) {
  const sourceCfg = SOURCE_CONFIG[card.source]
  const SrcIcon = sourceCfg.icon

  return (
    <article className="bg-surface-card border border-border rounded-xl p-3 hover:border-brand-border transition-colors">
      <h4 className="text-[13px] font-bold text-txt-primary mb-1 line-clamp-2 leading-snug">
        {card.title}
      </h4>
      <p className="text-[11px] text-txt-secondary leading-relaxed line-clamp-2 mb-2">
        {card.description}
      </p>
      <div className="flex items-center gap-2 text-[10px] text-txt-tertiary mb-2">
        <span className="inline-flex items-center gap-1">
          <SrcIcon size={10} />
          {sourceCfg.short}
        </span>
        <span className="w-0.5 h-0.5 rounded-full bg-txt-tertiary" />
        <span>{card.event_type_hint}</span>
      </div>

      <div className="flex items-center justify-between gap-2">
        {card.status === 'pending' && onUse && canEdit && (
          <>
            <button
              onClick={() => onUse(card)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"
            >
              이 주제로 덱 만들기
              <ArrowRight size={11} />
            </button>
            <div className="flex items-center gap-1">
              {onDismiss && (
                <button
                  onClick={() => onDismiss(card.id)}
                  className="text-[10px] font-semibold text-txt-tertiary hover:text-txt-primary transition-colors"
                  title="이 아이디어 숨기기"
                >
                  제외
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(card.id)}
                  className="text-txt-tertiary hover:text-status-danger-text transition-colors"
                  aria-label="삭제"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          </>
        )}
        {card.status !== 'pending' && card.bundle_id && slug && (
          <Link
            href={`/clubs/${slug}/bundles/${card.bundle_id}`}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"
          >
            덱 열기
            <ArrowRight size={11} />
          </Link>
        )}
      </div>
    </article>
  )
}

// ============================================================
// Empty
// ============================================================
// ============================================================
// Insight cards
// ============================================================
function SeasonTipCard() {
  const now = new Date()
  const monthIdx = now.getMonth()
  const hint = KOREAN_MONTH_HINTS[monthIdx] ?? '이번 달의 공식 힌트가 준비 중입니다'
  const monthLabel = `${monthIdx + 1}월`

  return (
    <article className="bg-surface-card border border-border rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
          <Lightbulb size={16} className="text-amber-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-txt-tertiary mb-0.5">
            {monthLabel} 시즌 팁
          </p>
          <p className="text-xs text-txt-primary leading-relaxed">{hint}</p>
        </div>
      </div>
    </article>
  )
}

function UsageStatsCard({
  pending,
  drafted,
  used,
}: {
  pending: number
  drafted: number
  used: number
}) {
  const total = pending + drafted + used
  const activationRate =
    total > 0 ? Math.round(((drafted + used) / total) * 100) : 0

  return (
    <article className="bg-surface-card border border-border rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand-bg flex items-center justify-center shrink-0">
          <Sparkles size={16} className="text-brand" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-txt-tertiary mb-0.5">
            제안 활용률
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-txt-primary tabular-nums">
              {activationRate}%
            </span>
            <span className="text-[11px] text-txt-tertiary tabular-nums">
              ({drafted + used}/{total})
            </span>
          </div>
          <p className="text-[11px] text-txt-tertiary leading-relaxed mt-0.5">
            {total === 0
              ? 'AI 제안을 받으시면 여기서 사용률이 집계됩니다'
              : activationRate >= 60
                ? '높은 활용률입니다. 제안 품질이 잘 맞고 있습니다'
                : activationRate >= 30
                  ? '적당한 활용률입니다. 소스 다양화를 시도해보십시오'
                  : '대부분 미사용입니다. 페르소나 톤이나 소스를 조정해보십시오'}
          </p>
        </div>
      </div>
    </article>
  )
}

function EmptyBlock({ hint }: { hint: string }) {
  return (
    <div className="bg-surface-card border border-dashed border-border rounded-2xl p-10 text-center">
      <div className="w-11 h-11 mx-auto rounded-2xl bg-brand-bg flex items-center justify-center mb-3">
        <Lightbulb size={18} className="text-brand" />
      </div>
      <p className="text-sm font-bold text-txt-primary mb-1">아직 준비되지 않았습니다</p>
      <p className="text-xs text-txt-tertiary leading-relaxed max-w-sm mx-auto">
        {hint}
      </p>
    </div>
  )
}
