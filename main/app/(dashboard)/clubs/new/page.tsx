'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Loader2, Rocket, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/src/context/AuthContext'

// name → slug 자동 변환. API의 로직과 동일하게 유지해야 사용자가 보는 프리뷰와
// 실제 저장되는 값이 일치. 틀리면 "보인 건 abc였는데 /clubs/abc-123 가 생김" 혼란.
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

export default function NewClubPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  const [name, setName] = useState('')
  const [slugInput, setSlugInput] = useState('') // 빈 문자열이면 name 기반 자동
  const [description, setDescription] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // 미리보기 슬러그: 사용자가 직접 입력했으면 그걸, 아니면 name 기반 자동.
  const previewSlug = useMemo(() => {
    if (slugInput.trim()) return slugInput.trim().toLowerCase()
    return autoSlug(name) || '...'
  }, [slugInput, name])

  const slugReserved = RESERVED_SLUGS.has(previewSlug)
  const nameValid = name.trim().length >= 2 && name.trim().length <= 50
  const canSubmit = nameValid && !slugReserved && !submitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setSubmitting(true)
    try {
      const payload: Record<string, string> = { name: name.trim() }
      if (slugInput.trim()) payload.slug = slugInput.trim().toLowerCase()
      if (description.trim()) payload.description = description.trim()
      if (logoUrl.trim()) payload.logo_url = logoUrl.trim()

      const res = await fetch('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json?.error?.message ?? '클럽 생성에 실패했습니다')
        setSubmitting(false)
        return
      }

      // 성공 — 트리거가 owner로 등록해둠. 바로 새 클럽 페이지로.
      toast.success(`"${json.data?.name ?? name}" 클럽이 생성되었습니다`, {
        description: '이제 멤버를 초대하거나 설정에서 Discord·공개 여부를 조정하실 수 있습니다.',
      })
      router.push(`/clubs/${json.data?.slug ?? previewSlug}`)
    } catch {
      setError(
        '인터넷 연결을 확인하고 다시 시도해 주세요. 문제가 계속되면 /status 페이지에서 시스템 상태를 확인하실 수 있습니다.',
      )
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
        <p className="text-sm text-txt-tertiary">클럽을 만들려면 로그인이 필요합니다.</p>
        <Link href="/login?redirect=/clubs/new" className="inline-block text-sm text-brand hover:underline">
          로그인 →
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-surface-bg min-h-full">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/clubs"
            className="text-txt-tertiary hover:text-txt-primary transition-colors"
            aria-label="뒤로"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-[22px] font-bold text-txt-primary">새 클럽 만들기</h1>
            <p className="text-[13px] text-txt-tertiary mt-0.5">동아리·학회·팀 공간을 만듭니다</p>
          </div>
        </div>

        {/* Hero */}
        <div className="bg-brand-bg border border-brand-border rounded-2xl p-5 mb-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center shrink-0">
            <Rocket size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-txt-primary mb-1">생성자가 자동으로 운영자가 됩니다</p>
            <p className="text-[13px] text-txt-secondary leading-relaxed">
              클럽이 만들어지면 멤버 초대, 프로젝트 추가, Discord 연결 등 모든 운영 기능을 바로 사용할 수 있습니다
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-status-danger-bg rounded-xl border border-status-danger-text/20 flex items-center gap-2 text-status-danger-text text-sm">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 이름 */}
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
              className="w-full px-4 py-3 bg-surface-card border border-border rounded-xl text-[15px] text-txt-primary placeholder:text-txt-disabled focus:outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(0,149,246,0.1)] transition-all"
            />
            <div className="flex justify-between text-[11px] text-txt-disabled pt-1">
              <span>2~50자</span>
              <span>{name.length}/50</span>
            </div>
          </div>

          {/* 슬러그 (URL) */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-txt-primary">
              URL 주소 <span className="text-txt-tertiary font-normal">(선택)</span>
            </label>
            <div className="flex items-center bg-surface-card border border-border rounded-xl overflow-hidden focus-within:border-brand focus-within:shadow-[0_0_0_3px_rgba(0,149,246,0.1)] transition-all">
              <span className="pl-4 pr-1 text-[14px] text-txt-tertiary shrink-0 font-mono">draft.me/clubs/</span>
              <input
                type="text"
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value)}
                placeholder={autoSlug(name) || 'my-club'}
                maxLength={30}
                pattern="[a-z0-9가-힣\-]+"
                className="flex-1 min-w-0 pr-4 py-3 bg-transparent text-[14px] text-txt-primary placeholder:text-txt-disabled focus:outline-none font-mono"
              />
            </div>
            <p className="text-[11px] text-txt-disabled pt-1">
              비워두면 이름에서 자동 생성. 미리보기: <span className="font-mono text-txt-tertiary">/clubs/{previewSlug}</span>
            </p>
            {slugReserved && (
              <p className="text-[12px] text-status-danger-text">&ldquo;{previewSlug}&rdquo;는 예약어라 사용할 수 없습니다</p>
            )}
          </div>

          {/* 설명 */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-txt-primary">
              소개 <span className="text-txt-tertiary font-normal">(선택)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="어떤 활동을 하는 클럽인가요? 한두 문장으로 적어주세요"
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 bg-surface-card border border-border rounded-xl text-[14px] text-txt-primary placeholder:text-txt-disabled focus:outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(0,149,246,0.1)] transition-all resize-none"
            />
            <div className="text-[11px] text-txt-disabled text-right pt-1">{description.length}/500</div>
          </div>

          {/* 로고 URL */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-txt-primary">
              로고 URL <span className="text-txt-tertiary font-normal">(선택)</span>
            </label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full px-4 py-3 bg-surface-card border border-border rounded-xl text-[14px] text-txt-primary placeholder:text-txt-disabled focus:outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(0,149,246,0.1)] transition-all font-mono"
            />
            <p className="text-[11px] text-txt-disabled pt-1">
              이미지가 있는 URL이면 카드·사이드바에 자동 표시됩니다. 나중에 설정에서 바꿀 수 있습니다
            </p>
          </div>

          {/* Submit */}
          <div className="pt-3 flex items-center gap-3">
            <Link
              href="/clubs"
              className="px-5 py-3 text-[14px] font-semibold text-txt-secondary hover:text-txt-primary transition-colors"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-brand text-white rounded-xl text-[14px] font-bold hover:bg-brand-hover active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>클럽 만들기 →</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
