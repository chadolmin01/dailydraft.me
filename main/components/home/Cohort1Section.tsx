'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { SectionLabel, SectionTitle } from './shared'

export const Cohort1Section: React.FC = () => {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim()) {
      setError('이메일을 입력해주세요')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/cohort-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'landing_cohort1' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error?.message || '등록에 실패했습니다')
        return
      }
      setDone(true)
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="w-full py-16 px-6 md:px-10 bg-surface-card">
      <div className="max-w-5xl mx-auto">
        {/* 헤더 — 다른 섹션과 동일한 SectionLabel + SectionTitle */}
        <div className="text-center mb-10">
          <SectionLabel>NOW RECRUITING</SectionLabel>
          <SectionTitle>Draft 1기, 4/12까지 모집합니다</SectionTitle>
          <p className="mt-4 text-sm md:text-base text-txt-secondary leading-relaxed max-w-xl mx-auto break-keep">
            경희대 국제캠에서 8주 동안 AI로 직접 프로덕트를 만들
            <br className="hidden sm:block" />
            5~7명의 메이커를 찾고 있습니다.
          </p>
        </div>

        {/* 통계 */}
        <div className="flex items-center justify-center gap-6 sm:gap-12 mb-12">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-txt-primary">8주</div>
            <div className="text-[10px] font-mono text-txt-tertiary mt-1">프로그램</div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-txt-primary">5~7명</div>
            <div className="text-[10px] font-mono text-txt-tertiary mt-1">소규모</div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-txt-primary">6/23</div>
            <div className="text-[10px] font-mono text-txt-tertiary mt-1">데모데이</div>
          </div>
        </div>

        {/* 두 갈래 CTA */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* 1기 신청 */}
          <div className="rounded-2xl border border-border bg-surface-card p-6 sm:p-8 flex flex-col">
            <span className="text-[10px] font-mono uppercase tracking-wider text-brand block mb-3">
              JOIN COHORT 1
            </span>
            <h3 className="text-lg md:text-xl font-bold text-txt-primary mb-2">
              1기 신청하기
            </h3>
            <p className="text-xs md:text-sm text-txt-secondary leading-relaxed mb-6 flex-1 break-keep">
              경희대 국제캠 / FLIP 멤버를 위한 8주 프로그램입니다.
              4/12 자정까지 신청을 받습니다.
            </p>
            <Link
              href="/recruit"
              className="group inline-flex items-center justify-center gap-2 bg-brand text-white px-5 py-3 rounded-full font-bold text-sm hover:bg-brand-hover transition-all duration-200 active:scale-[0.97] shadow-sm"
            >
              1기 자세히 보기
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* 다음 기수 알림 */}
          <div className="rounded-2xl border border-border bg-surface-card p-6 sm:p-8 flex flex-col">
            <span className="text-[10px] font-mono uppercase tracking-wider text-txt-tertiary block mb-3">
              NEXT COHORT
            </span>
            <h3 className="text-lg md:text-xl font-bold text-txt-primary mb-2">
              다음 기수 알림 받기
            </h3>
            <p className="text-xs md:text-sm text-txt-secondary leading-relaxed mb-6 flex-1 break-keep">
              2기 모집이 시작되면 가장 먼저 알려드립니다.
              이메일 한 줄이면 충분합니다.
            </p>

            {done ? (
              <div className="flex items-center gap-2 text-sm text-brand font-medium">
                <Check size={16} />
                알림 신청이 완료되었습니다
              </div>
            ) : (
              <form onSubmit={handleWaitlist} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="이메일"
                    required
                    disabled={submitting}
                    className="flex-1 px-4 py-3 rounded-full border border-border bg-surface-card text-txt-primary text-sm placeholder:text-txt-tertiary focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-3 rounded-full font-bold text-sm border border-border bg-surface-card text-txt-primary hover:bg-surface-sunken transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {submitting ? '...' : '알림 받기'}
                  </button>
                </div>
                {error && <p className="text-xs text-status-error-text">{error}</p>}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
