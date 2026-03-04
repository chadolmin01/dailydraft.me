'use client'

import React, { useMemo } from 'react'
import {
  AlertTriangle,
  CheckCircle,
  Info,
  TrendingUp,
  Lightbulb,
} from 'lucide-react'
import { ValidationCheckResult } from '../../src/hooks/useRealtimeValidation'
import { RejectionWarning } from '../../src/lib/rejectionPatterns'

interface InlineFeedbackProps {
  text: string
  fieldId: string
  checks?: ValidationCheckResult[]
  warnings?: RejectionWarning[]
  potentialScore?: number
  showScoreGain?: boolean
}

// Inline feedback bar that appears below text fields
export const InlineFeedbackBar: React.FC<InlineFeedbackProps> = ({
  text,
  fieldId,
  checks = [],
  warnings = [],
  potentialScore,
  showScoreGain = true,
}) => {
  const failedChecks = checks.filter(c => !c.passed)
  const highWarnings = warnings.filter(w => w.match.severity === 'high')
  const mediumWarnings = warnings.filter(w => w.match.severity === 'medium')

  const totalPotentialGain = useMemo(() => {
    return failedChecks.reduce((sum, c) => sum + (c.potentialGain || 0), 0)
  }, [failedChecks])

  // Calculate status
  const status = useMemo(() => {
    if (highWarnings.length > 0) {
      return {
        type: 'error' as const,
        message: `심각한 문제 ${highWarnings.length}개 발견`,
        color: 'text-red-600 bg-red-50 border-red-100',
        icon: <AlertTriangle size={12} className="text-red-500" />,
      }
    }
    if (mediumWarnings.length > 0 || failedChecks.length > 0) {
      return {
        type: 'warning' as const,
        message: `개선 필요 ${(mediumWarnings.length + failedChecks.length)}개`,
        color: 'text-yellow-700 bg-yellow-50 border-yellow-100',
        icon: <Info size={12} className="text-yellow-500" />,
      }
    }
    if (text.length < 50) {
      return {
        type: 'info' as const,
        message: '더 자세히 작성해주세요',
        color: 'text-gray-600 bg-gray-50 border-gray-100',
        icon: <Lightbulb size={12} className="text-gray-400" />,
      }
    }
    return {
      type: 'success' as const,
      message: '잘 작성되었습니다',
      color: 'text-green-600 bg-green-50 border-green-100',
      icon: <CheckCircle size={12} className="text-green-500" />,
    }
  }, [highWarnings, mediumWarnings, failedChecks, text])

  // Don't show if empty
  if (!text || text.length === 0) return null

  return (
    <div className={`flex items-center justify-between px-3 py-1.5 border-t ${status.color} text-xs`}>
      <div className="flex items-center gap-2">
        {status.icon}
        <span className="font-medium">{status.message}</span>
      </div>

      {showScoreGain && totalPotentialGain > 0 && (
        <div className="flex items-center gap-1 text-green-600">
          <TrendingUp size={12} />
          <span className="font-medium">수정 시 +{totalPotentialGain}점</span>
        </div>
      )}
    </div>
  )
}

