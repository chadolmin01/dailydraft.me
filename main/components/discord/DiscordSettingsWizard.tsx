'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useClub } from '@/src/hooks/useClub'

// ─── Types ───

interface GhostwriterSettings {
  club_id: string
  checkin_template: string | null
  checkin_day: number
  generate_day: number
  ai_tone: 'formal' | 'casual' | 'english'
  min_messages: number
  timeout_hours: number
  custom_prompt_hint: string | null
}

interface DiscordChannel {
  id: string
  name: string
  type: number
  parent_id: string | null
  position: number
}

type Step = 'welcome' | 'channels' | 'tone' | 'schedule' | 'advanced' | 'complete'

interface ChatMessage {
  id: string
  type: 'bot' | 'user'
  content: string
  timestamp: Date
}

const STEPS: Step[] = ['welcome', 'channels', 'tone', 'schedule', 'advanced', 'complete']
const STEP_LABELS: Record<Step, string> = {
  welcome: '시작',
  channels: '채널',
  tone: 'AI 톤',
  schedule: '스케줄',
  advanced: '고급',
  complete: '완료',
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

const TONE_OPTIONS = [
  { value: 'formal' as const, label: '합쇼체', emoji: '🏢', example: '"이번 주 활동을 정리했습니다"' },
  { value: 'casual' as const, label: '해요체', emoji: '💬', example: '"이번 주 이렇게 활동했어요!"' },
  { value: 'english' as const, label: 'English', emoji: '🇺🇸', example: '"Here\'s your weekly summary"' },
]

// ─── Component ───

export function DiscordSettingsWizard({ clubSlug }: { clubSlug: string }) {
  const { data: club, isLoading: clubLoading } = useClub(clubSlug)
  const queryClient = useQueryClient()
  const chatEndRef = useRef<HTMLDivElement>(null)

  const [currentStep, setCurrentStep] = useState<Step>('welcome')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)

  // ── Settings state ──
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const [tone, setTone] = useState<'formal' | 'casual' | 'english'>('formal')
  const [checkinDay, setCheckinDay] = useState(1)
  const [generateDay, setGenerateDay] = useState(0)
  const [minMessages, setMinMessages] = useState(5)
  const [timeoutHours, setTimeoutHours] = useState(24)
  const [customPrompt, setCustomPrompt] = useState('')

  // ── Fetch existing settings ──
  const { data: settings } = useQuery<GhostwriterSettings>({
    queryKey: ['ghostwriter-settings', club?.id],
    enabled: !!club?.id,
    queryFn: async () => {
      const res = await fetch(`/api/clubs/${club!.id}/ghostwriter-settings`)
      if (!res.ok) throw new Error('Failed to fetch settings')
      return res.json()
    },
  })

  // ── Save mutation ──
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<GhostwriterSettings>) => {
      const res = await fetch(`/api/clubs/${club!.id}/ghostwriter-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to save settings')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ghostwriter-settings', club?.id] })
    },
  })

  // ── Load existing settings into state ──
  useEffect(() => {
    if (settings && settings.ai_tone) {
      setTone(settings.ai_tone)
      setCheckinDay(settings.checkin_day)
      setGenerateDay(settings.generate_day)
      setMinMessages(settings.min_messages)
      setTimeoutHours(settings.timeout_hours)
      setCustomPrompt(settings.custom_prompt_hint ?? '')
    }
  }, [settings])

  // ── Auto-scroll ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // ── Add message helper ──
  const addBotMessage = useCallback((content: string) => {
    setIsTyping(true)
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: `bot-${Date.now()}`,
        type: 'bot',
        content,
        timestamp: new Date(),
      }])
      setIsTyping(false)
    }, 600)
  }, [])

  const addUserMessage = useCallback((content: string) => {
    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      type: 'user',
      content,
      timestamp: new Date(),
    }])
  }, [])

  // ── Initial message ──
  useEffect(() => {
    if (club && messages.length === 0) {
      addBotMessage(`${club.name}의 Discord 연동을 설정합니다. 아래 "시작하기"를 눌러주세요!`)
    }
  }, [club, messages.length, addBotMessage])

  // ── Step progression ──
  const goToStep = useCallback((step: Step) => {
    setCurrentStep(step)
    const botMessages: Record<Step, string> = {
      welcome: '',
      channels: '어떤 Discord 채널을 모니터링할까요? 프로젝트 팀 채널을 선택하면 대화 내용이 주간 업데이트에 반영됩니다.',
      tone: 'AI가 글을 쓸 때 어떤 말투를 사용할까요?',
      schedule: '체크인과 초안 생성 요일을 설정합니다. 언제가 좋을까요?',
      advanced: '마지막 단계입니다! 세부 설정을 조정할 수 있습니다.',
      complete: '모든 설정이 완료되었습니다! 이제 Ghostwriter가 활동을 추적하기 시작합니다.',
    }
    if (botMessages[step]) {
      addBotMessage(botMessages[step])
    }
  }, [addBotMessage])

  // ── Step handlers ──
  const handleStart = () => {
    addUserMessage('시작하기')
    goToStep('channels')
  }

  const handleChannelsNext = () => {
    const count = selectedChannels.length
    addUserMessage(`${count}개 채널 선택 완료`)
    goToStep('tone')
  }

  const handleToneSelect = (selected: typeof tone) => {
    setTone(selected)
    const label = TONE_OPTIONS.find(t => t.value === selected)?.label ?? ''
    addUserMessage(`${label}로 설정`)
    goToStep('schedule')
  }

  const handleScheduleNext = () => {
    addUserMessage(`체크인: ${DAY_NAMES[checkinDay]}요일 / 초안: ${DAY_NAMES[generateDay]}요일`)
    goToStep('advanced')
  }

  const handleSave = async () => {
    addUserMessage('설정 저장')
    try {
      await saveMutation.mutateAsync({
        ai_tone: tone,
        checkin_day: checkinDay,
        generate_day: generateDay,
        min_messages: minMessages,
        timeout_hours: timeoutHours,
        custom_prompt_hint: customPrompt || null,
      })
      goToStep('complete')
    } catch {
      addBotMessage('저장 중 오류가 발생했습니다. 다시 시도해주세요.')
    }
  }

  // ── Progress ──
  const currentStepIndex = STEPS.indexOf(currentStep)
  const progress = Math.round((currentStepIndex / (STEPS.length - 1)) * 100)

  if (clubLoading) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-border-default/30 rounded w-48" />
          <div className="h-96 bg-border-default/30 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!club) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-12 text-center">
        <p className="text-txt-tertiary">클럽을 찾을 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center text-brand font-extrabold text-sm shrink-0">
          {club.name[0]}
        </div>
        <div>
          <h1 className="text-lg font-bold text-txt-primary">{club.name}</h1>
          <p className="text-xs text-txt-tertiary">Discord 연동 설정</p>
        </div>
        <div className="ml-auto px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs font-semibold border border-green-200">
          연결됨
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          {STEPS.map((step, i) => (
            <button
              key={step}
              onClick={() => i < currentStepIndex && goToStep(step)}
              disabled={i > currentStepIndex}
              className={`text-[11px] font-semibold transition-colors ${
                i < currentStepIndex
                  ? 'text-brand cursor-pointer'
                  : i === currentStepIndex
                    ? 'text-txt-primary'
                    : 'text-txt-disabled cursor-default'
              }`}
            >
              {STEP_LABELS[step]}
            </button>
          ))}
        </div>
        <div className="h-1 bg-border-default/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Chat Area */}
      <div className="bg-surface-card border border-border-default rounded-2xl overflow-hidden">
        <div className="max-h-[60vh] overflow-y-auto p-5 space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.type === 'bot'
                    ? 'bg-surface-bg text-txt-primary rounded-tl-md'
                    : 'bg-brand text-white rounded-tr-md'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-surface-bg rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-txt-disabled rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-txt-disabled rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-txt-disabled rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Step-specific Input Area */}
        <div className="border-t border-border-default p-5">
          {currentStep === 'welcome' && (
            <button
              onClick={handleStart}
              className="w-full py-3 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-brand-hover transition-colors"
            >
              시작하기
            </button>
          )}

          {currentStep === 'channels' && (
            <div className="space-y-3">
              <div className="text-xs text-txt-tertiary font-semibold mb-2">채널 선택</div>
              <div className="max-h-48 overflow-y-auto space-y-1.5">
                {/* 임시 채널 목록 — 추후 API에서 가져옴 */}
                {['draft-팀빌딩플랫폼', 'foodfinder-팀채널', '일반', '주간-체크인', '운영-대시보드'].map(ch => (
                  <label
                    key={ch}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-bg cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedChannels.includes(ch)}
                      onChange={e => {
                        setSelectedChannels(prev =>
                          e.target.checked ? [...prev, ch] : prev.filter(c => c !== ch)
                        )
                      }}
                      className="w-4 h-4 rounded border-border-default text-brand accent-brand"
                    />
                    <span className="text-txt-tertiary font-bold text-sm">#</span>
                    <span className="text-sm text-txt-primary">{ch}</span>
                  </label>
                ))}
              </div>
              <button
                onClick={handleChannelsNext}
                disabled={selectedChannels.length === 0}
                className="w-full py-3 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-brand-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {selectedChannels.length}개 채널 선택 완료
              </button>
            </div>
          )}

          {currentStep === 'tone' && (
            <div className="space-y-2">
              {TONE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleToneSelect(opt.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                    tone === opt.value
                      ? 'border-brand bg-brand-bg/50'
                      : 'border-border-default hover:border-txt-tertiary'
                  }`}
                >
                  <span className="text-xl">{opt.emoji}</span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-txt-primary">{opt.label}</div>
                    <div className="text-xs text-txt-tertiary">{opt.example}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {currentStep === 'schedule' && (
            <div className="space-y-4">
              <div>
                <div className="text-xs text-txt-tertiary font-semibold mb-2">체크인 요일</div>
                <div className="flex gap-1.5">
                  {DAY_NAMES.map((day, i) => (
                    <button
                      key={`checkin-${i}`}
                      onClick={() => setCheckinDay(i)}
                      className={`w-9 h-9 rounded-full text-sm font-semibold transition-all ${
                        checkinDay === i
                          ? 'bg-brand text-white'
                          : 'bg-surface-bg text-txt-secondary hover:bg-border-default/50'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-txt-tertiary font-semibold mb-2">초안 생성 요일</div>
                <div className="flex gap-1.5">
                  {DAY_NAMES.map((day, i) => (
                    <button
                      key={`gen-${i}`}
                      onClick={() => setGenerateDay(i)}
                      className={`w-9 h-9 rounded-full text-sm font-semibold transition-all ${
                        generateDay === i
                          ? 'bg-brand text-white'
                          : 'bg-surface-bg text-txt-secondary hover:bg-border-default/50'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleScheduleNext}
                className="w-full py-3 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-brand-hover transition-colors"
              >
                다음
              </button>
            </div>
          )}

          {currentStep === 'advanced' && (
            <div className="space-y-4">
              <div>
                <div className="text-xs text-txt-tertiary font-semibold mb-1">최소 메시지 수</div>
                <div className="text-[11px] text-txt-disabled mb-2">이보다 적으면 "활동 부족" 처리</div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMinMessages(m => Math.max(1, m - 1))}
                    className="w-8 h-8 rounded-full border border-border-default text-txt-secondary hover:bg-surface-bg transition-colors flex items-center justify-center"
                  >
                    −
                  </button>
                  <span className="text-lg font-bold text-txt-primary w-8 text-center">{minMessages}</span>
                  <button
                    onClick={() => setMinMessages(m => Math.min(50, m + 1))}
                    className="w-8 h-8 rounded-full border border-border-default text-txt-secondary hover:bg-surface-bg transition-colors flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <div className="text-xs text-txt-tertiary font-semibold mb-1">승인 타임아웃</div>
                <div className="text-[11px] text-txt-disabled mb-2">이 시간 후 자동 게시</div>
                <div className="flex gap-2">
                  {[12, 24, 48].map(h => (
                    <button
                      key={h}
                      onClick={() => setTimeoutHours(h)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        timeoutHours === h
                          ? 'bg-brand text-white'
                          : 'bg-surface-bg text-txt-secondary hover:bg-border-default/50'
                      }`}
                    >
                      {h}시간
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs text-txt-tertiary font-semibold mb-1">커스텀 프롬프트 (선택)</div>
                <textarea
                  value={customPrompt}
                  onChange={e => setCustomPrompt(e.target.value)}
                  placeholder="예: 기술 스택 언급 금지"
                  maxLength={200}
                  className="w-full px-3 py-2.5 border border-border-default rounded-xl text-sm text-txt-primary bg-surface-card resize-none h-20 focus:outline-none focus:border-brand transition-colors placeholder:text-txt-disabled"
                />
                <div className="text-right text-[11px] text-txt-disabled mt-1">{customPrompt.length}/200</div>
              </div>

              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="w-full py-3 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-brand-hover transition-colors disabled:opacity-60"
              >
                {saveMutation.isPending ? '저장 중...' : '설정 저장'}
              </button>
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="text-center py-2">
              <div className="text-2xl mb-2">✓</div>
              <p className="text-sm text-txt-secondary">설정이 완료되었습니다</p>
              <button
                onClick={() => {
                  setCurrentStep('channels')
                  setMessages([])
                  addBotMessage('설정을 수정합니다. 변경할 항목을 선택해주세요.')
                }}
                className="mt-3 text-sm text-brand font-semibold hover:underline"
              >
                설정 다시 수정하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
