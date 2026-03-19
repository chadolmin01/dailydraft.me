'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Heart, ArrowRight } from 'lucide-react'

const mockProject = {
  title: '대학생 중고거래 플랫폼',
  description: '같은 학교 학생들끼리 안전하게 중고거래 할 수 있는 플랫폼',
  tags: ['에듀테크', '커머스'],
  needRoles: ['개발자', '디자이너'],
  commentCount: 12,
  interestCount: 8,
}

const mockComments = [
  {
    school: '연대 경영',
    name: '김OO',
    content: '타겟을 대학생으로 좁히는 게 낫지 않을까요? 학교별 커뮤니티가 이미 있어서 차별점이 필요할 것 같아요.',
  },
  {
    school: '고대 컴공',
    name: '박OO',
    content: '당근마켓이랑 차별점이 뭔가요? 학교 인증 기능이 핵심이 될 것 같은데, 인증 방식이 궁금해요.',
  },
  {
    school: '경희대 산공',
    name: '이OO',
    content: 'MVP는 에브리타임 연동부터 해보는 건 어때요? 이미 학교 인증된 유저풀이 있잖아요.',
  },
]

export const CommunityFeedback: React.FC = () => {
  const router = useRouter()

  return (
    <section className="w-full py-20 px-6 md:px-10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-tertiary mb-3 block">
            COMMUNITY FEEDBACK
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-txt-primary mb-3">
            다양한 시각의 피드백
          </h2>
          <p className="text-txt-secondary text-sm max-w-xl mx-auto">
            프로젝트를 올리면 다른 유저들이 자유롭게 피드백을 남깁니다
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Project Card */}
          <div className="bg-surface-card border border-border-strong p-5 shadow-brutal">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-txt-primary mb-1.5">
                  {mockProject.title}
                </h3>
                <p className="text-txt-secondary text-sm">
                  {mockProject.description}
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {mockProject.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-surface-card text-txt-secondary text-xs font-mono border border-border"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Need Roles */}
            <div className="flex flex-wrap gap-2 mb-6">
              {mockProject.needRoles.map((role) => (
                <span
                  key={role}
                  className="px-2 py-1 bg-brand-bg border border-brand-border text-brand text-xs font-bold"
                >
                  NEED: {role}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 pt-4 border-t border-dashed border-border">
              <div className="flex items-center gap-1 text-txt-secondary text-sm">
                <MessageCircle size={14} />
                <span>피드백 {mockProject.commentCount}개</span>
              </div>
              <div className="flex items-center gap-1 text-txt-secondary text-sm">
                <Heart size={14} />
                <span>관심 {mockProject.interestCount}명</span>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-4">
            {mockComments.map((comment, index) => (
              <div
                key={index}
                className="bg-surface-card border border-border p-4 relative"
              >
                {/* Comment number */}
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-black text-white flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-txt-tertiary">
                    {comment.school}
                  </span>
                  <span className="text-xs text-txt-disabled">|</span>
                  <span className="text-xs font-bold text-txt-secondary">
                    {comment.name}
                  </span>
                </div>
                <p className="text-txt-secondary text-sm leading-relaxed break-keep">
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <button
            onClick={() => router.push('/login')}
            className="group inline-flex items-center gap-2 bg-black text-white px-6 py-3 font-bold text-xs hover:bg-[#333] transition-all duration-200 shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] border border-black"
          >
            나도 프로젝트 올리기
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  )
}
