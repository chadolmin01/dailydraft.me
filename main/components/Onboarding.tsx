'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useAuth } from '@/src/context/AuthContext'
import { useProfile } from '@/src/hooks/useProfile'
import { determineResumeStep } from '@/src/lib/onboarding/resume'
import { saveProfileCheckpoint } from '@/src/lib/onboarding/api'
import { AFFILIATION_OPTIONS, SITUATION_OPTIONS } from '@/src/lib/onboarding/constants'
import { POSITIONS } from '@/src/constants/roles'
import { PROJECT_CATEGORIES } from '@/src/constants/categories'
import { UNIVERSITY_LIST, LOCATION_OPTIONS } from '@/src/lib/constants/profile-options'
import type { ProfileDraft } from '@/src/lib/onboarding/types'
import { OnboardingComboBox } from './onboarding/OnboardingComboBox'

/* ─── Types ─── */

type Step = 'intro' | 'info' | 'situation' | 'position' | 'interests'
type SlideDir = 'forward' | 'back'

const PRE_INTERVIEW_STEPS: Step[] = ['info', 'situation', 'position', 'interests']

const INITIAL_PROFILE: ProfileDraft = {
  name: '', affiliationType: '', university: '', major: '',
  locations: [], position: '', situation: '', skills: [], interests: [],
}

/* ─── Skills by position ─── */

const SKILLS_BY_POSITION: Record<string, string[]> = {
  frontend:  ['React', 'Next.js', 'TypeScript', 'Vue', 'HTML/CSS', 'Tailwind'],
  backend:   ['Node.js', 'Python', 'Java', 'Go', 'SQL', 'Spring'],
  fullstack: ['React', 'Next.js', 'Node.js', 'TypeScript', 'Python', 'SQL'],
  design:    ['Figma', 'Sketch', 'Photoshop', 'Illustrator', 'Framer', 'Protopie'],
  pm:        ['Notion', 'Figma', 'Jira', 'SQL', 'GA', 'Slack'],
  marketing: ['GA', 'SQL', 'Meta Ads', 'SEO', 'Notion', 'Canva'],
  data:      ['Python', 'SQL', 'R', 'Pandas', 'Tableau', 'Spark'],
  other:     ['Notion', 'Figma', 'Slack', 'Git', 'Excel'],
}

/* ─── Step config ─── */

const STEP_CONFIG: Record<string, { title: string; hint?: string }> = {
  info:      { title: '기본 정보를 알려주세요', hint: '닉네임만 필수 · 나중에 수정 가능' },
  situation: { title: 'Draft에서 무엇을 하고 싶으세요?' },
  position:  { title: '어떤 분야에서 활동하세요?' },
  interests: { title: '관심 있는 프로젝트 분야는요?', hint: '관심사가 겹치는 팀원을 추천해드려요' },
}

/* ── Shared chip style builder ── */

function chipClass(active: boolean, size: 'sm' | 'md' = 'md', error = false) {
  const base = 'font-medium border rounded-xl transition-all duration-150'
  const pad = size === 'sm' ? 'px-3 py-2 text-[13px]' : 'px-4 py-3 text-[14px]'
  const color = active
    ? 'bg-brand text-white border-brand'
    : error
      ? 'bg-surface-card text-txt-primary border-status-danger-text/50 active:scale-[0.97]'
      : 'bg-surface-card text-txt-primary border-border active:scale-[0.97]'
  return `${base} ${pad} ${color}`
}

/* ─── Component ─── */

