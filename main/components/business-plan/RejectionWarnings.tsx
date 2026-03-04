'use client'

import React, { useState, useMemo } from 'react'
import {
  AlertTriangle,
  X,
  ChevronDown,
  ChevronRight,
  Wand2,
  ExternalLink,
  Info,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import {
  RejectionWarning,
  checkRejectionPatterns,
  countWarningsBySeverity,
} from '../../src/lib/rejectionPatterns'
import { getSuggestedSources } from '../../src/lib/autoCorrection'

interface RejectionWarningsProps {
  text: string
  section?: string
  onAutoFix?: (patternId: string, suggestedFix: string) => void
  onDismiss?: (patternId: string) => void
  compact?: boolean
}

export const RejectionWarnings: React.FC<RejectionWarningsProps> = ({
  text,
  section,
  onAutoFix,
  onDismiss,
  compact = false,
}) => {
  const [dismissedPatterns, setDismissedPatterns] = useState<Set<string>>(new Set())
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null)

  const warnings = useMemo(() => {
    const allWarnings = checkRejectionPatterns(text, { section })
    return allWarnings.filter(w => !dismissedPatterns.has(w.pattern.id))
  }, [text, section, dismissedPatterns])

  const severityCounts = useMemo(() => countWarningsBySeverity(warnings), [warnings])

  const handleDismiss = (patternId: string) => {
    setDismissedPatterns(prev => new Set([...prev, patternId]))
    onDismiss?.(patternId)
  }

  const handleAutoFix = (warning: RejectionWarning) => {
    if (warning.suggestedFix) {
      onAutoFix?.(warning.pattern.id, warning.suggestedFix)
    }
  }

  if (warnings.length === 0) {
    return null
  }

  if (compact) {
    return (
      <CompactWarningBadge
        warnings={warnings}
        severityCounts={severityCounts}
      />
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className={`p-3 flex items-center justify-between ${
        severityCounts.high > 0 ? 'bg-red-50 border-b border-red-100' :
        severityCounts.medium > 0 ? 'bg-yellow-50 border-b border-yellow-100' :
        'bg-gray-50 border-b border-gray-100'
      }`}>
        <div className="flex items-center gap-2">
          <AlertTriangle
            size={16}
            className={
              severityCounts.high > 0 ? 'text-red-500' :
              severityCounts.medium > 0 ? 'text-yellow-500' :
              'text-gray-400'
            }
          />
          <span className="text-sm font-semibold text-gray-700">
            탈락 위험 요소 {warnings.length}개 발견
          </span>
        </div>

        <div className="flex items-center gap-2">
          {severityCounts.high > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">
              심각 {severityCounts.high}
            </span>
          )}
          {severityCounts.medium > 0 && (
            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded-full">
              주의 {severityCounts.medium}
            </span>
          )}
        </div>
      </div>

      {/* Warnings List */}
      <div className="divide-y divide-gray-100">
        {warnings.map((warning) => (
          <WarningItem
            key={warning.pattern.id}
            warning={warning}
            section={section}
            isExpanded={expandedPattern === warning.pattern.id}
            onToggle={() => setExpandedPattern(
              expandedPattern === warning.pattern.id ? null : warning.pattern.id
            )}
            onAutoFix={() => handleAutoFix(warning)}
            onDismiss={() => handleDismiss(warning.pattern.id)}
          />
        ))}
      </div>
    </div>
  )
}

// Individual Warning Item
interface WarningItemProps {
  warning: RejectionWarning
  section?: string
  isExpanded: boolean
  onToggle: () => void
  onAutoFix: () => void
  onDismiss: () => void
}

