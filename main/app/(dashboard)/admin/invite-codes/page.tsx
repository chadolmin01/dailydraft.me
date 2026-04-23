'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Gift,
  Send,
  Check,
  X,
  Clock,
  User,
  Mail,
  RefreshCw,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { useAdmin } from '@/src/hooks/useAdmin'
import { useRouter } from 'next/navigation'

interface InviteCode {
  id: string
  code: string
  recipient_email: string | null
  used_by: string | null
  used_at: string | null
  expires_at: string | null
  is_active: boolean
  created_at: string
}

interface EligibleUser {
  user_id: string
  nickname: string
  email: string
  created_at: string
  existing_invite_code: string | null
  invite_code_used: boolean
  invite_code_expired: boolean
}

export default function InviteCodesAdminPage() {
  const router = useRouter()
  const { isAdmin, isLoading: isAdminLoading } = useAdmin()
  const queryClient = useQueryClient()
  const [selectedEmail, setSelectedEmail] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)

  // Redirect if not admin
  React.useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      router.push('/explore')
    }
  }, [isAdmin, isAdminLoading, router])

  // Fetch invite codes
  const { data: codes, isLoading: codesLoading } = useQuery<InviteCode[]>({
    queryKey: ['admin-invite-codes'],
    queryFn: async () => {
      const res = await fetch('/api/invite-codes')
      if (!res.ok) throw new Error('Failed to fetch invite codes')
      return res.json()
    },
    enabled: isAdmin,
    staleTime: 1000 * 30,
  })

  // Fetch eligible users
  const { data: eligibleData, isLoading: eligibleLoading } = useQuery<{
    all: EligibleUser[]
    eligible_for_new_code: EligibleUser[]
    total_count: number
    eligible_count: number
  }>({
    queryKey: ['admin-eligible-users'],
    queryFn: async () => {
      const res = await fetch('/api/invite-codes/eligible')
      if (!res.ok) throw new Error('Failed to fetch eligible users')
      return res.json()
    },
    enabled: isAdmin,
    staleTime: 1000 * 60, // 1분 — eligible 목록은 초대 발송 후에만 변함
  })

  // Send invite code mutation
  const sendMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch('/api/invite-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || 'Failed to send invite code')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invite-codes'] })
      queryClient.invalidateQueries({ queryKey: ['admin-eligible-users'] })
      setSelectedEmail('')
      setSendError(null)
    },
    onError: (error: Error) => {
      setSendError(error.message)
    },
  })

  // Delete invite code mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/invite-codes?id=${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete invite code')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invite-codes'] })
    },
  })

  if (isAdminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 w-full max-w-xs">
          <div className="h-6 bg-surface-sunken rounded skeleton-shimmer w-40 mx-auto" />
          <div className="h-4 bg-surface-sunken rounded skeleton-shimmer w-32 mx-auto" />
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="text-[10px] font-medium text-txt-tertiary mb-2">
          ADMIN / INVITE CODES
        </div>
        <h1 className="text-2xl font-bold text-txt-primary flex items-center gap-2">
          <Gift className="w-6 h-6" />
          초대 코드 관리
        </h1>
        <p className="text-txt-secondary mt-1">
          온보딩 완료 유저에게 프리미엄 초대 코드를 발송합니다
        </p>
      </div>

      {/* Send New Code */}
      <div className="bg-surface-card rounded-xl border border-border shadow-md p-6 mb-8">
        <h2 className="text-[10px] font-medium text-txt-tertiary mb-4">새 초대 코드 발송</h2>

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-txt-secondary mb-1">
              받는 사람 이메일
            </label>
            <select
              value={selectedEmail}
              onChange={(e) => {
                setSelectedEmail(e.target.value)
                setSendError(null)
              }}
              className="w-full px-3 py-2 bg-surface-card rounded-xl border border-border text-sm ob-input"
              disabled={eligibleLoading}
            >
              <option value="">이메일 선택...</option>
              {eligibleData?.eligible_for_new_code.map((user) => (
                <option key={user.user_id} value={user.email}>
                  {user.nickname} ({user.email})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => selectedEmail && sendMutation.mutate(selectedEmail)}
            disabled={!selectedEmail || sendMutation.isPending}
            className="px-4 py-2 bg-brand text-white border border-brand hover:bg-brand-hover disabled:bg-surface-sunken disabled:border-border disabled:text-txt-disabled disabled:cursor-not-allowed flex items-center gap-2"
          >
            {sendMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            발송하기
          </button>
        </div>

        {sendError && (
          <div className="mt-3 p-3 bg-status-danger-bg border border-status-danger-text/20 flex items-center gap-2 text-status-danger-text text-sm">
            <AlertCircle className="w-4 h-4" />
            {sendError}
          </div>
        )}

        <p className="text-sm text-txt-tertiary mt-3">
          {eligibleLoading
            ? '로딩 중...'
            : `발송 가능한 유저: ${eligibleData?.eligible_count || 0}명`}
        </p>
      </div>

      {/* Codes List */}
      <div className="bg-surface-card rounded-xl border border-border shadow-md">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-[10px] font-medium text-txt-tertiary">발송된 초대 코드</h2>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-invite-codes'] })}
            className="p-2 hover:bg-surface-sunken rounded-xl border border-border transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-txt-tertiary" />
          </button>
        </div>

        {codesLoading ? (
          <div className="p-4 space-y-3">
            {[0,1,2].map(i => (
              <div key={i} className="h-12 bg-surface-sunken rounded skeleton-shimmer" />
            ))}
          </div>
        ) : !codes?.length ? (
          <div className="p-8 text-center text-txt-tertiary">
            발송된 초대 코드가 없습니다
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border">
              <thead className="bg-surface-sunken border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-txt-tertiary">코드</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-txt-tertiary">받는 사람</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-txt-tertiary">상태</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-txt-tertiary">만료일</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-txt-tertiary">생성일</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-txt-tertiary"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-border">
                {codes.map((code) => (
                  <tr key={code.id} className="hover:bg-surface-sunken">
                    <td className="px-4 py-3">
                      <code className="px-2 py-1 bg-surface-sunken rounded-xl border border-border font-mono text-sm">
                        {code.code}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-txt-disabled" />
                        <span className="text-txt-secondary">{code.recipient_email || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {code.used_by ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 border border-status-success-text text-status-success-text text-[10px] font-mono font-bold">
                          <Check className="w-3 h-3" />
                          사용됨
                        </span>
                      ) : !code.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 border border-border text-txt-tertiary text-[10px] font-mono font-bold">
                          <X className="w-3 h-3" />
                          비활성
                        </span>
                      ) : isExpired(code.expires_at) ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 border border-status-danger-text/20 text-status-danger-text text-[10px] font-mono font-bold">
                          <Clock className="w-3 h-3" />
                          만료됨
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 border border-brand-border text-brand text-[10px] font-mono font-bold">
                          <Clock className="w-3 h-3" />
                          대기 중
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-txt-secondary">
                      {formatDate(code.expires_at)}
                    </td>
                    <td className="px-4 py-3 text-txt-secondary">
                      {formatDate(code.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* 재발송: 만료됐거나 비활성화된 미사용 코드에만 노출 */}
                        {!code.used_by && code.recipient_email && (!code.is_active || isExpired(code.expires_at)) && (
                          <button
                            onClick={() => {
                              if (!code.recipient_email) return
                              setSelectedEmail(code.recipient_email)
                              sendMutation.mutate(code.recipient_email)
                            }}
                            disabled={sendMutation.isPending}
                            className="p-1 hover:bg-surface-sunken text-txt-tertiary hover:text-brand transition-colors"
                            title="재발송 (새 코드 생성)"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        {!code.used_by && code.is_active && (
                          <button
                            onClick={() => deleteMutation.mutate(code.id)}
                            disabled={deleteMutation.isPending}
                            className="p-1 hover:bg-status-danger-bg text-status-danger-text transition-colors"
                            title="비활성화"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Eligible Users List */}
      <div className="bg-surface-card rounded-xl border border-border shadow-md mt-8">
        <div className="p-4 border-b border-border">
          <h2 className="text-[10px] font-medium text-txt-tertiary">온보딩 완료 유저 ({eligibleData?.total_count || 0}명)</h2>
        </div>

        {eligibleLoading ? (
          <div className="p-4 space-y-3">
            {[0,1,2].map(i => (
              <div key={i} className="h-12 bg-surface-sunken rounded skeleton-shimmer" />
            ))}
          </div>
        ) : !eligibleData?.all.length ? (
          <div className="p-8 text-center text-txt-tertiary">
            온보딩 완료 유저가 없습니다
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border">
              <thead className="bg-surface-sunken border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-txt-tertiary">닉네임</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-txt-tertiary">이메일</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-txt-tertiary">초대 코드</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-txt-tertiary">가입일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-border">
                {eligibleData.all.map((user) => (
                  <tr key={user.user_id} className="hover:bg-surface-sunken">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-txt-disabled" />
                        <span className="font-medium text-txt-primary">{user.nickname}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-txt-secondary">{user.email}</td>
                    <td className="px-4 py-3">
                      {user.existing_invite_code ? (
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-surface-sunken rounded-xl border border-border font-mono text-xs">
                            {user.existing_invite_code}
                          </code>
                          {user.invite_code_used ? (
                            <span className="text-status-success-text text-xs">사용됨</span>
                          ) : user.invite_code_expired ? (
                            <span className="text-status-danger-text text-xs">만료됨</span>
                          ) : (
                            <span className="text-status-info-text text-xs">대기 중</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-txt-disabled text-xs">미발송</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-txt-secondary">
                      {formatDate(user.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
