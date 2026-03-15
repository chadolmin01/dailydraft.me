'use client'

import React, { useEffect } from 'react'
import {
  X, MapPin, Briefcase, Building2, BookOpen,
  Loader2, AlertCircle, Mail, Coffee, Code2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDetailedPublicProfile } from '@/src/hooks/usePublicProfiles'

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
              className="w-full max-w-lg md:max-w-xl max-h-[95vh] md:max-h-[85vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col relative"
              role="dialog"
              aria-modal="true"
              aria-label={profile?.nickname || '프로필'}
            >
              {/* macOS-style Window Bar */}
              <div className="bg-[#F9FAFB] border-b border-gray-200/80 px-3 sm:px-5 py-3 flex items-center justify-between rounded-t-xl shrink-0">
                <div className="flex items-center gap-2">
                  <button onClick={onClose} className="group w-5 h-5 sm:w-3 sm:h-3 rounded-full bg-[#FF5F57] hover:brightness-90 transition-all relative flex items-center justify-center" aria-label="닫기">
                    <X size={10} className="text-[#FF5F57] group-hover:text-[#4A0002] transition-colors sm:w-[0.4375rem] sm:h-[0.4375rem]" />
                  </button>
                  <div className="w-3 h-3 rounded-full bg-[#FEBC2E] hidden sm:block" />
                  <div className="w-3 h-3 rounded-full bg-[#28C840] hidden sm:block" />
                </div>
                <span className="text-[0.625rem] font-mono font-bold px-2 py-0.5 bg-gray-200/70 text-gray-500 rounded uppercase tracking-wider">
                  PROFILE
                </span>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-200/60 rounded-md transition-colors"
                  aria-label="닫기"
                >
                  <X size={18} className="text-gray-400" />
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-[40vh]">
                  <Loader2 className="animate-spin text-gray-400" size={28} />
                </div>
              ) : !profile ? (
                <div className="flex flex-col items-center justify-center h-[40vh] text-center px-8">
                  <AlertCircle size={40} className="text-gray-300 mb-4" />
                  <p className="font-bold text-gray-700 mb-1">프로필을 찾을 수 없습니다</p>
                  <p className="text-sm text-gray-500">비공개이거나 존재하지 않는 프로필입니다.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  {/* Profile Header */}
                  <div className="px-6 sm:px-8 pt-6 pb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-surface-inverse rounded-2xl flex items-center justify-center text-xl font-bold text-txt-inverse shrink-0">
                        {profile.nickname.substring(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-gray-900 mb-1">{profile.nickname}</h2>
                        <p className="text-sm text-gray-500">{profile.desired_position || 'Explorer'}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
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
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-lg">
                        <Briefcase size={12} />
                        {SITUATION_LABELS[profile.current_situation] || profile.current_situation}
                      </span>
                    </div>
                  )}

                  <div className="mx-6 sm:mx-8 border-t border-gray-100" />

                  {/* Body */}
                  <div className="px-6 sm:px-8 py-5 space-y-6">
                    {/* Vision */}
                    {profile.vision_summary && (
                      <section>
                        <h3 className="text-[0.625rem] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">
                          비전
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                          {profile.vision_summary}
                        </p>
                      </section>
                    )}

                    {/* Skills */}
                    {skills && skills.length > 0 && (
                      <section>
                        <h3 className="text-[0.625rem] font-mono font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                          <Code2 size={11} /> 스킬
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {skills.map((skill) => (
                            <span
                              key={skill.name}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 text-gray-600 text-xs rounded-md border border-gray-100"
                            >
                              {skill.name}
                              <span className="text-gray-300">·</span>
                              <span className="text-gray-400 text-[0.625rem]">{skill.level}</span>
                            </span>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Interest Tags */}
                    {profile.interest_tags && profile.interest_tags.length > 0 && (
                      <section>
                        <h3 className="text-[0.625rem] font-mono font-bold text-gray-400 uppercase tracking-wider mb-3">
                          관심 분야
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {profile.interest_tags.map((tag) => (
                            <span key={tag} className="px-2.5 py-1 bg-gray-50 text-gray-500 text-xs rounded-md">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Personality */}
                    {personality && (personality.mbti || personality.workStyle || personality.communication) && (
                      <section>
                        <h3 className="text-[0.625rem] font-mono font-bold text-gray-400 uppercase tracking-wider mb-3">
                          성향
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {personality.mbti && (
                            <div className="bg-gray-50 rounded-lg px-3 py-2">
                              <p className="text-[0.625rem] text-gray-400 mb-0.5">MBTI</p>
                              <p className="text-sm font-medium text-gray-700">{personality.mbti}</p>
                            </div>
                          )}
                          {personality.workStyle && (
                            <div className="bg-gray-50 rounded-lg px-3 py-2">
                              <p className="text-[0.625rem] text-gray-400 mb-0.5">작업 스타일</p>
                              <p className="text-sm font-medium text-gray-700">{personality.workStyle}</p>
                            </div>
                          )}
                          {personality.communication && (
                            <div className="bg-gray-50 rounded-lg px-3 py-2">
                              <p className="text-[0.625rem] text-gray-400 mb-0.5">소통 방식</p>
                              <p className="text-sm font-medium text-gray-700">{personality.communication}</p>
                            </div>
                          )}
                        </div>
                      </section>
                    )}

                    {/* Contact */}
                    {profile.contact_email && (
                      <section>
                        <h3 className="text-[0.625rem] font-mono font-bold text-gray-400 uppercase tracking-wider mb-3">
                          연락처
                        </h3>
                        <a
                          href={`mailto:${profile.contact_email}`}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-600 transition-colors"
                        >
                          <Mail size={14} />
                          {profile.contact_email}
                        </a>
                      </section>
                    )}
                  </div>

                  {/* Footer CTA */}
                  <div className="px-6 sm:px-8 pb-6">
                    <div className="bg-surface-inverse rounded-xl p-5 text-center">
                      <Coffee size={20} className="text-txt-inverse/50 mx-auto mb-2" />
                      <p className="text-sm font-medium text-txt-inverse mb-1">커피챗으로 대화해보세요</p>
                      <p className="text-xs text-txt-inverse/50">이 사람의 프로젝트에서 커피챗을 신청할 수 있어요</p>
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
