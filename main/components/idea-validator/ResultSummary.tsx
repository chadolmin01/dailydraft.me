'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { SCORECARD_CATEGORIES, CATEGORY_INFO, type Scorecard, type ChatMessage } from './types'

interface ResultSummaryProps {
  idea: string
  scorecard: Scorecard
  messages: ChatMessage[]
  onReset: () => void
  onComplete?: () => void
}

interface SynthesisData {
  summary: string
  strengths: string[]
  risks: string[]
  nextSteps: string[]
  oneLiner: string
  targetCustomer: string
}

export default function ResultSummary({ idea, scorecard, messages, onReset, onComplete }: ResultSummaryProps) {
  const [synthesis, setSynthesis] = useState<SynthesisData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSynthesis = async () => {
      try {
        const history = messages
          .filter(m => m.isUser || m.metrics)
          .map(m => m.text || m.metrics?.summary || '')
          .filter(Boolean)

        const res = await fetch('/api/idea-validator/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originalIdea: idea,
            conversationHistory: history,
            scorecard,
          }),
        })

        if (res.ok) {
          const { data } = await res.json()
          setSynthesis(data)
        }
      } catch (err) {
        console.error('Synthesis fetch failed:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSynthesis()
  }, [idea, messages, scorecard])

  const percentage = Math.round((scorecard.totalScore / 100) * 100)
  const grade = percentage >= 65 ? 'MVP Ready' : percentage >= 40 ? 'Needs Work' : 'Early Stage'
  const gradeColor = percentage >= 65 ? 'text-green-500' : percentage >= 40 ? 'text-amber-500' : 'text-txt-tertiary'

  return (
    <div className="h-full overflow-y-auto bg-surface-card">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-[10px] font-mono uppercase tracking-wider text-txt-tertiary mb-2">검증 결과</p>
          <div className="text-5xl font-bold text-txt-primary tabular-nums mb-2">{scorecard.totalScore}</div>
          <p className={`text-sm font-mono ${gradeColor}`}>{grade}</p>
        </div>

        {/* Score Bars */}
        <div className="rounded-xl border border-border p-6 mb-6">
          <p className="text-[10px] font-mono uppercase text-txt-tertiary tracking-wider mb-4">카테고리별 점수</p>
          <div className="space-y-3">
            {SCORECARD_CATEGORIES.map(cat => {
              const info = CATEGORY_INFO[cat]
              const score = scorecard[cat]
              const pct = Math.round((score.current / info.max) * 100)
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-xs text-txt-secondary w-24 shrink-0">{info.nameKo}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: pct >= 70 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#D1D5DB',
                      }}
                    />
                  </div>
                  <span className="text-xs tabular-nums text-txt-tertiary w-10 text-right">{score.current}/{info.max}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Synthesis */}
        {loading ? (
          <div className="rounded-xl border border-border p-6 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border border-border border-t-transparent animate-spin rounded-full" />
              <span className="text-xs text-txt-tertiary">종합 분석 생성 중...</span>
            </div>
          </div>
        ) : synthesis ? (
          <div className="space-y-6 mb-6">
            {/* One-liner */}
            <div className="rounded-xl border border-border p-6">
              <p className="text-[10px] font-mono uppercase text-txt-tertiary tracking-wider mb-2">한 줄 요약</p>
              <p className="text-lg font-medium text-txt-primary">{synthesis.oneLiner}</p>
              <p className="text-xs text-txt-tertiary mt-1">타겟: {synthesis.targetCustomer}</p>
            </div>

            {/* Summary */}
            <div className="rounded-xl border border-border p-6">
              <p className="text-[10px] font-mono uppercase text-txt-tertiary tracking-wider mb-2">종합 평가</p>
              <p className="text-sm text-txt-secondary leading-relaxed">{synthesis.summary}</p>
            </div>

            {/* Strengths & Risks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border p-4">
                <p className="text-[10px] font-mono uppercase text-green-600 dark:text-green-400 tracking-wider mb-2">강점</p>
                <ul className="space-y-1.5">
                  {synthesis.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-txt-secondary flex gap-1.5">
                      <span className="text-green-500 shrink-0">+</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-[10px] font-mono uppercase text-amber-600 dark:text-amber-400 tracking-wider mb-2">리스크</p>
                <ul className="space-y-1.5">
                  {synthesis.risks.map((r, i) => (
                    <li key={i} className="text-xs text-txt-secondary flex gap-1.5">
                      <span className="text-amber-500 shrink-0">!</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Next Steps */}
            <div className="rounded-xl border border-border p-6">
              <p className="text-[10px] font-mono uppercase text-txt-tertiary tracking-wider mb-2">다음 단계</p>
              <ol className="space-y-1.5">
                {synthesis.nextSteps.map((step, i) => (
                  <li key={i} className="text-xs text-txt-secondary flex gap-2">
                    <span className="text-txt-tertiary font-mono shrink-0">{i + 1}.</span> {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : null}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          {onComplete ? (
            <button
              onClick={onComplete}
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-txt-primary text-surface-card text-sm font-medium hover:opacity-90 transition-opacity"
            >
              다음 단계로
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          ) : (
            <Link
              href="/project/create"
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-txt-primary text-surface-card text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Draft에서 팀 찾기
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          )}
          <button
            onClick={onReset}
            className="flex-1 h-12 rounded-xl border border-border text-sm text-txt-secondary hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            다른 아이디어 검증
          </button>
        </div>
      </div>
    </div>
  )
}
