'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, Share2, Heart, Coffee, Users, Eye, Clock,
  Briefcase, MapPin, Calendar, ChevronRight, Loader2, AlertCircle,
  MessageCircle, ExternalLink, Sparkles, X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/src/lib/supabase/client'
import { useAuth } from '@/src/context/AuthContext'
import { useCoffeeChats } from '@/src/hooks/useCoffeeChats'
import { COFFEE_CHAT_TEMPLATES } from '@/src/lib/constants/coffee-chat-templates'

// Types
interface OpportunityData {
  id: string
  title: string
  description: string
  type: string
  status: string | null
  needed_roles: string[] | null
  needed_skills: any | null
  interest_tags: string[] | null
  location: string | null
  location_type: string | null
  time_commitment: string | null
  compensation_type: string | null
  compensation_details: string | null
  pain_point: string | null
  project_links: any | null
  interest_count: number | null
  applications_count: number | null
  views_count: number | null
  created_at: string | null
  creator_id: string
}

interface CreatorProfile {
  nickname: string
  user_id: string
  skills: any | null
  desired_position: string | null
  university: string | null
  location: string | null
}

// Seed-based deterministic number
function seededNumber(id: string, min: number, max: number): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i)
    hash |= 0
  }
  return min + (Math.abs(hash) % (max - min + 1))
}

// Mock weekly updates (until project_updates table exists)
function generateMockUpdates(id: string) {
  const updates = [
    { week: 1, title: '아이디어 구체화', content: '문제 정의와 타겟 유저 분석을 완료했습니다. 핵심 가설을 수립하고 검증 계획을 세웠습니다.', type: 'ideation' as const },
    { week: 2, title: 'MVP 설계', content: '핵심 기능 3가지를 선정하고 와이어프레임을 작성했습니다. 기술 스택을 결정했습니다.', type: 'design' as const },
    { week: 3, title: '개발 시작', content: '기본 인증 시스템과 메인 기능의 프로토타입을 구현 중입니다.', type: 'development' as const },
  ]
  // Use seed to determine how many updates to show (1-3)
  const count = seededNumber(id + 'updates', 1, 3)
  return updates.slice(0, count)
}

