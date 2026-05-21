'use client'

import React from 'react'
import { SCORECARD_CATEGORIES, CATEGORY_INFO, type Scorecard, type CategoryUpdate } from './types'

interface ScorecardPanelProps {
  scorecard: Scorecard
  turnNumber: number
  latestUpdates: CategoryUpdate[]
}

export default function ScorecardPanel({ scorecard, turnNumber, latestUpdates }: ScorecardPanelProps) {
  const totalMax = 100
  const percentage = Math.round((scorecard.totalScore / totalMax) * 100)

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono uppercase text-txt-tertiary tracking-wider">스코어카드</span>
          <span className="text-[10px] font-mono text-txt-tertiary">턴 {turnNumber}/8</span>
        </div>
        {/* Total score */}
        <div className="flex items-end gap-2 mt-3">
          <span className="text-3xl font-bold text-txt-primary tabular-nums">{scorecard.totalScore}</span>
          <span className="text-sm text-txt-tertiary mb-1">/ {totalMax}</span>
        </div>
        {/* Total progress bar */}
        <div className="mt-2 h-2 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${percentage}%`,
              backgroundColor: percentage >= 65 ? '#10B981' : percentage >= 40 ? '#F59E0B' : '#6B7280',
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-txt-tertiary">{percentage}%</span>
          <span className="text-[10px] text-txt-tertiary">목표: 65점</span>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        {SCORECARD_CATEGORIES.map(cat => {
          const info = CATEGORY_INFO[cat]
          const score = scorecard[cat]
          const update = latestUpdates.find(u => u.category === cat)
          const pct = Math.round((score.current / info.max) * 100)

          return (
            <div key={cat}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-txt-secondary">{info.nameKo}</span>
                <div className="flex items-center gap-1.5">
                  {update && update.delta > 0 && (
                    <span className="text-[10px] font-mono text-green-500 animate-pulse">
                      +{update.delta}
                    </span>
                  )}
                  <span className="text-xs tabular-nums text-txt-tertiary">
                    {score.current}/{info.max}
                  </span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: pct >= 70 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#D1D5DB',
                  }}
                />
              </div>
              {update?.reason && (
                <p className="text-[10px] text-txt-tertiary mt-0.5 truncate">{update.reason}</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-[10px] font-mono uppercase text-txt-tertiary tracking-wider mb-2">안내</p>
        <ul className="space-y-1 text-[10px] text-txt-tertiary">
          <li>구체적인 답변일수록 점수가 높아집니다</li>
          <li>피드백을 수용하면 보너스 점수를 받습니다</li>
          <li>65점 이상이면 MVP 수준입니다</li>
        </ul>
      </div>
    </div>
  )
}
