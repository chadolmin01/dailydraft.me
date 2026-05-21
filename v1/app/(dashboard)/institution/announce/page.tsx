'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useInstitutionAdmin } from '@/src/hooks/useInstitutionAdmin'
import { Card } from '@/components/ui/Card'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import {
  ShieldX,
  ChevronLeft,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

export default function InstitutionAnnouncePage() {
  const router = useRouter()
  const { isInstitutionAdmin, institution, isLoading: isAdminLoading } = useInstitutionAdmin()

  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSendConfirm, setShowSendConfirm] = useState(false)

  useEffect(() => {
    if (!isAdminLoading && !isInstitutionAdmin) {
      router.push('/explore')
    }
  }, [isInstitutionAdmin, isAdminLoading, router])

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) return
    setShowSendConfirm(true)
  }

  const doSend = async () => {
    setShowSendConfirm(false)

    setSending(true)
    setResult(null)
    setError(null)

    try {
      const res = await fetch('/api/institution/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), body: body.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || '발송 실패')
      }

      const data = await res.json()
      setResult(data)
      if (data.sent > 0) {
        setSubject('')
        setBody('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '발송 중 오류가 발생했습니다')
    } finally {
      setSending(false)
    }
  }

  if (isAdminLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-surface-bg">
        <div className="space-y-4 w-full max-w-xs">
          <div className="h-6 bg-surface-card rounded skeleton-shimmer w-40 mx-auto" />
          <div className="h-4 bg-surface-card rounded skeleton-shimmer w-32 mx-auto" />
        </div>
      </div>
    )
  }

  if (!isInstitutionAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-surface-bg">
        <ShieldX size={48} className="text-status-danger-text/70 mb-4" />
        <p className="text-txt-secondary">기관 관리자 권한이 필요합니다</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto h-screen bg-surface-bg">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <Link
            href="/institution"
            className="text-[10px] font-medium text-txt-tertiary mb-2 flex items-center gap-1 hover:text-txt-primary transition-colors"
          >
            <ChevronLeft size={12} />
            Institution Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-txt-primary tracking-tight">전체 공지 발송</h1>
          <p className="text-txt-tertiary text-sm mt-1">
            {institution?.institutionName} · 소속 전체 멤버에게 이메일 공지
          </p>
        </div>

        {/* Compose Form */}
        <Card padding="p-6" className="space-y-5">
          <div>
            <label className="text-[10px] font-mono font-medium text-txt-tertiary uppercase tracking-wider block mb-2">
              제목
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="공지 제목을 입력하세요"
              maxLength={100}
              disabled={sending}
              className="w-full px-4 py-3 bg-surface-sunken border border-border text-sm text-txt-primary placeholder:text-txt-disabled focus:outline-none focus:border-txt-primary transition-colors disabled:opacity-50"
            />
            <div className="text-[10px] text-txt-disabled mt-1 text-right">{subject.length}/100</div>
          </div>

          <div>
            <label className="text-[10px] font-mono font-medium text-txt-tertiary uppercase tracking-wider block mb-2">
              내용
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="공지 내용을 입력하세요"
              maxLength={5000}
              rows={10}
              disabled={sending}
              className="w-full px-4 py-3 bg-surface-sunken border border-border text-sm text-txt-primary placeholder:text-txt-disabled focus:outline-none focus:border-txt-primary transition-colors resize-y disabled:opacity-50"
            />
            <div className="text-[10px] text-txt-disabled mt-1 text-right">{body.length}/5000</div>
          </div>

          <button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !body.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-black text-white text-sm font-semibold hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                발송 중...
              </>
            ) : (
              <>
                <Send size={16} />
                전체 멤버에게 발송
              </>
            )}
          </button>
        </Card>

        {/* Result */}
        {result && (
          <Card padding="p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-status-success-text shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-txt-primary">
                  발송 완료
                </p>
                <p className="text-xs text-txt-secondary mt-1">
                  전체 {result.total}명 중 {result.sent}명 성공
                  {result.failed > 0 && `, ${result.failed}명 실패`}
                </p>
              </div>
            </div>
          </Card>
        )}

        {error && (
          <Card padding="p-5">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-status-danger-text shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-txt-primary">발송 실패</p>
                <p className="text-xs text-txt-secondary mt-1">{error}</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      <ConfirmModal
        isOpen={showSendConfirm}
        onClose={() => setShowSendConfirm(false)}
        onConfirm={doSend}
        title="전체 발송"
        message={`"${subject}" 제목으로 전체 소속 멤버에게 이메일을 발송합니다. 발송 후에는 회수할 수 없습니다.`}
        confirmText="발송"
        variant="warning"
      />
    </div>
  )
}