const updateTypeConfig = {
  ideation: { label: '고민', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  design: { label: '설계', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  development: { label: '구현', color: 'bg-green-100 text-green-700 border-green-200' },
  learning: { label: '배움', color: 'bg-purple-100 text-purple-700 border-purple-200' },
}

// CTA Overlay Component
const SignupCTA: React.FC<{ onClose: () => void; onSignup: () => void }> = ({ onClose, onSignup }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.95, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.95, y: 20 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-white w-full max-w-sm p-8 text-center shadow-2xl border border-gray-200"
    >
      <div className="w-16 h-16 bg-black flex items-center justify-center mx-auto mb-6">
        <span className="text-white font-black text-2xl font-mono">D</span>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        이 프로젝트에 관심이 있으신가요?
      </h3>
      <p className="text-gray-500 mb-8 leading-relaxed break-keep text-sm">
        Draft에 가입하면 관심 표현, 커피챗 신청,<br />
        피드백 주고받기까지 모두 가능해요.
      </p>
      <button
        onClick={onSignup}
        className="w-full bg-black hover:bg-gray-800 text-white px-8 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors mb-3"
      >
        무료로 시작하기
        <ArrowRight size={16} />
      </button>
      <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-4">
        가입 30초 · 무료 · 바로 사용 가능
      </p>
      <button
        onClick={onClose}
        className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        돌아가기
      </button>
    </motion.div>
  </motion.div>
)

// Main Component
export const ProjectDetail: React.FC<{ id: string }> = ({ id }) => {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { user } = useAuth()
  const { requestChat } = useCoffeeChats()

  const [opportunity, setOpportunity] = useState<OpportunityData | null>(null)
  const [creator, setCreator] = useState<CreatorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCta, setShowCta] = useState(false)
  const [showCoffeeChatForm, setShowCoffeeChatForm] = useState(false)
  const [coffeeChatMessage, setCoffeeChatMessage] = useState('')
  const [coffeeChatSending, setCoffeeChatSending] = useState(false)
  const [coffeeChatSent, setCoffeeChatSent] = useState(false)
  const [liked, setLiked] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch opportunity and creator in parallel
        const { data: oppData, error: oppError } = await supabase
          .from('opportunities')
          .select('*')
          .eq('id', id)
          .single()

        if (oppError) {
          // Try waitlist_signups as fallback
          const { data: waitlistData, error: waitlistError } = await supabase
            .from('waitlist_signups')
            .select('id, opportunity_draft, created_at')
            .eq('id', id)
            .single()

          if (waitlistError || !waitlistData?.opportunity_draft) {
            setError('프로젝트를 찾을 수 없습니다.')
            return
          }

          // Convert waitlist data to opportunity format
          const draft = waitlistData.opportunity_draft as any
          setOpportunity({
            id: waitlistData.id,
            title: draft.title || '제목 없음',
            description: draft.description || '',
            type: 'side_project',
            status: 'open',
            needed_roles: draft.roles || draft.neededRoles || [],
            needed_skills: null,
            interest_tags: draft.field ? [draft.field] : draft.tags || [],
            location: null,
            location_type: 'remote',
            time_commitment: null,
            compensation_type: null,
            compensation_details: null,
            pain_point: draft.problem || null,
            project_links: null,
            interest_count: null,
            applications_count: null,
            views_count: null,
            created_at: waitlistData.created_at,
            creator_id: '',
          })
          return
        }

        setOpportunity(oppData as OpportunityData)

        // Fetch creator profile
        if (oppData.creator_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('nickname, user_id, skills, desired_position, university, location')
            .eq('user_id', oppData.creator_id)
            .single()

          if (profileData) {
            setCreator(profileData as CreatorProfile)
          }
        }
      } catch {
        setError('데이터를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, supabase])

  // ESC to close CTA
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showCta) setShowCta(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [showCta])

  const handleShare = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handleCoffeeChatAction = () => {
    if (user) {
      setShowCoffeeChatForm(true)
    } else {
      setShowCta(true)
    }
  }

  const handleSignup = () => {
    setShowCta(false)
    router.push('/login')
  }

  const daysAgo = opportunity?.created_at
    ? Math.floor((Date.now() - new Date(opportunity.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-gray-400" size={32} />
          <p className="text-sm text-gray-500">프로젝트 로딩 중...</p>
        </div>
      </div>
    )
  }

  if (error || !opportunity) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">프로젝트를 찾을 수 없습니다</h2>
          <p className="text-gray-500 mb-6">{error || '존재하지 않거나 삭제된 프로젝트입니다.'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 font-bold text-sm hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={16} />
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const mockUpdates = generateMockUpdates(id)
  const interestCount = opportunity.interest_count ?? seededNumber(id, 3, 18)
  const viewsCount = opportunity.views_count ?? seededNumber(id + 'v', 20, 150)
  const coffeeCount = seededNumber(id + 'coffee', 1, 6)

  const projectLinks = opportunity.project_links as Record<string, string> | null

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft size={16} />
            뒤로
          </button>
          <Link href="/" className="font-black text-lg tracking-tight">
            Draft
          </Link>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors"
          >
            <Share2 size={16} />
            {copied ? '복사됨!' : '공유'}
          </button>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              {/* Type Badge */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-mono font-bold px-2 py-1 border border-black text-black uppercase tracking-wider">
                  {opportunity.type === 'side_project' ? 'SIDE PROJECT' :
                   opportunity.type === 'startup' ? 'STARTUP' :
                   opportunity.type === 'study' ? 'STUDY' : opportunity.type?.toUpperCase() || 'PROJECT'}
                </span>
                {opportunity.status === 'open' || opportunity.status === 'active' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    모집 중
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold border border-gray-200">
                    마감
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 break-keep leading-tight">
                {opportunity.title}
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                {creator && (
                  <span className="flex items-center gap-1.5">
                    <div className="w-5 h-5 bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                      {creator.nickname.charAt(0)}
                    </div>
                    {creator.nickname}
                  </span>
                )}
                {opportunity.created_at && (
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {daysAgo === 0 ? '오늘' : `${daysAgo}일 전`}
                  </span>
                )}
                {opportunity.location_type && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {opportunity.location_type === 'remote' ? '원격' :
                     opportunity.location_type === 'offline' ? '오프라인' : '혼합'}
                    {opportunity.location && ` · ${opportunity.location}`}
                  </span>
                )}
              </div>
            </div>

            {/* Action Button (Desktop) */}
            <div className="hidden md:flex flex-col gap-3 shrink-0">
              <button
                onClick={handleCoffeeChatAction}
                className="bg-black hover:bg-gray-800 text-white px-8 py-3.5 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Coffee size={16} />
                커피챗 신청
              </button>
            </div>
          </div>

          {/* Tags */}
          {opportunity.interest_tags && opportunity.interest_tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {opportunity.interest_tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Stats Bar */}
          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-gray-100 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Heart size={14} className="text-gray-400" />
              관심 <span className="font-bold text-gray-900">{interestCount}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Eye size={14} className="text-gray-400" />
              조회 <span className="font-bold text-gray-900">{viewsCount}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Coffee size={14} className="text-gray-400" />
              커피챗 <span className="font-bold text-gray-900">{coffeeCount}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <MessageCircle size={14} className="text-gray-400" />
              피드백 <span className="font-bold text-gray-900">{seededNumber(id + 'fb', 0, 8)}</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Content (2/3) */}
          <div className="lg:col-span-2 space-y-10">
            {/* Project Description */}
            <section>
              <h2 className="text-[11px] font-mono font-bold text-gray-600 uppercase tracking-wider mb-4">
                프로젝트 소개
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-800 leading-relaxed break-keep whitespace-pre-line text-[15px]">
                  {opportunity.description}
                </p>
              </div>
            </section>

            {/* Pain Point (if exists) */}
            {opportunity.pain_point && (
              <section className="bg-gray-50 border border-gray-200 p-6">
                <h2 className="text-[11px] font-mono font-bold text-gray-600 uppercase tracking-wider mb-3">
                  해결하려는 문제
                </h2>
                <p className="text-gray-800 leading-relaxed break-keep text-[15px]">
                  {opportunity.pain_point}
                </p>
              </section>
            )}

            {/* Weekly Updates Timeline (Maker Log style) */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[11px] font-mono font-bold text-gray-600 uppercase tracking-wider">
                  주간 업데이트
                </h2>
                <span className="text-[10px] font-mono text-gray-400">
                  {mockUpdates.length}개의 업데이트
                </span>
              </div>

              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-[15px] top-2 bottom-2 w-[1px] bg-gray-200" />

                <div className="space-y-6">
                  {mockUpdates.map((update, index) => {
                    const config = updateTypeConfig[update.type]
                    return (
                      <div key={index} className="relative pl-10">
                        {/* Timeline Dot */}
                        <div className={`absolute left-[11px] top-1.5 w-[9px] h-[9px] border-2 bg-white ${
                          index === 0 ? 'border-black' : 'border-gray-300'
                        }`} />

                        <div className="bg-white border border-gray-200 p-5 hover:border-gray-300 transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 border ${config.color}`}>
                              {config.label}
                            </span>
                            <span className="text-[10px] font-mono text-gray-400">
                              Week {update.week}
                            </span>
                          </div>
                          <h3 className="font-bold text-gray-900 mb-1.5">{update.title}</h3>
                          <p className="text-sm text-gray-600 leading-relaxed break-keep">
                            {update.content}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* More updates hint */}
              <div className="mt-6 pl-10">
                <div className="bg-gray-50 border border-dashed border-gray-300 p-4 text-center">
                  <p className="text-sm text-gray-500">
                    Draft에 가입하면 모든 업데이트를 확인하고 피드백을 남길 수 있어요
                  </p>
                </div>
              </div>
            </section>

            {/* Feedback Section */}
            <section>
              <h2 className="text-[11px] font-mono font-bold text-gray-600 uppercase tracking-wider mb-4">
                커뮤니티 피드백
              </h2>
              <div className="bg-gray-50 border border-gray-200 p-8 text-center">
                <MessageCircle size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="font-bold text-gray-700 mb-1">피드백을 남겨보세요</p>
                <p className="text-sm text-gray-500 mb-4 break-keep">
                  아이디어에 대한 솔직한 의견이 프로젝트를 성장시킵니다
                </p>
                <button
                  onClick={handleCoffeeChatAction}
                  className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 font-bold text-sm hover:bg-gray-800 transition-colors"
                >
                  피드백 작성하기
                  <ChevronRight size={14} />
                </button>
              </div>
            </section>
          </div>

          {/* Right: Sidebar (1/3) */}
          <aside className="space-y-6">
            {/* Team Section */}
            <div className="border border-gray-200 p-6">
              <h3 className="text-[11px] font-mono font-bold text-gray-600 uppercase tracking-wider mb-4">
                팀 정보
              </h3>
              {creator ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-bold text-sm">
                      {creator.nickname.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{creator.nickname}</p>
                      <p className="text-xs text-gray-500">
                        {creator.desired_position || '메이커'}
                        {creator.university && ` · ${creator.university}`}
                      </p>
                    </div>
                  </div>

                  {creator.skills && (
                    <div className="flex flex-wrap gap-1.5">
                      {(Array.isArray(creator.skills) ? creator.skills : []).slice(0, 5).map((skill: string) => (
                        <span key={skill} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 flex items-center justify-center font-bold text-sm text-gray-500">
                    ?
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">익명 메이커</p>
                    <p className="text-xs text-gray-500">프로필 비공개</p>
                  </div>
                </div>
              )}
            </div>

            {/* Needed Roles */}
            {opportunity.needed_roles && opportunity.needed_roles.length > 0 && (
              <div className="border border-gray-200 p-6">
                <h3 className="text-[11px] font-mono font-bold text-gray-600 uppercase tracking-wider mb-4">
                  모집 중인 포지션
                </h3>
                <div className="space-y-3">
                  {opportunity.needed_roles.map((role) => (
                    <div
                      key={role}
                      className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100"
                    >
                      <div className="flex items-center gap-2">
                        <Briefcase size={14} className="text-blue-600" />
                        <span className="font-medium text-sm text-blue-900">{role}</span>
                      </div>
                      <button
                        onClick={handleCoffeeChatAction}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        커피챗 신청 &rarr;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Project Info */}
            <div className="border border-gray-200 p-6">
              <h3 className="text-[11px] font-mono font-bold text-gray-600 uppercase tracking-wider mb-4">
                프로젝트 정보
              </h3>
              <div className="space-y-3 text-sm">
                {opportunity.time_commitment && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      <Clock size={14} />
                      시간 투자
                    </span>
                    <span className="font-medium text-gray-900">{opportunity.time_commitment}</span>
                  </div>
                )}
                {opportunity.location_type && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      <MapPin size={14} />
                      활동 방식
                    </span>
                    <span className="font-medium text-gray-900">
                      {opportunity.location_type === 'remote' ? '원격' :
                       opportunity.location_type === 'offline' ? '오프라인' : '혼합'}
                    </span>
                  </div>
                )}
                {opportunity.compensation_type && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      <Sparkles size={14} />
                      보상
                    </span>
                    <span className="font-medium text-gray-900">
                      {opportunity.compensation_type === 'equity' ? '지분' :
                       opportunity.compensation_type === 'paid' ? '유급' : '무급 (경험)'}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Users size={14} />
                    관심 표현
                  </span>
                  <span className="font-medium text-gray-900">{interestCount}명</span>
                </div>
              </div>
            </div>

            {/* Project Links */}
            {projectLinks && Object.keys(projectLinks).length > 0 && (
              <div className="border border-gray-200 p-6">
                <h3 className="text-[11px] font-mono font-bold text-gray-600 uppercase tracking-wider mb-4">
                  링크
                </h3>
                <div className="space-y-2">
                  {Object.entries(projectLinks).map(([key, url]) => (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors p-2 hover:bg-gray-50"
                    >
                      <ExternalLink size={14} />
                      {key}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Card */}
            <div className="bg-black text-white p-6">
              <h3 className="font-bold mb-2">프로젝트에 참여하고 싶나요?</h3>
              <p className="text-gray-400 text-sm mb-4 break-keep">
                커피챗으로 메이커와 직접 이야기해보세요.
              </p>
              <button
                onClick={handleCoffeeChatAction}
                className="w-full bg-white text-black py-3 font-bold text-sm hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                <Coffee size={14} />
                커피챗 신청하기
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden z-30">
        <button
          onClick={handleCoffeeChatAction}
          className="w-full bg-black text-white py-3.5 font-bold text-sm flex items-center justify-center gap-2"
        >
          <Coffee size={16} />
          커피챗 신청
        </button>
      </div>

      {/* Mobile bottom padding */}
      <div className="h-20 md:hidden" />

      {/* Coffee Chat Form Overlay (Authenticated) */}
      <AnimatePresence>
        {showCoffeeChatForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowCoffeeChatForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md p-8 text-center shadow-2xl border border-gray-200 rounded-xl"
            >
              {coffeeChatSent ? (
                <>
                  <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                    <Coffee size={24} className="text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">커피챗 신청 완료!</h3>
                  <p className="text-gray-500 text-sm mb-6">메이커에게 알림이 전송되었습니다.</p>
                  <button
                    onClick={() => { setShowCoffeeChatForm(false); setCoffeeChatSent(false) }}
                    className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    돌아가기
                  </button>
                </>
              ) : (
                <>
                  <Coffee size={28} className="text-gray-900 mb-4 mx-auto" />
                  <h3 className="text-lg font-bold text-gray-900 mb-1">커피챗 신청</h3>
                  <p className="text-gray-500 text-xs mb-5">메이커에게 보낼 메시지를 작성해주세요</p>

                  <div className="flex flex-wrap gap-2 justify-center mb-4">
                    {COFFEE_CHAT_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => setCoffeeChatMessage(tpl.message)}
                        className="text-[11px] px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={coffeeChatMessage}
                    onChange={(e) => setCoffeeChatMessage(e.target.value)}
                    placeholder="안녕하세요! 프로젝트에 관심이 있어서 연락드립니다..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black resize-none mb-4 text-left"
                  />

                  <button
                    onClick={async () => {
                      if (!coffeeChatMessage.trim() || !opportunity?.id || !user?.email) return
                      setCoffeeChatSending(true)
                      try {
                        await requestChat({
                          opportunityId: opportunity.id,
                          email: user.email,
                          name: user.user_metadata?.full_name || user.email.split('@')[0],
                          message: coffeeChatMessage.trim(),
                        })
                        setCoffeeChatSent(true)
                      } catch {
                        // Error handled in hook
                      } finally {
                        setCoffeeChatSending(false)
                      }
                    }}
                    disabled={!coffeeChatMessage.trim() || coffeeChatSending}
                    className="w-full bg-black hover:bg-gray-800 text-white py-3 font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                  >
                    {coffeeChatSending ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        전송 중...
                      </>
                    ) : (
                      <>
                        <Coffee size={14} />
                        신청하기
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowCoffeeChatForm(false)}
                    className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    돌아가기
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Signup CTA Overlay (Non-authenticated) */}
      <AnimatePresence>
        {showCta && <SignupCTA onClose={() => setShowCta(false)} onSignup={handleSignup} />}
      </AnimatePresence>
    </div>
  )
}
