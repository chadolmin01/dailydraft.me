'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, Sparkles, ArrowRight } from 'lucide-react'
import { Onboarding } from '@/components/Onboarding'
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
  const [transitionDone, setTransitionDone] = useState(false)
  const [completedDraft, setCompletedDraft] = useState<ProfileDraft | null>(null)

  // SVG 프리로드 — 첫 화면 SVG 로드 완료 후 basic phase 진입
  useEffect(() => {
    let done = false
    const critical = new window.Image()
    critical.src = '/onboarding/1.svg'
    critical.onload = () => { if (!done) { done = true; setPhase('basic') } }
    critical.onerror = () => { if (!done) { done = true; setPhase('basic') } }
    // 최대 1.5초 대기 — 그 안에 안 오면 그냥 진행
    const timeout = setTimeout(() => { if (!done) { done = true; setPhase('basic') } }, 1500)
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
    const t1 = setTimeout(() => setTransitionDone(true), 1800)
    const t2 = setTimeout(() => setPhase('post-basic'), 2800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [phase])

  // 유입 경로별 완료 후 landing 결정
  const goToPathLanding = useCallback(async () => {
    const source = completedDraft?.source
    const code = completedDraft?.inviteCode
    if (source === 'invite' && code) {
      // 초대 코드로 바로 클럽 가입 시도. 성공하면 클럽 홈, 실패하면 GuideCTA 가 있는 dashboard.
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
      } catch {
        // network 오류 — dashboard 에서 GuideCTA 로 재시도
      }
    }
    if (source === 'operator') {
      router.push('/clubs/new')
      return
    }
    // matching / exploring / 기타 모두 대시보드 GuideCTA 로
    router.push('/dashboard')
  }, [completedDraft, router])

  // SVG 프리로드 대기 화면
  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 bg-surface-bg flex items-center justify-center">
        <div className="w-10 h-10 bg-surface-inverse rounded-xl flex items-center justify-center animate-pulse">
          <span className="text-txt-inverse font-black text-lg leading-none">D</span>
        </div>
      </div>
    )
  }

  // Transition screen: loading → done → post-basic
  if (phase === 'transition') {
    return (
      <div className="fixed inset-0 bg-surface-bg flex flex-col items-center justify-center p-6">
        {!transitionDone ? (
          <div key="loading" className="flex flex-col items-center animate-in fade-in duration-300">
            <Loader2 size={36} className="text-brand animate-spin mb-6" />
            <h2 className="text-lg font-bold text-txt-primary mb-1">
              프로필을 저장하고 있습니다
            </h2>
            <p className="text-sm text-txt-tertiary">잠시만 기다려 주세요. 이 화면을 닫으시면 처음부터 다시 진행됩니다.</p>
          </div>
        ) : (
          <div key="done" className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
            <div
              className="w-16 h-16 rounded-full bg-brand flex items-center justify-center mb-6"
              style={{ animation: 'ob-bubble-in 0.5s cubic-bezier(0.34, 1.4, 0.64, 1) both' }}
            >
              <CheckCircle2 size={32} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-txt-primary mb-1">
              저장 완료
            </h2>
            <p className="text-sm text-txt-secondary">
              이제 Draft 를 시작하실 수 있습니다
            </p>
          </div>
        )}
      </div>
    )
  }

  // Post-basic: 유저가 직접 선택 — AI 인터뷰 진행 또는 바로 시작
  // matching 경로 유저에게만 인터뷰 CTA 를 primary 로, 나머지는 primary="바로 시작".
  if (phase === 'post-basic') {
    const source = completedDraft?.source
    const isMatching = source === 'matching'
    return (
      <div className="fixed inset-0 bg-surface-bg flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md flex flex-col items-center animate-in fade-in duration-300">
          <div
            className="w-16 h-16 rounded-full bg-brand-bg flex items-center justify-center mb-6"
            style={{ animation: 'ob-bubble-in 0.5s cubic-bezier(0.34, 1.4, 0.64, 1) both' }}
          >
            <Sparkles size={28} className="text-brand" />
          </div>
          <h2 className="text-[20px] sm:text-[22px] font-bold text-txt-primary text-center mb-2">
            {isMatching
              ? '2분 대화로 매칭 정확도를 높여 보시겠어요?'
              : '기본 정보를 저장했습니다'}
          </h2>
          <p className="text-[13px] text-txt-secondary text-center leading-relaxed mb-8 break-keep max-w-sm">
            {isMatching
              ? '작업 스타일·협업 성향 7가지 질문을 받아 팀원 추천 정확도를 올려 드립니다. 지금 건너뛰시고 나중에 프로필에서 언제든 진행하셔도 됩니다.'
              : '원하시면 2분 대화로 매칭 정확도를 올릴 수도 있지만, 지금은 필요하지 않다면 바로 시작하셔도 됩니다.'}
          </p>
          <div className="w-full space-y-2.5">
            <button
              type="button"
              onClick={() => {
                if (isMatching) {
                  router.push('/onboarding/interview')
                } else {
                  goToPathLanding()
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-4 bg-surface-inverse text-txt-inverse rounded-full text-[15px] font-black hover:opacity-90 active:scale-[0.97] transition-all"
            >
              {isMatching ? <Sparkles size={15} /> : <ArrowRight size={15} />}
              {isMatching ? 'AI 인터뷰 진행하기' : '바로 시작하기'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (isMatching) {
                  // matching 경로에서 "지금은 건너뛰기" 선택 → 대시보드로
                  goToPathLanding()
                } else {
                  // 비매칭 경로에서 인터뷰 선택 → interview 페이지
                  router.push('/onboarding/interview')
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-surface-sunken text-txt-secondary rounded-full text-[14px] font-bold hover:bg-surface-card hover:text-txt-primary transition-all"
            >
              {isMatching ? '지금은 건너뛰기' : 'AI 인터뷰 먼저 하기 (2분)'}
            </button>
          </div>
          <p className="text-[11px] text-txt-tertiary text-center mt-6 leading-relaxed">
            AI 인터뷰는 프로필 페이지에서 언제든 다시 진행하실 수 있습니다.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {PRELOAD_SVGS.map(src => (
        <link key={src} rel="preload" as="image" type="image/svg+xml" href={src} />
      ))}
      <Onboarding onComplete={handleBasicComplete} />
    </>
  )
}
