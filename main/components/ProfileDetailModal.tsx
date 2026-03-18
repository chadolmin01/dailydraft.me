'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  X, MapPin, Briefcase, Building2, Share2, Heart,
  Loader2, AlertCircle, Mail, Coffee, Code2,
  Globe, Github, Linkedin, ShieldCheck, Send, Clock, Users, UserPlus,
  ArrowLeft, ExternalLink, FileText, Rocket, ChevronRight, Target,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/src/lib/supabase/client'
import { useDetailedPublicProfile } from '@/src/hooks/usePublicProfiles'
import { useAuth } from '@/src/context/AuthContext'
import { useCoffeeChats } from '@/src/hooks/useCoffeeChats'
import { usePortfolioItems } from '@/src/hooks/usePortfolioItems'
import { CoffeeChatRequestForm } from './CoffeeChatRequestForm'
import { InviteToProjectModal } from './InviteToProjectModal'

interface MatchData {
  match_score: number
  match_reason: string
  match_details: {
    vision: number
    skill: number
    founder: number
    interest: number
    situation: number
  }
}

interface ProfileDetailModalProps {
  profileId: string | null
  byUserId?: boolean
  matchData?: MatchData | null
  onClose: () => void
  onSelectProject?: (projectId: string) => void
}

const SITUATION_LABELS: Record<string, string> = {
  has_project: '프로젝트 진행 중',
  want_to_join: '팀 합류 희망',
  solo: '함께 시작할 팀원 탐색 중',
  exploring: '탐색 중',
}

const AFFILIATION_LABELS: Record<string, string> = {
  student: '대학생',
  graduate: '졸업생',
  professional: '현직자',
  freelancer: '프리랜서',
  other: '기타',
}

const TRAIT_COLORS: Record<string, { bar: string; dot: string; text: string }> = {
  risk:          { bar: 'bg-rose-500',    dot: 'bg-rose-400',    text: 'text-rose-600' },
  time:          { bar: 'bg-amber-500',   dot: 'bg-amber-400',   text: 'text-amber-600' },
  communication: { bar: 'bg-sky-500',     dot: 'bg-sky-400',     text: 'text-sky-600' },
  decision:      { bar: 'bg-emerald-500', dot: 'bg-emerald-400', text: 'text-emerald-600' },
  collaboration: { bar: 'bg-violet-500',  dot: 'bg-violet-400',  text: 'text-violet-600' },
  planning:      { bar: 'bg-teal-500',    dot: 'bg-teal-400',    text: 'text-teal-600' },
  perfectionism: { bar: 'bg-orange-500',  dot: 'bg-orange-400',  text: 'text-orange-600' },
}

const traitLabels = [
  { key: 'risk', label: '도전 성향', low: '안정', high: '도전' },
  { key: 'time', label: '시간 투자', low: '여유 없음', high: '풀타임' },
  { key: 'communication', label: '소통 선호', low: '혼자 집중', high: '수시 소통' },
  { key: 'decision', label: '실행 속도', low: '신중한 계획', high: '빠른 실행' },
]

const workStyleLabels = [
  { key: 'collaboration', label: '협업 스타일', low: '독립형', high: '팀 소통형' },
  { key: 'planning', label: '작업 방식', low: '바로 실행', high: '기획 우선' },
  { key: 'perfectionism', label: '품질 기준', low: '속도 우선', high: '완벽주의' },
]

