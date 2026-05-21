'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useBackHandler } from '@/src/hooks/useBackHandler'
import {
  MessageCircle,
  X,
  Send,
  HelpCircle,
  Bug,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Sparkles,
  RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'

// ── FAQ Data ──
const FAQ_ITEMS = [
  {
    category: '시작하기',
    items: [
      { q: '프로젝트는 어떻게 등록하나요?', a: '/explore 페이지에서 "새 프로젝트" 버튼을 클릭하세요. 제목, 설명, 모집 포지션 등을 입력하면 바로 등록됩니다.' },
      { q: '프로필을 수정하고 싶어요', a: '/profile 페이지에서 "프로필 수정" 버튼을 클릭하면 닉네임, 포지션, 기술 스택, AI 분석 데이터 등을 수정할 수 있습니다.' },
      { q: '팀 매칭은 어떻게 되나요?', a: 'AI가 기술 스택, 성향(온보딩 AI 대화 기반), 관심 분야를 분석해서 맞는 팀원을 추천해드립니다. /network에서 확인하세요.' },
    ],
  },
  {
    category: '커피챗',
    items: [
      { q: '커피챗이 뭔가요?', a: '관심 있는 팀원에게 1:1 대화를 요청하는 기능입니다. 상대방이 수락하면 서로의 연락처가 자동 공유되어 바로 만나거나 메시지를 주고받으실 수 있습니다.' },
      { q: '커피챗을 보내고 싶어요', a: '상대방의 프로필이나 프로젝트 상세에서 "커피챗 요청" 버튼을 눌러 주세요. 짧은 자기소개 메시지를 함께 보내시면 수락률이 올라갑니다.' },
      { q: '받은 커피챗은 어디서 확인하나요?', a: '/profile 페이지의 "받은 커피챗" 섹션에서 확인하고 수락·거절하실 수 있습니다. 모바일에서는 더보기 메뉴에 숨겨져 있을 수 있습니다.' },
    ],
  },
  {
    category: '프로젝트',
    items: [
      { q: '프로젝트 업데이트는 어떻게 하나요?', a: '/profile 의 내 프로젝트 카드 하단에서 업데이트를 작성하실 수 있습니다. 퀵 버튼(한 줄 요약)과 직접 입력(풍부한 설명) 두 가지 모두 가능합니다.' },
      { q: '프로젝트에 지원하고 싶어요', a: '프로젝트 상세 페이지에서 "지원하기" 버튼을 눌러 주세요. 한 문단 자기소개를 함께 보내시면 owner 가 먼저 답변할 확률이 높아집니다.' },
      { q: '등록한 프로젝트를 삭제할 수 있나요?', a: '프로젝트 상세 페이지에서 설정 메뉴를 통해 비활성화하거나 삭제할 수 있습니다.' },
    ],
  },
  {
    category: '기타',
    items: [
      { q: 'AI 프로필 분석은 뭔가요?', a: '온보딩 시 AI 와 2분 정도 대화하시면 작업 스타일·팀 선호도·목표를 분석해 매칭 정확도를 높입니다. 결과는 /profile 에서 언제든 확인·수정하실 수 있습니다.' },
      { q: '사업 계획서를 작성하고 싶어요', a: '/business-plan 에서 AI 도움을 받아 단계별로 작성하실 수 있습니다. 완성된 문서는 PDF·DOCX 로 내보내기 가능합니다.' },
      { q: '버그를 발견했어요', a: '이 위젯의 "리포트" 탭에서 신고해 주세요. 재현 단계·스크린샷이 있으면 더 빠르게 대응 가능합니다.' },
    ],
  },
]

const REPORT_CATEGORIES = [
  { value: 'bug', label: '버그 신고', icon: Bug, color: 'text-[#FF3B30]' },
  { value: 'feature', label: '기능 제안', icon: Lightbulb, color: 'text-[#FF9F0A]' },
  { value: 'question', label: '질문', icon: HelpCircle, color: 'text-[#5E6AD2]' },
  { value: 'other', label: '기타', icon: MessageCircle, color: 'text-txt-tertiary' },
]

// ── Types ──
type Tab = 'faq' | 'chat' | 'report'
interface ChatMsg { role: 'user' | 'assistant'; content: string }

// ── Component ──
export function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('faq')

  useBackHandler(isOpen, () => setIsOpen(false), 'help-widget')

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ bottom: 'calc(1.5rem + var(--bottom-tab-height) + env(safe-area-inset-bottom, 0px))' }}
        className={`fixed right-3 sm:right-6 z-fixed w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
          isOpen
            ? 'bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] rotate-90 shadow-none'
            : 'bg-[#5E6AD2] text-white active:scale-90'
        }`}
        aria-label="도움말"
      >
        {isOpen ? <X size={20} /> : <HelpCircle size={22} />}
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          style={{ bottom: 'calc(5rem + var(--bottom-tab-height) + env(safe-area-inset-bottom, 0px))', animation: 'helpWidgetIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both' }}
          className="fixed right-3 sm:right-6 z-fixed w-[calc(100vw-1.5rem)] sm:w-[24rem] h-[min(32rem,calc(100vh-8rem))] bg-white dark:bg-[#1C1C1E] rounded-[20px] shadow-2xl flex flex-col overflow-hidden"
        >
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes helpWidgetIn { 0% { opacity:0;transform:translateY(12px) scale(0.95) } 100% { opacity:1;transform:translateY(0) scale(1) } }
            @keyframes fadeSlideIn { 0% { opacity:0;transform:translateY(4px) } 100% { opacity:1;transform:translateY(0) } }
          `}} />

          {/* Header */}
          <div className="px-5 pt-5 pb-3 shrink-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-[#5E6AD2] rounded-2xl flex items-center justify-center shrink-0">
                <span className="text-white text-[12px] font-black">D</span>
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-txt-primary leading-tight">도움이 필요하신가요?</h3>
                <p className="text-[12px] text-txt-tertiary mt-0.5">FAQ, AI 챗, 리포트</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5 bg-[#F2F3F5] dark:bg-[#2C2C2E] rounded-xl p-1">
              {([
                { key: 'faq' as Tab, label: 'FAQ', icon: HelpCircle },
                { key: 'chat' as Tab, label: 'AI 챗', icon: Sparkles },
                { key: 'report' as Tab, label: '리포트', icon: Bug },
              ]).map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] font-semibold rounded-lg transition-all ${
                    tab === t.key
                      ? 'bg-white dark:bg-[#3A3A3C] text-txt-primary shadow-sm'
                      : 'text-txt-tertiary hover:text-txt-secondary'
                  }`}
                >
                  <t.icon size={13} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {tab === 'faq' && <FaqTab onClose={() => setIsOpen(false)} />}
            {tab === 'chat' && <ChatTab />}
            {tab === 'report' && <ReportTab />}
          </div>
        </div>
      )}
    </>
  )
}

