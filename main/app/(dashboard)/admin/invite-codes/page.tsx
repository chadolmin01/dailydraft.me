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
      router.push('/dashboard')
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
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
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
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Gift className="w-6 h-6" />
          초대 코드 관리
        </h1>
        <p className="text-gray-600 mt-1">
          온보딩 완료 유저에게 프리미엄 초대 코드를 발송합니다
        </p>
      </div>

      {/* Send New Code */}
      <div className="bg-white rounded-lg border p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">새 초대 코드 발송</h2>

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              받는 사람 이메일
            </label>
            <select
              value={selectedEmail}
              onChange={(e) => {
                setSelectedEmail(e.target.value)
                setSendError(null)
              }}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
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
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" />
            {sendError}
          </div>
        )}

        <p className="text-sm text-gray-500 mt-3">
          {eligibleLoading
            ? '로딩 중...'
            : `발송 가능한 유저: ${eligibleData?.eligible_count || 0}명`}
        </p>
      </div>

      {/* Codes List */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">발송된 초대 코드</h2>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-invite-codes'] })}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {codesLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
          </div>
        ) : !codes?.length ? (
          <div className="p-8 text-center text-gray-500">
            발송된 초대 코드가 없습니다
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">코드</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">받는 사람</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">상태</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">만료일</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">생성일</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {codes.map((code) => (
                  <tr key={code.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <code className="px-2 py-1 bg-gray-100 rounded font-mono text-sm">
                        {code.code}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{code.recipient_email || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {code.used_by ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          <Check className="w-3 h-3" />
                          사용됨
                        </span>
                      ) : !code.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          <X className="w-3 h-3" />
                          비활성
                        </span>
                      ) : isExpired(code.expires_at) ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                          <Clock className="w-3 h-3" />
                          만료됨
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                          <Clock className="w-3 h-3" />
                          대기 중
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(code.expires_at)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(code.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {!code.used_by && code.is_active && (
                        <button
                          onClick={() => deleteMutation.mutate(code.id)}
                          disabled={deleteMutation.isPending}
                          className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                          title="비활성화"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Eligible Users List */}
      <div className="bg-white rounded-lg border mt-8">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">온보딩 완료 유저 ({eligibleData?.total_count || 0}명)</h2>
        </div>

        {eligibleLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
          </div>
        ) : !eligibleData?.all.length ? (
          <div className="p-8 text-center text-gray-500">
            온보딩 완료 유저가 없습니다
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">닉네임</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">이메일</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">초대 코드</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">가입일</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {eligibleData.all.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{user.nickname}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      {user.existing_invite_code ? (
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-gray-100 rounded font-mono text-xs">
                            {user.existing_invite_code}
                          </code>
                          {user.invite_code_used ? (
                            <span className="text-green-600 text-xs">사용됨</span>
                          ) : user.invite_code_expired ? (
                            <span className="text-red-600 text-xs">만료됨</span>
                          ) : (
                            <span className="text-blue-600 text-xs">대기 중</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">미발송</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
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
