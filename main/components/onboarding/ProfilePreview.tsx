'use client'

import React from 'react'
import { User, Building2, MapPin, Code2, Target, Sparkles, MessageCircle } from 'lucide-react'
import type { ProfileDraft, Step } from '@/src/lib/onboarding/types'
import { AFFILIATION_OPTIONS, SITUATION_OPTIONS, DEEP_CHAT_TOPICS } from '@/src/lib/onboarding/constants'

interface ProfilePreviewProps {
  profile: ProfileDraft
  step: Step
  coveredTopics: string[]
  userMsgCount: number
  hasDeepChatMessages: boolean
}

export const ProfilePreview: React.FC<ProfilePreviewProps> = ({
  profile, step, coveredTopics, userMsgCount, hasDeepChatMessages,
}) => {
  return (
    <div className="hidden xl:flex w-[21rem] flex-col bg-surface-card/50 border-l border-border backdrop-blur-sm">
      <div className="flex-1 flex flex-col items-center justify-center p-7">
        <div className="w-full">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-medium text-txt-disabled">Preview</span>
            {(profile.name || profile.position) && (
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-status-success-text animate-pulse" />
                <span className="text-[10px] font-mono text-txt-disabled">LIVE</span>
              </div>
            )}
          </div>
          <div className={`bg-surface-card border border-border-strong shadow-sharp overflow-hidden transition-all duration-500 ${profile.name ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-2'}`}>
            <div className="p-5 space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-surface-sunken border border-border-strong flex items-center justify-center text-base font-bold text-txt-disabled shrink-0">
                  {profile.name ? <span className="text-txt-primary">{profile.name[0]}</span> : <User size={20} strokeWidth={1.5} />}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <h2 className="text-base font-bold text-txt-primary leading-tight truncate">{profile.name || <span className="text-txt-disabled">닉네임</span>}</h2>
                  <p className="text-[12px] text-txt-disabled truncate mt-0.5 font-mono">{profile.position || '포지션 미설정'}</p>
                </div>
              </div>
              {(profile.university || profile.locations.length > 0) && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-txt-tertiary font-mono">
                  {profile.university && (
                    <span className="flex items-center gap-1">
                      <Building2 size={10} />
                      {profile.affiliationType !== 'student' ? `${AFFILIATION_OPTIONS.find(a => a.value === profile.affiliationType)?.label || ''} · ` : ''}
                      {profile.university}
                    </span>
                  )}
                  {profile.locations.length > 0 && (
                    <span className="flex items-center gap-1"><MapPin size={10} />{profile.locations.join(', ')}</span>
                  )}
                </div>
              )}
              {profile.situation && (
                <div className="px-3 py-2 bg-surface-sunken border border-border">
                  <p className="text-[12px] text-txt-secondary font-medium">{SITUATION_OPTIONS.find(s => s.value === profile.situation)?.label}</p>
                </div>
              )}
              {profile.skills.length > 0 && (
                <div className="pt-2 border-t border-border-subtle">
                  <label className="text-[10px] font-medium text-txt-disabled mb-1.5 flex items-center gap-1"><Code2 size={9} /> Skills</label>
                  <div className="flex flex-wrap gap-1">{profile.skills.map((s, i) => { const label = typeof s === 'string' ? s : (s as any)?.name || ''; return <span key={label || i} className="px-2 py-0.5 bg-brand text-white text-[10px] font-medium">{label}</span> })}</div>
                </div>
              )}
              {profile.interests.length > 0 && (
                <div className="pt-2 border-t border-border-subtle">
                  <label className="text-[10px] font-medium text-txt-disabled mb-1.5 flex items-center gap-1"><Target size={9} /> Interests</label>
                  <div className="flex flex-wrap gap-1">{profile.interests.map(t => <span key={t} className="px-2 py-0.5 bg-brand-bg border border-brand-border text-brand text-[10px] font-medium">{t}</span>)}</div>
                </div>
              )}
              {step === 'deep-chat' && hasDeepChatMessages && (
                <div className="pt-2 border-t border-border-subtle">
                  <label className="text-[10px] font-medium text-txt-disabled mb-2 flex items-center gap-1"><MessageCircle size={9} /> AI Analysis</label>
                  <div className="space-y-1.5">
                    {DEEP_CHAT_TOPICS.slice(0, 6).map(topic => {
                      const covered = coveredTopics.includes(topic.id)
                      const Icon = topic.icon
                      return (
                        <div key={topic.id} className="flex items-center gap-2">
                          <Icon size={10} className={covered ? 'text-brand' : 'text-txt-disabled'} />
                          <span className={`text-[10px] font-mono ${covered ? 'text-txt-primary' : 'text-txt-disabled'}`}>{topic.label}</span>
                          {covered && <div className="w-1 h-1 bg-brand ml-auto" />}
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-border-subtle">
                    <div className="w-1.5 h-1.5 bg-brand animate-pulse" />
                    <span className="text-[10px] text-txt-tertiary font-mono">{userMsgCount}회 대화 · {coveredTopics.length}개 분석</span>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-surface-inverse px-4 py-2 flex justify-between items-center">
              <span className="text-[9px] text-txt-tertiary">Draft Profile</span>
              {step === 'done' ? (
                <div className="flex items-center gap-1 text-status-success-text/70"><Sparkles size={10} fill="currentColor" /><span className="text-[10px] font-medium">Done</span></div>
              ) : step === 'deep-chat' ? (
                <div className="flex items-center gap-1 text-[#818CF8]"><MessageCircle size={10} /><span className="text-[10px] font-medium">AI Chat</span></div>
              ) : (
                <span className="text-[9px] text-txt-secondary font-mono">설정 중...</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
