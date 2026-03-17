'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/src/lib/supabase/client'
import { useAdmin } from '@/src/hooks/useAdmin'
import { Card } from '@/components/ui/Card'
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Bug,
  Skull,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  Loader2,
  ShieldX,
} from 'lucide-react'

interface ErrorLog {
  id: string
  created_at: string
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  source: 'api' | 'webhook' | 'cron' | 'client'
  error_code: string | null
  message: string
  stack_trace: string | null
  endpoint: string | null
  method: string | null
  user_id: string | null
  request_body: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
}

const levelConfig = {
  debug: { icon: Bug, color: 'text-txt-tertiary', bg: 'bg-surface-sunken' },
  info: { icon: Info, color: 'text-status-info-text', bg: 'bg-status-info-bg' },
  warn: { icon: AlertTriangle, color: 'text-status-warning-text', bg: 'bg-status-warning-bg' },
  error: { icon: AlertCircle, color: 'text-status-danger-text', bg: 'bg-status-danger-bg' },
  fatal: { icon: Skull, color: 'text-status-danger-text', bg: 'bg-status-danger-bg' },
}

const sourceColors = {
  api: 'border border-status-info-text text-status-info-text',
  webhook: 'border border-purple-600 text-purple-700',
  cron: 'border border-status-success-text text-status-success-text',
  client: 'border border-indicator-trending text-indicator-trending',
}

