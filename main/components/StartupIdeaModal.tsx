'use client'

import React from 'react'
import { X, ArrowUpRight, Globe, TrendingUp, Users, ExternalLink, Zap, Target, Code, Heart, AlertTriangle, CheckCircle } from 'lucide-react'
import type { StartupKoreaAnalysis, FounderType } from '@/src/lib/startups/types'

interface StartupIdeaModalProps {
  isOpen: boolean
  onClose: () => void
  onStartBuilding: () => void
  startup: {
    id: string
    name: string
    tagline?: string | null
    description?: string | null
    logoUrl?: string | null
    websiteUrl?: string | null
    sourceUrl: string
    source: string
    upvotes: number
    category?: string[]
    koreaFitScore?: number | null
    finalScore?: number | null
    koreaDeepAnalysis?: StartupKoreaAnalysis | null
  }
}

const FOUNDER_TYPE_CONFIG: Record<FounderType, { icon: React.ReactNode; label: string; desc: string }> = {
  'Blitz Builder': {
    icon: <Zap size={16} />,
    label: '빠른 실행형',
    desc: '빠른 MVP 구축과 실행력이 중요',
  },
  'Market Sniper': {
    icon: <Target size={16} />,
    label: '시장 분석형',
    desc: '시장 분석과 타겟팅이 핵심',
  },
  'Tech Pioneer': {
    icon: <Code size={16} />,
    label: '기술 선도형',
    desc: '기술적 차별화가 필요',
  },
  'Community Builder': {
    icon: <Heart size={16} />,
    label: '커뮤니티 구축형',
    desc: '네트워크 효과가 중요',
  },
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-status-success-text'
  if (score >= 60) return 'text-txt-primary'
  if (score >= 40) return 'text-status-warning-text'
  return 'text-status-danger-text'
}

function getDifficultyConfig(difficulty: 'easy' | 'medium' | 'hard') {
  switch (difficulty) {
    case 'easy':
      return { label: '쉬움', desc: '빠르게 진입 가능', color: 'text-status-success-text bg-status-success-bg border-status-success-text/20' }
    case 'medium':
      return { label: '보통', desc: '적절한 준비 필요', color: 'text-txt-secondary bg-surface-sunken border-border' }
    case 'hard':
      return { label: '어려움', desc: '높은 진입 장벽', color: 'text-status-danger-text bg-status-danger-bg border-status-danger-text/20' }
  }
}

