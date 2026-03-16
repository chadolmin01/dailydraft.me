'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ArrowRight, ArrowLeft, X, Send, User, Building2, MapPin, Code2, Target, Sparkles, Loader2, CheckCircle2, MessageCircle, ChevronDown, Briefcase, Clock, Users, Lightbulb, Zap, Heart } from 'lucide-react'

interface OnboardingProps {
  onComplete: () => void
}

import { UNIVERSITY_LIST, LOCATION_OPTIONS } from '@/src/lib/constants/profile-options'

// ── Data ──

const POSITION_OPTIONS = ['프론트엔드 개발', '백엔드 개발', '풀스택 개발', 'UI/UX 디자인', 'PM / 기획', '마케팅', '데이터분석', '기타']

const SITUATION_OPTIONS = [
  { value: 'has_project', label: '팀원을 찾고 있어요', desc: '프로젝트 진행 중' },
  { value: 'want_to_join', label: '프로젝트에 참여하고 싶어요', desc: '합류 희망' },
  { value: 'solo', label: '같이 시작할 사람을 찾아요', desc: '함께 시작' },
  { value: 'exploring', label: '아직 둘러보는 중이에요', desc: '탐색 중' },
]

const AFFILIATION_OPTIONS = [
  { value: 'student', label: '대학생', orgPlaceholder: '대학교', rolePlaceholder: '전공' },
  { value: 'graduate', label: '졸업생', orgPlaceholder: '출신 대학', rolePlaceholder: '전공' },
  { value: 'professional', label: '현직자', orgPlaceholder: '회사', rolePlaceholder: '직무' },
  { value: 'freelancer', label: '프리랜서', orgPlaceholder: '소속 (선택)', rolePlaceholder: '분야' },
  { value: 'other', label: '기타', orgPlaceholder: '소속 (선택)', rolePlaceholder: '분야 (선택)' },
]

const POPULAR_SKILLS = ['React', 'Python', 'TypeScript', 'Figma', 'Java', 'Node.js', 'Flutter', 'SQL']

const INTEREST_OPTIONS = ['AI/ML', 'Web', 'Mobile', 'HealthTech', 'EdTech', 'Fintech', 'Social', 'E-commerce', 'IoT', 'Game', 'Blockchain', 'DevTools']

// ── Deep Chat Topics ──
const DEEP_CHAT_TOPICS = [
  { id: 'experience', label: '프로젝트 경험', icon: Briefcase, keywords: ['프로젝트', '경험', '해본', '만들', '개발', '참여', '역할'] },
  { id: 'workstyle', label: '작업 스타일', icon: Zap, keywords: ['스타일', '혼자', '팀', '기획', '개발부터', '완벽', '속도', '계획'] },
  { id: 'availability', label: '가용 시간', icon: Clock, keywords: ['시간', '주당', '투자', '학기', '방학', '여유', '바쁜'] },
  { id: 'teamrole', label: '팀 역할', icon: Users, keywords: ['리더', '팔로워', '이끌', '따르', '관리', '맡', '역할'] },
  { id: 'goals', label: '목표', icon: Target, keywords: ['목표', '동기', '포트폴리오', '창업', '수상', '학습', '스펙', '이유'] },
  { id: 'atmosphere', label: '팀 분위기', icon: Heart, keywords: ['분위기', '진지', '캐주얼', '대면', '비대면', '온라인', '오프라인'] },
  { id: 'ideas', label: '프로젝트 아이디어', icon: Lightbulb, keywords: ['아이디어', '만들고', '해결', '문제', '서비스', '앱', '플랫폼'] },
  { id: 'strengths', label: '강점·기대', icon: Sparkles, keywords: ['강점', '잘하는', '보완', '기대', '부족', '약점', '도움'] },
]

const DEEP_CHAT_SUGGESTIONS: Record<number, string[]> = {
  0: ['아직 프로젝트 경험이 없어요', '학교 수업에서 팀프로젝트 해봤어요', '개인 프로젝트를 진행하고 있어요', '해커톤에 참여한 적 있어요'],
  1: ['계획을 먼저 세우는 편이에요', '일단 만들면서 수정해요', '팀원들과 자주 소통하는 걸 좋아해요'],
  2: ['주 10시간 정도 투자할 수 있어요', '학기 중이라 시간이 많지 않아요', '방학이라 풀타임으로 가능해요'],
  3: ['리더 역할이 편해요', '시키는 걸 잘 해내는 타입이에요', '상황에 따라 유연하게 해요'],
  4: ['포트폴리오를 만들고 싶어요', '창업에 관심 있어요', '새로운 기술을 배우고 싶어요', '공모전 수상이 목표예요'],
}

const AI_ACTIVITY_LABELS = [
  '대화를 분석하고 있어요',
  '답변을 정리하고 있어요',
  '맞춤 질문을 준비하고 있어요',
  '프로필을 분석하고 있어요',
]

// ── AI-powered parsing via API ──
async function aiParse(text: string, type: 'skills' | 'interests'): Promise<string[] | null> {
  try {
    const res = await fetch('/api/onboarding/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, type }),
    })
    if (!res.ok) return null
    const { items } = await res.json()
    return Array.isArray(items) ? items : null
  } catch {
    return null
  }
}

// ── AI deep chat API ──
interface DeepChatMessage {
  role: 'user' | 'assistant'
  content: string
}

async function aiDeepChat(messages: DeepChatMessage[], profileCtx: Record<string, unknown>, save = true): Promise<string> {
  try {
    const res = await fetch('/api/onboarding/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, profile: profileCtx, saveTranscript: save }),
    })
    if (!res.ok) {
      return '죄송해요, 일시적인 오류가 발생했어요. 다시 말씀해주세요!'
    }
    const { data } = await res.json()
    return data?.reply || '어떤 프로젝트 경험이 있으신지 알려주세요!'
  } catch {
    return '죄송해요, 네트워크 오류가 발생했어요. 인터넷 연결을 확인하고 다시 시도해주세요.'
  }
}

// ── Types ──

type Step = 'greeting' | 'cta' | 'info' | 'position' | 'situation'
  | 'skills-input' | 'skills-confirm'
  | 'interests-input' | 'interests-confirm'
  | 'deep-chat-offer' | 'deep-chat'
  | 'done'

interface Bubble {
  id: string
  role: 'ai' | 'user'
  content: string
  attachment?: 'cta' | 'info-form' | 'position' | 'situation'
    | 'skills-input' | 'skills-confirm'
    | 'interests-input' | 'interests-confirm'
    | 'deep-chat-offer' | 'deep-chat-offer-finish'
}

// ── Rotating Tips ──

const ONBOARDING_TIPS = [
  '프로필을 채울수록 AI 매칭 정확도가 올라가요',
  '기본 정보를 입력하면 맞춤 추천이 시작돼요',
  '포지션과 상황을 알면 딱 맞는 팀을 찾아드려요',
  '기술 스택을 입력하면 매칭률이 최대 40% 올라가요',
  '관심 분야가 겹치는 팀원을 우선 추천해드려요',
  '대화할수록 AI가 더 정확하게 분석해요',
  '완성된 프로필은 커피챗 수락률이 2배 높아요',
]