interface OnboardingProps {
  onComplete: (draft?: ProfileDraft) => void
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isLoading: authLoading, isAuthenticated } = useAuth()
  const { data: authProfile } = useProfile()

  const [step, setStep] = useState<Step>('intro')
  const [profile, setProfile] = useState<ProfileDraft>(INITIAL_PROFILE)
  const [slideKey, setSlideKey] = useState(0)
  const [slideDir, setSlideDir] = useState<SlideDir>('forward')
  const [attempted, setAttempted] = useState(false)

  const initRef = useRef(false)
  const profileRef = useRef(profile)
  profileRef.current = profile

  /* ── Init: auth → resume or fresh ── */
  useEffect(() => {
    if (initRef.current || authLoading) return
    if (isAuthenticated && authProfile === null) return
    initRef.current = true

    // If redo-chat mode, redirect to interview directly via profile page
    const redoChat = searchParams.get('mode') === 'redo-chat'
    if (redoChat) {
      const resumeResult = determineResumeStep(
        authProfile as Record<string, unknown> | null,
        { redoChat },
      )
      if (resumeResult) {
        setProfile(resumeResult.draft)
        setStep('info') // start fresh
        return
      }
    }
  }, [authLoading, authProfile, isAuthenticated, searchParams])

  /* ── Prefetch all onboarding SVGs (Toss-style: zero-delay rendering) ── */
  useEffect(() => {
    const svgs = [
      '/onboarding/1.svg', '/onboarding/2.svg', '/onboarding/3.svg',
      '/onboarding/4.svg', '/onboarding/5.svg', '/onboarding/6.svg',
      '/onboarding/done.svg', '/onboarding/leader_follower.svg',
      '/onboarding/add_project.svg',
    ]
    svgs.forEach(src => {
      const img = new Image()
      img.src = src
    })
  }, [])

  /* ── Navigation ── */
  const goTo = useCallback((nextStep: Step, dir: SlideDir = 'forward') => {
    setSlideDir(dir)
    setSlideKey(k => k + 1)
    setStep(nextStep)
    setAttempted(false)
  }, [])

  const stepIndex = PRE_INTERVIEW_STEPS.indexOf(step)

  const handleBack = useCallback(() => {
    if (stepIndex <= 0) goTo('intro', 'back')
    else goTo(PRE_INTERVIEW_STEPS[stepIndex - 1], 'back')
  }, [stepIndex, goTo])

  const handleNext = useCallback(() => {
    const p = profileRef.current
    setAttempted(true)

    // Validate current step
    switch (step) {
      case 'info':
        if (!p.name.trim() || p.affiliationType === '') return
        break
      case 'situation':
        if (p.situation === '') return
        break
      case 'position':
        if (p.position === '') return
        break
      case 'interests':
        if (p.interests.length === 0) return
        break
    }

    setAttempted(false)
    if (stepIndex < PRE_INTERVIEW_STEPS.length - 1) {
      goTo(PRE_INTERVIEW_STEPS[stepIndex + 1])
    } else {
      // Last step — save and pass draft to parent for interview flow
      const p = profileRef.current
      saveProfileCheckpoint(p).catch(console.error)
      onComplete(p)
    }
  }, [step, stepIndex, goTo, onComplete])

  const updateProfile = useCallback((partial: Partial<ProfileDraft>) => {
    setProfile(prev => ({ ...prev, ...partial }))
  }, [])

  /* ── Can proceed? ── */
  const canProceed = (() => {
    switch (step) {
      case 'info': return profile.name.trim().length > 0 && profile.affiliationType !== ''
      case 'situation': return profile.situation !== ''
      case 'position': return profile.position !== ''
      case 'interests': return profile.interests.length > 0
      default: return false
    }
  })()

  /* ── Error message for current step ── */
  const errorMsg = attempted && !canProceed ? (() => {
    switch (step) {
      case 'info':
        if (!profile.name.trim()) return '닉네임을 입력해주세요'
        if (profile.affiliationType === '') return '소속 유형을 선택해주세요'
        return null
      case 'situation': return '하나를 선택해주��요'
      case 'position': return '활동 분���를 선택해주세요'
      case 'interests': return '관심 분야를 1개 ���상 선택해주세요'
      default: return null
    }
  })() : null

  /* ── Auth loading ── */
  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-surface-bg flex flex-col items-center justify-center">
        <div className="w-12 h-12 bg-surface-inverse rounded-2xl flex items-center justify-center mb-8" style={{ animation: 'dcto-logo 0.6s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
          <span className="text-white text-lg font-black">D</span>
        </div>
        <div className="w-48 mb-4">
          <div className="h-1 bg-surface-sunken rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-surface-inverse rounded-full animate-[indeterminate_1.5s_ease-in-out_infinite]" />
          </div>
        </div>
        <span className="text-[10px] font-mono text-txt-disabled">DRAFT</span>
      </div>
    )
  }

  /* ── Intro screen ── */
  if (step === 'intro') {
    return (
      <div className="fixed inset-0 bg-surface-bg flex flex-col items-center justify-center p-6">
        <div className="max-w-lg w-full flex flex-col items-center">
          <img
            src="/onboarding/1.svg"
            alt="환영"
            className="w-full max-w-[280px] object-contain mb-10"
            style={{ animation: 'ob-bubble-in 0.5s cubic-bezier(0.34, 1.4, 0.64, 1) both' }}
          />
          <h2
            className="text-2xl sm:text-[28px] font-black text-txt-primary leading-tight mb-3 text-center"
            style={{ animation: 'ob-bubble-in 0.5s cubic-bezier(0.34, 1.4, 0.64, 1) 0.1s both' }}
          >
            프로필을 만들어볼까요?
          </h2>
          <p
            className="text-[15px] text-txt-secondary leading-relaxed mb-10 text-center"
            style={{ animation: 'ob-bubble-in 0.5s cubic-bezier(0.34, 1.4, 0.64, 1) 0.2s both' }}
          >
            간단한 정보와 선호도만 알려주면
            <br />
            딱 맞는 팀원을 찾아드릴게요
          </p>
          <div
            className="w-full"
            style={{ animation: 'ob-chip-in 0.35s cubic-bezier(0.34, 1.4, 0.64, 1) 0.35s both' }}
          >
            <button
              onClick={() => goTo('info')}
              className="w-full flex items-center justify-center gap-2 py-4 bg-brand text-white rounded-full text-[15px] font-black hover:opacity-90 active:scale-[0.97] transition-all"
            >
              시작하기
              <ArrowRight size={16} />
            </button>
            <p className="text-[12px] text-txt-tertiary text-center mt-3 font-mono">
              약 2분 · 간단한 선택
            </p>
          </div>
        </div>
      </div>
    )
  }

  /* ── Pre-interview steps ── */
  const config = STEP_CONFIG[step]
  const aff = AFFILIATION_OPTIONS.find(a => a.value === profile.affiliationType) || AFFILIATION_OPTIONS[0]
  const showUnivCombo = profile.affiliationType === 'student' || profile.affiliationType === 'graduate'

  return (
    <div className="fixed inset-0 bg-surface-bg flex flex-col">
      {/* ── Progress bar ── */}
      <div className="px-6 sm:px-10 pt-8 pb-4 shrink-0">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-txt-secondary hover:text-txt-primary hover:bg-surface-sunken transition-colors shrink-0"
              aria-label="이전"
            >
              <ArrowLeft size={15} />
            </button>
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-mono text-txt-secondary tabular-nums">
                {stepIndex + 1} <span className="text-txt-tertiary">/ {PRE_INTERVIEW_STEPS.length}</span>
              </span>
              <button
                onClick={() => {
                  const p = profileRef.current
                  if (p.name.trim()) {
                    saveProfileCheckpoint(p).catch(console.error)
                  }
                  router.push('/explore')
                }}
                className="text-[12px] text-txt-tertiary hover:text-txt-secondary transition-colors"
              >
                건너뛰기
              </button>
            </div>
          </div>
          <div className="flex gap-1.5">
            {PRE_INTERVIEW_STEPS.map((_, i) => {
              const isDone = i < stepIndex
              const isCurrent = i === stepIndex
              return (
                <div key={i} className="flex-1 h-[5px] rounded-full overflow-hidden bg-surface-sunken">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      isDone ? 'bg-surface-inverse w-full' : isCurrent ? 'bg-brand' : 'w-0'
                    }`}
                    style={isCurrent ? { width: '100%', animation: 'segment-fill 0.6s cubic-bezier(0.16, 1, 0.3, 1) both' } : undefined}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div
        key={slideKey}
        className={`flex-1 flex flex-col min-h-0 overflow-y-auto animate-in fade-in duration-300 ${
          slideDir === 'back' ? 'slide-in-from-left-8' : 'slide-in-from-right-8'
        }`}
      >
        <div className="max-w-2xl mx-auto w-full px-6 pt-2 pb-8 flex flex-col flex-1">
          {/* Title */}
          <h2 className="text-2xl sm:text-[28px] font-black text-txt-primary leading-snug shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {config?.title}
          </h2>
          {config?.hint && (
            <p className="text-[12px] font-medium text-txt-secondary mt-2 shrink-0 animate-in fade-in duration-300" style={{ animationDelay: '50ms' }}>
              {config.hint}
            </p>
          )}

          {/* Step content */}
          <div className="flex-1 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '60ms' }}>
            {step === 'info' && (
              <InfoContent
                profile={profile}
                aff={aff}
                showUnivCombo={showUnivCombo}
                attempted={attempted}
                onChange={updateProfile}
                onSubmit={handleNext}
              />
            )}
            {step === 'situation' && (
              <div className="space-y-2">
                {SITUATION_OPTIONS.map((sit) => (
                  <button
                    key={sit.value}
                    onClick={() => updateProfile({ situation: sit.value })}
                    className={`w-full text-left px-5 py-4 border rounded-xl transition-all duration-150 ${
                      profile.situation === sit.value
                        ? 'bg-brand border-brand'
                        : attempted && !profile.situation
                          ? 'bg-surface-card border-status-danger-text/50 active:scale-[0.99]'
                          : 'bg-surface-card border-border active:scale-[0.99]'
                    }`}
                  >
                    <div className={`text-[14px] font-bold ${profile.situation === sit.value ? 'text-white' : 'text-txt-primary'}`}>
                      {sit.label}
                    </div>
                    <div className={`text-[12px] mt-0.5 ${profile.situation === sit.value ? 'text-white/70' : 'text-txt-tertiary'}`}>
                      {sit.desc}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {step === 'position' && (
              <div>
                <div className="flex flex-wrap gap-2">
                  {POSITIONS.map((pos) => (
                    <button
                      key={pos.slug}
                      onClick={() => updateProfile({ position: pos.slug, skills: [] })}
                      className={chipClass(profile.position === pos.slug, 'md', attempted && !profile.position)}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>

                {/* Skills — revealed after position selection */}
                {profile.position && SKILLS_BY_POSITION[profile.position] && (
                  <div
                    className="mt-6"
                    style={{ animation: 'ob-reveal 0.35s cubic-bezier(0.16, 1, 0.3, 1) both' }}
                  >
                    <label className="text-[11px] font-medium text-txt-tertiary mb-2 block">
                      사용하는 기술이 있다면? (선택)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {SKILLS_BY_POSITION[profile.position].map((skill) => (
                        <button
                          key={skill}
                          onClick={() => updateProfile({
                            skills: profile.skills.includes(skill)
                              ? profile.skills.filter(s => s !== skill)
                              : [...profile.skills, skill],
                          })}
                          className={chipClass(profile.skills.includes(skill), 'sm')}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {step === 'interests' && (
              <div className="flex flex-wrap gap-2">
                {PROJECT_CATEGORIES.map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => updateProfile({
                      interests: profile.interests.includes(c.slug)
                        ? profile.interests.filter(x => x !== c.slug)
                        : [...profile.interests, c.slug],
                    })}
                    className={chipClass(profile.interests.includes(c.slug), 'md', attempted && profile.interests.length === 0)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Next button ── */}
      <div className="px-6 pb-8 pt-2 shrink-0">
        <div className="max-w-2xl mx-auto">
          {errorMsg && (
            <p className="text-[12px] text-status-danger-text text-center mb-2 font-medium animate-in fade-in slide-in-from-bottom-1 duration-200">
              {errorMsg}
            </p>
          )}
          <button
            onClick={handleNext}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-full text-[14px] font-black transition-all duration-200 active:scale-[0.97] ${
              canProceed
                ? 'bg-surface-inverse text-white hover:opacity-90'
                : 'bg-surface-sunken text-txt-disabled'
            }`}
          >
            다음으로
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Info Form ─── */

const INPUT_CLASS = 'w-full px-4 py-3 bg-surface-card rounded-xl border border-border text-[14px] font-medium text-txt-primary focus:outline-none focus:border-surface-inverse transition-colors placeholder:text-txt-tertiary'

function InfoContent({
  profile, aff, showUnivCombo, attempted, onChange, onSubmit,
}: {
  profile: ProfileDraft
  aff: (typeof AFFILIATION_OPTIONS)[number]
  showUnivCombo: boolean
  attempted: boolean
  onChange: (partial: Partial<ProfileDraft>) => void
  onSubmit: () => void
}) {
  const nameEmpty = attempted && !profile.name.trim()
  // 소속 유형 버튼을 클릭한 적 있는지 추적
  const [affTouched, setAffTouched] = useState(false)
  const showDetails = affTouched

  return (
    <div className="space-y-5">
      {/* Name */}
      <div>
        <label className="text-[11px] font-medium text-txt-tertiary mb-2 block">닉네임 *</label>
        <div className="relative">
          <input
            type="text"
            value={profile.name}
            onChange={(e) => onChange({ name: e.target.value.slice(0, 7) })}
            maxLength={7}
            placeholder="어떻게 불러드릴까요?"
            className={`${INPUT_CLASS} ${nameEmpty ? '!border-status-danger-text' : ''}`}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-txt-disabled">
            {profile.name.length}/7
          </span>
        </div>
        {nameEmpty && <p className="text-[11px] text-status-danger-text mt-1 font-medium">닉네임을 입력해주세요</p>}
      </div>

      {/* Affiliation type — always visible */}
      <div>
        <label className="text-[11px] font-medium text-txt-tertiary mb-2 block">소속 유형</label>
        <div className="flex flex-wrap gap-1.5">
          {AFFILIATION_OPTIONS.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => { onChange({ affiliationType: a.value }); setAffTouched(true) }}
              className={chipClass(profile.affiliationType === a.value, 'sm')}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* University + Major + Location — revealed after affiliation button click */}
      {showDetails && (
        <div
          className="space-y-5"
          style={{ animation: 'ob-reveal 0.35s cubic-bezier(0.16, 1, 0.3, 1) both' }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-txt-tertiary mb-2 block">
                {aff.orgPlaceholder === '대학교' ? '소속' : aff.orgPlaceholder.replace(' (선택)', '')}
              </label>
              {showUnivCombo ? (
                <OnboardingComboBox
                  value={profile.university}
                  onChange={(v) => onChange({ university: v })}
                  options={UNIVERSITY_LIST}
                  placeholder={aff.orgPlaceholder}
                />
              ) : (
                <input
                  type="text"
                  value={profile.university}
                  onChange={(e) => onChange({ university: e.target.value })}
                  placeholder={aff.orgPlaceholder}
                  className={INPUT_CLASS}
                />
              )}
            </div>
            <div>
              <label className="text-[11px] font-medium text-txt-tertiary mb-2 block">
                {aff.rolePlaceholder.replace(' (선택)', '')}
              </label>
              <input
                type="text"
                value={profile.major}
                onChange={(e) => onChange({ major: e.target.value })}
                placeholder={aff.rolePlaceholder}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-txt-tertiary mb-2 block">활동 지역</label>
            <div className="flex flex-wrap gap-1.5">
              {LOCATION_OPTIONS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => onChange({
                    locations: profile.locations.includes(loc)
                      ? profile.locations.filter(l => l !== loc)
                      : [...profile.locations, loc],
                  })}
                  className={chipClass(profile.locations.includes(loc), 'sm')}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

