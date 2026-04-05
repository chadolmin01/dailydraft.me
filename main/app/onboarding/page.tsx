'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'
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

type Phase = 'loading' | 'basic' | 'transition'

export default function OnboardingPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('loading')
  const [transitionDone, setTransitionDone] = useState(false)

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

    const t1 = setTimeout(() => setTransitionDone(true), 2000)
    const t2 = setTimeout(() => router.push('/onboarding/interview'), 3200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [phase, router])

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

  // Transition screen: loading → done → redirect
  if (phase === 'transition') {
    return (
      <div className="fixed inset-0 bg-surface-bg flex flex-col items-center justify-center p-6">
        {!transitionDone ? (
          <div key="loading" className="flex flex-col items-center animate-in fade-in duration-300">
            <Loader2 size={36} className="text-brand animate-spin mb-6" />
            <h2 className="text-lg font-bold text-txt-primary mb-1">
              프로필을 저장하고 있어요
            </h2>
            <p className="text-sm text-txt-tertiary">잠시만 기다려주세요...</p>
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
              저장 완료!
            </h2>
            <p className="text-sm text-txt-secondary">
              이제 매칭 정확도를 높여볼게요
            </p>
          </div>
        )}
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
