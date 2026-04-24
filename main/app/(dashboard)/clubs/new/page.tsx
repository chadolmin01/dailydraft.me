'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, Loader2, AlertCircle, ArrowRight, ArrowLeft,
  Check, Search, ShieldCheck, FileText, GraduationCap,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/src/context/AuthContext'

/**
 * /clubs/new — 4스텝 공식 등록 신청 폼
 *
 * 1. 학교 선택 (university_id) — 검색 + 선택
 * 2. 클럽 기본 정보 (name, slug, description, logo)
 * 3. 공식 등록 증빙 (대표자, 이메일, 창립 연도, 활동 요약, 웹사이트/SNS/회칙 URL)
 * 4. 제출 확인 — "1~3영업일 내 결과 안내"
 *
 * 제출 후 `/clubs/[slug]` 로 이동. 클럽은 claim_status='pending' 상태.
 * 공개 목록에는 admin 승인 후 노출.
 */

function autoSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30)
}

const RESERVED_SLUGS = new Set([
  'admin', 'api', 'login', 'logout', 'signup', 'settings',
  'new', 'edit', 'club', 'clubs', 'dashboard', 'explore',
  'profile', 'notifications', 'search', 'home', 'about',
])

interface University {
  id: string
  name: string
  short_name: string | null
  email_domains?: string[] | null
}

type Step = 1 | 2 | 3 | 4

