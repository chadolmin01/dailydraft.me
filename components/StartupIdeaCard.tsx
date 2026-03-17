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
    <Card className="group h-[14.25rem] flex flex-col hover:-translate-y-1 overflow-hidden" padding="p-0">
      {/* HEADER */}
      <div className="h-[4.5rem] px-5 py-4 flex-shrink-0">
        <div className="flex items-center justify-between gap-3 h-full">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={name}
                className="w-10 h-10 object-cover bg-surface-sunken flex-shrink-0 border border-border"
              />
            ) : (
              <div className="w-10 h-10 bg-surface-sunken border border-border flex items-center justify-center flex-shrink-0 text-txt-primary group-hover:bg-black group-hover:text-white transition-colors">
                <Globe size={18} />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-txt-primary truncate group-hover:text-brand transition-colors">
                {name}
              </h3>
              <p className="text-[0.625rem] font-mono text-txt-disabled uppercase">
                {source === 'producthunt' ? 'Product Hunt' : source === 'ycombinator' ? 'Y Combinator' : source}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[0.625rem] font-mono text-txt-disabled bg-surface-sunken px-2 py-1 border border-border flex-shrink-0">
            <TrendingUp size={10} />
            {upvotes.toLocaleString()}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="h-[6.25rem] px-5 flex flex-col justify-start overflow-hidden flex-shrink-0">
        <div className="h-[3rem] mb-3">
          {hasAnalysis ? (
            <p className="text-sm text-txt-secondary leading-6 line-clamp-2 break-keep">
              {analysis.korean_summary}
            </p>
          ) : (
            <p className="text-sm text-txt-disabled leading-6 line-clamp-2 break-keep italic">
              {tagline || '분석 대기 중...'}
            </p>
          )}
        </div>

        {hasAnalysis && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[0.625rem] font-mono text-white bg-black px-2 py-1">
                적합도 {analysis.korea_fit_score}
              </span>
              <span className="text-[0.625rem] font-mono text-txt-secondary bg-surface-sunken px-2 py-1 border border-border">
                {analysis.difficulty === 'easy' ? '쉬움' : analysis.difficulty === 'medium' ? '보통' : '어려움'}
              </span>
              {analysis.target_founder_type?.slice(0, 1).map((type) => (
                <span
                  key={type}
                  className="text-[0.625rem] font-mono text-txt-secondary bg-surface-sunken px-2 py-1 border border-border"
                >
                  {FOUNDER_TYPE_LABELS[type] || type}
                </span>
              ))}
            </div>
            {analysis.korea_exists && analysis.korea_competitors.length > 0 && (
              <div className="flex items-center gap-1.5 text-[0.625rem] text-txt-disabled">
                <Users size={10} />
                <span>경쟁: {analysis.korea_competitors.slice(0, 2).join(', ')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="h-[3.5rem] px-5 py-4 border-t border-border flex-shrink-0">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-4">
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-txt-disabled hover:text-txt-primary flex items-center gap-1 transition-colors"
            >
              원본 <ArrowUpRight size={12} />
            </a>
            {websiteUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-txt-disabled hover:text-txt-primary flex items-center gap-1 transition-colors"
              >
                웹사이트 <ArrowUpRight size={12} />
              </a>
            )}
          </div>
          {onStartBuilding && hasAnalysis && (
            <button
              onClick={() => onStartBuilding(id)}
              className="px-4 py-2 bg-black text-white text-xs font-bold hover:bg-[#333] transition-colors flex items-center gap-1 border border-black shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
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
