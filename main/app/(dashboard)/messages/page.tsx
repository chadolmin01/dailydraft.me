'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Send,
  Loader2,
  Mail,
  MailOpen,
  Trash2,
  ArrowLeft,
  Search,
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
} from '@/src/hooks/useMessages'
import type { Conversation, ConversationPartner } from '@/src/hooks/useMessages'

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

export default function MessagesPage() {
  const { user } = useAuth()
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileShowThread, setMobileShowThread] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: convData, isLoading: convsLoading } = useConversations()
  const { data: threadData } = useMessageThread(selectedPartner)
  const sendMessage = useSendMessage()
  const markRead = useMarkRead()
  const deleteMessage = useDeleteMessage()

  const conversations = convData?.conversations || []
  const profiles = { ...convData?.profiles, ...threadData?.profiles } as Record<string, ConversationPartner>
  const messages = threadData?.messages || []

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
  }, [messages.length])

  // 읽음 처리 — ref로 이미 처리한 ID 추적하여 무한 루프 방지
  const markedIdsRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (selectedPartner && messages.length > 0) {
      const unread = messages.filter(m => m.receiver_id === user?.id && !m.is_read && !markedIdsRef.current.has(m.id))
      unread.forEach(m => {
        markedIdsRef.current.add(m.id)
        markRead.mutate(m.id)
      })
    }
  }, [selectedPartner, messages, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // 대화 상대 변경 시 추적 초기화
  useEffect(() => {
    markedIdsRef.current.clear()
  }, [selectedPartner])

  const handleSend = () => {
    if (!selectedPartner || !messageInput.trim()) return
    import('@/src/utils/haptic').then(h => h.hapticLight())
    sendMessage.mutate(
      { receiver_id: selectedPartner, content: messageInput.trim() },
      { onSuccess: () => setMessageInput('') }
    )
  }

  const selectPartner = (partnerId: string) => {
    setSelectedPartner(partnerId)
    setMobileShowThread(true)
  }

  const selectedProfile = selectedPartner ? profiles[selectedPartner] : null

  return (
    <div className="bg-surface-bg min-h-full">
      <PageContainer size="wide" className="py-6">
        <div className="flex gap-0 md:gap-4 h-[calc(100dvh-3.5rem-3rem-var(--bottom-tab-height))]">

          {/* 대화 목록 — 모바일에서는 스레드 열면 숨김 */}
          <div className={`w-full md:w-80 bg-surface-card rounded-xl border border-border shadow-md shrink-0 flex flex-col ${mobileShowThread ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-border">
              <h2 className="text-[10px] font-medium text-txt-tertiary mb-3 flex items-center gap-2">
                <Mail size={12} /> MESSAGES
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
                    {searchQuery ? '검색 결과가 없습니다' : '아직 쪽지가 없어요'}
                  </p>
                  <p className="text-xs text-txt-disabled">Explore에서 마음에 드는 사람에게 쪽지를 보내보세요</p>
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
                        className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
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
                            <span className="text-[10px] font-mono text-txt-disabled shrink-0 ml-2">
                              {timeAgo(conv.lastAt)}
                            </span>
                          </div>
                          <p className="text-xs text-txt-tertiary truncate mt-0.5">
                            {conv.lastMessage}
                          </p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-brand text-white shrink-0">
                            {conv.unreadCount}
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
          <div className={`flex-1 bg-surface-card rounded-xl border border-border shadow-md flex flex-col ${!mobileShowThread ? 'hidden md:flex' : 'flex'}`}>
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
                {/* 스레드 헤더 */}
                <div className="px-4 py-3 border-b border-border flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => { setMobileShowThread(false); setSelectedPartner(null) }}
                    className="md:hidden p-1 hover:bg-surface-sunken transition-colors"
                  >
                    <ArrowLeft size={18} className="text-txt-secondary" />
                  </button>
                  <div className="w-8 h-8 bg-surface-inverse rounded-full flex items-center justify-center text-xs font-bold text-txt-inverse shrink-0">
                    {cleanNickname(selectedProfile?.nickname || '').slice(0, 2) || '??'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-txt-primary truncate">
                      {cleanNickname(selectedProfile?.nickname || '') || 'Unknown'}
                    </p>
                    {selectedProfile?.desired_position && (
                      <p className="text-[10px] text-txt-disabled">
                        {selectedProfile.desired_position}
                      </p>
                    )}
                  </div>
                </div>

                {/* 메시지 목록 */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-xs text-txt-disabled font-mono">첫 쪽지를 보내보세요</p>
                    </div>
                  ) : (
                    messages.map(msg => {
                      const isMine = msg.sender_id === user?.id
                      return (
                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`group relative max-w-[75%] ${isMine ? 'order-2' : ''}`}>
                            <div className={`px-3.5 py-2.5 text-sm leading-relaxed rounded-xl ${
                              isMine
                                ? 'bg-surface-inverse text-txt-inverse border border-surface-inverse shadow-sm'
                                : 'bg-surface-sunken text-txt-primary border border-border'
                            }`}>
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            </div>
                            <div className={`flex items-center gap-2 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-[10px] font-mono text-txt-disabled">
                                {timeAgo(msg.created_at)}
                              </span>
                              {isMine && msg.is_read && (
                                <span className="text-[10px] font-mono text-brand">읽음</span>
                              )}
                              <button
                                onClick={() => deleteMessage.mutate(msg.id)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-txt-disabled hover:text-status-danger-text transition-all"
                                title="삭제"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* 입력 */}
                <div className="px-4 py-3 border-t border-border shrink-0">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={e => setMessageInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                      placeholder="쪽지를 입력하세요..."
                      maxLength={2000}
                      className="flex-1 px-3 py-2.5 text-base sm:text-sm border border-border bg-surface-bg focus:outline-none focus:border-accent transition-colors rounded-xl"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!messageInput.trim() || sendMessage.isPending}
                      className="px-4 py-2.5 bg-surface-inverse text-txt-inverse border border-surface-inverse hover:bg-surface-inverse/90 disabled:opacity-40 transition-colors hover:opacity-90 active:scale-[0.97] rounded-xl"
                    >
                      {sendMessage.isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                    </button>
                  </div>
                  {sendMessage.isError && (
                    <p className="text-xs text-status-danger-text mt-1">
                      {sendMessage.error?.message || '전송에 실패했습니다'}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
