'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'

interface Props {
  personaId: string
  personaName: string
}

interface AnalyticsResponse {
  summary: {
    total_published: number
    by_channel: Record<string, number>
    period_days: number
  }
  hour_hist: number[]
  weekday_hist: number[]
  daily: Array<{ date: string; count: number }>
  recent: Array<{
    id: string
    bundle_id: string | null
    channel_format: string
    published_at: string
    destination: string | null
    content_preview: string
  }>
}

/**
 * 페르소나 활동 요약 패널 (대시보드 상단).
 *
 * 최근 30일 데이터 기준:
 *   - 생성 수 (=published) + 이전 30일 대비 변화
 *   - 절약 시간 (콘텐츠당 ~10분 기준 추정)
 *   - 발행 채널 분포
 *   - 최근 편집 시점
 *
 * 편집률·정확도 점수는 R3.4+ 에서 외부 플랫폼 지표 연동 후 추가.
 * 지금은 "있는 데이터만" 진솔하게 노출.
 */
export function PersonaActivityPanel({ personaId, personaName }: Props) {
  const { data, isLoading } = useQuery<AnalyticsResponse>({
    queryKey: ['persona-analytics', personaId],
    queryFn: async () => {
      const res = await fetch(`/api/personas/${personaId}/analytics?days=30`)
      if (!res.ok) throw new Error('analytics fetch failed')
      return res.json()
    },
    staleTime: 1000 * 60 * 5,
  })

  if (isLoading) {
    return <div className="h-32 rounded-2xl bg-surface-sunken animate-pulse" />
  }

  const total = data?.summary.total_published ?? 0
  // 콘텐츠 1건당 수작업 10분 기준 (대학생 자체 집필 평균)
  const minutesSaved = total * 10
  const hours = Math.floor(minutesSaved / 60)
  const mins = minutesSaved % 60
  const byChannel = data?.summary.by_channel ?? {}
  const externalPublished =
    (byChannel.linkedin_post ?? 0) +
    (byChannel.threads_post ?? 0) +
    (byChannel.instagram_caption ?? 0)

  return (
    <section className="bg-surface-card border border-border rounded-2xl p-5 md:p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-sm font-bold text-txt-primary">지난 30일 활동</h2>
        <Link
          href={`/personas/${personaId}/report`}
          className="text-[11px] text-txt-tertiary hover:text-txt-secondary transition-colors"
        >
          리포트 보기 →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric label="생성" value={`${total}건`} />
        <Metric
          label="절약 시간"
          value={total === 0 ? '—' : hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`}
          caption={total > 0 ? '콘텐츠 1건 ~10분 기준' : null}
        />
        <Metric
          label="외부 발행"
          value={`${externalPublished}건`}
          caption={
            externalPublished > 0
              ? `LinkedIn ${byChannel.linkedin_post ?? 0} · Threads ${byChannel.threads_post ?? 0}`
              : null
          }
        />
        <Metric
          label="채널 수"
          value={`${Object.keys(byChannel).length}`}
          caption="활성 발행 채널"
        />
      </div>

      {total === 0 && (
        <p className="text-[11px] text-txt-tertiary mt-4">
          {personaName} 페르소나로 아직 발행된 콘텐츠가 없습니다. 첫 번들을 만들어보세요.
        </p>
      )}
    </section>
  )
}

function Metric({
  label,
  value,
  caption,
}: {
  label: string
  value: string
  caption?: string | null
}) {
  return (
    <div>
      <p className="text-[11px] text-txt-tertiary mb-1">{label}</p>
      <p className="text-lg font-bold text-txt-primary leading-tight">{value}</p>
      {caption && <p className="text-[10px] text-txt-tertiary mt-1 leading-tight">{caption}</p>}
    </div>
  )
}
