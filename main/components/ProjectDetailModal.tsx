'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, Heart, Coffee, Users, Eye, Clock,
  Briefcase, MapPin, Calendar, Loader2, AlertCircle,
  MessageCircle, Sparkles, X, ArrowUpRight, Share2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOpportunity } from '@/src/hooks/useOpportunities'
import { useProfileByUserId } from '@/src/hooks/usePublicProfiles'
import { useProjectUpdates, useCreateProjectUpdate, type ProjectUpdate } from '@/src/hooks/useProjectUpdates'
import { useAuth } from '@/src/context/AuthContext'
import { useCoffeeChats } from '@/src/hooks/useCoffeeChats'
import { COFFEE_CHAT_TEMPLATES } from '@/src/lib/constants/coffee-chat-templates'

interface ProjectDetailModalProps {
  projectId: string | null
  onClose: () => void
}

function seededNumber(id: string, min: number, max: number): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i)
    hash |= 0
  }
  return min + (Math.abs(hash) % (max - min + 1))
}

const updateTypeColors: Record<string, string> = {
  ideation: 'bg-amber-500',
  design: 'bg-blue-500',
  development: 'bg-emerald-500',
  launch: 'bg-purple-500',
  general: 'bg-gray-400',
}

const updateTypeLabels: Record<string, string> = {
  ideation: '고민',
  design: '설계',
  development: '구현',
  launch: '런칭',
  general: '일반',
}

