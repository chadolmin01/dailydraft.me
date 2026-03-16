'use client'

import React, { useEffect, useState } from 'react'
import {
  X, MapPin, Briefcase, Building2, BookOpen,
  Loader2, AlertCircle, Mail, Coffee, Code2,
  Globe, Github, Linkedin, ShieldCheck, Send,
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

export const ProfileDetailModal: React.FC<ProfileDetailModalProps> = ({ profileId, byUserId, onClose }) => {
  const { isAuthenticated } = useAuth()
  const { data: profile, isLoading: loading } = useDetailedPublicProfile(
    profileId ?? undefined,
    byUserId ? { byUserId: true } : undefined
  )

  useEffect(() => {
    if (profileId) {
      document.body.style.overflow = 'hidden'
      // 프로필 조회수 기록
      fetch(`/api/profile/${profileId}/view`, { method: 'POST' }).catch(() => {})
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [profileId])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const skills = profile?.skills as Array<{ name: string; level: string }> | null
  const personality = profile?.personality as { mbti?: string; workStyle?: string; communication?: string } | null

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
              className="w-full max-w-lg md:max-w-xl max-h-[95vh] md:max-h-[85vh] bg-surface-card shadow-brutal-xl border-2 border-border-strong overflow-hidden flex flex-col relative"
              role="dialog"
              aria-modal="true"
              aria-label={profile?.nickname || '프로필'}
            >
              {/* macOS-style Window Bar */}
              <div className="bg-surface-sunken border-b border-border-strong px-3 sm:px-5 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <button onClick={onClose} className="group w-5 h-5 sm:w-3 sm:h-3 rounded-full bg-[#FF5F57] hover:brightness-90 transition-all relative flex items-center justify-center" aria-label="닫기">
                    <X size={10} className="text-[#FF5F57] group-hover:text-[#4A0002] transition-colors sm:w-[0.4375rem] sm:h-[0.4375rem]" />
                  </button>
                  <div className="w-3 h-3 rounded-full bg-[#FEBC2E] hidden sm:block" />
                  <div className="w-3 h-3 rounded-full bg-[#28C840] hidden sm:block" />
                </div>
                <span className="text-[0.625rem] font-mono font-bold px-2 py-0.5 bg-surface-sunken text-txt-tertiary border border-border uppercase tracking-wider">
                  PROFILE
                </span>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-surface-sunken transition-colors border border-transparent hover:border-border"
                  aria-label="닫기"
                >
                  <X size={18} className="text-txt-disabled" />
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-[40vh]">
                  <Loader2 className="animate-spin text-txt-disabled" size={28} />
                </div>
              ) : !profile ? (
                <div className="flex flex-col items-center justify-center h-[40vh] text-center px-8">
                  <AlertCircle size={40} className="text-txt-disabled mb-4" />
                  <p className="font-bold text-txt-primary mb-1">프로필을 찾을 수 없습니다</p>
                  <p className="text-sm text-txt-tertiary">비공개이거나 존재하지 않는 프로필입니다.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  {/* Profile Header */}
                  <div className="px-6 sm:px-8 pt-6 pb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-surface-inverse flex items-center justify-center text-xl font-bold text-txt-inverse shrink-0 shadow-solid-sm">
                        {profile.nickname.substring(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-txt-primary mb-1 flex items-center gap-2">
                          {profile.nickname}
                          {(profile as Record<string, unknown>).is_uni_verified && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-600 text-white text-[0.5rem] font-bold uppercase tracking-wider">
                              <ShieldCheck size={10} /> 인증
                            </span>
                          )}
                        </h2>
                        <p className="text-sm text-txt-tertiary">{profile.desired_position || 'Explorer'}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-txt-disabled">
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
                  </div>

                  {/* Status badge */}
                  {profile.current_situation && (
                    <div className="px-6 sm:px-8 pb-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-status-success-bg text-status-success-text text-xs font-medium border border-status-success-text/20">
                        <Briefcase size={12} />
                        {SITUATION_LABELS[profile.current_situation] || profile.current_situation}
                      </span>
                    </div>
                  )}

                  <div className="mx-6 sm:mx-8 border-t border-dashed border-border" />

                  {/* Body */}
                  <div className="px-6 sm:px-8 py-5 space-y-6">
                    {/* Vision */}
                    {profile.vision_summary && (() => {
                      let summary = profile.vision_summary
                      let parsed: Record<string, unknown> | null = null
                      try {
                        parsed = JSON.parse(profile.vision_summary as string)
                        summary = (parsed?.summary as string) || ''
                      } catch { /* plain text */ }
                      if (!summary) return null
                      return (
                        <section>
                          <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-2">
                            비전
                          </h3>
                          <p className="text-sm text-txt-secondary leading-relaxed whitespace-pre-line">
                            {summary}
                          </p>
                          {parsed?.goals && Array.isArray(parsed.goals) && parsed.goals.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {(parsed.goals as string[]).map((g: string) => (
                                <span key={g} className="px-2 py-0.5 text-[11px] font-medium bg-[#4F46E5]/5 text-[#4F46E5] border border-[#4F46E5]/20">{g}</span>
                              ))}
                            </div>
                          )}
                        </section>
                      )
                    })()}

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

                    {/* Interest Tags */}
                    {profile.interest_tags && profile.interest_tags.length > 0 && (
                      <section>
                        <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3">
                          관심 분야
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {profile.interest_tags.map((tag) => (
                            <span key={tag} className="px-2.5 py-1 bg-surface-sunken text-txt-tertiary text-xs border border-border">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Personality */}
                    {personality && (personality.mbti || personality.workStyle || personality.communication) && (
                      <section>
                        <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3">
                          성향
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {personality.mbti && (
                            <div className="bg-surface-sunken px-3 py-2 border border-border-strong">
                              <p className="text-[0.625rem] text-txt-disabled mb-0.5 font-mono">MBTI</p>
                              <p className="text-sm font-medium text-txt-secondary">{personality.mbti}</p>
                            </div>
                          )}
                          {personality.workStyle && (
                            <div className="bg-surface-sunken px-3 py-2 border border-border-strong">
                              <p className="text-[0.625rem] text-txt-disabled mb-0.5 font-mono">작업 스타일</p>
                              <p className="text-sm font-medium text-txt-secondary">{personality.workStyle}</p>
                            </div>
                          )}
                          {personality.communication && (
                            <div className="bg-surface-sunken px-3 py-2 border border-border-strong">
                              <p className="text-[0.625rem] text-txt-disabled mb-0.5 font-mono">소통 방식</p>
                              <p className="text-sm font-medium text-txt-secondary">{personality.communication}</p>
                            </div>
                          )}
                        </div>
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
                  </div>

                  {/* Footer CTA */}
                  <div className="px-6 sm:px-8 pb-6 space-y-3">
                    {isAuthenticated ? (
                      <DirectMessageBox receiverId={profile.user_id} />
                    ) : (
                      <div className="bg-surface-inverse p-5 text-center border-2 border-black shadow-solid">
                        <Coffee size={20} className="text-txt-inverse/50 mx-auto mb-2" />
                        <p className="text-sm font-medium text-txt-inverse mb-1">관심 있는 사람인가요?</p>
                        <p className="text-xs text-txt-inverse/50 mb-3">로그인하면 쪽지와 커피챗이 가능해요</p>
                        <a
                          href="/login"
                          className="inline-flex items-center gap-2 bg-white text-txt-primary px-5 py-2 font-bold text-xs hover:bg-surface-sunken transition-colors border-2 border-white"
                        >
                          로그인하기
                        </a>
                      </div>
                    )}
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
    <div className="border-2 border-border-strong p-4 shadow-solid-sm">
      <h4 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-2 flex items-center gap-1.5">
        <Send size={10} /> SEND MESSAGE
      </h4>
      {sent ? (
        <p className="text-sm text-emerald-600 font-medium py-2">쪽지가 전송되었습니다!</p>
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
