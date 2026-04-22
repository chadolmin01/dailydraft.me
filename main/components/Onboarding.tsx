'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, CheckCircle2, Check } from 'lucide-react'
import { useAuth } from '@/src/context/AuthContext'
import { useProfile } from '@/src/hooks/useProfile'
import { determineResumeStep } from '@/src/lib/onboarding/resume'
import { saveProfileCheckpoint } from '@/src/lib/onboarding/api'
import { AFFILIATION_OPTIONS, SITUATION_OPTIONS, SOURCE_OPTIONS } from '@/src/lib/onboarding/constants'
import { POSITIONS } from '@/src/constants/roles'
import { PROJECT_CATEGORIES } from '@/src/constants/categories'
import { UNIVERSITY_LIST, LOCATION_OPTIONS } from '@/src/lib/constants/profile-options'
import {
  parseEntranceYearFromStudentId,
  isValidStudentIdFormat,
} from '@/src/lib/universities'
import type { ProfileDraft } from '@/src/lib/onboarding/types'
import { OnboardingComboBox } from './onboarding/OnboardingComboBox'
import {
  loadDraftLocal,
  pruneStaleDraft,
  hasMeaningfulDraft,
  clearDraftLocal,
} from '@/src/lib/onboarding/draft-storage'
import { useOnboardingAutoSave } from '@/src/hooks/useOnboardingAutoSave'
import { trackOnboardingEvent, createStepTimer } from '@/src/lib/onboarding/analytics'
import { friendlyErrorMessage, OnboardingError } from '@/src/lib/onboarding/api'

/**
 * 이메일 기반 대학 매칭 결과.
 * university가 있으면 "인증 완료" 상태로 간주 → university 필드 readonly + 학번 입력 필드 노출.
 */
interface UniversityMatchState {
  loading: boolean
  isAcademic: boolean
  domain: string | null
  university: {
    id: string
    name: string
    short_name: string | null
  } | null
}

/* ─── Types ─── */

type Step = 'intro' | 'source' | 'info' | 'situation' | 'position' | 'interests'
type SlideDir = 'forward' | 'back'

// 경로별 단계 순서:
//   invite/operator/exploring → info 만 받고 완료 (situation/position/interests 스킵)
//   matching → 기존 전체 (info → situation → position → interests)
// STEPS 배열은 동적으로 계산 — buildStepsForSource 참고.
const ALL_POST_SOURCE_STEPS: Step[] = ['info', 'situation', 'position', 'interests']

function buildStepsForSource(source: ProfileDraft['source']): Step[] {
  if (source === 'matching') return ['info', 'situation', 'position', 'interests']
  // invite / operator / exploring 은 info 만
  return ['info']
}

