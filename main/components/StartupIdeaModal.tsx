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
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-gray-900'
  if (score >= 40) return 'text-yellow-600'
  return 'text-red-600'
}

function getDifficultyConfig(difficulty: 'easy' | 'medium' | 'hard') {
  switch (difficulty) {
    case 'easy':
      return { label: '쉬움', desc: '빠르게 진입 가능', color: 'text-green-600 bg-green-50 border-green-200' }
    case 'medium':
      return { label: '보통', desc: '적절한 준비 필요', color: 'text-gray-600 bg-gray-50 border-gray-200' }
    case 'hard':
      return { label: '어려움', desc: '높은 진입 장벽', color: 'text-red-600 bg-red-50 border-red-200' }
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
      <div className="relative bg-white rounded-sm shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            {startup.logoUrl ? (
              <img
                src={startup.logoUrl}
                alt={startup.name}
                className="w-14 h-14 rounded-sm object-cover bg-gray-100 border border-gray-100"
              />
            ) : (
              <div className="w-14 h-14 rounded-sm bg-gray-100 border border-gray-200 flex items-center justify-center">
                <Globe size={24} className="text-gray-400" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900">{startup.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs font-mono text-gray-400 uppercase">
                  {startup.source === 'producthunt' ? 'Product Hunt' : startup.source === 'ycombinator' ? 'Y Combinator' : startup.source}
                </span>
                <span className="flex items-center gap-1 text-xs font-mono text-gray-500">
                  <TrendingUp size={12} />
                  {startup.upvotes.toLocaleString()} upvotes
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-sm transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {hasAnalysis ? (
            <>
              {/* 한국어 요약 */}
              <div>
                <h3 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">서비스 요약</h3>
                <p className="text-gray-900 leading-relaxed">{analysis.korean_summary}</p>
              </div>

              {/* 점수 카드 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 border border-gray-100 rounded-sm p-4">
                  <div className="text-[10px] font-mono text-gray-400 uppercase mb-1">한국 적합도</div>
                  <div className={`text-3xl font-bold ${getScoreColor(analysis.korea_fit_score)}`}>
                    {analysis.korea_fit_score}
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-sm p-4">
                  <div className="text-[10px] font-mono text-gray-400 uppercase mb-1">종합 점수</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {startup.finalScore || '-'}
                  </div>
                </div>
                <div className={`border rounded-sm p-4 ${getDifficultyConfig(analysis.difficulty).color}`}>
                  <div className="text-[10px] font-mono uppercase mb-1 opacity-70">진입 난이도</div>
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
                  <h3 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">해결하는 문제</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{analysis.problem}</p>
                </div>
                <div>
                  <h3 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">비즈니스 모델</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{analysis.business_model}</p>
                </div>
              </div>

              {/* 한국 시장 분석 */}
              <div className="bg-gray-50 border border-gray-100 rounded-sm p-5">
                <h3 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-3">한국 시장 분석</h3>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">{analysis.korea_fit_reason}</p>

                {analysis.korea_exists && analysis.korea_competitors.length > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-white border border-gray-200 rounded-sm">
                    <AlertTriangle size={16} className="text-yellow-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-gray-900 mb-1">국내 경쟁 서비스 존재</div>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.korea_competitors.map((comp) => (
                          <span key={comp} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-sm">
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {!analysis.korea_exists && (
                  <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-sm">
                    <CheckCircle size={16} className="text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-green-800">유사 서비스 없음</div>
                      <div className="text-xs text-green-700 mt-0.5">한국 시장에 직접 경쟁자가 없습니다</div>
                    </div>
                  </div>
                )}
              </div>

              {/* 현지화 포인트 */}
              <div>
                <h3 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">현지화 포인트</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{analysis.suggested_localization}</p>
              </div>

              {/* 추천 파운더 유형 */}
              <div>
                <h3 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-3">추천 파운더 유형</h3>
                <div className="grid grid-cols-2 gap-3">
                  {analysis.target_founder_type.map((type) => {
                    const config = FOUNDER_TYPE_CONFIG[type]
                    if (!config) return null
                    return (
                      <div key={type} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-sm">
                        <div className="w-10 h-10 bg-black text-white rounded-sm flex items-center justify-center">
                          {config.icon}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{config.label}</div>
                          <div className="text-xs text-gray-500">{config.desc}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 태그 */}
              {analysis.tags.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">관련 태그</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.tags.map((tag) => (
                      <span key={tag} className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded-sm border border-gray-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Globe className="mx-auto mb-4 text-gray-300" size={48} />
              <p className="text-gray-500">아직 분석되지 않은 스타트업입니다</p>
              <p className="text-gray-400 text-sm mt-1">{startup.tagline}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-4">
            <a
              href={startup.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ExternalLink size={14} />
              원본 보기
            </a>
            {startup.websiteUrl && (
              <a
                href={startup.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                <Globe size={14} />
                웹사이트
              </a>
            )}
          </div>

          <button
            onClick={onStartBuilding}
            className="px-6 py-2.5 bg-black text-white text-sm font-bold rounded-sm hover:bg-gray-800 transition-colors flex items-center gap-2"
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
