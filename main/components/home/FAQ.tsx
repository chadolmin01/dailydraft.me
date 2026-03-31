'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SectionLabel, SectionTitle } from './shared'

const faqs = [
  {
    question: 'Draft는 무료인가요?',
    answer: '네, 완전 무료입니다. 프로젝트 올리기, AI 매칭, 커피챗 신청 등 모든 핵심 기능을 무료로 이용할 수 있습니다.',
  },
  {
    question: '어떤 프로젝트를 올릴 수 있나요?',
    answer: '아이디어 단계부터 진행 중인 프로젝트까지 모두 가능합니다. 스타트업, 사이드 프로젝트, 공모전 팀 등 어떤 형태의 프로젝트든 환영합니다.',
  },
  {
    question: 'AI 매칭은 어떻게 작동하나요?',
    answer: '프로필 분석을 통해 기술 스택, 관심 분야, 파운더 유형, 프로젝트 선호도 등을 종합적으로 파악합니다. 이를 기반으로 스킬뿐 아니라 비전과 방향성이 맞는 팀과 사람을 매칭합니다.',
  },
  {
    question: '커피챗은 어떻게 진행되나요?',
    answer: '관심 있는 프로젝트나 팀원에게 커피챗을 신청하면, 상대방이 수락할 경우 연락처가 공개됩니다. 이후 일정을 조율해서 편하게 만나보세요.',
  },
  {
    question: '프로필 분석은 정확한가요?',
    answer: 'AI 온보딩 대화를 통해 수집한 정보를 기반으로 분석하므로, 솔직하게 대화할수록 정확도가 높아집니다. 분석 결과는 언제든 수정할 수 있습니다.',
  },
  {
    question: '다른 대학 학생도 이용할 수 있나요?',
    answer: '네, 모든 대학 학생이 이용할 수 있습니다. 학교 이메일 인증을 통해 가입하며, 타 대학 학생과도 자유롭게 팀빌딩할 수 있습니다.',
  },
  {
    question: '데이터 보안은 어떻게 관리되나요?',
    answer: '모든 데이터는 암호화되어 저장되며, 연락처는 커피챗 수락 시에만 상대방에게 공개됩니다. 개인정보는 서비스 운영 목적 외에 제3자에게 제공되지 않습니다.',
  },
]

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="w-full py-14 px-6 md:px-10">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <SectionLabel>FAQ</SectionLabel>
          <SectionTitle>자주 묻는 질문</SectionTitle>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-border bg-surface-card rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-sunken/50 transition-colors"
              >
                <span className="font-bold text-sm text-txt-primary pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  size={18}
                  className={`text-txt-disabled shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <p className="px-4 pb-4 text-sm text-txt-secondary leading-relaxed break-keep">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
