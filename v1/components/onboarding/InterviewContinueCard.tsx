'use client'

import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import { useMicroPrompt } from '@/src/hooks/useMicroPrompt'
import { INTERVIEW_SCRIPT } from '@/src/lib/onboarding/interview-script'

/**
 * `<InterviewContinueCard>` — "이벤트 게이트" 패턴.
 *
 * Ambient MicroPrompt 로 인터뷰 7문항 중 이미 N개 답한 유저에게만 노출.
 * 임계치(3개) 이상 모였을 때 "나머지 K개만" 문구로 완료 부담을 낮춰 전환.
 *
 * - ai_chat_completed 유저에게는 이 카드 자체가 렌더되지 않음 (dashboard 조건)
 * - 3개 미만 답한 유저는 기존 MicroPromptCard (ambient) 로 유도
 * - 3개 이상 답한 유저는 이 카드로 인터뷰 완료 CTA 를 primary 노출
 */
export function InterviewContinueCard() {
  const { state } = useMicroPrompt()

  if (!state.loaded) return null

  const answered = INTERVIEW_SCRIPT.filter(q =>
    state.answered.has(q.interactiveId),
  ).length
  const remaining = INTERVIEW_SCRIPT.length - answered

  // 임계치 미만이면 기존 Ambient 경로를 방해하지 않음
  if (answered < 3 || remaining <= 0) return null

  return (
    <section className="mb-6">
      <div className="bg-brand-bg border border-brand/20 rounded-2xl p-5 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
          <Sparkles size={16} className="text-brand" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-brand mb-1">
            ✓ {answered}개 이미 완료
          </p>
          <h3 className="text-[15px] font-bold text-txt-primary mb-1 leading-tight break-keep">
            나머지 {remaining}개 질문만 답하시면 매칭 정확도가 올라갑니다
          </h3>
          <p className="text-[12px] text-txt-secondary leading-relaxed mb-3 break-keep">
            1분 내에 끝납니다. 지금까지 답하신 내용은 그대로 이어집니다.
          </p>
          <Link
            href="/onboarding/interview"
            className="inline-flex items-center gap-1.5 text-[13px] font-bold text-brand hover:text-brand/80 transition-colors"
          >
            이어서 완료하기
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
