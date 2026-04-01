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
  AlertCircle,
} from 'lucide-react'

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
      { q: '커피챗이 뭔가요?', a: '관심 있는 팀원에게 1:1 대화를 요청하는 기능이에요. 상대방이 수락하면 연락처가 공유됩니다.' },
      { q: '커피챗을 보내고 싶어요', a: '상대방의 프로필이나 프로젝트 상세에서 "커피챗 요청" 버튼을 클릭하세요.' },
      { q: '받은 커피챗은 어디서 확인하나요?', a: '/profile 페이지의 "받은 커피챗" 섹션에서 확인하고 수락/거절할 수 있습니다.' },
    ],
  },
  {
    category: '프로젝트',
    items: [
      { q: '프로젝트 업데이트는 어떻게 하나요?', a: '/profile의 내 프로젝트 카드 하단에서 업데이트를 작성할 수 있어요. 퀵 버튼이나 직접 입력 모두 가능합니다.' },
      { q: '프로젝트에 지원하고 싶어요', a: '프로젝트 상세 페이지에서 "지원하기" 버튼을 클릭하면 됩니다. 간단한 메시지를 함께 보낼 수 있어요.' },
      { q: '등록한 프로젝트를 삭제할 수 있나요?', a: '프로젝트 상세 페이지에서 설정 메뉴를 통해 비활성화하거나 삭제할 수 있습니다.' },
    ],
  },
  {
    category: '기타',
    items: [
      { q: 'AI 프로필 분석은 뭔가요?', a: '온보딩 시 AI와 대화하면 작업 스타일, 팀 선호도, 목표 등을 분석해서 더 정확한 팀 매칭에 활용합니다. /profile에서 결과를 확인·수정할 수 있어요.' },
      { q: '사업 계획서를 작성하고 싶어요', a: '/business-plan에서 AI 도움을 받아 사업 계획서를 단계별로 작성할 수 있습니다.' },
      { q: '버그를 발견했어요', a: '이 위젯의 "리포트" 탭에서 버그를 신고해주세요. 빠르게 확인하겠습니다!' },
    ],
  },
]

const REPORT_CATEGORIES = [
  { value: 'bug', label: '버그 신고', icon: Bug, color: 'text-status-danger-text' },
  { value: 'feature', label: '기능 제안', icon: Lightbulb, color: 'text-status-warning-text' },
  { value: 'question', label: '질문', icon: HelpCircle, color: 'text-status-info-text' },
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
        className={`fixed right-3 sm:right-6 z-fixed w-12 h-12 flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-surface-inverse text-txt-inverse rotate-90'
            : 'bg-brand text-white border border-brand shadow-lg hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'
        }`}
        aria-label="도움말"
      >
        {isOpen ? <X size={20} /> : <HelpCircle size={22} />}
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          style={{ bottom: 'calc(5rem + var(--bottom-tab-height) + env(safe-area-inset-bottom, 0px))', animation: 'helpWidgetIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both' }}
          className="fixed right-3 sm:right-6 z-fixed w-[calc(100vw-1.5rem)] sm:w-[24rem] max-h-[min(32rem,calc(100vh-8rem))] bg-surface-card rounded-xl border border-border shadow-lg-xl flex flex-col"
        >
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes helpWidgetIn { 0% { opacity:0;transform:translateY(12px) scale(0.95) } 100% { opacity:1;transform:translateY(0) scale(1) } }
          `}} />

          {/* Header */}
          <div className="px-4 py-3 border-b border-border bg-surface-card shrink-0">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-7 h-7 bg-brand flex items-center justify-center shrink-0">
                <span className="text-white text-[10px] font-black">D</span>
              </div>
              <div>
                <h3 className="text-[13px] font-bold text-txt-primary leading-none">도움이 필요하신가요?</h3>
                <p className="text-[10px] text-txt-disabled font-mono mt-0.5">FAQ · AI 챗 · 리포트</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1">
              {([
                { key: 'faq' as Tab, label: 'FAQ', icon: HelpCircle },
                { key: 'chat' as Tab, label: 'AI 챗', icon: Sparkles },
                { key: 'report' as Tab, label: '리포트', icon: Bug },
              ]).map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-bold transition-all ${
                    tab === t.key
                      ? 'bg-brand text-white'
                      : 'bg-surface-sunken text-txt-tertiary hover:text-txt-secondary hover:bg-surface-card rounded-xl border border-border'
                  }`}
                >
                  <t.icon size={12} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {tab === 'faq' && <FaqTab />}
            {tab === 'chat' && <ChatTab />}
            {tab === 'report' && <ReportTab />}
          </div>
        </div>
      )}
    </>
  )
}