export default function ErrorLogsPage() {
  const router = useRouter()
  const { isAdmin, isLoading: isAdminLoading } = useAdmin()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const supabase = createClient()

  // useQuery must be called before any conditional returns (React hooks rules)
  const { data: logs, isLoading, isError, refetch } = useQuery({
    queryKey: ['error-logs', levelFilter, sourceFilter],
    queryFn: async () => {
      let query = supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (levelFilter !== 'all') {
        query = query.eq('level', levelFilter)
      }
      if (sourceFilter !== 'all') {
        query = query.eq('source', sourceFilter)
      }

      const { data, error } = await query
      if (error) throw error
      return data as ErrorLog[]
    },
    enabled: isAdmin && !isAdminLoading,
  })

  // Redirect non-admins
  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      router.push('/explore')
    }
  }, [isAdmin, isAdminLoading, router])

  // Show loading while checking admin status
  if (isAdminLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-surface-sunken">
        <Loader2 className="animate-spin text-txt-disabled" size={32} />
      </div>
    )
  }

  // Show access denied (brief flash before redirect)
  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-surface-sunken">
        <ShieldX size={48} className="text-status-danger-text/70 mb-4" />
        <p className="text-txt-secondary">접근 권한이 없습니다</p>
      </div>
    )
  }

  const filteredLogs = (logs || []).filter(log => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      log.message.toLowerCase().includes(searchLower) ||
      log.endpoint?.toLowerCase().includes(searchLower) ||
      log.error_code?.toLowerCase().includes(searchLower)
    )
  })

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="flex-1 overflow-y-auto h-screen bg-surface-sunken">
      <div className="max-w-[100rem] mx-auto p-8 lg:p-12 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border-strong pb-6">
          <div>
            <div className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-tertiary mb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-indicator-alert"></span>
              ADMIN / MONITORING
            </div>
            <h1 className="text-3xl font-bold text-txt-primary tracking-tight">Error Logs</h1>
          </div>

          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium border border-black hover:bg-[#333] transition-colors shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            <RefreshCw size={16} />
            새로고침
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[12.5rem] max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-disabled" />
            <input
              type="text"
              placeholder="메시지, 엔드포인트 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-card border border-border-strong text-sm focus:outline-none focus:border-brand"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-txt-disabled" />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-2 bg-surface-card border border-border-strong text-sm focus:outline-none focus:border-brand"
            >
              <option value="all">모든 레벨</option>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
              <option value="fatal">Fatal</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2 bg-surface-card border border-border-strong text-sm focus:outline-none focus:border-brand"
            >
              <option value="all">모든 소스</option>
              <option value="api">API</option>
              <option value="webhook">Webhook</option>
              <option value="cron">Cron</option>
              <option value="client">Client</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {(['debug', 'info', 'warn', 'error', 'fatal'] as const).map((level) => {
            const config = levelConfig[level]
            const Icon = config.icon
            const count = (logs || []).filter(l => l.level === level).length
            return (
              <Card key={level} padding="p-4" className="flex items-center gap-3">
                <div className={`w-10 h-10 ${config.bg} flex items-center justify-center`}>
                  <Icon size={20} className={config.color} />
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono text-txt-primary">{count}</div>
                  <div className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-tertiary">{level}</div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Logs List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-txt-disabled" size={32} />
          </div>
        ) : isError ? (
          <Card padding="p-8" className="text-center">
            <AlertCircle size={48} className="mx-auto text-status-danger-text/70 mb-4" />
            <p className="text-txt-secondary mb-4">에러 로그를 불러올 수 없습니다</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 border border-border-strong text-txt-secondary text-sm hover:bg-black hover:text-white transition-colors"
            >
              다시 시도
            </button>
          </Card>
        ) : filteredLogs.length === 0 ? (
          <Card padding="p-16" className="text-center">
            <Info size={48} className="mx-auto text-txt-disabled mb-4" />
            <p className="text-txt-tertiary">에러 로그가 없습니다</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map((log) => {
              const config = levelConfig[log.level]
              const Icon = config.icon
              const isExpanded = expandedId === log.id

              return (
                <Card
                  key={log.id}
                  padding="p-0"
                  className={`overflow-hidden transition-all ${
                    isExpanded ? 'ring-2 ring-black' : ''
                  }`}
                >
                  <button
                    onClick={() => toggleExpand(log.id)}
                    className="w-full p-4 flex items-start gap-4 text-left hover:bg-surface-sunken transition-colors"
                  >
                    <div className={`w-8 h-8 ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon size={16} className={config.color} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2 py-0.5 text-[0.625rem] font-mono font-bold ${sourceColors[log.source]}`}>
                          {log.source.toUpperCase()}
                        </span>
                        {log.error_code && (
                          <span className="px-2 py-0.5 text-[0.625rem] font-mono font-bold bg-surface-sunken border border-border text-txt-secondary">
                            {log.error_code}
                          </span>
                        )}
                        {log.endpoint && (
                          <span className="text-xs font-mono text-txt-disabled">
                            {log.method} {log.endpoint}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-txt-primary truncate">{log.message}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-txt-disabled font-mono">
                        {formatDate(log.created_at)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp size={16} className="text-txt-disabled" />
                      ) : (
                        <ChevronDown size={16} className="text-txt-disabled" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border p-4 bg-surface-sunken space-y-4">
                      {/* Full message */}
                      <div>
                        <h4 className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-tertiary mb-1">MESSAGE</h4>
                        <p className="text-sm text-txt-primary bg-surface-card p-3 border border-border-strong">
                          {log.message}
                        </p>
                      </div>

                      {/* Stack trace */}
                      {log.stack_trace && (
                        <div>
                          <h4 className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-tertiary mb-1">STACK TRACE</h4>
                          <pre className="text-xs text-txt-secondary bg-surface-card p-3 border border-border-strong overflow-x-auto">
                            {log.stack_trace}
                          </pre>
                        </div>
                      )}

                      {/* Request body */}
                      {log.request_body && (
                        <div>
                          <h4 className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-tertiary mb-1">REQUEST BODY</h4>
                          <pre className="text-xs text-txt-secondary bg-surface-card p-3 border border-border-strong overflow-x-auto">
                            {JSON.stringify(log.request_body, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Metadata */}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div>
                          <h4 className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-tertiary mb-1">METADATA</h4>
                          <pre className="text-xs text-txt-secondary bg-surface-card p-3 border border-border-strong overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Additional info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-dashed border-border">
                        {log.user_id && (
                          <div>
                            <span className="text-[0.625rem] font-mono text-txt-disabled">USER ID</span>
                            <p className="text-xs font-mono text-txt-secondary truncate">{log.user_id}</p>
                          </div>
                        )}
                        {log.ip_address && (
                          <div>
                            <span className="text-[0.625rem] font-mono text-txt-disabled">IP ADDRESS</span>
                            <p className="text-xs font-mono text-txt-secondary">{log.ip_address}</p>
                          </div>
                        )}
                        {log.user_agent && (
                          <div className="col-span-2">
                            <span className="text-[0.625rem] font-mono text-txt-disabled">USER AGENT</span>
                            <p className="text-xs font-mono text-txt-secondary truncate">{log.user_agent}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
