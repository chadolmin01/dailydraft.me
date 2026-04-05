'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { hapticMedium, hapticSuccess } from '@/src/utils/haptic'
import {
  Loader2, AlertCircle, X, Share2, Edit3, ChevronLeft, ChevronRight, Heart, Coffee,
} from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/src/lib/supabase/client'
import { useOpportunity, useUpdateOpportunity, useSimilarOpportunities, opportunityKeys } from '@/src/hooks/useOpportunities'
import { useProfileByUserId } from '@/src/hooks/usePublicProfiles'
import { useProjectUpdates } from '@/src/hooks/useProjectUpdates'
import { useAuth } from '@/src/context/AuthContext'
import { useCoffeeChats } from '@/src/hooks/useCoffeeChats'
import { useInterests } from '@/src/hooks/useInterests'
import { ProjectHeader } from '@/components/project/ProjectHeader'
import { ProjectContent } from '@/components/project/ProjectContent'
import { ProjectSidebar } from '@/components/project/ProjectSidebar'
import { ProjectOverlays } from '@/components/project/ProjectOverlays'
import { useBackHandler } from '@/src/hooks/useBackHandler'

interface ProjectDetailModalProps {
  projectId: string | null
  onClose: () => void
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ projectId, onClose }) => {
  if (!projectId) return null
  const router = useRouter()
  const queryClient = useQueryClient()

  // Navigation history — enables ← → between similar projects
  const [navHistory, setNavHistory] = useState<string[]>([projectId])
  const [navIndex, setNavIndex] = useState(0)
  const currentId = navHistory[navIndex]

  // Reset navigation when modal opens with a new projectId
  useEffect(() => {
    setNavHistory([projectId])
    setNavIndex(0)
  }, [projectId])

  const [showCta, setShowCta] = useState(false)
  const [showCoffeeChatForm, setShowCoffeeChatForm] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string | undefined>(undefined)
  const [shareCopied, setShareCopied] = useState(false)
  const [showWriteUpdate, setShowWriteUpdate] = useState(false)
  const [hasInterested, setHasInterested] = useState(false)
  const [showTypeSelector, setShowTypeSelector] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ startY: 0, dragging: false })
  const { user } = useAuth()
  const updateOpportunity = useUpdateOpportunity()
  const { expressInterest, loading: interestLoading } = useInterests({ opportunityId: currentId ?? '' })
  const { data: myChatsForProject = [] } = useCoffeeChats({
    opportunityId: currentId ?? undefined,
    enabled: !!currentId,
  })

  useBackHandler(!!projectId, onClose, 'project-detail')
  useBackHandler(showCoffeeChatForm, () => setShowCoffeeChatForm(false), 'coffee-chat')
  useBackHandler(showWriteUpdate, () => setShowWriteUpdate(false), 'write-update')
  useBackHandler(showCta, () => setShowCta(false), 'project-cta')

  const { data: opportunity, isLoading: loading } = useOpportunity(currentId ?? undefined)
  const { data: creator } = useProfileByUserId(opportunity?.creator_id ?? undefined)
  const { data: updates = [] } = useProjectUpdates(opportunity?.id)

  // Prefetch similar projects — starts immediately when modal opens
  const { data: similar = [], isLoading: similarLoading } = useSimilarOpportunities(currentId)

  useEffect(() => {
    similar.forEach(proj => {
      queryClient.prefetchQuery({
        queryKey: opportunityKeys.detail(proj.id),
        queryFn: async () => {
          const { data, error } = await supabase.from('opportunities').select('*').eq('id', proj.id).single()
          if (error) throw error
          return data
        },
        staleTime: 1000 * 60 * 2,
      })
    })
  }, [similar, queryClient])

  const canGoBack = navIndex > 0
  const nextSimilar = similar[0]
  const canGoForward = !similarLoading && !!nextSimilar

  const goNext = () => {
    if (!nextSimilar) return
    hapticMedium()
    setNavHistory(prev => [...prev.slice(0, navIndex + 1), nextSimilar.id])
    setNavIndex(prev => prev + 1)
  }

  const goBack = () => {
    if (navIndex === 0) return
    hapticMedium()
    setNavIndex(prev => prev - 1)
  }

  // Fetch team members (accepted connections)
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-public', currentId],
    queryFn: async () => {
      if (!currentId) return []
      const { data: connections } = await supabase
        .from('accepted_connections')
        .select('id, applicant_id, assigned_role, status')
        .eq('opportunity_id', currentId)
        .eq('status', 'active')
      if (!connections || connections.length === 0) return []
      const userIds = connections.map(c => c.applicant_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, nickname, desired_position')
        .in('user_id', userIds)
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]))
      return connections.map(c => ({
        id: c.id,
        nickname: profileMap.get(c.applicant_id)?.nickname || '알 수 없음',
        role: c.assigned_role || profileMap.get(c.applicant_id)?.desired_position || null,
      }))
    },
    enabled: !!currentId,
    staleTime: 1000 * 60 * 2,
  })

  // Match analysis — API not yet implemented, placeholder for future
  const matchScore: number | null = null

  const isOwner = !!(user && opportunity && user.id === opportunity.creator_id)
  const existingChat = myChatsForProject.length > 0 ? myChatsForProject[0] : null

  useEffect(() => {
    setShowCta(false)
    setShowCoffeeChatForm(false)
    setHasInterested(false)
    setShowTypeSelector(false)
  }, [currentId])

  // 조회수 트래킹
  useEffect(() => {
    if (currentId) {
      fetch(`/api/opportunities/${currentId}/view`, { method: 'POST' }).catch(() => {})
    }
  }, [currentId])

  useEffect(() => {
    setIsMobile(window.innerWidth < 640)
  }, [])

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
    hapticMedium()
    if (!user) {
      setShowCta(true)
      return
    }
    if (isOwner) { toast.error('내 프로젝트에는 관심 표시를 할 수 없어요'); return }
    if (hasInterested) { toast('이미 관심을 표시했어요'); return }
    if (interestLoading) return
    const success = await expressInterest(user.email ?? '')
    if (success) {
      setHasInterested(true)
      toast.success('관심을 표시했어요')
    } else {
      toast.error('관심 표시에 실패했어요')
    }
  }

  const handleSignup = () => {
    setShowCta(false)
    onClose()
    router.push('/login')
  }

  const handleShare = async () => {
    const appUrl = window.location.origin
    const url = `${appUrl}/p/${currentId}`
    const shareData = {
      title: opportunity?.title || 'Draft 프로젝트',
      text: opportunity?.needed_roles?.length
        ? `${opportunity.title} — ${opportunity.needed_roles.slice(0, 2).join(', ')} 모집 중`
        : opportunity?.title || 'Draft에서 프로젝트를 확인해보세요',
      url,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
        return
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
      }
    }

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
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-modal-backdrop"
      />

      {/* Modal */}
      <motion.div
        initial={isMobile ? { opacity: 1, y: '100%' } : { opacity: 0, scale: 0.95, y: 20 }}
        animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1, y: 0 }}
        exit={isMobile ? { opacity: 1, y: '100%' } : { opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-modal flex items-end sm:items-center justify-center px-0 pb-[env(safe-area-inset-bottom)] sm:p-4 md:p-8"
        onClick={onClose}
      >
            {/* Left nav button */}
            {canGoBack && (
              <button
                onClick={(e) => { e.stopPropagation(); goBack() }}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface-card/90 backdrop-blur-sm border border-border shadow-lg hidden sm:flex items-center justify-center hover:bg-surface-card active:scale-95 transition-all"
                aria-label="이전 프로젝트"
              >
                <ChevronLeft size={20} className="text-txt-primary" />
              </button>
            )}

            {/* Right nav button */}
            {(canGoForward || similarLoading) && (
              <button
                onClick={(e) => { e.stopPropagation(); goNext() }}
                disabled={!canGoForward}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface-card/90 backdrop-blur-sm border border-border shadow-lg hidden sm:flex items-center justify-center hover:bg-surface-card active:scale-95 transition-all disabled:opacity-40"
                aria-label="다음 유사 프로젝트"
                title={nextSimilar ? nextSimilar.title : undefined}
              >
                {similarLoading ? (
                  <Loader2 size={16} className="text-txt-disabled animate-spin" />
                ) : (
                  <ChevronRight size={20} className="text-txt-primary" />
                )}
              </button>
            )}

            <div
              ref={sheetRef}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg md:max-w-3xl lg:max-w-6xl max-h-[92vh] modal-glass rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col relative"
              role="dialog"
              aria-modal="true"
              aria-label={opportunity?.title || '프로젝트 상세'}
            >
              {/* Mobile drag handle */}
              <div
                className="sm:hidden flex justify-center pt-2 pb-0.5 touch-none cursor-grab active:cursor-grabbing"
                onTouchStart={(e) => {
                  dragRef.current.startY = e.touches[0].clientY
                  dragRef.current.dragging = true
                }}
                onTouchMove={(e) => {
                  if (!dragRef.current.dragging || !sheetRef.current) return
                  const diff = e.touches[0].clientY - dragRef.current.startY
                  if (diff > 0) {
                    sheetRef.current.style.transform = `translateY(${diff}px)`
                    sheetRef.current.style.transition = 'none'
                  }
                }}
                onTouchEnd={(e) => {
                  if (!dragRef.current.dragging || !sheetRef.current) return
                  dragRef.current.dragging = false
                  const diff = e.changedTouches[0].clientY - dragRef.current.startY
                  if (diff > 80) {
                    sheetRef.current.style.transition = 'transform 0.2s ease-out'
                    sheetRef.current.style.transform = 'translateY(100%)'
                    setTimeout(onClose, 200)
                  } else {
                    sheetRef.current.style.transition = 'transform 0.2s ease-out'
                    sheetRef.current.style.transform = 'translateY(0)'
                  }
                }}
              >
                <div className="w-9 h-1 rounded-full bg-border/60" />
              </div>
              {/* Top Bar */}
              <div className="modal-bar border-b border-border/40 px-4 sm:px-5 h-11 flex items-center justify-between shrink-0">
                {/* Left: close (mobile) + badges */}
                <div className="flex items-center gap-2">
                  <button onClick={onClose} className="sm:hidden p-1 -ml-1 hover:bg-surface-sunken rounded-full transition-colors" aria-label="닫기">
                    <X size={18} className="text-txt-tertiary" />
                  </button>
                  {!loading && opportunity && (
                    <>
                      {isOwner ? (
                        <div className="relative">
                          <button
                            onClick={() => setShowTypeSelector(!showTypeSelector)}
                            className="text-[11px] font-bold px-2.5 py-1 bg-surface-sunken text-txt-secondary rounded-full border border-border hover:border-txt-primary transition-colors flex items-center gap-1"
                          >
                            {opportunity.type === 'side_project' ? '함께 만들기' :
                             opportunity.type === 'startup' ? '창업 준비' :
                             opportunity.type === 'study' ? '함께 배우기' : 'PROJECT'}
                            <Edit3 size={9} />
                          </button>
                          {showTypeSelector && (
                            <div className="absolute top-full left-0 mt-1 bg-surface-card rounded-xl border border-border shadow-md z-10 min-w-[8rem] overflow-hidden">
                              {[
                                { value: 'side_project', label: '함께 만들기' },
                                { value: 'startup', label: '창업 준비' },
                                { value: 'study', label: '함께 배우기' },
                              ].map((opt) => (
                                <button
                                  key={opt.value}
                                  onClick={() => {
                                    updateOpportunity.mutate(
                                      { id: opportunity.id, updates: { type: opt.value as 'side_project' | 'startup' | 'study' } },
                                      { onSuccess: () => toast.success('프로젝트 유형이 변경되었습니다'), onError: () => toast.error('변경에 실패했어요') },
                                    )
                                    setShowTypeSelector(false)
                                  }}
                                  className={`w-full text-left px-3 py-2 text-[11px] font-medium transition-colors ${
                                    opportunity.type === opt.value
                                      ? 'bg-surface-inverse text-txt-inverse'
                                      : 'text-txt-secondary hover:bg-surface-sunken'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] font-bold px-2.5 py-1 bg-surface-sunken text-txt-tertiary rounded-full border border-border">
                          {opportunity.type === 'side_project' ? '함께 만들기' :
                           opportunity.type === 'startup' ? '창업 준비' :
                           opportunity.type === 'study' ? '함께 배우기' : opportunity.type?.toUpperCase() || 'PROJECT'}
                        </span>
                      )}
                      {opportunity.status === 'active' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-status-success-bg text-status-success-text text-[11px] font-bold rounded-full border border-status-success-text/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-indicator-online animate-pulse" />
                          모집 중
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Right: share + close */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleShare}
                    className="p-2 hover:bg-surface-sunken rounded-full transition-colors"
                    aria-label="공유"
                  >
                    {shareCopied ? (
                      <span className="text-[11px] font-bold text-status-success-text icon-bounce">복사됨!</span>
                    ) : (
                      <Share2 size={15} className="text-txt-disabled" />
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    className="hidden sm:flex p-2 hover:bg-surface-sunken rounded-full transition-colors"
                    aria-label="닫기"
                  >
                    <X size={18} className="text-txt-disabled" />
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-[60vh]">
                  <div className="space-y-4 w-full max-w-md px-8">
                    <div className="h-5 bg-surface-sunken rounded skeleton-shimmer w-3/4" />
                    <div className="h-3 bg-surface-sunken rounded skeleton-shimmer w-full" />
                    <div className="h-3 bg-surface-sunken rounded skeleton-shimmer w-2/3" />
                    <div className="flex gap-2 mt-4">
                      <div className="h-6 w-16 bg-surface-sunken rounded skeleton-shimmer" />
                      <div className="h-6 w-16 bg-surface-sunken rounded skeleton-shimmer" />
                    </div>
                    <div className="h-20 bg-surface-sunken rounded skeleton-shimmer w-full mt-2" />
                  </div>
                </div>
              ) : !opportunity ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center px-8">
                  <AlertCircle size={40} className="text-txt-disabled mb-4" />
                  <p className="font-bold text-txt-primary mb-1">프로젝트를 찾을 수 없습니다</p>
                  <p className="text-sm text-txt-tertiary">삭제되었거나 존재하지 않는 프로젝트입니다.</p>
                </div>
              ) : (
                <>
                  <div
                    className="overflow-y-auto flex-1 min-h-0"
                    onTouchStart={(e) => {
                      const touch = e.touches[0]
                      ;(e.currentTarget as HTMLElement).dataset.touchStartX = String(touch.clientX)
                      ;(e.currentTarget as HTMLElement).dataset.touchStartY = String(touch.clientY)
                    }}
                    onTouchEnd={(e) => {
                      const startX = Number((e.currentTarget as HTMLElement).dataset.touchStartX)
                      const startY = Number((e.currentTarget as HTMLElement).dataset.touchStartY)
                      const endX = e.changedTouches[0].clientX
                      const endY = e.changedTouches[0].clientY
                      const diffX = startX - endX
                      const diffY = startY - endY
                      if (Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY) * 2) {
                        if (diffX > 0 && canGoForward) goNext()
                        else if (diffX < 0 && canGoBack) goBack()
                      }
                    }}
                  >
                    <ProjectHeader
                      opportunity={opportunity}
                      creator={creator}
                      isOwner={isOwner}
                      matchScore={matchScore}
                      daysAgo={daysAgo}
                      hasInterested={hasInterested}
                      interestLoading={interestLoading}
                      handleInterest={handleInterest}
                    />

                    <div className="border-t border-border" />

                    {/* Body: 2-col (desktop) / single col (mobile) */}
                    <div className="px-4 sm:px-6 py-5 grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-8 items-start">

                      {/* Left: tabbed content */}
                      <div className="md:col-span-3">
                        <ProjectContent
                          opportunity={opportunity}
                          updates={updates}
                          isOwner={isOwner}
                          setShowWriteUpdate={setShowWriteUpdate}
                          handleSignup={handleSignup}
                          updateOpportunity={updateOpportunity}
                        />
                      </div>

                      {/* Right: sticky sidebar — desktop only */}
                      <div className="hidden md:flex md:flex-col md:col-span-2 sticky top-0 self-start h-[calc(90vh-5rem)]">
                        <ProjectSidebar
                          opportunity={opportunity}
                          creator={creator}
                          isOwner={isOwner}
                          existingChat={existingChat}
                          hasInterested={hasInterested}
                          handleAction={handleAction}
                          onClose={onClose}
                          router={router}
                          teamMembers={teamMembers}
                        />
                      </div>
                    </div>

                    {/* Mobile: sidebar info inline (no CTA — CTA is in sticky bar below) */}
                    <div className="md:hidden px-4 pb-6 border-t border-border pt-5">
                      <ProjectSidebar
                        opportunity={opportunity}
                        creator={creator}
                        isOwner={isOwner}
                        existingChat={existingChat}
                        hasInterested={hasInterested}
                        handleAction={handleAction}
                        onClose={onClose}
                        router={router}
                        teamMembers={teamMembers}
                        hideCta
                      />
                    </div>
                  </div>

                  {/* Mobile sticky bottom CTA */}
                  <div className="md:hidden shrink-0 px-4 py-3 border-t border-border bg-surface-card">
                    {isOwner ? (
                      <button
                        onClick={() => { onClose(); router.push(`/projects/${opportunity.id}/edit`) }}
                        className="w-full py-3.5 border border-border rounded-full font-black text-[14px] text-txt-secondary hover:bg-surface-inverse hover:text-txt-inverse hover:border-surface-inverse transition-all flex items-center justify-center gap-2"
                      >
                        <Edit3 size={15} />
                        프로젝트 수정하기
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={handleInterest}
                          disabled={interestLoading}
                          className={`shrink-0 w-12 h-12 flex items-center justify-center rounded-full border transition-all disabled:opacity-40 ${
                            hasInterested
                              ? 'bg-status-danger-bg border-status-danger-text/20 text-status-danger-text'
                              : 'border-border text-txt-secondary hover:border-txt-primary'
                          }`}
                        >
                          <Heart size={18} className={hasInterested ? 'fill-current' : ''} />
                        </button>
                        <button
                          onClick={() => handleAction()}
                          className="flex-1 py-3.5 bg-surface-inverse text-txt-inverse rounded-full font-black text-[14px] hover:opacity-90 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
                        >
                          <Coffee size={16} />
                          커피챗 신청하기
                        </button>
                      </div>
                    )}
                  </div>

                  <ProjectOverlays
                    opportunity={opportunity}
                    showCoffeeChatForm={showCoffeeChatForm}
                    setShowCoffeeChatForm={setShowCoffeeChatForm}
                    selectedRole={selectedRole}
                    setSelectedRole={setSelectedRole}
                    showWriteUpdate={showWriteUpdate}
                    setShowWriteUpdate={setShowWriteUpdate}
                    showCta={showCta}
                    setShowCta={setShowCta}
                    handleSignup={handleSignup}
                  />
                </>
              )}
            </div>
          </motion.div>
    </>
  )
}