export default function NewClubPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  const [step, setStep] = useState<Step>(1)

  // 1단계
  const [univQuery, setUnivQuery] = useState('')
  const [univResults, setUnivResults] = useState<University[]>([])
  const [univLoading, setUnivLoading] = useState(false)
  const [selectedUniv, setSelectedUniv] = useState<University | null>(null)

  // 2단계
  const [name, setName] = useState('')
  const [slugInput, setSlugInput] = useState('')
  const [description, setDescription] = useState('')
  const [logoUrl, setLogoUrl] = useState('')

  // 3단계
  const [repName, setRepName] = useState('')
  const [repEmail, setRepEmail] = useState('')
  const [foundingYear, setFoundingYear] = useState<number | ''>('')
  const [activitySummary, setActivitySummary] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [snsUrl, setSnsUrl] = useState('')
  const [charterUrl, setCharterUrl] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const previewSlug = useMemo(() => {
    if (slugInput.trim()) return slugInput.trim().toLowerCase()
    return autoSlug(name) || '...'
  }, [slugInput, name])

  const slugReserved = RESERVED_SLUGS.has(previewSlug)
  const nameValid = name.trim().length >= 2 && name.trim().length <= 50

  // 학교 검색 (debounce 300ms)
  useEffect(() => {
    let cancelled = false
    const t = setTimeout(async () => {
      setUnivLoading(true)
      try {
        const qs = univQuery.trim() ? `?q=${encodeURIComponent(univQuery.trim())}` : ''
        const res = await fetch(`/api/universities${qs}`)
        if (!res.ok) throw new Error('lookup failed')
        const body = await res.json()
        if (!cancelled) setUnivResults(body?.data?.items ?? [])
      } catch {
        if (!cancelled) setUnivResults([])
      } finally {
        if (!cancelled) setUnivLoading(false)
      }
    }, univQuery.trim() ? 300 : 0)
    return () => { cancelled = true; clearTimeout(t) }
  }, [univQuery])

  const canProceedStep1 = !!selectedUniv
  const canProceedStep2 = nameValid && !slugReserved
  const canProceedStep3 = (() => {
    if (!repName.trim()) return false
    if (!repEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(repEmail.trim())) return false
    const thisYear = new Date().getFullYear()
    if (typeof foundingYear !== 'number' || foundingYear < 2000 || foundingYear > thisYear) return false
    const sum = activitySummary.trim()
    if (sum.length < 50 || sum.length > 500) return false
    // URL 필드는 선택이지만 입력된 경우 유효해야
    for (const url of [websiteUrl, snsUrl, charterUrl]) {
      if (url.trim()) {
        try { new URL(url.trim()) } catch { return false }
      }
    }
    return true
  })()

  const goNext = () => {
    setError(null)
    setFieldErrors({})
    if (step === 1 && canProceedStep1) setStep(2)
    else if (step === 2 && canProceedStep2) setStep(3)
    else if (step === 3 && canProceedStep3) setStep(4)
  }

  const goBack = () => {
    setError(null)
    setFieldErrors({})
    if (step > 1) setStep((step - 1) as Step)
    else router.push('/clubs')
  }

  const handleSubmit = async () => {
    if (!canProceedStep3 || !selectedUniv) return
    setError(null)
    setFieldErrors({})
    setSubmitting(true)
    try {
      const payload = {
        name: name.trim(),
        slug: slugInput.trim() ? slugInput.trim().toLowerCase() : undefined,
        description: description.trim() || undefined,
        logo_url: logoUrl.trim() || undefined,
        university_id: selectedUniv.id,
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
      const res = await fetch('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json?.error?.message ?? '클럽 신청에 실패했습니다')
        if (json?.error?.details && typeof json.error.details === 'object') {
          setFieldErrors(json.error.details)
        }
        setSubmitting(false)
        return
      }
      toast.success('클럽 인증 신청이 접수되었습니다', {
        description: '검토 후 1~3영업일 내에 알려 드립니다.',
      })
      router.push(`/clubs/${json.data?.slug ?? previewSlug}`)
    } catch {
      setError('네트워크가 불안정합니다. 다시 시도해 주세요.')
      setSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <Loader2 size={20} className="animate-spin mx-auto text-txt-disabled" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-3">
        <p className="text-sm text-txt-tertiary">클럽을 신청하려면 로그인이 필요합니다.</p>
        <Link href="/login?redirect=/clubs/new" className="inline-block text-sm text-brand hover:underline">
          로그인 →
        </Link>
      </div>
    )
  }

  const INPUT_CLASS = 'ob-input w-full px-4 py-3 bg-surface-card border border-border rounded-xl text-[14px] text-txt-primary placeholder:text-txt-disabled'

  return (
    <div className="ob-atmos min-h-full">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={goBack}
            className="text-txt-tertiary hover:text-txt-primary transition-colors"
            aria-label="뒤로"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[20px] font-bold text-txt-primary">공식 클럽 등록 신청</h1>
            <p className="text-[12px] text-txt-tertiary mt-0.5">
              단계 {step} / 4 · 검토 후 공개 목록에 노출됩니다
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-8" role="progressbar" aria-valuemin={0} aria-valuemax={4} aria-valuenow={step}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex-1 h-[4px] rounded-full overflow-hidden bg-surface-sunken">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  i < step ? 'bg-surface-inverse w-full' : i === step ? 'bg-brand w-full' : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-5 p-3 bg-status-danger-bg rounded-xl border border-status-danger-text/20 flex items-start gap-2 text-status-danger-text text-sm">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {/* STEP 1: 학교 선택 */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="flex items-start gap-3 mb-2">
              <GraduationCap size={22} className="text-brand shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h2 className="text-[17px] font-bold text-txt-primary mb-1">소속 학교를 선택해 주세요</h2>
                <p className="text-[12px] text-txt-tertiary leading-relaxed">
                  공식 등록 검토 시 학교와 연결된 동아리인지 확인합니다. 선택하신 학교의 이름으로
                  뱃지가 부여됩니다.
                </p>
              </div>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-txt-tertiary pointer-events-none" aria-hidden="true" />
              <input
                type="text"
                value={univQuery}
                onChange={(e) => setUnivQuery(e.target.value)}
                placeholder="학교 이름으로 검색 (예: 경희대, 서울대)"
                className={`${INPUT_CLASS} pl-10`}
              />
            </div>

            <div className="bg-surface-card border border-border rounded-xl overflow-hidden max-h-[360px] overflow-y-auto">
              {univLoading && (
                <div className="p-4 text-center text-[12px] text-txt-tertiary">
                  <Loader2 size={14} className="animate-spin inline mr-1" />
                  불러오는 중…
                </div>
              )}
              {!univLoading && univResults.length === 0 && (
                <div className="p-6 text-center text-[13px] text-txt-tertiary">
                  일치하는 학교가 없습니다.
                  <br />
                  <span className="text-[11px]">등록이 필요하면 admin@dailydraft.me 로 연락 주세요</span>
                </div>
              )}
              {!univLoading && univResults.map(u => {
                const active = selectedUniv?.id === u.id
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSelectedUniv(u)}
                    className={`w-full px-4 py-3 flex items-center justify-between gap-3 text-left border-b border-border-subtle last:border-b-0 transition-colors ${
                      active ? 'bg-brand-bg' : 'hover:bg-surface-sunken'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className={`text-[13px] font-semibold truncate ${active ? 'text-brand' : 'text-txt-primary'}`}>
                        {u.name}
                      </p>
                      {u.short_name && u.short_name !== u.name && (
                        <p className="text-[11px] text-txt-tertiary mt-0.5 truncate">{u.short_name}</p>
                      )}
                    </div>
                    {active && <Check size={16} className="text-brand shrink-0" strokeWidth={2.5} />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 2: 클럽 기본 정보 */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-start gap-3 mb-2">
              <FileText size={22} className="text-brand shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h2 className="text-[17px] font-bold text-txt-primary mb-1">클럽 기본 정보</h2>
                <p className="text-[12px] text-txt-tertiary leading-relaxed">
                  공개되는 기본 정보입니다. 나중에 언제든 수정하실 수 있습니다.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-txt-primary">
                클럽 이름 <span className="text-status-danger-text">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: FLIP, 소프트웨어학회"
                maxLength={50}
                required
                className={INPUT_CLASS}
              />
              <div className="flex justify-between text-[11px] text-txt-disabled pt-1">
                <span>2~50자</span>
                <span>{name.length}/50</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-txt-primary">
                URL 주소 <span className="text-txt-tertiary font-normal">(선택)</span>
              </label>
              <div className="flex items-center bg-surface-card border border-border rounded-xl overflow-hidden focus-within:border-brand focus-within:shadow-[0_0_0_3px_rgba(94,106,210,0.12)] transition-all">
                <span className="pl-4 pr-1 text-[13px] text-txt-tertiary shrink-0 font-mono">draft.me/clubs/</span>
                <input
                  type="text"
                  value={slugInput}
                  onChange={(e) => setSlugInput(e.target.value)}
                  placeholder={autoSlug(name) || 'my-club'}
                  maxLength={30}
                  className="flex-1 min-w-0 pr-4 py-3 bg-transparent text-[13px] text-txt-primary placeholder:text-txt-disabled focus:outline-hidden font-mono"
                />
              </div>
              <p className="text-[11px] text-txt-disabled pt-1">
                비워두면 이름에서 자동 생성. 미리보기: <span className="font-mono text-txt-tertiary">/clubs/{previewSlug}</span>
              </p>
              {slugReserved && (
                <p className="text-[12px] text-status-danger-text">&ldquo;{previewSlug}&rdquo;는 예약어라 사용할 수 없습니다</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-txt-primary">
                소개 <span className="text-txt-tertiary font-normal">(선택)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="어떤 활동을 하는 클럽인가요? 한두 문장으로 적어 주세요"
                rows={3}
                maxLength={500}
                className={`${INPUT_CLASS} resize-none`}
              />
              <div className="text-[11px] text-txt-disabled text-right pt-1">{description.length}/500</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-txt-primary">
                로고 URL <span className="text-txt-tertiary font-normal">(선택)</span>
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className={`${INPUT_CLASS} font-mono`}
              />
            </div>
          </div>
        )}

        {/* STEP 3: 증빙 */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="flex items-start gap-3 mb-2">
              <ShieldCheck size={22} className="text-brand shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h2 className="text-[17px] font-bold text-txt-primary mb-1">공식 등록 증빙</h2>
                <p className="text-[12px] text-txt-tertiary leading-relaxed">
                  실제로 운영 중인 학교 동아리인지 확인하기 위한 자료입니다. 제출해 주시는 정보는
                  검토 목적으로만 사용됩니다.
                </p>
              </div>
            </div>

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
                  placeholder="학교 이메일 권장 (@ac.kr)"
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
                placeholder="최근 1년 주요 활동을 50~500자로 적어 주세요. 예: 기수별 정기 프로젝트, 학교 행사 주최, 연말 쇼케이스 등"
                rows={5}
                maxLength={500}
                className={`${INPUT_CLASS} resize-none`}
              />
              <div className="flex justify-between text-[11px] text-txt-disabled pt-1">
                <span>최소 50자</span>
                <span className={activitySummary.length < 50 ? 'text-status-danger-text' : ''}>
                  {activitySummary.length}/500
                </span>
              </div>
              {fieldErrors.activity_summary && (
                <p className="text-[11px] text-status-danger-text">{fieldErrors.activity_summary}</p>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-[12px] font-semibold text-txt-secondary">참고 자료 (선택)</p>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="웹사이트 (선택)"
                className={`${INPUT_CLASS} font-mono`}
              />
              {fieldErrors.website_url && (
                <p className="text-[11px] text-status-danger-text">{fieldErrors.website_url}</p>
              )}
              <input
                type="url"
                value={snsUrl}
                onChange={(e) => setSnsUrl(e.target.value)}
                placeholder="Instagram · Discord · Notion 등 SNS (선택)"
                className={`${INPUT_CLASS} font-mono`}
              />
              {fieldErrors.sns_url && (
                <p className="text-[11px] text-status-danger-text">{fieldErrors.sns_url}</p>
              )}
              <input
                type="url"
                value={charterUrl}
                onChange={(e) => setCharterUrl(e.target.value)}
                placeholder="회칙·소개 문서 URL (선택)"
                className={`${INPUT_CLASS} font-mono`}
              />
              {fieldErrors.charter_url && (
                <p className="text-[11px] text-status-danger-text">{fieldErrors.charter_url}</p>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: 확인 */}
        {step === 4 && selectedUniv && (
          <div className="space-y-5">
            <div className="flex items-start gap-3 mb-2">
              <ShieldCheck size={22} className="text-brand shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h2 className="text-[17px] font-bold text-txt-primary mb-1">제출 내용을 확인해 주세요</h2>
                <p className="text-[12px] text-txt-tertiary leading-relaxed">
                  제출 후 1~3영업일 안에 검토 결과를 알려 드립니다. 검토 중에는 공개 목록에
                  노출되지 않고, 초대 링크를 통해서만 멤버를 받으실 수 있습니다.
                </p>
              </div>
            </div>

            <div className="bg-surface-card border border-border rounded-2xl p-5 space-y-4 text-[13px]">
              <SummaryRow label="학교" value={selectedUniv.name} />
              <SummaryRow label="클럽 이름" value={name} />
              <SummaryRow label="URL" value={`/clubs/${previewSlug}`} mono />
              {description && <SummaryRow label="소개" value={description} />}
              <div className="border-t border-border-subtle pt-3 space-y-3">
                <SummaryRow label="대표자" value={`${repName} · ${repEmail}`} />
                <SummaryRow label="창립 연도" value={String(foundingYear)} />
                <SummaryRow label="활동 요약" value={activitySummary} multiline />
                {websiteUrl && <SummaryRow label="웹사이트" value={websiteUrl} mono />}
                {snsUrl && <SummaryRow label="SNS" value={snsUrl} mono />}
                {charterUrl && <SummaryRow label="문서" value={charterUrl} mono />}
              </div>
            </div>

            <p className="text-[11px] text-txt-tertiary text-center leading-relaxed">
              제출하시면 Draft 의 이용약관 및 공식 등록 심사 정책에 동의하시는 것으로 간주합니다.
              심사 중 허위 자료가 확인되면 신청이 자동 거부됩니다.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-3 mt-8">
          <button
            type="button"
            onClick={goBack}
            disabled={submitting}
            className="flex items-center justify-center gap-1 px-4 py-3 text-[13px] font-semibold text-txt-secondary hover:text-txt-primary hover:bg-surface-sunken rounded-xl transition-colors disabled:opacity-50"
          >
            <ArrowLeft size={14} />
            {step === 1 ? '취소' : '이전'}
          </button>

          {step < 4 && (
            <button
              type="button"
              onClick={goNext}
              disabled={
                (step === 1 && !canProceedStep1) ||
                (step === 2 && !canProceedStep2) ||
                (step === 3 && !canProceedStep3)
              }
              className="ob-press-spring flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-surface-inverse text-txt-inverse rounded-xl text-[14px] font-bold hover:opacity-90 shadow-[0_4px_14px_-4px_rgba(0,0,0,0.25)] hover:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
              <ArrowRight size={14} />
            </button>
          )}

          {step === 4 && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="ob-press-spring flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-brand text-white rounded-xl text-[14px] font-bold hover:bg-brand-hover shadow-[0_4px_14px_-4px_rgba(94,106,210,0.35)] hover:shadow-[0_6px_20px_-4px_rgba(94,106,210,0.45)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  제출 중…
                </>
              ) : (
                <>
                  <Check size={14} />
                  신청 제출
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value, mono, multiline }: { label: string; value: string; mono?: boolean; multiline?: boolean }) {
  return (
    <div className={multiline ? 'space-y-1' : 'flex items-baseline gap-3'}>
      <span className="text-[11px] font-semibold text-txt-tertiary uppercase tracking-wider shrink-0 min-w-[72px]">
        {label}
      </span>
      <span className={`${mono ? 'font-mono' : ''} text-txt-primary ${multiline ? 'block text-[12px] leading-relaxed' : 'truncate'}`}>
        {value}
      </span>
    </div>
  )
}