export const StartupIdeaModal: React.FC<StartupIdeaModalProps> = ({
  isOpen,
  onClose,
  onStartBuilding,
  startup,
}) => {
  if (!isOpen) return null

  const analysis = startup.koreaDeepAnalysis
  const hasAnalysis = !!analysis

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface-card shadow-brutal w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-border-strong">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border-strong">
          <div className="flex items-center gap-4">
            {startup.logoUrl ? (
              <img
                src={startup.logoUrl}
                alt={startup.name}
                className="w-14 h-14 object-cover bg-surface-sunken flex-shrink-0 border border-border"
              />
            ) : (
              <div className="w-14 h-14 bg-surface-sunken border border-border-strong flex items-center justify-center">
                <Globe size={24} className="text-txt-disabled" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-txt-primary">{startup.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs font-mono text-txt-disabled uppercase">
                  {startup.source === 'producthunt' ? 'Product Hunt' : startup.source === 'ycombinator' ? 'Y Combinator' : startup.source}
                </span>
                <span className="flex items-center gap-1 text-xs font-mono text-txt-tertiary">
                  <TrendingUp size={12} />
                  {startup.upvotes.toLocaleString()} upvotes
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-sunken transition-colors border border-transparent hover:border-border"
          >
            <X size={20} className="text-txt-disabled" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {hasAnalysis ? (
            <>
              {/* 한국어 요약 */}
              <div>
                <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-2">서비스 요약</h3>
                <p className="text-txt-primary leading-relaxed">{analysis.korean_summary}</p>
              </div>

              {/* 점수 카드 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-surface-sunken border border-border-strong p-4">
                  <div className="text-[0.625rem] font-mono text-txt-disabled uppercase mb-1">한국 적합도</div>
                  <div className={`text-3xl font-bold ${getScoreColor(analysis.korea_fit_score)}`}>
                    {analysis.korea_fit_score}
                  </div>
                </div>
                <div className="bg-surface-sunken border border-border-strong p-4">
                  <div className="text-[0.625rem] font-mono text-txt-disabled uppercase mb-1">종합 점수</div>
                  <div className="text-3xl font-bold text-txt-primary">
                    {startup.finalScore || '-'}
                  </div>
                </div>
                <div className={`border p-4 ${getDifficultyConfig(analysis.difficulty).color}`}>
                  <div className="text-[0.625rem] font-mono uppercase mb-1 opacity-70">진입 난이도</div>
                  <div className="text-lg font-bold">
                    {getDifficultyConfig(analysis.difficulty).label}
                  </div>
                  <div className="text-xs mt-0.5 opacity-70">
                    {getDifficultyConfig(analysis.difficulty).desc}
                  </div>
                </div>
              </div>

              {/* 문제 & 비즈니스 모델 */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-2">해결하는 문제</h3>
                  <p className="text-sm text-txt-secondary leading-relaxed">{analysis.problem}</p>
                </div>
                <div>
                  <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-2">비즈니스 모델</h3>
                  <p className="text-sm text-txt-secondary leading-relaxed">{analysis.business_model}</p>
                </div>
              </div>

              {/* 한국 시장 분석 */}
              <div className="bg-surface-sunken border border-border-strong p-5">
                <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3">한국 시장 분석</h3>
                <p className="text-sm text-txt-secondary leading-relaxed mb-4">{analysis.korea_fit_reason}</p>

                {analysis.korea_exists && analysis.korea_competitors.length > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-surface-card border border-border-strong">
                    <AlertTriangle size={16} className="text-yellow-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-txt-primary mb-1">국내 경쟁 서비스 존재</div>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.korea_competitors.map((comp) => (
                          <span key={comp} className="text-xs bg-surface-sunken text-txt-secondary px-2 py-0.5 border border-border">
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {!analysis.korea_exists && (
                  <div className="flex items-start gap-2 p-3 bg-status-success-bg border border-status-success-text/20">
                    <CheckCircle size={16} className="text-status-success-text mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-status-success-text">유사 서비스 없음</div>
                      <div className="text-xs text-status-success-text mt-0.5">한국 시장에 직접 경쟁자가 없습니다</div>
                    </div>
                  </div>
                )}
              </div>

              {/* 현지화 포인트 */}
              <div>
                <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-2">현지화 포인트</h3>
                <p className="text-sm text-txt-secondary leading-relaxed">{analysis.suggested_localization}</p>
              </div>

              {/* 추천 파운더 유형 */}
              <div>
                <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3">추천 파운더 유형</h3>
                <div className="grid grid-cols-2 gap-3">
                  {analysis.target_founder_type.map((type) => {
                    const config = FOUNDER_TYPE_CONFIG[type]
                    if (!config) return null
                    return (
                      <div key={type} className="flex items-center gap-3 p-3 bg-surface-sunken border border-border-strong">
                        <div className="w-10 h-10 bg-black text-white flex items-center justify-center">
                          {config.icon}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-txt-primary">{config.label}</div>
                          <div className="text-xs text-txt-tertiary">{config.desc}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 태그 */}
              {analysis.tags.length > 0 && (
                <div>
                  <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-2">관련 태그</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.tags.map((tag) => (
                      <span key={tag} className="text-xs font-mono bg-surface-sunken text-txt-secondary px-2 py-1 border border-border">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Globe className="mx-auto mb-4 text-txt-disabled" size={48} />
              <p className="text-txt-tertiary">아직 분석되지 않은 스타트업입니다</p>
              <p className="text-txt-disabled text-sm mt-1">{startup.tagline}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border-strong bg-surface-sunken">
          <div className="flex items-center gap-4">
            <a
              href={startup.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-txt-tertiary hover:text-txt-primary transition-colors"
            >
              <ExternalLink size={14} />
              원본 보기
            </a>
            {startup.websiteUrl && (
              <a
                href={startup.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-txt-tertiary hover:text-txt-primary transition-colors"
              >
                <Globe size={14} />
                웹사이트
              </a>
            )}
          </div>

          <button
            onClick={onStartBuilding}
            className="px-6 py-2.5 bg-black text-white text-sm font-bold hover:bg-[#333] transition-colors flex items-center gap-2 border border-black shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            이 아이디어로 빌딩 시작
            <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default StartupIdeaModal
