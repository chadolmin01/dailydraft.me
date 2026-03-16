'use client'

import React, { useState, useEffect, useRef } from 'react'
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

  // 읽음 처리
  useEffect(() => {
    if (selectedPartner && messages.length > 0) {
      const unread = messages.filter(m => m.receiver_id === user?.id && !m.is_read)
      unread.forEach(m => markRead.mutate(m.id))
    }
  }, [selectedPartner, messages, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = () => {
    if (!selectedPartner || !messageInput.trim()) return
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
        <div className="flex gap-0 md:gap-4 h-[calc(100vh-120px)]">

          {/* 대화 목록 — 모바일에서는 스레드 열면 숨김 */}
          <div className={`w-full md:w-80 bg-surface-card border border-border-strong shadow-sharp shrink-0 flex flex-col ${mobileShowThread ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-dashed border-border">
              <h2 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3 flex items-center gap-2">
                <Mail size={12} /> MESSAGES
              </h2>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-disabled" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="이름으로 검색..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-border bg-surface-bg focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {convsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={20} className="animate-spin text-txt-disabled" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <MailOpen size={24} className="text-txt-disabled mb-2" />
                  <p className="text-sm text-txt-tertiary">
                    {searchQuery ? '검색 결과가 없습니다' : '쪽지가 없습니다'}
                  </p>
                  <p className="text-xs text-txt-disabled mt-1">프로필에서 쪽지를 보내보세요</p>
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
                            ? 'bg-[#4F46E5]/5 border border-[#4F46E5]/20'
                            : 'hover:bg-surface-sunken border border-transparent'
                        }`}
                      >
                        <div className="w-10 h-10 bg-surface-inverse flex items-center justify-center text-xs font-bold text-txt-inverse shrink-0">
                          {partner?.nickname?.slice(0, 2) || '??'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-txt-primary truncate">
                              {partner?.nickname || 'Unknown'}
                            </span>
                            <span className="text-[0.625rem] font-mono text-txt-disabled shrink-0 ml-2">
                              {timeAgo(conv.lastAt)}
                            </span>
                          </div>
                          <p className="text-xs text-txt-tertiary truncate mt-0.5">
                            {conv.lastMessage}
                          </p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 text-[0.625rem] font-bold bg-[#4F46E5] text-white shrink-0">
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
          <div className={`flex-1 bg-surface-card border border-border-strong shadow-sharp flex flex-col ${!mobileShowThread ? 'hidden md:flex' : 'flex'}`}>
            {!selectedPartner ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <Mail size={32} className="text-txt-disabled mb-3" />
                <p className="text-sm font-medium text-txt-tertiary">대화를 선택하세요</p>
                <p className="text-xs text-txt-disabled mt-1">왼쪽 목록에서 대화 상대를 선택하거나, 프로필에서 쪽지를 보내보세요</p>
              </div>
            ) : (
              <>
                {/* 스레드 헤더 */}
                <div className="px-4 py-3 border-b border-dashed border-border flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => { setMobileShowThread(false); setSelectedPartner(null) }}
                    className="md:hidden p-1 hover:bg-surface-sunken transition-colors"
                  >
                    <ArrowLeft size={18} className="text-txt-secondary" />
                  </button>
                  <div className="w-8 h-8 bg-surface-inverse flex items-center justify-center text-xs font-bold text-txt-inverse shrink-0">
                    {selectedProfile?.nickname?.slice(0, 2) || '??'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-txt-primary truncate">
                      {selectedProfile?.nickname || 'Unknown'}
                    </p>
                    {selectedProfile?.desired_position && (
                      <p className="text-[0.625rem] font-mono text-txt-disabled uppercase">
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
                            <div className={`px-3.5 py-2.5 text-sm leading-relaxed ${
                              isMine
                                ? 'bg-surface-inverse text-txt-inverse border border-black shadow-solid-sm'
                                : 'bg-surface-sunken text-txt-primary border border-border-strong'
                            }`}>
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            </div>
                            <div className={`flex items-center gap-2 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-[0.5625rem] font-mono text-txt-disabled">
                                {timeAgo(msg.created_at)}
                              </span>
                              {isMine && msg.is_read && (
                                <span className="text-[0.5625rem] font-mono text-[#4F46E5]">읽음</span>
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
                <div className="px-4 py-3 border-t border-dashed border-border shrink-0">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={e => setMessageInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                      placeholder="쪽지를 입력하세요..."
                      maxLength={2000}
                      className="flex-1 px-3 py-2.5 text-sm border border-border bg-surface-bg focus:outline-none focus:border-accent transition-colors"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!messageInput.trim() || sendMessage.isPending}
                      className="px-4 py-2.5 bg-surface-inverse text-txt-inverse border border-black hover:bg-black/80 disabled:opacity-40 transition-colors shadow-solid-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]"
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