// ── Starter Guide Reset ──
const STARTER_GUIDE_KEY = 'draft_starter_guide'

function resetStarterGuide(onClose: () => void) {
  try {
    const raw = localStorage.getItem(STARTER_GUIDE_KEY)
    if (raw) {
      const state = JSON.parse(raw)
      state.softDismissedAt = null
      state.permanentlyDismissed = false
      state.completedAt = null
      localStorage.setItem(STARTER_GUIDE_KEY, JSON.stringify(state))
    } else {
      localStorage.setItem(STARTER_GUIDE_KEY, JSON.stringify({
        version: 1,
        steps: { profile: false, explore: false, project: false },
        softDismissedAt: null,
        permanentlyDismissed: false,
        completedAt: null,
      }))
    }
  } catch {
    localStorage.removeItem(STARTER_GUIDE_KEY)
  }
  toast.success('시작 가이드가 다시 표시됩니다')
  onClose()
}

// ── FAQ Tab ──
function FaqTab({ onClose }: { onClose: () => void }) {
  const [openIdx, setOpenIdx] = useState<string | null>(null)

  return (
    <div className="px-4 pb-4 space-y-4">
      {/* Starter guide restart */}
      <button
        onClick={() => resetStarterGuide(onClose)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left bg-[#F7F8F9] dark:bg-[#2C2C2E] rounded-2xl active:opacity-80 transition-opacity group"
      >
        <RotateCcw size={15} className="text-[#5E6AD2] shrink-0" />
        <span className="text-[13px] font-medium text-txt-primary">시작 가이드 다시 보기</span>
      </button>

      {/* 전체 FAQ 페이지 링크 — 위젯엔 요약만, 전체는 /help 에서 검색·카테고리 이동 가능 */}
      <a
        href="/help"
        className="w-full flex items-center gap-3 px-4 py-3 text-left bg-surface-sunken rounded-2xl active:opacity-80 transition-opacity group"
      >
        <HelpCircle size={15} className="text-brand shrink-0" aria-hidden="true" />
        <span className="flex-1 text-[13px] font-medium text-txt-primary">자주 묻는 질문 전체 보기</span>
        <ChevronRight size={14} className="text-txt-disabled shrink-0" aria-hidden="true" />
      </a>

      {FAQ_ITEMS.map((cat) => (
        <div key={cat.category}>
          <h4 className="text-[12px] font-semibold text-txt-tertiary mb-2 px-1">{cat.category}</h4>
          <div className="space-y-1.5">
            {cat.items.map((item, i) => {
              const key = `${cat.category}-${i}`
              const isOpen = openIdx === key
              return (
                <div key={key} className="bg-[#F7F8F9] dark:bg-[#2C2C2E] rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setOpenIdx(isOpen ? null : key)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left active:opacity-70 transition-opacity"
                  >
                    <span className="text-[13px] font-medium text-txt-primary pr-2">{item.q}</span>
                    {isOpen ? <ChevronDown size={14} className="text-txt-disabled shrink-0" /> : <ChevronRight size={14} className="text-txt-disabled shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-3">
                      <p className="text-[12px] text-txt-secondary leading-relaxed">{item.a}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Chat Tab ──
const QUICK_ANSWERS: Record<string, string> = {
  '프로젝트 등록 방법': '/explore 페이지 우측 상단의 "새 프로젝트" 버튼을 눌러 주세요. 제목·소개·모집 포지션만 채우시면 3분 내에 등록되며, 작성 중에도 자동 저장됩니다.',
  '커피챗이 뭐예요?': '관심 있는 팀원에게 1:1 대화를 요청하는 기능입니다. 상대방이 수락하면 서로의 연락처가 공유되어 바로 만나거나 메시지를 주고받으실 수 있습니다. 프로필 또는 프로젝트 상세에서 "커피챗 요청" 버튼을 사용해 주세요.',
  'AI 매칭 원리': 'AI 가 기술 스택·작업 성향(온보딩 대화 기반)·관심 분야를 종합해 나와 잘 맞는 팀원과 프로젝트를 추천해 드립니다. /network 에서 추천 결과를 확인하실 수 있습니다.',
}

function ChatTab() {
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const send = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim()
    if (!text || isLoading) return
    setInput('')
    const userMsg: ChatMsg = { role: 'user', content: text }

    // Quick answer — no API call needed
    const quickReply = QUICK_ANSWERS[text]
    if (quickReply) {
      setMessages(prev => [...prev, userMsg, { role: 'assistant', content: quickReply }])
      return
    }

    const updated = [...messages, userMsg]
    setMessages(updated)
    setIsLoading(true)

    try {
      const res = await fetch('/api/help/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      })
      if (!res.ok) throw new Error()

      // Stream SSE response
      const reader = res.body?.getReader()
      if (!reader) throw new Error()

      const decoder = new TextDecoder()
      let fullText = ''
      // Add empty assistant message to fill incrementally
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6)
          if (payload === '[DONE]') break
          try {
            const { text: chunk, error } = JSON.parse(payload)
            if (error) throw new Error()
            if (chunk) {
              fullText += chunk
              const snapshot = fullText
              setMessages(prev => {
                const copy = [...prev]
                copy[copy.length - 1] = { role: 'assistant', content: snapshot }
                return copy
              })
            }
          } catch { /* skip malformed chunk */ }
        }
      }

      if (!fullText.trim()) {
        setMessages(prev => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: 'assistant', content: '답변을 생성하지 못했습니다. 질문을 조금 더 구체적으로 바꾸신 뒤 다시 시도해 주세요.' }
          return copy
        })
      }

      // Check off-topic
      if (fullText.startsWith('[OFF_TOPIC]')) {
        const cleaned = fullText.replace('[OFF_TOPIC]', '').trim()
        setMessages(prev => {
          // Remove the user message (second to last) and update assistant reply
          const copy = [...prev]
          copy.splice(copy.length - 2, 1) // remove user msg
          copy[copy.length - 1] = { role: 'assistant', content: cleaned }
          return copy
        })
      }
    } catch {
      setMessages(prev => {
        // If we already added an empty assistant message, update it
        if (prev.length > 0 && prev[prev.length - 1].role === 'assistant' && !prev[prev.length - 1].content) {
          const copy = [...prev]
          copy[copy.length - 1] = { role: 'assistant', content: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요. 계속되면 /contact 에서 제보 부탁드립니다.' }
          return copy
        }
        return [...prev, { role: 'assistant', content: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' }]
      })
    } finally {
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [input, isLoading, messages])

  return (
    <div className="flex flex-col h-full" style={{ minHeight: '16rem' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-2.5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-12 h-12 bg-[#F2F3F5] dark:bg-[#2C2C2E] rounded-full flex items-center justify-center">
              <Sparkles size={22} className="text-[#5E6AD2]" />
            </div>
            <p className="text-[13px] text-txt-tertiary text-center">Draft 사용에 대해 궁금한 점을<br />편하게 물어봐 주세요.</p>
            <p className="text-[11px] text-txt-disabled text-center -mt-1">
              AI 가 서비스 관련 질문만 답변합니다. 버그 신고는 옆 &quot;리포트&quot; 탭을 이용해 주세요.
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1 justify-center">
              {['프로젝트 등록 방법', '커피챗이 뭐예요?', 'AI 매칭 원리'].map(q => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="px-3 py-1.5 text-[11px] font-medium bg-[#F7F8F9] dark:bg-[#2C2C2E] rounded-full text-txt-secondary active:opacity-70 transition-opacity"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-[fadeSlideIn_0.2s_ease-out]`}>
            <div className={`max-w-[85%] px-3.5 py-2.5 text-[13px] leading-relaxed ${
              msg.role === 'user'
                ? 'bg-[#5E6AD2] text-white rounded-[18px] rounded-br-md'
                : 'bg-[#F7F8F9] dark:bg-[#2C2C2E] text-txt-primary rounded-[18px] rounded-bl-md'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="px-3.5 py-2.5 bg-[#F7F8F9] dark:bg-[#2C2C2E] rounded-[18px] rounded-bl-md">
              <div className="flex items-center gap-2">
                <Loader2 size={13} className="animate-spin text-[#5E6AD2]" />
                <span className="text-[12px] text-txt-tertiary">답변 생성 중...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 shrink-0">
        <div className="flex items-center gap-2 bg-[#F7F8F9] dark:bg-[#2C2C2E] rounded-full pl-4 pr-1.5 py-1.5">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="질문을 입력하세요..."
            disabled={isLoading}
            className="flex-1 text-[13px] bg-transparent focus:outline-none placeholder:text-txt-disabled disabled:opacity-50"
          />
          <button
            onClick={() => send()}
            disabled={isLoading || !input.trim()}
            className="w-8 h-8 flex items-center justify-center bg-[#5E6AD2] text-white rounded-full disabled:opacity-30 transition-opacity active:scale-90 shrink-0"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Report Tab ──
function ReportTab() {
  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!category || !title.trim() || !description.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/help/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          title: title.trim(),
          description: description.trim(),
          pageUrl: window.location.href,
        }),
      })
      if (!res.ok) throw new Error()
      setSubmitted(true)
      toast.success('리포트가 접수되었습니다', {
        description: '영업일 기준 2일 이내에 확인해 회신 드리며, 보안 제보는 24시간 이내 초기 응답입니다.',
      })
    } catch {
      toast.error('리포트 전송에 실패했습니다', {
        description: '인터넷 연결을 확인하신 뒤 다시 시도해 주세요. 문제가 계속되면 team@dailydraft.me 로 직접 보내 주세요.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 gap-3 animate-[fadeSlideIn_0.2s_ease-out]">
        <div className="w-12 h-12 bg-[#E8F5E9] rounded-2xl flex items-center justify-center">
          <CheckCircle2 size={24} className="text-[#4CAF50]" />
        </div>
        <h4 className="text-[14px] font-bold text-txt-primary">리포트를 잘 받았습니다</h4>
        <p className="text-[12px] text-txt-tertiary text-center leading-relaxed">
          영업일 기준 2일 이내에 확인하고 회신 드립니다.<br />
          보안 제보라면 24시간 내 초기 응답이 목표입니다.
        </p>
        <button
          onClick={() => { setSubmitted(false); setCategory(''); setTitle(''); setDescription('') }}
          className="mt-2 px-4 py-2.5 text-[12px] font-semibold bg-[#F7F8F9] dark:bg-[#2C2C2E] rounded-2xl text-txt-secondary active:scale-[0.97] transition-all"
        >
          새 리포트 작성
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 pb-4 space-y-4">
      {/* Category */}
      <div>
        <label className="text-[12px] font-semibold text-txt-tertiary mb-2 block px-1">카테고리</label>
        <div className="grid grid-cols-2 gap-2">
          {REPORT_CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`flex items-center gap-2.5 px-4 py-3 text-[13px] font-medium rounded-2xl transition-all active:scale-[0.97] ${
                category === cat.value
                  ? 'bg-[#5E6AD2] text-white shadow-sm'
                  : 'bg-[#F7F8F9] dark:bg-[#2C2C2E] text-txt-secondary active:opacity-70'
              }`}
            >
              <cat.icon size={15} />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="text-[12px] font-semibold text-txt-tertiary mb-2 block px-1">제목</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="예: 커피챗 수락 버튼이 눌리지 않습니다"
          aria-label="리포트 제목"
          maxLength={200}
          className="w-full px-4 py-3 text-[13px] bg-[#F7F8F9] dark:bg-[#2C2C2E] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/20 transition-all placeholder:text-txt-disabled"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-[12px] font-semibold text-txt-tertiary mb-2 block px-1">상세 내용</label>
        <p className="text-[10px] text-txt-disabled mb-1.5 px-1 leading-relaxed">
          재현 단계(1→2→3) · 사용 기기·브라우저 · 기대 동작 · 실제 동작을 알려 주시면 더 빠르게 대응할 수 있습니다. 스크린샷이 있으시면 이미지 호스팅 링크를 본문에 넣어 주세요.
        </p>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="예: 1. /p/abc 프로젝트 상세 진입 → 2. 커피챗 요청 버튼 클릭 → 3. 모달이 열리지 않음. Chrome 120, Windows 11."
          aria-label="리포트 상세 내용"
          rows={5}
          maxLength={5000}
          className="w-full px-4 py-3 text-[13px] bg-[#F7F8F9] dark:bg-[#2C2C2E] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/20 transition-all resize-none placeholder:text-txt-disabled"
        />
        <p className={`text-[10px] text-right mt-1 tabular-nums ${
          description.length >= 5000 ? 'text-status-danger-text font-semibold' :
          description.length >= 4500 ? 'text-status-warning-text' :
          'text-txt-disabled'
        }`}>
          {description.length.toLocaleString()}/5,000
        </p>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!category || !title.trim() || !description.trim() || isSubmitting}
        className="w-full h-12 text-[14px] font-semibold bg-[#5E6AD2] text-white rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-[0.97]"
      >
        {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        {isSubmitting ? '전송 중...' : '리포트 제출'}
      </button>
    </div>
  )
}
