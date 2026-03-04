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
  problem: '❓',
  solution: '💡',
  scaleup: '📈',
  team: '👥',
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
      <div className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    )
  }

  const { totalScore, maxScore, percentage, passingScore, sections, topImprovements } = validationResult

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
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
            <span className="text-sm font-semibold text-gray-700">전체 점수</span>
            {isValidating && (
              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded-full">
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
            <span className="text-lg text-gray-400">/{maxScore}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
          {/* Passing threshold marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-10"
            style={{ left: `${passingScore}%` }}
          />
          <div
            className="absolute -top-1 text-[8px] font-mono text-gray-500 z-10"
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
          <span className="text-gray-500">{percentage}%</span>
        </div>
      </div>

      {/* Section Scores */}
      <div className="p-4 border-b border-gray-100">
        <h4 className="text-[10px] font-bold font-mono text-gray-400 uppercase tracking-wider mb-3">
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
          <h4 className="text-[10px] font-bold font-mono text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
            <Zap size={12} className="text-yellow-500" />
            점수 향상 팁
          </h4>

          <div className="space-y-2">
            {topImprovements.slice(0, 3).map((improvement, idx) => (
              <button
                key={`${improvement.section}-${improvement.checkId}`}
                onClick={() => onImprovementClick?.(improvement)}
                className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <div className="flex items-start gap-2">
                  <div className={`shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    improvement.priority === 'high' ? 'bg-red-100 text-red-600' :
                    improvement.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    +{improvement.potentialGain}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-mono text-gray-400 uppercase">
                        {SECTION_NAMES[improvement.section]}
                      </span>
                      <span className="text-[10px] text-gray-400">•</span>
                      <span className="text-xs font-medium text-gray-700">
                        {improvement.checkName}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {improvement.feedback}
                    </p>
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0"
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
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{SECTION_ICONS[sectionType]}</span>
          <div className="text-left">
            <div className="text-sm font-medium text-gray-800">
              {SECTION_NAMES[sectionType]}
            </div>
            <div className="text-[10px] text-gray-400">
              {checks.filter(c => c.passed).length}/{checks.length} 항목 충족
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mini progress bar */}
          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
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
            <ChevronDown size={16} className="text-gray-400" />
          ) : (
            <ChevronRight size={16} className="text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded Check Details */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-100 bg-gray-50">
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
                    <span className={check.passed ? 'text-gray-700' : 'text-gray-500'}>
                      {check.name}
                    </span>
                    {!check.passed && check.potentialGain && (
                      <span className="text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                        +{check.potentialGain}점
                      </span>
                    )}
                  </div>
                  {!check.passed && check.feedback && (
                    <p className="text-gray-400 mt-0.5">{check.feedback}</p>
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
            className="mt-3 w-full py-2 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
          >
            이 섹션 편집하기 →
          </button>
        </div>
      )}
    </div>
  )
}

export default RealtimeScorePanel