const INITIAL_PROFILE: ProfileDraft = {
  name: '', affiliationType: '', university: '', major: '',
  locations: [], position: '', situation: '', skills: [], interests: [],
  source: undefined, inviteCode: undefined,
  studentId: '', department: '', universityId: '', entranceYear: undefined,
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
  info:      { title: '기본 정보를 알려 주세요', hint: '닉네임만 필수 입력이며, 나머지는 언제든 프로필에서 수정하실 수 있습니다.' },
  situation: { title: '프로젝트 쪽에서는 무엇을 하실 예정인가요?', hint: '답변에 따라 추천 프로젝트와 랜딩 화면이 달라집니다.' },
  position:  { title: '어떤 분야에서 활동하시나요?', hint: '선택하신 분야에 맞춰 관련 기술 스택을 추천해 드립니다.' },
  interests: { title: '관심 있는 프로젝트 분야는 어느 쪽인가요?', hint: '관심사가 겹치는 사람·프로젝트를 우선 보여 드립니다.' },
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
  // 복구 제안 배너 — 로컬 스냅샷 발견 시 "이어서 작성하시겠습니까?" 노출
  const [recoveryOffer, setRecoveryOffer] = useState<ProfileDraft | null>(null)

  const initRef = useRef(false)
  const profileRef = useRef(profile)
  profileRef.current = profile
  // 단계 체류 시간 측정기 (퍼널 이탈 분석용)
  const timerRef = useRef(createStepTimer())

  // 2초 debounce 로 로컬 자동 저장. 단계 이동 직전엔 flush() 로 즉시 저장.
  const autoSave = useOnboardingAutoSave(profile, { step }, { debounceMs: 1500, minNameLength: 1 })

  /* 단계 진입 시 step_viewed 이벤트 + 타이머 시작 */
  useEffect(() => {
    if (step === 'intro') return
    trackOnboardingEvent('onboarding_step_viewed', { step, source: profile.source ?? null })
    timerRef.current.begin(step)
  }, [step, profile.source])

  /* ── Init: auth → resume or fresh ── */
  useEffect(() => {
    if (initRef.current || authLoading) return
    if (isAuthenticated && authProfile === null) return
    initRef.current = true

    // 7일 이상 오래된 스냅샷은 자동 폐기 (신뢰 불가)
    pruneStaleDraft()

    // If redo-chat mode, redirect to interview directly via profile page
    const redoChat = searchParams.get('mode') === 'redo-chat'
    if (redoChat) {
      const resumeResult = determineResumeStep(
        authProfile as Record<string, unknown> | null,
        { redoChat },
      )
      if (resumeResult) {
        setProfile({ ...resumeResult.draft, source: 'matching' })
        setStep('info') // start fresh
        return
      }
    }

    // 초대 코드 URL 파라미터 감지 — ?code=ABC12DEF 또는 ?source=invite
    // source 단계를 자동으로 'invite' 로 prefill 하고 코드는 이후 클럽 가입 플로우로.
    const code = searchParams.get('code')
    const sourceHint = searchParams.get('source')
    if (code) {
      setProfile(prev => ({ ...prev, source: 'invite', inviteCode: code }))
      return
    }
    if (sourceHint === 'invite' || sourceHint === 'matching' || sourceHint === 'operator' || sourceHint === 'exploring') {
      setProfile(prev => ({ ...prev, source: sourceHint }))
      return
    }

    // 로컬 스냅샷이 있으면 "이어서 작성" 제안 (URL 파라미터·redo 없는 경우만)
    const stored = loadDraftLocal()
    if (stored && hasMeaningfulDraft(stored.draft)) {
      setRecoveryOffer(stored.draft)
      trackOnboardingEvent('onboarding_recovery_offered', {
        source: stored.draft.source ?? null,
      })
    }
  }, [authLoading, authProfile, isAuthenticated, searchParams])

  /* 복구 제안 수락 — 저장된 draft 를 현재 state 에 복원하고 적절한 단계로 점프 */
  const acceptRecovery = useCallback(() => {
    if (!recoveryOffer) return
    trackOnboardingEvent('onboarding_recovery_accepted', {
      source: recoveryOffer.source ?? null,
    })
    setProfile(recoveryOffer)
    // 복원된 source 가 있으면 source 이후 단계로, 없으면 source 단계로
    if (!recoveryOffer.source) {
      setStep('source')
    } else if (!recoveryOffer.name?.trim()) {
      setStep('info')
    } else if (recoveryOffer.source === 'matching' && !recoveryOffer.situation) {
      setStep('situation')
    } else if (recoveryOffer.source === 'matching' && !recoveryOffer.position) {
      setStep('position')
    } else if (recoveryOffer.source === 'matching' && recoveryOffer.interests.length === 0) {
      setStep('interests')
    } else {
      setStep('info')
    }
    setRecoveryOffer(null)
  }, [recoveryOffer])

  const declineRecovery = useCallback(() => {
    trackOnboardingEvent('onboarding_recovery_declined')
    clearDraftLocal()
    setRecoveryOffer(null)
  }, [])

  /* ── Prefetch all onboarding SVGs (Toss-style: zero-delay rendering) ── */
  useEffect(() => {
    const svgs = [
      '/onboarding/1.svg', '/onboarding/2.svg', '/onboarding/3.svg',
      '/onboarding/4.svg', '/onboarding/5.svg', '/onboarding/6.svg',
      '/onboarding/done.svg', '/onboarding/leader_follower.svg',
      '/onboarding/add_project.svg',
    ]
    svgs.forEach(src => {
      // next/image 가 ./onboarding/* 를 자체 최적화하지만, 다음 스텝 전환 시의
      // 즉시 렌더를 위해 브라우저 캐시에 미리 적재. window.Image 로 next/image 와 이름 충돌 회피.
      const preload = new window.Image()
      preload.src = src
    })
  }, [])

  /* ── Navigation ── */
  const goTo = useCallback((nextStep: Step, dir: SlideDir = 'forward') => {
    setSlideDir(dir)
    setSlideKey(k => k + 1)
    setStep(nextStep)
    setAttempted(false)
  }, [])

  // 현재 source 기반 동적 스텝 배열 (matching 만 4단계, 나머지는 info 1단계)
  const activeSteps = buildStepsForSource(profile.source)
  const stepIndex = activeSteps.indexOf(step as Step)

  const handleBack = useCallback(() => {
    trackOnboardingEvent('onboarding_step_back', { step, source: profileRef.current.source ?? null })
    // source 단계에서 뒤로 가면 intro, info 단계에서 뒤로 가면 source
    if (step === 'source') goTo('intro', 'back')
    else if (step === 'info') goTo('source', 'back')
    else if (stepIndex > 0) goTo(activeSteps[stepIndex - 1], 'back')
    else goTo('source', 'back')
  }, [step, stepIndex, activeSteps, goTo])

  const handleNext = useCallback(() => {
    const p = profileRef.current
    setAttempted(true)

    // Validate current step
    switch (step) {
      case 'source':
        if (!p.source) return
        break
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

    // 체류 시간 측정 종료 + 이벤트 전송
    const durationMs = timerRef.current.end(step) ?? undefined
    trackOnboardingEvent('onboarding_step_completed', {
      step,
      source: p.source ?? null,
      durationMs,
    })

    // source 선택 직후 → activeSteps 첫 단계 (보통 'info')
    if (step === 'source') {
      trackOnboardingEvent('onboarding_source_chosen', {
        source: p.source ?? null,
        durationMs,
      })
      const next = buildStepsForSource(p.source)[0]
      goTo(next)
      return
    }

    // 단계 이동 직전 로컬 스냅샷 강제 flush (다음 단계로 가는 중 탭 닫혀도 복구 가능)
    autoSave.flush()

    if (stepIndex < activeSteps.length - 1) {
      goTo(activeSteps[stepIndex + 1])
    } else {
      // Last step — save and pass draft to parent
      // matching 이 아니면 situation 기본값을 'exploring' 으로 (매칭 경로 아니라도 GuideCTA 가 뭔가 보여줘야 함)
      if (p.source !== 'matching' && !p.situation) {
        p.situation = 'exploring'
      }
      // 서버 저장은 fire-and-forget, 성공 시 로컬 스냅샷 정리
      saveProfileCheckpoint(p)
        .then(() => clearDraftLocal())
        .catch((err) => {
          console.error(err)
          trackOnboardingEvent('onboarding_error', {
            step,
            source: p.source ?? null,
            errorKind: err instanceof OnboardingError ? err.kind : 'unknown',
          })
        })
      onComplete(p)
    }
  }, [step, stepIndex, activeSteps, goTo, onComplete, autoSave])

  const updateProfile = useCallback((partial: Partial<ProfileDraft>) => {
    setProfile(prev => ({ ...prev, ...partial }))
  }, [])

  /* ── Can proceed? ── */
  const canProceed = (() => {
    switch (step) {
      case 'source': return !!profile.source
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
      case 'source': return '어떻게 오셨는지 하나 선택해 주세요'
      case 'info':
        if (!profile.name.trim()) return '닉네임을 입력해 주세요'
        if (profile.affiliationType === '') return '소속 유형을 선택해 주세요'
        return null
      case 'situation': return '하나를 선택해 주세요'
      case 'position': return '활동 분야를 선택해 주세요'
      case 'interests': return '관심 분야를 1개 이상 선택해 주세요'
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

  /* ── Recovery banner (이전 입력 복구 제안) ── */
  if (recoveryOffer) {
    return (
      <RecoveryOffer
        draft={recoveryOffer}
        onResume={acceptRecovery}
        onDiscard={declineRecovery}
      />
    )
  }

  /* ── Intro screen ── */
  if (step === 'intro') {
    return <IntroScreen onStart={() => goTo('source')} />
  }

  /* ── Source step (유입 경로 선택) ── */
  if (step === 'source') {
    return (
      <SourceStep
        selected={profile.source}
        onSelect={(src) => updateProfile({ source: src })}
        onBack={handleBack}
        onNext={handleNext}
        errorMsg={errorMsg}
      />
    )
  }

  /* ── Pre-interview steps ── */
  const config = STEP_CONFIG[step]
  const aff = AFFILIATION_OPTIONS.find(a => a.value === profile.affiliationType) || AFFILIATION_OPTIONS[0]
  const showUnivCombo = profile.affiliationType === 'student' || profile.affiliationType === 'graduate'

  // 키보드 Enter 로 단계 진행 (textarea·input 에서는 기본 동작 유지).
  // Esc 로 뒤로 가기. 유저 입력 중에는 방해되지 않도록 target 검사.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    const inTextField =
      target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
    if (e.key === 'Enter' && !e.shiftKey && canProceed && !inTextField) {
      e.preventDefault()
      handleNext()
    } else if (e.key === 'Enter' && inTextField && target.tagName === 'INPUT' && canProceed) {
      // 일반 input 에서 Enter 도 진행 (textarea 는 줄바꿈 유지)
      e.preventDefault()
      handleNext()
    }
  }

  return (
    <div
      role="form"
      aria-label={`온보딩 — ${config?.title ?? ''}`}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 bg-surface-bg flex flex-col"
    >
      {/* 단계 변경 시 스크린리더 공지 (본 컨텐츠 위에 시각 숨김) */}
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {config?.title ? `${stepIndex + 1}단계 중 ${activeSteps.length}단계: ${config.title}` : ''}
      </span>
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
              <SaveIndicator status={autoSave.status} />
              <span className="text-[12px] font-mono text-txt-secondary tabular-nums">
                {stepIndex + 1} <span className="text-txt-tertiary">/ {activeSteps.length}</span>
              </span>
              <button
                onClick={() => {
                  const p = profileRef.current
                  trackOnboardingEvent('onboarding_step_skipped', {
                    step,
                    source: p.source ?? null,
                  })
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
            {activeSteps.map((_, i) => {
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
        className={`flex-1 flex flex-col min-h-0 overflow-y-auto ${
          slideDir === 'back' ? 'ob-slide-back' : 'ob-slide-forward'
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

const INPUT_CLASS = 'w-full px-4 py-3 bg-surface-card rounded-xl border border-border text-[14px] font-medium text-txt-primary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors placeholder:text-txt-tertiary'

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
  const { user } = useAuth()
  const nameEmpty = attempted && !profile.name.trim()
  // 소속 유형 버튼을 클릭한 적 있는지 추적
  const [affTouched, setAffTouched] = useState(false)
  const showDetails = affTouched

  // ── Phase 1-a: 이메일 도메인 → 대학 자동 감지 ──
  // 의도: 로그인한 이메일이 @ac.kr 이면 universities 테이블에서 매칭된 대학 자동 세팅.
  // 매칭되면 university 필드 readonly + 학번/학과 입력 표시. 매칭 안 되면 기존 ComboBox 로직 fallback.
  // 한 번만 실행 (이메일 바뀌는 일 없음), 실패해도 일반 플로우 동작.
  const [matchState, setMatchState] = useState<UniversityMatchState>({
    loading: false,
    isAcademic: false,
    domain: null,
    university: null,
  })
  const matchFetchedRef = useRef(false)

  useEffect(() => {
    if (matchFetchedRef.current) return
    const email = user?.email
    if (!email) return
    matchFetchedRef.current = true

    setMatchState(s => ({ ...s, loading: true }))
    fetch(`/api/universities/by-email?email=${encodeURIComponent(email)}`)
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        const payload = json?.data ?? json
        const univ = payload?.university ?? null
        setMatchState({
          loading: false,
          isAcademic: !!payload?.isAcademic,
          domain: payload?.domain ?? null,
          university: univ,
        })
        // 매칭되면 자동으로 profile에 주입. 사용자가 졸업생/현직자로 바꾸면 affiliation만 변경,
        // university_id는 남아도 서버에서 affiliation_type에 따라 해석.
        if (univ && !profile.university) {
          onChange({
            affiliationType: 'student',
            university: univ.name,
            universityId: univ.id,
          })
          setAffTouched(true)
        }
      })
      .catch(() => {
        setMatchState(s => ({ ...s, loading: false }))
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email])

  const verified = !!matchState.university
  const isStudent = profile.affiliationType === 'student' || profile.affiliationType === 'graduate'
  const showStudentFields = verified && isStudent

  const studentIdError = attempted && showStudentFields && profile.studentId
    ? !isValidStudentIdFormat(profile.studentId) : false

  const handleStudentIdChange = (raw: string) => {
    // 숫자만 허용, 10자리 제한 (학번 형식)
    const clean = raw.replace(/\D/g, '').slice(0, 10)
    const entranceYear = parseEntranceYearFromStudentId(clean) ?? undefined
    onChange({ studentId: clean, entranceYear })
  }

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
            autoComplete="nickname"
            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-txt-disabled">
            {profile.name.length}/7
          </span>
        </div>
        {nameEmpty && <p className="text-[11px] text-status-danger-text mt-1 font-medium">닉네임을 입력해 주세요</p>}
      </div>

      {/* University verified banner — 이메일 매칭 시 노출 */}
      {verified && matchState.university && (
        <div className="flex items-center gap-2 px-4 py-3 bg-brand/5 border border-brand/20 rounded-xl">
          <CheckCircle2 size={16} className="text-brand shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-txt-primary">
              {matchState.university.name} 재학생으로 확인되었습니다
            </div>
            <div className="text-[11px] text-txt-tertiary mt-0.5">
              학교 이메일({matchState.domain})로 인증됨
            </div>
          </div>
        </div>
      )}

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
              {verified && isStudent ? (
                // 이메일 인증 완료: 매칭된 대학을 readonly로 표시
                <div className={`${INPUT_CLASS} !bg-surface-sunken !text-txt-secondary flex items-center`}>
                  {matchState.university?.name ?? profile.university}
                </div>
              ) : showUnivCombo ? (
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
                onChange={(e) => onChange({ major: e.target.value, department: e.target.value })}
                placeholder={aff.rolePlaceholder}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {/* 학번 — 이메일 인증된 학생/졸업생에게만 노출 (B2B 리포팅용) */}
          {showStudentFields && (
            <div>
              <label className="text-[11px] font-medium text-txt-tertiary mb-2 block">
                학번 <span className="text-txt-disabled">(선택 · 기관 리포트에 사용)</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={profile.studentId ?? ''}
                onChange={(e) => handleStudentIdChange(e.target.value)}
                placeholder="예: 2023123456"
                className={`${INPUT_CLASS} ${studentIdError ? '!border-status-danger-text' : ''}`}
              />
              {profile.entranceYear && (
                <p className="text-[11px] text-txt-tertiary mt-1">
                  {profile.entranceYear}학번으로 인식했습니다
                </p>
              )}
              {studentIdError && (
                <p className="text-[11px] text-status-danger-text mt-1 font-medium">
                  학번은 숫자 6~10자리로 입력해 주세요
                </p>
              )}
            </div>
          )}

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

/* ─── Intro Screen with Consent Gate ─── */

/**
 * 온보딩 첫 화면 — 약관·개인정보 동의 체크박스 UI.
 * PIPA 상 "명시적 동의" 요구 → 필수 3종 체크해야 "시작하기" 활성화.
 * 선택 2종은 체크 안 해도 진행 가능 (마케팅/통계 제공).
 *
 * 동의 상태는 saveProfileCheckpoint 시점에 data_consent=true + data_consent_at=now() 로 기록.
 * 선택 동의(marketing, institution_share)는 저장 안 함 — 현재 스키마에 별도 컬럼 없음.
 * 필요 시 후속 마이그레이션에서 consent_marketing / consent_institution_share 추가.
 */
interface ConsentState {
  terms: boolean
  privacy: boolean
  ageOver14: boolean
  marketing: boolean
  institutionShare: boolean
}

const INITIAL_CONSENT: ConsentState = {
  terms: false,
  privacy: false,
  ageOver14: false,
  marketing: false,
  institutionShare: false,
}

function IntroScreen({ onStart }: { onStart: () => void }) {
  const [consent, setConsent] = useState<ConsentState>(INITIAL_CONSENT)
  const allRequired = consent.terms && consent.privacy && consent.ageOver14
  const allChecked = Object.values(consent).every(Boolean)

  const toggle = useCallback((key: keyof ConsentState) => {
    setConsent(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const toggleAll = useCallback(() => {
    const next = !allChecked
    setConsent({
      terms: next,
      privacy: next,
      ageOver14: next,
      marketing: next,
      institutionShare: next,
    })
  }, [allChecked])

  return (
    <div className="fixed inset-0 bg-surface-bg flex flex-col items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-lg w-full flex flex-col items-center py-8">
        <Image
          src="/onboarding/1.svg"
          alt="환영"
          width={220}
          height={220}
          priority
          className="w-full max-w-[220px] h-auto object-contain mb-6"
          style={{ animation: 'ob-bubble-in 0.5s cubic-bezier(0.34, 1.4, 0.64, 1) both' }}
        />
        <h2
          className="text-2xl sm:text-[26px] font-black text-txt-primary leading-tight mb-2 text-center"
          style={{ animation: 'ob-bubble-in 0.5s cubic-bezier(0.34, 1.4, 0.64, 1) 0.1s both' }}
        >
          Draft 에 오신 것을 환영합니다
        </h2>
        <p
          className="text-[14px] text-txt-secondary leading-relaxed mb-6 text-center break-keep max-w-sm"
          style={{ animation: 'ob-bubble-in 0.5s cubic-bezier(0.34, 1.4, 0.64, 1) 0.2s both' }}
        >
          Draft 는 동아리·프로젝트의 운영 기록을 쌓는 공간입니다. 시작하시기 전에 아래 필수 약관을 확인하고 동의해 주세요.
        </p>

        {/* 전체 동의 */}
        <div
          className="w-full mb-3"
          style={{ animation: 'ob-chip-in 0.35s cubic-bezier(0.34, 1.4, 0.64, 1) 0.3s both' }}
        >
          <ConsentRow
            checked={allChecked}
            onToggle={toggleAll}
            label="전체 동의"
            emphasis
          />
        </div>

        {/* 개별 동의 */}
        <div
          className="w-full space-y-2 mb-6 border-t border-border pt-3"
          style={{ animation: 'ob-chip-in 0.35s cubic-bezier(0.34, 1.4, 0.64, 1) 0.4s both' }}
        >
          <ConsentRow
            checked={consent.ageOver14}
            onToggle={() => toggle('ageOver14')}
            label="만 14세 이상입니다"
            required
          />
          <ConsentRow
            checked={consent.terms}
            onToggle={() => toggle('terms')}
            label="서비스 이용약관에 동의합니다"
            required
            link={{ href: '/terms', label: '전문 보기' }}
          />
          <ConsentRow
            checked={consent.privacy}
            onToggle={() => toggle('privacy')}
            label="개인정보 수집·이용에 동의합니다"
            required
            link={{ href: '/privacy', label: '전문 보기' }}
          />
          <ConsentRow
            checked={consent.institutionShare}
            onToggle={() => toggle('institutionShare')}
            label="소속 기관(대학/동아리)에 참여 현황 공유"
            hint="선택 · 운영진 리포트 생성에 사용됩니다"
          />
          <ConsentRow
            checked={consent.marketing}
            onToggle={() => toggle('marketing')}
            label="마케팅 정보 수신"
            hint="선택 · 새 기능·이벤트 뉴스레터"
          />
        </div>

        <div
          className="w-full"
          style={{ animation: 'ob-chip-in 0.35s cubic-bezier(0.34, 1.4, 0.64, 1) 0.5s both' }}
        >
          <button
            onClick={onStart}
            disabled={!allRequired}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-full text-[15px] font-black transition-all ${
              allRequired
                ? 'bg-brand text-white hover:opacity-90 active:scale-[0.97]'
                : 'bg-surface-sunken text-txt-disabled cursor-not-allowed'
            }`}
          >
            시작하기
            <ArrowRight size={16} />
          </button>
          <p className="text-[11px] text-txt-tertiary text-center mt-3">
            필수 항목 3개에 동의하시면 진행할 수 있습니다
          </p>
        </div>
      </div>
    </div>
  )
}

interface ConsentRowProps {
  checked: boolean
  onToggle: () => void
  label: string
  required?: boolean
  emphasis?: boolean
  hint?: string
  link?: { href: string; label: string }
}

/* ─── Source Step (유입 경로 선택) ─── */
// 2026-04-23 도입. Draft 는 개인 매칭이 주력이 아니라 클럽 운영 중심 인프라이므로
// "어떻게 오셨어요?" 를 첫 질문으로 두고 이후 단계를 분기한다.
// invite → info 만 묻고 클럽 가입으로
// matching → 기존 4단계 (info → situation → position → interests)
// operator → info 만 묻고 /clubs/new 유도
// exploring → info 만 받고 /explore 로

interface SourceStepProps {
  selected: ProfileDraft['source']
  onSelect: (source: ProfileDraft['source']) => void
  onBack: () => void
  onNext: () => void
  errorMsg: string | null
}

function SourceStep({ selected, onSelect, onBack, onNext, errorMsg }: SourceStepProps) {
  // 방향키로 옵션 이동, 숫자 1~4 로 바로 선택, Enter 로 진행
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIdx = SOURCE_OPTIONS.findIndex(o => o.value === selected)
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      const next = currentIdx < 0 ? 0 : (currentIdx + 1) % SOURCE_OPTIONS.length
      onSelect(SOURCE_OPTIONS[next].value)
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const next = currentIdx < 0 ? SOURCE_OPTIONS.length - 1 : (currentIdx - 1 + SOURCE_OPTIONS.length) % SOURCE_OPTIONS.length
      onSelect(SOURCE_OPTIONS[next].value)
    } else if (/^[1-4]$/.test(e.key)) {
      const idx = parseInt(e.key, 10) - 1
      if (SOURCE_OPTIONS[idx]) {
        onSelect(SOURCE_OPTIONS[idx].value)
      }
    } else if (e.key === 'Enter' && selected) {
      e.preventDefault()
      onNext()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onBack()
    }
  }
  return (
    <div
      role="radiogroup"
      aria-label="Draft 에 오신 경로"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      className="fixed inset-0 bg-surface-bg flex flex-col"
    >
      <div className="px-6 sm:px-10 pt-8 pb-4 shrink-0">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-txt-secondary hover:text-txt-primary hover:bg-surface-sunken transition-colors shrink-0"
              aria-label="이전 화면으로"
            >
              <ArrowLeft size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 sm:px-10 pb-40">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-[22px] sm:text-[26px] font-bold text-txt-primary mb-2 leading-tight">
            Draft 에 어떻게 오셨어요?
          </h2>
          <p className="text-[13px] text-txt-tertiary mb-3 leading-relaxed">
            여기에 맞춰 이후 질문 개수와 랜딩 화면이 달라집니다. 나중에도 언제든 프로필에서 바꾸실 수 있습니다.
          </p>
          <details className="mb-5 group">
            <summary className="text-[11px] text-txt-tertiary cursor-pointer hover:text-txt-secondary transition-colors inline-flex items-center gap-1 list-none">
              <span className="group-open:rotate-90 transition-transform inline-block">▸</span>
              왜 이걸 먼저 물어보나요?
            </summary>
            <p className="text-[11px] text-txt-tertiary mt-2 pl-3.5 leading-relaxed break-keep">
              Draft 는 개인 프로필 플랫폼이 아니라 동아리·프로젝트의 운영 기록을 쌓는 도구입니다. 어떤 목적으로 오셨는지에 따라 필요한 정보가 많이 달라서, 불필요한 질문을 건너뛰려고 먼저 여쭙습니다.
            </p>
          </details>

          <div className="space-y-2.5">
            {SOURCE_OPTIONS.map((opt, i) => {
              const active = selected === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={`${i + 1}번: ${opt.label}. ${opt.desc}`}
                  onClick={() => onSelect(opt.value)}
                  style={{
                    animation: `ob-chip-in 0.35s cubic-bezier(0.34, 1.4, 0.64, 1) ${i * 50}ms both`,
                  }}
                  className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                    active
                      ? 'bg-brand text-white border-brand shadow-md scale-[1.015]'
                      : 'bg-surface-card text-txt-primary border-border hover:border-txt-tertiary hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.99]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-[22px] leading-none mt-0.5" aria-hidden="true">
                      {opt.emoji}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[14px] font-bold ${active ? 'text-white' : 'text-txt-primary'}`}>
                        {opt.label}
                      </p>
                      <p
                        className={`text-[12px] mt-1 leading-relaxed ${
                          active ? 'text-white/85' : 'text-txt-tertiary'
                        }`}
                      >
                        {opt.desc}
                      </p>
                    </div>
                    {active && (
                      <Check size={16} className="text-white shrink-0 mt-1" strokeWidth={2.5} />
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {errorMsg && (
            <p className="text-[12px] text-status-danger-text mt-4 font-medium" role="alert">{errorMsg}</p>
          )}

          {/* 데스크톱 키보드 힌트 — 모바일에선 안 보임 */}
          <p className="hidden md:block text-[11px] text-txt-tertiary mt-6 leading-relaxed">
            <kbd className="px-1.5 py-0.5 bg-surface-sunken rounded border border-border font-mono text-[10px]">1~4</kbd>{' '}
            숫자로 빠르게 선택,{' '}
            <kbd className="px-1.5 py-0.5 bg-surface-sunken rounded border border-border font-mono text-[10px]">↑↓</kbd>{' '}
            이동,{' '}
            <kbd className="px-1.5 py-0.5 bg-surface-sunken rounded border border-border font-mono text-[10px]">Enter</kbd>{' '}
            진행
          </p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-surface-bg border-t border-border px-6 sm:px-10 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-2xl mx-auto">
          <button
            type="button"
            onClick={onNext}
            disabled={!selected}
            aria-label={selected ? '다음 단계로 이동' : '먼저 경로를 선택하시면 활성화됩니다'}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-full text-[15px] font-black transition-all ${
              selected
                ? 'bg-surface-inverse text-txt-inverse hover:opacity-90 active:scale-[0.97]'
                : 'bg-surface-sunken text-txt-disabled cursor-not-allowed'
            }`}
          >
            다음
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Save Indicator (자동 저장 상태 표시) ─── */
// progress bar 옆 미니 배지. "저장 중 / 저장됨 / 오류" 를 조용히 보여 줌.
function SaveIndicator({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' }) {
  if (status === 'idle') return null
  if (status === 'saving') {
    return (
      <span
        className="hidden sm:inline-flex items-center gap-1 text-[10px] text-txt-tertiary"
        title="입력하신 내용을 기기에 저장 중입니다"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-txt-tertiary animate-pulse" />
        저장 중
      </span>
    )
  }
  if (status === 'saved') {
    return (
      <span
        className="hidden sm:inline-flex items-center gap-1 text-[10px] text-brand"
        title="브라우저를 닫으셔도 내용이 유지됩니다"
      >
        <Check size={10} strokeWidth={2.5} />
        저장됨
      </span>
    )
  }
  return (
    <span
      className="hidden sm:inline-flex items-center gap-1 text-[10px] text-status-danger-text"
      title="기기 저장 실패. 서버에는 단계 이동 시 저장됩니다"
    >
      ⚠ 저장 실패
    </span>
  )
}

/* ─── Recovery Offer (이전 작성 이어쓰기 제안) ─── */
// localStorage 에 의미 있는 draft 가 있을 때 intro 대신 먼저 노출.
// "계속 작성하기 / 새로 시작하기" 두 선택지.
interface RecoveryOfferProps {
  draft: ProfileDraft
  onResume: () => void
  onDiscard: () => void
}

function RecoveryOffer({ draft, onResume, onDiscard }: RecoveryOfferProps) {
  const filled: string[] = []
  if (draft.name?.trim()) filled.push(`닉네임 "${draft.name.trim()}"`)
  if (draft.source) {
    const src = SOURCE_OPTIONS.find(s => s.value === draft.source)
    if (src) filled.push(src.label.replace(/ 왔습니다$|이시다면$/, ''))
  }
  if (draft.position) filled.push('활동 분야')
  if (draft.interests.length > 0) filled.push(`관심 분야 ${draft.interests.length}개`)
  if (draft.skills.length > 0) filled.push(`스킬 ${draft.skills.length}개`)

  return (
    <div className="fixed inset-0 bg-surface-bg flex flex-col items-center justify-center p-6">
      <div
        className="max-w-md w-full bg-surface-card border border-border rounded-3xl shadow-xl p-6 sm:p-8"
        style={{ animation: 'ob-bubble-in 0.4s cubic-bezier(0.34, 1.4, 0.64, 1) both' }}
      >
        <div className="w-12 h-12 rounded-2xl bg-brand-bg flex items-center justify-center mb-4">
          <CheckCircle2 size={22} className="text-brand" strokeWidth={2} />
        </div>
        <h2 className="text-[20px] font-bold text-txt-primary mb-2 leading-tight">
          이전에 작성하시던 내용이 있습니다
        </h2>
        <p className="text-[13px] text-txt-secondary leading-relaxed mb-4 break-keep">
          이어서 작성하실 수 있도록 기기에 자동 저장되어 있었습니다. 처음부터 다시 시작하고 싶으시면 &quot;새로 시작&quot; 을 눌러 주세요.
        </p>
        {filled.length > 0 && (
          <div className="bg-surface-sunken rounded-2xl p-3.5 mb-5">
            <p className="text-[10px] font-semibold text-txt-tertiary uppercase tracking-wider mb-1.5">
              저장된 항목
            </p>
            <ul className="text-[12px] text-txt-secondary space-y-0.5">
              {filled.map((item, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <Check size={11} className="text-brand shrink-0 mt-1" strokeWidth={2.5} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="space-y-2">
          <button
            type="button"
            onClick={onResume}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-surface-inverse text-txt-inverse rounded-full text-[14px] font-bold hover:opacity-90 active:scale-[0.97] transition-all"
          >
            <ArrowRight size={14} />
            이어서 작성하기
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="w-full py-3.5 text-[13px] font-semibold text-txt-secondary hover:text-txt-primary transition-colors"
          >
            새로 시작하기
          </button>
        </div>
        <p className="text-[11px] text-txt-tertiary text-center mt-4 leading-relaxed">
          저장된 내용은 기기에만 보관되며, 새로 시작하시면 완전히 삭제됩니다.
        </p>
      </div>
    </div>
  )
}

function ConsentRow({ checked, onToggle, label, required, emphasis, hint, link }: ConsentRowProps) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <button
        type="button"
        onClick={onToggle}
        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
          checked
            ? 'bg-brand text-white'
            : 'bg-surface-card border border-border hover:border-brand/50'
        }`}
        aria-label={label}
        aria-checked={checked}
        role="checkbox"
      >
        {checked && <Check size={12} strokeWidth={3} />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[13px] ${emphasis ? 'font-bold text-txt-primary' : 'text-txt-primary'}`}>
            {required && <span className="text-status-danger-text mr-1">*</span>}
            {label}
          </span>
          {link && (
            <Link
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-brand underline underline-offset-2 hover:opacity-80"
            >
              {link.label}
            </Link>
          )}
        </div>
        {hint && <p className="text-[11px] text-txt-tertiary mt-0.5">{hint}</p>}
      </div>
    </div>
  )
}

