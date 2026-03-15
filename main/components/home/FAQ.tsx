'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'Draft는 무료인가요?',
    answer: '네, 완전 무료입니다. 프로젝트 올리기, 피드백 받기, 커피챗 신청 등 모든 핵심 기능을 무료로 이용할 수 있습니다.',
  },
  {
    question: '어떤 프로젝트를 올릴 수 있나요?',
    answer: '아이디어 단계부터 진행 중인 프로젝트까지 모두 가능합니다. 스타트업, 사이드 프로젝트, 공모전 팀 등 어떤 형태의 프로젝트든 환영합니다.',
  },
  {
    question: '피드백은 어떻게 받나요?',
    answer: '프로젝트를 올리면 다른 유저들이 자유롭게 피드백(훈수)을 남깁니다. 도움이 된 피드백에는 "도움이 됐어요"를 눌러 감사를 표현할 수 있어요.',
  },
  {
    question: '커피챗은 어떻게 진행되나요?',
    answer: '관심 있는 프로젝트나 팀원에게 커피챗을 신청하면, 상대방이 수락할 경우 연락처가 공개됩니다. 이후 일정을 조율해서 편하게 만나보세요.',
  },
]

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="w-full py-24 px-6 md:px-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-mono font-bold text-gray-500 tracking-wider mb-4 block">
            FAQ
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
            자주 묻는 질문
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 bg-white"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-bold text-gray-900 pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  size={20}
                  className={`text-gray-400 shrink-0 transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  openIndex === index ? 'max-h-48' : 'max-h-0'
                }`}
              >
                <p className="px-6 pb-6 text-gray-600 leading-relaxed break-keep">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
