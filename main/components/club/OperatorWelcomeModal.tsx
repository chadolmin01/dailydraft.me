'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Users, UserPlus, MessageCircle, ArrowRight, PartyPopper } from 'lucide-react'

interface Props {
  clubSlug: string
  clubName: string
  clubId: string
}

/**
 * 첫 클럽을 만든 직후 또는 새 클럽에 처음 들어온 운영자에게 노출되는 축하 + 가이드 모달.
 *
 * 왜 필요: 운영자 활성화가 Draft의 핵심 전환 이벤트. 축하 없이 바로 일반 UI를 보여주면
 * "뭐가 달라졌지?" 느낌. Stage 2→3 전환에 drama를 줘 동기부여 + 다음 3가지 액션을
 * 한 화면에 제시해 활성화까지 연결.
 *
 * 노출 조건: localStorage에 welcome-seen-{clubSlug} 없으면 표시. 한 번만.
 */
export function OperatorWelcomeModal({ clubSlug, clubName, clubId }: Props) {
  const [open, setOpen] = useState(false)
  const storageKey = `operator-welcome-${clubSlug}`

  useEffect(() => {
    if (typeof window === 'undefined') return
    const seen = localStorage.getItem(storageKey)
    if (!seen) {
      // 진입 후 약간 딜레이 — 페이지 hydrate 끝난 뒤 부드럽게 등장
      const t = setTimeout(() => setOpen(true), 400)
      return () => clearTimeout(t)
    }
  }, [storageKey])

  const dismiss = () => {
    localStorage.setItem(storageKey, '1')
    setOpen(false)
  }

  const quickStarts = [
    {
      id: 'project',
      icon: Users,
      title: '첫 팀 추가하기',
      desc: '프로젝트를 만들어 팀 공간을 구성하세요',
      href: `/projects/new?club=${clubId}&from=/clubs/${clubSlug}`,
      accent: 'bg-brand-bg text-brand',
    },
    {
      id: 'invite',
      icon: UserPlus,
      title: '멤버 초대하기',
      desc: '초대 코드로 기존 부원들을 연결하세요',
      href: `/clubs/${clubSlug}/settings`,
      accent: 'bg-status-success-bg text-status-success-text',
    },
    {
      id: 'discord',
      icon: MessageCircle,
      title: 'Discord 연결하기',
      desc: '메시지 분석·주간 업데이트 초안 자동 생성',
      href: `/clubs/${clubSlug}/settings`,
      accent: 'bg-[#5865F2]/10 text-[#5865F2]',
    },
  ]

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-modal-backdrop"
            onClick={dismiss}
          />

          {/* Modal — 왜 wrapper 분리: framer-motion의 y/scale transform이
              CSS -translate-*-1/2와 충돌해 센터링이 깨짐. 플렉스 래퍼가 센터링을
              담당하고 motion.div는 순수하게 애니메이션만 담당. */}
          <div className="fixed inset-0 z-modal flex items-center justify-center p-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-full max-w-[480px] bg-surface-card rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
          >
            {/* 상단 장식 — 파티 효과 */}
            <div className="relative h-32 bg-gradient-to-br from-brand to-brand/70 overflow-hidden">
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="relative">
                  <PartyPopper size={56} className="text-white" strokeWidth={1.5} />
                  {/* Confetti dots */}
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{
                        scale: [0, 1, 0],
                        x: Math.cos((i / 8) * Math.PI * 2) * 40,
                        y: Math.sin((i / 8) * Math.PI * 2) * 40,
                      }}
                      transition={{ delay: 0.3 + i * 0.03, duration: 0.8 }}
                      className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-white"
                    />
                  ))}
                </div>
              </motion.div>
              <button
                onClick={dismiss}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                aria-label="닫기"
              >
                <X size={16} />
              </button>
            </div>

            {/* 본문 */}
            <div className="p-7">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-center mb-6"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-bg text-brand rounded-full text-[11px] font-bold mb-3">
                  <Sparkles size={11} />
                  운영자 권한 활성화
                </div>
                <h2 className="text-[22px] font-bold text-txt-primary mb-1.5">
                  <span className="text-brand">{clubName}</span> 대표가 되셨어요
                </h2>
                <p className="text-[13px] text-txt-secondary leading-relaxed">
                  이제 멤버 관리·주간 업데이트 추적·Discord 연동을<br/>
                  모두 쓸 수 있습니다. 시작할 3가지를 골라보세요
                </p>
              </motion.div>

              {/* Quick starts */}
              <div className="space-y-2">
                {quickStarts.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.06 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => localStorage.setItem(storageKey, '1')}
                      className="flex items-center gap-3 p-3 bg-surface-bg border border-border rounded-2xl hover:border-brand hover:bg-brand-bg/30 transition-all group"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.accent}`}>
                        <item.icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-txt-primary">{item.title}</p>
                        <p className="text-[12px] text-txt-tertiary">{item.desc}</p>
                      </div>
                      <ArrowRight size={14} className="text-txt-disabled group-hover:text-brand group-hover:translate-x-0.5 transition-all shrink-0" />
                    </Link>
                  </motion.div>
                ))}
              </div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                onClick={dismiss}
                className="w-full mt-5 text-center text-[12px] text-txt-tertiary hover:text-txt-primary transition-colors py-2"
              >
                나중에 둘러보기
              </motion.button>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
