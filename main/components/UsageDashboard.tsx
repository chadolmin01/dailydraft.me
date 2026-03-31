'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
  Activity,
  Zap,
  FileText,
  Briefcase,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Crown,
  Loader2,
  RefreshCw,
} from 'lucide-react'

interface UsageData {
  plan: {
    type: string
    name: string
    nameKo: string
    status: string
    currentPeriodEnd: string | null
  }
  usage: {
    applications: {
      used: number
      limit: number
      remaining: number
      unlimited: boolean
    }
    opportunities: {
      used: number
      limit: number
      remaining: number
    }
    eventBookmarks: number
    eventApplications: number
    period: {
      start: string
      end: string
    }
  }
  apiUsage: {
    minute: { used: number; limit: number; remaining: number; resetAt: string }
    hour: { used: number; limit: number; remaining: number; resetAt: string }
    day: { used: number; limit: number; remaining: number; resetAt: string }
  }
  features: Record<string, unknown>
}

const planColors: Record<string, { bg: string; text: string; border: string }> = {
  free: { bg: 'bg-surface-sunken', text: 'text-txt-secondary', border: 'border-border' },
  pro: { bg: 'bg-brand-bg', text: 'text-brand', border: 'border-brand' },
  team: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-600' },
}

function ProgressBar({ used, limit, unlimited = false }: { used: number; limit: number; unlimited?: boolean }) {
  if (unlimited) {
    return (
      <div className="w-full h-2 bg-status-success-bg overflow-hidden">
        <div className="h-full bg-status-success-text w-full" />
      </div>
    )
  }

  const percentage = Math.min((used / limit) * 100, 100)
  const isWarning = percentage >= 80
  const isDanger = percentage >= 95

  return (
    <div className="w-full h-2 bg-surface-sunken overflow-hidden">
      <div
        className={`h-full transition-all duration-300 ${
          isDanger ? 'bg-indicator-alert' : isWarning ? 'bg-status-warning-text' : 'bg-status-info-text'
        }`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

function UsageCard({
  icon: Icon,
  title,
  used = 0,
  limit = 0,
  unlimited = false,
  suffix = '',
}: {
  icon: React.ElementType
  title: string
  used?: number
  limit?: number
  unlimited?: boolean
  suffix?: string
}) {
  const safeUsed = used ?? 0
  const safeLimit = limit ?? 0
  const remaining = unlimited ? -1 : safeLimit - safeUsed
  const percentage = unlimited || safeLimit === 0 ? 0 : Math.min((safeUsed / safeLimit) * 100, 100)
  const isWarning = percentage >= 80
  const isDanger = percentage >= 95

  return (
    <div className="bg-surface-card p-4 border border-border shadow-md hover:shadow-lg hover-spring">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 border ${isDanger ? 'border-status-danger-text bg-status-danger-bg' : isWarning ? 'border-status-warning-text bg-status-warning-bg' : 'border-brand bg-brand-bg'}`}>
          <Icon className={`w-5 h-5 ${isDanger ? 'text-status-danger-text' : isWarning ? 'text-status-warning-text' : 'text-brand'}`} />
        </div>
        <span className="font-medium text-txt-secondary">{title}</span>
      </div>

      <div className="space-y-2">
        <ProgressBar used={safeUsed} limit={safeLimit} unlimited={unlimited} />

        <div className="flex justify-between text-sm">
          <span className="text-txt-tertiary">
            {safeUsed.toLocaleString()}{suffix} 사용
          </span>
          <span className={`font-medium ${
            unlimited ? 'text-status-success-text' : isDanger ? 'text-status-danger-text' : isWarning ? 'text-status-warning-text' : 'text-txt-secondary'
          }`}>
            {unlimited ? '무제한' : `${remaining.toLocaleString()}${suffix} 남음`}
          </span>
        </div>
      </div>
    </div>
  )
}

function ApiUsageSection({ apiUsage }: { apiUsage: UsageData['apiUsage'] }) {
  const [selectedWindow, setSelectedWindow] = useState<'minute' | 'hour' | 'day'>('hour')

  const windows = [
    { key: 'minute' as const, label: '분당' },
    { key: 'hour' as const, label: '시간당' },
    { key: 'day' as const, label: '일당' },
  ]

  const current = apiUsage[selectedWindow]
  const percentage = (current.used / current.limit) * 100

  return (
    <div className="bg-surface-card p-6 border border-border shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 border border-violet-600 bg-violet-50">
            <Activity className="w-5 h-5 text-violet-600" />
          </div>
          <h3 className="font-semibold text-txt-primary">API 사용량</h3>
        </div>

        <div className="flex gap-0 border border-border p-0">
          {windows.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSelectedWindow(key)}
              className={`px-3 py-1 text-sm transition-colors ${
                selectedWindow === key
                  ? 'bg-surface-inverse text-txt-inverse'
                  : 'text-txt-tertiary hover:bg-surface-sunken'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-2xl font-bold text-txt-primary">
              {current.used.toLocaleString()}
              <span className="text-lg text-txt-disabled font-normal">
                /{current.limit.toLocaleString()}
              </span>
            </span>
            <span className="text-sm text-txt-tertiary">
              리셋: {new Date(current.resetAt).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          <ProgressBar used={current.used} limit={current.limit} />
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          {windows.map(({ key, label }) => (
            <div key={key} className="text-center">
              <div className="text-[0.625rem] font-medium text-txt-tertiary mb-1">{label}</div>
              <div className="text-sm font-medium">
                {apiUsage[key].remaining.toLocaleString()}
                <span className="text-txt-disabled"> 남음</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function UsageDashboard() {
  const [data, setData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchUsage = useCallback(async () => {
    try {
      const response = await fetch('/api/usage')
      if (!response.ok) {
        throw new Error('Failed to fetch usage data')
      }
      const result = await response.json()
      setData(result.data)
      setError(null)
    } catch (err) {
      setError('사용량 데이터를 불러오는데 실패했습니다.')
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchUsage()
    // 30초마다 자동 갱신
    const interval = setInterval(fetchUsage, 30000)
    return () => clearInterval(interval)
  }, [fetchUsage])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchUsage()
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-40 bg-surface-sunken rounded skeleton-shimmer" />
            <div className="h-4 w-56 bg-surface-sunken rounded skeleton-shimmer" />
          </div>
        </div>
        <div className="h-24 bg-surface-sunken rounded skeleton-shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0,1,2,3].map(i => (
            <div key={i} className="h-28 bg-surface-sunken rounded skeleton-shimmer" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[25rem] gap-4">
        <AlertCircle className="w-12 h-12 text-status-danger-text" />
        <p className="text-txt-secondary">{error || '데이터를 불러올 수 없습니다.'}</p>
        <button
          onClick={fetchUsage}
          className="px-4 py-2 bg-brand text-white border border-brand hover:bg-brand-hover transition-colors"
        >
          다시 시도
        </button>
      </div>
    )
  }

  const colors = planColors[data.plan.type] || planColors.free
  const periodEnd = data.usage.period.end
  const daysLeft = Math.ceil(
    (new Date(periodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-txt-primary">사용량 대시보드</h1>
          <p className="text-txt-tertiary mt-1">현재 플랜의 사용량을 확인하세요</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-txt-secondary border border-border hover:bg-black hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* 플랜 정보 */}
      <div className={`p-6 ${colors.bg} border ${colors.border} shadow-md`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-surface-card rounded-xl border border-border">
              <Crown className={`w-6 h-6 ${colors.text}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-txt-primary">{data.plan.nameKo} 플랜</h2>
                <span className={`px-2 py-0.5 text-[0.625rem] font-mono font-bold ${colors.text} border ${colors.border}`}>
                  {data.plan.name.toUpperCase()}
                </span>
              </div>
              <p className="text-txt-secondary text-sm mt-1">
                {data.plan.status === 'active' ? (
                  <>
                    <CheckCircle className="w-4 h-4 inline text-indicator-online mr-1" />
                    활성화됨 · 갱신까지 {daysLeft}일
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 inline text-status-warning-text mr-1" />
                    {data.plan.status}
                  </>
                )}
              </p>
            </div>
          </div>

          {data.plan.type === 'free' && (
            <button className="px-4 py-2 bg-brand text-white border border-brand font-medium hover:bg-brand-hover transition-colors hover:opacity-90 active:scale-[0.97]">
              Pro로 업그레이드
            </button>
          )}
        </div>
      </div>

      {/* 사용량 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <UsageCard
          icon={FileText}
          title="월간 지원"
          used={data.usage.applications.used}
          limit={data.usage.applications.limit}
          unlimited={data.usage.applications.unlimited}
          suffix="회"
        />
        <UsageCard
          icon={Briefcase}
          title="활성 Opportunity"
          used={data.usage.opportunities.used}
          limit={data.usage.opportunities.limit}
          suffix="개"
        />
        <UsageCard
          icon={Clock}
          title="이벤트 북마크"
          used={data.usage.eventBookmarks}
          limit={100}
          suffix="개"
        />
        <UsageCard
          icon={TrendingUp}
          title="이벤트 지원"
          used={data.usage.eventApplications}
          limit={50}
          suffix="건"
        />
      </div>

      {/* API 사용량 */}
      <ApiUsageSection apiUsage={data.apiUsage} />

      {/* 기간 정보 */}
      <div className="bg-surface-sunken rounded-xl border border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-txt-secondary">
          <Clock className="w-4 h-4" />
          <span>사용량 측정 기간</span>
        </div>
        <span className="font-medium text-txt-primary">
          {new Date(data.usage.period.start).toLocaleDateString('ko-KR')} ~ {new Date(data.usage.period.end).toLocaleDateString('ko-KR')}
        </span>
      </div>
    </div>
  )
}

export default UsageDashboard
