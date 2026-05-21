'use client'

import { useState, useRef, useCallback, useMemo, useEffect } from 'react'

/**
 * Task Flow Demo — /task 를 DAG 카드로 추적
 *
 * 컨셉: 동아리 업무(예: "5월 2일 연합행사")를 한 개 태스크로 만들고,
 * 서브 카드들을 드래그로 배치하면서 의존성(누구 끝나야 누가 시작) 을 그림으로 본다.
 * AI 가 Discord 대화에서 초안 카드/의존성을 뽑아주고, 운영진은 정리만 한다.
 *
 * 현재는 프론트 전용 mock — Draft 의 디자인 시스템만 붙여 실제 UI 감을 잡기 위함.
 */

// ─────────────────────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────────────────────

type Status = 'todo' | 'in_progress' | 'done' | 'blocked'

type Card = {
  id: string
  title: string
  assignee: string
  status: Status
  x: number
  y: number
  deps: string[]
  autoDetected: boolean // Discord 대화에서 AI 가 추출한 카드인지
  sourceHint?: string // 어떤 메시지 근거로 뽑혔는지
}

type DiscordMessage = {
  author: string
  at: string
  text: string
  extractedInto?: string[] // 이 메시지에서 어떤 카드가 나왔는지 (카드 id)
}

// ─────────────────────────────────────────────────────────────
// 목업 데이터 — 5월 2일 연합행사
// ─────────────────────────────────────────────────────────────

const INITIAL_CARDS: Card[] = [
  {
    id: 'c1',
    title: '상대 동아리 컨택',
    assignee: '지민',
    status: 'done',
    x: 60,
    y: 80,
    deps: [],
    autoDetected: true,
    sourceHint: '지민: 일단 고대 스타트업동아리 회장 번호 받아서 넣어뒀어요',
  },
  {
    id: 'c2',
    title: '장소 예약',
    assignee: '성민',
    status: 'in_progress',
    x: 60,
    y: 230,
    deps: ['c1'],
    autoDetected: true,
    sourceHint: '성민: 장소는 우리쪽에서 홀 하나 잡아볼게요',
  },
  {
    id: 'c3',
    title: '포스터 디자인',
    assignee: '하린',
    status: 'in_progress',
    x: 360,
    y: 80,
    deps: ['c1'],
    autoDetected: true,
    sourceHint: '하린: 포스터는 제가 목요일까지 시안 올릴게요',
  },
  {
    id: 'c4',
    title: '홍보 발송',
    assignee: '미정',
    status: 'todo',
    x: 660,
    y: 80,
    deps: ['c3'],
    autoDetected: true,
    sourceHint: 'AI: "포스터 나오면 홍보" 맥락에서 추론',
  },
  {
    id: 'c5',
    title: '명단 수합',
    assignee: '민지',
    status: 'todo',
    x: 660,
    y: 230,
    deps: ['c4'],
    autoDetected: false,
  },
  {
    id: 'c6',
    title: '당일 운영 롤',
    assignee: '임원진',
    status: 'blocked',
    x: 960,
    y: 155,
    deps: ['c2', 'c5'],
    autoDetected: false,
  },
]

const DISCORD_LOG: DiscordMessage[] = [
  {
    author: '지민',
    at: '어제 오후 9:12',
    text: '5월 2일 연합행사 건 — 일단 고대 스타트업동아리 회장 번호 받아서 넣어뒀어요',
    extractedInto: ['c1'],
  },
  {
    author: '성민',
    at: '어제 오후 9:14',
    text: '장소는 우리쪽에서 홀 하나 잡아볼게요. 금요일까지 컨펌받을게요',
    extractedInto: ['c2'],
  },
  {
    author: '하린',
    at: '어제 오후 9:31',
    text: '포스터는 제가 목요일까지 시안 올릴게요. 홍보는 포스터 나오면 진행하면 될 것 같아요',
    extractedInto: ['c3', 'c4'],
  },
  {
    author: '지민',
    at: '오늘 오전 10:02',
    text: '명단은 민지가 받을 예정',
  },
]

// ─────────────────────────────────────────────────────────────
// 상태 뱃지
// ─────────────────────────────────────────────────────────────

