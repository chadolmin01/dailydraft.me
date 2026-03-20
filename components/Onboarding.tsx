'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/src/context/AuthContext'
import { useOnboarding, useDerivedState } from '@/src/hooks/useOnboarding'
import { determineResumeStep } from '@/src/lib/onboarding/resume'
import { aiParse, aiDeepChat, buildProfileCtx, saveProfileCheckpoint, saveProfileFinal, summarizeTranscript } from '@/src/lib/onboarding/api'
import { AFFILIATION_OPTIONS, AI_ACTIVITY_LABELS, ONBOARDING_TIPS } from '@/src/lib/onboarding/constants'
import type { Bubble, DeepChatMessage } from '@/src/lib/onboarding/types'

import { OnboardingShell } from './onboarding/OnboardingShell'
import { OnboardingChat } from './onboarding/OnboardingChat'
import { ProfilePreview } from './onboarding/ProfilePreview'
import { GreetingStep } from './onboarding/steps/GreetingStep'
import { InfoFormStep } from './onboarding/steps/InfoFormStep'
import { PositionStep } from './onboarding/steps/PositionStep'
import { SituationStep } from './onboarding/steps/SituationStep'
import { SkillsInputStep, SkillsConfirmStep } from './onboarding/steps/SkillsStep'
import { InterestsInputStep, InterestsConfirmStep } from './onboarding/steps/InterestsStep'
import { DeepChatOfferStep, DeepChatOfferFinishStep } from './onboarding/steps/DeepChatOfferStep'
import { DeepChatFooter, DefaultFooter } from './onboarding/steps/DeepChatStep'

interface OnboardingProps {
  onComplete: () => void
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { signOut, profile: authProfile, isLoading: authLoading } = useAuth()
  const [state, dispatch] = useOnboarding()
  const { coveredTopics, userMsgCount, currentSuggestions, canGoBack } = useDerivedState(state)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const deepChatInputRef = useRef<HTMLInputElement>(null)
  const queueRef = useRef(false)
  const onCompleteTimerRef = useRef<ReturnType<typeof setTimeout>>(null)

  // Refs to avoid stale closures in async callbacks
  const stateRef = useRef(state)
  stateRef.current = state
  const coveredTopicsRef = useRef(coveredTopics)
  coveredTopicsRef.current = coveredTopics

  // ── Scroll on bubble change ──
  useEffect(() => {
    const t = setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
    return () => clearTimeout(t)
  }, [state.bubbles, state.isTyping])

  useEffect(() => { dispatch({ type: 'SET_MOUNTED' }) }, [dispatch])

  // Cleanup onComplete timer on unmount (#15)
  useEffect(() => {
    return () => {
      if (onCompleteTimerRef.current) clearTimeout(onCompleteTimerRef.current)
    }
  }, [])

  // ── Rotating tip (functional update to avoid interval churn #7) ──
  useEffect(() => {
    const interval = setInterval(
      () => dispatch({ type: 'SET_TIP_INDEX', index: -1 }), // sentinel, handled by reducer
      6000,
    )
    return () => clearInterval(interval)
  }, [dispatch])

  // ── Push helpers ──
  const pushAi = useCallback((content: string, attachment?: Bubble['attachment'], delay?: number) => {
    const typingMs = delay ?? Math.min(400 + content.length * 15, 1400)
    return new Promise<void>((resolve) => {
      dispatch({ type: 'SET_TYPING', isTyping: true })
      setTimeout(() => {
        dispatch({ type: 'ADD_BUBBLE', bubble: { id: `ai-${Date.now()}-${Math.random()}`, role: 'ai', content, attachment } })
        dispatch({ type: 'SET_TYPING', isTyping: false })
        setTimeout(resolve, 80)
      }, typingMs)
    })
  }, [dispatch])

  const pushUser = useCallback((content: string) => {
    dispatch({ type: 'ADD_BUBBLE', bubble: { id: `user-${Date.now()}-${Math.random()}`, role: 'user', content } })
  }, [dispatch])