// ── FAQ Tab ──
function FaqTab() {
  const [openIdx, setOpenIdx] = useState<string | null>(null)

  return (
    <div className="p-3 space-y-3">
      {FAQ_ITEMS.map((cat) => (
        <div key={cat.category}>
          <h4 className="text-[10px] font-medium text-txt-disabled mb-1.5 px-1">{cat.category}</h4>
          <div className="space-y-0.5">
            {cat.items.map((item, i) => {
              const key = `${cat.category}-${i}`
              const isOpen = openIdx === key
              return (
                <div key={key} className="border border-border bg-surface-card rounded-xl">
                  <button
                    onClick={() => setOpenIdx(isOpen ? null : key)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-surface-sunken transition-colors"
                  >
                    <span className="text-[12px] font-medium text-txt-primary pr-2">{item.q}</span>
                    {isOpen ? <ChevronDown size={13} className="text-txt-disabled shrink-0" /> : <ChevronRight size={13} className="text-txt-disabled shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-2.5 pt-0 border-t border-border-subtle">
                      <p className="text-[11px] text-txt-secondary leading-relaxed mt-2">{item.a}</p>
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
      const data = await res.json()
      const reply = data?.reply || '답변을 생성하지 못했어요. 다시 질문해주세요.'
      const isOffTopic = !!data?.offTopic

      if (isOffTopic) {
        // Don't keep off-topic exchange in history — rollback and show warning
        setMessages(prev => prev.slice(0, -1))
        setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '죄송해요, 일시적인 오류가 발생했어요. 다시 시도해주세요.',
      }])
    } finally {
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [input, isLoading, messages])

  return (
    <div className="flex flex-col h-full" style={{ minHeight: '16rem' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Sparkles size={24} className="text-txt-disabled" />
            <p className="text-[12px] text-txt-disabled text-center">Draft에 대해 궁금한 점을<br />자유롭게 물어보세요!</p>
            <div className="flex flex-wrap gap-1 mt-2 justify-center">
              {['프로젝트 등록 방법', '커피챗이 뭐예요?', 'AI 매칭 원리'].map(q => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="px-2.5 py-1 text-[10px] font-medium bg-surface-sunken rounded-xl border border-border text-txt-tertiary hover:border-border hover:text-txt-secondary transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3 py-2 text-[12px] leading-relaxed ${
              msg.role === 'user'
                ? 'bg-surface-inverse text-txt-inverse'
                : 'bg-surface-sunken text-txt-primary border border-border'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="px-3 py-2 bg-surface-sunken rounded-xl border border-border">
              <div className="flex items-center gap-1.5">
                <Loader2 size={12} className="animate-spin text-txt-disabled" />
                <span className="text-[11px] text-txt-disabled">답변 생성 중...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-1 border-t border-border shrink-0">
        <div className="flex items-center gap-1.5">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="질문을 입력하세요..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 text-[12px] bg-surface-card rounded-xl border border-border focus:outline-none focus:border-brand transition-colors placeholder:text-txt-disabled disabled:opacity-50"
          />
          <button
            onClick={() => send()}
            disabled={isLoading || !input.trim()}
            className="w-8 h-8 flex items-center justify-center bg-brand text-white border border-brand hover:bg-brand-hover disabled:opacity-30 transition-colors shrink-0"
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
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!category || !title.trim() || !description.trim()) return
    setIsSubmitting(true)
    setError(null)

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
      setCategory('')
      setTitle('')
      setDescription('')
    } catch {
      setError('리포트 전송에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 gap-3">
        <div className="w-12 h-12 bg-status-success-bg flex items-center justify-center">
          <CheckCircle2 size={24} className="text-status-success-text" />
        </div>
        <h4 className="text-[14px] font-bold text-txt-primary">리포트가 접수되었습니다</h4>
        <p className="text-[12px] text-txt-tertiary text-center">빠르게 확인하고 처리하겠습니다.<br />감사합니다!</p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-2 px-4 py-2 text-[12px] font-bold bg-surface-card rounded-xl border border-border text-txt-secondary hover:bg-black hover:text-white hover:border-border transition-colors"
        >
          새 리포트 작성
        </button>
      </div>
    )
  }

  return (
    <div className="p-3 space-y-3">
      {/* Category */}
      <div>
        <label className="text-[10px] font-medium text-txt-disabled mb-1.5 block">카테고리 *</label>
        <div className="grid grid-cols-2 gap-1.5">
          {REPORT_CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`flex items-center gap-2 px-3 py-2 text-[11px] font-medium border transition-all ${
                category === cat.value
                  ? 'bg-brand text-white border-brand'
                  : 'bg-surface-card text-txt-secondary border-border hover:border-border'
              }`}
            >
              <cat.icon size={13} />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="text-[10px] font-medium text-txt-disabled mb-1.5 block">제목 *</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="간단히 요약해주세요"
          maxLength={200}
          className="w-full px-3 py-2 text-[12px] bg-surface-card rounded-xl border border-border focus:outline-none focus:border-brand transition-colors placeholder:text-txt-disabled"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-[10px] font-medium text-txt-disabled mb-1.5 block">상세 내용 *</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="어떤 상황에서 발생했는지, 기대했던 동작은 무엇인지 알려주세요"
          rows={4}
          maxLength={5000}
          className="w-full px-3 py-2 text-[12px] bg-surface-sunken rounded-xl border border-border focus:outline-none focus:border-brand transition-colors resize-none placeholder:text-txt-disabled"
        />
        <p className="text-[9px] text-txt-disabled text-right mt-0.5 font-mono">{description.length}/5000</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-status-danger-bg border border-status-danger-text/20">
          <AlertCircle size={12} className="text-status-danger-text shrink-0" />
          <p className="text-[11px] text-status-danger-text">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!category || !title.trim() || !description.trim() || isSubmitting}
        className="w-full py-2.5 text-[12px] font-bold bg-brand text-white border border-brand hover:bg-brand-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.97]"
      >
        {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        리포트 제출
      </button>

      <p className="text-[9px] text-txt-disabled text-center font-mono">현재 페이지 URL이 자동으로 포함됩니다</p>
    </div>
  )
}