const UPDATE_TYPE_OPTIONS: { value: ProjectUpdate['update_type']; label: string }[] = [
  { value: 'ideation', label: '고민' },
  { value: 'design', label: '설계' },
  { value: 'development', label: '구현' },
  { value: 'launch', label: '런칭' },
  { value: 'general', label: '일반' },
]

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ projectId, onClose }) => {
  const router = useRouter()
  const [showCta, setShowCta] = useState(false)
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [updateTitle, setUpdateTitle] = useState('')
  const [updateContent, setUpdateContent] = useState('')
  const [updateType, setUpdateType] = useState<ProjectUpdate['update_type']>('general')
  const [showCoffeeChatForm, setShowCoffeeChatForm] = useState(false)
  const [coffeeChatMessage, setCoffeeChatMessage] = useState('')
  const [coffeeChatSending, setCoffeeChatSending] = useState(false)
  const [coffeeChatSent, setCoffeeChatSent] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const { user } = useAuth()
  const { requestChat } = useCoffeeChats()

  const { data: opportunity, isLoading: loading } = useOpportunity(projectId ?? undefined)
  const { data: creator } = useProfileByUserId(opportunity?.creator_id ?? undefined)
  const { data: updates = [] } = useProjectUpdates(opportunity?.id)
  const createUpdate = useCreateProjectUpdate()

  const isOwner = !!(user && opportunity && user.id === opportunity.creator_id)

  useEffect(() => {
    setShowCta(false)
    setShowCoffeeChatForm(false)
    setCoffeeChatMessage('')
    setCoffeeChatSent(false)
  }, [projectId])

  useEffect(() => {
    if (projectId) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [projectId])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCta) setShowCta(false)
        else onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, showCta])

  const handleAction = () => {
    if (user) {
      // Authenticated: show coffee chat form
      setShowCoffeeChatForm(true)
    } else {
      // Not authenticated: show signup CTA
      setShowCta(true)
    }
  }
  const handleSignup = () => {
    setShowCta(false)
    onClose()
    router.push('/login')
  }

  const handleShare = async () => {
    const appUrl = window.location.origin
    const url = `${appUrl}/p/${projectId}`
    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const daysAgo = opportunity?.created_at
    ? Math.floor((Date.now() - new Date(opportunity.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <AnimatePresence>
      {projectId && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
            onClick={onClose}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col relative"
              role="dialog"
              aria-modal="true"
              aria-label={opportunity?.title || '프로젝트 상세'}
            >
              {/* macOS-style Window Bar */}
              <div className="bg-[#F9FAFB] border-b border-gray-200/80 px-5 py-3 flex items-center justify-between rounded-t-xl shrink-0">
                <div className="flex items-center gap-2">
                  <button onClick={onClose} className="group w-3 h-3 rounded-full bg-[#FF5F57] hover:brightness-90 transition-all relative" aria-label="닫기">
                    <X size={7} className="text-[#FF5F57] group-hover:text-[#4A0002] absolute inset-0 m-auto transition-colors" />
                  </button>
                  <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                  <div className="w-3 h-3 rounded-full bg-[#28C840]" />
                </div>
                {!loading && opportunity && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-gray-200/70 text-gray-500 rounded uppercase tracking-wider">
                      {opportunity.type === 'side_project' ? 'SIDE PROJECT' :
                       opportunity.type === 'startup' ? 'STARTUP' :
                       opportunity.type === 'study' ? 'STUDY' : opportunity.type?.toUpperCase() || 'PROJECT'}
                    </span>
                    {(opportunity.status === 'open' || opportunity.status === 'active') && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100/70 text-emerald-600 text-[10px] font-bold rounded">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        모집 중
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleShare}
                    className="p-1 hover:bg-gray-200/60 rounded-md transition-colors"
                    aria-label="공유"
                  >
                    {shareCopied ? (
                      <span className="text-[10px] font-medium text-green-600 px-1">복사됨!</span>
                    ) : (
                      <Share2 size={14} className="text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-200/60 rounded-md transition-colors"
                    aria-label="닫기"
                  >
                    <X size={16} className="text-gray-400" />
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-[60vh]">
                  <Loader2 className="animate-spin text-gray-400" size={28} />
                </div>
              ) : !opportunity ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center px-8">
                  <AlertCircle size={40} className="text-gray-300 mb-4" />
                  <p className="font-bold text-gray-700 mb-1">프로젝트를 찾을 수 없습니다</p>
                  <p className="text-sm text-gray-500">삭제되었거나 존재하지 않는 프로젝트입니다.</p>
                </div>
              ) : (
                <>
                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto">
                    {/* Header */}
                    <div className="px-8 pt-6 pb-6">

                      {/* Title */}
                      <h2 className="text-2xl font-bold text-gray-900 mb-4 break-keep leading-tight">
                        {opportunity.title}
                      </h2>

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        {creator ? (
                          <span className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                              {creator.nickname.charAt(0)}
                            </div>
                            <span className="font-medium text-gray-700">{creator.nickname}</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-500">?</div>
                            <span className="font-medium text-gray-700">익명</span>
                          </span>
                        )}
                        {opportunity.created_at && (
                          <span className="flex items-center gap-1.5 text-gray-400">
                            <Calendar size={13} />
                            {daysAgo === 0 ? '오늘' : `${daysAgo}일 전`}
                          </span>
                        )}
                        {opportunity.location_type && (
                          <span className="flex items-center gap-1.5 text-gray-400">
                            <MapPin size={13} />
                            {opportunity.location_type === 'remote' ? '원격' :
                             opportunity.location_type === 'offline' ? '오프라인' : '혼합'}
                          </span>
                        )}
                      </div>

                      {/* Tags */}
                      {opportunity.interest_tags && opportunity.interest_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-4">
                          {opportunity.interest_tags.map((tag) => (
                            <span key={tag} className="px-2.5 py-1 bg-gray-50 text-gray-500 text-xs rounded-md">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-5 mt-5 text-sm text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <Heart size={14} />
                          <span className="font-medium text-gray-600">{opportunity.interest_count ?? seededNumber(projectId, 3, 18)}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Eye size={14} />
                          <span className="font-medium text-gray-600">{opportunity.views_count ?? seededNumber(projectId + 'v', 20, 150)}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Coffee size={14} />
                          <span className="font-medium text-gray-600">{seededNumber(projectId + 'coffee', 1, 6)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="mx-8 border-t border-gray-100" />

                    {/* Body: 2-Column Layout */}
                    <div className="px-8 py-6">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
                        {/* Left Column (3/5) */}
                        <div className="md:col-span-3 space-y-8">
                          {/* Description */}
                          <section>
                            <h3 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-3">
                              프로젝트 소개
                            </h3>
                            <p className="text-[15px] text-gray-700 leading-[1.8] break-keep whitespace-pre-line">
                              {opportunity.description}
                            </p>
                          </section>

                          {/* Pain Point */}
                          {opportunity.pain_point && (
                            <section className="bg-gray-50 rounded-xl p-5">
                              <h3 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">
                                해결하려는 문제
                              </h3>
                              <p className="text-sm text-gray-700 leading-relaxed break-keep">
                                {opportunity.pain_point}
                              </p>
                            </section>
                          )}

                          {/* Weekly Updates Timeline */}
                          <section>
                            <div className="flex items-center justify-between mb-5">
                              <h3 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                                주간 업데이트
                              </h3>
                              {isOwner && !showUpdateForm && (
                                <button
                                  onClick={() => setShowUpdateForm(true)}
                                  className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                                >
                                  + 업데이트 작성
                                </button>
                              )}
                            </div>

                            {/* Update Form (owner only) */}
                            {isOwner && showUpdateForm && (
                              <div className="mb-5 bg-gray-50 rounded-xl p-4 space-y-3">
                                <div className="flex gap-2">
                                  {UPDATE_TYPE_OPTIONS.map((opt) => (
                                    <button
                                      key={opt.value}
                                      onClick={() => setUpdateType(opt.value)}
                                      className={`text-[10px] font-medium px-2.5 py-1 rounded-md transition-colors ${
                                        updateType === opt.value
                                          ? 'bg-gray-900 text-white'
                                          : 'bg-white text-gray-500 hover:bg-gray-100'
                                      }`}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                                <input
                                  type="text"
                                  placeholder="제목"
                                  value={updateTitle}
                                  onChange={(e) => setUpdateTitle(e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
                                />
                                <textarea
                                  placeholder="이번 주 진행 상황을 공유해주세요"
                                  value={updateContent}
                                  onChange={(e) => setUpdateContent(e.target.value)}
                                  rows={3}
                                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 resize-none"
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => { setShowUpdateForm(false); setUpdateTitle(''); setUpdateContent('') }}
                                    className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5"
                                  >
                                    취소
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (!updateTitle.trim() || !updateContent.trim() || !opportunity?.id) return
                                      await createUpdate.mutateAsync({
                                        opportunity_id: opportunity.id,
                                        week_number: updates.length + 1,
                                        title: updateTitle.trim(),
                                        content: updateContent.trim(),
                                        update_type: updateType,
                                      })
                                      setUpdateTitle('')
                                      setUpdateContent('')
                                      setUpdateType('general')
                                      setShowUpdateForm(false)
                                    }}
                                    disabled={!updateTitle.trim() || !updateContent.trim() || createUpdate.isPending}
                                    className="text-xs font-medium bg-gray-900 text-white px-4 py-1.5 rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                  >
                                    {createUpdate.isPending ? '저장 중...' : '게시'}
                                  </button>
                                </div>
                              </div>
                            )}

                            {updates.length > 0 ? (
                              <div className="relative pl-6">
                                <div className="absolute left-[7px] top-1 bottom-1 w-[2px] bg-gray-200 rounded-full" />
                                <div className="space-y-5">
                                  {updates.map((update) => (
                                    <div key={update.id} className="relative">
                                      <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-[3px] border-white ${updateTypeColors[update.update_type] || 'bg-gray-400'} shadow-sm`} />
                                      <div>
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-xs font-medium text-gray-500">
                                            {updateTypeLabels[update.update_type] || update.update_type}
                                          </span>
                                          <span className="text-[10px] font-mono text-gray-300">Week {update.week_number}</span>
                                        </div>
                                        <h4 className="font-semibold text-gray-900 text-sm mb-0.5">{update.title}</h4>
                                        <p className="text-xs text-gray-500 leading-relaxed break-keep">{update.content}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-6">
                                <Clock size={20} className="text-gray-200 mx-auto mb-2" />
                                <p className="text-xs text-gray-400">아직 업데이트가 없습니다</p>
                                {isOwner && (
                                  <button
                                    onClick={() => setShowUpdateForm(true)}
                                    className="text-xs text-gray-500 hover:text-gray-700 mt-1 underline"
                                  >
                                    첫 업데이트를 작성해보세요
                                  </button>
                                )}
                              </div>
                            )}
                          </section>

                          {/* Feedback CTA */}
                          <section className="bg-gray-50 rounded-xl p-6 text-center">
                            <MessageCircle size={24} className="text-gray-300 mx-auto mb-2" />
                            <p className="font-semibold text-gray-700 text-sm mb-1">피드백을 남겨보세요</p>
                            <p className="text-xs text-gray-400 mb-4 break-keep">
                              아이디어에 대한 솔직한 의견이 프로젝트를 성장시킵니다
                            </p>
                            <button
                              onClick={handleAction}
                              className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg font-medium text-xs hover:bg-gray-800 transition-colors"
                            >
                              피드백 작성하기 <ArrowUpRight size={12} />
                            </button>
                          </section>
                        </div>

                        {/* Right Column (2/5) - Sidebar */}
                        <div className="md:col-span-2 space-y-7">
                          {/* Team */}
                          <div>
                            <h3 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-3">
                              팀 정보
                            </h3>
                            {creator ? (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                                  {creator.nickname.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-gray-900 text-sm">{creator.nickname}</p>
                                  <p className="text-xs text-gray-400 truncate">
                                    {creator.desired_position || '메이커'}
                                    {creator.university && ` · ${creator.university}`}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-sm text-gray-400">?</div>
                                <div>
                                  <p className="font-semibold text-gray-900 text-sm">익명 메이커</p>
                                  <p className="text-xs text-gray-400">프로필 비공개</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Needed Roles */}
                          {opportunity.needed_roles && opportunity.needed_roles.length > 0 && (
                            <div>
                              <h3 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-3">
                                모집 중인 포지션
                              </h3>
                              <div className="space-y-2">
                                {opportunity.needed_roles.map((role) => (
                                  <div key={role} className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <Briefcase size={14} className="text-gray-400" />
                                      <span className="text-sm text-gray-700">{role}</span>
                                    </div>
                                    <button
                                      onClick={handleAction}
                                      className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                                    >
                                      커피챗 신청 &rarr;
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Project Info */}
                          <div>
                            <h3 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-3">
                              프로젝트 정보
                            </h3>
                            <div className="space-y-2.5 text-sm">
                              {opportunity.time_commitment && (
                                <div className="flex items-center gap-2.5">
                                  <Clock size={14} className="text-gray-300 shrink-0" />
                                  <span className="text-gray-500">시간 투자</span>
                                  <span className="text-gray-800 font-medium">{opportunity.time_commitment}</span>
                                </div>
                              )}
                              {opportunity.location_type && (
                                <div className="flex items-center gap-2.5">
                                  <MapPin size={14} className="text-gray-300 shrink-0" />
                                  <span className="text-gray-500">활동 방식</span>
                                  <span className="text-gray-800 font-medium">
                                    {opportunity.location_type === 'remote' ? '원격' :
                                     opportunity.location_type === 'offline' ? '오프라인' : '혼합'}
                                  </span>
                                </div>
                              )}
                              {opportunity.compensation_type && (
                                <div className="flex items-center gap-2.5">
                                  <Sparkles size={14} className="text-gray-300 shrink-0" />
                                  <span className="text-gray-500">보상</span>
                                  <span className="text-gray-800 font-medium">
                                    {opportunity.compensation_type === 'equity' ? '지분' :
                                     opportunity.compensation_type === 'paid' ? '유급' : '무급 (경험)'}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-2.5">
                                <Users size={14} className="text-gray-300 shrink-0" />
                                <span className="text-gray-500">관심</span>
                                <span className="text-gray-800 font-medium">{opportunity.interest_count ?? seededNumber(projectId, 3, 18)}명</span>
                              </div>
                            </div>
                          </div>

                          {/* CTA Card */}
                          <div className="bg-gray-900 rounded-xl p-5 text-white">
                            <h3 className="font-bold text-sm mb-1">프로젝트에 참여하고 싶나요?</h3>
                            <p className="text-gray-400 text-xs mb-4 break-keep">
                              커피챗으로 메이커와 직접 이야기해보세요.
                            </p>
                            <button
                              onClick={handleAction}
                              className="w-full bg-white text-gray-900 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                            >
                              <Coffee size={14} />
                              커피챗 신청하기
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sticky Footer CTA */}
                  <div className="px-6 py-4 bg-white border-t border-gray-100">
                    <button
                      onClick={handleAction}
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <Coffee size={15} />
                      커피챗 신청
                    </button>
                  </div>

                  {/* Coffee Chat Form Overlay (Authenticated) */}
                  <AnimatePresence>
                    {showCoffeeChatForm && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-8 text-center rounded-xl"
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          transition={{ delay: 0.1 }}
                          className="w-full max-w-md"
                        >
                          {coffeeChatSent ? (
                            <>
                              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                                <Coffee size={24} className="text-green-600" />
                              </div>
                              <h3 className="text-xl font-bold text-gray-900 mb-2">커피챗 신청 완료!</h3>
                              <p className="text-gray-500 text-sm mb-6">메이커에게 알림이 전송되었습니다. 수락되면 연락처를 받을 수 있어요.</p>
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

                              {/* Template buttons */}
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
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black resize-none mb-4"
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
                                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3"
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
                    {showCta && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-8 text-center rounded-xl"
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          transition={{ delay: 0.1 }}
                        >
                          <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <span className="text-white font-black text-xl font-mono">D</span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            이 프로젝트에 관심이 있으신가요?
                          </h3>
                          <p className="text-gray-500 mb-8 leading-relaxed break-keep max-w-sm text-sm mx-auto">
                            Draft에 가입하면 관심 표현, 커피챗 신청,
                            피드백 주고받기까지 모두 가능해요.
                          </p>
                          <button
                            onClick={handleSignup}
                            className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors mx-auto mb-3"
                          >
                            무료로 시작하기
                            <ArrowRight size={16} />
                          </button>
                          <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-6">
                            가입 30초 · 무료 · 바로 사용 가능
                          </p>
                          <button
                            onClick={() => setShowCta(false)}
                            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            돌아가기
                          </button>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