  // ── Init: wait for auth, then resume or start fresh ──
  useEffect(() => {
    if (queueRef.current || authLoading) return
    queueRef.current = true

    const resumeResult = determineResumeStep(authProfile as Record<string, unknown> | null)

    if (resumeResult) {
      dispatch({ type: 'SET_PROFILE', profile: resumeResult.draft })

      if (resumeResult.step === 'deep-chat' && resumeResult.messages) {
        // Resume deep chat with previous messages
        const run = async () => {
          dispatch({ type: 'SET_DEEP_CHAT_MESSAGES', messages: resumeResult.messages! })
          await new Promise(r => setTimeout(r, 400))
          // Restore chat bubbles from transcript (no animation class)
          const restoredBubbles: Bubble[] = resumeResult.messages!.map((msg, i) => ({
            id: `restored-${i}-${Date.now()}`,
            role: msg.role === 'user' ? 'user' as const : 'ai' as const,
            content: msg.content,
          }))
          dispatch({ type: 'SET_BUBBLES', bubbles: restoredBubbles })
          dispatch({ type: 'SET_STEP', step: 'deep-chat' })
          await pushAi('이어서 대화를 계속할까요?', undefined, 600)
          setTimeout(() => deepChatInputRef.current?.focus(), 200)
        }
        run()
      } else {
        // Resume to deep-chat-offer
        const run = async () => {
          await new Promise(r => setTimeout(r, 400))
          await pushAi(`${resumeResult.draft.name}님, 돌아오셨군요!\n이어서 AI 대화를 진행할까요?`, 'deep-chat-offer', 600)
          dispatch({ type: 'SET_STEP', step: 'deep-chat-offer' })
        }
        run()
      }
      return
    }

    // Fresh start
    const run = async () => {
      await new Promise(r => setTimeout(r, 600))
      await pushAi('안녕하세요!\nDraft에 오신 것을 환영합니다.', undefined, 1000)
      await pushAi('프로필을 설정하면 딱 맞는 프로젝트와\n팀원을 추천해드릴 수 있어요.', 'cta', 900)
      dispatch({ type: 'SET_STEP', step: 'cta' })
    }
    run()
  }, [authLoading, authProfile, pushAi, pushUser, dispatch])

  // ── Step handlers ──

  const handleCtaClick = async () => {
    if (stateRef.current.step !== 'cta') return
    pushUser('프로필 입력하기')
    dispatch({ type: 'SET_STEP', step: 'info' })
    await pushAi('좋아요! 먼저 기본 정보를 알려주세요.', 'info-form', 700)
  }

  const handleInfoSubmit = async () => {
    if (stateRef.current.isTyping) return
    const { profile } = stateRef.current
    if (!profile.name.trim()) return
    const parts = [profile.name.trim()]
    const affOpt = AFFILIATION_OPTIONS.find(a => a.value === profile.affiliationType)
    if (profile.university) {
      const prefix = affOpt && profile.affiliationType !== 'student' ? `${affOpt.label} · ` : ''
      parts.push(prefix + profile.university + (profile.major ? ` ${profile.major}` : ''))
    } else if (affOpt && profile.affiliationType !== 'student') {
      parts.push(affOpt.label)
    }
    if (profile.locations.length > 0) parts.push(profile.locations.join(', '))
    pushUser(parts.join(' · '))
    dispatch({ type: 'PUSH_STEP', step: 'position' })
    await pushAi(`${profile.name.trim()}님, 반가워요!\n어떤 분야에서 활동하고 계신가요?`, 'position', 800)
  }

  const handlePositionSelect = async (pos: string) => {
    if (stateRef.current.isTyping || stateRef.current.step !== 'position') return
    dispatch({ type: 'SET_PROFILE', profile: { position: pos } })
    pushUser(pos)
    dispatch({ type: 'PUSH_STEP', step: 'situation' })
    await pushAi('현재 어떤 상황에 계신가요?\nDraft에서의 목표에 맞게 추천해드릴게요.', 'situation', 700)
  }

  const handleSituationSelect = async (sit: { value: string; label: string }) => {
    if (stateRef.current.isTyping || stateRef.current.step !== 'situation') return
    dispatch({ type: 'SET_PROFILE', profile: { situation: sit.value } })
    pushUser(sit.label)
    dispatch({ type: 'PUSH_STEP', step: 'skills-input' })
    await pushAi('어떤 기술을 사용할 수 있나요?\n편하게 말씀해주세요!', 'skills-input', 700)
  }