const STATUS_META: Record<Status, { label: string; dot: string; text: string; bg: string }> = {
  todo: {
    label: '대기',
    dot: 'bg-txt-tertiary',
    text: 'text-txt-secondary',
    bg: 'bg-surface-sunken',
  },
  in_progress: {
    label: '진행',
    dot: 'bg-status-info-text',
    text: 'text-status-info-text',
    bg: 'bg-status-info-bg',
  },
  done: {
    label: '완료',
    dot: 'bg-status-success-text',
    text: 'text-status-success-text',
    bg: 'bg-status-success-bg',
  },
  blocked: {
    label: '막힘',
    dot: 'bg-status-warning-text',
    text: 'text-status-warning-text',
    bg: 'bg-status-warning-bg',
  },
}

// ─────────────────────────────────────────────────────────────
// 본체
// ─────────────────────────────────────────────────────────────

const CARD_W = 232
const CARD_H = 104

export default function TaskFlowDemoPage() {
  const [cards, setCards] = useState<Card[]>(INITIAL_CARDS)
  const [selectedId, setSelectedId] = useState<string | null>('c3')
  const [hoverSourceCardId, setHoverSourceCardId] = useState<string | null>(null)
  const [linkingFrom, setLinkingFrom] = useState<string | null>(null)
  const [canvasSize, setCanvasSize] = useState({ w: 1200, h: 600 })

  const canvasRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null)

  // 캔버스 크기 측정 (SVG viewBox 맞추기 위해)
  useEffect(() => {
    if (!canvasRef.current) return
    const el = canvasRef.current
    const measure = () => setCanvasSize({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ─────────────────────────
  // 드래그 — 네이티브 pointer 이벤트로 가볍게. lib 을 늘리지 않는다
  // ─────────────────────────
  const onCardPointerDown = useCallback((e: React.PointerEvent, card: Card) => {
    if (linkingFrom) return // 연결 모드에서는 드래그 X
    // 선택만
    setSelectedId(card.id)

    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    dragState.current = {
      id: card.id,
      offsetX: e.clientX - rect.left - card.x,
      offsetY: e.clientY - rect.top - card.y,
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [linkingFrom])

  const onCanvasPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const { id, offsetX, offsetY } = dragState.current
    const nx = Math.max(0, Math.min(e.clientX - rect.left - offsetX, rect.width - CARD_W))
    const ny = Math.max(0, Math.min(e.clientY - rect.top - offsetY, rect.height - CARD_H))
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, x: nx, y: ny } : c)))
  }, [])

  const onCanvasPointerUp = useCallback(() => {
    dragState.current = null
  }, [])

  // ─────────────────────────
  // 연결 — 한 카드에서 "연결" 누르고 다른 카드 클릭하면 deps 생성
  // ─────────────────────────
  const startLink = useCallback((fromId: string) => {
    setLinkingFrom(fromId)
  }, [])

  const completeLink = useCallback((toId: string) => {
    if (!linkingFrom) return
    if (linkingFrom === toId) {
      setLinkingFrom(null)
      return
    }
    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== toId) return c
        if (c.deps.includes(linkingFrom)) return c
        return { ...c, deps: [...c.deps, linkingFrom] }
      }),
    )
    setLinkingFrom(null)
  }, [linkingFrom])

  // ─────────────────────────
  // 카드 조작
  // ─────────────────────────
  const cycleStatus = (id: string) => {
    const order: Status[] = ['todo', 'in_progress', 'done', 'blocked']
    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c
        const next = order[(order.indexOf(c.status) + 1) % order.length]
        return { ...c, status: next }
      }),
    )
  }

  const addCard = () => {
    const id = `c${Date.now()}`
    setCards((prev) => [
      ...prev,
      {
        id,
        title: '새 카드',
        assignee: '미정',
        status: 'todo',
        x: 80 + Math.random() * 60,
        y: 360 + Math.random() * 40,
        deps: [],
        autoDetected: false,
      },
    ])
    setSelectedId(id)
  }

  const removeCard = (id: string) => {
    setCards((prev) =>
      prev
        .filter((c) => c.id !== id)
        .map((c) => ({ ...c, deps: c.deps.filter((d) => d !== id) })),
    )
    if (selectedId === id) setSelectedId(null)
  }

  const removeDep = (cardId: string, depId: string) => {
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, deps: c.deps.filter((d) => d !== depId) } : c)),
    )
  }

  const updateSelected = (patch: Partial<Card>) => {
    if (!selectedId) return
    setCards((prev) => prev.map((c) => (c.id === selectedId ? { ...c, ...patch } : c)))
  }

  // ─────────────────────────
  // 파생
  // ─────────────────────────
  const selected = useMemo(() => cards.find((c) => c.id === selectedId) ?? null, [cards, selectedId])

  // 화살표 path 계산
  const edges = useMemo(() => {
    const byId = new Map(cards.map((c) => [c.id, c]))
    const out: { id: string; d: string; highlighted: boolean }[] = []
    for (const c of cards) {
      for (const depId of c.deps) {
        const from = byId.get(depId)
        if (!from) continue
        const fx = from.x + CARD_W
        const fy = from.y + CARD_H / 2
        const tx = c.x
        const ty = c.y + CARD_H / 2
        const mx = (fx + tx) / 2
        const d = `M ${fx} ${fy} C ${mx} ${fy}, ${mx} ${ty}, ${tx} ${ty}`
        const highlighted = selectedId === c.id || selectedId === depId
        out.push({ id: `${depId}->${c.id}`, d, highlighted })
      }
    }
    return out
  }, [cards, selectedId])

  const progress = useMemo(() => {
    const total = cards.length
    const done = cards.filter((c) => c.status === 'done').length
    return total === 0 ? 0 : Math.round((done / total) * 100)
  }, [cards])

  // ─────────────────────────
  // 렌더
  // ─────────────────────────
  return (
    <div className="h-screen flex flex-col bg-surface-bg text-txt-primary">
      {/* ── 상단 태스크 헤더 ── */}
      <header className="flex items-center gap-4 px-6 py-3 border-b border-border bg-surface-card">
        <div className="flex items-center gap-2 text-xs text-txt-tertiary">
          <span>프로젝트</span>
          <span>/</span>
          <span>FLIP 1기</span>
          <span>/</span>
          <span>태스크</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <h1 className="text-base font-semibold">5월 2일 고려대 연합행사</h1>
        <span className="text-xs text-txt-tertiary">D-9 · 담당 임원진 3명</span>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <div className="text-xs text-txt-tertiary">진척 {progress}%</div>
          <div className="h-1.5 w-32 rounded-full bg-surface-sunken overflow-hidden">
            <div
              className="h-full bg-status-success-text transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={addCard}
          className="px-3 py-1.5 rounded-lg bg-txt-primary text-surface-card text-xs font-medium hover:opacity-90 transition"
        >
          + 카드 추가
        </button>
      </header>

      {/* ── 3단 레이아웃 ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* 좌 — Discord 대화 (AI 추출 원천) */}
        <aside className="w-72 shrink-0 border-r border-border bg-surface-card flex flex-col">
          <div className="px-4 py-3 border-b border-border">
            <div className="text-xs text-txt-tertiary mb-1">AI 추출 원천</div>
            <div className="text-sm font-medium">#general · 어제~오늘</div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {DISCORD_LOG.map((m, idx) => {
              const extractedCards = m.extractedInto ?? []
              const isRelated = extractedCards.some((id) => id === hoverSourceCardId)
              return (
                <div
                  key={idx}
                  onMouseEnter={() => extractedCards[0] && setHoverSourceCardId(extractedCards[0])}
                  onMouseLeave={() => setHoverSourceCardId(null)}
                  className={`rounded-xl p-3 border transition ${
                    isRelated
                      ? 'border-brand-border bg-brand-bg'
                      : 'border-border bg-surface-sunken'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <span className="text-xs font-medium">{m.author}</span>
                    <span className="text-[10px] text-txt-tertiary">{m.at}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-txt-secondary">{m.text}</p>
                  {extractedCards.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border flex flex-wrap gap-1">
                      {extractedCards.map((cid) => {
                        const c = cards.find((cc) => cc.id === cid)
                        if (!c) return null
                        return (
                          <button
                            key={cid}
                            type="button"
                            onClick={() => setSelectedId(cid)}
                            onMouseEnter={() => setHoverSourceCardId(cid)}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface-card border border-border text-[10px] text-txt-secondary hover:border-brand-border transition"
                          >
                            <span className="text-brand">✨</span>
                            {c.title}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="px-4 py-3 border-t border-border bg-surface-sunken">
            <p className="text-[11px] leading-relaxed text-txt-tertiary">
              Draft 는 Discord 대화에서 업무 후보를 초안으로 뽑습니다. 학생은 그대로 두고, 운영진이
              캔버스에서 정리합니다.
            </p>
          </div>
        </aside>

        {/* 가운데 — 캔버스 */}
        <div className="flex-1 relative overflow-hidden">
          {/* 그리드 배경 */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, var(--border-subtle) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* 연결 모드 안내 */}
          {linkingFrom && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full bg-txt-primary text-surface-card text-xs shadow-lg">
              다음 카드를 클릭하면 의존성이 생깁니다 · ESC 로 취소
            </div>
          )}

          <div
            ref={canvasRef}
            className="relative w-full h-full"
            onPointerMove={onCanvasPointerMove}
            onPointerUp={onCanvasPointerUp}
            onPointerLeave={onCanvasPointerUp}
            onKeyDown={(e) => e.key === 'Escape' && setLinkingFrom(null)}
            tabIndex={0}
          >
            {/* SVG — 의존 화살표 */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width={canvasSize.w}
              height={canvasSize.h}
            >
              <defs>
                <marker
                  id="arrow-default"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--border-strong)" />
                </marker>
                <marker
                  id="arrow-hl"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--brand)" />
                </marker>
              </defs>
              {edges.map((e) => (
                <path
                  key={e.id}
                  d={e.d}
                  fill="none"
                  stroke={e.highlighted ? 'var(--brand)' : 'var(--border-strong)'}
                  strokeWidth={e.highlighted ? 2 : 1.5}
                  strokeDasharray={e.highlighted ? '0' : '4 4'}
                  markerEnd={e.highlighted ? 'url(#arrow-hl)' : 'url(#arrow-default)'}
                  opacity={e.highlighted ? 1 : 0.7}
                />
              ))}
            </svg>

            {/* 카드들 */}
            {cards.map((card) => {
              const meta = STATUS_META[card.status]
              const isSelected = selectedId === card.id
              const isLinkTarget = linkingFrom && linkingFrom !== card.id
              const isHoverSource = hoverSourceCardId === card.id
              return (
                <div
                  key={card.id}
                  onPointerDown={(e) => onCardPointerDown(e, card)}
                  onClick={() => {
                    if (linkingFrom) completeLink(card.id)
                  }}
                  style={{
                    position: 'absolute',
                    left: card.x,
                    top: card.y,
                    width: CARD_W,
                    height: CARD_H,
                    touchAction: 'none',
                  }}
                  className={`group rounded-2xl border bg-surface-card p-3 select-none transition cursor-grab active:cursor-grabbing ${
                    isSelected
                      ? 'border-brand ring-2 ring-brand-border shadow-md'
                      : isHoverSource
                      ? 'border-brand-border shadow'
                      : 'border-border hover:border-border-strong'
                  } ${isLinkTarget ? 'ring-2 ring-status-info-text' : ''}`}
                >
                  {/* 상단: 상태 + 자동추출 */}
                  <div className="flex items-center justify-between mb-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        cycleStatus(card.id)
                      }}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${meta.bg} ${meta.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </button>
                    {card.autoDetected && (
                      <span className="text-[10px] text-brand flex items-center gap-0.5" title="AI 가 대화에서 추출">
                        ✨ 자동
                      </span>
                    )}
                  </div>

                  {/* 제목 */}
                  <h3 className="text-sm font-semibold leading-snug truncate mb-1">{card.title}</h3>

                  {/* 하단: 담당 + 액션 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-brand-bg border border-brand-border flex items-center justify-center text-[10px] font-medium text-brand">
                        {card.assignee[0]}
                      </div>
                      <span className="text-[11px] text-txt-secondary truncate max-w-[80px]">
                        {card.assignee}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          startLink(card.id)
                        }}
                        className="text-[10px] px-1.5 py-0.5 rounded border border-border text-txt-secondary hover:border-brand-border hover:text-brand transition"
                        title="다음 카드로 연결"
                      >
                        →
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeCard(card.id)
                        }}
                        className="text-[10px] px-1.5 py-0.5 rounded border border-border text-txt-tertiary hover:border-status-danger-text hover:text-status-danger-text transition"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 우 — 카드 상세 */}
        <aside className="w-80 shrink-0 border-l border-border bg-surface-card flex flex-col">
          {selected ? (
            <>
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="text-xs text-txt-tertiary">카드 상세</div>
                {selected.autoDetected && (
                  <span className="text-[10px] text-brand">✨ AI 추출</span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {/* 제목 */}
                <div>
                  <label className="text-[11px] text-txt-tertiary block mb-1">제목</label>
                  <input
                    type="text"
                    value={selected.title}
                    onChange={(e) => updateSelected({ title: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface-sunken text-sm focus:outline-hidden focus:border-brand focus:bg-surface-card transition"
                  />
                </div>

                {/* 담당 */}
                <div>
                  <label className="text-[11px] text-txt-tertiary block mb-1">담당</label>
                  <input
                    type="text"
                    value={selected.assignee}
                    onChange={(e) => updateSelected({ assignee: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface-sunken text-sm focus:outline-hidden focus:border-brand focus:bg-surface-card transition"
                  />
                </div>

                {/* 상태 */}
                <div>
                  <label className="text-[11px] text-txt-tertiary block mb-2">상태</label>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(STATUS_META) as Status[]).map((s) => {
                      const meta = STATUS_META[s]
                      const active = selected.status === s
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => updateSelected({ status: s })}
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium border transition ${
                            active
                              ? `${meta.bg} ${meta.text} border-transparent`
                              : 'bg-surface-sunken border-border text-txt-secondary hover:border-border-strong'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 의존성 */}
                <div>
                  <label className="text-[11px] text-txt-tertiary block mb-2">
                    선행 의존 ({selected.deps.length})
                  </label>
                  <div className="space-y-1.5">
                    {selected.deps.length === 0 ? (
                      <div className="text-[11px] text-txt-tertiary py-2 px-2.5 rounded-lg bg-surface-sunken border border-dashed border-border">
                        없음 — 시작 카드
                      </div>
                    ) : (
                      selected.deps.map((depId) => {
                        const dep = cards.find((c) => c.id === depId)
                        if (!dep) return null
                        const meta = STATUS_META[dep.status]
                        return (
                          <div
                            key={depId}
                            className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border border-border bg-surface-sunken"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`} />
                              <button
                                type="button"
                                onClick={() => setSelectedId(depId)}
                                className="text-xs truncate hover:underline"
                              >
                                {dep.title}
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeDep(selected.id, depId)}
                              className="text-[10px] text-txt-tertiary hover:text-status-danger-text shrink-0"
                            >
                              해제
                            </button>
                          </div>
                        )
                      })
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => startLink(selected.id)}
                    className="mt-2 w-full text-[11px] py-1.5 rounded-lg border border-dashed border-border text-txt-secondary hover:border-brand-border hover:text-brand transition"
                  >
                    + 다른 카드로 연결 시작
                  </button>
                </div>

                {/* AI 근거 */}
                {selected.autoDetected && selected.sourceHint && (
                  <div>
                    <label className="text-[11px] text-txt-tertiary block mb-1">AI 추출 근거</label>
                    <div className="text-[11px] leading-relaxed text-txt-secondary p-2.5 rounded-lg bg-brand-bg border border-brand-border">
                      {selected.sourceHint}
                    </div>
                  </div>
                )}
              </div>
              <div className="px-4 py-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => removeCard(selected.id)}
                  className="w-full text-xs py-1.5 rounded-lg border border-border text-txt-tertiary hover:border-status-danger-text hover:text-status-danger-text transition"
                >
                  카드 삭제
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="text-xs text-txt-tertiary mb-2">카드를 선택하세요</div>
              <p className="text-[11px] text-txt-tertiary leading-relaxed">
                좌측 Discord 대화에서 뱃지를 클릭하거나, 캔버스의 카드를 드래그해 배치해보세요.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* 하단 힌트 바 */}
      <footer className="px-6 py-2 border-t border-border bg-surface-card text-[11px] text-txt-tertiary flex items-center gap-4">
        <span>· 카드 드래그로 이동</span>
        <span>· 카드 hover → → 버튼으로 다음 카드 연결</span>
        <span>· 상태 뱃지 클릭으로 순환</span>
        <span className="ml-auto">demo — mock data only</span>
      </footer>
    </div>
  )
}
