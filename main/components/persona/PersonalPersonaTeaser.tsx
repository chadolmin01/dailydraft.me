'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ChevronLeft, Loader2 } from 'lucide-react'

interface Props {
  userEmail: string
}

/**
 * 개인 페르소나 출시 예고 페이지.
 *
 * 2026 여름 정식 출시 전까지:
 *   - waitlist 이메일 등록만 가능
 *   - 실제 화면 50% opacity 미리보기로 노출 (속이지 않는 투명성)
 *   - 왜 지금 아닌지 솔직한 설명
 */
export function PersonalPersonaTeaser({ userEmail }: Props) {
  const [email, setEmail] = useState(userEmail)
  const emailInputRef = useRef<HTMLInputElement>(null)

  // 기존 등록 여부 확인
  const { data: waitlistStatus } = useQuery<{ registered: boolean }>({
    queryKey: ['personal-persona-waitlist'],
    queryFn: async () => {
      const res = await fetch('/api/personas/waitlist')
      return res.json()
    },
  })

  const subscribeMut = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/personas/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || '등록 실패')
      }
      return res.json()
    },
    onSuccess: (body: { already_registered: boolean }) => {
      if (body.already_registered) {
        toast.info('이미 알림이 등록되어 있습니다')
      } else {
        toast.success('출시 알림이 등록되었습니다')
      }
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const alreadyRegistered =
    waitlistStatus?.registered || subscribeMut.data?.already_registered

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/profile"
          className="text-txt-tertiary hover:text-txt-primary transition-colors"
          aria-label="프로필로"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-txt-primary">개인 페르소나</h1>
            <span className="text-[10px] font-semibold text-txt-tertiary bg-surface-sunken px-1.5 py-0.5 rounded">
              개인 계층
            </span>
          </div>
          <p className="text-xs text-txt-tertiary">프로필 · 페르소나</p>
        </div>
      </div>

      {/* 메인 배너 */}
      <div className="bg-linear-to-r from-brand-bg to-brand-bg/40 border border-brand/20 rounded-2xl p-6 md:p-8 mb-6">
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <h2 className="text-lg font-bold text-txt-primary">개인 페르소나</h2>
          <span className="text-[11px] font-semibold text-brand bg-brand-bg px-2.5 py-1 rounded-full shrink-0">
            2026 여름 출시 예정
          </span>
        </div>

        <p className="text-sm text-txt-secondary leading-relaxed mb-5 max-w-2xl">
          클럽·프로젝트 톤을 상속받아, 본인의 기여 기록으로 포트폴리오 업데이트·LinkedIn 포스트·이력서
          초안을 생성합니다.
        </p>

        {/* 기대 효과 */}
        <div className="mb-6">
          <p className="text-[11px] font-semibold text-txt-tertiary mb-2 uppercase tracking-wider">
            기대 효과
          </p>
          <ul className="text-[13px] text-txt-secondary space-y-1.5">
            <li className="flex items-baseline gap-3">
              <span className="text-txt-tertiary shrink-0">·</span>
              <span>매칭 정확도 <strong className="text-txt-primary">+30%</strong></span>
            </li>
            <li className="flex items-baseline gap-3">
              <span className="text-txt-tertiary shrink-0">·</span>
              <span>수작업 콘텐츠 제작 <strong className="text-txt-primary">주 4시간 감소</strong></span>
            </li>
            <li className="flex items-baseline gap-3">
              <span className="text-txt-tertiary shrink-0">·</span>
              <span>외부 발행: LinkedIn · Threads · 개인 블로그</span>
            </li>
          </ul>
        </div>

        {/* Waitlist CTA */}
        {alreadyRegistered ? (
          <div className="bg-surface-card border border-status-success-text/30 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-status-success-text" />
            <p className="text-[13px] text-txt-primary font-semibold">
              출시 알림이 등록되었습니다
            </p>
            <p className="text-[11px] text-txt-tertiary ml-auto">
              출시 당일 <span className="text-txt-secondary">{email}</span> 로 한 번만 전송
            </p>
          </div>
        ) : (
          <div className="bg-surface-card border border-border rounded-xl p-4">
            <p className="text-[11px] text-txt-tertiary mb-2">출시 알림 받기</p>
            <div className="flex items-center gap-2">
              <input
                ref={emailInputRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && email.includes('@') && !subscribeMut.isPending) {
                    subscribeMut.mutate()
                  }
                }}
                placeholder="your@email.com"
                className="flex-1 min-w-0 text-sm px-3 py-2 rounded-lg bg-surface-bg border border-border focus:outline-hidden focus:border-brand transition-colors"
              />
              <button
                onClick={() => subscribeMut.mutate()}
                disabled={subscribeMut.isPending || !email.includes('@')}
                className="h-10 px-4 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors disabled:opacity-60 shrink-0 inline-flex items-center gap-1.5"
              >
                {subscribeMut.isPending && <Loader2 size={12} className="animate-spin" />}
                {subscribeMut.isPending ? '등록 중' : '알림 받기'}
              </button>
            </div>
            <p className="text-[11px] text-txt-tertiary mt-2">
              출시 당일 한 번만 전송합니다. 스팸 없음.
            </p>
          </div>
        )}
      </div>

      {/* 왜 지금은 아닌가 */}
      <section className="bg-surface-card border border-border rounded-2xl p-5 mb-6">
        <h3 className="text-sm font-bold text-txt-primary mb-2">왜 지금은 아닌가</h3>
        <p className="text-[13px] text-txt-secondary leading-relaxed">
          개인 데이터를 AI 가 다루게 되므로 PIPA 상 더 엄격한 동의·감사·삭제 플로우가 필요합니다.
          정보주체 권리 인프라가 성숙한 후 안심하고 사용하실 수 있게 공개합니다. 클럽·프로젝트
          페르소나로 먼저 기능을 안정화하는 이유입니다.
        </p>
      </section>

      {/* 출시 후 미리보기 */}
      <section>
        <p className="text-[11px] text-txt-tertiary mb-3 uppercase tracking-wider">출시 후 미리보기</p>
        <div className="opacity-40 pointer-events-none select-none space-y-4">
          <div className="bg-surface-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-txt-primary">상속</h4>
              <div className="w-11 h-6 rounded-full bg-brand" />
            </div>
            <p className="text-[13px] text-txt-secondary">
              FLIP 클럽 · Draft 프로젝트에서 이어받은 기본값으로 시작합니다.
            </p>
          </div>

          <div className="bg-surface-card border border-border rounded-2xl p-5">
            <h4 className="text-sm font-bold text-txt-primary mb-4">슬롯</h4>
            <div className="space-y-2">
              {['정체성', '독자', '말투', '금기', '반복 패턴'].map((label) => (
                <div
                  key={label}
                  className="flex items-center justify-between text-[13px] py-2 border-b border-border-subtle last:border-0"
                >
                  <span className="text-txt-secondary">{label}</span>
                  <span className="text-txt-tertiary text-[11px]">0 / 3</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-card border border-border rounded-2xl p-5">
            <h4 className="text-sm font-bold text-txt-primary mb-4">채널</h4>
            <div className="text-[13px] text-txt-secondary space-y-2">
              <div className="flex justify-between">
                <span>LinkedIn</span>
                <span className="text-txt-tertiary">연결 →</span>
              </div>
              <div className="flex justify-between">
                <span>Threads</span>
                <span className="text-txt-tertiary">연결 →</span>
              </div>
              <div className="flex justify-between">
                <span>개인 블로그</span>
                <span className="text-txt-tertiary">연결 →</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