  const handleSkillInputSubmit = async () => {
    if (stateRef.current.isTyping) return
    const { profile, skillInput } = stateRef.current
    const text = skillInput.trim()
    pushUser(text || (profile.skills.length > 0 ? profile.skills.join(', ') : '건너뛰기'))
    let parsed: string[] = []
    let parseFailed = false
    if (text) {
      dispatch({ type: 'SET_AI_ACTIVITY', label: '입력한 스킬을 정리하고 있어요' })
      dispatch({ type: 'SET_TYPING', isTyping: true })
      const result = await aiParse(text, 'skills')
      dispatch({ type: 'SET_TYPING', isTyping: false })
      dispatch({ type: 'SET_AI_ACTIVITY', label: null })
      if (result === null) parseFailed = true
      else parsed = result
    }
    const merged = Array.from(new Set([...profile.skills, ...parsed]))
    dispatch({ type: 'SET_SKILLS', skills: merged })
    if (parseFailed && merged.length === 0) {
      await pushAi('AI 정리가 잠시 안 되고 있어요.\n아래에서 직접 선택하거나 다시 입력해주세요!', 'skills-input', 400)
      return
    }
    dispatch({ type: 'SET_SKILL_INPUT', value: '' })
    if (merged.length > 0) {
      dispatch({ type: 'PUSH_STEP', step: 'skills-confirm' })
      await pushAi(
        parseFailed
          ? `${merged.join(', ')}\n\n선택하신 스킬이에요! 추가하거나 빼도 돼요.\n(AI 자동 정리는 잠시 안 되고 있어요)`
          : `${merged.join(', ')}\n\nAI가 정리했어요! 추가하거나 빼도 돼요.`,
        'skills-confirm', 500,
      )
    } else {
      dispatch({ type: 'SET_SKILLS', skills: [] })
      dispatch({ type: 'PUSH_STEP', step: 'interests-input' })
      await pushAi('관심 있는 분야가 있나요?\n편하게 말씀해주세요!', 'interests-input', 600)
    }
  }

  const handleSkillsConfirm = async () => {
    if (stateRef.current.isTyping) return
    const { profile } = stateRef.current
    pushUser(profile.skills.length > 0 ? profile.skills.join(', ') + ' 확인!' : '건너뛰기')
    dispatch({ type: 'PUSH_STEP', step: 'interests-input' })
    await pushAi('마지막이에요! 관심 있는 분야가 있나요?\n편하게 말씀해주세요!', 'interests-input', 600)
  }

  const handleInterestInputSubmit = async () => {
    if (stateRef.current.isTyping) return
    const { profile, interestInput } = stateRef.current
    const text = interestInput.trim()
    pushUser(text || (profile.interests.length > 0 ? profile.interests.join(', ') : '건너뛰기'))
    let parsed: string[] = []
    let parseFailed = false
    if (text) {
      dispatch({ type: 'SET_AI_ACTIVITY', label: '관심 분야를 분석하고 있어요' })
      dispatch({ type: 'SET_TYPING', isTyping: true })
      const result = await aiParse(text, 'interests')
      dispatch({ type: 'SET_TYPING', isTyping: false })
      dispatch({ type: 'SET_AI_ACTIVITY', label: null })
      if (result === null) parseFailed = true
      else parsed = result
    }
    const merged = Array.from(new Set([...profile.interests, ...parsed]))
    dispatch({ type: 'SET_INTERESTS', interests: merged })
    if (parseFailed && merged.length === 0) {
      await pushAi('AI 정리가 잠시 안 되고 있어요.\n아래에서 직접 선택하거나 다시 입력해주세요!', 'interests-input', 400)
      return
    }
    dispatch({ type: 'SET_INTEREST_INPUT', value: '' })
    if (merged.length > 0) {
      dispatch({ type: 'PUSH_STEP', step: 'interests-confirm' })
      await pushAi(
        parseFailed
          ? `${merged.join(', ')}\n\n선택하신 관심 분야예요! 추가하거나 빼도 돼요.\n(AI 자동 정리는 잠시 안 되고 있어요)`
          : `${merged.join(', ')}\n\nAI가 정리했어요!`,
        'interests-confirm', 500,
      )
    } else {
      await offerDeepChat()
    }
  }

