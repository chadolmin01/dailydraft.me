'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { useProfile } from '@/src/hooks/useProfile'
import { determineResumeStep } from '@/src/lib/onboarding/resume'
import { saveProfileCheckpoint } from '@/src/lib/onboarding/api'
import { AFFILIATION_OPTIONS } from '@/src/lib/onboarding/constants'
import type { ProfileDraft } from '@/src/lib/onboarding/types'
import {
  loadDraftLocal,
  pruneStaleDraft,
  hasMeaningfulDraft,
  clearDraftLocal,
} from '@/src/lib/onboarding/draft-storage'
import { useOnboardingAutoSave } from '@/src/hooks/useOnboardingAutoSave'
import { trackOnboardingEvent, createStepTimer } from '@/src/lib/onboarding/analytics'
import { OnboardingError } from '@/src/lib/onboarding/api'
import { OnboardingShell } from './onboarding/shell/OnboardingShell'
import { IntroScreen } from './onboarding/steps/IntroScreen'
import { SourceStep } from './onboarding/steps/SourceStep'
import { RecoveryOffer } from './onboarding/steps/RecoveryOffer'
import { InfoContent } from './onboarding/steps/InfoContent'
import { SituationStep } from './onboarding/steps/SituationStep'
import { PositionStep } from './onboarding/steps/PositionStep'
import { InterestsStep } from './onboarding/steps/InterestsStep'

/* ─── Types ─── */

type Step = 'intro' | 'source' | 'info' | 'situation' | 'position' | 'interests'
type SlideDir = 'forward' | 'back'

// 경로별 단계 순서:
//   invite/operator/exploring → info 만 받고 완료 (situation/position/interests 스킵)
//   matching → 기존 전체 (info → situation → position → interests)
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

/* ─── Step config ─── */

const STEP_CONFIG: Record<string, { title: string; hint?: string }> = {
  info:      { title: '기본 정보를 알려 주세요', hint: '닉네임만 필수 입력이며, 나머지는 언제든 프로필에서 수정하실 수 있습니다.' },
  situation: { title: '프로젝트 쪽에서는 무엇을 하실 예정인가요?', hint: '답변에 따라 추천 프로젝트와 랜딩 화면이 달라집니다.' },
  position:  { title: '어떤 분야에서 활동하시나요?', hint: '선택하신 분야에 맞춰 관련 기술 스택을 추천해 드립니다.' },
  interests: { title: '관심 있는 프로젝트 분야는 어느 쪽인가요?', hint: '관심사가 겹치는 사람·프로젝트를 우선 보여 드립니다.' },
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
  // 통일: D 12×12 rounded-2xl + animate-pulse — onboarding/page.tsx, interview/page.tsx 와 동일.
  // 이전엔 indeterminate bar + DRAFT 라벨까지 있어 다른 loading 화면과 톤이 달랐음.
  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-surface-bg flex items-center justify-center">
        <div className="w-12 h-12 bg-surface-inverse rounded-2xl flex items-center justify-center animate-pulse">
          <span className="text-white text-lg font-black">D</span>
        </div>
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

  const handleSkip = () => {
    const p = profileRef.current
    trackOnboardingEvent('onboarding_step_skipped', {
      step,
      source: p.source ?? null,
    })
    if (p.name.trim()) {
      saveProfileCheckpoint(p).catch(console.error)
    }
    router.push('/explore')
  }

  return (
    <OnboardingShell
      title={config?.title ?? ''}
      hint={config?.hint}
      stepIndex={stepIndex}
      stepCount={activeSteps.length}
      onBack={handleBack}
      onSkip={handleSkip}
      saveStatus={autoSave.status}
      primaryCTA={{ label: '다음으로', onClick: handleNext, disabled: !canProceed }}
      errorMsg={errorMsg}
      slideKey={slideKey}
      slideDir={slideDir}
      onKeyDown={handleKeyDown}
      ariaLabel={`온보딩 — ${config?.title ?? ''}`}
    >
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
        <SituationStep
          value={profile.situation}
          attempted={attempted}
          onSelect={(v) => updateProfile({ situation: v })}
        />
      )}
      {step === 'position' && (
        <PositionStep
          position={profile.position}
          skills={profile.skills}
          attempted={attempted}
          onSelectPosition={(slug) => updateProfile({ position: slug, skills: [] })}
          onToggleSkill={(skill) => updateProfile({
            skills: profile.skills.includes(skill)
              ? profile.skills.filter(s => s !== skill)
              : [...profile.skills, skill],
          })}
        />
      )}
      {step === 'interests' && (
        <InterestsStep
          interests={profile.interests}
          attempted={attempted}
          onToggle={(slug) => updateProfile({
            interests: profile.interests.includes(slug)
              ? profile.interests.filter(x => x !== slug)
              : [...profile.interests, slug],
          })}
        />
      )}
    </OnboardingShell>
  )
}
