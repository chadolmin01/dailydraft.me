'use client'

import { useMemo } from 'react'

interface Point {
  year: number
  week: number
  submissions: number
  messages: number
}

interface Props {
  data: Point[]
  metric: 'submissions' | 'messages'
  height?: number
}

/**
 * 의존성 없이 SVG 라인 차트 그리기. recharts/victory 는 번들이 크고
 * 정부 보고서 PDF 인쇄에서 폰트/안티앨리어싱 깨짐 문제 있어서 pure SVG 로 구성.
 * 픽셀 단위 좌표계 사용 — viewBox 기반이라 반응형 자동 조정.
 */
export function KpiTimeseriesChart({ data, metric, height = 160 }: Props) {
  const padding = { top: 12, right: 12, bottom: 24, left: 32 }
  const chartWidth = 800 // viewBox 기준. 실제 SVG 는 preserveAspectRatio 로 늘어남
  const innerW = chartWidth - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const { points, maxVal, avg, labels } = useMemo(() => {
    if (data.length === 0) {
      return { points: [] as Array<{ x: number; y: number; raw: Point }>, maxVal: 0, avg: 0, labels: [] as string[] }
    }
    const values = data.map(d => d[metric])
    const maxVal = Math.max(1, ...values)
    const avg = values.reduce((s, v) => s + v, 0) / values.length

    const step = data.length > 1 ? innerW / (data.length - 1) : 0
    const points = data.map((d, i) => ({
      x: padding.left + i * step,
      y: padding.top + innerH - (d[metric] / maxVal) * innerH,
      raw: d,
    }))

    // X축 라벨 간격
    const labelEvery = Math.max(1, Math.ceil(data.length / 8))
    const labels = data.map((d, i) => i % labelEvery === 0 ? `${d.week}주` : '')

    return { points, maxVal, avg, labels }
  }, [data, metric, innerW, innerH])

  if (data.length === 0) {
    return (
      <div className="bg-surface-card border border-border rounded-2xl p-8 text-center">
        <p className="text-[13px] text-txt-tertiary">표시할 데이터가 없습니다</p>
      </div>
    )
  }

  // Line path
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ')

  // Area path (아래쪽 gradient 채우기)
  const areaPath = linePath + ` L${points[points.length - 1].x.toFixed(1)},${padding.top + innerH} L${points[0].x.toFixed(1)},${padding.top + innerH} Z`

  // 평균선 Y
  const avgY = padding.top + innerH - (avg / maxVal) * innerH

  return (
    <div className="bg-surface-card border border-border rounded-2xl p-5">
      <svg
        viewBox={`0 0 ${chartWidth} ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: `${height}px` }}
        role="img"
        aria-label={metric === 'submissions' ? '주차별 주간 업데이트 제출 추이' : '주차별 Discord 메시지 추이'}
      >
        <defs>
          <linearGradient id={`grad-${metric}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--brand, #0052cc)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--brand, #0052cc)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 가로 그리드 (3줄) */}
        {[0.25, 0.5, 0.75].map(f => {
          const y = padding.top + innerH * f
          return (
            <line
              key={f}
              x1={padding.left}
              x2={chartWidth - padding.right}
              y1={y}
              y2={y}
              stroke="currentColor"
              strokeOpacity="0.1"
              strokeDasharray="2 4"
            />
          )
        })}

        {/* Y 최대/0 레이블 */}
        <text x="4" y={padding.top + 4} fontSize="9" fill="currentColor" opacity="0.5">{maxVal}</text>
        <text x="4" y={padding.top + innerH + 3} fontSize="9" fill="currentColor" opacity="0.5">0</text>

        {/* 평균 선 */}
        <line
          x1={padding.left}
          x2={chartWidth - padding.right}
          y1={avgY}
          y2={avgY}
          stroke="currentColor"
          strokeOpacity="0.3"
          strokeDasharray="4 3"
        />
        <text x={chartWidth - padding.right - 2} y={avgY - 3} fontSize="9" fill="currentColor" opacity="0.5" textAnchor="end">
          평균 {avg.toFixed(1)}
        </text>

        {/* Area 채우기 */}
        <path d={areaPath} fill={`url(#grad-${metric})`} />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-brand"
          vectorEffect="non-scaling-stroke"
        />

        {/* 포인트 */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={data.length <= 40 ? 2 : 1.5}
            fill="currentColor"
            className="text-brand"
          />
        ))}

        {/* X 라벨 */}
        {labels.map((lbl, i) => (
          lbl ? (
            <text
              key={i}
              x={points[i].x}
              y={height - 6}
              fontSize="9"
              fill="currentColor"
              opacity="0.5"
              textAnchor="middle"
            >
              {lbl}
            </text>
          ) : null
        ))}
      </svg>

      <p className="text-[11px] text-txt-tertiary mt-2 text-center">
        {metric === 'submissions' ? '주차별 주간 업데이트 제출 건수' : '주차별 Discord 메시지 수'}
      </p>
    </div>
  )
}
