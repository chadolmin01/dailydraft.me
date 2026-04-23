'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, Loader2, AlertCircle, ShieldCheck, Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/src/context/AuthContext'
import { useClub } from '@/src/hooks/useClub'

/**
 * /clubs/[slug]/verify — 공식 등록 재제출 / legacy 업그레이드 페이지
 *
 * 두 가지 상태에서 진입:
 * 1. claim_status='rejected' — creator 가 반려 사유 본 뒤 증빙 보완하여 재제출
 * 2. legacy (verified + university_id NULL) — 기존 클럽에 공식 등록 절차 적용
 *
 * 기존 /clubs/new 4스텝 중 3단계(증빙)만 재활용. 학교 선택과 기본 정보는
 * 클럽에 이미 존재하거나 변경 불필요.
 */

export default function ClubVerifyPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const { user, isLoading: authLoading } = useAuth()
  const { data: club, isLoading: clubLoading } = useClub(slug)

  // 기존 증빙이 있으면 초기값으로
  const existingDoc = club?.verification_documents
  const [repName, setRepName] = useState('')
  const [repEmail, setRepEmail] = useState('')
  const [foundingYear, setFoundingYear] = useState<number | ''>('')
  const [activitySummary, setActivitySummary] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [snsUrl, setSnsUrl] = useState('')
  const [charterUrl, setCharterUrl] = useState('')

  useEffect(() => {
    if (!existingDoc) return
    setRepName(existingDoc.representative_name ?? '')
    setRepEmail(existingDoc.representative_email ?? '')
    setFoundingYear(existingDoc.founding_year ?? '')
    setActivitySummary(existingDoc.activity_summary ?? '')
    setWebsiteUrl(existingDoc.website_url ?? '')
    setSnsUrl(existingDoc.sns_url ?? '')
    setCharterUrl(existingDoc.charter_url ?? '')
  }, [existingDoc])

  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = (() => {
    if (!repName.trim()) return false
    if (!repEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(repEmail.trim())) return false
    const thisYear = new Date().getFullYear()
    if (typeof foundingYear !== 'number' || foundingYear < 2000 || foundingYear > thisYear) return false
    const sum = activitySummary.trim()
    if (sum.length < 50 || sum.length > 500) return false
    for (const url of [websiteUrl, snsUrl, charterUrl]) {
      if (url.trim()) {
        try { new URL(url.trim()) } catch { return false }
      }
    }
    return true
  })()

  const handleSubmit = async () => {
    if (!canSubmit || !club) return
    setError(null)
    setFieldErrors({})
    setSubmitting(true)
    try {
      const payload = {
        verification_documents: {
          representative_name: repName.trim(),
          representative_email: repEmail.trim(),
          founding_year: foundingYear as number,
          activity_summary: activitySummary.trim(),
          website_url: websiteUrl.trim() || undefined,
          sns_url: snsUrl.trim() || undefined,
          charter_url: charterUrl.trim() || undefined,
        },
      }
      const res = await fetch(`/api/clubs/${club.id}/resubmit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json?.error?.message ?? '재제출에 실패했습니다')
        if (json?.error?.details && typeof json.error.details === 'object') {
          setFieldErrors(json.error.details)
        }
        setSubmitting(false)
        return
      }
      toast.success('다시 제출되었습니다', {
        description: '검토 후 1~3영업일 내에 알려 드립니다.',
      })
      router.push(`/clubs/${slug}`)
    } catch {
      setError('네트워크가 불안정합니다. 다시 시도해 주세요.')
      setSubmitting(false)
    }
  }

  if (authLoading || clubLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <Loader2 size={20} className="animate-spin mx-auto text-txt-disabled" />
      </div>
    )
  }
  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-3">
        <p className="text-sm text-txt-tertiary">로그인이 필요합니다.</p>
        <Link href={`/login?redirect=/clubs/${slug}/verify`} className="inline-block text-sm text-brand hover:underline">
          로그인 →
        </Link>
      </div>
    )
  }
  if (!club) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-sm text-txt-tertiary">클럽을 찾을 수 없습니다.</p>
      </div>
    )
  }
  if (club.created_by !== user.id) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-3">
        <p className="text-sm text-txt-tertiary">클럽 대표자만 등록 정보를 수정하실 수 있습니다.</p>
        <Link href={`/clubs/${slug}`} className="inline-block text-sm text-brand hover:underline">
          클럽으로 돌아가기 →
        </Link>
      </div>
    )
  }

  const INPUT_CLASS = 'ob-input w-full px-4 py-3 bg-surface-card border border-border rounded-xl text-[14px] text-txt-primary placeholder:text-txt-disabled'
  const isRejected = club.claim_status === 'rejected'
  const isLegacy = club.claim_status === 'verified' && !club.university_id

  return (
    <div className="ob-atmos min-h-full">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">

        <Link
          href={`/clubs/${slug}`}
          className="inline-flex items-center gap-1.5 text-[13px] text-txt-tertiary hover:text-txt-primary transition-colors mb-5"
        >
          <ChevronLeft size={14} />
          {club.name} 클럽으로
        </Link>

        <div className="flex items-start gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center shrink-0">
            <ShieldCheck size={18} className="text-brand" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[20px] font-bold text-txt-primary">
              {isRejected ? '재제출' : isLegacy ? '공식 등록 신청' : '등록 정보 수정'}
            </h1>
            <p className="text-[12px] text-txt-tertiary mt-0.5 leading-relaxed">
              {isRejected
                ? '반려 사유를 반영하여 증빙을 보완해 주세요. 제출 후 1~3영업일 내에 결과를 안내드립니다.'
                : isLegacy
                  ? '공식 등록을 완료하시면 학교 뱃지가 부여됩니다. 제출 후 1~3영업일 내 검토됩니다.'
                  : '등록 정보를 수정합니다.'}
            </p>
          </div>
        </div>

        {isRejected && club.verification_note && (
          <div className="mb-5 p-4 bg-status-danger-bg border border-status-danger-text/25 rounded-2xl">
            <p className="text-[12px] font-semibold text-status-danger-text mb-1">이전 반려 사유</p>
            <p className="text-[13px] text-txt-primary leading-relaxed">{club.verification_note}</p>
          </div>
        )}

        {error && (
          <div className="mb-5 p-3 bg-status-danger-bg rounded-xl border border-status-danger-text/20 flex items-start gap-2 text-status-danger-text text-sm">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-txt-primary">
                대표자 이름 <span className="text-status-danger-text">*</span>
              </label>
              <input
                type="text"
                value={repName}
                onChange={(e) => setRepName(e.target.value)}
                placeholder="예: 홍길동"
                className={INPUT_CLASS}
              />
              {fieldErrors.representative_name && (
                <p className="text-[11px] text-status-danger-text">{fieldErrors.representative_name}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-txt-primary">
                대표자 이메일 <span className="text-status-danger-text">*</span>
              </label>
              <input
                type="email"
                value={repEmail}
                onChange={(e) => setRepEmail(e.target.value)}
                placeholder="학교 이메일 권장"
                className={INPUT_CLASS}
              />
              {fieldErrors.representative_email && (
                <p className="text-[11px] text-status-danger-text">{fieldErrors.representative_email}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-txt-primary">
              창립 연도 <span className="text-status-danger-text">*</span>
            </label>
            <input
              type="number"
              value={foundingYear}
              onChange={(e) => setFoundingYear(e.target.value ? Number(e.target.value) : '')}
              min={2000}
              max={new Date().getFullYear()}
              placeholder="예: 2015"
              className={`${INPUT_CLASS} font-mono`}
            />
            {fieldErrors.founding_year && (
              <p className="text-[11px] text-status-danger-text">{fieldErrors.founding_year}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-txt-primary">
              활동 요약 <span className="text-status-danger-text">*</span>
            </label>
            <textarea
              value={activitySummary}
              onChange={(e) => setActivitySummary(e.target.value)}
              placeholder="최근 1년 주요 활동을 50~500자로 적어 주세요. 재제출 시에는 반려 사유에서 지적된 부분을 구체적으로 보완해 주세요."
              rows={6}
              maxLength={500}
              className={`${INPUT_CLASS} resize-none`}
            />
            <div className="flex justify-between text-[11px] text-txt-disabled pt-1">
              <span>최소 50자</span>
              <span className={activitySummary.length < 50 ? 'text-status-danger-text' : ''}>
                {activitySummary.length}/500
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[12px] font-semibold text-txt-secondary">참고 자료 (선택)</p>
            <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="웹사이트" className={`${INPUT_CLASS} font-mono`} />
            <input type="url" value={snsUrl} onChange={(e) => setSnsUrl(e.target.value)} placeholder="Instagram · Discord · Notion SNS" className={`${INPUT_CLASS} font-mono`} />
            <input type="url" value={charterUrl} onChange={(e) => setCharterUrl(e.target.value)} placeholder="회칙·소개 문서" className={`${INPUT_CLASS} font-mono`} />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="ob-press-spring w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-brand text-white rounded-xl text-[14px] font-bold hover:bg-brand-hover shadow-[0_4px_14px_-4px_rgba(94,106,210,0.35)] hover:shadow-[0_6px_20px_-4px_rgba(94,106,210,0.45)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                제출 중…
              </>
            ) : (
              <>
                <Check size={14} />
                {isRejected ? '다시 제출' : '신청 제출'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