function SliderBar({ value, low, high, label, colorKey }: { value: number; low: string; high: string; label: string; colorKey?: string }) {
  const pct = Math.min(Math.max((value / 10) * 100, 5), 100)
  const colors = (colorKey && TRAIT_COLORS[colorKey]) || { bar: 'bg-surface-inverse', dot: 'bg-surface-inverse', text: 'text-txt-disabled' }
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-txt-secondary flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
          {label}
        </span>
        <span className={`text-[0.625rem] font-mono font-bold ${colors.text}`}>{value}/10</span>
      </div>
      <div className="h-2 bg-surface-sunken border border-border overflow-hidden">
        <div className={`h-full ${colors.bar} transition-all`} style={{ width: `${pct}%`, opacity: 0.6 + (value / 10) * 0.4 }} />
      </div>
      <div className="flex justify-between text-[0.5625rem] text-txt-tertiary">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  )
}

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

  // 프로필 조회수 기록 — profile.id(PK) 기준으로 전송
  useEffect(() => {
    if (profile?.id) {
      fetch(`/api/profile/${profile.id}/view`, { method: 'POST' }).catch(() => {})
    }
  }, [profile?.id])

  // Check interest status
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
    if (!user || !profile?.id || interestLoading) return
    setInterestLoading(true)
    try {
      const res = await fetch(`/api/profile/${profile.id}/interest`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setHasInterested(data.interested)
        setInterestCount(data.interest_count ?? 0)
      }
    } catch { /* ignore */ }
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

  // Parse bio and vision_summary JSON
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
  // Prefer bio over vision_summary for display
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
              className={`flex gap-4 max-h-[95vh] md:max-h-[90vh] transition-all duration-300 ${sidePanel ? 'w-full max-w-[90rem]' : 'w-full max-w-lg md:max-w-2xl lg:max-w-3xl'}`}
              role="dialog"
              aria-modal="true"
              aria-label={profile?.nickname || '프로필'}
            >
            {/* Main modal */}
            <div className={`bg-surface-card shadow-brutal-xl border border-border-strong overflow-hidden flex flex-col relative transition-all duration-300 ${sidePanel ? 'w-3/5' : 'w-full'}`}>
              {/* macOS-style Window Bar */}
              <div className="bg-surface-sunken border-b border-border-strong px-3 sm:px-4 h-10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <button onClick={onClose} className="group w-3 h-3 rounded-full bg-[#FF5F57] hover:brightness-90 transition-all relative flex items-center justify-center" aria-label="닫기">
                    <X size={7} className="text-[#FF5F57] group-hover:text-[#4A0002] transition-colors" />
                  </button>
                  <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                  <div className="w-3 h-3 rounded-full bg-[#28C840]" />
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
                  {/* Interest (like) button — not for own profile */}
                  {!loading && profile && user?.id !== profile.user_id && (
                    <button
                      onClick={handleInterest}
                      disabled={interestLoading}
                      className={`flex items-center gap-1 px-2 py-1 text-[0.625rem] font-mono font-bold transition-colors border ${
                        hasInterested
                          ? 'bg-rose-50 text-rose-500 border-rose-200 hover:bg-rose-100'
                          : 'text-txt-disabled border-transparent hover:bg-surface-sunken hover:border-border hover:text-rose-400'
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
                  {/* Hero Cover */}
                  {coverUrl ? (
                    <div className="relative h-36 sm:h-44 overflow-hidden">
                      <Image
                        src={coverUrl}
                        alt=""
                        fill
                        sizes="(max-width:768px) 100vw, 768px"
                        className="object-cover"
                        quality={90}
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    </div>
                  ) : null}

                  {/* Profile Header */}
                  <div className={`px-4 sm:px-8 ${coverUrl ? 'pt-0 -mt-10 relative z-10' : 'pt-4 sm:pt-6'} pb-3`}>
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className={`relative w-20 h-20 bg-surface-inverse flex items-center justify-center text-2xl font-bold text-txt-inverse shrink-0 shadow-solid-sm border-2 ${coverUrl ? 'border-surface-card' : 'border-border-strong'}`}>
                        {profile.nickname.substring(0, 2)}
                        {profile.avatar_url && (
                          <Image
                            src={profile.avatar_url}
                            alt={profile.nickname}
                            width={80}
                            height={80}
                            className="absolute inset-0 w-20 h-20 object-cover"
                            quality={85}
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pt-2">
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className={`text-2xl font-bold ${coverUrl ? 'text-white drop-shadow-sm' : 'text-txt-primary'}`}>
                            {profile.nickname}
                          </h2>
                          {matchData && matchData.match_score > 0 && (
                            <span className={`text-[0.625rem] font-mono font-bold px-1.5 py-0.5 border shrink-0 ${
                              matchData.match_score >= 80 ? 'bg-status-success-bg text-status-success-text border-indicator-online/20'
                              : matchData.match_score >= 60 ? 'bg-brand-bg text-brand border-brand-border'
                              : 'bg-surface-card text-txt-tertiary border-border'
                            }`}>
                              {matchData.match_score}% MATCH
                            </span>
                          )}
                        </div>
                        <p className={`text-sm ${coverUrl ? 'text-white/80' : 'text-txt-tertiary'}`}>
                          {profile.desired_position || 'Explorer'}
                        </p>
                        {profile.current_situation && (
                          <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 text-[0.625rem] font-mono font-bold bg-brand/15 text-brand border border-brand/30">
                            <Target size={9} /> {SITUATION_LABELS[profile.current_situation] || profile.current_situation}
                          </span>
                        )}
                        <div className={`flex flex-wrap items-center gap-3 mt-1.5 text-xs ${coverUrl ? 'text-white/60' : 'text-txt-tertiary'}`}>
                          {affiliationType && AFFILIATION_LABELS[affiliationType] && (
                            <span className="px-1.5 py-0.5 bg-surface-inverse/10 border border-border font-medium">
                              {AFFILIATION_LABELS[affiliationType]}
                            </span>
                          )}
                          {profile.university && (
                            <span className="flex items-center gap-1">
                              <Building2 size={12} />
                              {profile.university}{profile.major ? ` · ${profile.major}` : ''}
                            </span>
                          )}
                          {profile.location && (
                            <span className="flex items-center gap-1">
                              <MapPin size={12} />
                              {profile.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Interest Tags below header */}
                    {profile.interest_tags && profile.interest_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {profile.interest_tags.map((tag) => (
                          <span key={tag} className="px-2.5 py-1 bg-tag-default-bg text-tag-default-text text-xs font-medium border border-border-strong">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mx-4 sm:mx-8 border-t border-dashed border-border" />

                  {/* 2-Column Grid Body */}
                  <div className="px-4 sm:px-8 py-5">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-10">
                      {/* Left Column (3/5) */}
                      <div className="md:col-span-3 space-y-6">
                        {/* Bio / Vision */}
                        <section>
                          <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-2">
                            소개
                          </h3>
                          {displayBio ? (
                            <>
                              <p className="text-sm text-txt-secondary leading-relaxed whitespace-pre-line">
                                {displayBio}
                              </p>
                              {visionGoals.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {visionGoals.map((g: string) => (
                                    <span key={g} className="px-2 py-0.5 text-[11px] font-medium bg-brand-bg text-brand border border-brand-border">{g}</span>
                                  ))}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="px-4 py-5 border border-dashed border-border bg-surface-sunken/30 text-center">
                              <p className="text-xs text-txt-disabled font-mono">아직 자기소개가 없습니다</p>
                            </div>
                          )}
                        </section>

                        {/* Portfolio */}
                        <section>
                          <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3 flex items-center gap-1">
                            <FileText size={11} /> 포트폴리오
                          </h3>

                          {/* Links */}
                          {(profile.portfolio_url || profile.github_url || profile.linkedin_url) && (
                            <div className="space-y-1.5 mb-4">
                              <p className="text-[0.5rem] font-mono font-bold text-txt-disabled uppercase tracking-widest mb-1.5">LINKS</p>
                              <div className="flex flex-wrap gap-2">
                                {profile.portfolio_url && (
                                  <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-card border border-border-strong text-xs text-txt-secondary hover:border-brand hover:text-brand transition-colors">
                                    <Globe size={12} className="shrink-0" />
                                    {profile.portfolio_url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                                  </a>
                                )}
                                {profile.github_url && (
                                  <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-card border border-border-strong text-xs text-txt-secondary hover:border-brand hover:text-brand transition-colors">
                                    <Github size={12} className="shrink-0" />
                                    {profile.github_url.replace(/^https?:\/\/(www\.)?github\.com\/?/, '')}
                                  </a>
                                )}
                                {profile.linkedin_url && (
                                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-card border border-border-strong text-xs text-txt-secondary hover:border-brand hover:text-brand transition-colors">
                                    <Linkedin size={12} className="shrink-0" />
                                    {profile.linkedin_url.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\/?/, '')}
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Items — show max 2, expand to side panel */}
                          {portfolioItems.length > 0 ? (
                            <>
                              <p className="text-[0.5rem] font-mono font-bold text-txt-disabled uppercase tracking-widest mb-2">WORKS</p>
                              <div className="grid grid-cols-2 gap-3">
                                {portfolioItems.slice(0, 2).map((item) => (
                                  <a
                                    key={item.id}
                                    href={item.link_url || '#'}
                                    target={item.link_url ? '_blank' : undefined}
                                    rel={item.link_url ? 'noopener noreferrer' : undefined}
                                    className="bg-surface-card border border-border-strong overflow-hidden hover:shadow-sharp transition-all"
                                  >
                                    {item.image_url && (
                                      <div className="relative h-20 bg-surface-card">
                                        <Image src={item.image_url} alt={item.title} fill className="object-cover" />
                                      </div>
                                    )}
                                    <div className="p-2">
                                      <p className="text-xs font-bold text-txt-primary truncate">{item.title}</p>
                                      {item.description && <p className="text-[0.625rem] text-txt-tertiary truncate mt-0.5">{item.description}</p>}
                                    </div>
                                  </a>
                                ))}
                              </div>
                              {portfolioItems.length > 2 && (
                                <button
                                  onClick={() => setSidePanel('portfolio')}
                                  className="w-full mt-2 flex items-center justify-center gap-1 px-3 py-2 text-[0.625rem] font-mono font-bold text-txt-tertiary border border-border hover:bg-surface-sunken hover:text-txt-primary transition-colors"
                                >
                                  +{portfolioItems.length - 2}개 더보기 <ChevronRight size={12} />
                                </button>
                              )}
                            </>
                          ) : !profile.portfolio_url && !profile.github_url && !profile.linkedin_url ? (
                            <div className="px-4 py-5 border border-dashed border-border bg-surface-sunken/30 text-center">
                              <p className="text-xs text-txt-disabled font-mono">아직 등록된 포트폴리오가 없습니다</p>
                            </div>
                          ) : null}
                        </section>

                        {/* User's Projects */}
                        <section>
                          <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3 flex items-center gap-1">
                            <Rocket size={11} /> 프로젝트
                            <span className="text-[0.625rem] font-mono text-txt-tertiary">({userProjects.length})</span>
                          </h3>
                          {userProjects.length > 0 ? (
                            <>
                              <div className="space-y-2">
                                {userProjects.slice(0, 2).map((project) => {
                                  const typeLabel = project.type === 'startup' || project.type === 'team_building' ? '스타트업' : project.type === 'study' ? '스터디' : '사이드'
                                  return (
                                    <button
                                      key={project.id}
                                      onClick={() => {
                                        if (onSelectProject) {
                                          onClose()
                                          onSelectProject(project.id)
                                        }
                                      }}
                                      className="w-full text-left px-3 py-3 bg-surface-card border border-border-strong hover:shadow-sharp hover:border-brand/40 transition-all group/proj"
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                          <p className="text-sm font-bold text-txt-primary truncate group-hover/proj:text-brand transition-colors">{project.title}</p>
                                          <div className="flex items-center gap-2 mt-1.5">
                                            <span className="text-[0.625rem] font-mono text-brand bg-brand-bg px-1.5 py-0.5 border border-brand-border">
                                              {typeLabel}
                                            </span>
                                            {(project.needed_roles || []).slice(0, 2).map((role: string) => (
                                              <span key={role} className="text-[0.625rem] font-mono text-txt-tertiary">{role}</span>
                                            ))}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <span className="text-[0.625rem] font-mono text-indicator-online flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-indicator-online rounded-full" />
                                            모집중
                                          </span>
                                          <ChevronRight size={14} className="text-txt-disabled group-hover/proj:text-brand transition-colors" />
                                        </div>
                                      </div>
                                      {(project.interest_tags || []).length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {(project.interest_tags as string[]).slice(0, 3).map((tag: string) => (
                                            <span key={tag} className="text-[0.625rem] font-mono bg-surface-sunken text-txt-tertiary px-1.5 py-0.5">{tag}</span>
                                          ))}
                                        </div>
                                      )}
                                      {(project.applications_count ?? 0) > 0 && (
                                        <p className="text-[0.625rem] font-mono text-txt-tertiary mt-2">{project.applications_count}명 지원</p>
                                      )}
                                    </button>
                                  )
                                })}
                              </div>
                              {userProjects.length > 2 && (
                                <button
                                  onClick={() => setSidePanel('projects')}
                                  className="w-full mt-2 flex items-center justify-center gap-1 px-3 py-2 text-[0.625rem] font-mono font-bold text-txt-tertiary border border-border hover:bg-surface-sunken hover:text-txt-primary transition-colors"
                                >
                                  +{userProjects.length - 2}개 더보기 <ChevronRight size={12} />
                                </button>
                              )}
                            </>
                          ) : (
                            <div className="px-4 py-5 border border-dashed border-border bg-surface-sunken/30 text-center">
                              <p className="text-xs text-txt-disabled font-mono">아직 등록된 프로젝트가 없습니다</p>
                            </div>
                          )}
                        </section>

                        {/* Contact */}
                        {profile.contact_email && (
                          <section>
                            <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3">
                              연락처
                            </h3>
                            {isAuthenticated ? (
                              <a
                                href={`mailto:${profile.contact_email}`}
                                className="flex items-center gap-2 px-3 py-2 bg-surface-card hover:bg-surface-sunken text-sm text-txt-secondary transition-colors border border-border-strong hover:border-border-strong"
                              >
                                <Mail size={14} />
                                {profile.contact_email}
                              </a>
                            ) : (
                              <a
                                href="/login"
                                className="flex items-center gap-2 px-3 py-2 bg-surface-card hover:bg-surface-sunken text-sm text-txt-tertiary transition-colors border border-border-strong hover:border-border-strong"
                              >
                                <Mail size={14} />
                                로그인하면 연락처를 볼 수 있어요
                              </a>
                            )}
                          </section>
                        )}

                        {/* DM / Login CTA */}
                        {isAuthenticated ? (
                          <>
                            <DirectMessageBox receiverId={profile.user_id} />
                            {/* Coffee Chat + Invite Actions (not for own profile) */}
                            {user?.id !== profile.user_id && (
                              <ProfileActions
                                targetUserId={profile.user_id}
                                targetName={profile.nickname}
                                showCoffeeChatForm={showCoffeeChatForm}
                                setShowCoffeeChatForm={setShowCoffeeChatForm}
                                showInviteModal={showInviteModal}
                                setShowInviteModal={setShowInviteModal}
                              />
                            )}
                          </>
                        ) : (
                          <div className="bg-surface-inverse p-5 text-center border border-black shadow-solid">
                            <Coffee size={20} className="text-txt-inverse/50 mx-auto mb-2" />
                            <p className="text-sm font-medium text-txt-inverse mb-1">관심 있는 사람인가요?</p>
                            <p className="text-xs text-txt-inverse/50 mb-3">로그인하면 쪽지와 커피챗이 가능해요</p>
                            <a
                              href="/login"
                              className="inline-flex items-center gap-2 bg-white text-txt-primary px-5 py-2 font-bold text-xs hover:bg-surface-sunken transition-colors border border-white"
                            >
                              로그인하기
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Right Column (2/5) */}
                      <div className="md:col-span-2 space-y-6">
                        {/* Empty state when right column has no data */}
                        {!(personality && Object.keys(personality).length > 0) &&
                         !(workStyle && Object.keys(workStyle).length > 0) &&
                         !(teamPref && Object.keys(teamPref).length > 0) &&
                         !(availability && (availability.hours_per_week != null || availability.prefer_online != null)) &&
                         !(skills && skills.length > 0) && (
                          <div className="px-4 py-8 border border-dashed border-border bg-surface-sunken/30 text-center">
                            <p className="text-xs text-txt-disabled font-mono">아직 등록된 성향·스킬 정보가 없습니다</p>
                          </div>
                        )}

                        {/* Personality Traits (슬라이더) */}
                        {personality && Object.keys(personality).length > 0 && (
                          <section>
                            <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3">
                              성향 점수
                            </h3>
                            <div className="space-y-3">
                              {traitLabels.map(({ key, label, low, high }) => {
                                const val = personality[key]
                                if (val == null) return null
                                return <SliderBar key={key} value={val} low={low} high={high} label={label} colorKey={key} />
                              })}
                            </div>
                          </section>
                        )}

                        {/* Work Style (vision_summary.work_style) */}
                        {workStyle && Object.keys(workStyle).length > 0 && (
                          <section>
                            <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3">
                              작업 스타일
                            </h3>
                            <div className="space-y-3">
                              {workStyleLabels.map(({ key, label, low, high }) => {
                                const val = workStyle[key]
                                if (val == null) return null
                                return <SliderBar key={key} value={val} low={low} high={high} label={label} colorKey={key} />
                              })}
                            </div>
                          </section>
                        )}

                        {/* Team Preference */}
                        {teamPref && Object.keys(teamPref).length > 0 && (
                          <section>
                            <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3 flex items-center gap-1">
                              <Users size={11} /> 팀 선호
                            </h3>
                            <div className="space-y-2">
                              {teamPref.role && (
                                <div className="flex items-center justify-between px-3 py-2 bg-surface-card border border-border">
                                  <span className="text-[0.625rem] text-txt-tertiary font-mono">역할</span>
                                  <span className="text-xs font-medium text-txt-secondary">{teamPref.role}</span>
                                </div>
                              )}
                              {teamPref.preferred_size && (
                                <div className="flex items-center justify-between px-3 py-2 bg-surface-card border border-border">
                                  <span className="text-[0.625rem] text-txt-tertiary font-mono">선호 규모</span>
                                  <span className="text-xs font-medium text-txt-secondary">{teamPref.preferred_size}</span>
                                </div>
                              )}
                              {teamPref.atmosphere && (
                                <div className="flex items-center justify-between px-3 py-2 bg-surface-card border border-border">
                                  <span className="text-[0.625rem] text-txt-tertiary font-mono">분위기</span>
                                  <span className="text-xs font-medium text-txt-secondary">{teamPref.atmosphere}</span>
                                </div>
                              )}
                            </div>
                          </section>
                        )}

                        {/* Availability */}
                        {availability && (availability.hours_per_week != null || availability.prefer_online != null) && (
                          <section>
                            <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3 flex items-center gap-1">
                              <Clock size={11} /> 가용 시간
                            </h3>
                            <div className="space-y-2">
                              {availability.hours_per_week != null && (
                                <div className="flex items-center justify-between px-3 py-2 bg-surface-card border border-border">
                                  <span className="text-[0.625rem] text-txt-tertiary font-mono">주당 시간</span>
                                  <span className="text-xs font-medium text-txt-secondary">{availability.hours_per_week}시간</span>
                                </div>
                              )}
                              {availability.prefer_online != null && (
                                <div className="flex items-center justify-between px-3 py-2 bg-surface-card border border-border">
                                  <span className="text-[0.625rem] text-txt-tertiary font-mono">작업 방식</span>
                                  <span className="text-xs font-medium text-txt-secondary">{availability.prefer_online ? '온라인 선호' : '오프라인 선호'}</span>
                                </div>
                              )}
                            </div>
                          </section>
                        )}

                        {/* Skills */}
                        {skills && skills.length > 0 && (
                          <section>
                            <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3 flex items-center gap-1">
                              <Code2 size={11} /> 스킬
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {skills.map((skill) => (
                                <span
                                  key={skill.name}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-tag-default-bg text-tag-default-text text-xs border border-border"
                                >
                                  {skill.name}
                                  <span className="text-txt-tertiary">·</span>
                                  <span className="text-txt-tertiary text-[0.625rem]">{skill.level}</span>
                                </span>
                              ))}
                            </div>
                          </section>
                        )}

                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Side Panel */}
            {sidePanel && (
              <div className="hidden md:flex w-2/5 bg-surface-card border border-border-strong flex-col overflow-hidden shadow-brutal-xl">
                {/* Side panel header */}
                <div className="bg-surface-sunken border-b border-border-strong px-4 h-10 flex items-center justify-between shrink-0">
                  <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest">
                    {sidePanel === 'projects' ? `프로젝트 (${userProjects.length})` : `포트폴리오 (${portfolioItems.length})`}
                  </h3>
                  <button
                    onClick={() => setSidePanel(null)}
                    className="p-1.5 hover:bg-surface-sunken transition-colors"
                  >
                    <X size={14} className="text-txt-disabled" />
                  </button>
                </div>

                {/* Side panel content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {sidePanel === 'projects' && userProjects.map((project) => {
                    const typeLabel = project.type === 'startup' || project.type === 'team_building' ? '스타트업' : project.type === 'study' ? '스터디' : '사이드'
                    return (
                      <button
                        key={project.id}
                        onClick={() => {
                          if (onSelectProject) {
                            onClose()
                            onSelectProject(project.id)
                          }
                        }}
                        className="w-full text-left px-3 py-3 bg-surface-card border border-border-strong hover:shadow-sharp hover:border-brand/40 transition-all group/proj"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-txt-primary truncate group-hover/proj:text-brand transition-colors">{project.title}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[0.625rem] font-mono text-brand bg-brand-bg px-1.5 py-0.5 border border-brand-border">{typeLabel}</span>
                              {(project.needed_roles || []).slice(0, 2).map((role: string) => (
                                <span key={role} className="text-[0.625rem] font-mono text-txt-tertiary">{role}</span>
                              ))}
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-txt-disabled group-hover/proj:text-brand transition-colors shrink-0 mt-1" />
                        </div>
                        {(project.interest_tags || []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(project.interest_tags as string[]).slice(0, 3).map((tag: string) => (
                              <span key={tag} className="text-[0.625rem] font-mono bg-surface-sunken text-txt-tertiary px-1.5 py-0.5">{tag}</span>
                            ))}
                          </div>
                        )}
                        {(project.applications_count ?? 0) > 0 && (
                          <p className="text-[0.625rem] font-mono text-txt-tertiary mt-2">{project.applications_count}명 지원</p>
                        )}
                      </button>
                    )
                  })}

                  {sidePanel === 'portfolio' && portfolioItems.map((item) => (
                    <a
                      key={item.id}
                      href={item.link_url || '#'}
                      target={item.link_url ? '_blank' : undefined}
                      rel={item.link_url ? 'noopener noreferrer' : undefined}
                      className="block bg-surface-card border border-border-strong overflow-hidden hover:shadow-sharp transition-all"
                    >
                      {item.image_url && (
                        <div className="relative h-32 bg-surface-sunken">
                          <Image src={item.image_url} alt={item.title} fill className="object-cover" />
                        </div>
                      )}
                      <div className="p-3">
                        <p className="text-sm font-bold text-txt-primary truncate">{item.title}</p>
                        {item.description && <p className="text-xs text-txt-tertiary mt-1 line-clamp-2">{item.description}</p>}
                        {item.link_url && (
                          <p className="flex items-center gap-1 text-[0.625rem] font-mono text-txt-tertiary mt-2">
                            <ExternalLink size={10} /> Link
                          </p>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// 포트폴리오 상세 뷰
function PortfolioView({
  profile,
  skills,
  onBack,
}: {
  profile: { nickname: string; desired_position: string | null; portfolio_url: string | null; github_url: string | null; linkedin_url: string | null; avatar_url: string | null }
  skills: Array<{ name: string; level: string }> | null
  onBack: () => void
}) {
  const hasPortfolio = profile.portfolio_url
  const hasGithub = profile.github_url
  const hasLinkedin = profile.linkedin_url

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-4 sm:px-8 py-4 border-b border-dashed border-border flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-border-strong hover:bg-black hover:text-white transition-all"
        >
          <ArrowLeft size={12} />
          프로필로 돌아가기
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <div className="w-6 h-6 bg-surface-inverse flex items-center justify-center text-[0.5rem] font-bold text-txt-inverse shrink-0">
            {profile.nickname.substring(0, 2)}
          </div>
          <div>
            <p className="text-sm font-bold text-txt-primary">{profile.nickname}</p>
            <p className="text-[0.625rem] font-mono text-txt-tertiary">{profile.desired_position || 'Explorer'}</p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 py-6 space-y-6">
        {/* Portfolio Site */}
        {hasPortfolio && (
          <section>
            <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3 flex items-center gap-1">
              <Globe size={11} /> PORTFOLIO SITE
            </h3>
            <div className="border border-border-strong overflow-hidden">
              <div className="bg-surface-card px-3 py-2 border-b border-border flex items-center justify-between">
                <span className="text-xs text-txt-secondary font-mono truncate flex-1 mr-2">
                  {profile.portfolio_url!.replace(/^https?:\/\//, '')}
                </span>
                <a
                  href={profile.portfolio_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 text-[0.625rem] font-bold border border-border hover:bg-black hover:text-white transition-all shrink-0"
                >
                  <ExternalLink size={10} />
                  새 탭에서 열기
                </a>
              </div>
              <div className="relative bg-white" style={{ height: '400px' }}>
                <iframe
                  src={profile.portfolio_url!}
                  title={`${profile.nickname}의 포트폴리오`}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-popups"
                  loading="lazy"
                />
              </div>
            </div>
          </section>
        )}

        {/* GitHub */}
        {hasGithub && (
          <section>
            <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3 flex items-center gap-1">
              <Github size={11} /> GITHUB
            </h3>
            <a
              href={profile.github_url!}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 p-4 bg-surface-card border border-border-strong hover:border-brand/30 hover:shadow-solid-sm transition-all"
            >
              <div className="w-12 h-12 bg-surface-inverse flex items-center justify-center shrink-0">
                <Github size={24} className="text-txt-inverse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-txt-primary group-hover:text-brand transition-colors">
                  {profile.github_url!.replace(/^https?:\/\/(www\.)?github\.com\/?/, '') || 'GitHub Profile'}
                </p>
                <p className="text-xs text-txt-tertiary font-mono truncate">{profile.github_url}</p>
              </div>
              <ExternalLink size={14} className="text-txt-disabled group-hover:text-brand shrink-0 transition-colors" />
            </a>
          </section>
        )}

        {/* LinkedIn */}
        {hasLinkedin && (
          <section>
            <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3 flex items-center gap-1">
              <Linkedin size={11} /> LINKEDIN
            </h3>
            <a
              href={profile.linkedin_url!}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 p-4 bg-surface-card border border-border-strong hover:border-brand/30 hover:shadow-solid-sm transition-all"
            >
              <div className="w-12 h-12 bg-[#0A66C2] flex items-center justify-center shrink-0">
                <Linkedin size={24} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-txt-primary group-hover:text-brand transition-colors">
                  {profile.linkedin_url!.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\/?/, '') || 'LinkedIn Profile'}
                </p>
                <p className="text-xs text-txt-tertiary font-mono truncate">{profile.linkedin_url}</p>
              </div>
              <ExternalLink size={14} className="text-txt-disabled group-hover:text-brand shrink-0 transition-colors" />
            </a>
          </section>
        )}

        {/* Skills in portfolio context */}
        {skills && skills.length > 0 && (
          <section>
            <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3 flex items-center gap-1">
              <Code2 size={11} /> TECH STACK
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill.name}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-tag-default-bg text-tag-default-text text-xs border border-border font-medium"
                >
                  {skill.name}
                  <span className="text-txt-tertiary">·</span>
                  <span className="text-txt-tertiary text-[0.625rem]">{skill.level}</span>
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!hasPortfolio && !hasGithub && !hasLinkedin && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText size={32} className="text-txt-tertiary mb-3" />
            <p className="font-bold text-txt-primary mb-1">등록된 포트폴리오가 없습니다</p>
            <p className="text-sm text-txt-tertiary">아직 포트폴리오 링크가 등록되지 않았어요</p>
          </div>
        )}
      </div>
    </div>
  )
}

// 커피챗 + 프로젝트 초대 액션
function ProfileActions({
  targetUserId,
  targetName,
  showCoffeeChatForm,
  setShowCoffeeChatForm,
  showInviteModal,
  setShowInviteModal,
}: {
  targetUserId: string
  targetName: string
  showCoffeeChatForm: boolean
  setShowCoffeeChatForm: (v: boolean) => void
  showInviteModal: boolean
  setShowInviteModal: (v: boolean) => void
}) {
  const { data: existingChats = [] } = useCoffeeChats({
    targetUserId,
    enabled: !!targetUserId,
  })
  const pendingChat = existingChats.find(c => c.status === 'pending')
  const latestChat = existingChats[0]

  return (
    <>
      <div className="border-t border-dashed border-border mt-4 pt-4">
        <div className="flex gap-2">
          {/* Coffee Chat Button */}
          {pendingChat ? (
            <div className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-status-warning-bg text-status-warning-text text-xs font-bold border border-status-warning-text/20">
              <Coffee size={14} />
              커피챗 대기 중
            </div>
          ) : latestChat?.status === 'accepted' ? (
            <div className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-status-success-bg text-status-success-text text-xs font-bold border border-status-success-text/20">
              <Coffee size={14} />
              커피챗 수락됨
            </div>
          ) : (
            <button
              onClick={() => setShowCoffeeChatForm(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-surface-card text-txt-secondary text-xs font-bold border border-border-strong hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <Coffee size={14} />
              커피챗 신청
            </button>
          )}

          {/* Invite to Project Button */}
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-surface-card text-txt-secondary text-xs font-bold border border-border-strong hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <UserPlus size={14} />
            프로젝트에 초대
          </button>
        </div>
      </div>

      {/* Coffee Chat Form Overlay */}
      {showCoffeeChatForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => setShowCoffeeChatForm(false)}>
          <div className="bg-surface-card border border-border-strong shadow-brutal w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <CoffeeChatRequestForm
              targetUserId={targetUserId}
              onClose={() => setShowCoffeeChatForm(false)}
            />
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteToProjectModal
          targetUserId={targetUserId}
          targetName={targetName}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </>
  )
}

// 쪽지 보내기 인라인 컴포넌트
function DirectMessageBox({ receiverId }: { receiverId: string }) {
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSend = async () => {
    if (!content.trim()) return
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiver_id: receiverId, content: content.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSent(true)
      setContent('')
      setTimeout(() => setSent(false), 3000)
    } catch {
      setError('전송에 실패했습니다')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="border border-border-strong p-4 shadow-solid-sm">
      <h4 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-2 flex items-center gap-1.5">
        <Send size={10} /> SEND MESSAGE
      </h4>
      {sent ? (
        <p className="text-sm text-indicator-online font-medium py-2">쪽지가 전송되었습니다!</p>
      ) : (
        <>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="간단한 쪽지를 보내보세요..."
            rows={2}
            maxLength={2000}
            className="w-full px-3 py-2 text-sm border border-border bg-surface-bg focus:outline-none focus:border-accent resize-none transition-colors mb-2"
          />
          <div className="flex items-center justify-between">
            <span className="text-[0.625rem] font-mono text-txt-tertiary">{content.length}/2000</span>
            <button
              onClick={handleSend}
              disabled={!content.trim() || sending}
              className="flex items-center gap-1.5 px-4 py-2 bg-surface-inverse text-txt-inverse text-xs font-bold border border-black hover:bg-black/80 disabled:opacity-40 transition-colors shadow-solid-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]"
            >
              {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              보내기
            </button>
          </div>
          {error && <p className="text-xs text-status-danger-text mt-1">{error}</p>}
        </>
      )}
    </div>
  )
}
