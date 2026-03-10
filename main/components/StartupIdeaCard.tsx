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
    <Card className="group h-[228px] flex flex-col hover:-translate-y-1 overflow-hidden" padding="p-0">
      {/* ============================================
          HEADER: 72px (py-4 = 32px + content 40px)
          - Logo (40x40) + Name + Source + Upvotes
          ============================================ */}
      <div className="h-[72px] px-5 py-4 flex-shrink-0">
        <div className="flex items-center justify-between gap-3 h-full">
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
          <div className="flex items-center gap-1 text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded-sm border border-gray-100 flex-shrink-0">
            <TrendingUp size={10} />
            {upvotes.toLocaleString()}
          </div>
        </div>
      </div>

      {/* ============================================
          BODY: 100px (228 - 72 - 56 = 100px)
          - Summary (2줄) + Tags + Competitors
          ============================================ */}
      <div className="h-[100px] px-5 flex flex-col justify-start overflow-hidden flex-shrink-0">
        {/* Summary: 고정 48px (2줄 * 24px line-height) */}
        <div className="h-[48px] mb-3">
          {hasAnalysis ? (
            <p className="text-sm text-gray-600 leading-6 line-clamp-2 break-keep">
              {analysis.korean_summary}
            </p>
          ) : (
            <p className="text-sm text-gray-400 leading-6 line-clamp-2 break-keep italic">
              {tagline || '분석 대기 중...'}
            </p>
          )}
        </div>

        {/* Tags: 고정 영역 */}
        {hasAnalysis && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono text-white bg-gray-900 px-2 py-1 rounded-sm">
                적합도 {analysis.korea_fit_score}
              </span>
              <span className="text-[10px] font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded-sm">
                {analysis.difficulty === 'easy' ? '쉬움' : analysis.difficulty === 'medium' ? '보통' : '어려움'}
              </span>
              {analysis.target_founder_type?.slice(0, 1).map((type) => (
                <span
                  key={type}
                  className="text-[10px] font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded-sm"
                >
                  {FOUNDER_TYPE_LABELS[type] || type}
                </span>
              ))}
            </div>
            {analysis.korea_exists && analysis.korea_competitors.length > 0 && (
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                <Users size={10} />
                <span>경쟁: {analysis.korea_competitors.slice(0, 2).join(', ')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================
          FOOTER: 56px (py-4 = 32px + content 24px)
          - Links + Button
          ============================================ */}
      <div className="h-[56px] px-5 py-4 border-t border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-4">
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-gray-900 flex items-center gap-1 transition-colors"
            >
              원본 <ArrowUpRight size={12} />
            </a>
            {websiteUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-gray-900 flex items-center gap-1 transition-colors"
              >
                웹사이트 <ArrowUpRight size={12} />
              </a>
            )}
          </div>
          {onStartBuilding && hasAnalysis && (
            <button
              onClick={() => onStartBuilding(id)}
              className="px-4 py-2 bg-black text-white text-xs font-bold rounded-sm hover:bg-gray-800 transition-colors flex items-center gap-1"
            >
              빌딩 시작
              <ArrowUpRight size={12} />
            </button>
          )}
        </div>
      </div>
    </Card>
  )
}

export default StartupIdeaCard
