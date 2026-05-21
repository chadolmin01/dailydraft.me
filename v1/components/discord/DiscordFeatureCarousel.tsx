'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, MessageSquareText, Zap, Bot, Sparkles } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

// Discord 브랜드 색상 — CTA 버튼에만 사용
const DISCORD_COLOR = '#5865F2'

// Discord SVG 아이콘 (connect/discord 페이지에서 재사용)
function DiscordIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}

interface Props {
  isOpen: boolean
  onClose: () => void
}

// ── 슬라이드 데이터 ──
interface SlideData {
  icon: React.ReactNode
  title: string
  body: string
  features?: { icon: React.ReactNode; text: string }[]
}

const SLIDES: SlideData[] = [
  {
    icon: <MessageSquareText size={48} className="text-brand" />,
    title: 'Discord 대화가\n자동으로 정리됩니다',
    body: 'Draft와 Discord를 연결하면\n흩어진 대화가 체계적으로 기록됩니다.',
  },
  {
    icon: <Sparkles size={48} className="text-brand" />,
    title: '주간 업데이트를\nAI가 자동 생성합니다',
    body: '매주 채널 대화를 분석해서\n누가 무엇을 했는지 정리해드립니다.',
    features: [
      { icon: <Zap size={16} className="text-txt-secondary" />, text: '채널별 활동 요약' },
      { icon: <Zap size={16} className="text-txt-secondary" />, text: '주요 결정사항 추출' },
      { icon: <Zap size={16} className="text-txt-secondary" />, text: '다음 주 할 일 정리' },
    ],
  },
  {
    icon: <span className="text-[48px] leading-none">/</span>,
    title: '슬래시 커맨드로\n빠르게 기록합니다',
    body: 'Discord에서 바로 사용할 수 있는\n간편한 명령어를 제공합니다.',
    features: [
      { icon: <span className="text-sm font-mono text-txt-secondary">/</span>, text: '/마무리 — 회의 내용 정리' },
      { icon: <span className="text-sm font-mono text-txt-secondary">/</span>, text: '/투표 — 빠른 의사결정' },
      { icon: <span className="text-sm font-mono text-txt-secondary">/</span>, text: '/일정 — 일정 등록' },
      { icon: <span className="text-sm font-mono text-txt-secondary">/</span>, text: '/투두 — 할 일 추가' },
    ],
  },
  {
    icon: <Bot size={48} className="text-brand" />,
    title: '@Draft AI에게\n질문하세요',
    body: '채널의 맥락을 파악한 AI가\n프로젝트에 대한 질문에 답변합니다.',
    features: [
      { icon: <Bot size={16} className="text-txt-secondary" />, text: '"지난주 결정사항 알려줘"' },
      { icon: <Bot size={16} className="text-txt-secondary" />, text: '"이 기능 담당자가 누구야?"' },
      { icon: <Bot size={16} className="text-txt-secondary" />, text: '"다음 회의 안건 정리해줘"' },
    ],
  },
  // CTA 슬라이드는 별도 렌더링
  {
    icon: <DiscordIcon size={48} />,
    title: 'Discord 계정을\n연결해보세요',
    body: '연결은 30초면 충분합니다.\n언제든 해제할 수 있습니다.',
  },
]

const TOTAL = SLIDES.length

// 슬라이드 전환 애니메이션
const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -80 : 80,
    opacity: 0,
  }),
}

export function DiscordFeatureCarousel({ isOpen, onClose }: Props) {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)

  const goNext = useCallback(() => {
    if (step >= TOTAL - 1) return
    setDirection(1)
    setStep(s => s + 1)
  }, [step])

  const goPrev = useCallback(() => {
    if (step <= 0) return
    setDirection(-1)
    setStep(s => s - 1)
  }, [step])

  // 키보드 네비게이션
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, goNext, goPrev])

  // 모달 닫힐 때 step 리셋
  useEffect(() => {
    if (!isOpen) setStep(0)
  }, [isOpen])

  const slide = SLIDES[step]
  const isLast = step === TOTAL - 1

  // 스와이프 핸들러
  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      const threshold = 50
      const vThreshold = 300
      if (info.offset.x < -threshold || info.velocity.x < -vThreshold) {
        goNext()
      } else if (info.offset.x > threshold || info.velocity.x > vThreshold) {
        goPrev()
      }
    },
    [goNext, goPrev]
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showClose={false}>
      <div className="flex flex-col px-6 pb-6 pt-2">
        {/* 진행 바 */}
        <div className="flex gap-1.5 mb-6">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-[4px] rounded-full transition-colors duration-300 ${
                i <= step ? '' : 'bg-surface-sunken'
              }`}
              style={i <= step ? { backgroundColor: DISCORD_COLOR } : undefined}
            />
          ))}
        </div>

        {/* 슬라이드 컨텐츠 */}
        <div className="relative overflow-hidden min-h-[340px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={handleDragEnd}
              className="flex flex-col items-center text-center"
            >
              {/* 아이콘 */}
              <div className="mb-6" style={isLast ? { color: DISCORD_COLOR } : undefined}>
                {slide.icon}
              </div>

              {/* 제목 */}
              <h2 className="text-xl font-bold text-txt-primary whitespace-pre-line leading-snug mb-3">
                {slide.title}
              </h2>

              {/* 본문 */}
              <p className="text-sm text-txt-secondary whitespace-pre-line leading-relaxed mb-5">
                {slide.body}
              </p>

              {/* 기능 리스트 */}
              {slide.features && (
                <div className="w-full space-y-2.5">
                  {slide.features.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 text-left px-4 py-2.5 bg-surface-sunken rounded-xl"
                    >
                      <span className="shrink-0">{f.icon}</span>
                      <span className="text-sm text-txt-primary">{f.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 하단 네비게이션 */}
        <div className="flex flex-col gap-3 mt-4">
          {isLast ? (
            <>
              <a
                href="/api/discord/oauth?returnTo=/explore"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-bold text-white ob-press-spring hover:opacity-90"
                style={{ backgroundColor: DISCORD_COLOR }}
              >
                <DiscordIcon size={18} className="text-white" />
                Discord 계정 연결
              </a>
              <button
                onClick={onClose}
                className="w-full text-center text-sm text-txt-tertiary hover:text-txt-secondary transition-colors py-2"
              >
                나중에 하기
              </button>
            </>
          ) : (
            <div className="flex items-center justify-between">
              {step > 0 ? (
                <button
                  onClick={goPrev}
                  className="w-9 h-9 flex items-center justify-center rounded-full text-txt-secondary hover:text-txt-primary hover:bg-surface-sunken transition-colors"
                  aria-label="이전"
                >
                  <ArrowLeft size={18} />
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="text-sm text-txt-tertiary hover:text-txt-secondary transition-colors py-2 px-1"
                >
                  건너뛰기
                </button>
              )}
              <button
                onClick={goNext}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-surface-inverse text-txt-inverse rounded-full text-sm font-bold ob-press-spring hover:opacity-90"
              >
                다음
                <ArrowRight size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
