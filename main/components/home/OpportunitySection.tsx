'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Zap, ArrowRight, MessageCircle, Heart, Loader2, Plus, Sparkles,
} from 'lucide-react'
import { supabase } from '@/src/lib/supabase/client'
import { ProjectDetailModal } from '@/components/ProjectDetailModal'

interface DisplayProject {
  id: string
  title: string
  description: string
  needed_roles: string[]
  interest_tags: string[]
  isReal?: boolean
}

interface OpportunitySectionProps {
  onSlidePanelOpen?: () => void
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
export const OpportunitySection: React.FC<OpportunitySectionProps> = ({ onSlidePanelOpen }) => {
  const router = useRouter()
  const [projects, setProjects] = useState<DisplayProject[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('opportunities')
          .select('id, title, description, needed_roles, interest_tags')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(3)

        if (error) throw error

        const oppProjects: DisplayProject[] = (data || []).map((opp) => ({
          id: opp.id,
          title: opp.title || '',
          description: opp.description || '',
          needed_roles: opp.needed_roles || [],
          interest_tags: opp.interest_tags || [],
          isReal: true,
        }))

        setProjects(oppProjects)
      } catch (err) {
        console.warn('Failed to fetch projects, using mock data')
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

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
    <section id="projects" className="w-full py-24 px-6 md:px-12 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
          <div>
            <span className="text-xs font-mono font-bold text-gray-500 tracking-wider mb-2 block">
              LIVE PROJECTS
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              지금 올라온 프로젝트
            </h2>
          </div>
          <button
            onClick={() => router.push('/explore')}
            className="text-sm font-bold text-gray-600 hover:text-black transition-colors flex items-center gap-1 border-b border-gray-300 pb-0.5 hover:border-black"
          >
            전체 보기 <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-gray-400" size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayProjects.map((project) => (
              <div
                key={project.id}
                className="group bg-white border border-gray-200 p-6 hover:border-black hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col h-full"
                onClick={() => project.isReal ? setSelectedProjectId(project.id) : router.push('/explore')}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-900 group-hover:bg-black group-hover:text-white transition-colors">
                      <Zap size={20} />
                    </div>
                    {project.isReal && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[10px] font-mono text-gray-400">
                      <MessageCircle size={10} />
                      {seededNumber(project.id + 'msg', 2, 15)}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-mono text-gray-400">
                      <Heart size={10} />
                      {seededNumber(project.id + 'heart', 1, 10)}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors truncate">
                  {project.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-gray-500 leading-relaxed mb-6 flex-1 line-clamp-2 break-keep">
                  {project.description}
                </p>

                {/* Footer */}
                <div className="pt-4 border-t border-gray-100 mt-auto">
                  {project.needed_roles && project.needed_roles.length > 0 && (
                    <div className="mb-3">
                      <span className="text-[10px] font-mono text-gray-400 uppercase block mb-1">
                        NEED
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {project.needed_roles.slice(0, 2).map((role) => (
                          <span
                            key={role}
                            className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 font-bold"
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
                          className="text-[10px] bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5"
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
              onClick={onSlidePanelOpen}
              className="group bg-white border-2 border-dashed border-gray-300 p-6 hover:border-blue-500 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center h-full min-h-[220px] gap-4"
            >
              <div className="w-14 h-14 bg-gray-50 border border-gray-200 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 transition-colors">
                <Plus size={24} className="text-gray-400 group-hover:text-white transition-colors" />
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-700 group-hover:text-blue-600 transition-colors mb-1">
                  내 아이디어 등록하기
                </p>
                <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                  <Sparkles size={12} />
                  AI가 30초 만에 공고 작성
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CTA Banner */}
        <div className="mt-12 bg-black text-white p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold mb-2">나도 프로젝트 올리기</h3>
            <p className="text-gray-400 text-sm">
              아이디어 단계부터 MVP까지, 어떤 단계든 공유하고 피드백 받으세요
            </p>
          </div>
          <button
            onClick={onSlidePanelOpen || (() => router.push('/login'))}
            className="group flex items-center gap-2 bg-white text-black px-6 py-3 font-bold text-sm hover:bg-gray-100 transition-colors shrink-0"
          >
            AI로 공고 만들기
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
