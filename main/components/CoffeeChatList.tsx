'use client'

import React, { useState } from 'react'
import { Coffee, Check, X, Clock, MessageSquare, Mail, Loader2, User } from 'lucide-react'
import { useCoffeeChats, useAcceptCoffeeChat, useDeclineCoffeeChat, type CoffeeChat } from '@/src/hooks/useCoffeeChats'
import { EmptyState } from './ui/EmptyState'

interface CoffeeChatListProps {
  asOwner?: boolean
  opportunityId?: string
}

export const CoffeeChatList: React.FC<CoffeeChatListProps> = ({
  asOwner = true,
  opportunityId,
}) => {
  const { data: chats = [], isLoading: loading } = useCoffeeChats({
    opportunityId,
    asOwner,
  })
  const acceptChat = useAcceptCoffeeChat()
  const declineChat = useDeclineCoffeeChat()

  const pendingChats = chats.filter((c) => c.status === 'pending')
  const resolvedChats = chats.filter((c) => c.status !== 'pending')

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    )
  }

  if (chats.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          icon={Coffee}
          title="아직 커피챗 신청이 없습니다"
          description="프로젝트에 관심 있는 사람들이 커피챗을 보낼 수 있어요"
          size="compact"
        />
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {/* Pending Section */}
      {pendingChats.length > 0 && (
        <div>
          <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-100">
            <h4 className="text-xs font-bold text-yellow-700 flex items-center gap-2">
              <Clock size={14} />
              대기 중 ({pendingChats.length})
            </h4>
          </div>
          {pendingChats.map((chat) => (
            <CoffeeChatItem
              key={chat.id}
              chat={chat}
              onAccept={(chatId, contactInfo) => acceptChat.mutateAsync({ chatId, contactInfo })}
              onDecline={(chatId) => declineChat.mutateAsync(chatId)}
            />
          ))}
        </div>
      )}

      {/* Resolved Section */}
      {resolvedChats.length > 0 && (
        <div>
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
            <h4 className="text-xs font-bold text-gray-500">
              처리됨 ({resolvedChats.length})
            </h4>
          </div>
          {resolvedChats.map((chat) => (
            <CoffeeChatItem key={chat.id} chat={chat} resolved />
          ))}
        </div>
      )}
    </div>
  )
}

interface CoffeeChatItemProps {
  chat: CoffeeChat
  resolved?: boolean
  onAccept?: (chatId: string, contactInfo: string) => Promise<boolean>
  onDecline?: (chatId: string) => Promise<boolean>
}

const CoffeeChatItem: React.FC<CoffeeChatItemProps> = ({
  chat,
  resolved = false,
  onAccept,
  onDecline,
}) => {
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [contactInfo, setContactInfo] = useState('')
  const [processing, setProcessing] = useState(false)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleAccept = async () => {
    if (!contactInfo.trim() || !onAccept) return
    setProcessing(true)
    try {
      await onAccept(chat.id, contactInfo.trim())
      setShowAcceptModal(false)
    } catch { /* handled by mutation */ }
    setProcessing(false)
  }

  const handleDecline = async () => {
    if (!onDecline) return
    setProcessing(true)
    try {
      await onDecline(chat.id)
    } catch { /* handled by mutation */ }
    setProcessing(false)
  }

  return (
    <>
      <div className={`p-4 ${resolved ? 'opacity-60' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <User size={16} className="text-gray-500" />
            </div>
            <div>
              <div className="font-bold text-sm text-gray-900">
                {chat.requester_name || '익명'}
              </div>
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <Mail size={10} />
                {chat.requester_email}
              </div>
            </div>
          </div>

          {/* Status Badge */}
          {chat.status === 'accepted' && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
              수락됨
            </span>
          )}
          {chat.status === 'declined' && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-bold rounded-full">
              거절됨
            </span>
          )}
        </div>

        {/* Message */}
        {chat.message && (
          <div className="bg-gray-50 p-3 rounded-sm mb-3 text-sm text-gray-600">
            <MessageSquare size={12} className="inline mr-1.5 text-gray-400" />
            {chat.message}
          </div>
        )}

        {/* Contact Info (if accepted) */}
        {chat.status === 'accepted' && chat.contact_info && (
          <div className="bg-green-50 p-3 rounded-sm mb-3 text-sm text-green-700 border border-green-100">
            <strong>연락처:</strong> {chat.contact_info}
          </div>
        )}

        {/* Date */}
        <div className="text-xs text-gray-400 mb-3">{formatDate(chat.created_at)}</div>

        {/* Actions (only for pending) */}
        {!resolved && chat.status === 'pending' && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowAcceptModal(true)}
              disabled={processing}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-500 text-white rounded-sm hover:bg-green-600 text-sm font-medium disabled:bg-gray-300"
            >
              <Check size={14} />
              수락
            </button>
            <button
              onClick={handleDecline}
              disabled={processing}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-sm hover:bg-gray-50 text-sm font-medium disabled:bg-gray-100"
            >
              {processing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <X size={14} />
                  거절
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Accept Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm shadow-xl w-full max-w-sm">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">커피챗 수락</h3>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">
                수락하면 입력한 연락처가 <strong>{chat.requester_name}</strong>님에게 공개됩니다.
              </p>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  공개할 연락처 (전화번호, 카카오톡 ID 등)
                </label>
                <input
                  type="text"
                  placeholder="010-1234-5678 또는 카카오톡 ID"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowAcceptModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-sm hover:bg-gray-50 text-sm"
                >
                  취소
                </button>
                <button
                  onClick={handleAccept}
                  disabled={processing || !contactInfo.trim()}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-sm hover:bg-green-600 text-sm disabled:bg-gray-300 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Check size={16} />
                      수락하기
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
