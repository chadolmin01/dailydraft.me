'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Send,
  Loader2,
  Mail,
  MailOpen,
  Trash2,
  ArrowLeft,
  Search,
  Clock,
  AlertCircle,
  RotateCw,
  Compass,
} from 'lucide-react'
import { PageContainer } from '@/components/ui/PageContainer'
import { cleanNickname } from '@/src/lib/clean-nickname'
import { useAuth } from '@/src/context/AuthContext'
import {
  useConversations,
  useMessageThread,
  useSendMessage,
  useMarkRead,
  useDeleteMessage,
  useMessagesRealtime,
  useTypingIndicator,
} from '@/src/hooks/useMessages'
import type { Conversation, ConversationPartner, DirectMessage } from '@/src/hooks/useMessages'
import { ProfileDetailModal } from '@/components/ProfileDetailModal'

// -------- 유틸 --------

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

// 같은 날(로컬)인지 비교
function isSameDay(a: string, b: string) {
  const da = new Date(a)
  const db = new Date(b)
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate()
}

function dayLabel(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1)
  if (isSameDay(dateStr, today.toISOString())) return '오늘'
  if (isSameDay(dateStr, yesterday.toISOString())) return '어제'
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
}

// URL을 <a> 태그로 치환. XSS 방어를 위해 text/URL 노드만 생성하고 innerHTML 사용 금지.
// split에 캡처그룹 사용 + test는 global 없는 별도 regex로 lastIndex 부작용 회피
const URL_SPLIT_REGEX = /(https?:\/\/[^\s<>"']+)/g
const URL_TEST_REGEX = /^https?:\/\//
function renderMessageContent(content: string): React.ReactNode {
  const parts = content.split(URL_SPLIT_REGEX)
  return parts.map((part, i) => {
    if (URL_TEST_REGEX.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-dotted underline-offset-2 hover:opacity-80 break-all"
        >
          {part}
        </a>
      )
    }
    return <span key={i}>{part}</span>
  })
}

// -------- 페이지 --------

function MessagesPageInner() {
  const { user } = useAuth()
  const searchParams = useSearchParams()

  const [selectedPartner, setSelectedPartner] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileShowThread, setMobileShowThread] = useState(false)
  const [profileModalId, setProfileModalId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Realtime 구독 (새 메시지/읽음 상태)
  useMessagesRealtime()

  const { data: convData, isLoading: convsLoading } = useConversations()
  const { data: threadData } = useMessageThread(selectedPartner)
  const sendMessage = useSendMessage()
  const markRead = useMarkRead()
  const deleteMessage = useDeleteMessage()
  const { partnerTyping, notifyTyping } = useTypingIndicator(selectedPartner)

  const conversations = convData?.conversations || []
  const profiles = { ...convData?.profiles, ...threadData?.profiles } as Record<string, ConversationPartner>
  const messages = useMemo(() => threadData?.messages || [], [threadData])

  // URL 쿼리 파라미터 지원: ?to=<userId>&prefill=<template>
  // Explore 등에서 "쪽지 보내기" 진입 시 상대 선택 + 템플릿 문구 자동 채움
  useEffect(() => {
    const to = searchParams.get('to')
    const prefill = searchParams.get('prefill')
    if (to) {
      setSelectedPartner(to)
      setMobileShowThread(true)
    }
    if (prefill) {
      setMessageInput(prefill)
    }
    // 한 번만 — searchParams 의존성 생략 의도적 (초기 진입용)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 검색 필터
  const filtered = searchQuery.trim()
    ? conversations.filter(c => {
        const p = profiles[c.partnerId]
        return p?.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
      })
    : conversations

  // 메시지 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, partnerTyping])

  // 읽음 처리 — 스레드 열 때 첫 unread 인덱스 기억 ("여기까지 읽음" 라인 위치용)
  const [unreadAnchorId, setUnreadAnchorId] = useState<string | null>(null)
  useEffect(() => {
    if (!selectedPartner || messages.length === 0) {
      setUnreadAnchorId(null)
      return
    }
    const firstUnread = messages.find(m => m.receiver_id === user?.id && !m.is_read)
    if (firstUnread && !unreadAnchorId) {
      setUnreadAnchorId(firstUnread.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPartner, messages.length])

  // 대화 상대 변경 시 앵커 초기화
  useEffect(() => {
    setUnreadAnchorId(null)
  }, [selectedPartner])

  // 읽음 처리 — 한 번만 호출 추적
  const markedIdsRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (selectedPartner && messages.length > 0) {
      const unread = messages.filter(m => m.receiver_id === user?.id && !m.is_read && !markedIdsRef.current.has(m.id))
      unread.forEach(m => {
        markedIdsRef.current.add(m.id)
        markRead.mutate(m.id)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPartner, messages])

  useEffect(() => {
    markedIdsRef.current.clear()
  }, [selectedPartner])

  // 텍스트에어리어 auto-grow
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }, [messageInput])

  const handleSend = useCallback(() => {
    if (!selectedPartner || !messageInput.trim()) return
    import('@/src/utils/haptic').then(h => h.hapticLight())
    const content = messageInput.trim()
    setMessageInput('')
    sendMessage.mutate({ receiver_id: selectedPartner, content })
  }, [selectedPartner, messageInput, sendMessage])

  // 실패한 메시지 재전송: 기존 failed optimistic을 제거하고 다시 전송
  const retrySend = useCallback((msg: DirectMessage) => {
    if (!selectedPartner) return
    // failed 메시지는 onSuccess/onError가 이미 지나간 상태라 그대로 두고 새로 보낸다
    sendMessage.mutate({ receiver_id: selectedPartner, content: msg.content })
  }, [selectedPartner, sendMessage])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    } else {
      notifyTyping()
    }
  }

  const selectPartner = (partnerId: string) => {
    setSelectedPartner(partnerId)
    setMobileShowThread(true)
  }

  const selectedProfile = selectedPartner ? profiles[selectedPartner] : null

  // 메시지를 날짜 그룹 + unread anchor 라인으로 렌더링할 수 있게 변환
  type RenderItem =
    | { kind: 'day'; key: string; label: string }
    | { kind: 'unread-line'; key: string }
    | { kind: 'msg'; key: string; msg: DirectMessage }
  const renderItems: RenderItem[] = useMemo(() => {
    const items: RenderItem[] = []
    let lastDay: string | null = null
    let unreadLineInserted = false
    for (const m of messages) {
      const day = new Date(m.created_at).toDateString()
      if (day !== lastDay) {
        items.push({ kind: 'day', key: `day-${day}`, label: dayLabel(m.created_at) })
        lastDay = day
      }
      if (!unreadLineInserted && unreadAnchorId && m.id === unreadAnchorId) {
        items.push({ kind: 'unread-line', key: `unread-${m.id}` })
        unreadLineInserted = true
      }
      items.push({ kind: 'msg', key: m.id, msg: m })
    }
    return items
  }, [messages, unreadAnchorId])

  return (
    <div className="bg-surface-bg min-h-full">
      <PageContainer size="wide" className="py-6">
        {/* 높이 차감 내역: 상단 헤더(3.5rem) + 상단 여백(3rem) + 하단 탭 + PageContainer py-6(3rem).
            py-6를 빼먹으면 전체 박스가 뷰포트를 48px 초과해 좌측 사이드바 아래가 하단 탭 뒤로 숨는다. */}
        <div className="flex gap-0 md:gap-4 h-[calc(100dvh-3.5rem-3rem-var(--bottom-tab-height)-3rem)]">

          {/* 대화 목록 */}
          <div className={`w-full md:w-80 bg-surface-card rounded-2xl shadow-sm shrink-0 flex flex-col ${mobileShowThread ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-border/40">
              <h2 className="text-xl font-bold text-txt-primary mb-3 flex items-center gap-2">
                <Mail size={20} /> 쪽지
              </h2>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-disabled" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="이름으로 검색..."
                  className="w-full pl-9 pr-3 py-2 text-base sm:text-sm border border-border bg-surface-bg focus:outline-none focus:border-accent transition-colors rounded-xl"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {convsLoading ? (
                <div className="p-3 space-y-2">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <div className="w-10 h-10 bg-surface-sunken rounded-full skeleton-shimmer shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-surface-sunken rounded skeleton-shimmer w-24" />
                        <div className="h-2.5 bg-surface-sunken rounded skeleton-shimmer w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="w-14 h-14 rounded-full bg-surface-sunken flex items-center justify-center empty-float mb-4">
                    <MailOpen size={24} className="text-txt-tertiary" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-medium text-txt-secondary mb-1">
                    {searchQuery ? '검색 결과가 없습니다' : '아직 쪽지가 없습니다'}
                  </p>
                  <p className="text-xs text-txt-disabled mb-4">Explore에서 마음에 드는 사람에게 쪽지를 보내보세요</p>
                  {!searchQuery && (
                    <Link
                      href="/explore"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-inverse text-txt-inverse text-xs font-medium hover:opacity-90 active:scale-[0.97] transition-all"
                    >
                      <Compass size={14} /> Explore로 가기
                    </Link>
                  )}
                </div>
              ) : (
                <div className="p-1.5 space-y-0.5">
                  {filtered.map((conv: Conversation) => {
                    const partner = profiles[conv.partnerId]
                    const isSelected = selectedPartner === conv.partnerId
                    return (
                      <button
                        key={conv.partnerId}
                        onClick={() => selectPartner(conv.partnerId)}
                        className={`w-full flex items-center gap-3 p-3 text-left transition-colors rounded-xl ${
                          isSelected
                            ? 'bg-brand-bg border border-brand-border'
                            : 'hover:bg-surface-sunken border border-transparent'
                        }`}
                      >
                        <div className="w-10 h-10 bg-surface-inverse rounded-full flex items-center justify-center text-xs font-bold text-txt-inverse shrink-0">
                          {cleanNickname(partner?.nickname || '').slice(0, 2) || '??'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-txt-primary truncate">
                              {cleanNickname(partner?.nickname || '') || 'Unknown'}
                            </span>
                            <span className="text-[11px] text-txt-disabled shrink-0 ml-2">
                              {conv.lastAt ? timeAgo(conv.lastAt) : ''}
                            </span>
                          </div>
                          <p className="text-xs text-txt-tertiary truncate mt-0.5">
                            {conv.lastMessage || '(읽지 않은 쪽지)'}
                          </p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold bg-brand text-white shrink-0 rounded-full">
                            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 메시지 스레드 */}
          <div className={`flex-1 bg-surface-card rounded-2xl shadow-sm flex flex-col ${!mobileShowThread ? 'hidden md:flex' : 'flex'}`}>
            {!selectedPartner ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <div className="w-16 h-16 rounded-full bg-surface-sunken flex items-center justify-center empty-float mb-4">
                  <Mail size={28} className="text-txt-tertiary" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-medium text-txt-secondary mb-1">대화를 선택하세요</p>
                <p className="text-xs text-txt-disabled">왼쪽 목록에서 대화 상대를 선택해보세요</p>
              </div>
            ) : (
              <>
                {/* 스레드 헤더 — 아바타/닉네임 클릭 시 프로필 모달 */}
                <div className="px-4 py-3 border-b border-border/40 flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => { setMobileShowThread(false); setSelectedPartner(null) }}
                    className="md:hidden p-1.5 rounded-lg hover:bg-surface-sunken transition-colors"
                  >
                    <ArrowLeft size={18} className="text-txt-secondary" />
                  </button>
                  <button
                    onClick={() => setProfileModalId(selectedPartner)}
                    className="flex items-center gap-3 flex-1 min-w-0 p-1 -ml-1 rounded-lg hover:bg-surface-sunken transition-colors text-left"
                  >
                    <div className="w-8 h-8 bg-surface-inverse rounded-full flex items-center justify-center text-xs font-bold text-txt-inverse shrink-0">
                      {cleanNickname(selectedProfile?.nickname || '').slice(0, 2) || '??'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-txt-primary truncate">
                        {cleanNickname(selectedProfile?.nickname || '') || 'Unknown'}
                      </p>
                      {partnerTyping ? (
                        <p className="text-[11px] text-brand flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand animate-pulse" /> 입력 중...
                        </p>
                      ) : selectedProfile?.desired_position ? (
                        <p className="text-[11px] text-txt-disabled truncate">
                          {selectedProfile.desired_position}
                        </p>
                      ) : null}
                    </div>
                  </button>
                </div>

                {/* 메시지 목록 */}
                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-2">
                  {renderItems.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-xs text-txt-disabled">첫 쪽지를 보내보세요</p>
                    </div>
                  ) : (
                    renderItems.map(item => {
                      if (item.kind === 'day') {
                        return (
                          <div key={item.key} className="flex items-center justify-center py-3">
                            <span className="px-3 py-1 rounded-full bg-surface-sunken text-[11px] text-txt-tertiary font-medium">
                              {item.label}
                            </span>
                          </div>
                        )
                      }
                      if (item.kind === 'unread-line') {
                        return (
                          <div key={item.key} className="flex items-center gap-2 py-1">
                            <div className="flex-1 h-px bg-brand/30" />
                            <span className="text-[10px] font-semibold text-brand uppercase tracking-wide">여기까지 읽음</span>
                            <div className="flex-1 h-px bg-brand/30" />
                          </div>
                        )
                      }
                      const msg = item.msg
                      const isMine = msg.sender_id === user?.id
                      const isSending = msg._status === 'sending'
                      const isFailed = msg._status === 'failed'
                      return (
                        <div key={item.key} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`group relative max-w-[75%] ${isMine ? 'order-2' : ''}`}>
                            <div className={`px-3.5 py-2.5 text-sm leading-relaxed rounded-2xl ${
                              isMine
                                ? isFailed
                                  ? 'bg-status-danger-bg text-status-danger-text border border-status-danger-border'
                                  : 'bg-surface-inverse text-txt-inverse border border-surface-inverse shadow-sm'
                                : 'bg-surface-sunken text-txt-primary border border-border'
                            } ${isSending ? 'opacity-60' : ''}`}>
                              <p className="whitespace-pre-wrap break-words">
                                {renderMessageContent(msg.content)}
                              </p>
                            </div>
                            <div className={`flex items-center gap-2 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                              {isSending && (
                                <span className="text-[11px] text-txt-disabled flex items-center gap-1">
                                  <Clock size={10} /> 전송 중
                                </span>
                              )}
                              {isFailed && (
                                <button
                                  onClick={() => retrySend(msg)}
                                  className="text-[11px] text-status-danger-text flex items-center gap-1 hover:underline"
                                >
                                  <AlertCircle size={10} /> 실패 <RotateCw size={10} /> 재전송
                                </button>
                              )}
                              {!isSending && !isFailed && (
                                <span className="text-[11px] text-txt-disabled">
                                  {formatTime(msg.created_at)}
                                </span>
                              )}
                              {isMine && !isSending && !isFailed && msg.is_read && (
                                <span className="text-[11px] text-brand">읽음</span>
                              )}
                              {!isSending && !isFailed && !msg.id.startsWith('optimistic-') && (
                                <button
                                  onClick={() => deleteMessage.mutate(msg.id)}
                                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-txt-disabled hover:text-status-danger-text hover:bg-surface-sunken transition-all"
                                  title="삭제"
                                >
                                  <Trash2 size={10} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* 입력 — textarea + auto-grow + Shift+Enter 줄바꿈 */}
                <div className="px-4 py-3 border-t border-border/40 shrink-0">
                  <div className="flex gap-2 items-end">
                    <textarea
                      ref={textareaRef}
                      value={messageInput}
                      onChange={e => setMessageInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="쪽지를 입력하세요... (Shift+Enter로 줄바꿈)"
                      maxLength={2000}
                      rows={1}
                      className="flex-1 px-3 py-2.5 text-base sm:text-sm border border-border bg-surface-bg focus:outline-none focus:border-accent transition-colors rounded-xl resize-none leading-relaxed"
                      style={{ maxHeight: 160 }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!messageInput.trim() || sendMessage.isPending}
                      className="px-4 py-2.5 bg-surface-inverse text-txt-inverse border border-surface-inverse hover:bg-surface-inverse/90 disabled:opacity-40 transition-colors hover:opacity-90 active:scale-[0.97] rounded-xl shrink-0"
                    >
                      {sendMessage.isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </PageContainer>

      {/* 프로필 상세 모달 — partnerId는 auth user_id이므로 byUserId=true */}
      {profileModalId && (
        <ProfileDetailModal
          profileId={profileModalId}
          byUserId
          onClose={() => setProfileModalId(null)}
        />
      )}
    </div>
  )
}

export default function MessagesPageClient() {
  // useSearchParams는 Suspense boundary가 필요 (Next 15 requirement)
  return (
    <Suspense fallback={<div className="min-h-full bg-surface-bg" />}>
      <MessagesPageInner />
    </Suspense>
  )
}
