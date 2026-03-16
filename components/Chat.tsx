'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, FileText, BarChart3, Mail, MoreHorizontal, Plus, History, ChevronRight, Loader2, Lightbulb, MessageSquare, ArrowLeft } from 'lucide-react'
import { Card } from './ui/Card'
import { useAuth } from '@/src/context/AuthContext'
import { useProfile } from '@/src/hooks/useProfile'
import { useSendGeneralAiMessage } from '@/src/lib/api/ai-chat'
import IdeaValidator from './idea-validator/IdeaValidator'
import { validationResultsStore, ValidationResult } from '@/src/lib/validationResultsStore'

type ChatMode = 'general' | 'validator'
type PromptState = 'initial' | 'selected' | 'onboarding' | 'validating'

interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  type?: 'text' | 'report' | 'code'
  timestamp: string
}

export const Chat: React.FC = () => {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const sendAiMessage = useSendGeneralAiMessage()

  const [mode, setMode] = useState<ChatMode>('general')
  const [promptState, setPromptState] = useState<PromptState>('initial')
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([])
  const userName = profile?.nickname || user?.email?.split('@')[0] || 'User'

  // Load validation results on mount
  useEffect(() => {
    setValidationResults(validationResultsStore.getAll())
  }, [mode])

  const handleBusinessPlanClick = () => {
    setPromptState('selected')
  }

  const [onboardingStep, setOnboardingStep] = useState(0)
  const validatorSendRef = useRef<(() => void) | null>(null)

  const handleStartValidation = () => {
    setPromptState('onboarding')
    setOnboardingStep(0)

    // Onboarding animation sequence
    const steps = [
      { delay: 600, step: 1 },   // API 연결 확인
      { delay: 1200, step: 2 },  // 페르소나 준비
      { delay: 1800, step: 3 },  // 완료
    ]

    steps.forEach(({ delay, step }) => {
      setTimeout(() => setOnboardingStep(step), delay)
    })

    // Transition to level selection after animation
    setTimeout(() => {
      setPromptState('validating')
      setMode('validator')
    }, 2200)
  }

  const handleBackToPrompts = () => {
    setPromptState('initial')
    setMode('general')
  }

  const [messages, setMessages] = useState<Message[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, newUserMsg])
    setInput('')
    setIsLoading(true)

    try {
      const result = await sendAiMessage.mutateAsync({
        message: userMessage,
        context: { type: 'general' }
      })

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: result.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, aiResponse])
    } catch {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: '요청하신 내용을 바탕으로 분석 중입니다...\n\n스타트업 초기 팀 빌딩 시 고려해야 할 핵심 지표 3가지를 정리해드릴까요?\n\n(참고: AI 서비스에 연결되지 않아 샘플 응답입니다. Edge Functions 배포 후 정상 작동합니다.)',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, aiResponse])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleUnifiedSend()
    }
  }

  const handleUnifiedSend = () => {
    if (mode === 'validator' && promptState === 'validating' && validatorSendRef.current) {
      validatorSendRef.current()
    } else {
      handleSend()
    }
  }

  const PromptCard = ({
    icon: Icon,
    title,
    desc,
    onClick,
    variant = 'default',
    badge,
    className = ''
  }: {
    icon: React.ElementType;
    title: string;
    desc: string;
    onClick: () => void;
    variant?: 'default' | 'ai';
    badge?: string;
    className?: string;
  }) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-start p-5 border hover:shadow-sharp transition-all duration-300 text-left group w-full relative ${
        variant === 'ai'
          ? 'bg-[#4F46E5] border-[#4F46E5] hover:bg-[#4338CA]'
          : 'bg-surface-card border-border-strong hover:border-border-strong'
      } ${className}`}
    >
      {badge && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-surface-card text-[#4F46E5] text-[0.625rem] font-bold shadow-solid-sm border border-border-strong">
          {badge}
        </div>
      )}
      <div className={`w-9 h-9 border flex items-center justify-center mb-4 transition-colors
        ${variant === 'ai'
          ? 'bg-white/20 border-white/30 text-white'
          : 'bg-surface-sunken border-border text-txt-secondary group-hover:bg-black group-hover:border-border-strong group-hover:text-white'
        }`}>
        <Icon size={16} />
      </div>
      <span className={`font-bold text-sm mb-1 ${variant === 'ai' ? 'text-white' : 'text-txt-primary'}`}>{title}</span>
      <span className={`text-xs leading-relaxed break-keep ${variant === 'ai' ? 'text-white/80' : 'text-txt-tertiary'}`}>{desc}</span>
    </button>
  )

  const handleValidationComplete = (result: { id: string; projectIdea: string }) => {
    // Refresh validation results list
    setValidationResults(validationResultsStore.getAll())

    // Add a summary message to chat
    const validationMsg: Message = {
      id: Date.now().toString(),
      role: 'ai',
      content: `✅ 아이디어 검증이 완료되었습니다!\n\n**검증된 아이디어:** ${result.projectIdea.slice(0, 100)}...\n\n검증 결과를 바탕으로 사업계획서 작성을 도와드릴까요?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setMessages(prev => [...prev, validationMsg])

    // Return to general chat
    setMode('general')
    setPromptState('initial')
  }

  return (
    <div className="flex h-screen bg-[#FAFAFA] bg-grid-engineering overflow-hidden">

      {/* Left Sidebar: Session History */}
      <div className="w-80 border-r border-border-strong bg-surface-card hidden lg:flex flex-col z-10">
        <div className="p-5 border-b border-border-strong flex justify-between items-center">
          <div className="font-bold text-sm flex items-center gap-2">
            <History size={16} className="text-txt-tertiary" />
            Workspace
          </div>
          <button className="p-1.5 hover:bg-surface-sunken text-txt-tertiary transition-colors">
            <Plus size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-2 py-2 text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-disabled">Today</div>
          <button className="w-full text-left px-3 py-2 bg-surface-sunken text-sm font-medium text-txt-primary border border-border-strong hover:border-border-strong transition-colors">
            예비창업패키지 사업계획서
          </button>
          <button className="w-full text-left px-3 py-2 hover:bg-surface-sunken text-sm text-txt-secondary transition-colors truncate">
            헬스케어 시장 TAM/SAM/SOM 분석
          </button>

          <div className="px-2 py-2 text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-disabled mt-3">Previous 7 Days</div>
          <button className="w-full text-left px-3 py-2 hover:bg-surface-sunken text-sm text-txt-secondary transition-colors truncate">
            개발자 채용공고 문구 수정
          </button>
          <button className="w-full text-left px-3 py-2 hover:bg-surface-sunken text-sm text-txt-secondary transition-colors truncate">
            투자자 콜드메일 초안
          </button>

          {/* Validated Ideas Section */}
          {validationResults.length > 0 && (
            <>
              <div className="px-2 py-2 text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-disabled mt-3 flex items-center gap-1.5">
                <Sparkles size={10} />
                Validated Ideas
              </div>
              {validationResults.slice(0, 3).map((result) => (
                <div
                  key={result.id}
                  className="w-full text-left px-3 py-2 bg-surface-card border border-border-strong hover:border-border-strong transition-colors cursor-pointer group"
                >
                  <div className="text-sm font-medium text-txt-primary truncate group-hover:text-black">
                    {result.projectIdea.slice(0, 35)}...
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[0.5625rem] font-mono text-green-600 uppercase">✓ Validated</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="p-4 border-t border-border-strong bg-surface-sunken">
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 animate-pulse"></div>
              <span className="text-xs text-txt-tertiary font-mono">Draft AI v2.0 Online</span>
           </div>
        </div>
      </div>

      {/* Main Content Area - Persistent Shell */}
      <div className="flex-1 flex flex-col max-w-[75rem] mx-auto w-full shadow-brutal bg-surface-card/50 backdrop-blur-sm relative">

        {/* Persistent Header */}
        <div className="px-6 py-4 bg-surface-card/80 border-b border-border-strong flex justify-between items-center backdrop-blur z-10 sticky top-0">
          <div>
            <h2 className="font-bold text-txt-primary flex items-center gap-2">
              <div className="w-5 h-5 bg-black flex items-center justify-center">
                <span className="text-white text-[0.625rem] font-bold">D</span>
              </div>
              Draft Workspace
            </h2>
            <p className="text-[0.625rem] text-txt-disabled mt-0.5 font-mono uppercase tracking-wider">AI-Powered Startup Tools</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-status-success-bg border border-green-300">
              <span className="w-1.5 h-1.5 bg-green-500 animate-pulse"></span>
              <span className="text-[0.5625rem] font-mono text-status-success-text font-bold uppercase">Online</span>
            </div>
            <button className="p-2 hover:bg-surface-sunken text-txt-disabled hover:text-black transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 min-h-0 flex flex-col relative">

          {/* Onboarding State */}
          {promptState === 'onboarding' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FAFAFA] bg-grid-engineering z-20">
              <div className="flex flex-col items-center">
                <div className="mb-8">
                  <div className="w-16 h-16 bg-black flex items-center justify-center shadow-sharp">
                    <Bot size={28} className="text-white" />
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-card border border-border-strong shadow-solid-sm mb-6">
                  <span className="w-1.5 h-1.5 bg-green-500 animate-pulse"></span>
                  <span className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-wider">
                    Initializing System
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-txt-primary tracking-tight mb-2">AI Validation Engine</h2>
                <p className="text-xs text-txt-disabled font-mono mb-10">Preparing your session...</p>

                <div className="w-64 mb-8">
                  <div className="h-1 bg-surface-sunken overflow-hidden">
                    <div
                      className="h-full bg-black transition-all duration-500 ease-out"
                      style={{ width: `${(onboardingStep / 3) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className={`flex items-center gap-2 transition-all duration-300 ${onboardingStep >= 1 ? 'opacity-100' : 'opacity-30'}`}>
                    <div className={`w-5 h-5 flex items-center justify-center text-[0.625rem] font-bold transition-all ${
                      onboardingStep >= 1 ? 'bg-black text-white' : 'bg-surface-sunken text-txt-disabled'
                    }`}>
                      {onboardingStep >= 1 ? '✓' : '1'}
                    </div>
                    <span className="text-[0.6875rem] font-medium text-txt-secondary">API Connected</span>
                  </div>
                  <div className="w-8 h-px bg-border"></div>
                  <div className={`flex items-center gap-2 transition-all duration-300 ${onboardingStep >= 2 ? 'opacity-100' : 'opacity-30'}`}>
                    <div className={`w-5 h-5 flex items-center justify-center text-[0.625rem] font-bold transition-all ${
                      onboardingStep >= 2 ? 'bg-black text-white' : 'bg-surface-sunken text-txt-disabled'
                    }`}>
                      {onboardingStep >= 2 ? '✓' : '2'}
                    </div>
                    <span className="text-[0.6875rem] font-medium text-txt-secondary">Personas Ready</span>
                  </div>
                  <div className="w-8 h-px bg-border"></div>
                  <div className={`flex items-center gap-2 transition-all duration-300 ${onboardingStep >= 3 ? 'opacity-100' : 'opacity-30'}`}>
                    <div className={`w-5 h-5 flex items-center justify-center text-[0.625rem] font-bold transition-all ${
                      onboardingStep >= 3 ? 'bg-black text-white' : 'bg-surface-sunken text-txt-disabled'
                    }`}>
                      {onboardingStep >= 3 ? '✓' : '3'}
                    </div>
                    <span className="text-[0.6875rem] font-medium text-txt-secondary">Session Active</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Validator State */}
          {mode === 'validator' && promptState === 'validating' && (
            <div className="absolute inset-0 z-20 overflow-hidden">
              <button
                onClick={handleBackToPrompts}
                className="absolute top-4 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 bg-surface-card border border-border-strong text-xs text-txt-tertiary hover:text-txt-primary hover:border-border-strong transition-colors shadow-solid-sm"
              >
                <ArrowLeft size={12} />
                <span className="font-mono uppercase tracking-wide">Exit</span>
              </button>
              <IdeaValidator
                embedded
                skipToLevelSelect
                onBack={handleBackToPrompts}
                onComplete={handleValidationComplete}
                externalInput={input}
                onExternalInputChange={setInput}
                hideInput={true}
                onRegisterSend={(fn) => { validatorSendRef.current = fn }}
              />
            </div>
          )}

          {/* Default Chat State */}
          <div className={`flex-1 min-h-0 ${messages.length === 0 ? 'flex items-center justify-center' : 'overflow-y-auto p-6 space-y-8'} ${(promptState === 'onboarding' || (mode === 'validator' && promptState === 'validating')) ? 'invisible' : ''}`}>

          {messages.length === 0 && promptState !== 'validating' && (
            <div className="max-w-3xl w-full mx-auto flex flex-col items-center justify-center px-6 -mt-16">
               {/* Back button when selected - fixed height container */}
               <div className="h-6 flex items-center justify-center">
                 <button
                   onClick={handleBackToPrompts}
                   className={`flex items-center gap-1.5 text-xs text-txt-disabled hover:text-txt-primary transition-all duration-300 ${
                     promptState === 'selected' ? 'opacity-100' : 'opacity-0 pointer-events-none'
                   }`}
                 >
                   <ArrowLeft size={14} />
                   <span className="font-mono uppercase tracking-wide">Back</span>
                 </button>
               </div>

               <h3 className="text-3xl font-bold text-txt-primary mb-4 text-center mt-2">
                 {promptState === 'selected' ? '어떻게 작성할까요?' : '무엇을 도와드릴까요?'}
               </h3>

               <div
                 key={promptState}
                 className="flex justify-center items-stretch gap-4"
               >
                  {promptState === 'initial' ? (
                    <>
                      {/* 초기 상태: 3개 카드 */}
                      <div className="w-72 opacity-0 animate-[fadeInUp_0.4s_ease-out_forwards]">
                        <PromptCard
                          icon={FileText}
                          title="AI와 사업계획서 작성"
                          desc="AI 코파운더와 함께 PSST 양식에 맞춘 창업 패키지 서류를 작성합니다."
                          onClick={handleBusinessPlanClick}
                        />
                      </div>
                      <div className="w-72 opacity-0 animate-[fadeInUp_0.4s_ease-out_0.1s_forwards]">
                        <PromptCard
                          icon={BarChart3}
                          title="시장 조사 분석"
                          desc="타겟 시장의 규모와 경쟁사 현황을 빠르게 리서치합니다."
                          onClick={() => setInput("국내 시니어 헬스케어 시장 규모와 주요 경쟁사 분석해줘.")}
                        />
                      </div>
                      <div className="w-72 opacity-0 animate-[fadeInUp_0.4s_ease-out_0.2s_forwards]">
                        <PromptCard
                          icon={Mail}
                          title="콜드메일 작성"
                          desc="투자자나 잠재 고객에게 보낼 매력적인 제안 메일을 씁니다."
                          onClick={() => setInput("엔젤 투자자에게 보낼 콜드메일 초안 작성해줘. 우리 서비스는...")}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* 선택 상태: 2개 카드 */}
                      <div className="w-72 opacity-0 animate-[fadeInUp_0.4s_ease-out_forwards]">
                        <PromptCard
                          icon={FileText}
                          title="AI와 사업계획서 작성"
                          desc="AI 코파운더와 함께 PSST 양식에 맞춘 창업 패키지 서류를 작성합니다."
                          onClick={() => setInput("예비창업패키지 사업계획서 PSST 양식으로 개요 작성해줘.")}
                        />
                      </div>
                      <div className="w-72 opacity-0 animate-[fadeInUp_0.4s_ease-out_0.15s_forwards]">
                        <PromptCard
                          icon={Bot}
                          title="AI 검증 시작"
                          desc="AI 페르소나(개발/디자인/VC)가 아이디어를 다각도로 분석합니다."
                          onClick={handleStartValidation}
                          variant="ai"
                          badge="매칭률 UP"
                        />
                      </div>
                    </>
                  )}
               </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'ai' && (
                <div className="w-8 h-8 bg-black flex items-center justify-center shrink-0 mt-1">
                  <Bot size={16} className="text-white" />
                </div>
              )}

              <div className={`max-w-[80%] md:max-w-[70%] space-y-1`}>
                <div className="flex items-center gap-2 mb-1">
                   <span className="text-xs font-bold text-txt-primary">
                      {msg.role === 'user' ? 'Me' : 'Draft AI'}
                   </span>
                   <span className="text-[0.625rem] font-mono text-txt-disabled">{msg.timestamp}</span>
                </div>

                <div
                  className={`
                    p-4 text-sm leading-relaxed whitespace-pre-wrap shadow-solid-sm break-keep border
                    ${msg.role === 'user'
                      ? 'bg-surface-card border-border-strong text-txt-primary'
                      : 'bg-surface-card border-[#4F46E5]/30 text-txt-primary'}
                  `}
                >
                  {msg.content}
                </div>

                {msg.role === 'ai' && messages.length > 0 && (
                   <div className="flex gap-2 mt-2">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-card border border-border-strong text-xs text-txt-tertiary hover:border-border-strong hover:text-black transition-colors">
                         <FileText size={12} /> 리포트로 저장
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-card border border-border-strong text-xs text-txt-tertiary hover:border-border-strong hover:text-black transition-colors">
                         <ChevronRight size={12} /> 더 자세히 설명해줘
                      </button>
                   </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 bg-surface-sunken border border-border-strong flex items-center justify-center shrink-0 mt-1">
                  <User size={16} className="text-txt-tertiary" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        </div>

        {/* Persistent Input Area */}
        <div className={`p-4 bg-surface-card/95 backdrop-blur-sm border-t border-border-strong z-30 ${promptState === 'onboarding' ? 'opacity-30 pointer-events-none' : ''}`}>
          <div className="relative max-w-3xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Draft AI에게 업무를 요청하세요..."
              className="w-full h-11 pl-4 pr-12 bg-surface-sunken border border-border-strong focus:outline-none focus:bg-surface-card focus:border-[#4F46E5] text-sm transition-all"
            />
            <button
              onClick={handleUnifiedSend}
              disabled={!input.trim() || isLoading}
              className={`absolute right-1.5 top-1.5 p-2 transition-colors
                ${input.trim() && !isLoading
                  ? 'bg-black text-white hover:bg-[#4F46E5]'
                  : 'bg-surface-sunken text-txt-disabled cursor-not-allowed'}
              `}
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