const WarningItem: React.FC<WarningItemProps> = ({
  warning,
  section,
  isExpanded,
  onToggle,
  onAutoFix,
  onDismiss,
}) => {
  const { pattern, match, autoFixAvailable, suggestedFix } = warning

  const severityConfig = {
    high: {
      icon: <XCircle size={16} className="text-red-500" />,
      badge: 'bg-red-100 text-red-700',
      bg: 'hover:bg-red-50',
    },
    medium: {
      icon: <AlertTriangle size={16} className="text-yellow-500" />,
      badge: 'bg-yellow-100 text-yellow-700',
      bg: 'hover:bg-yellow-50',
    },
    low: {
      icon: <Info size={16} className="text-gray-400" />,
      badge: 'bg-gray-100 text-gray-600',
      bg: 'hover:bg-gray-50',
    },
  }

  const config = severityConfig[match.severity]

  return (
    <div className="group">
      <button
        onClick={onToggle}
        className={`w-full p-3 text-left transition-colors ${config.bg}`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">{config.icon}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-gray-800">
                {pattern.name}
              </span>
              {match.count > 1 && (
                <span className="text-[10px] font-medium text-gray-500">
                  ({match.count}회 감지)
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 line-clamp-2">
              {pattern.feedback}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {autoFixAvailable && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-medium rounded">
                자동 수정 가능
              </span>
            )}
            {isExpanded ? (
              <ChevronDown size={16} className="text-gray-400" />
            ) : (
              <ChevronRight size={16} className="text-gray-400" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-100">
          {/* Matched Text */}
          {match.matches.length > 0 && (
            <div className="mb-3">
              <div className="text-[10px] font-mono text-gray-400 uppercase mb-1">
                감지된 표현
              </div>
              <div className="flex flex-wrap gap-1.5">
                {match.matches.slice(0, 5).map((m, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700 font-mono"
                  >
                    "{m}"
                  </span>
                ))}
                {match.matches.length > 5 && (
                  <span className="px-2 py-1 text-xs text-gray-500">
                    외 {match.matches.length - 5}개
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Auto Fix Suggestion */}
          {autoFixAvailable && suggestedFix && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="text-[10px] font-mono text-blue-600 uppercase mb-1.5">
                수정 제안
              </div>
              <p className="text-xs text-blue-800">{suggestedFix}</p>
            </div>
          )}

          {/* Source Suggestions for missing source pattern */}
          {pattern.id === 'MISSING_SOURCE' && (
            <div className="mb-3">
              <div className="text-[10px] font-mono text-gray-400 uppercase mb-1.5">
                추천 출처
              </div>
              <div className="space-y-1">
                {getSuggestedSources(section || '시장').slice(0, 3).map((source, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs text-gray-600"
                  >
                    <ExternalLink size={12} className="text-gray-400" />
                    {source}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-3">
            {autoFixAvailable && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAutoFix()
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
              >
                <Wand2 size={12} />
                자동 수정
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDismiss()
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded hover:bg-gray-50 transition-colors"
            >
              <X size={12} />
              무시
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Compact Badge for inline use
interface CompactWarningBadgeProps {
  warnings: RejectionWarning[]
  severityCounts: { high: number; medium: number; low: number; total: number }
}

const CompactWarningBadge: React.FC<CompactWarningBadgeProps> = ({
  warnings,
  severityCounts,
}) => {
  if (severityCounts.total === 0) return null

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
      severityCounts.high > 0 ? 'bg-red-100 text-red-700' :
      severityCounts.medium > 0 ? 'bg-yellow-100 text-yellow-700' :
      'bg-gray-100 text-gray-600'
    }`}>
      <AlertTriangle size={12} />
      <span>{severityCounts.total}개 위험 요소</span>
    </div>
  )
}

// Inline Warning Highlight (for use in editor)
interface InlineWarningHighlightProps {
  text: string
  start: number
  end: number
  patternId: string
  severity: 'high' | 'medium' | 'low'
  feedback: string
}

export const InlineWarningHighlight: React.FC<InlineWarningHighlightProps> = ({
  text,
  start,
  end,
  patternId,
  severity,
  feedback,
}) => {
  const [showTooltip, setShowTooltip] = useState(false)

  const highlightClass = {
    high: 'bg-red-100 border-b-2 border-red-400',
    medium: 'bg-yellow-100 border-b-2 border-yellow-400',
    low: 'bg-gray-100 border-b-2 border-gray-400',
  }

  return (
    <span
      className={`relative cursor-help ${highlightClass[severity]}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {text.substring(start, end)}
      {showTooltip && (
        <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-50">
          <div className="font-medium mb-1">
            {severity === 'high' ? '심각한 문제' : severity === 'medium' ? '개선 필요' : '참고 사항'}
          </div>
          <p className="opacity-80">{feedback}</p>
          <div className="absolute left-4 bottom-0 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900" />
        </div>
      )}
    </span>
  )
}

export default RejectionWarnings
