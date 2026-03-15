'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Bot, ArrowRight, User, Building2, Target, Sparkles, CheckCircle2, Circle, Loader2 } from 'lucide-react'

interface OnboardingProps {
  onComplete: () => void
}

interface Message {
  id: string
  role: 'ai' | 'user'
  content: string
  options?: string[]
  multiSelect?: boolean
}

const POSITION_OPTIONS = ['프론트엔드 개발', '백엔드 개발', '풀스택 개발', 'UI/UX 디자인', 'PM / 기획', '마케팅', '기타']

const INTEREST_OPTIONS = ['AI/ML', 'Web', 'Mobile', 'HealthTech', 'EdTech', 'Fintech', 'Social', 'E-commerce', 'IoT', 'Game', 'Blockchain']

const STEPS = [
  { id: 0, label: '이름', desc: '닉네임 입력' },
  { id: 1, label: '포지션', desc: '전문 분야 선택' },
  { id: 2, label: '관심 분야', desc: '선택 사항' },
]

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'ai',
      content: '안녕하세요! Draft에 오신 것을 환영합니다.\n프로필을 빠르게 설정해볼게요.\n\n닉네임을 알려주세요!',
    },
  ])
  const [input, setInput] = useState('')
  const [step, setStep] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])

  const [profile, setProfile] = useState({
    name: '',
    position: '',
    interests: [] as string[],
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const addAiMessage = (msg: Omit<Message, 'role'>) => {
    setMessages((prev) => [...prev, { ...msg, role: 'ai' }])
  }

  const saveProfile = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: profile.name,
          desiredPosition: profile.position,
          interestTags: profile.interests,
          currentSituation: '사이드 프로젝트 탐색 중',
          location: '미설정',
        }),
      })
      if (!res.ok) throw new Error('Save failed')
    } catch {
      // 저장 실패해도 온보딩은 완료 처리
      console.warn('[Onboarding] profile save failed')
    }
    setIsSaving(false)
  }

  const handleSendMessage = (text: string) => {
    if (!text.trim() || isTyping) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      switch (step) {
        case 0:
          setProfile((prev) => ({ ...prev, name: text }))
          addAiMessage({
            id: 'ai-position',
            content: `${text}님, 반가워요!\n어떤 분야에서 활동하고 계신가요?`,
            options: POSITION_OPTIONS,
          })
          break

        case 1:
          setProfile((prev) => ({ ...prev, position: text }))
          addAiMessage({
            id: 'ai-interests',
            content: '관심 있는 분야를 선택해주세요. (여러 개 가능)\n선택 후 "완료" 를 누르거나, 건너뛰기도 가능해요!',
            options: INTEREST_OPTIONS,
            multiSelect: true,
          })
          break

        case 2:
          // This case is handled by handleFinish
          break
      }

      setStep((prev) => prev + 1)
      setIsTyping(false)
    }, 400)
  }

  const handleInterestToggle = (tag: string) => {
    setSelectedInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleFinish = async (interests: string[]) => {
    const updatedProfile = { ...profile, interests }
    setProfile(updatedProfile)

    if (interests.length > 0) {
      setMessages((prev) => [
        ...prev,
        { id: 'user-interests', role: 'user', content: interests.join(', ') },
      ])
    }

    setIsTyping(true)
    addAiMessage({
      id: 'ai-done',
      content: `프로필 설정이 완료됐어요! 🎉\n${updatedProfile.name}님에게 맞는 프로젝트를 찾아볼게요.`,
    })
    setIsTyping(false)
    setStep(3)

    // Save to API
    profile.name = updatedProfile.name
    profile.position = updatedProfile.position
    profile.interests = interests
    await saveProfile()
    setTimeout(onComplete, 1500)
  }

  const handleSkip = () => {
    handleFinish([])
  }

  return (
    <div className="flex h-screen bg-[#FAFAFA] overflow-hidden font-sans">
      {/* LEFT SIDEBAR: Progress */}
      <div className="hidden xl:flex w-56 flex-col border-r border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-gray-900 font-bold">
            <div className="w-6 h-6 bg-black text-white flex items-center justify-center rounded-sm text-xs">D</div>
            <span>프로필 설정</span>
          </div>
        </div>

        <div className="flex-1 p-6">
          <h3 className="text-xs font-bold text-gray-400 font-mono uppercase mb-3">진행 상황</h3>
          <div className="space-y-1">
            {STEPS.map((s) => {
              const isActive = step === s.id
              const isCompleted = step > s.id
              return (
                <div
                  key={s.id}
                  className={`flex items-start gap-3 p-2 rounded-sm transition-all duration-300 ${isActive ? 'bg-white shadow-sm border border-gray-100' : 'opacity-60'}`}
                >
                  <div className={`mt-0.5 ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-500' : 'text-gray-300'}`}>
                    {isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} fill={isActive ? 'currentColor' : 'none'} />}
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>{s.label}</div>
                    <div className="text-[10px] text-gray-400 leading-tight mt-0.5">{s.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <p className="text-[10px] text-gray-500 leading-relaxed">
            최소한의 정보만 수집해요. 나머지는 나중에 프로필에서 수정할 수 있습니다.
          </p>
        </div>
      </div>

      {/* MIDDLE: Chat */}
      <div className="flex-1 flex flex-col relative bg-white shadow-xl lg:shadow-none">
        {/* Header */}
        <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="xl:hidden w-8 h-8 bg-black text-white flex items-center justify-center rounded-sm">
              <Bot size={16} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">프로필 설정</h1>
              <p className="text-xs text-gray-500 font-mono">
                {step >= 3 ? '완료!' : `${step + 1} / ${STEPS.length} 단계`}
              </p>
            </div>
          </div>
          <div className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded-sm border border-gray-100">
            {Math.min(Math.round(((step) / STEPS.length) * 100), 100)}%
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
          <div className="max-w-2xl mx-auto space-y-6 w-full">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-slide-up-fade`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">
                    {msg.role === 'ai' ? 'Draft' : '나'}
                  </span>
                </div>

                <div
                  className={`max-w-[92%] text-sm leading-relaxed whitespace-pre-wrap shadow-sm border ${
                    msg.role === 'user'
                      ? 'bg-gray-900 text-white border-gray-900 px-6 py-4 rounded-lg rounded-tr-none'
                      : 'bg-white text-gray-800 border-gray-200 px-6 py-4 rounded-lg rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Single-select chips */}
                {msg.options && !msg.multiSelect && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {msg.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleSendMessage(opt)}
                        className="px-4 py-2.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-600 hover:border-black hover:bg-black hover:text-white transition-all shadow-sm"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {/* Multi-select chips (interests) */}
                {msg.options && msg.multiSelect && step === 2 && (
                  <div className="mt-4 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {msg.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleInterestToggle(opt)}
                          className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm border ${
                            selectedInterests.includes(opt)
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFinish(selectedInterests)}
                        className="px-6 py-2.5 bg-black text-white rounded-full text-xs font-bold hover:bg-gray-800 transition-all flex items-center gap-2"
                      >
                        {selectedInterests.length > 0 ? `${selectedInterests.length}개 선택 완료` : '완료'}
                        <ArrowRight size={14} />
                      </button>
                      <button
                        onClick={handleSkip}
                        className="px-4 py-2.5 text-gray-400 text-xs font-medium hover:text-gray-600 transition-colors"
                      >
                        건너뛰기
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 ml-1 mt-2">
                <span className="text-xs font-mono text-gray-400 animate-pulse">입력 중...</span>
              </div>
            )}

            {isSaving && (
              <div className="flex items-center gap-2 ml-1 mt-2">
                <Loader2 size={14} className="animate-spin text-gray-400" />
                <span className="text-xs font-mono text-gray-400">프로필 저장 중...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input - only show for free text steps */}
        {step < 1 && (
          <div className="p-4 sm:p-6 lg:p-10 border-t border-gray-100 bg-white">
            <div className="max-w-2xl mx-auto relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(input)}
                placeholder="닉네임을 입력하세요..."
                className="w-full pl-6 pr-14 py-5 bg-gray-50 border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-black focus:bg-white transition-all placeholder:text-gray-400 font-medium"
                disabled={isTyping}
                autoFocus
              />
              <button
                onClick={() => handleSendMessage(input)}
                disabled={!input.trim() || isTyping}
                className="absolute right-4 top-4 bottom-4 px-3 text-gray-400 hover:text-black disabled:text-gray-200 transition-colors"
              >
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR: Live Preview */}
      <div className="hidden lg:flex w-[360px] flex-col bg-[#FAFAFA] border-l border-gray-200">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-tight">미리보기</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-mono text-gray-500">LIVE</span>
              </div>
            </div>

            <div className="bg-white rounded-sm border border-gray-200 shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-sm flex items-center justify-center text-xl font-bold text-gray-400 shrink-0">
                    {profile.name ? (
                      <span className="text-black">{profile.name.substring(0, 1)}</span>
                    ) : (
                      <User size={24} strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <h2 className="text-xl font-bold text-gray-900 leading-none mb-1.5 truncate">
                      {profile.name || <span className="text-gray-200">닉네임</span>}
                    </h2>
                    <p className="text-sm text-gray-500 truncate">
                      {profile.position || <span className="text-gray-300">포지션 미설정</span>}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <label className="text-[9px] font-bold text-gray-400 uppercase font-mono mb-2 flex items-center gap-1">
                    <Target size={10} /> 관심 분야
                  </label>
                  {profile.interests.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.interests.map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-300">아직 선택하지 않았어요</p>
                  )}
                </div>
              </div>

              <div className="bg-gray-900 px-6 py-3 flex justify-between items-center">
                <span className="text-[10px] font-mono text-gray-500">DRAFT PROFILE</span>
                {step >= 3 ? (
                  <div className="flex items-center gap-1.5 text-green-400">
                    <Sparkles size={12} fill="currentColor" />
                    <span className="text-xs font-bold uppercase tracking-wider">완료</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-gray-600 font-mono">설정 중...</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
