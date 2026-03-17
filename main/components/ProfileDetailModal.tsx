'use client'

import React, { useEffect, useState } from 'react'
import {
  X, MapPin, Briefcase, Building2, Share2,
  Loader2, AlertCircle, Mail, Coffee, Code2,
  Globe, Github, Linkedin, ShieldCheck, Send, Clock, Users,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDetailedPublicProfile } from '@/src/hooks/usePublicProfiles'
import { useAuth } from '@/src/context/AuthContext'

interface ProfileDetailModalProps {
  profileId: string | null
  byUserId?: boolean
  onClose: () => void
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

function SliderBar({ value, low, high, label }: { value: number; low: string; high: string; label: string }) {
  const pct = Math.min(Math.max((value / 10) * 100, 5), 100)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-txt-secondary">{label}</span>
        <span className="text-[0.625rem] font-mono text-txt-disabled">{value}/10</span>
      </div>
      <div className="h-2 bg-surface-sunken border border-border overflow-hidden">
        <div className="h-full bg-surface-inverse transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-[0.5625rem] text-txt-disabled">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  )
}

export const ProfileDetailModal: React.FC<ProfileDetailModalProps> = ({ profileId, byUserId, onClose }) => {
  const { isAuthenticated } = useAuth()
  const [shareCopied, setShareCopied] = useState(false)
  const { data: profile, isLoading: loading } = useDetailedPublicProfile(
    profileId ?? undefined,
    byUserId ? { byUserId: true } : undefined
  )

  useEffect(() => {
    if (profileId) {
      document.body.style.overflow = 'hidden'
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

  // Parse vision_summary JSON
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
              className="w-full max-w-lg md:max-w-2xl lg:max-w-3xl max-h-[95vh] md:max-h-[90vh] bg-surface-card shadow-brutal-xl border border-border-strong overflow-hidden flex flex-col relative"
              role="dialog"
              aria-modal="true"
              aria-label={profile?.nickname || '프로필'}
            >
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
              ) : (
                <div className="flex-1 overflow-y-auto">
                  {/* Hero Cover */}
                  {coverUrl ? (
                    <div className="relative h-36 sm:h-44 overflow-hidden">
                      <img
                        src={coverUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    </div>
                  ) : null}

                  {/* Profile Header */}
                  <div className={`px-4 sm:px-8 ${coverUrl ? 'pt-0 -mt-10 relative z-10' : 'pt-4 sm:pt-6'} pb-3`}>
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.nickname}
                          className={`w-20 h-20 object-cover shrink-0 shadow-solid-sm border-2 ${coverUrl ? 'border-surface-card' : 'border-border-strong'}`}
                        />
                      ) : (
                        <div className={`w-20 h-20 bg-surface-inverse flex items-center justify-center text-2xl font-bold text-txt-inverse shrink-0 shadow-solid-sm border-2 ${coverUrl ? 'border-surface-card' : 'border-border-strong'}`}>
                          {profile.nickname.substring(0, 2)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0 pt-2">
                        <h2 className={`text-2xl font-bold mb-1 ${coverUrl ? 'text-white drop-shadow-sm' : 'text-txt-primary'}`}>
                          {profile.nickname}
                        </h2>
                        <p className={`text-sm ${coverUrl ? 'text-white/80' : 'text-txt-tertiary'}`}>
                          {profile.desired_position || 'Explorer'}
                        </p>
                        <div className={`flex flex-wrap items-center gap-3 mt-1.5 text-xs ${coverUrl ? 'text-white/60' : 'text-txt-disabled'}`}>
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
                          <span key={tag} className="px-2.5 py-1 bg-surface-sunken text-txt-tertiary text-xs border border-border">
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
                        {/* Vision */}
                        {visionSummary && (
                          <section>
                            <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-2">
                              비전
                            </h3>
                            <p className="text-sm text-txt-secondary leading-relaxed whitespace-pre-line">
                              {visionSummary}
                            </p>
                            {visionGoals.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {visionGoals.map((g: string) => (
                                  <span key={g} className="px-2 py-0.5 text-[11px] font-medium bg-brand-bg text-brand border border-brand-border">{g}</span>
                                ))}
                              </div>
                            )}
                          </section>
                        )}

                        {/* Contact & Social */}
                        {(profile.contact_email || profile.portfolio_url || profile.github_url || profile.linkedin_url) && (
                          <section>
                            <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3">
                              연락처 & 링크
                            </h3>
                            <div className="space-y-2">
                              {profile.contact_email && (
                                isAuthenticated ? (
                                  <a
                                    href={`mailto:${profile.contact_email}`}
                                    className="flex items-center gap-2 px-3 py-2 bg-surface-sunken hover:bg-surface-card text-sm text-txt-secondary transition-colors border border-border-strong hover:border-border-strong"
                                  >
                                    <Mail size={14} />
                                    {profile.contact_email}
                                  </a>
                                ) : (
                                  <a
                                    href="/login"
                                    className="flex items-center gap-2 px-3 py-2 bg-surface-sunken hover:bg-surface-card text-sm text-txt-disabled transition-colors border border-border-strong hover:border-border-strong"
                                  >
                                    <Mail size={14} />
                                    로그인하면 연락처를 볼 수 있어요
                                  </a>
                                )
                              )}
                              {profile.portfolio_url && (
                                <a
                                  href={profile.portfolio_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 bg-surface-sunken hover:bg-surface-card text-sm text-txt-secondary transition-colors border border-border-strong hover:border-border-strong"
                                >
                                  <Globe size={14} />
                                  포트폴리오
                                  <span className="ml-auto text-txt-disabled text-xs truncate max-w-[200px]">{profile.portfolio_url.replace(/^https?:\/\//, '')}</span>
                                </a>
                              )}
                              {profile.github_url && (
                                <a
                                  href={profile.github_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 bg-surface-sunken hover:bg-surface-card text-sm text-txt-secondary transition-colors border border-border-strong hover:border-border-strong"
                                >
                                  <Github size={14} />
                                  GitHub
                                  <span className="ml-auto text-txt-disabled text-xs truncate max-w-[200px]">{profile.github_url.replace(/^https?:\/\/(www\.)?github\.com\/?/, '')}</span>
                                </a>
                              )}
                              {profile.linkedin_url && (
                                <a
                                  href={profile.linkedin_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 bg-surface-sunken hover:bg-surface-card text-sm text-txt-secondary transition-colors border border-border-strong hover:border-border-strong"
                                >
                                  <Linkedin size={14} />
                                  LinkedIn
                                  <span className="ml-auto text-txt-disabled text-xs truncate max-w-[200px]">{profile.linkedin_url.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\/?/, '')}</span>
                                </a>
                              )}
                            </div>
                          </section>
                        )}

                        {/* DM / Login CTA */}
                        {isAuthenticated ? (
                          <DirectMessageBox receiverId={profile.user_id} />
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
                                return <SliderBar key={key} value={val} low={low} high={high} label={label} />
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
                                return <SliderBar key={key} value={val} low={low} high={high} label={label} />
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
                                <div className="flex items-center justify-between px-3 py-2 bg-surface-sunken border border-border">
                                  <span className="text-[0.625rem] text-txt-disabled font-mono">역할</span>
                                  <span className="text-xs font-medium text-txt-secondary">{teamPref.role}</span>
                                </div>
                              )}
                              {teamPref.preferred_size && (
                                <div className="flex items-center justify-between px-3 py-2 bg-surface-sunken border border-border">
                                  <span className="text-[0.625rem] text-txt-disabled font-mono">선호 규모</span>
                                  <span className="text-xs font-medium text-txt-secondary">{teamPref.preferred_size}</span>
                                </div>
                              )}
                              {teamPref.atmosphere && (
                                <div className="flex items-center justify-between px-3 py-2 bg-surface-sunken border border-border">
                                  <span className="text-[0.625rem] text-txt-disabled font-mono">분위기</span>
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
                                <div className="flex items-center justify-between px-3 py-2 bg-surface-sunken border border-border">
                                  <span className="text-[0.625rem] text-txt-disabled font-mono">주당 시간</span>
                                  <span className="text-xs font-medium text-txt-secondary">{availability.hours_per_week}시간</span>
                                </div>
                              )}
                              {availability.prefer_online != null && (
                                <div className="flex items-center justify-between px-3 py-2 bg-surface-sunken border border-border">
                                  <span className="text-[0.625rem] text-txt-disabled font-mono">작업 방식</span>
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
                                  <span className="text-txt-disabled">·</span>
                                  <span className="text-txt-disabled text-[0.625rem]">{skill.level}</span>
                                </span>
                              ))}
                            </div>
                          </section>
                        )}

                        {/* Profile Info Summary */}
                        {(profile.university || profile.location || profile.current_situation) && (
                          <section>
                            <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3">
                              프로필 정보
                            </h3>
                            <div className="space-y-2">
                              {profile.university && (
                                <div className="flex items-center justify-between px-3 py-2 bg-surface-sunken border border-border">
                                  <span className="text-[0.625rem] text-txt-disabled font-mono">학교</span>
                                  <span className="text-xs font-medium text-txt-secondary">
                                    {profile.university}{profile.major ? ` · ${profile.major}` : ''}
                                  </span>
                                </div>
                              )}
                              {profile.location && (
                                <div className="flex items-center justify-between px-3 py-2 bg-surface-sunken border border-border">
                                  <span className="text-[0.625rem] text-txt-disabled font-mono">위치</span>
                                  <span className="text-xs font-medium text-txt-secondary">{profile.location}</span>
                                </div>
                              )}
                              {profile.current_situation && (
                                <div className="flex items-center justify-between px-3 py-2 bg-surface-sunken border border-border">
                                  <span className="text-[0.625rem] text-txt-disabled font-mono">상태</span>
                                  <span className="text-xs font-medium text-txt-secondary">
                                    {SITUATION_LABELS[profile.current_situation] || profile.current_situation}
                                  </span>
                                </div>
                              )}
                            </div>
                          </section>
                        )}
                      </div>
                    </div>
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
            <span className="text-[0.625rem] font-mono text-txt-disabled">{content.length}/2000</span>
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
