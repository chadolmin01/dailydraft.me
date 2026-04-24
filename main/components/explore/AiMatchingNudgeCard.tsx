'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, X, ArrowRight } from 'lucide-react'
import { useProfile } from '@/src/hooks/useProfile'

const DISMISS_KEY_PREFIX = 'ai-nudge-dismissed-'

function getDismissKey() {
  const d = new Date()
  return `${DISMISS_KEY_PREFIX}${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function AiMatchingNudgeCard() {
  const router = useRouter()
  const { data: profile } = useProfile()
  const [dismissed, setDismissed] = useState(true) // default hidden to avoid flash

  useEffect(() => {
    setDismissed(localStorage.getItem(getDismissKey()) === '1')
    // "시작하기" 버튼이 sessionStorage 저장 후 이동하는 구조라 Link화가 어려움 →
    // 컴포넌트 보이는 순간 대상 라우트 JS를 미리 예열해 클릭 체감을 개선.
    router.prefetch('/onboarding/interview')
  }, [router])

  if (dismissed) return null

  return (
    <div className="group relative overflow-hidden border border-border bg-surface-card rounded-xl shadow-sm mb-4 transition-all duration-300 hover:shadow-md">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-brand via-brand/60 to-transparent" />

      <div className="flex items-center gap-4 px-4 py-3.5">
        <div className="relative w-10 h-10 bg-surface-inverse rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
          <Sparkles size={16} className="text-white" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand rounded-full border-2 border-surface-card animate-pulse" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-mono font-bold text-brand uppercase tracking-wider">AI MATCHING</span>
          </div>
          <p className="text-xs text-txt-secondary">
            AI 프로필 분석하면 맞춤 추천이 더 정확해져요
          </p>
        </div>

        <button
          onClick={() => {
            // 프로필 데이터를 sessionStorage에 저장 후 온보딩 인터뷰로 이동
            if (profile) {
              const draft = {
                name: profile.nickname || '',
                affiliationType: profile.affiliation_type || 'student',
                university: profile.university || '',
                major: profile.major || '',
                locations: (profile.locations as string[] | null) ?? [],
                position: profile.desired_position || '',
                situation: profile.current_situation || 'exploring',
                skills: (profile.skills as Array<{ name: string }> | null)?.map(s => s.name) ?? [],
                interests: (profile.interest_tags as string[] | null) ?? [],
              }
              sessionStorage.setItem('onboarding-draft', JSON.stringify(draft))
            }
            router.push('/onboarding/interview')
          }}
          className="shrink-0 px-3.5 py-2 bg-surface-inverse text-txt-inverse text-xs font-bold rounded-xl group-hover:bg-brand transition-colors duration-300 flex items-center gap-1.5"
        >
          시작하기
          <ArrowRight size={12} />
        </button>

        <button
          onClick={() => {
            localStorage.setItem(getDismissKey(), '1')
            setDismissed(true)
          }}
          className="shrink-0 p-1.5 text-txt-disabled hover:text-txt-secondary transition-colors rounded-lg hover:bg-surface-sunken"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
