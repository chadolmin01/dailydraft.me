'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { hapticMedium, hapticSuccess } from '@/src/utils/haptic'
import {
  Loader2, AlertCircle, X, Share2, Edit3, ChevronLeft, ChevronRight,
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
  const { user } = useAuth()
  const updateOpportunity = useUpdateOpportunity()
  const { expressInterest, loading: interestLoading } = useInterests({ opportunityId: currentId ?? '' })
  const { data: myChatsForProject = [] } = useCoffeeChats({
    opportunityId: currentId ?? undefined,
    enabled: !!currentId,
  })

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
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-modal-backdrop"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-modal flex items-end sm:items-center justify-center pt-6 px-0 pb-[env(safe-area-inset-bottom)] sm:p-4 md:p-8"
        onClick={onClose}
      >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg md:max-w-2xl lg:max-w-4xl max-h-[85vh] sm:max-h-[90vh] modal-glass rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col relative"
              role="dialog"
              aria-modal="true"
              aria-label={opportunity?.title || '프로젝트 상세'}
            >
              {/* Mobile drag handle */}
              <div className="sm:hidden flex justify-center pt-2 pb-0.5">
                <div className="w-9 h-1 rounded-full bg-border/60" />
              </div>
              {/* Window Bar */}
              <div className="modal-bar border-b border-border/40 px-3 sm:px-4 h-10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <button onClick={onClose} className="sm:hidden p-1.5 -ml-1 hover:bg-surface-card transition-colors" aria-label="닫기">
                    <X size={18} className="text-txt-tertiary" />
                  </button>
                  <button onClick={onClose} className="group hidden sm:flex w-3 h-3 rounded-full bg-[#FF5F57] hover:brightness-90 transition-all items-center justify-center" aria-label="닫기">
                    <X size={7} className="text-[#FF5F57] group-hover:text-[#4A0002] transition-colors" />
                  </button>
                  <div className="hidden sm:block w-3 h-3 rounded-full bg-[#FEBC2E]" />
                  <div className="hidden sm:block w-3 h-3 rounded-full bg-[#28C840]" />
                </div>
                {!loading && opportunity && (
                  <div className="flex items-center gap-2">
                    {isOwner ? (
                      <div className="relative">
                        <button
                          onClick={() => setShowTypeSelector(!showTypeSelector)}
                          className="text-[0.625rem] font-medium px-2 py-0.5 bg-surface-card text-txt-tertiary border border-border hover:border-border hover:text-txt-secondary transition-colors flex items-center gap-1"
                        >
                          {opportunity.type === 'side_project' ? 'SIDE PROJECT' :
                           opportunity.type === 'startup' ? 'STARTUP' :
                           opportunity.type === 'study' ? 'STUDY' : 'PROJECT'}
                          <Edit3 size={8} />
                        </button>
                        {showTypeSelector && (
                          <div className="absolute top-full left-0 mt-1 bg-surface-card rounded-xl border border-border shadow-md z-10 min-w-[8rem]">
                            {[
                              { value: 'side_project', label: 'SIDE PROJECT' },
                              { value: 'startup', label: 'STARTUP' },
                              { value: 'study', label: 'STUDY' },
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
                                className={`w-full text-left px-3 py-1.5 text-[0.625rem] font-medium transition-colors ${
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
                      <span className="text-[0.625rem] font-medium px-2 py-0.5 bg-surface-card text-txt-tertiary border border-border">
                        {opportunity.type === 'side_project' ? 'SIDE PROJECT' :
                         opportunity.type === 'startup' ? 'STARTUP' :
                         opportunity.type === 'study' ? 'STUDY' : opportunity.type?.toUpperCase() || 'PROJECT'}
                      </span>
                    )}
                    {opportunity.status === 'active' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-status-success-bg text-status-success-text text-[0.625rem] font-bold border border-status-success-text/30">
                        <span className="w-1.5 h-1.5 bg-indicator-online animate-pulse" />
                        모집 중
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  {/* Similar project navigation — desktop only (mobile uses swipe) */}
                  <button
                    onClick={goBack}
                    disabled={!canGoBack}
                    className="hidden sm:block p-2 hover:bg-surface-sunken transition-colors border border-transparent hover:border-border disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="이전 프로젝트"
                  >
                    <ChevronLeft size={16} className="text-txt-disabled" />
                  </button>
                  <button
                    onClick={goNext}
                    disabled={!canGoForward}
                    className="hidden sm:block p-2 hover:bg-surface-sunken transition-colors border border-transparent hover:border-border disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="다음 유사 프로젝트"
                    title={nextSimilar ? `다음: ${nextSimilar.title}` : undefined}
                  >
                    {similarLoading ? (
                      <Loader2 size={14} className="text-txt-disabled animate-spin" />
                    ) : (
                      <ChevronRight size={16} className={canGoForward ? 'text-txt-secondary' : 'text-txt-disabled'} />
                    )}
                  </button>
                  <div className="hidden sm:block w-px h-4 bg-border mx-1" />
                  <button
                    onClick={handleShare}
                    className="p-2 hover:bg-surface-sunken transition-colors border border-transparent hover:border-border"
                    aria-label="공유"
                  >
                    {shareCopied ? (
                      <span className="text-[0.625rem] font-medium text-status-success-text px-1 icon-bounce">복사됨!</span>
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
                  {/* Scrollable Content — swipe left/right to navigate similar projects */}
                  <div
                    className="flex-1 overflow-y-auto"
                    onTouchStart={(e) => {
                      const touch = e.touches[0]
                      ;(e.currentTarget as HTMLElement).dataset.touchStartX = String(touch.clientX)
                    }}
                    onTouchEnd={(e) => {
                      const startX = Number((e.currentTarget as HTMLElement).dataset.touchStartX)
                      const endX = e.changedTouches[0].clientX
                      const diff = startX - endX
                      if (Math.abs(diff) > 60) {
                        if (diff > 0 && canGoForward) goNext()
                        else if (diff < 0 && canGoBack) goBack()
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

                    {/* Divider */}
                    <div className="mx-4 sm:mx-8 border-t border-border" />

                    {/* Body: 2-Column Layout */}
                    <div className="px-4 sm:px-8 py-4 sm:py-6">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-10">
                        <ProjectContent
                          opportunity={opportunity}
                          updates={updates}
                          isOwner={isOwner}
                          setShowWriteUpdate={setShowWriteUpdate}
                          handleSignup={handleSignup}
                          updateOpportunity={updateOpportunity}
                        />

                        {/* Right Column (2/5) - Sidebar */}
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