// Feedback tooltip for specific issues
interface FeedbackTooltipProps {
  feedback: string
  severity: 'high' | 'medium' | 'low'
  suggestion?: string
  potentialGain?: number
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export const FeedbackTooltip: React.FC<FeedbackTooltipProps> = ({
  feedback,
  severity,
  suggestion,
  potentialGain,
  position = 'top',
}) => {
  const severityConfig = {
    high: {
      bg: 'bg-red-900',
      badge: 'bg-red-500',
      text: '심각',
    },
    medium: {
      bg: 'bg-yellow-900',
      badge: 'bg-yellow-500',
      text: '주의',
    },
    low: {
      bg: 'bg-gray-800',
      badge: 'bg-gray-500',
      text: '참고',
    },
  }

  const config = severityConfig[severity]

  const positionClasses = {
    top: 'bottom-full left-0 mb-2',
    bottom: 'top-full left-0 mt-2',
    left: 'right-full top-0 mr-2',
    right: 'left-full top-0 ml-2',
  }

  return (
    <div className={`absolute ${positionClasses[position]} z-50 w-72 animate-in fade-in duration-150`}>
      <div className={`${config.bg} rounded-lg shadow-xl p-3 text-white`}>
        <div className="flex items-start gap-2">
          <span className={`px-1.5 py-0.5 ${config.badge} text-[10px] font-bold rounded`}>
            {config.text}
          </span>
          {potentialGain && (
            <span className="px-1.5 py-0.5 bg-green-500 text-[10px] font-bold rounded">
              +{potentialGain}점
            </span>
          )}
        </div>

        <p className="mt-2 text-sm leading-relaxed opacity-90">{feedback}</p>

        {suggestion && (
          <div className="mt-2 pt-2 border-t border-white/20">
            <div className="text-[10px] uppercase opacity-60 mb-1">수정 제안</div>
            <p className="text-sm opacity-90">{suggestion}</p>
          </div>
        )}
      </div>

      {/* Arrow */}
      <div
        className={`absolute w-3 h-3 ${config.bg} transform rotate-45 ${
          position === 'top' ? 'bottom-0 left-6 translate-y-1/2' :
          position === 'bottom' ? 'top-0 left-6 -translate-y-1/2' :
          position === 'left' ? 'right-0 top-3 translate-x-1/2' :
          'left-0 top-3 -translate-x-1/2'
        }`}
      />
    </div>
  )
}

// Highlight item type
export interface HighlightItem {
  start: number
  end: number
  type: 'error' | 'warning' | 'info'
  tooltip?: string
}

// Text with inline highlights
interface HighlightedTextProps {
  text: string
  highlights: HighlightItem[]
  onHighlightClick?: (highlight: HighlightItem) => void
}

export const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  highlights,
  onHighlightClick,
}) => {
  // Sort highlights by start position
  const sortedHighlights = useMemo(() =>
    [...highlights].sort((a, b) => a.start - b.start),
    [highlights]
  )

  // Build segments
  const segments = useMemo(() => {
    const result: Array<{
      text: string
      highlight?: typeof highlights[0]
    }> = []

    let lastEnd = 0

    for (const highlight of sortedHighlights) {
      // Add non-highlighted text before this highlight
      if (highlight.start > lastEnd) {
        result.push({
          text: text.substring(lastEnd, highlight.start),
        })
      }

      // Add highlighted segment
      result.push({
        text: text.substring(highlight.start, highlight.end),
        highlight,
      })

      lastEnd = highlight.end
    }

    // Add remaining text
    if (lastEnd < text.length) {
      result.push({
        text: text.substring(lastEnd),
      })
    }

    return result
  }, [text, sortedHighlights])

  const highlightClasses = {
    error: 'bg-red-100 border-b-2 border-red-400 hover:bg-red-200 cursor-pointer',
    warning: 'bg-yellow-100 border-b-2 border-yellow-400 hover:bg-yellow-200 cursor-pointer',
    info: 'bg-blue-100 border-b-2 border-blue-400 hover:bg-blue-200 cursor-pointer',
  }

  return (
    <span>
      {segments.map((segment, idx) => {
        if (segment.highlight) {
          return (
            <span
              key={idx}
              className={`relative ${highlightClasses[segment.highlight.type]}`}
              onClick={() => onHighlightClick?.(segment.highlight!)}
              title={segment.highlight.tooltip}
            >
              {segment.text}
            </span>
          )
        }
        return <span key={idx}>{segment.text}</span>
      })}
    </span>
  )
}

// Quick fix button that appears inline
interface QuickFixButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'xs'
}

export const QuickFixButton: React.FC<QuickFixButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
  size = 'sm',
}) => {
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  }

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs',
    xs: 'px-2 py-0.5 text-[10px]',
  }

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 font-medium rounded transition-colors ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      <Lightbulb size={size === 'sm' ? 12 : 10} />
      {label}
    </button>
  )
}

// Summary card for section feedback
interface SectionFeedbackSummaryProps {
  sectionName: string
  score: number
  maxScore: number
  passedChecks: number
  totalChecks: number
  topIssue?: string
  potentialGain?: number
}

export const SectionFeedbackSummary: React.FC<SectionFeedbackSummaryProps> = ({
  sectionName,
  score,
  maxScore,
  passedChecks,
  totalChecks,
  topIssue,
  potentialGain,
}) => {
  const percentage = Math.round((score / maxScore) * 100)

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
          percentage >= 80 ? 'bg-green-100 text-green-700' :
          percentage >= 60 ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {score}
        </div>

        <div>
          <div className="text-sm font-medium text-gray-800">{sectionName}</div>
          <div className="text-xs text-gray-500">
            {passedChecks}/{totalChecks} 항목 충족
          </div>
        </div>
      </div>

      <div className="text-right">
        {topIssue && (
          <div className="text-xs text-gray-500 max-w-[150px] truncate">{topIssue}</div>
        )}
        {potentialGain && potentialGain > 0 && (
          <div className="text-xs font-medium text-green-600">+{potentialGain}점 가능</div>
        )}
      </div>
    </div>
  )
}

export default InlineFeedbackBar
