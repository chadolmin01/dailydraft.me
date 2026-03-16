'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, Heart, Coffee, Users, Clock,
  Briefcase, MapPin, Calendar, Loader2, AlertCircle,
  Sparkles, X, Share2,
  Eye, ExternalLink, Github, FileText, Globe, Edit3, Code
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOpportunity } from '@/src/hooks/useOpportunities'
import { useProfileByUserId } from '@/src/hooks/usePublicProfiles'
import { useProjectUpdates } from '@/src/hooks/useProjectUpdates'
import { useAuth } from '@/src/context/AuthContext'
import { useCoffeeChats } from '@/src/hooks/useCoffeeChats'
import { useInterests } from '@/src/hooks/useInterests'
import { WriteUpdateForm } from '@/components/WriteUpdateForm'
import { CoffeeChatRequestForm } from '@/components/CoffeeChatRequestForm'
import { CommentSection } from '@/components/CommentSection'

interface ProjectDetailModalProps {
  projectId: string | null
  onClose: () => void
}

const updateTypeColors: Record<string, string> = {
  ideation: 'bg-amber-500',
  design: 'bg-blue-500',
  development: 'bg-emerald-500',
  launch: 'bg-purple-500',
  general: 'bg-txt-disabled',
}

const updateTypeLabels: Record<string, string> = {
  ideation: '고민',
  design: '설계',
  development: '구현',
  launch: '런칭',
  general: '일반',
}


const linkIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  github: Github,
  notion: FileText,
  website: Globe,
  other: ExternalLink,
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ projectId, onClose }) => {
  const router = useRouter()
  const [showCta, setShowCta] = useState(false)
  const [showCoffeeChatForm, setShowCoffeeChatForm] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string | undefined>(undefined)
  const [shareCopied, setShareCopied] = useState(false)
  const [showWriteUpdate, setShowWriteUpdate] = useState(false)
  const [hasInterested, setHasInterested] = useState(false)
  const { user } = useAuth()
  const { expressInterest, loading: interestLoading } = useInterests({ opportunityId: projectId ?? '' })
  const { data: myChatsForProject = [] } = useCoffeeChats({
    opportunityId: projectId ?? undefined,
    enabled: !!projectId,
  })

  const { data: opportunity, isLoading: loading } = useOpportunity(projectId ?? undefined)
  const { data: creator } = useProfileByUserId(opportunity?.creator_id ?? undefined)
  const { data: updates = [] } = useProjectUpdates(opportunity?.id)

  const isOwner = !!(user && opportunity && user.id === opportunity.creator_id)
  const existingChat = myChatsForProject.length > 0 ? myChatsForProject[0] : null

  useEffect(() => {
    setShowCta(false)
    setShowCoffeeChatForm(false)
    setHasInterested(false)
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

  const handleAction = (role?: string) => {
    if (isOwner) return
    if (existingChat) return
    setSelectedRole(role)
    if (user) {
      setShowCoffeeChatForm(true)
    } else {
      setShowCta(true)
    }
  }
  const handleInterest = async () => {
    if (!user) {
      setShowCta(true)
      return
    }
    if (hasInterested || interestLoading) return
    const success = await expressInterest(user.email ?? '')
    if (success) setHasInterested(true)
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
      const textarea = document.createElement('textarea')
      textarea.value = url
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
        setShareCopied(true)
        setTimeout(() => setShareCopied(false), 2000)
      } catch { /* clipboard unavailable */ }
      document.body.removeChild(textarea)
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-modal-backdrop"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-modal flex items-center justify-center p-4 md:p-8"
            onClick={onClose}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg md:max-w-2xl lg:max-w-4xl max-h-[95vh] md:max-h-[90vh] bg-surface-card shadow-brutal-xl border-2 border-border-strong overflow-hidden flex flex-col relative"
              role="dialog"
              aria-modal="true"
              aria-label={opportunity?.title || '프로젝트 상세'}
            >
              {/* macOS-style Window Bar */}
              <div className="bg-surface-sunken border-b border-border-strong px-3 sm:px-5 py-1.5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <button onClick={onClose} className="group w-5 h-5 sm:w-3 sm:h-3 rounded-full bg-[#FF5F57] hover:brightness-90 transition-all relative flex items-center justify-center" aria-label="닫기">
                    <X size={10} className="text-[#FF5F57] group-hover:text-[#4A0002] transition-colors sm:w-[0.4375rem] sm:h-[0.4375rem]" />
                  </button>
                  <div className="w-3 h-3 rounded-full bg-[#FEBC2E] hidden sm:block" />
                  <div className="w-3 h-3 rounded-full bg-[#28C840] hidden sm:block" />
                </div>
                {!loading && opportunity && (
                  <div className="flex items-center gap-2">
                    <span className="text-[0.625rem] font-mono font-bold px-2 py-0.5 bg-surface-sunken text-txt-tertiary border border-border uppercase tracking-wider">
                      {opportunity.type === 'side_project' ? 'SIDE PROJECT' :
                       opportunity.type === 'startup' ? 'STARTUP' :
                       opportunity.type === 'study' ? 'STUDY' : opportunity.type?.toUpperCase() || 'PROJECT'}
                    </span>
                    {opportunity.status === 'active' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-status-success-bg text-status-success-text text-[0.625rem] font-bold border border-status-success-text/30">
                        <span className="w-1.5 h-1.5 bg-emerald-500 animate-pulse" />
                        모집 중
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleShare}
                    className="p-2 hover:bg-surface-sunken transition-colors border border-transparent hover:border-border"
                    aria-label="공유"
                  >
                    {shareCopied ? (
                      <span className="text-[0.625rem] font-medium text-status-success-text px-1">복사됨!</span>
                    ) : (
                      <Share2 size={14} className="text-txt-disabled" />
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-surface-sunken transition-colors border border-transparent hover:border-border"
                    aria-label="닫기"
                  >
                    <X size={18} className="text-txt-disabled" />
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-[60vh]">
                  <Loader2 className="animate-spin text-txt-disabled" size={28} />
                </div>
              ) : !opportunity ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center px-8">
                  <AlertCircle size={40} className="text-txt-disabled mb-4" />
                  <p className="font-bold text-txt-primary mb-1">프로젝트를 찾을 수 없습니다</p>
                  <p className="text-sm text-txt-tertiary">삭제되었거나 존재하지 않는 프로젝트입니다.</p>
                </div>
              ) : (
                <>
                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto">

                    {/* Hero Cover or Plain Header */}
                    {opportunity.demo_images && opportunity.demo_images.length > 0 ? (
                      <>
                        {/* Hero Cover — first image as background */}
                        <div className="relative h-48 sm:h-56 overflow-hidden">
                          <img
                            src={opportunity.demo_images[0]}
                            alt={opportunity.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                          {/* Title & Meta overlay */}
                          <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-4 sm:pb-5">
                            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 break-keep leading-tight drop-shadow-sm">
                              {opportunity.title}
                            </h2>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
                              {creator ? (
                                <span className="flex items-center gap-2">
                                  <div className="w-5 h-5 bg-white/20 backdrop-blur flex items-center justify-center text-[0.5625rem] font-bold text-white">
                                    {creator.nickname.charAt(0)}
                                  </div>
                                  <span className="font-medium text-white/90">{creator.nickname}</span>
                                </span>
                              ) : (
                                <span className="flex items-center gap-2">
                                  <div className="w-5 h-5 bg-white/20 backdrop-blur flex items-center justify-center text-[0.5625rem] font-bold text-white/70">?</div>
                                  <span className="font-medium text-white/90">익명</span>
                                </span>
                              )}
                              {opportunity.created_at && (
                                <span className="flex items-center gap-1.5">
                                  <Calendar size={12} />
                                  {daysAgo === 0 ? '오늘' : `${daysAgo}일 전`}
                                </span>
                              )}
                              {opportunity.location_type && (
                                <span className="flex items-center gap-1.5">
                                  <MapPin size={12} />
                                  {opportunity.location_type === 'remote' ? '원격' :
                                   opportunity.location_type === 'offline' ? '오프라인' : '혼합'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Tags + Stats below cover */}
                        <div className="px-4 sm:px-8 pt-3 pb-3">
                          {opportunity.interest_tags && opportunity.interest_tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {opportunity.interest_tags.map((tag) => (
                                <span key={tag} className="px-2.5 py-1 bg-surface-sunken text-txt-tertiary text-xs border border-border">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-3 mt-3">
                            <button
                              onClick={handleInterest}
                              disabled={isOwner || interestLoading}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs font-bold transition-all ${
                                hasInterested
                                  ? 'border-red-300 bg-red-50 text-red-500'
                                  : 'border-border-strong bg-surface-card text-txt-secondary hover:border-red-300 hover:text-red-500'
                              } disabled:opacity-40 disabled:cursor-default`}
                            >
                              <Heart size={12} className={hasInterested ? 'fill-current' : ''} />
                              {hasInterested ? '관심 표현됨' : '관심 있어요'}
                              <span className="text-txt-disabled font-mono">{(opportunity.interest_count ?? 0) + (hasInterested ? 1 : 0)}</span>
                            </button>
                            <span className="flex items-center gap-1 text-xs text-txt-disabled">
                              <Eye size={12} />
                              {opportunity.views_count ?? 0}
                            </span>
                          </div>
                        </div>

                        {/* Extra images gallery */}
                        {opportunity.demo_images.length > 1 && (
                          <div className="px-4 sm:px-8 pb-3">
                            <div className="flex gap-2 overflow-x-auto">
                              {opportunity.demo_images.slice(1).map((src, idx) => (
                                <img
                                  key={idx}
                                  src={src}
                                  alt={`${opportunity.title} 이미지 ${idx + 2}`}
                                  className="h-24 w-auto border border-border-strong object-cover shrink-0"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      /* Plain Header — no images */
                      <div className="px-4 sm:px-8 pt-4 sm:pt-6 pb-3">
                        <h2 className="text-2xl font-bold text-txt-primary mb-3 break-keep leading-tight">
                          {opportunity.title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-txt-tertiary">
                          {creator ? (
                            <span className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-black flex items-center justify-center text-[0.625rem] font-bold text-white">
                                {creator.nickname.charAt(0)}
                              </div>
                              <span className="font-medium text-txt-secondary">{creator.nickname}</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-surface-sunken flex items-center justify-center text-[0.625rem] font-bold text-txt-tertiary border border-border">?</div>
                              <span className="font-medium text-txt-secondary">익명</span>
                            </span>
                          )}
                          {opportunity.created_at && (
                            <span className="flex items-center gap-1.5 text-txt-disabled">
                              <Calendar size={13} />
                              {daysAgo === 0 ? '오늘' : `${daysAgo}일 전`}
                            </span>
                          )}
                          {opportunity.location_type && (
                            <span className="flex items-center gap-1.5 text-txt-disabled">
                              <MapPin size={13} />
                              {opportunity.location_type === 'remote' ? '원격' :
                               opportunity.location_type === 'offline' ? '오프라인' : '혼합'}
                            </span>
                          )}
                        </div>
                        {opportunity.interest_tags && opportunity.interest_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {opportunity.interest_tags.map((tag) => (
                              <span key={tag} className="px-2.5 py-1 bg-surface-sunken text-txt-tertiary text-xs border border-border">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-3">
                          <button
                            onClick={handleInterest}
                            disabled={isOwner || interestLoading}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs font-bold transition-all ${
                              hasInterested
                                ? 'border-red-300 bg-red-50 text-red-500'
                                : 'border-border-strong bg-surface-card text-txt-secondary hover:border-red-300 hover:text-red-500'
                            } disabled:opacity-40 disabled:cursor-default`}
                          >
                            <Heart size={12} className={hasInterested ? 'fill-current' : ''} />
                            {hasInterested ? '관심 표현됨' : '관심 있어요'}
                            <span className="text-txt-disabled font-mono">{(opportunity.interest_count ?? 0) + (hasInterested ? 1 : 0)}</span>
                          </button>
                          <span className="flex items-center gap-1 text-xs text-txt-disabled">
                            <Eye size={12} />
                            {opportunity.views_count ?? 0}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Divider */}
                    <div className="mx-4 sm:mx-8 border-t border-dashed border-border" />

                    {/* Body: 2-Column Layout */}
                    <div className="px-4 sm:px-8 py-4 sm:py-6">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-10">
                        {/* Left Column (3/5) */}
                        <div className="md:col-span-3 space-y-8">
                          {/* Description */}
                          <section>
                            <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3">
                              프로젝트 소개
                            </h3>
                            <p className="text-[0.9375rem] text-txt-secondary leading-[1.8] break-keep whitespace-pre-line">
                              {opportunity.description}
                            </p>
                          </section>

                          {/* Pain Point */}
                          {opportunity.pain_point && (
                            <section className="bg-surface-sunken border border-border-strong p-5">
                              <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-2">
                                해결하려는 문제
                              </h3>
                              <p className="text-sm text-txt-secondary leading-relaxed break-keep">
                                {opportunity.pain_point}
                              </p>
                            </section>
                          )}

                          {/* Weekly Updates Timeline */}
                          <section>
                            <div className="flex items-center justify-between mb-5">
                              <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest">
                                주간 업데이트
                              </h3>
                              {isOwner && (
                                <button
                                  onClick={() => setShowWriteUpdate(true)}
                                  className="text-xs text-txt-tertiary hover:text-txt-primary transition-colors font-medium"
                                >
                                  + 작성하기
                                </button>
                              )}
                            </div>

                            {updates.length > 0 ? (
                              <div className="relative pl-6">
                                <div className="absolute left-[0.4375rem] top-1 bottom-1 w-[2px] bg-border" />
                                <div className="space-y-5">
                                  {updates.map((update) => (
                                    <div key={update.id} className="relative">
                                      <div className={`absolute -left-6 top-1 w-4 h-4 border-[3px] border-surface-card ${updateTypeColors[update.update_type] || 'bg-txt-disabled'} shadow-sm`} />
                                      <div>
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-xs font-medium text-txt-tertiary">
                                            {updateTypeLabels[update.update_type] || update.update_type}
                                          </span>
                                          <span className="text-[0.625rem] font-mono text-txt-disabled">Week {update.week_number}</span>
                                        </div>
                                        <h4 className="font-semibold text-txt-primary text-sm mb-0.5">{update.title}</h4>
                                        <p className="text-xs text-txt-tertiary leading-relaxed break-keep">{update.content}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-6">
                                <Clock size={20} className="text-txt-disabled mx-auto mb-2" />
                                <p className="text-xs text-txt-disabled">아직 업데이트가 없습니다</p>
                                {isOwner && (
                                  <button
                                    onClick={() => setShowWriteUpdate(true)}
                                    className="mt-2 text-xs text-txt-tertiary hover:text-txt-primary transition-colors font-medium"
                                  >
                                    첫 번째 업데이트를 작성해보세요
                                  </button>
                                )}
                              </div>
                            )}
                          </section>

                          {/* Feedback Comments */}
                          <section>
                            <CommentSection
                              opportunityId={opportunity.id}
                              onLoginClick={handleSignup}
                            />
                          </section>
                        </div>

                        {/* Right Column (2/5) - Sidebar */}
                        <div className="md:col-span-2 space-y-7">
                          {/* Team */}
                          <div>
                            <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3">
                              팀 정보
                            </h3>
                            {creator ? (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-bold text-sm shrink-0">
                                  {creator.nickname.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-txt-primary text-sm">{creator.nickname}</p>
                                  <p className="text-xs text-txt-disabled truncate">
                                    {creator.desired_position || '메이커'}
                                    {creator.university && ` · ${creator.university}`}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-surface-sunken flex items-center justify-center font-bold text-sm text-txt-disabled border border-border">?</div>
                                <div>
                                  <p className="font-semibold text-txt-primary text-sm">익명 메이커</p>
                                  <p className="text-xs text-txt-disabled">프로필 비공개</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Needed Roles */}
                          {opportunity.needed_roles && opportunity.needed_roles.length > 0 && (
                            <div>
                              <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3">
                                모집 중인 포지션
                              </h3>
                              <div className="space-y-2">
                                {opportunity.needed_roles.map((role) => (
                                  <div key={role} className="flex items-center justify-between py-2.5 px-3 bg-surface-sunken border border-border-strong">
                                    <div className="flex items-center gap-2">
                                      <Briefcase size={14} className="text-txt-disabled" />
                                      <span className="text-sm text-txt-secondary">{role}</span>
                                    </div>
                                    {existingChat ? (
                                      <span className={`text-xs ${
                                        existingChat.status === 'pending' ? 'text-amber-500' :
                                        existingChat.status === 'accepted' ? 'text-green-600' : 'text-txt-disabled'
                                      }`}>
                                        {existingChat.status === 'pending' ? '대기 중' :
                                         existingChat.status === 'accepted' ? '수락됨' : '거절됨'}
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => handleAction(role)}
                                        className="text-xs text-txt-disabled hover:text-txt-secondary transition-colors"
                                      >
                                        커피챗 신청 &rarr;
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Needed Skills */}
                          {Array.isArray(opportunity.needed_skills) && opportunity.needed_skills.length > 0 && (
                            <div>
                              <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3">
                                필요 스킬
                              </h3>
                              <div className="flex flex-wrap gap-1.5">
                                {(opportunity.needed_skills as Array<{ name: string; level?: string }>).map((skill, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-surface-sunken border border-border text-xs text-txt-secondary"
                                  >
                                    <Code size={10} className="text-txt-disabled" />
                                    {skill.name}
                                    {skill.level && (
                                      <span className="text-[0.5rem] text-txt-disabled font-mono">
                                        {skill.level}
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Project Info */}
                          <div>
                            <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3">
                              프로젝트 정보
                            </h3>
                            <div className="space-y-2.5 text-sm">
                              {opportunity.time_commitment && (
                                <div className="flex items-center gap-2.5">
                                  <Clock size={14} className="text-txt-disabled shrink-0" />
                                  <span className="text-txt-tertiary">시간 투자</span>
                                  <span className="text-txt-primary font-medium">
                                    {opportunity.time_commitment === 'part_time' ? '파트타임' : '풀타임'}
                                  </span>
                                </div>
                              )}
                              {opportunity.location_type && (
                                <div className="flex items-center gap-2.5">
                                  <MapPin size={14} className="text-txt-disabled shrink-0" />
                                  <span className="text-txt-tertiary">활동 방식</span>
                                  <span className="text-txt-primary font-medium">
                                    {opportunity.location_type === 'remote' ? '원격' :
                                     opportunity.location_type === 'onsite' ? '오프라인' : '혼합'}
                                  </span>
                                </div>
                              )}
                              {opportunity.compensation_type && (
                                <div className="flex items-center gap-2.5">
                                  <Sparkles size={14} className="text-txt-disabled shrink-0" />
                                  <span className="text-txt-tertiary">보상</span>
                                  <span className="text-txt-primary font-medium">
                                    {opportunity.compensation_type === 'equity' ? '지분' :
                                     opportunity.compensation_type === 'salary' ? '유급' :
                                     opportunity.compensation_type === 'hybrid' ? '혼합' : '무급 (경험)'}
                                  </span>
                                </div>
                              )}
                              {opportunity.compensation_details && (
                                <div className="pl-6 text-xs text-txt-tertiary leading-relaxed break-keep">
                                  {opportunity.compensation_details}
                                </div>
                              )}
                              <div className="flex items-center gap-2.5">
                                <Eye size={14} className="text-txt-disabled shrink-0" />
                                <span className="text-txt-tertiary">조회</span>
                                <span className="text-txt-primary font-medium">{opportunity.views_count ?? 0}회</span>
                              </div>
                              <div className="flex items-center gap-2.5">
                                <Heart size={14} className="text-txt-disabled shrink-0" />
                                <span className="text-txt-tertiary">관심</span>
                                <span className="text-txt-primary font-medium">{(opportunity.interest_count ?? 0) + (hasInterested ? 1 : 0)}명</span>
                              </div>
                            </div>
                          </div>

                          {/* Project Links */}
                          {Array.isArray(opportunity.project_links) && opportunity.project_links.length > 0 && (
                            <div>
                              <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3">
                                프로젝트 링크
                              </h3>
                              <div className="space-y-2">
                                {(opportunity.project_links as Array<{ type: string; url: string; label?: string }>).map((link, i) => {
                                  const LinkIcon = linkIcons[link.type] || ExternalLink
                                  return (
                                    <a
                                      key={i}
                                      href={link.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2.5 py-2 px-3 bg-surface-sunken border border-border hover:border-border-strong transition-colors group"
                                    >
                                      <LinkIcon size={14} className="text-txt-disabled group-hover:text-txt-primary transition-colors shrink-0" />
                                      <span className="text-sm text-txt-secondary group-hover:text-txt-primary transition-colors truncate">
                                        {link.label || link.type}
                                      </span>
                                      <ExternalLink size={10} className="text-txt-disabled ml-auto shrink-0" />
                                    </a>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* Owner Edit Button */}
                          {isOwner && (
                            <button
                              onClick={() => { onClose(); router.push('/projects') }}
                              className="w-full py-2.5 border border-border-strong text-txt-secondary font-medium text-sm hover:bg-black hover:text-white transition-colors flex items-center justify-center gap-2"
                            >
                              <Edit3 size={14} />
                              프로젝트 수정하기
                            </button>
                          )}

                          {/* CTA Card */}
                          {!isOwner && (
                          <div className="bg-surface-inverse p-5 text-white border-2 border-black shadow-solid">
                            {existingChat ? (
                              <>
                                <h3 className="font-bold text-sm mb-1">
                                  {existingChat.status === 'pending' ? '커피챗 대기 중' :
                                   existingChat.status === 'accepted' ? '커피챗이 수락되었습니다!' : '커피챗이 거절되었습니다'}
                                </h3>
                                <p className="text-txt-inverse/50 text-xs mb-4 break-keep">
                                  {existingChat.status === 'pending' ? '메이커가 요청을 확인 중입니다.' :
                                   existingChat.status === 'accepted' ? '메이커의 연락처를 확인하세요.' :
                                   '다른 프로젝트를 탐색해보세요.'}
                                </p>
                                {existingChat.status === 'accepted' && existingChat.contact_info && (
                                  <div className="bg-white/10 p-3 text-sm text-white border border-white/20">
                                    연락처: {existingChat.contact_info}
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                <h3 className="font-bold text-sm mb-1">프로젝트에 참여하고 싶나요?</h3>
                                <p className="text-txt-inverse/50 text-xs mb-4 break-keep">
                                  커피챗으로 메이커와 직접 이야기해보세요.
                                </p>
                                <button
                                  onClick={() => handleAction()}
                                  className="w-full bg-white text-txt-primary py-2.5 font-bold text-sm hover:bg-surface-sunken transition-colors flex items-center justify-center gap-2 border-2 border-white"
                                >
                                  <Coffee size={14} />
                                  커피챗 신청하기
                                </button>
                              </>
                            )}
                          </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Coffee Chat Form Overlay (Authenticated) */}
                  <AnimatePresence>
                    {showCoffeeChatForm && opportunity && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto"
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          transition={{ delay: 0.1 }}
                          className="w-full max-w-sm sm:max-w-md bg-surface-card border-2 border-border-strong p-6 sm:p-8 shadow-brutal-xl"
                        >
                          <CoffeeChatRequestForm
                            opportunityId={opportunity.id}
                            onClose={() => { setShowCoffeeChatForm(false); setSelectedRole(undefined) }}
                            selectedRole={selectedRole}
                          />
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Write Update Modal (Owner) */}
                  {opportunity && (
                    <WriteUpdateForm
                      opportunityId={opportunity.id}
                      createdAt={opportunity.created_at}
                      isOpen={showWriteUpdate}
                      onClose={() => setShowWriteUpdate(false)}
                    />
                  )}

                  {/* Signup CTA Overlay (Non-authenticated) */}
                  <AnimatePresence>
                    {showCta && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center p-4 sm:p-8 text-center overflow-y-auto"
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          transition={{ delay: 0.1 }}
                          className="w-full max-w-sm sm:max-w-md bg-surface-card border-2 border-border-strong p-6 sm:p-8 shadow-brutal-xl"
                        >
                          <div className="w-14 h-14 bg-black flex items-center justify-center mb-6 mx-auto">
                            <span className="text-white font-black text-xl font-mono">D</span>
                          </div>
                          <h3 className="text-xl font-bold text-txt-primary mb-2">
                            이 프로젝트에 관심이 있으신가요?
                          </h3>
                          <p className="text-txt-tertiary mb-8 leading-relaxed break-keep max-w-sm text-sm mx-auto">
                            Draft에 가입하면 관심 표현, 커피챗 신청,
                            피드백 주고받기까지 모두 가능해요.
                          </p>
                          <button
                            onClick={handleSignup}
                            className="bg-black hover:bg-[#333] text-white px-8 py-3.5 font-bold text-sm flex items-center gap-2 transition-colors mx-auto mb-3 border-2 border-black shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                          >
                            무료로 시작하기
                            <ArrowRight size={16} />
                          </button>
                          <p className="text-[0.625rem] font-mono text-txt-disabled uppercase tracking-wider mb-6">
                            가입 30초 · 무료 · 바로 사용 가능
                          </p>
                          <button
                            onClick={() => setShowCta(false)}
                            className="text-sm text-txt-disabled hover:text-txt-secondary transition-colors"
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