  const handleInterestsConfirm = async () => {
    if (stateRef.current.isTyping) return
    await offerDeepChat()
  }

  // ── Deep Chat Offer ──
  const offerDeepChat = async () => {
    const { profile } = stateRef.current
    pushUser(profile.interests.length > 0 ? profile.interests.join(', ') + ' 확인!' : '완료!')
    dispatch({ type: 'PUSH_STEP', step: 'deep-chat-offer' })
    await pushAi('기본 프로필이 완성됐어요!\n\nAI와 짧은 대화를 나누면 팀 매칭 정확도가 확 올라가요.\n경험, 작업 스타일, 목표 등 몇 가지만 알려주시면 됩니다.', 'deep-chat-offer', 800)
  }

  const handleDeepChatAccept = async () => {
    const s = stateRef.current
    if (s.isTyping || s.step !== 'deep-chat-offer') return
    pushUser('좋아요, 해볼게요!')

    await new Promise(r => setTimeout(r, 400))
    dispatch({ type: 'SET_DEEP_CHAT_TRANSITION', value: true })

    const profileCtx = buildProfileCtx(s.profile)

    // Checkpoint save
    try { await saveProfileCheckpoint(s.profile) } catch { /* continue anyway */ }

    const { reply: firstQ, suggestions: firstSuggestions } = await aiDeepChat([], profileCtx)

    await new Promise(r => setTimeout(r, 800))
    dispatch({ type: 'SET_BUBBLES', bubbles: [] })
    dispatch({ type: 'SET_STEP', step: 'deep-chat' })
    dispatch({ type: 'SET_DEEP_CHAT_TRANSITION', value: false })
    dispatch({ type: 'SET_DYNAMIC_SUGGESTIONS', suggestions: firstSuggestions })

    await new Promise(r => setTimeout(r, 300))
    const aiMsg: DeepChatMessage = { role: 'assistant', content: firstQ }
    dispatch({ type: 'SET_DEEP_CHAT_MESSAGES', messages: [aiMsg] })
    await pushAi(firstQ, undefined, 600)
    setTimeout(() => deepChatInputRef.current?.focus(), 200)
  }

  const handleDeepChatSkip = async () => {
    const s = stateRef.current
    if (s.isTyping || s.step !== 'deep-chat-offer') return
    pushUser('건너뛰기')
    await finishOnboarding()
  }

  const sendDeepChatMessage = async (text: string) => {
    const s = stateRef.current
    if (s.isTyping || !text.trim() || s.step !== 'deep-chat') return
    dispatch({ type: 'SET_DEEP_CHAT_INPUT', value: '' })
    dispatch({ type: 'SET_SHOW_SUGGESTIONS', value: false })
    dispatch({ type: 'SET_DYNAMIC_SUGGESTIONS', suggestions: [] })
    pushUser(text.trim())
    const userMsg: DeepChatMessage = { role: 'user', content: text.trim() }
    const updatedMessages = [...s.deepChatMessages, userMsg]
    dispatch({ type: 'SET_DEEP_CHAT_MESSAGES', messages: updatedMessages })
    const profileCtx = buildProfileCtx(s.profile)
    const msgCount = updatedMessages.filter(m => m.role === 'user').length
    const activityLabel = AI_ACTIVITY_LABELS[Math.min(msgCount - 1, AI_ACTIVITY_LABELS.length - 1)]
    dispatch({ type: 'SET_AI_ACTIVITY', label: activityLabel })
    dispatch({ type: 'SET_TYPING', isTyping: true })
    const { reply, offTopic, suggestions } = await aiDeepChat(updatedMessages, profileCtx)
    dispatch({ type: 'SET_TYPING', isTyping: false })
    dispatch({ type: 'SET_AI_ACTIVITY', label: null })

    if (offTopic) {
      // Don't add off-topic exchange to history — rollback to previous state
      dispatch({ type: 'SET_DEEP_CHAT_MESSAGES', messages: s.deepChatMessages })
      await pushAi(reply, undefined, 300)
    } else {
      const aiMsg: DeepChatMessage = { role: 'assistant', content: reply }
      const finalMessages = [...updatedMessages, aiMsg]
      dispatch({ type: 'SET_DEEP_CHAT_MESSAGES', messages: finalMessages })
      await pushAi(reply, undefined, 300)
    }
    dispatch({ type: 'SET_DYNAMIC_SUGGESTIONS', suggestions })
    dispatch({ type: 'SET_SHOW_SUGGESTIONS', value: true })
    setTimeout(() => deepChatInputRef.current?.focus(), 200)
  }

