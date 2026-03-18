'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Zap, ArrowRight, MessageCircle, Heart, Loader2, Plus,
} from 'lucide-react'
import { useOpportunities } from '@/src/hooks/useOpportunities'
import { ProjectDetailModal } from '@/components/ProjectDetailModal'

interface DisplayProject {
  id: string
  title: string
  description: string
  needed_roles: string[]
  interest_tags: string[]
  isReal?: boolean
}

// Seed 기반 고정 mock 숫자 (id로부터 결정적 해시)
function seededNumber(id: string, min: number, max: number): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i)
    hash |= 0
  }
  return min + (Math.abs(hash) % (max - min + 1))
}

// --- Main Component ---
export const OpportunitySection: React.FC = () => {
  const router = useRouter()
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  const { data: oppData, isLoading: loading } = useOpportunities({ limit: 3 })
  const projects: DisplayProject[] = (oppData?.items ?? []).map((opp) => ({
    id: opp.id,
    title: opp.title || '',
    description: opp.description || '',
    needed_roles: opp.needed_roles || [],
    interest_tags: opp.interest_tags || [],
    isReal: true,
  }))

  const mockProjects: DisplayProject[] = [
    {
      id: '1',
      title: 'AI 기반 이력서 분석 서비스',
      description: '취준생들의 이력서를 AI로 분석해서 맞춤형 피드백을 제공하는 서비스입니다.',
      needed_roles: ['백엔드 개발자', 'PM'],
      interest_tags: ['AI', 'HR Tech'],
    },
    {
      id: '2',
      title: '대학생 스터디 매칭 플랫폼',
      description: '같은 관심사를 가진 대학생들을 연결해주는 스터디 매칭 서비스',
      needed_roles: ['프론트엔드 개발자', '디자이너'],
      interest_tags: ['에듀테크', '소셜'],
    },
    {
      id: '3',
      title: '친환경 배달 포장재 마켓플레이스',
      description: '소상공인을 위한 친환경 포장재 B2B 플랫폼',
      needed_roles: ['풀스택 개발자'],
      interest_tags: ['커머스', '소셜임팩트'],
    },
  ]

  const displayProjects = projects.length > 0
    ? projects.slice(0, 3)
    : mockProjects.slice(0, 3)

  return (
    <section id="projects" className="w-full py-20 px-6 md:px-10 bg-surface-card">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-10">
          <div>
            <span className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-tertiary mb-1.5 block">
              LIVE PROJECTS
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-txt-primary">
              지금 올라온 프로젝트
            </h2>
          </div>
          <button
            onClick={() => router.push('/explore')}
            className="text-sm font-bold text-txt-secondary hover:text-black transition-colors flex items-center gap-1 border-b border-border-strong pb-0.5 hover:border-border-strong"
          >
            전체 보기 <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-txt-disabled" size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayProjects.map((project) => (
              <div
                key={project.id}
                className="group bg-surface-card border border-border p-4 hover:border-border-strong hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col h-full"
                onClick={() => project.isReal ? setSelectedProjectId(project.id) : router.push('/explore')}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-surface-card border border-border-subtle flex items-center justify-center text-txt-primary group-hover:bg-black group-hover:text-white transition-colors">
                      <Zap size={20} />
                    </div>
                    {project.isReal && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-status-success-bg border border-status-success-text/20 text-status-success-text text-[0.625rem] font-bold">
                        <span className="w-1.5 h-1.5 bg-indicator-online animate-pulse" />
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[0.625rem] font-mono text-txt-disabled">
                      <MessageCircle size={10} />
                      {seededNumber(project.id + 'msg', 2, 15)}
                    </span>
                    <span className="flex items-center gap-1 text-[0.625rem] font-mono text-txt-disabled">
                      <Heart size={10} />
                      {seededNumber(project.id + 'heart', 1, 10)}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-bold text-txt-primary mb-2 group-hover:text-brand transition-colors truncate">
                  {project.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-txt-tertiary leading-relaxed mb-6 flex-1 line-clamp-2 break-keep">
                  {project.description}
                </p>

                {/* Footer */}
                <div className="pt-4 border-t border-dashed border-border mt-auto">
                  {project.needed_roles && project.needed_roles.length > 0 && (
                    <div className="mb-3">
                      <span className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-disabled block mb-1">
                        NEED
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {project.needed_roles.slice(0, 2).map((role) => (
                          <span
                            key={role}
                            className="text-[0.625rem] bg-brand-bg border border-brand-border text-brand px-1.5 py-0.5 font-bold"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {project.interest_tags && project.interest_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.interest_tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[0.625rem] bg-surface-card border border-border text-txt-secondary px-1.5 py-0.5"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* + Add Project Card */}
            <div
              onClick={() => router.push('/login')}
              className="group bg-surface-card border border-dashed border-border-strong p-6 hover:border-brand hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center h-full min-h-[13.75rem] gap-4"
            >
              <div className="w-14 h-14 bg-surface-card border border-border flex items-center justify-center group-hover:bg-brand group-hover:border-brand transition-colors">
                <Plus size={24} className="text-txt-disabled group-hover:text-white transition-colors" />
              </div>
              <div className="text-center">
                <p className="font-bold text-txt-secondary group-hover:text-brand transition-colors mb-1">
                  내 아이디어 등록하기
                </p>
                <p className="text-xs text-txt-disabled">
                  팀원을 모집해보세요
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CTA Banner */}
        <div className="mt-10 bg-black text-white p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-base font-bold mb-1.5">나도 프로젝트 올리기</h3>
            <p className="text-txt-disabled text-sm">
              아이디어 단계부터 MVP까지, 어떤 단계든 공유하고 피드백 받으세요
            </p>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="group flex items-center gap-2 bg-white text-black px-5 py-2.5 font-bold text-xs hover:bg-surface-sunken transition-colors shrink-0 shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            시작하기
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Project Detail Modal */}
      <ProjectDetailModal
        projectId={selectedProjectId}
        onClose={() => setSelectedProjectId(null)}
      />
    </section>
  )
}
