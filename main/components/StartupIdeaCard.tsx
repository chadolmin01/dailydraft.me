'use client'

import React from 'react'
import { ArrowUpRight, Globe, TrendingUp, Users } from 'lucide-react'
import { Card } from './ui/Card'
import type { StartupKoreaAnalysis, FounderType } from '@/src/lib/startups/types'

interface StartupIdeaCardProps {
  id: string
  name: string
  tagline?: string | null
  description?: string | null
  logoUrl?: string | null
  websiteUrl?: string | null
  sourceUrl: string
  source: string
  upvotes: number
  koreaFitScore?: number | null
  finalScore?: number | null
  koreaDeepAnalysis?: StartupKoreaAnalysis | null
  onStartBuilding?: (id: string) => void
}

const FOUNDER_TYPE_LABELS: Record<FounderType, string> = {
  'Blitz Builder': '실행형',
  'Market Sniper': '분석형',
  'Tech Pioneer': '기술형',
  'Community Builder': '커뮤니티형',
}

function getScoreLabel(score: number): string {
  if (score >= 80) return '적합'
  if (score >= 60) return '보통'
  return '낮음'
}

export const StartupIdeaCard: React.FC<StartupIdeaCardProps> = ({
  id,
  name,
  tagline,
  logoUrl,
  websiteUrl,
  sourceUrl,
  source,
  upvotes,
  koreaFitScore,
  finalScore,
  koreaDeepAnalysis,
  onStartBuilding,
}) => {
  const analysis = koreaDeepAnalysis
  const hasAnalysis = !!analysis

  return (
    <Card className="group h-full flex flex-col hover:-translate-y-1" padding="p-0">
      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          {/* Logo and Title */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={name}
                className="w-10 h-10 rounded-sm object-cover bg-gray-100 flex-shrink-0 border border-gray-100"
              />
            ) : (
              <div className="w-10 h-10 rounded-sm bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 text-gray-900 group-hover:bg-black group-hover:text-white transition-colors">
                <Globe size={18} />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-gray-900 truncate group-hover:text-draft-blue transition-colors">
                {name}
              </h3>
              <p className="text-[10px] font-mono text-gray-400 uppercase">
                {source === 'producthunt' ? 'Product Hunt' : source === 'ycombinator' ? 'Y Combinator' : source}
              </p>
            </div>
          </div>

          {/* Upvotes Badge */}
          <div className="flex items-center gap-1 text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded-sm border border-gray-100 flex-shrink-0">
            <TrendingUp size={10} />
            {upvotes.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="px-5 pb-4 flex-1">
        {hasAnalysis ? (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 break-keep">
            {analysis.korean_summary}
          </p>
        ) : (
          <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 break-keep italic">
            {tagline || '분석 대기 중...'}
          </p>
        )}
      </div>

      {/* Scores & Tags */}
      {hasAnalysis && (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Korea Fit Score */}
            <span className="text-[10px] font-mono text-gray-900 bg-gray-100 px-2 py-0.5 rounded-sm border border-gray-200">
              적합도 {analysis.korea_fit_score} ({getScoreLabel(analysis.korea_fit_score)})
            </span>

            {/* Difficulty */}
            <span className="text-[10px] font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded-sm border border-gray-100">
              {analysis.difficulty === 'easy' ? '쉬움' : analysis.difficulty === 'medium' ? '보통' : '어려움'}
            </span>

            {/* Founder Types */}
            {analysis.target_founder_type?.slice(0, 1).map((type) => (
              <span
                key={type}
                className="text-[10px] font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded-sm border border-gray-100"
              >
                {FOUNDER_TYPE_LABELS[type] || type}
              </span>
            ))}
          </div>

          {/* Competitors Warning */}
          {analysis.korea_exists && analysis.korea_competitors.length > 0 && (
            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-gray-500">
              <Users size={10} />
              <span>경쟁: {analysis.korea_competitors.slice(0, 2).join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-gray-100 mt-auto" />

      {/* Actions */}
      <div className="p-4 flex items-center justify-between gap-2">
        {/* External Links */}
        <div className="flex items-center gap-3">
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-mono text-gray-400 hover:text-gray-900 flex items-center gap-1 transition-colors"
          >
            원본 <ArrowUpRight size={10} />
          </a>
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-mono text-gray-400 hover:text-gray-900 flex items-center gap-1 transition-colors"
            >
              웹사이트 <ArrowUpRight size={10} />
            </a>
          )}
        </div>

        {/* Start Building Button */}
        {onStartBuilding && hasAnalysis && (
          <button
            onClick={() => onStartBuilding(id)}
            className="px-3 py-1.5 bg-black text-white text-[10px] font-bold rounded-sm hover:bg-gray-800 transition-colors flex items-center gap-1"
          >
            빌딩 시작
            <ArrowUpRight size={10} />
          </button>
        )}
      </div>
    </Card>
  )
}

export default StartupIdeaCard
