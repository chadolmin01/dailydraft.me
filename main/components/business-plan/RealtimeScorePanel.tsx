'use client'

import React, { useState, useMemo } from 'react'
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Zap,
  Target,
  Info,
} from 'lucide-react'
import {
  RealtimeValidationResult,
  SectionValidationResult,
  ImprovementItem,
} from '../../src/hooks/useRealtimeValidation'
import { PsstSectionType } from '../../src/types/business-plan'

interface RealtimeScorePanelProps {
  validationResult: RealtimeValidationResult | null
  isValidating: boolean
  onSectionClick?: (section: PsstSectionType) => void
  onImprovementClick?: (improvement: ImprovementItem) => void
}

const SECTION_NAMES: Record<PsstSectionType, string> = {
  problem: 'Problem',
  solution: 'Solution',
  scaleup: 'Scale-up',
  team: 'Team',
}

const SECTION_ICONS: Record<PsstSectionType, string> = {
  problem: '?',
  solution: '!',
  scaleup: '^',
  team: '&',
}

export const RealtimeScorePanel: React.FC<RealtimeScorePanelProps> = ({
  validationResult,
  isValidating,
  onSectionClick,
  onImprovementClick,
}) => {
  const [expandedSection, setExpandedSection] = useState<PsstSectionType | null>(null)

  const scoreStatus = useMemo(() => {
    if (!validationResult) return { color: 'gray', label: '평가 중', icon: null }
    const { percentage, passingScore } = validationResult

    if (percentage >= 90) {
      return { color: 'green', label: '우수', icon: <CheckCircle2 className="text-green-500" size={18} /> }
    } else if (percentage >= passingScore) {
      return { color: 'blue', label: '합격선', icon: <Target className="text-blue-500" size={18} /> }
    } else if (percentage >= 50) {
      return { color: 'yellow', label: '개선 필요', icon: <AlertTriangle className="text-yellow-500" size={18} /> }
    } else {
      return { color: 'red', label: '보완 필수', icon: <AlertTriangle className="text-red-500" size={18} /> }
    }
  }, [validationResult])

  const toggleSection = (section: PsstSectionType) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  if (!validationResult) {
    return (
      <div className="bg-surface-card border border-border p-4 animate-pulse">
        <div className="h-6 bg-surface-sunken w-1/2 mb-4"></div>
        <div className="h-4 bg-surface-sunken w-full mb-2"></div>
        <div className="h-4 bg-surface-sunken w-3/4"></div>
      </div>
    )
  }

  const { totalScore, maxScore, percentage, passingScore, sections, topImprovements } = validationResult

  return (
    <div className="bg-surface-card border border-border overflow-hidden">
      {/* Header - Overall Score */}
      <div className={`p-4 ${
        percentage >= 90 ? 'bg-green-50 border-b border-green-100' :
        percentage >= passingScore ? 'bg-blue-50 border-b border-blue-100' :
        percentage >= 50 ? 'bg-yellow-50 border-b border-yellow-100' :
        'bg-red-50 border-b border-red-100'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {scoreStatus.icon}
            <span className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-secondary">전체 점수</span>
            {isValidating && (
              <span className="inline-flex items-center px-2 py-0.5 text-[0.625rem] font-medium bg-surface-sunken text-txt-secondary">
                <span className="animate-pulse">분석 중...</span>
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-bold ${
              percentage >= passingScore ? 'text-green-600' : 'text-red-600'
            }`}>
              {totalScore}
            </span>
            <span className="text-lg text-txt-tertiary">/{maxScore}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 bg-surface-sunken overflow-hidden">
          {/* Passing threshold marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-txt-tertiary z-10"
            style={{ left: `${passingScore}%` }}
          />
          <div
            className="absolute -top-1 text-[0.5rem] font-mono text-txt-tertiary z-10"
            style={{ left: `${passingScore}%`, transform: 'translateX(-50%)' }}
          >
            합격선 {passingScore}
          </div>

          {/* Score bar */}
          <div
            className={`h-full transition-all duration-500 ease-out ${
              percentage >= 90 ? 'bg-green-500' :
              percentage >= passingScore ? 'bg-blue-500' :
              percentage >= 50 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="mt-2 flex justify-between text-xs">
          <span className={`font-medium ${
            percentage >= passingScore ? 'text-green-600' : 'text-red-600'
          }`}>
            {percentage >= passingScore ? '합격 기준 충족' : `합격까지 ${passingScore - percentage}점 필요`}
          </span>
          <span className="text-txt-tertiary">{percentage}%</span>
        </div>
      </div>

      {/* Section Scores */}
      <div className="p-4 border-b border-border-subtle">
        <h4 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3">
          섹션별 점수
        </h4>

        <div className="space-y-2">
          {sections.map((section) => (
            <SectionScoreRow
              key={section.section}
              section={section}
              isExpanded={expandedSection === section.section}
              onToggle={() => toggleSection(section.section)}
              onClick={() => onSectionClick?.(section.section)}
            />
          ))}
        </div>
      </div>

      {/* Top Improvements */}
      {topImprovements.length > 0 && (
        <div className="p-4">
          <h4 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3 flex items-center gap-1">
            <Zap size={12} className="text-yellow-500" />
            점수 향상 팁
          </h4>

          <div className="space-y-2">
            {topImprovements.slice(0, 3).map((improvement, idx) => (
              <button
                key={`${improvement.section}-${improvement.checkId}`}
                onClick={() => onImprovementClick?.(improvement)}
                className="w-full text-left p-3 bg-surface-sunken hover:bg-surface-card border border-transparent hover:border-border transition-colors group"
              >
                <div className="flex items-start gap-2">
                  <div className={`shrink-0 mt-0.5 w-5 h-5 flex items-center justify-center text-[0.625rem] font-bold ${
                    improvement.priority === 'high' ? 'bg-red-100 text-red-600' :
                    improvement.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-surface-sunken text-txt-secondary'
                  }`}>
                    +{improvement.potentialGain}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[0.625rem] font-mono text-txt-tertiary uppercase">
                        {SECTION_NAMES[improvement.section]}
                      </span>
                      <span className="text-[0.625rem] text-txt-tertiary">•</span>
                      <span className="text-xs font-medium text-txt-secondary">
                        {improvement.checkName}
                      </span>
                    </div>
                    <p className="text-xs text-txt-tertiary line-clamp-2">
                      {improvement.feedback}
                    </p>
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-txt-disabled group-hover:text-txt-tertiary transition-colors shrink-0"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Section Score Row Component
interface SectionScoreRowProps {
  section: SectionValidationResult
  isExpanded: boolean
  onToggle: () => void
  onClick: () => void
}

const SectionScoreRow: React.FC<SectionScoreRowProps> = ({
  section,
  isExpanded,
  onToggle,
  onClick,
}) => {
  const { section: sectionType, score, maxScore, percentage, checks } = section

  return (
    <div className="border border-border-subtle overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-surface-sunken transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-bold">{SECTION_ICONS[sectionType]}</span>
          <div className="text-left">
            <div className="text-sm font-medium text-txt-primary">
              {SECTION_NAMES[sectionType]}
            </div>
            <div className="text-[0.625rem] text-txt-tertiary">
              {checks.filter(c => c.passed).length}/{checks.length} 항목 충족
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mini progress bar */}
          <div className="w-20 h-2 bg-surface-sunken overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                percentage >= 80 ? 'bg-green-500' :
                percentage >= 60 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          <span className={`text-sm font-bold ${
            percentage >= 80 ? 'text-green-600' :
            percentage >= 60 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {score}/{maxScore}
          </span>

          {isExpanded ? (
            <ChevronDown size={16} className="text-txt-tertiary" />
          ) : (
            <ChevronRight size={16} className="text-txt-tertiary" />
          )}
        </div>
      </button>

      {/* Expanded Check Details */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-border-subtle bg-surface-sunken">
          <div className="space-y-1.5">
            {checks.map((check) => (
              <div
                key={check.id}
                className="flex items-start gap-2 text-xs py-1"
              >
                {check.passed ? (
                  <CheckCircle2 size={14} className="text-green-500 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={check.passed ? 'text-txt-secondary' : 'text-txt-tertiary'}>
                      {check.name}
                    </span>
                    {!check.passed && check.potentialGain && (
                      <span className="text-[0.625rem] font-medium text-green-600 bg-green-50 px-1.5 py-0.5">
                        +{check.potentialGain}점
                      </span>
                    )}
                  </div>
                  {!check.passed && check.feedback && (
                    <p className="text-txt-tertiary mt-0.5">{check.feedback}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
            className="mt-3 w-full py-2 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
          >
            이 섹션 편집하기 →
          </button>
        </div>
      )}
    </div>
  )
}

export default RealtimeScorePanel
