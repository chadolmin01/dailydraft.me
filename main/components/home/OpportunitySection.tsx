'use client'

import React, { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { AnimatePresence } from 'framer-motion'
import { Zap, ArrowRight, MessageCircle, Heart } from 'lucide-react'
import { SkeletonGrid } from '@/components/ui/Skeleton'
import { useOpportunities } from '@/src/hooks/useOpportunities'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { SectionLabel, SectionTitle } from './shared'

const ModalLoadingFallback = () => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-modal-backdrop">
    <div className="bg-surface-card rounded-xl border border-border px-6 py-4 shadow-lg">
      <span className="text-sm text-txt-secondary font-mono">로딩 중...</span>
    </div>
  </div>
)

const ProjectDetailModal = dynamic(
  () => import('@/components/ProjectDetailModal').then(m => ({ default: m.ProjectDetailModal })),
  { ssr: false, loading: ModalLoadingFallback }
)

interface DisplayProject {
  id: string
  title: string
  description: string
  needed_roles: string[]
  interest_tags: string[]
  isReal?: boolean
}

function seededNumber(id: string, min: number, max: number): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i)
    hash |= 0
  }
  return min + (Math.abs(hash) % (max - min + 1))
}

export const OpportunitySection: React.FC = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  const { data: oppData, isLoading: loading } = useOpportunities({ limit: 3 })
  // oppData.items 참조가 바뀔 때만 재매핑 — 매 렌더 새 배열 생성 방지
  const projects = useMemo<DisplayProject[]>(
    () =>
      (oppData?.items ?? []).map((opp) => ({
        id: opp.id,
        title: opp.title || '',
        description: opp.description || '',
        needed_roles: opp.needed_roles || [],
        interest_tags: opp.interest_tags || [],
        isReal: true,
      })),
    [oppData?.items],
  )

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
            <SectionLabel>LIVE PROJECTS</SectionLabel>
            <SectionTitle>지금 올라온 프로젝트</SectionTitle>
          </div>
          <Link
            href="/explore"
            className="text-sm font-bold text-txt-secondary hover:text-brand transition-colors flex items-center gap-1"
          >
            전체 보기 <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <SkeletonGrid count={3} cols={3} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayProjects.map((project, i) => (
              <ScrollReveal key={project.id} delay={i * 0.1}>
                <div
                  role="button"
                  tabIndex={0}
                  className="group bg-surface-card rounded-xl border border-border p-5 hover:shadow-md hover-spring cursor-pointer flex flex-col h-full transition-shadow"
                  onClick={() => {
                    if (project.isReal) setSelectedProjectId(project.id)
                    else window.location.href = '/explore'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      if (project.isReal) setSelectedProjectId(project.id)
                      else window.location.href = '/explore'
                    }
                  }}
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-surface-sunken rounded-xl flex items-center justify-center text-txt-primary group-hover:bg-brand group-hover:text-white transition-colors">
                        <Zap size={20} />
                      </div>
                      {project.isReal && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-status-success-bg border border-status-success-text/20 text-status-success-text text-[10px] font-bold rounded-full">
                          <span className="w-1.5 h-1.5 bg-indicator-online rounded-full animate-pulse" />
                          NEW
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[10px] font-mono text-txt-disabled">
                        <MessageCircle size={10} />
                        {seededNumber(project.id + 'msg', 2, 15)}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-mono text-txt-disabled">
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
                  <div className="pt-4 border-t border-border mt-auto">
                    {project.needed_roles && project.needed_roles.length > 0 && (
                      <div className="mb-3">
                        <span className="text-[10px] font-medium text-txt-disabled block mb-1">NEED</span>
                        <div className="flex flex-wrap gap-1">
                          {project.needed_roles.slice(0, 2).map((role) => (
                            <span key={role} className="text-[10px] bg-brand-bg border border-brand-border text-brand px-2 py-0.5 font-bold rounded-full">
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {project.interest_tags && project.interest_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.interest_tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[10px] bg-surface-sunken rounded-full border border-border text-txt-secondary px-2 py-0.5">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        )}

        {/* CTA Banner */}
        <ScrollReveal delay={0.3}>
          <div className="mt-10 bg-surface-inverse text-txt-inverse rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-base font-bold mb-1.5">나도 프로젝트 올리기</h3>
              <p className="text-txt-disabled text-sm">
                아이디어 단계부터 MVP까지, 어떤 단계든 공유하고 피드백 받으세요
              </p>
            </div>
            <Link
              href="/login"
              className="group flex items-center gap-2 bg-white text-black rounded-full px-5 py-2.5 font-bold text-xs hover:bg-surface-sunken transition-colors shrink-0 active:scale-[0.97]"
            >
              시작하기
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </ScrollReveal>
      </div>

      <AnimatePresence>
        {selectedProjectId && (
          <ProjectDetailModal
            key="project-modal"
            projectId={selectedProjectId}
            onClose={() => setSelectedProjectId(null)}
          />
        )}
      </AnimatePresence>
    </section>
  )
}
