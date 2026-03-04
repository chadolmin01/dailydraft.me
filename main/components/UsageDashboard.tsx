'use client'

import React, { useEffect, useState } from 'react'
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
  free: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  pro: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  team: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
}

function ProgressBar({ used, limit, unlimited = false }: { used: number; limit: number; unlimited?: boolean }) {
  if (unlimited) {
    return (
      <div className="w-full h-2 bg-green-100 rounded-full overflow-hidden">
        <div className="h-full bg-green-500 w-full" />
      </div>
    )
  }

  const percentage = Math.min((used / limit) * 100, 100)
  const isWarning = percentage >= 80
  const isDanger = percentage >= 95

  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className={`h-full transition-all duration-300 ${
          isDanger ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-blue-500'
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
    <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${isDanger ? 'bg-red-100' : isWarning ? 'bg-yellow-100' : 'bg-blue-100'}`}>
          <Icon className={`w-5 h-5 ${isDanger ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-blue-600'}`} />
        </div>
        <span className="font-medium text-gray-700">{title}</span>
      </div>

      <div className="space-y-2">
        <ProgressBar used={safeUsed} limit={safeLimit} unlimited={unlimited} />

        <div className="flex justify-between text-sm">
          <span className="text-gray-500">
            {safeUsed.toLocaleString()}{suffix} 사용
          </span>
          <span className={`font-medium ${
            unlimited ? 'text-green-600' : isDanger ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-gray-700'
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
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-100">
            <Activity className="w-5 h-5 text-violet-600" />
          </div>
          <h3 className="font-semibold text-gray-800">API 사용량</h3>
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {windows.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSelectedWindow(key)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                selectedWindow === key
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
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
            <span className="text-2xl font-bold text-gray-800">
              {current.used.toLocaleString()}
              <span className="text-lg text-gray-400 font-normal">
                /{current.limit.toLocaleString()}
              </span>
            </span>
            <span className="text-sm text-gray-500">
              리셋: {new Date(current.resetAt).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          <ProgressBar used={current.used} limit={current.limit} />
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          {windows.map(({ key, label }) => (
            <div key={key} className="text-center">
              <div className="text-xs text-gray-500 mb-1">{label}</div>
              <div className="text-sm font-medium">
                {apiUsage[key].remaining.toLocaleString()}
                <span className="text-gray-400"> 남음</span>
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

  const fetchUsage = async () => {
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
  }

  useEffect(() => {
    fetchUsage()
    // 30초마다 자동 갱신
    const interval = setInterval(fetchUsage, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchUsage()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-gray-600">{error || '데이터를 불러올 수 없습니다.'}</p>
        <button
          onClick={fetchUsage}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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
          <h1 className="text-2xl font-bold text-gray-800">사용량 대시보드</h1>
          <p className="text-gray-500 mt-1">현재 플랜의 사용량을 확인하세요</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* 플랜 정보 */}
      <div className={`rounded-xl p-6 ${colors.bg} border ${colors.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-white shadow-sm`}>
              <Crown className={`w-6 h-6 ${colors.text}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-800">{data.plan.nameKo} 플랜</h2>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                  {data.plan.name.toUpperCase()}
                </span>
              </div>
              <p className="text-gray-600 text-sm mt-1">
                {data.plan.status === 'active' ? (
                  <>
                    <CheckCircle className="w-4 h-4 inline text-green-500 mr-1" />
                    활성화됨 · 갱신까지 {daysLeft}일
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 inline text-yellow-500 mr-1" />
                    {data.plan.status}
                  </>
                )}
              </p>
            </div>
          </div>

          {data.plan.type === 'free' && (
            <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
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
      <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-4 h-4" />
          <span>사용량 측정 기간</span>
        </div>
        <span className="font-medium text-gray-800">
          {new Date(data.usage.period.start).toLocaleDateString('ko-KR')} ~ {new Date(data.usage.period.end).toLocaleDateString('ko-KR')}
        </span>
      </div>
    </div>
  )
}

export default UsageDashboard
