'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Bot, ArrowRight, User, Building2, MapPin, Target, Layers, Sparkles, Send, CheckCircle2, Circle, HelpCircle, ChevronRight, Fingerprint, Quote } from 'lucide-react'
import { Card } from './ui/Card'

interface OnboardingProps {
  onComplete: () => void
}

interface Message {
  id: string
  role: 'ai' | 'user'
  content: string
  options?: string[]
}

interface UserProfile {
  name: string
  role: string
  affiliation: string
  location: string
  teamStatus: string
  idea: string
  coreValue: string
}

const ONBOARDING_STEPS = [
  { id: 0, label: 'Identity', desc: '기본 신원 확인' },
  { id: 1, label: 'Specialization', desc: '직무 및 전문 분야' },
  { id: 2, label: 'Coordinates', desc: '거주지 및 소속' },
  { id: 3, label: 'Status', desc: '현재 팀 상태' },
  { id: 4, label: 'Vision', desc: '아이디어 및 목표' },
  { id: 5, label: 'Core Value', desc: '핵심 가치관' },
]

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'ai',
      content: '안녕하세요. Draft에 오신 것을 환영합니다.\n성공적인 팀 매칭을 위해 프로필 작성을 도와드리겠습니다.\n\n먼저, 성함이 어떻게 되시나요?'
    }
  ])
  const [input, setInput] = useState('')
  const [step, setStep] = useState(0)
  const [isTyping, setIsTyping] = useState(false)

  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    role: '',
    affiliation: '',
    location: '',
    teamStatus: '',
    idea: '',
    coreValue: ''
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      let nextAiMsg: Message | null = null
      let nextStep = step + 1

      switch (step) {
        case 0:
          setProfile(prev => ({ ...prev, name: text }))
          nextAiMsg = {
            id: 'ai-role',
            role: 'ai',
            content: `${text}님, 반갑습니다.\n현재 어떤 직무(Role)를 맡고 계신가요?`,
            options: ['Product Designer', 'Frontend Dev', 'Backend Dev', 'PM / PO', 'Founder', 'Marketer']
          }
          break

        case 1:
          setProfile(prev => ({ ...prev, role: text }))
          nextAiMsg = {
            id: 'ai-loc',
            role: 'ai',
            content: '현재 거주 지역과 소속을 알려주세요.\n(예: 서울 강남 / 스타트업, 판교 / 프리랜서)'
          }
          break

        case 2:
          const parts = text.split(/[/,]/)
          const loc = parts[0].trim()
          const aff = parts.length > 1 ? parts[1].trim() : 'Undisclosed'
          setProfile(prev => ({ ...prev, location: loc, affiliation: aff }))

          nextAiMsg = {
            id: 'ai-status',
            role: 'ai',
            content: '현재 프로젝트나 팀 빌딩 상태는 어떠신가요?',
            options: ['사이드 프로젝트 준비 중', '초기 스타트업 (MVP)', '팀 빌딩 중 (Co-founder 찾기)', '재직 중 (네트워킹)', '구직 중']
          }
          break

        case 3:
          setProfile(prev => ({ ...prev, teamStatus: text }))
          nextAiMsg = {
            id: 'ai-vision',
            role: 'ai',
            content: '관심있는 분야나 현재 구상 중인 아이디어에 대해 간단히 설명해주실 수 있나요?'
          }
          break

        case 4:
          setProfile(prev => ({ ...prev, idea: text }))
          nextAiMsg = {
            id: 'ai-value',
            role: 'ai',
            content: '마지막으로, 팀원과 협업할 때 가장 중요하게 생각하는 가치는 무엇인가요?',
            options: ['실행력 (Speed)', '기술적 깊이 (Tech)', '끈기 (Grit)', '논리적 소통 (Logic)', '수평적 문화 (Culture)']
          }
          break

        case 5:
          setProfile(prev => ({ ...prev, coreValue: text }))
          nextAiMsg = {
            id: 'ai-finish',
            role: 'ai',
            content: '프로필 작성이 완료되었습니다.\n작성해주신 정보를 바탕으로 맞춤형 대시보드를 생성합니다.'
          }
          setTimeout(onComplete, 2500)
          break
      }

      if (nextAiMsg) {
        setMessages(prev => [...prev, nextAiMsg!])
        setStep(nextStep)
      }
      setIsTyping(false)
    }, 600)
  }

  return (
    <div className="flex h-screen bg-[#FAFAFA] bg-grid-engineering overflow-hidden font-sans">

      {/* 1. LEFT SIDEBAR: Progress & Context */}
      <div className="hidden xl:flex w-64 flex-col border-r border-gray-200 bg-white/50 backdrop-blur-sm z-20">
         <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2 text-gray-900 font-bold">
               <div className="w-6 h-6 bg-black text-white flex items-center justify-center rounded-sm text-xs">D</div>
               <span>Setup Guide</span>
            </div>
         </div>

         <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            <div className="space-y-1">
               <h3 className="text-xs font-bold text-gray-400 font-mono uppercase mb-3">Onboarding Progress</h3>
               {ONBOARDING_STEPS.map((s) => {
                  const isActive = step === s.id
                  const isCompleted = step > s.id

                  return (
                     <div
                        key={s.id}
                        className={`flex items-start gap-3 p-2 rounded-sm transition-all duration-300 ${isActive ? 'bg-white shadow-sm border border-gray-100' : 'opacity-60'}`}
                     >
                        <div className={`mt-0.5 ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-500' : 'text-gray-300'}`}>
                           {isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} fill={isActive ? "currentColor" : "none"} className={isActive ? "animate-pulse" : ""} />}
                        </div>
                        <div>
                           <div className={`text-xs font-bold ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                              {s.label}
                           </div>
                           <div className="text-[10px] text-gray-400 leading-tight mt-0.5">
                              {s.desc}
                           </div>
                        </div>
                     </div>
                  )
               })}
            </div>
         </div>

         <div className="p-6 border-t border-gray-100 bg-gray-50">
            <div className="flex items-start gap-2">
               <HelpCircle size={14} className="text-gray-400 mt-0.5" />
               <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-700">Why we ask?</p>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                     Draft AI는 입력된 데이터를 기반으로 가장 적합한 팀원과 투자자를 매칭합니다.
                  </p>
               </div>
            </div>
         </div>
      </div>

      {/* 2. MIDDLE: Chat Interface */}
      <div className="flex-1 flex flex-col relative z-10 bg-white shadow-xl lg:shadow-none">

        {/* Header */}
        <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
             <div className="xl:hidden w-8 h-8 bg-black text-white flex items-center justify-center rounded-sm">
                <Bot size={16} />
             </div>
             <div>
                <h1 className="text-sm font-bold text-gray-900">Interview Mode</h1>
                <p className="text-xs text-gray-500 font-mono">Profile Configuration</p>
             </div>
          </div>
          <div className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded-sm border border-gray-100">
             {Math.round(((step) / 6) * 100)}% COMPLETE
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
           <div className="max-w-6xl mx-auto space-y-6 w-full">
               {messages.map((msg) => (
                 <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-slide-up-fade`}>
                    <div className="flex items-center gap-2 mb-2">
                       <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">
                          {msg.role === 'ai' ? 'Draft Assistant' : 'You'}
                       </span>
                    </div>

                    <div className={`
                       max-w-[92%] text-sm leading-relaxed whitespace-pre-wrap shadow-sm border
                       ${msg.role === 'user'
                          ? 'bg-gray-900 text-white border-gray-900 px-6 py-4 rounded-lg rounded-tr-none'
                          : 'bg-white text-gray-800 border-gray-200 px-6 py-4 rounded-lg rounded-tl-none'}
                    `}>
                       {msg.content}
                    </div>

                    {msg.options && (
                       <div className="flex flex-wrap gap-2 mt-4">
                          {msg.options.map((opt) => (
                             <button
                                key={opt}
                                onClick={() => handleSendMessage(opt)}
                                className="px-4 sm:px-5 py-2.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-600 hover:border-black hover:bg-black hover:text-white transition-all shadow-sm"
                             >
                                {opt}
                             </button>
                          ))}
                       </div>
                    )}
                 </div>
               ))}

               {isTyping && (
                  <div className="flex items-center gap-1.5 ml-1 mt-2">
                     <span className="text-xs font-mono text-gray-400 animate-pulse">Draft is typing...</span>
                  </div>
               )}
               <div ref={messagesEndRef} />
           </div>
        </div>

        {/* Input */}
        <div className="p-4 sm:p-6 lg:p-10 border-t border-gray-100 bg-white">
           <div className="max-w-6xl mx-auto relative">
              <input
                 type="text"
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(input)}
                 placeholder="Type your answer..."
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
      </div>

      {/* 3. RIGHT SIDEBAR: Live Preview */}
      <div className="hidden lg:flex w-[400px] flex-col bg-[#FAFAFA] border-l border-gray-200">
         <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-full">
               <div className="flex items-center justify-between mb-8 animate-slide-up-fade">
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Personnel File</h2>
                  <div className="flex items-center gap-1.5">
                     <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                     <span className="text-[10px] font-mono text-gray-500">LIVE PREVIEW</span>
                  </div>
               </div>

               <div className="bg-white rounded-sm border border-gray-200 shadow-lg overflow-hidden animate-slide-up-fade transition-all duration-300 hover:shadow-xl hover:border-gray-300 relative group">

                  <div className="absolute top-4 right-4 z-10">
                     <div className="text-[9px] font-mono text-gray-300 border border-gray-100 px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                        <Fingerprint size={10} /> ID: {Date.now().toString().slice(-6)}
                     </div>
                  </div>

                  <div className="p-8">

                     <div className="flex items-start gap-5 mb-8">
                        <div className="w-20 h-20 bg-gray-50 border border-gray-200 rounded-sm flex items-center justify-center text-2xl font-bold text-gray-400 shrink-0 shadow-inner group-hover:border-gray-300 transition-colors">
                           {profile.name ? (
                              <span className="text-black">{profile.name.substring(0, 1)}</span>
                           ) : (
                              <User size={28} strokeWidth={1.5} />
                           )}
                        </div>

                        <div className="flex-1 min-w-0 pt-1">
                           <div className="text-[10px] font-mono font-bold text-gray-400 uppercase mb-1">Applicant</div>
                           <h2 className="text-2xl font-bold text-gray-900 leading-none mb-2 truncate tracking-tight">
                              {profile.name || <span className="text-gray-200 text-xl">Name</span>}
                           </h2>
                           <p className="text-sm font-medium text-gray-600 font-mono truncate">
                              {profile.role || <span className="text-gray-300 font-light">Role not set</span>}
                           </p>
                        </div>
                     </div>

                     <div className="w-full h-px bg-dashed border-t border-dashed border-gray-200 mb-6"></div>

                     <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="text-[9px] font-bold text-gray-400 uppercase font-mono mb-1 block">Affiliation</label>
                              <div className="flex items-center gap-1.5">
                                 <Building2 size={12} className="text-gray-400" />
                                 <span className={`text-xs font-bold ${profile.affiliation ? 'text-gray-900' : 'text-gray-300'}`}>
                                    {profile.affiliation || 'Empty'}
                                 </span>
                              </div>
                           </div>
                           <div>
                              <label className="text-[9px] font-bold text-gray-400 uppercase font-mono mb-1 block">Location</label>
                              <div className="flex items-center gap-1.5">
                                 <MapPin size={12} className="text-gray-400" />
                                 <span className={`text-xs font-bold ${profile.location ? 'text-gray-900' : 'text-gray-300'}`}>
                                    {profile.location || 'Empty'}
                                 </span>
                              </div>
                           </div>
                        </div>

                        <div>
                           <label className="text-[9px] font-bold text-gray-400 uppercase font-mono mb-1.5 block">Current Status</label>
                           {profile.teamStatus ? (
                              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-black text-white text-[10px] font-bold rounded-sm shadow-sm">
                                 <Layers size={10} />
                                 {profile.teamStatus}
                              </div>
                           ) : (
                              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-gray-50 border border-gray-200 text-gray-300 text-[10px] font-bold rounded-sm border-dashed">
                                 <Layers size={10} />
                                 Pending Input
                              </div>
                           )}
                        </div>
                     </div>

                     <div className="mt-8">
                        <label className="text-[9px] font-bold text-gray-400 uppercase font-mono mb-2 flex items-center gap-1">
                           <Target size={10} /> Vision / Mission
                        </label>
                        <div className={`p-4 bg-gray-50 rounded-sm border border-gray-100 min-h-[80px] relative ${profile.idea ? 'text-gray-800' : 'text-gray-300'}`}>
                           <Quote size={12} className="absolute top-3 left-3 text-gray-300" />
                           <p className="text-xs leading-relaxed pl-4 pt-1 italic font-medium">
                              {profile.idea || "Your vision statement will appear here..."}
                           </p>
                        </div>
                     </div>

                  </div>

                  <div className="bg-gray-900 px-8 py-4 flex justify-between items-center">
                     <span className="text-[10px] font-mono text-gray-500">CORE VALUE</span>
                     {profile.coreValue ? (
                        <div className="flex items-center gap-1.5 text-yellow-400">
                           <Sparkles size={12} fill="currentColor" />
                           <span className="text-xs font-bold uppercase tracking-wider">{profile.coreValue}</span>
                        </div>
                     ) : (
                        <span className="text-[10px] text-gray-700 font-mono">NOT DEFINED</span>
                     )}
                  </div>
               </div>
            </div>
         </div>
      </div>

    </div>
  )
}
