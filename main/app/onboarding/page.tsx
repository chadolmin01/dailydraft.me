'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, Sparkles, ArrowRight, AlertCircle } from 'lucide-react'
import { Onboarding } from '@/components/Onboarding'
import { OfflineBanner } from '@/components/onboarding/OfflineBanner'
import type { ProfileDraft } from '@/src/lib/onboarding/types'

/** Preload critical onboarding SVGs — browser fetches before React renders */
const PRELOAD_SVGS = ['/onboarding/1.svg', '/onboarding/done.svg']

/** All SVGs used in onboarding — preload in background */
const ALL_SVGS = [
  '/onboarding/1.svg', '/onboarding/2.svg', '/onboarding/3.svg',
  '/onboarding/4.svg', '/onboarding/5.svg', '/onboarding/6.svg',
  '/onboarding/done.svg', '/onboarding/leader_follower.svg',
  '/onboarding/add_project.svg', '/onboarding/almost.svg',
  '/onboarding/Deadline.svg',
]

type Phase = 'loading' | 'basic' | 'transition' | 'post-basic'

export default function OnboardingPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('loading')
  const [completedDraft, setCompletedDraft] = useState<ProfileDraft | null>(null)

  // SVG 프리로드 — 첫 화면 SVG 로드 완료 후 basic phase 진입
  useEffect(() => {
    let done = false
    const critical = new window.Image()
    critical.src = '/onboarding/1.svg'
    critical.onload = () => { if (!done) { done = true; setPhase('basic') } }
    critical.onerror = () => { if (!done) { done = true; setPhase('basic') } }
    // 최대 0.5초 대기 — 그 안에 안 오면 그냥 진행 (SVG 는 백그라운드 로드 계속)
    const timeout = setTimeout(() => { if (!done) { done = true; setPhase('basic') } }, 500)
    // 나머지 SVG 백그라운드 프리로드
    ALL_SVGS.forEach(src => { const img = new window.Image(); img.src = src })
    return () => clearTimeout(timeout)
  }, [])

  const handleBasicComplete = useCallback((draft?: ProfileDraft) => {
    // Save draft to sessionStorage so interview page can pick it up
    if (draft) {
      sessionStorage.setItem('onboarding-draft', JSON.stringify(draft))
      setCompletedDraft(draft)
    }
    setPhase('transition')
  }, [])

  useEffect(() => {
    if (phase !== 'transition') return
    // Prefetch interview SVGs during transition wait
    ['/onboarding/almost.svg', '/onboarding/leader_follower.svg',
     '/onboarding/2.svg', '/onboarding/3.svg', '/onboarding/4.svg',
     '/onboarding/5.svg', '/onboarding/6.svg', '/onboarding/Deadline.svg',
     '/onboarding/done.svg',
    ].forEach(src => { const img = new Image(); img.src = src })

    // 2026-04-23: 자동 리다이렉트 제거. 저장 애니메이션 후 post-basic 화면에서
    // 유저가 AI 인터뷰 진행 / 건너뛰기를 직접 선택하게 전환.
    // 저장은 이미 basic 단계에서 완료된 상태 — 짧은 완료 확인(800ms) 만 보이고 바로 다음 단계.
    const t = setTimeout(() => setPhase('post-basic'), 800)
    return () => clearTimeout(t)
  }, [phase])

  // 유입 경로별 완료 후 landing 결정
  const [landingError, setLandingError] = useState<string | null>(null)
  const [landingBusy, setLandingBusy] = useState(false)

  const goToPathLanding = useCallback(async () => {
    const source = completedDraft?.source
    const code = completedDraft?.inviteCode
    setLandingError(null)
    setLandingBusy(true)
    try {
      if (source === 'invite' && code) {
        // 초대 코드로 바로 클럽 가입 시도.
        try {
          const res = await fetch('/api/clubs/join-by-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
          })
          const body = await res.json().catch(() => ({}))
          const slug = body?.data?.club_slug as string | undefined
          if (res.ok && slug) {
            router.push(`/clubs/${slug}`)
            return
          }
          // 서버가 200 이지만 slug 없음 → 대시보드로 fallback, 배너로 안내
          const serverMsg = (body?.error?.message as string | undefined)
          setLandingError(
            serverMsg ??
              '초대 코드 확인에 시간이 걸리고 있습니다. 대시보드에서 바로 연결해 드릴게요.',
          )
        } catch {
          setLandingError(
            '네트워크가 불안정해 초대 코드를 지금 처리하지 못했습니다. 대시보드에서 재시도하실 수 있습니다.',
          )
        }
        // invite 실패해도 dashboard 로 가서 GuideCTA invite landing 으로 이어짐
        router.push('/dashboard')
        return
      }
      if (source === 'operator') {
        router.push('/clubs/new')
        return
      }
      // matching / exploring / 기타 모두 대시보드 GuideCTA 로
      router.push('/dashboard')
    } finally {
      setLandingBusy(false)
    }
  }, [completedDraft, router])

  // SVG 프리로드 대기 화면 — D 로고 12×12 rounded-2xl 로 통일 (다른 loading 화면과 동일).
  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 bg-surface-bg flex items-center justify-center">
        <div className="w-12 h-12 bg-surface-inverse rounded-2xl flex items-center justify-center animate-pulse">
          <span className="text-txt-inverse font-black text-lg leading-none">D</span>
        </div>
      </div>
    )
  }

  // Transition screen: 저장 완료 확인 → post-basic. 통일 토큰 적용 — w-14 아이콘 + ob-stagger-item 60ms.
  // 3-layer 센터링: outer scroll + middle min-h-full center + inner content.
  // flex justify-center 단독은 overflow-y-auto 와 같이 쓰이거나 콘텐츠가 작을 때 viewport 인식이
  // 환경에 따라 위쪽 정렬되는 케이스가 있어 min-h-full 명시로 viewport 100% 보장.
  if (phase === 'transition') {
    return (
      <div className="fixed inset-0 ob-atmos overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-4">
          <div className="flex flex-col items-center">
          <div
            className="ob-stagger-item w-14 h-14 rounded-full bg-brand flex items-center justify-center mb-4"
            style={{ ['--stagger' as string]: '0ms' }}
          >
            <CheckCircle2 size={28} className="text-white" />
          </div>
          <h2
            className="ob-stagger-item text-[18px] font-bold text-txt-primary mb-1 text-center"
            style={{ ['--stagger' as string]: '60ms' }}
          >
            저장 완료
          </h2>
          <p
            className="ob-stagger-item text-[13px] text-txt-secondary text-center"
            style={{ ['--stagger' as string]: '120ms' }}
          >
            이제 Draft 를 시작하실 수 있습니다.
          </p>
          </div>
        </div>
      </div>
    )
  }

  // Post-basic: 유저가 직접 선택 — AI 인터뷰 진행 또는 바로 시작.
  // 통일 토큰 적용 — w-14 아이콘 / ob-stagger-item 60ms / Title milestone 사이즈 / CTA 표준 / 합쇼체.
  // 3-layer 센터링 (transition 화면과 동일 패턴).
  if (phase === 'post-basic') {
    const source = completedDraft?.source
    const isMatching = source === 'matching'
    return (
      <>
        <OfflineBanner />
        <div className="fixed inset-0 ob-atmos overflow-y-auto">
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="w-full max-w-md flex flex-col items-center">
            <div
              className="ob-stagger-item w-14 h-14 rounded-full bg-brand-bg flex items-center justify-center mb-4"
              style={{ ['--stagger' as string]: '0ms' }}
            >
              <Sparkles size={24} className="text-brand" aria-hidden="true" />
            </div>
            <h2
              className="ob-stagger-item text-[22px] sm:text-[24px] font-black text-txt-primary text-center mb-2"
              style={{ ['--stagger' as string]: '60ms' }}
            >
              {isMatching
                ? '2분 대화로 매칭 정확도를 높여 보시겠습니까?'
                : '기본 정보를 저장했습니다'}
            </h2>
            <p
              className="ob-stagger-item text-[13px] text-txt-secondary text-center leading-relaxed mb-5 break-keep max-w-sm"
              style={{ ['--stagger' as string]: '120ms' }}
            >
              {isMatching
                ? '작업 스타일·협업 성향 7가지 질문을 받아 팀원 추천 정확도를 올려 드립니다. 지금 건너뛰셔도 나중에 프로필에서 언제든 진행하실 수 있습니다.'
                : '원하시면 2분 대화로 매칭 정확도를 올리실 수 있고, 지금은 바로 시작하셔도 됩니다.'}
            </p>

            {/* 초대 코드 처리 실패·연결 이슈 안내 */}
            {landingError && (
              <div
                role="alert"
                className="w-full mb-3 bg-status-warn-bg border border-status-warn-text/30 rounded-xl p-3 flex items-start gap-2"
              >
                <AlertCircle size={14} className="text-status-warn-text shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-[12px] text-status-warn-text leading-relaxed">{landingError}</p>
              </div>
            )}

            <div
              className="ob-stagger-item w-full space-y-2"
              style={{ ['--stagger' as string]: '180ms' }}
            >
              <button
                type="button"
                disabled={landingBusy}
                onClick={() => {
                  if (isMatching) {
                    router.push('/onboarding/interview')
                  } else {
                    goToPathLanding()
                  }
                }}
                className="ob-press-spring w-full flex items-center justify-center gap-2 py-4 bg-surface-inverse text-txt-inverse rounded-full text-[14px] font-black hover:opacity-90 shadow-[0_4px_14px_-4px_rgba(0,0,0,0.25)] hover:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.3)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {landingBusy ? (
                  <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                ) : isMatching ? (
                  <Sparkles size={15} aria-hidden="true" />
                ) : (
                  <ArrowRight size={15} aria-hidden="true" />
                )}
                {landingBusy
                  ? '이동 중입니다'
                  : isMatching
                    ? 'AI 인터뷰 진행하기'
                    : '바로 시작하기'}
              </button>
              <button
                type="button"
                disabled={landingBusy}
                onClick={() => {
                  if (isMatching) {
                    // matching 경로에서 "지금은 건너뛰기" 선택 → 대시보드로
                    goToPathLanding()
                  } else {
                    // 비매칭 경로에서 인터뷰 선택 → interview 페이지
                    router.push('/onboarding/interview')
                  }
                }}
                className="ob-press-spring w-full flex items-center justify-center gap-2 py-3.5 bg-surface-sunken text-txt-secondary rounded-full text-[13px] font-bold hover:bg-surface-card hover:text-txt-primary disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isMatching ? '지금은 건너뛰기' : 'AI 인터뷰 먼저 하기 (2분)'}
              </button>
            </div>
            <p
              className="ob-stagger-item text-[11px] text-txt-tertiary text-center mt-4 leading-relaxed"
              style={{ ['--stagger' as string]: '240ms' }}
            >
              AI 인터뷰는 프로필 페이지에서 언제든 다시 진행하실 수 있습니다.
            </p>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <OfflineBanner />
      {PRELOAD_SVGS.map(src => (
        <link key={src} rel="preload" as="image" type="image/svg+xml" href={src} />
      ))}
      <Onboarding onComplete={handleBasicComplete} />
    </>
  )
}
