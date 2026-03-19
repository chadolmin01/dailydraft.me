'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2,
  Coffee,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { useCoffeeChats, useAcceptCoffeeChat, useDeclineCoffeeChat } from '@/src/hooks/useCoffeeChats'

export function ProfileCoffeeChats() {
  const router = useRouter()
  const [contactInput, setContactInput] = useState('')
  const [acceptingChatId, setAcceptingChatId] = useState<string | null>(null)
  const [chatError, setChatError] = useState<string | null>(null)

  const { data: chats = [], isLoading: chatsLoading } = useCoffeeChats({ asOwner: true })
  const acceptChatMutation = useAcceptCoffeeChat()
  const declineChatMutation = useDeclineCoffeeChat()

  const pendingChats = chats.filter(c => c.status === 'pending')
  const otherChats = chats.filter(c => c.status !== 'pending')

  const handleAcceptChat = async (chatId: string) => {
    if (!contactInput.trim()) return
    setChatError(null)
    try {
      await acceptChatMutation.mutateAsync({ chatId, contactInfo: contactInput })
      setAcceptingChatId(null)
      setContactInput('')
    } catch {
      setChatError('커피챗 수락에 실패했습니다. 다시 시도해주세요.')
    }
  }

  const handleDeclineChat = async (chatId: string) => {
    setChatError(null)
    try {
      await declineChatMutation.mutateAsync(chatId)
    } catch {
      setChatError('커피챗 거절에 실패했습니다. 다시 시도해주세요.')
    }
  }

  return (
    <section className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest flex items-center gap-2">
          <span className="w-5 h-5 bg-indicator-premium text-white flex items-center justify-center text-[0.5rem] font-bold">C</span>
          RECEIVED COFFEE CHATS
          {pendingChats.length > 0 && (
            <span className="text-[0.625rem] font-mono font-bold bg-indicator-alert text-white px-1.5 py-0.5">{pendingChats.length} PENDING</span>
          )}
        </h3>
      </div>

      {chatError && (
        <div className="mb-3 px-3 py-2 bg-status-danger-text/5 border border-status-danger-text/20 text-xs text-status-danger-text font-mono flex items-center gap-2">
          <AlertTriangle size={14} />
          {chatError}
        </div>
      )}

      {chatsLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-txt-tertiary" size={20} />
        </div>
      ) : chats.length > 0 ? (
        <div className="space-y-3">
          {pendingChats.map((chat, chatIdx) => (
            <div key={chat.id} className="relative bg-surface-card border border-border-strong p-4 border-l-4 border-l-amber-500 shadow-sharp">
              <div className="absolute top-1 right-1 w-2 h-2 border-r border-t border-black/20" />
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex gap-3 flex-1 min-w-0">
                  <div className="relative">
                    <span className="absolute -top-2 -left-2 text-[0.5rem] font-mono text-txt-tertiary">{String(chatIdx + 1).padStart(2, '0')}</span>
                    <div className="w-9 h-9 bg-indicator-premium/10 border border-indicator-premium-border/30 flex items-center justify-center text-xs font-bold text-indicator-premium-border flex-shrink-0">
                      {(chat.requester_name || chat.requester_email || '?').slice(0, 2)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-txt-primary">{chat.requester_name || chat.requester_email}</span>
                      {!chat.opportunity_id && (
                        <span className="text-[0.625rem] font-mono font-bold bg-brand-bg text-brand px-1.5 py-0.5 border border-brand-border">개인</span>
                      )}
                      <span className="text-[0.625rem] font-mono font-bold bg-indicator-premium/10 text-indicator-premium-border px-1.5 py-0.5 border border-indicator-premium-border/20">PENDING</span>
                    </div>
                    {chat.message && (
                      <p className="text-xs text-txt-tertiary line-clamp-2 border-l border-dashed border-border pl-2">{chat.message}</p>
                    )}
                    <p className="text-[0.625rem] font-mono text-txt-tertiary mt-1">
                      {new Date(chat.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>

                {acceptingChatId === chat.id ? (
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <input
                      type="text"
                      value={contactInput}
                      onChange={(e) => setContactInput(e.target.value)}
                      placeholder="연락처 입력"
                      className="w-24 sm:w-32 px-2 py-1.5 text-xs font-mono border border-border-strong focus:outline-none focus:border-brand"
                    />
                    <button
                      onClick={() => handleAcceptChat(chat.id)}
                      className="p-2 bg-indicator-online text-white border border-indicator-online hover:bg-indicator-online/90"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => { setAcceptingChatId(null); setContactInput('') }}
                      className="p-2 bg-surface-sunken text-txt-secondary border border-border-strong hover:bg-border"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setAcceptingChatId(chat.id)}
                      className="px-3 py-1.5 text-xs font-bold bg-indicator-online text-white border border-indicator-online hover:bg-indicator-online/90 shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                    >
                      수락
                    </button>
                    <button
                      onClick={() => handleDeclineChat(chat.id)}
                      className="px-3 py-1.5 text-xs font-bold border border-border-strong text-txt-secondary hover:bg-surface-sunken shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                    >
                      거절
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {otherChats.map((chat) => (
            <div key={chat.id} className="bg-surface-card border border-border-strong p-4 hover:shadow-sharp transition-all">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-surface-sunken border border-border flex items-center justify-center text-xs font-bold text-txt-tertiary flex-shrink-0">
                  {(chat.requester_name || chat.requester_email || '?').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-txt-primary">{chat.requester_name || chat.requester_email}</span>
                    <span className={`text-[0.625rem] font-mono font-bold px-1.5 py-0.5 border ${
                      chat.status === 'accepted' ? 'bg-status-success-bg text-indicator-online border-indicator-online/20' : 'bg-surface-sunken text-txt-tertiary border-border'
                    }`}>
                      {chat.status === 'accepted' ? 'ACCEPTED' : 'DECLINED'}
                    </span>
                  </div>
                  <p className="text-[0.625rem] font-mono text-txt-tertiary mt-0.5">
                    {new Date(chat.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Coffee}
          title="아직 받은 커피챗이 없습니다"
          description="프로필을 완성하면 더 많은 커피챗을 받을 수 있어요"
          actionLabel="프로필 완성하기"
          onAction={() => router.push('/profile/edit')}
        />
      )}
    </section>
  )
}
