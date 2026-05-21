'use client'

import React from 'react'
import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
}

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const faqs = [
  {
    question: 'Discord가 없어도 사용할 수 있나요?',
    answer:
      '네. Draft는 Discord 없이도 독립적으로 사용 가능합니다. 주간 업데이트, 멤버 관리, 기수별 타임라인 등 핵심 기능은 Draft 자체만으로 완전히 동작합니다. Discord 봇은 자동 수집을 더해주는 부가 연동입니다.',
  },
  {
    question: '카카오톡으로 소통하는 동아리도 쓸 수 있나요?',
    answer:
      '네. Draft의 핵심 가치는 "소통 채널과 무관하게 운영을 구조화"하는 것입니다. 카카오톡, 슬랙, 디스코드 등 어떤 메신저를 쓰더라도 Draft의 운영 기능은 동일하게 사용할 수 있습니다. 소통은 원하는 곳에서, 운영은 Draft에서 하시면 됩니다.',
  },
  {
    question: '기존 멤버 데이터를 가져올 수 있나요?',
    answer:
      '엑셀(.xlsx), 구글 시트, 노션 데이터베이스에서 멤버 데이터를 한 번에 임포트할 수 있습니다. 이름, 역할, 기수, 연락처 등의 필드를 매핑하여 기존 데이터를 손실 없이 옮길 수 있습니다.',
  },
  {
    question: '동아리 규모에 제한이 있나요?',
    answer:
      'Free 플랜은 멤버 50명까지 지원합니다. 대부분의 대학 동아리는 이 범위 안에 충분히 들어옵니다. 더 큰 규모가 필요하시면 Pro 플랜(출시 예정)에서 무제한 멤버를 지원할 예정입니다.',
  },
  {
    question: '데이터는 안전한가요?',
    answer:
      '모든 데이터는 Supabase(AWS 서울 리전)에 암호화되어 저장됩니다. Row Level Security(RLS)를 통해 동아리 멤버만 해당 동아리 데이터에 접근할 수 있으며, 개인정보는 서비스 운영 목적 외에 제3자에게 제공되지 않습니다.',
  },
]

export const FAQ: React.FC = () => {
  return (
    <section
      id="faq"
      className="w-full py-24 sm:py-32 px-6 md:px-10 bg-surface-card"
    >
      <div className="max-w-2xl mx-auto">
        <motion.div
          className="text-center mb-14"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          <motion.h2
            variants={fadeUp}
            className="text-2xl md:text-3xl lg:text-4xl font-bold text-txt-primary"
          >
            자주 묻는 질문
          </motion.h2>
        </motion.div>

        <motion.div
          className="space-y-3"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {faqs.map((faq) => (
            <motion.details
              key={faq.question}
              variants={fadeUp}
              className="group bg-surface-card border border-border rounded-xl overflow-hidden"
            >
              <summary className="p-5 font-semibold text-sm text-txt-primary cursor-pointer list-none flex items-center justify-between hover:bg-surface-sunken/50 transition-colors [&::-webkit-details-marker]:hidden">
                {faq.question}
                <span className="ml-4 shrink-0 text-txt-disabled transition-transform group-open:rotate-45 text-lg leading-none">
                  +
                </span>
              </summary>
              <div className="px-5 pb-5">
                <p className="text-sm text-txt-secondary leading-relaxed break-keep">
                  {faq.answer}
                </p>
              </div>
            </motion.details>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
