'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronUp, MessageCircle, ArrowRight, Loader2 } from 'lucide-react'
import { createClient } from '@/src/lib/supabase/client'
import type { Database } from '@/src/types/database'

type Opportunity = Database['public']['Tables']['opportunities']['Row']

// Mock data for when no projects exist
const mockProjects = [
  {
    id: '1',
    title: 'AI 기반 이력서 분석 서비스',
    description: '취준생들의 이력서를 AI로 분석해서 맞춤형 피드백을 제공하는 서비스입니다. GPT-4를 활용해 이력서의 강점과 약점을 분석합니다.',
    needed_roles: ['백엔드 개발자', 'PM'],
    interest_tags: ['AI', 'HR Tech', 'B2C'],
    interest_count: 24,
    status: 'MVP',
  },
  {
    id: '2',
    title: '대학생 스터디 매칭 플랫폼',
    description: '같은 관심사를 가진 대학생들을 연결해주는 스터디 매칭 서비스. 에브리타임 연동으로 학교 인증.',
    needed_roles: ['프론트엔드 개발자', '디자이너'],
    interest_tags: ['에듀테크', '소셜', 'B2C'],
    interest_count: 18,
    status: 'IDEA',
  },
  {
    id: '3',
    title: '친환경 배달 포장재 B2B 플랫폼',
    description: '소상공인을 위한 친환경 포장재 도매 플랫폼. 단가를 낮추고 ESG 인증까지 한번에.',
    needed_roles: ['풀스택 개발자', '영업'],
    interest_tags: ['커머스', '소셜임팩트', 'B2B'],
    interest_count: 12,
    status: 'HIRING',
  },
  {
    id: '4',
    title: '반려동물 헬스케어 앱',
    description: '반려동물의 건강 상태를 기록하고 수의사와 연결해주는 앱. 예방접종 알림부터 진료 예약까지.',
    needed_roles: ['iOS 개발자', 'UI/UX 디자이너'],
    interest_tags: ['헬스케어', '펫테크', 'B2C'],
    interest_count: 31,
    status: 'SEED',
  },
  {
    id: '5',
    title: '프리랜서 정산 자동화 서비스',
    description: '프리랜서와 기업 간 계약서 작성부터 세금 정산까지 자동화. 3.3% 원천징수 자동 계산.',
    needed_roles: ['백엔드 개발자'],
    interest_tags: ['핀테크', 'B2B', 'SaaS'],
    interest_count: 15,
    status: 'MVP',
  },
]

const STATUS_STYLES: Record<string, string> = {
  IDEA: 'bg-gray-900 text-white',
  MVP: 'bg-gray-700 text-white',
  SEED: 'bg-black text-white',
  HIRING: 'bg-gray-800 text-white border border-gray-600',
}

export const ProjectFeed: React.FC = () => {
  const router = useRouter()
  const [projects, setProjects] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('opportunities')
          .select('*')
          .eq('status', 'open')
          .order('interest_count', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .limit(10)

        if (error) throw error
        setProjects(data || [])
      } catch (err) {
        console.error('Failed to fetch projects:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [supabase])

  const displayProjects = projects.length > 0 ? projects : mockProjects

  return (
    <section className="w-full py-16 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-black rounded-sm"></div>
            <h2 className="text-sm font-mono font-bold text-gray-900 uppercase tracking-wide">
              Today&apos;s Projects
            </h2>
          </div>
          <button
            onClick={() => router.push('/explore')}
            className="text-xs font-mono text-gray-500 hover:text-black flex items-center gap-1 transition-colors"
          >
            전체 보기 <ArrowRight size={12} />
          </button>
        </div>

        {/* Project List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-gray-400" size={24} />
          </div>
        ) : (
          <div className="space-y-0">
            {displayProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                rank={index + 1}
                onClick={() => router.push(`/explore?project=${project.id}`)}
              />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <button
            onClick={() => router.push('/login')}
            className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 text-sm font-bold hover:bg-gray-800 transition-colors"
          >
            내 프로젝트 올리기
            <ArrowRight size={14} />
          </button>
          <p className="mt-3 text-xs text-gray-400 font-mono">
            피드백도 받고, 함께할 사람도 찾고
          </p>
        </div>
      </div>
    </section>
  )
}

interface ProjectCardProps {
  project: Opportunity | typeof mockProjects[0]
  rank: number
  onClick: () => void
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, rank, onClick }) => {
  const interestCount = 'interest_count' in project ? (project.interest_count ?? 0) : 0
  const neededRoles = project.needed_roles || []
  const tags = project.interest_tags || []
  const status = 'status' in project && typeof project.status === 'string'
    ? project.status.toUpperCase()
    : 'IDEA'

  return (
    <div
      onClick={onClick}
      className="group flex items-stretch gap-4 py-5 px-4 -mx-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
    >
      {/* Upvote Section */}
      <div className="flex flex-col items-center justify-center w-14 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation()
            // TODO: Handle upvote
          }}
          className="flex flex-col items-center gap-0.5 p-2 rounded-sm border border-gray-200 bg-white hover:border-black hover:bg-black hover:text-white transition-all group/vote"
        >
          <ChevronUp size={14} className="group-hover/vote:scale-110 transition-transform" />
          <span className="text-xs font-mono font-bold">{interestCount}</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title Row */}
        <div className="flex items-start gap-3 mb-2">
          <h3 className="font-bold text-gray-900 group-hover:text-black transition-colors truncate">
            {project.title}
          </h3>
          {/* Status Badge */}
          <span className={`shrink-0 text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm ${STATUS_STYLES[status] || STATUS_STYLES.IDEA}`}>
            {status}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-3 break-keep">
          {project.description}
        </p>

        {/* Tags & Meta */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Need Roles */}
          {neededRoles.slice(0, 2).map((role) => (
            <span
              key={role}
              className="text-[10px] font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-sm border border-gray-200"
            >
              NEED: {role}
            </span>
          ))}

          {/* Interest Tags */}
          {tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded-sm border border-gray-100"
            >
              {tag}
            </span>
          ))}

          {/* Comment Count Placeholder */}
          <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1 ml-auto">
            <MessageCircle size={10} />
            {Math.floor(Math.random() * 15)}
          </span>
        </div>
      </div>

      {/* Rank (Desktop only) */}
      <div className="hidden md:flex items-center justify-center w-8 shrink-0">
        <span className="text-2xl font-mono font-bold text-gray-200 group-hover:text-gray-300 transition-colors">
          {rank}
        </span>
      </div>
    </div>
  )
}