// ── Component ──

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState<Step>('greeting')
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [deepChatTransition, setDeepChatTransition] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const queueRef = useRef(false)

  // Free-text inputs
  const [skillInput, setSkillInput] = useState('')
  const [interestInput, setInterestInput] = useState('')

  // Rotating tip
  const [tipIndex, setTipIndex] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setTipIndex(i => (i + 1) % ONBOARDING_TIPS.length), 6000)
    return () => clearInterval(interval)
  }, [])

  // Deep chat
  const [deepChatInput, setDeepChatInput] = useState('')
  const [deepChatMessages, setDeepChatMessages] = useState<DeepChatMessage[]>([])
  const deepChatInputRef = useRef<HTMLInputElement>(null)
  const [showSuggestions, setShowSuggestions] = useState(true)

  // AI activity label
  const [aiActivity, setAiActivity] = useState<string | null>(null)

  // Topic progress tracking
  const coveredTopics = useMemo(() => {
    const allText = deepChatMessages.map(m => m.content).join(' ')
    return DEEP_CHAT_TOPICS.filter(topic =>
      topic.keywords.some(kw => allText.includes(kw))
    ).map(t => t.id)
  }, [deepChatMessages])

  const userMsgCount = useMemo(() =>
    deepChatMessages.filter(m => m.role === 'user').length
  , [deepChatMessages])

  // Current suggestions based on conversation progress
  const currentSuggestions = useMemo(() => {
    const idx = Math.min(userMsgCount, Object.keys(DEEP_CHAT_SUGGESTIONS).length - 1)
    return DEEP_CHAT_SUGGESTIONS[idx] || []
  }, [userMsgCount])

  // Step history for back navigation
  const [stepHistory, setStepHistory] = useState<Step[]>([])

  // Parsed + manual selections
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])

  const [profile, setProfile] = useState({
    name: '', affiliationType: 'student', university: '', major: '',
    locations: [] as string[],
    position: '', situation: '',
    skills: [] as string[], interests: [] as string[],
  })

  // Scroll
  useEffect(() => {
    const t = setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
    return () => clearTimeout(t)
  }, [bubbles, isTyping])

  useEffect(() => { setMounted(true) }, [])

  // Push helpers
  const pushAi = useCallback((content: string, attachment?: Bubble['attachment'], delay?: number) => {
    const typingMs = delay ?? Math.min(400 + content.length * 15, 1400)
    return new Promise<void>((resolve) => {
      setIsTyping(true)
      setTimeout(() => {
        setBubbles(prev => [...prev, { id: `ai-${Date.now()}-${Math.random()}`, role: 'ai', content, attachment }])
        setIsTyping(false)
        setTimeout(resolve, 80)
      }, typingMs)
    })
  }, [])

  const pushUser = useCallback((content: string) => {
    setBubbles(prev => [...prev, { id: `user-${Date.now()}`, role: 'user', content }])
  }, [])

  // ── Greeting ──
  useEffect(() => {
    if (queueRef.current) return
    queueRef.current = true
    const run = async () => {
      await new Promise(r => setTimeout(r, 600))
      await pushAi('안녕하세요!\nDraft에 오신 것을 환영합니다.', undefined, 1000)
      await pushAi('프로필을 설정하면 딱 맞는 프로젝트와\n팀원을 추천해드릴 수 있어요.', 'cta', 900)
      setStep('cta')
    }
    run()
  }, [pushAi])

  // ── Step handlers ──

  const handleCtaClick = async () => {
    if (step !== 'cta') return
    pushUser('프로필 입력하기')
    setStep('info')
    await pushAi('좋아요! 먼저 기본 정보를 알려주세요.', 'info-form', 700)
  }

  const handleInfoSubmit = async () => {
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
    setStepHistory(prev => [...prev, step])
    setStep('position')
    await pushAi(`${profile.name.trim()}님, 반가워요!\n어떤 분야에서 활동하고 계신가요?`, 'position', 800)
  }

  const handlePositionSelect = async (pos: string) => {
    if (isTyping || step !== 'position') return
    setProfile(prev => ({ ...prev, position: pos }))
    pushUser(pos)
    setStepHistory(prev => [...prev, step])
    setStep('situation')
    await pushAi('현재 어떤 상황에 계신가요?\nDraft에서의 목표에 맞게 추천해드릴게요.', 'situation', 700)
  }

  const handleSituationSelect = async (sit: typeof SITUATION_OPTIONS[0]) => {
    if (isTyping || step !== 'situation') return
    setProfile(prev => ({ ...prev, situation: sit.value }))
    pushUser(sit.label)
    setStepHistory(prev => [...prev, step])
    setStep('skills-input')
    await pushAi('어떤 기술을 사용할 수 있나요?\n편하게 말씀해주세요!', 'skills-input', 700)
  }

  const handleSkillInputSubmit = async () => {
    if (isTyping) return
    const text = skillInput.trim()
    pushUser(text || (selectedSkills.length > 0 ? selectedSkills.join(', ') : '건너뛰기'))
    let parsed: string[] = []
    let parseFailed = false
    if (text) {
      setAiActivity('입력한 스킬을 정리하고 있어요')
      setIsTyping(true)
      const result = await aiParse(text, 'skills')
      setIsTyping(false)
      setAiActivity(null)
      if (result === null) {
        parseFailed = true
      } else {
        parsed = result
      }
    }
    const merged = Array.from(new Set([...selectedSkills, ...parsed]))
    setSelectedSkills(merged)
    if (parseFailed && merged.length === 0) {
      await pushAi('AI 정리가 잠시 안 되고 있어요.\n아래에서 직접 선택하거나 다시 입력해주세요!', 'skills-input', 400)
      return
    }
    setSkillInput('')
    if (merged.length > 0) {
      setStepHistory(prev => [...prev, step])
      setStep('skills-confirm')
      await pushAi(
        parseFailed
          ? `${merged.join(', ')}\n\n선택하신 스킬이에요! 추가하거나 빼도 돼요.\n(AI 자동 정리는 잠시 안 되고 있어요)`
          : `${merged.join(', ')}\n\nAI가 정리했어요! 추가하거나 빼도 돼요.`,
        'skills-confirm', 500
      )
    } else {
      setProfile(prev => ({ ...prev, skills: [] }))
      setStepHistory(prev => [...prev, step])
      setStep('interests-input')
      await pushAi('관심 있는 분야가 있나요?\n편하게 말씀해주세요!', 'interests-input', 600)
    }
  }

  const handleSkillsConfirm = async () => {
    if (isTyping) return
    setProfile(prev => ({ ...prev, skills: selectedSkills }))
    pushUser(selectedSkills.length > 0 ? selectedSkills.join(', ') + ' 확인!' : '건너뛰기')
    setStepHistory(prev => [...prev, step])
    setStep('interests-input')
    await pushAi('마지막이에요! 관심 있는 분야가 있나요?\n편하게 말씀해주세요!', 'interests-input', 600)
  }

  const handleInterestInputSubmit = async () => {
    if (isTyping) return
    const text = interestInput.trim()
    pushUser(text || (selectedInterests.length > 0 ? selectedInterests.join(', ') : '건너뛰기'))
    let parsed: string[] = []
    let parseFailed = false
    if (text) {
      setAiActivity('관심 분야를 분석하고 있어요')
      setIsTyping(true)
      const result = await aiParse(text, 'interests')
      setIsTyping(false)
      setAiActivity(null)
      if (result === null) {
        parseFailed = true
      } else {
        parsed = result
      }
    }
    const merged = Array.from(new Set([...selectedInterests, ...parsed]))
    setSelectedInterests(merged)
    if (parseFailed && merged.length === 0) {
      await pushAi('AI 정리가 잠시 안 되고 있어요.\n아래에서 직접 선택하거나 다시 입력해주세요!', 'interests-input', 400)
      return
    }
    setInterestInput('')
    if (merged.length > 0) {
      setStepHistory(prev => [...prev, step])
      setStep('interests-confirm')
      await pushAi(
        parseFailed
          ? `${merged.join(', ')}\n\n선택하신 관심 분야예요! 추가하거나 빼도 돼요.\n(AI 자동 정리는 잠시 안 되고 있어요)`
          : `${merged.join(', ')}\n\nAI가 정리했어요!`,
        'interests-confirm', 500
      )
    } else {
      await offerDeepChat([])
    }
  }

  const handleInterestsConfirm = async () => {
    if (isTyping) return
    await offerDeepChat(selectedInterests)
  }

  // ── Deep Chat Offer ──
  const offerDeepChat = async (interests: string[]) => {
    const finalProfile = { ...profile, interests, skills: profile.skills.length ? profile.skills : selectedSkills }
    setProfile(finalProfile)
    pushUser(interests.length > 0 ? interests.join(', ') + ' 확인!' : '완료!')
    setStepHistory(prev => [...prev, step])
    setStep('deep-chat-offer')
    await pushAi('기본 프로필이 완성됐어요!\n\nAI와 짧은 대화를 나누면 팀 매칭 정확도가 확 올라가요.\n경험, 작업 스타일, 목표 등 몇 가지만 알려주시면 됩니다.', 'deep-chat-offer', 800)
  }

  const handleDeepChatAccept = async () => {
    if (isTyping || step !== 'deep-chat-offer') return
    pushUser('좋아요, 해볼게요!')

    // 1. Fade out transition
    await new Promise(r => setTimeout(r, 400))
    setDeepChatTransition(true)

    // 2. Build profile context
    const finalSkills = profile.skills.length ? profile.skills : selectedSkills
    const finalInterests = profile.interests.length ? profile.interests : selectedInterests
    const profileCtx = {
      name: profile.name, university: profile.university, major: profile.major,
      position: profile.position, situation: profile.situation,
      skills: finalSkills, interests: finalInterests,
    }

    // 3. Save basic profile to DB first (onboarding_completed: true)
    //    so user's data is preserved even if they exit during deep chat
    try {
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: profile.name.trim(),
          desiredPosition: profile.position,
          affiliationType: profile.affiliationType || 'student',
          university: profile.university || undefined,
          major: profile.major || undefined,
          location: profile.locations.length > 0 ? profile.locations.join(', ') : '미설정',
          currentSituation: profile.situation || 'exploring',
          skills: finalSkills.map(s => ({ name: s, level: '중급' })),
          interestTags: finalInterests,
          personality: { risk: 5, time: 5, communication: 5, decision: 5 },
        }),
      })
    } catch { /* basic save failed — continue anyway, final save will retry */ }

    // 4. Fetch first AI question while transition is showing
    const firstQ = await aiDeepChat([], profileCtx, false)

    // 5. Clear bubbles and start fresh
    await new Promise(r => setTimeout(r, 800))
    setBubbles([])
    setStep('deep-chat')
    setDeepChatTransition(false)

    // 6. New session greeting
    await new Promise(r => setTimeout(r, 300))
    const aiMsg: DeepChatMessage = { role: 'assistant', content: firstQ }
    setDeepChatMessages([aiMsg])
    await pushAi(firstQ, undefined, 600)
    setTimeout(() => deepChatInputRef.current?.focus(), 200)
  }

  const handleDeepChatSkip = async () => {
    if (isTyping || step !== 'deep-chat-offer') return
    pushUser('건너뛰기')
    await finishOnboarding()
  }

  const sendDeepChatMessage = async (text: string) => {
    if (isTyping || !text.trim() || step !== 'deep-chat') return
    setDeepChatInput('')
    setShowSuggestions(false)
    pushUser(text.trim())
    const userMsg: DeepChatMessage = { role: 'user', content: text.trim() }
    const updatedMessages = [...deepChatMessages, userMsg]
    setDeepChatMessages(updatedMessages)
    const profileCtx = {
      name: profile.name, university: profile.university, major: profile.major,
      position: profile.position, situation: profile.situation,
      skills: profile.skills.length ? profile.skills : selectedSkills,
      interests: profile.interests.length ? profile.interests : selectedInterests,
    }
    const activityLabel = AI_ACTIVITY_LABELS[Math.min(updatedMessages.filter(m => m.role === 'user').length - 1, AI_ACTIVITY_LABELS.length - 1)]
    setAiActivity(activityLabel)
    setIsTyping(true)
    const reply = await aiDeepChat(updatedMessages, profileCtx)
    setIsTyping(false)
    setAiActivity(null)
    const aiMsg: DeepChatMessage = { role: 'assistant', content: reply }
    setDeepChatMessages(prev => [...prev, aiMsg])
    await pushAi(reply, undefined, 300)
    setShowSuggestions(true)
    setTimeout(() => deepChatInputRef.current?.focus(), 200)
  }

  const handleDeepChatSend = async () => {
    await sendDeepChatMessage(deepChatInput)
  }

  const handleDeepChatFinish = async () => {
    if (isTyping) return

    if (userMsgCount < 3) {
      // Not enough conversation — confirm
      await pushAi(`아직 ${3 - userMsgCount}개 정도 더 이야기하면 더 정확한 매칭이 가능해요.\n그래도 지금 마무리할까요?`, 'deep-chat-offer-finish', 400)
      return
    }

    pushUser('대화 완료!')

    if (deepChatMessages.length >= 2) {
      setStep('done')
      setAiActivity('프로필 데이터를 생성하고 있어요')
      setIsTyping(true)
      await pushAi(`${coveredTopics.length}개 영역을 분석해서 프로필에 반영하고 있어요...`, undefined, 400)

      try {
        const res = await fetch('/api/onboarding/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: deepChatMessages.map(m => ({ role: m.role, content: m.content })),
          }),
        })
        if (res.ok) {
          const { data } = await res.json()
          const summary = data?.profile?.summary
          setIsTyping(false)
          setAiActivity(null)
          if (summary) {
            await pushAi(`분석 완료!\n\n"${summary}"\n\n${profile.name}님에게 딱 맞는 팀을 찾아볼게요.`, undefined, 500)
          } else {
            await pushAi(`프로필 분석이 완료됐어요!\n${profile.name}님에게 딱 맞는 팀을 찾아볼게요.`, undefined, 500)
          }
        } else {
          setIsTyping(false)
          setAiActivity(null)
          await pushAi(`프로필 분석이 완료됐어요!\n${profile.name}님에게 딱 맞는 팀을 찾아볼게요.`, undefined, 500)
        }
      } catch {
        setIsTyping(false)
        setAiActivity(null)
        await pushAi(`프로필 분석이 완료됐어요!\n${profile.name}님에게 딱 맞는 팀을 찾아볼게요.`, undefined, 500)
      }
      handleSave(profile)
    } else {
      await finishOnboarding()
    }
  }

  const forceFinishDeepChat = async () => {
    pushUser('지금 마무리할게요')
    if (deepChatMessages.length >= 2) {
      setStep('done')
      setAiActivity('프로필 데이터를 생성하고 있어요')
      setIsTyping(true)
      await pushAi('대화 내용을 분석해서 프로필에 반영하고 있어요...', undefined, 400)
      try {
        await fetch('/api/onboarding/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: deepChatMessages.map(m => ({ role: m.role, content: m.content })),
          }),
        })
      } catch { /* summarize failed — basic profile is already saved */ }
      setIsTyping(false)
      setAiActivity(null)
      await pushAi(`프로필 분석이 완료됐어요!\n${profile.name}님에게 딱 맞는 팀을 찾아볼게요.`, undefined, 500)
      handleSave(profile)
    } else {
      await finishOnboarding()
    }
  }

  const finishOnboarding = async () => {
    setStep('done')
    await pushAi(`프로필 설정이 완료됐어요!\n${profile.name}님에게 맞는 프로젝트를 찾아볼게요.`, undefined, 600)
    handleSave(profile)
  }

  const handleSave = async (p: typeof profile) => {
    setIsSaving(true)
    setSaveError(null)
    try {
      const transcript = deepChatMessages.length > 0
        ? deepChatMessages.map(m => ({ role: m.role, content: m.content, timestamp: new Date().toISOString() }))
        : undefined
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: p.name.trim(),
          desiredPosition: p.position,
          affiliationType: p.affiliationType || 'student',
          university: p.university || undefined,
          major: p.major || undefined,
          location: p.locations.length > 0 ? p.locations.join(', ') : '미설정',
          currentSituation: p.situation || 'exploring',
          skills: (p.skills.length ? p.skills : selectedSkills).map(s => ({ name: s, level: '중급' })),
          interestTags: p.interests.length ? p.interests : selectedInterests,
          personality: { risk: 5, time: 5, communication: 5, decision: 5 },
          ...(transcript && { aiChatTranscript: transcript, aiChatCompleted: true }),
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        const errMsg = errData?.error?.message || errData?.error || 'Save failed'
        throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg))
      }
      setTimeout(onComplete, 1500)
    } catch (err) {
      console.error('[Onboarding] save error:', err)
      setSaveError(err instanceof Error ? err.message : '저장에 실패했습니다.')
      setIsSaving(false)
    }
  }

  // ── Back Navigation ──
  const canGoBack = !['greeting', 'cta', 'info', 'deep-chat', 'done'].includes(step) && !isTyping && !isSaving && stepHistory.length > 0

  const goBack = () => {
    if (!canGoBack) return
    const prevStep = stepHistory[stepHistory.length - 1]
    setStepHistory(prev => prev.slice(0, -1))
    setBubbles(prev => {
      let lastUserIdx = -1
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].role === 'user') { lastUserIdx = i; break }
      }
      if (lastUserIdx === -1) return prev
      return prev.slice(0, lastUserIdx)
    })
    setStep(prevStep)
  }

  // ── Helpers ──
  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill])
  }
  const removeSkill = (skill: string) => {
    setSelectedSkills(prev => prev.filter(s => s !== skill))
  }
  const toggleInterest = (tag: string) => {
    setSelectedInterests(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }
  const removeInterest = (tag: string) => {
    setSelectedInterests(prev => prev.filter(t => t !== tag))
  }

  const isActiveBubble = (id: string, attachment?: Bubble['attachment']) => {
    if (!attachment) return false
    const last = [...bubbles].reverse().find(b => b.attachment === attachment)
    return last?.id === id
  }

  const stepMap: Record<string, Step> = {
    'cta': 'cta', 'info-form': 'info', 'position': 'position', 'situation': 'situation',
    'skills-input': 'skills-input', 'skills-confirm': 'skills-confirm',
    'interests-input': 'interests-input', 'interests-confirm': 'interests-confirm',
    'deep-chat-offer': 'deep-chat-offer',
    'deep-chat-offer-finish': 'deep-chat',
  }

  // ── Render ──
  return (
    <div className={`fixed inset-0 bg-surface-bg flex transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ob-bubble-in { 0% { opacity:0;transform:translateY(18px) scale(0.94) } 55% { opacity:1;transform:translateY(-3px) scale(1.01) } 100% { opacity:1;transform:translateY(0) scale(1) } }
        @keyframes ob-chip-in { 0% { opacity:0;transform:scale(0.85) translateY(6px) } 70% { opacity:1;transform:scale(1.04) translateY(0) } 100% { opacity:1;transform:scale(1) translateY(0) } }
        @keyframes ob-form-in { 0% { opacity:0;max-height:0;margin-top:0 } 100% { opacity:1;max-height:800px;margin-top:12px } }
        @keyframes ob-cta-glow { 0%,100% { box-shadow:0 0 0 0 rgba(0,0,0,0.08) } 50% { box-shadow:0 0 0 8px rgba(0,0,0,0) } }
        @keyframes ob-dot { 0%,80%,100% { transform:scale(0.6);opacity:0.4 } 40% { transform:scale(1);opacity:1 } }
        @keyframes ob-avatar-pulse { 0%,100% { box-shadow:0 0 0 0 rgba(0,0,0,0.06) } 50% { box-shadow:0 0 0 6px rgba(0,0,0,0) } }
        @keyframes ob-tag-pop { 0% { opacity:0;transform:scale(0.5) } 60% { transform:scale(1.1) } 100% { opacity:1;transform:scale(1) } }
        @keyframes typing { 0% { max-width:0 } 100% { max-width:100% } }
        .ob-bubble { animation:ob-bubble-in 0.5s cubic-bezier(0.34,1.4,0.64,1) both }
        .ob-chip { animation:ob-chip-in 0.35s cubic-bezier(0.34,1.4,0.64,1) both }
        .ob-form { animation:ob-form-in 0.5s cubic-bezier(0.16,1,0.3,1) both;overflow:hidden }
        .ob-cta { animation:ob-cta-glow 2s ease-in-out infinite }
        .ob-dot { animation:ob-dot 1.4s ease-in-out infinite }
        .ob-avatar { animation:ob-avatar-pulse 3s ease-in-out infinite }
        .ob-tag-pop { animation:ob-tag-pop 0.3s cubic-bezier(0.34,1.4,0.64,1) both }
        .ob-hover { transition:all 0.2s cubic-bezier(0.34,1.4,0.64,1) }
        .ob-hover:hover { transform:scale(1.06) translateY(-1px) }
        .ob-hover:active { transform:scale(0.96) }
      `}} />

      {/* Deep chat transition overlay */}
      {deepChatTransition && (
        <div className="fixed inset-0 z-50 bg-surface-bg flex flex-col items-center justify-center px-6" style={{ animation: 'ob-bubble-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
          <div className="w-14 h-14 bg-black flex items-center justify-center ob-avatar mb-5">
            <span className="text-white text-lg font-black">D</span>
          </div>
          <div className="flex items-center gap-2 mb-1.5">
            <Loader2 size={16} className="animate-spin text-txt-disabled" />
            <span className="text-[14px] font-bold text-txt-primary">AI 분석 세션 준비 중...</span>
          </div>
          <p className="text-[12px] text-txt-tertiary font-mono mb-6">프로필 기반으로 맞춤 질문을 만들고 있어요</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-md w-full">
            {DEEP_CHAT_TOPICS.slice(0, 4).map((topic, i) => {
              const Icon = topic.icon
              return (
                <div key={topic.id} className="ob-chip flex flex-col items-center gap-1.5 px-3 py-2.5 bg-surface-card border border-border text-center" style={{ animationDelay: `${i * 100 + 300}ms` }}>
                  <Icon size={14} className="text-txt-disabled" />
                  <span className="text-[10px] font-mono text-txt-tertiary">{topic.label}</span>
                </div>
              )
            })}
          </div>
          <p className="text-[10px] text-txt-disabled font-mono mt-4">자유롭게 답하면 돼요 · 2~3분 소요</p>
        </div>
      )}

      {/* Chat */}
      <div className={`flex-1 flex flex-col min-w-0 transition-opacity duration-500 ${deepChatTransition ? 'opacity-0' : 'opacity-100'}`}>
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-border flex items-center gap-3 bg-surface-card/80 backdrop-blur-md shrink-0">
          <div className="w-9 h-9 bg-black flex items-center justify-center ob-avatar shrink-0">
            <span className="text-white text-sm font-black">D</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[13px] font-bold text-txt-primary leading-none">{step === 'deep-chat' ? `Draft AI · 프로필 분석${userMsgCount > 0 ? ` (${userMsgCount}회)` : ''}` : 'Draft AI'}</h1>
            <p className="text-[11px] text-status-success-text font-medium mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-status-success-text inline-block" />
              온라인
            </p>
          </div>
          <ProgressBar step={step} />
        </div>

        {/* Rotating Tip */}
        {step !== 'done' && (
          <div className="flex justify-center py-2 shrink-0 border-b border-border bg-surface-sunken/50">
            <p className="text-[10px] font-mono text-txt-tertiary animate-in fade-in slide-in-from-bottom-1 duration-500" key={tipIndex}>
              <span className="font-bold text-[#4F46E5] mr-1">tip:</span>
              <span className="animate-[typing_0.6s_steps(30)_both] inline-block overflow-hidden whitespace-nowrap">{ONBOARDING_TIPS[tipIndex]}</span>
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 sm:px-5 py-6 space-y-1">
            {bubbles.map((bubble, i) => {
              const isAi = bubble.role === 'ai'
              const prev = bubbles[i - 1]
              const showAvatar = isAi && (!prev || prev.role !== 'ai')
              const isGrouped = isAi && prev?.role === 'ai'
              const active = bubble.attachment && isActiveBubble(bubble.id, bubble.attachment) && stepMap[bubble.attachment] === step

              return (
                <div key={bubble.id}>
                  {prev && prev.role !== bubble.role && <div className="h-4" />}
                  <div className={`flex ${isAi ? 'justify-start' : 'justify-end'} ${isGrouped ? 'mt-1' : ''}`}>
                    {isAi && (
                      <div className="w-8 mr-2 shrink-0 flex flex-col items-center">
                        {showAvatar ? (
                          <div className="w-7 h-7 bg-black flex items-center justify-center mt-0.5">
                            <span className="text-white text-[10px] font-black">D</span>
                          </div>
                        ) : <div className="w-7" />}
                      </div>
                    )}
                    <div className={`flex flex-col ${isAi ? 'items-start' : 'items-end'} max-w-[80%] sm:max-w-[72%]`}>
                      <div className={`ob-bubble text-[14px] leading-[1.6] whitespace-pre-wrap px-4 py-2.5 ${isAi ? 'bg-surface-card text-txt-primary border border-border shadow-sharp' : 'bg-surface-inverse text-txt-inverse'}`}>
                        {bubble.content}
                      </div>

                      {/* Attachments */}
                      {active && (
                        <div className="ob-form w-full">
                          {bubble.attachment === 'cta' && (
                            <div className="mt-3">
                              <button onClick={handleCtaClick} className="ob-cta ob-hover inline-flex items-center gap-2.5 px-6 py-3 bg-[#4F46E5] text-white text-[13px] font-bold shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] border-2 border-[#4F46E5]">
                                프로필 입력하기 <ArrowRight size={15} />
                              </button>
                              <p className="text-[11px] text-txt-tertiary mt-2.5 ml-1 font-mono">1분이면 끝나요</p>
                            </div>
                          )}

                          {bubble.attachment === 'info-form' && (
                            <div className="mt-3 bg-surface-card border border-border-strong p-4 shadow-sharp space-y-3">
                              <div>
                                <label className="text-[10px] font-bold text-txt-tertiary uppercase tracking-wider mb-1.5 block font-mono">닉네임 *</label>
                                <input type="text" value={profile.name} onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="어떻게 불러드릴까요?" className="w-full px-3.5 py-2.5 bg-surface-sunken border border-border text-sm font-medium focus:outline-none focus:border-border-strong focus:bg-surface-card transition-all placeholder:text-txt-disabled" autoFocus onKeyDown={(e) => e.key === 'Enter' && profile.name.trim() && handleInfoSubmit()} />
                              </div>
                              {/* 소속 유형 */}
                              <div>
                                <label className="text-[10px] font-bold text-txt-tertiary uppercase tracking-wider mb-1.5 block font-mono">소속 유형</label>
                                <div className="flex flex-wrap gap-1.5">
                                  {AFFILIATION_OPTIONS.map((aff) => (
                                    <button
                                      key={aff.value}
                                      type="button"
                                      onClick={() => setProfile(p => ({ ...p, affiliationType: aff.value }))}
                                      className={`px-2.5 py-1.5 text-[11px] font-medium border transition-all ${
                                        profile.affiliationType === aff.value
                                          ? 'bg-black text-white border-black'
                                          : 'bg-surface-sunken text-txt-tertiary border-border hover:border-border-strong hover:text-txt-primary'
                                      }`}
                                    >
                                      {aff.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              {(() => {
                                const aff = AFFILIATION_OPTIONS.find(a => a.value === profile.affiliationType) || AFFILIATION_OPTIONS[0]
                                const showUnivCombo = profile.affiliationType === 'student' || profile.affiliationType === 'graduate'
                                return (
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-[10px] font-bold text-txt-tertiary uppercase tracking-wider mb-1.5 block font-mono">{aff.orgPlaceholder === '대학교' ? '소속' : aff.orgPlaceholder.replace(' (선택)', '')}</label>
                                      {showUnivCombo ? (
                                        <OnboardingComboBox
                                          value={profile.university}
                                          onChange={(v) => setProfile(p => ({ ...p, university: v }))}
                                          options={UNIVERSITY_LIST}
                                          placeholder={aff.orgPlaceholder}
                                        />
                                      ) : (
                                        <input type="text" value={profile.university} onChange={(e) => setProfile(p => ({ ...p, university: e.target.value }))} placeholder={aff.orgPlaceholder} className="w-full px-3.5 py-2.5 bg-surface-sunken border border-border text-sm font-medium focus:outline-none focus:border-border-strong focus:bg-surface-card transition-all placeholder:text-txt-disabled" />
                                      )}
                                    </div>
                                    <div>
                                      <label className="text-[10px] font-bold text-txt-tertiary uppercase tracking-wider mb-1.5 block font-mono">{aff.rolePlaceholder.replace(' (선택)', '')}</label>
                                      <input type="text" value={profile.major} onChange={(e) => setProfile(p => ({ ...p, major: e.target.value }))} placeholder={aff.rolePlaceholder} className="w-full px-3.5 py-2.5 bg-surface-sunken border border-border text-sm font-medium focus:outline-none focus:border-border-strong focus:bg-surface-card transition-all placeholder:text-txt-disabled" />
                                    </div>
                                  </div>
                                )
                              })()}
                              <div>
                                <label className="text-[10px] font-bold text-txt-tertiary uppercase tracking-wider mb-1.5 block font-mono">활동 지역</label>
                                <div className="flex flex-wrap gap-1.5">
                                  {LOCATION_OPTIONS.map((loc) => (
                                    <button
                                      key={loc}
                                      type="button"
                                      onClick={() => setProfile(p => ({
                                        ...p,
                                        locations: p.locations.includes(loc)
                                          ? p.locations.filter(l => l !== loc)
                                          : [...p.locations, loc],
                                      }))}
                                      className={`px-2 py-1 text-[11px] font-medium border transition-all ${
                                        profile.locations.includes(loc)
                                          ? 'bg-black text-white border-black'
                                          : 'bg-surface-sunken text-txt-tertiary border-border hover:border-border-strong hover:text-txt-primary'
                                      }`}
                                    >
                                      {loc}
                                    </button>
                                  ))}
                                </div>
                                {profile.locations.length > 0 && (
                                  <p className="text-[10px] text-txt-tertiary font-mono mt-1">{profile.locations.join(', ')} 선택됨</p>
                                )}
                              </div>
                              <button onClick={handleInfoSubmit} disabled={!profile.name.trim()} className="w-full py-2.5 bg-[#4F46E5] text-white text-[13px] font-bold hover:bg-[#4338CA] transition-all flex items-center justify-center gap-2 disabled:opacity-20 disabled:cursor-not-allowed ob-hover shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] border-2 border-[#4F46E5]">
                                입력 완료 <ArrowRight size={14} />
                              </button>
                              <p className="text-[10px] text-txt-tertiary text-center font-mono">닉네임만 필수예요 · 나중에 수정 가능</p>
                            </div>
                          )}

                          {bubble.attachment === 'position' && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {POSITION_OPTIONS.map((pos, idx) => (
                                <button key={pos} onClick={() => handlePositionSelect(pos)} className="ob-chip ob-hover px-3.5 py-2 bg-surface-card border border-border-strong text-[13px] font-medium text-txt-secondary hover:border-border-strong hover:bg-black hover:text-white" style={{ animationDelay: `${idx * 40}ms` }}>
                                  {pos}
                                </button>
                              ))}
                            </div>
                          )}

                          {bubble.attachment === 'situation' && (
                            <div className="mt-3 space-y-1.5">
                              {SITUATION_OPTIONS.map((sit, idx) => (
                                <button key={sit.value} onClick={() => handleSituationSelect(sit)} className="ob-chip ob-hover w-full text-left px-4 py-3 bg-surface-card border border-border-strong hover:border-border-strong transition-all group" style={{ animationDelay: `${idx * 60}ms` }}>
                                  <div className="text-[13px] font-bold text-txt-primary group-hover:text-black">{sit.label}</div>
                                  <div className="text-[11px] text-txt-tertiary mt-0.5 font-mono">{sit.desc}</div>
                                </button>
                              ))}
                            </div>
                          )}

                          {bubble.attachment === 'skills-input' && (
                            <div className="mt-3 bg-surface-card border border-border-strong p-4 shadow-sharp space-y-3">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Sparkles size={10} className="text-[#4F46E5]" />
                                <span className="text-[10px] font-mono font-medium text-[#4F46E5]">AI가 자동으로 정리해드려요</span>
                              </div>
                              <div className="relative">
                                <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="예: 리액트, 파이썬, 피그마 등" className="w-full pl-3.5 pr-10 py-2.5 bg-surface-sunken border border-border text-sm font-medium focus:outline-none focus:border-border-strong focus:bg-surface-card transition-all placeholder:text-txt-disabled" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSkillInputSubmit()} />
                                <button onClick={handleSkillInputSubmit} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-txt-disabled hover:text-black transition-colors"><Send size={15} /></button>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-txt-tertiary uppercase tracking-wider mb-2 font-mono">빠른 선택</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {POPULAR_SKILLS.map((skill, idx) => (
                                    <button key={skill} onClick={() => toggleSkill(skill)} className={`ob-chip ob-hover px-3 py-1.5 text-[12px] font-medium border transition-all ${selectedSkills.includes(skill) ? 'bg-black text-white border-black' : 'bg-surface-sunken text-txt-secondary border-border-strong hover:border-border-strong'}`} style={{ animationDelay: `${idx * 30}ms` }}>{skill}</button>
                                  ))}
                                </div>
                              </div>
                              {selectedSkills.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {selectedSkills.map(s => (
                                    <span key={s} className="ob-tag-pop inline-flex items-center gap-1 px-2.5 py-1 bg-[#4F46E5] text-white text-[11px] font-medium">{s}<button onClick={() => removeSkill(s)} className="hover:text-white/60 transition-colors"><X size={11} /></button></span>
                                  ))}
                                </div>
                              )}
                              <button onClick={handleSkillInputSubmit} className="w-full py-2.5 bg-[#4F46E5] text-white text-[13px] font-bold hover:bg-[#4338CA] transition-all flex items-center justify-center gap-2 ob-hover shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] border-2 border-[#4F46E5]">
                                {skillInput.trim() || selectedSkills.length > 0 ? '다음' : '건너뛰기'} <ArrowRight size={14} />
                              </button>
                            </div>
                          )}

                          {bubble.attachment === 'skills-confirm' && (
                            <div className="mt-3 space-y-3">
                              <div className="flex flex-wrap gap-1.5">
                                {selectedSkills.map((skill, idx) => (
                                  <span key={skill} className="ob-chip inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#4F46E5] text-white text-[13px] font-medium" style={{ animationDelay: `${idx * 40}ms` }}>{skill}<button onClick={() => removeSkill(skill)} className="hover:text-white/60 transition-colors"><X size={13} /></button></span>
                                ))}
                              </div>
                              <button onClick={handleSkillsConfirm} className="ob-hover px-5 py-2 bg-black text-white text-[13px] font-bold flex items-center gap-2 shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">
                                {selectedSkills.length > 0 ? '확인' : '건너뛰기'} <ArrowRight size={14} />
                              </button>
                            </div>
                          )}

                          {bubble.attachment === 'interests-input' && (
                            <div className="mt-3 bg-surface-card border border-border-strong p-4 shadow-sharp space-y-3">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Sparkles size={10} className="text-[#4F46E5]" />
                                <span className="text-[10px] font-mono font-medium text-[#4F46E5]">AI가 자동으로 정리해드려요</span>
                              </div>
                              <div className="relative">
                                <input type="text" value={interestInput} onChange={(e) => setInterestInput(e.target.value)} placeholder="예: AI, 게임, 교육 등" className="w-full pl-3.5 pr-10 py-2.5 bg-surface-sunken border border-border text-sm font-medium focus:outline-none focus:border-border-strong focus:bg-surface-card transition-all placeholder:text-txt-disabled" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleInterestInputSubmit()} />
                                <button onClick={handleInterestInputSubmit} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-txt-disabled hover:text-black transition-colors"><Send size={15} /></button>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-txt-tertiary uppercase tracking-wider mb-2 font-mono">빠른 선택</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {INTEREST_OPTIONS.map((tag, idx) => (
                                    <button key={tag} onClick={() => toggleInterest(tag)} className={`ob-chip ob-hover px-3 py-1.5 text-[12px] font-medium border transition-all ${selectedInterests.includes(tag) ? 'bg-black text-white border-black' : 'bg-surface-sunken text-txt-secondary border-border-strong hover:border-border-strong'}`} style={{ animationDelay: `${idx * 25}ms` }}>{tag}</button>
                                  ))}
                                </div>
                              </div>
                              {selectedInterests.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {selectedInterests.map(t => (
                                    <span key={t} className="ob-tag-pop inline-flex items-center gap-1 px-2.5 py-1 bg-[#4F46E5] text-white text-[11px] font-medium">{t}<button onClick={() => removeInterest(t)} className="hover:text-white/60 transition-colors"><X size={11} /></button></span>
                                  ))}
                                </div>
                              )}
                              <button onClick={handleInterestInputSubmit} className="w-full py-2.5 bg-[#4F46E5] text-white text-[13px] font-bold hover:bg-[#4338CA] transition-all flex items-center justify-center gap-2 ob-hover shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] border-2 border-[#4F46E5]">
                                {interestInput.trim() || selectedInterests.length > 0 ? '다음' : '건너뛰기'} <ArrowRight size={14} />
                              </button>
                            </div>
                          )}

                          {bubble.attachment === 'interests-confirm' && (
                            <div className="mt-3 space-y-3">
                              <div className="flex flex-wrap gap-1.5">
                                {selectedInterests.map((tag, idx) => (
                                  <span key={tag} className="ob-chip inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#4F46E5] text-white text-[13px] font-medium" style={{ animationDelay: `${idx * 40}ms` }}>{tag}<button onClick={() => removeInterest(tag)} className="hover:text-white/60 transition-colors"><X size={13} /></button></span>
                                ))}
                              </div>
                              <button onClick={handleInterestsConfirm} className="ob-hover px-5 py-2 bg-black text-white text-[13px] font-bold flex items-center gap-2 shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">
                                확인 <ArrowRight size={14} />
                              </button>
                            </div>
                          )}

                          {bubble.attachment === 'deep-chat-offer' && (
                            <div className="mt-3 space-y-2">
                              <button onClick={handleDeepChatAccept} className="ob-chip ob-hover w-full text-left px-4 py-3.5 bg-[#4F46E5] text-white border-2 border-[#4F46E5] shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all" style={{ animationDelay: '0ms' }}>
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 bg-white/15 flex items-center justify-center shrink-0">
                                    <MessageCircle size={16} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[13px] font-bold">AI와 대화하기</div>
                                    <div className="text-[11px] text-white/70 mt-0.5 font-mono">2~3분 · 매칭 정확도 +40%</div>
                                  </div>
                                  <ArrowRight size={14} className="text-white/50 shrink-0" />
                                </div>
                              </button>
                              <button onClick={handleDeepChatSkip} className="ob-chip ob-hover w-full text-left px-4 py-3 bg-surface-card border border-border-strong hover:border-border-strong transition-all" style={{ animationDelay: '80ms' }}>
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 bg-surface-sunken flex items-center justify-center shrink-0">
                                    <ArrowRight size={14} className="text-txt-disabled" />
                                  </div>
                                  <div>
                                    <div className="text-[13px] font-bold text-txt-primary">건너뛰고 시작하기</div>
                                    <div className="text-[11px] text-txt-tertiary mt-0.5 font-mono">나중에 프로필에서 가능</div>
                                  </div>
                                </div>
                              </button>
                            </div>
                          )}

                          {bubble.attachment === ('deep-chat-offer-finish') && (
                            <div className="mt-3 space-y-2">
                              <button onClick={() => { setBubbles(prev => prev.filter(b => b.attachment !== ('deep-chat-offer-finish'))) }} className="ob-chip ob-hover w-full text-left px-4 py-2.5 bg-[#4F46E5] text-white border-2 border-[#4F46E5] shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-[13px] font-bold" style={{ animationDelay: '0ms' }}>
                                조금 더 대화하기
                              </button>
                              <button onClick={forceFinishDeepChat} className="ob-chip ob-hover w-full text-left px-4 py-2.5 bg-surface-card border border-border-strong hover:border-border-strong transition-all text-[13px] font-bold text-txt-primary" style={{ animationDelay: '60ms' }}>
                                지금 마무리하기
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {isTyping && (
              <div className="flex justify-start mt-1">
                <div className="w-8 mr-2 shrink-0" />
                <div className="ob-bubble bg-surface-card border border-border px-4 py-3 shadow-sharp">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-[5px]">
                      <div className="w-[7px] h-[7px] bg-txt-disabled ob-dot" style={{ animationDelay: '0ms' }} />
                      <div className="w-[7px] h-[7px] bg-txt-disabled ob-dot" style={{ animationDelay: '200ms' }} />
                      <div className="w-[7px] h-[7px] bg-txt-disabled ob-dot" style={{ animationDelay: '400ms' }} />
                    </div>
                    {aiActivity && (
                      <span className="text-[11px] text-[#4F46E5] font-medium font-mono flex items-center gap-1">
                        <Sparkles size={10} />
                        {aiActivity}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isSaving && step === 'done' && (
              <div className="flex justify-start mt-2">
                <div className="w-8 mr-2 shrink-0" />
                <div className="ob-bubble flex items-center gap-2 bg-surface-card border border-border px-4 py-2.5 shadow-sharp">
                  <Loader2 size={14} className="animate-spin text-txt-disabled" />
                  <span className="text-[13px] text-txt-tertiary font-mono">프로필 저장 중...</span>
                </div>
              </div>
            )}

            {saveError && (
              <div className="flex justify-start mt-2">
                <div className="w-8 mr-2 shrink-0" />
                <div className="ob-bubble bg-status-danger-bg border border-status-danger-text/20 px-4 py-2.5">
                  <p className="text-[13px] text-status-danger-text font-medium">{saveError}</p>
                  <button onClick={() => handleSave(profile)} className="text-[12px] text-status-danger-text underline underline-offset-2 mt-1 hover:text-status-danger-text/80">다시 시도</button>
                </div>
              </div>
            )}

            <div ref={chatEndRef} className="h-4" />
          </div>
        </div>

        {/* Bottom */}
        {step === 'deep-chat' ? (
          <div className="border-t border-border bg-surface-card/80 backdrop-blur-md">
            {/* Suggestions */}
            {showSuggestions && !isTyping && currentSuggestions.length > 0 && deepChatMessages.length > 0 && (
              <div className="px-4 pt-2.5 pb-0">
                <div className="max-w-2xl mx-auto">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Lightbulb size={10} className="text-txt-disabled" />
                    <span className="text-[10px] font-mono text-txt-disabled uppercase tracking-wider">Quick Reply</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {currentSuggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => sendDeepChatMessage(suggestion)}
                        className="ob-chip text-[12px] px-3 py-1.5 bg-surface-sunken border border-border text-txt-secondary hover:border-border-strong hover:text-txt-primary transition-all"
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {/* Input */}
            <div className="px-4 py-3">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input ref={deepChatInputRef} type="text" value={deepChatInput} onChange={(e) => setDeepChatInput(e.target.value)} placeholder={userMsgCount === 0 ? '첫 번째 질문에 답해보세요...' : '이어서 이야기해주세요...'} className="w-full pl-4 pr-11 py-3 bg-surface-sunken border-2 border-border-strong text-sm font-medium focus:outline-none focus:border-border-strong focus:bg-surface-card transition-all placeholder:text-txt-disabled" onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleDeepChatSend()} disabled={isTyping} />
                    <button onClick={handleDeepChatSend} disabled={isTyping || !deepChatInput.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-txt-disabled hover:text-black transition-colors disabled:opacity-30"><Send size={16} /></button>
                  </div>
                  <button onClick={handleDeepChatFinish} disabled={isTyping} className={`ob-hover px-4 py-3 text-[13px] font-bold flex items-center gap-1.5 shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50 shrink-0 transition-all ${userMsgCount >= 3 ? 'bg-[#4F46E5] text-white border-2 border-[#4F46E5]' : 'bg-black text-white'}`}>
                    <CheckCircle2 size={14} />완료
                  </button>
                </div>
                {/* Topic progress bar */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    {DEEP_CHAT_TOPICS.slice(0, 6).map(topic => {
                      const covered = coveredTopics.includes(topic.id)
                      return (
                        <div key={topic.id} title={topic.label} className={`w-1.5 h-1.5 transition-all duration-500 ${covered ? 'bg-[#4F46E5]' : 'bg-border'}`} />
                      )
                    })}
                    <span className="text-[10px] font-mono text-txt-disabled ml-1.5">
                      {coveredTopics.length}/{DEEP_CHAT_TOPICS.length} topics
                    </span>
                  </div>
                  <span className="text-[10px] text-txt-disabled font-mono">
                    {userMsgCount < 3 ? `${3 - userMsgCount}개 더 답하면 완료 가능` : '언제든 완료 가능'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3 border-t border-border bg-surface-card/60 backdrop-blur-sm">
            <div className="max-w-2xl mx-auto flex items-center justify-between">
              {canGoBack ? (
                <button onClick={goBack} className="flex items-center gap-1.5 text-[12px] text-txt-tertiary hover:text-txt-primary font-medium transition-colors ob-hover">
                  <ArrowLeft size={14} />
                  이전 단계
                </button>
              ) : (
                <span className="text-[10px] font-mono text-txt-tertiary uppercase tracking-widest">Draft Onboarding</span>
              )}
              <span className="text-[10px] text-txt-tertiary font-mono">나중에 프로필에서 수정 가능</span>
            </div>
          </div>
        )}
      </div>

      {/* Preview (xl+) */}
      <div className="hidden xl:flex w-[21rem] flex-col bg-surface-card/50 border-l border-border backdrop-blur-sm">
        <div className="flex-1 flex flex-col items-center justify-center p-7">
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono font-bold text-txt-disabled uppercase tracking-widest">Preview</span>
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
                    {profile.university && <span className="flex items-center gap-1"><Building2 size={10} />{profile.affiliationType !== 'student' ? `${AFFILIATION_OPTIONS.find(a => a.value === profile.affiliationType)?.label || ''} · ` : ''}{profile.university}{profile.major ? ` · ${profile.major}` : ''}</span>}
                    {profile.locations.length > 0 && <span className="flex items-center gap-1"><MapPin size={10} />{profile.locations.join(', ')}</span>}
                  </div>
                )}
                {profile.situation && (
                  <div className="px-3 py-2 bg-surface-sunken border border-border">
                    <p className="text-[12px] text-txt-secondary font-medium">{SITUATION_OPTIONS.find(s => s.value === profile.situation)?.label}</p>
                  </div>
                )}
                {(profile.skills.length > 0 || selectedSkills.length > 0) && (
                  <div className="pt-2 border-t border-border-subtle">
                    <label className="text-[10px] font-bold text-txt-disabled uppercase font-mono mb-1.5 flex items-center gap-1"><Code2 size={9} /> Skills</label>
                    <div className="flex flex-wrap gap-1">{(profile.skills.length > 0 ? profile.skills : selectedSkills).map(s => <span key={s} className="px-2 py-0.5 bg-[#4F46E5] text-white text-[10px] font-medium">{s}</span>)}</div>
                  </div>
                )}
                {(profile.interests.length > 0 || selectedInterests.length > 0) && (
                  <div className="pt-2 border-t border-border-subtle">
                    <label className="text-[10px] font-bold text-txt-disabled uppercase font-mono mb-1.5 flex items-center gap-1"><Target size={9} /> Interests</label>
                    <div className="flex flex-wrap gap-1">{(profile.interests.length > 0 ? profile.interests : selectedInterests).map(t => <span key={t} className="px-2 py-0.5 bg-[#4F46E5]/5 border border-[#4F46E5]/20 text-[#4F46E5] text-[10px] font-medium">{t}</span>)}</div>
                  </div>
                )}
                {step === 'deep-chat' && deepChatMessages.length > 0 && (
                  <div className="pt-2 border-t border-border-subtle">
                    <label className="text-[10px] font-bold text-txt-disabled uppercase font-mono mb-2 flex items-center gap-1"><MessageCircle size={9} /> AI Analysis</label>
                    <div className="space-y-1.5">
                      {DEEP_CHAT_TOPICS.slice(0, 6).map(topic => {
                        const covered = coveredTopics.includes(topic.id)
                        const Icon = topic.icon
                        return (
                          <div key={topic.id} className="flex items-center gap-2">
                            <Icon size={10} className={covered ? 'text-[#4F46E5]' : 'text-txt-disabled'} />
                            <span className={`text-[10px] font-mono ${covered ? 'text-txt-primary' : 'text-txt-disabled'}`}>{topic.label}</span>
                            {covered && <div className="w-1 h-1 bg-[#4F46E5] ml-auto" />}
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-border-subtle">
                      <div className="w-1.5 h-1.5 bg-[#4F46E5] animate-pulse" />
                      <span className="text-[10px] text-txt-tertiary font-mono">{userMsgCount}회 대화 · {coveredTopics.length}개 분석</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-surface-inverse px-4 py-2 flex justify-between items-center">
                <span className="text-[9px] font-mono text-txt-tertiary uppercase tracking-wider">Draft Profile</span>
                {step === 'done' ? (
                  <div className="flex items-center gap-1 text-green-400"><Sparkles size={10} fill="currentColor" /><span className="text-[10px] font-bold uppercase">Done</span></div>
                ) : step === 'deep-chat' ? (
                  <div className="flex items-center gap-1 text-[#818CF8]"><MessageCircle size={10} /><span className="text-[10px] font-bold uppercase font-mono">AI Chat</span></div>
                ) : (
                  <span className="text-[9px] text-txt-secondary font-mono">설정 중...</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProgressBar({ step }: { step: Step }) {
  const steps: Step[] = ['greeting', 'cta', 'info', 'position', 'situation', 'skills-input', 'skills-confirm', 'interests-input', 'interests-confirm', 'deep-chat-offer', 'deep-chat', 'done']
  const idx = steps.indexOf(step)
  const pct = Math.round((idx / (steps.length - 1)) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-[5px] bg-surface-sunken border border-border overflow-hidden">
        <div className="h-full bg-[#4F46E5] transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono text-txt-disabled tabular-nums w-7 text-right">{pct}%</span>
    </div>
  )
}

// 온보딩 전용 콤보박스 (온보딩 디자인 톤에 맞춤)
function OnboardingComboBox({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = search.trim()
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase())).slice(0, 6)
    : options.slice(0, 6)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center bg-surface-sunken border border-border focus-within:border-border-strong focus-within:bg-surface-card transition-all">
        <input
          type="text"
          value={isOpen ? search || value : value}
          onChange={(e) => { setSearch(e.target.value); onChange(e.target.value); if (!isOpen) setIsOpen(true) }}
          onFocus={() => { setIsOpen(true); setSearch(value) }}
          placeholder={placeholder}
          maxLength={50}
          className="flex-1 px-3.5 py-2.5 text-sm font-medium bg-transparent focus:outline-none placeholder:text-txt-disabled min-w-0"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="pr-3 text-txt-disabled hover:text-txt-secondary transition-colors"
        >
          <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {isOpen && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-surface-card border border-border-strong shadow-sharp max-h-36 overflow-y-auto">
          {filtered.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setSearch(''); setIsOpen(false) }}
              className={`w-full text-left px-3.5 py-2 text-sm hover:bg-surface-sunken transition-colors ${
                value === opt ? 'text-black font-semibold bg-surface-sunken' : 'text-txt-secondary'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
