'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { hapticMedium } from '@/src/utils/haptic'
import {
  X, Briefcase, Share2, Heart,
  Loader2, AlertCircle, ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/src/lib/supabase/client'
import { useDetailedPublicProfile } from '@/src/hooks/usePublicProfiles'
import { useAuth } from '@/src/context/AuthContext'
import { usePortfolioItems } from '@/src/hooks/usePortfolioItems'
import { SITUATION_LABELS, type ProfileDetailModalProps } from './profile-modal/types'
import { ProfileHeader } from './profile-modal/ProfileHeader'
import { ProfileBodyLeft } from './profile-modal/ProfileBodyLeft'
import { ProfileBodyRight } from './profile-modal/ProfileBodyRight'
import { ProfileSidePanel } from './profile-modal/ProfileSidePanel'
import { PortfolioView } from './profile-modal/PortfolioView'
import { useBackHandler } from '@/src/hooks/useBackHandler'

export const ProfileDetailModal: React.FC<ProfileDetailModalProps> = ({ profileId, byUserId, matchData, onClose, onSelectProject }) => {
  const { isAuthenticated, user } = useAuth()
  const [shareCopied, setShareCopied] = useState(false)
  const [showCoffeeChatForm, setShowCoffeeChatForm] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [modalView, setModalView] = useState<'profile' | 'portfolio'>('profile')
  const [sidePanel, setSidePanel] = useState<null | 'projects' | 'portfolio'>(null)
  const [hasInterested, setHasInterested] = useState(false)
  const [interestCount, setInterestCount] = useState(0)
  const [interestLoading, setInterestLoading] = useState(false)
  useBackHandler(showCoffeeChatForm, () => setShowCoffeeChatForm(false), 'profile-coffee')
  useBackHandler(showInviteModal, () => setShowInviteModal(false), 'profile-invite')
  useBackHandler(!!sidePanel, () => setSidePanel(null), 'profile-side')

  const { data: profile, isLoading: loading } = useDetailedPublicProfile(
    profileId ?? undefined,
    byUserId ? { byUserId: true } : undefined
  )
  const profileUserId = profile?.user_id as string | undefined
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
    if (profileId) {
      document.body.style.overflow = 'hidden'
      setModalView('profile')
      setSidePanel(null)
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [profileId])

  useEffect(() => {
    if (profile?.id) {
      fetch(`/api/profile/${profile.id}/view`, { method: 'POST' }).catch(() => {})
    }
  }, [profile?.id])

  useEffect(() => {
    if (profile?.id && user) {
      fetch(`/api/profile/${profile.id}/interest`)
        .then(r => r.json())
        .then(d => {
          setHasInterested(!!d.interested)
          setInterestCount(d.interest_count ?? 0)
        })
        .catch(() => {})
    } else {
      setHasInterested(false)
      setInterestCount(0)
    }
  }, [profile?.id, user])

  const handleInterest = async () => {
    hapticMedium()
    if (!user) return
    if (user.id === profile?.user_id) { toast.error('내 프로필에는 관심 표시를 할 수 없어요'); return }
    if (!profile?.id || interestLoading) return
    setInterestLoading(true)
    try {
      const res = await fetch(`/api/profile/${profile.id}/interest`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setHasInterested(data.interested)
        setInterestCount(data.interest_count ?? 0)
        toast.success(data.interested ? '관심을 표시했어요' : '관심 표시를 취소했어요')
      } else {
        toast.error('관심 표시에 실패했어요')
      }
    } catch {
      toast.error('네트워크 오류가 발생했어요')
    }
    setInterestLoading(false)
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const skills = profile?.skills as Array<{ name: string; level: string }> | null
  const personality = profile?.personality as Record<string, number> | null
  const coverUrl = profile?.cover_image_url
  const affiliationType = profile?.affiliation_type

  const bio = (profile as Record<string, unknown> | null)?.bio as string | null
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
    <AnimatePresence>
      {profileId && (
        <>
          {/* Backdrop */}
          <motion.div
            key="profile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-modal-backdrop"
          />

          {/* Modal */}
          <motion.div
            key="profile-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-modal flex items-end sm:items-center justify-center pt-6 px-0 pb-[env(safe-area-inset-bottom)] sm:p-4 md:p-8"
            onClick={onClose}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`flex flex-col sm:flex-row gap-0 sm:gap-4 max-h-[85vh] sm:max-h-[90vh] transition-all duration-300 ${sidePanel ? 'w-full max-w-[90rem]' : 'w-full max-w-lg md:max-w-2xl lg:max-w-3xl'}`}
              role="dialog"
              aria-modal="true"
              aria-label={profile?.nickname || '프로필'}
            >
            {/* Main modal */}
            <div className={`bg-surface-card shadow-lg-xl border border-border overflow-hidden flex flex-col relative transition-all duration-300 ${sidePanel ? 'w-full sm:w-3/5' : 'w-full'}`}>
              {/* macOS-style Window Bar */}
              <div className="bg-surface-sunken border-b border-border px-3 sm:px-4 h-10 flex items-center justify-between shrink-0">
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

                {/* Center: status badges */}
                {!loading && profile && (
                  <div className="flex items-center gap-2">
                    {profile.current_situation && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-status-success-bg text-status-success-text text-[0.625rem] font-bold border border-status-success-text/30">
                        <Briefcase size={10} />
                        {SITUATION_LABELS[profile.current_situation] || profile.current_situation}
                      </span>
                    )}
                    {profile.is_uni_verified && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-indicator-online text-white text-[0.5rem] font-bold uppercase tracking-wider">
                        <ShieldCheck size={10} /> 인증
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-1">
                  {/* Interest (like) button */}
                  {!loading && profile && user?.id !== profile.user_id && (
                    <button
                      onClick={handleInterest}
                      disabled={interestLoading}
                      className={`flex items-center gap-1 px-2 py-1 text-[0.625rem] font-mono font-bold transition-colors border ${
                        hasInterested
                          ? 'bg-status-danger-bg text-status-danger-text border-status-danger-text/20'
                          : 'text-txt-disabled border-transparent hover:bg-surface-sunken hover:border-border hover:text-status-danger-text'
                      }`}
                      aria-label="관심"
                    >
                      <Heart size={12} className={hasInterested ? 'fill-current' : ''} />
                      {interestCount > 0 && <span>{interestCount}</span>}
                    </button>
                  )}
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
                <div className="flex-1 overflow-y-auto">
                  <ProfileHeader
                    profile={profile}
                    coverUrl={coverUrl}
                    affiliationType={affiliationType}
                    matchData={matchData}
                  />

                  {/* 2-Column Grid Body */}
                  <div className="px-4 sm:px-8 py-5">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-10">
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
                        setSidePanel={setSidePanel}
                        onClose={onClose}
                        onSelectProject={onSelectProject}
                      />

                      <ProfileBodyRight
                        personality={personality}
                        workStyle={workStyle}
                        teamPref={teamPref}
                        availability={availability}
                        skills={skills}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Side Panel */}
            {sidePanel && (
              <ProfileSidePanel
                sidePanel={sidePanel}
                userProjects={userProjects}
                portfolioItems={portfolioItems}
                setSidePanel={setSidePanel}
                onClose={onClose}
                onSelectProject={onSelectProject}
              />
            )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
