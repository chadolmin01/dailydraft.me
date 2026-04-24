'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  X, Share2, Heart,
  Loader2, AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/src/lib/supabase/client'
import { useDetailedPublicProfile } from '@/src/hooks/usePublicProfiles'
import { useAuth } from '@/src/context/AuthContext'
import { usePortfolioItems } from '@/src/hooks/usePortfolioItems'
import { type ProfileDetailModalProps } from './profile-modal/types'
import { ProfileHeader } from './profile-modal/ProfileHeader'
import { ProfileBodyLeft } from './profile-modal/ProfileBodyLeft'
import { ProfileBodyRight } from './profile-modal/ProfileBodyRight'
import { PortfolioView } from './profile-modal/PortfolioView'
import { useBackHandler } from '@/src/hooks/useBackHandler'
import { useProfileInterest } from '@/src/hooks/useProfileInterest'

export const ProfileDetailModal: React.FC<ProfileDetailModalProps> = ({ profileId, byUserId, matchData, onClose, onSelectProject, initialCoffeeChatOpen, initialCoffeeChatMessage }) => {
  const { isAuthenticated, user } = useAuth()
  const [isMobile, setIsMobile] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ startY: 0, dragging: false })
  const [shareCopied, setShareCopied] = useState(false)
  const [showCoffeeChatForm, setShowCoffeeChatForm] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [modalView, setModalView] = useState<'profile' | 'portfolio'>('profile')
  useBackHandler(!!profileId, onClose, 'profile-detail')
  useBackHandler(showCoffeeChatForm, () => setShowCoffeeChatForm(false), 'profile-coffee')
  // showInviteModal은 InviteToProjectModal 내부에서 자체 useBackHandler 등록

  const { data: profile, isLoading: loading } = useDetailedPublicProfile(
    profileId ?? undefined,
    byUserId ? { byUserId: true } : undefined
  )
  const profileUserId = profile?.user_id as string | undefined
  const { hasInterested, interestCount, interestLoading, handleInterest } = useProfileInterest(profile?.id, profileUserId)
  const { data: portfolioItems = [] } = usePortfolioItems(profileUserId)

  // Fetch this user's active projects
  const { data: userProjects = [] } = useQuery({
    queryKey: ['user_projects', profileUserId],
    queryFn: async () => {
      if (!profileUserId) return []
      const { data, error } = await supabase
        .from('opportunities')
        .select('id, title, type, status, interest_tags, needed_roles, applications_count, created_at')
        .eq('creator_id', profileUserId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(4)
      if (error) return []
      return data
    },
    enabled: !!profileUserId,
    staleTime: 1000 * 60 * 2,
  })

  useEffect(() => {
    setIsMobile(window.innerWidth < 640)
  }, [])

  useEffect(() => {
    if (profileId) setModalView('profile')
    // 의도적으로 body 스크롤 락 제거:
    //   - body position:fixed/overflow:hidden 둘 다 브라우저별로 스크롤 위치를
    //     리셋시키는 부작용이 있음 (특히 모바일)
    //   - 모달 자체가 fixed inset-0로 전체를 덮으므로 배경 스크롤 락 없어도
    //     시각적 문제 없음. 스크롤 이벤트 bubble은 허용하되 버그보단 낫다
  }, [profileId])

  useEffect(() => {
    if (profile?.id) {
      fetch(`/api/profile/${profile.id}/view`, { method: 'POST' }).catch(() => {})
    }
  }, [profile?.id])

  useEffect(() => {
    if (initialCoffeeChatOpen && profile && user && user.id !== profile.user_id) {
      setShowCoffeeChatForm(true)
    }
  }, [initialCoffeeChatOpen, profile, user])


  // ESC는 useBackHandler의 글로벌 핸들러가 처리

  const skills = profile?.skills as Array<{ name: string; level: string }> | null
  const personality = profile?.personality as Record<string, number> | null
  const coverUrl = profile?.cover_image_url
  const affiliationType = profile?.affiliation_type

  const bio = profile?.bio ?? null
  let visionSummary: string | null = null
  let visionParsed: Record<string, unknown> | null = null
  if (profile?.vision_summary) {
    try {
      visionParsed = JSON.parse(profile.vision_summary as string)
      visionSummary = (visionParsed?.summary as string) || null
    } catch {
      visionSummary = profile.vision_summary as string
    }
  }
  const displayBio = bio || visionSummary
  const visionGoals = Array.isArray(visionParsed?.goals) ? (visionParsed.goals as string[]) : []
  const workStyle = visionParsed?.work_style as Record<string, number> | undefined
  const visionTraits = visionParsed?.traits as Record<string, unknown> | undefined
  const teamPref = visionParsed?.team_preference as Record<string, string> | undefined
  const availability = visionParsed?.availability as { hours_per_week?: number; prefer_online?: boolean } | undefined

  const handleShare = async () => {
    const appUrl = window.location.origin
    const url = `${appUrl}/profile/${profile?.id ?? profileId}`
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

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-modal-backdrop"
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
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg md:max-w-3xl lg:max-w-6xl"
              role="dialog"
              aria-modal="true"
              aria-label={profile?.nickname || '프로필'}
            >
            {/* Main modal */}
            <div ref={sheetRef} className="bg-surface-card dark:bg-[#1C1C1E] rounded-2xl overflow-hidden flex flex-col relative max-h-[92vh] shadow-2xl w-full">
              {/* Mobile drag handle */}
              <div
                className="sm:hidden flex justify-center pt-2.5 pb-1 touch-none cursor-grab active:cursor-grabbing"
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
                <div className="w-9 h-1 rounded-full bg-[#E5E5EA] dark:bg-[#3A3A3C]" />
              </div>

              {/* Top Bar */}
              <div className="px-4 sm:px-5 h-12 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <button onClick={onClose} className="sm:hidden p-1.5 -ml-1 bg-[#F2F3F5] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C] rounded-full transition-colors" aria-label="닫기">
                    <X size={16} className="text-txt-tertiary" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Interest (like) button */}
                  {!loading && profile && user?.id !== profile.user_id && (
                    <button
                      onClick={handleInterest}
                      disabled={interestLoading}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold rounded-full transition-all ${
                        hasInterested
                          ? 'bg-[#FFF0F0] dark:bg-[#3A1C1C] text-[#FF3B30]'
                          : 'bg-[#F2F3F5] dark:bg-[#2C2C2E] text-txt-secondary hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C]'
                      }`}
                      aria-label="관심"
                    >
                      <Heart size={14} className={hasInterested ? 'fill-current' : ''} />
                      {interestCount > 0 && <span>{interestCount}</span>}
                    </button>
                  )}
                  <button
                    onClick={handleShare}
                    className="p-2 bg-[#F2F3F5] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C] rounded-full transition-colors"
                    aria-label="공유"
                  >
                    {shareCopied ? (
                      <span className="text-[11px] font-semibold text-[#34C759] px-1">복사됨!</span>
                    ) : (
                      <Share2 size={15} className="text-txt-secondary" />
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    className="hidden sm:flex p-2 bg-[#F2F3F5] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C] rounded-full transition-colors"
                    aria-label="닫기"
                  >
                    <X size={16} className="text-txt-secondary" />
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-[60vh]">
                  <div className="space-y-4 w-full max-w-sm px-8">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-[#F2F3F5] dark:bg-[#2C2C2E] rounded-full skeleton-shimmer" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-[#F2F3F5] dark:bg-[#2C2C2E] rounded-lg skeleton-shimmer w-24" />
                        <div className="h-3 bg-[#F2F3F5] dark:bg-[#2C2C2E] rounded-lg skeleton-shimmer w-32" />
                      </div>
                    </div>
                    <div className="h-3 bg-[#F2F3F5] dark:bg-[#2C2C2E] rounded-lg skeleton-shimmer w-full" />
                    <div className="h-3 bg-[#F2F3F5] dark:bg-[#2C2C2E] rounded-lg skeleton-shimmer w-3/4" />
                    <div className="h-3 bg-[#F2F3F5] dark:bg-[#2C2C2E] rounded-lg skeleton-shimmer w-1/2" />
                  </div>
                </div>
              ) : !profile ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center px-8">
                  <AlertCircle size={40} className="text-txt-disabled mb-4" />
                  <p className="font-bold text-txt-primary mb-1">프로필을 찾을 수 없습니다</p>
                  <p className="text-sm text-txt-tertiary">비공개이거나 존재하지 않는 프로필입니다.</p>
                </div>
              ) : modalView === 'portfolio' ? (
                <PortfolioView
                  profile={profile}
                  skills={skills}
                  onBack={() => setModalView('profile')}
                />
              ) : (
                <div className="overflow-y-auto flex-1 min-h-0">
                  <ProfileHeader
                    profile={profile}
                    coverUrl={coverUrl}
                    affiliationType={affiliationType}
                    matchData={matchData}
                  />

                  {/* 2-Column Grid Body */}
                  <div className="px-5 sm:px-8 pt-5 pb-10">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-10 items-start">
                      <ProfileBodyLeft
                        profile={profile}
                        displayBio={displayBio}
                        visionGoals={visionGoals}
                        skills={skills}
                        portfolioItems={portfolioItems}
                        userProjects={userProjects}
                        isAuthenticated={isAuthenticated}
                        user={user}
                        showCoffeeChatForm={showCoffeeChatForm}
                        setShowCoffeeChatForm={setShowCoffeeChatForm}
                        showInviteModal={showInviteModal}
                        setShowInviteModal={setShowInviteModal}
                        onClose={onClose}
                        onSelectProject={onSelectProject}
                        initialCoffeeChatMessage={initialCoffeeChatMessage}
                      />

                      <ProfileBodyRight
                        personality={personality}
                        workStyle={workStyle}
                        traits={visionTraits}
                        teamPref={teamPref}
                        availability={availability}
                        skills={skills}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            </div>
          </motion.div>
    </>
  )
}