  const handleDeepChatFinish = async () => {
    const s = stateRef.current
    if (s.isTyping) return
    const uMsgCount = s.deepChatMessages.filter(m => m.role === 'user').length
    if (uMsgCount < 3) {
      await pushAi(`아직 ${3 - uMsgCount}개 정도 더 이야기하면 더 정확한 매칭이 가능해요.\n그래도 지금 마무리할까요?`, 'deep-chat-offer-finish', 400)
      return
    }
    pushUser('대화 완료!')
    await completeDeepChat()
  }

  const forceFinishDeepChat = async () => {
    if (stateRef.current.isTyping) return // #12: add isTyping guard
    pushUser('지금 마무리할게요')
    await completeDeepChat()
  }

  const completeDeepChat = async () => {
    const s = stateRef.current
    if (s.deepChatMessages.length >= 2) {
      dispatch({ type: 'SET_STEP', step: 'done' })
      dispatch({ type: 'SET_AI_ACTIVITY', label: '프로필 데이터를 생성하고 있어요' })
      dispatch({ type: 'SET_TYPING', isTyping: true })
      // Use ref for coveredTopics to avoid stale count (#10)
      await pushAi(`${coveredTopicsRef.current.length}개 영역을 분석해서 프로필에 반영하고 있어요...`, undefined, 400)

      // Read latest messages from ref (#2)
      const currentMessages = stateRef.current.deepChatMessages
      const summaryResult = await summarizeTranscript(currentMessages)
      dispatch({ type: 'SET_TYPING', isTyping: false })
      dispatch({ type: 'SET_AI_ACTIVITY', label: null })

      const name = stateRef.current.profile.name
      if (summaryResult?.summary) {
        await pushAi(`분석 완료!\n\n"${summaryResult.summary}"\n\n${name}님에게 딱 맞는 팀을 찾아볼게요.`, undefined, 500)
      } else {
        await pushAi(`프로필 분석이 완료됐어요!\n${name}님에게 딱 맞는 팀을 찾아볼게요.`, undefined, 500)
      }
      // #3: await handleSave
      await handleSave()
    } else {
      await finishOnboarding()
    }
  }

  const finishOnboarding = async () => {
    dispatch({ type: 'SET_STEP', step: 'done' })
    const name = stateRef.current.profile.name
    await pushAi(`프로필 설정이 완료됐어요!\n${name}님에게 맞는 프로젝트를 찾아볼게요.`, undefined, 600)
    // #3: await handleSave
    await handleSave()
  }

  const handleSave = async () => {
    dispatch({ type: 'SET_SAVING', isSaving: true })
    dispatch({ type: 'SET_SAVE_ERROR', error: null })
    try {
      // Read latest state from ref (#2)
      const s = stateRef.current
      await saveProfileFinal(s.profile, s.deepChatMessages)
      // #15: store timer ref for cleanup on unmount
      onCompleteTimerRef.current = setTimeout(onComplete, 1500)
    } catch (err) {
      console.error('[Onboarding] save error:', err)
      dispatch({ type: 'SET_SAVE_ERROR', error: err instanceof Error ? err.message : '저장에 실패했습니다.' })
      dispatch({ type: 'SET_SAVING', isSaving: false })
    }
  }

  // ── Attachment renderer (#1: remove useCallback to avoid stale handler closures) ──
  const renderAttachment = (bubble: Bubble) => {
    switch (bubble.attachment) {
      case 'cta':
        return <GreetingStep onCtaClick={handleCtaClick} />
      case 'info-form':
        return (
          <InfoFormStep
            profile={state.profile}
            onProfileChange={(p) => dispatch({ type: 'SET_PROFILE', profile: p })}
            onSubmit={handleInfoSubmit}
          />
        )
      case 'position':
        return <PositionStep onSelect={handlePositionSelect} />
      case 'situation':
        return <SituationStep onSelect={handleSituationSelect} />
      case 'skills-input':
        return (
          <SkillsInputStep
            skillInput={state.skillInput}
            skills={state.profile.skills}
            onSkillInputChange={(v: string) => dispatch({ type: 'SET_SKILL_INPUT', value: v })}
            onToggleSkill={(s: string) => dispatch({ type: 'TOGGLE_SKILL', skill: s })}
            onRemoveSkill={(s: string) => dispatch({ type: 'REMOVE_SKILL', skill: s })}
            onSubmit={handleSkillInputSubmit}
          />
        )
      case 'skills-confirm':
        return (
          <SkillsConfirmStep
            skills={state.profile.skills}
            onRemoveSkill={(s: string) => dispatch({ type: 'REMOVE_SKILL', skill: s })}
            onConfirm={handleSkillsConfirm}
          />
        )
      case 'interests-input':
        return (
          <InterestsInputStep
            interestInput={state.interestInput}
            interests={state.profile.interests}
            onInterestInputChange={(v: string) => dispatch({ type: 'SET_INTEREST_INPUT', value: v })}
            onToggleInterest={(t: string) => dispatch({ type: 'TOGGLE_INTEREST', tag: t })}
            onRemoveInterest={(t: string) => dispatch({ type: 'REMOVE_INTEREST', tag: t })}
            onSubmit={handleInterestInputSubmit}
          />
        )
      case 'interests-confirm':
        return (
          <InterestsConfirmStep
            interests={state.profile.interests}
            onRemoveInterest={(t: string) => dispatch({ type: 'REMOVE_INTEREST', tag: t })}
            onConfirm={handleInterestsConfirm}
          />
        )
      case 'deep-chat-offer':
        return <DeepChatOfferStep onAccept={handleDeepChatAccept} onSkip={handleDeepChatSkip} />
      case 'deep-chat-offer-finish':
        return (
          <DeepChatOfferFinishStep
            onContinue={() => dispatch({ type: 'REMOVE_BUBBLES_BY_ATTACHMENT', attachment: 'deep-chat-offer-finish' })}
            onFinish={forceFinishDeepChat}
          />
        )
      default:
        return null
    }
  }

  // ── Footer ──
  const footer = state.step === 'deep-chat' ? (
    <DeepChatFooter
      deepChatInput={state.deepChatInput}
      isTyping={state.isTyping}
      userMsgCount={userMsgCount}
      showSuggestions={state.showSuggestions}
      currentSuggestions={currentSuggestions}
      coveredTopics={coveredTopics}
      hasMessages={state.deepChatMessages.length > 0}
      inputRef={deepChatInputRef}
      onInputChange={(v: string) => dispatch({ type: 'SET_DEEP_CHAT_INPUT', value: v })}
      onSend={() => sendDeepChatMessage(stateRef.current.deepChatInput)}
      onSuggestionClick={(text: string) => sendDeepChatMessage(text)}
      onFinish={handleDeepChatFinish}
    />
  ) : (
    <DefaultFooter canGoBack={canGoBack} onGoBack={() => dispatch({ type: 'GO_BACK' })} />
  )

  // ── Sidebar ──
  const sidebar = (
    <ProfilePreview
      profile={state.profile}
      step={state.step}
      coveredTopics={coveredTopics}
      userMsgCount={userMsgCount}
      hasDeepChatMessages={state.deepChatMessages.length > 0}
    />
  )

  return (
    <OnboardingShell
      step={state.step}
      userMsgCount={userMsgCount}
      tipIndex={state.tipIndex}
      mounted={state.mounted}
      deepChatTransition={state.deepChatTransition}
      onSignOut={signOut}
      footer={footer}
      sidebar={sidebar}
    >
      <OnboardingChat
        bubbles={state.bubbles}
        isTyping={state.isTyping}
        isSaving={state.isSaving}
        saveError={state.saveError}
        aiActivity={state.aiActivity}
        step={state.step}
        chatEndRef={chatEndRef}
        onRetrySave={handleSave}
        renderAttachment={renderAttachment}
      />
    </OnboardingShell>
  )
}
