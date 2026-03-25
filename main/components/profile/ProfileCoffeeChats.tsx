'use client'

import { useState } from 'react'
import {
  Loader2,
  Coffee,
  Send,
  AlertTriangle,
  Mail,
  Phone,
  MessageCircle,
  FileText,
  User,
  Users,
  Clock,
  XCircle,
  ArrowRight,
} from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { useCoffeeChats, useAcceptCoffeeChat, useDeclineCoffeeChat, useUpdateChatOutcome } from '@/src/hooks/useCoffeeChats'
import type { CoffeeChat, ParsedInvitation, CoffeeChatOutcome } from '@/src/hooks/useCoffeeChats'
import { CoffeeChatAcceptModal } from '@/components/coffee-chat/CoffeeChatAcceptModal'
import type { InvitationData } from '@/components/coffee-chat/CoffeeChatAcceptModal'
import { ProfileDetailModal } from '@/components/ProfileDetailModal'

type Tab = 'received' | 'sent'

function parseInvitation(raw: string | null): ParsedInvitation | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as ParsedInvitation
  } catch {
    return { message: raw, requirements: '' }
  }
}

function formatContactInfo(data: InvitationData): string {
  return [
    data.contactEmail && `이메일: ${data.contactEmail}`,
    data.contactPhone && `전화: ${data.contactPhone}`,
    data.contactKakao && `카카오: ${data.contactKakao}`,
  ].filter(Boolean).join(' / ')
}

const OUTCOME_OPTIONS: { value: CoffeeChatOutcome; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'team_formed', label: '팀 합류', icon: Users, color: 'bg-status-success-bg text-indicator-online border-indicator-online/30' },
  { value: 'pending', label: '진행 중', icon: Clock, color: 'bg-indicator-premium/10 text-indicator-premium-border border-indicator-premium-border/30' },
  { value: 'no_match', label: '불발', icon: XCircle, color: 'bg-surface-sunken text-txt-tertiary border-border' },
]

export function ProfileCoffeeChats() {
  const [chatError, setChatError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('received')
  const [acceptModalChat, setAcceptModalChat] = useState<CoffeeChat | null>(null)
  const [viewingProfileUserId, setViewingProfileUserId] = useState<string | null>(null)

  const { data: chats = [], isLoading: chatsLoading } = useCoffeeChats({ asOwner: true })
  const { data: sentChats = [], isLoading: sentLoading } = useCoffeeChats({ asOwner: false })
  const acceptChatMutation = useAcceptCoffeeChat()
  const declineChatMutation = useDeclineCoffeeChat()
  const updateOutcomeMutation = useUpdateChatOutcome()

  const pendingChats = chats.filter(c => c.status === 'pending')
  const otherChats = chats.filter(c => c.status !== 'pending')

  const handleAcceptSubmit = async (data: InvitationData) => {
    if (!acceptModalChat) return
    setChatError(null)
    try {
      const contactInfo = formatContactInfo(data)
      const invitationMessage = JSON.stringify({
        message: data.message,
        requirements: data.requirements,
      })
      await acceptChatMutation.mutateAsync({
        chatId: acceptModalChat.id,
        contactInfo,
        invitationMessage,
      })
      setAcceptModalChat(null)
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
      <div className="flex items-center gap-1 mb-4">
        <button
          onClick={() => setTab('received')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[0.625rem] font-mono font-bold uppercase tracking-widest border transition-colors ${
            tab === 'received'
              ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
              : 'bg-surface-card text-txt-tertiary border-border hover:border-border-strong'
          }`}
        >
          <Coffee size={12} />
          받은 커피챗
          {pendingChats.length > 0 && (
            <span className="bg-indicator-alert text-white px-1 py-0.5 text-[0.5rem] leading-none">{pendingChats.length}</span>
          )}
        </button>
        <button
          onClick={() => setTab('sent')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[0.625rem] font-mono font-bold uppercase tracking-widest border transition-colors ${
            tab === 'sent'
              ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
              : 'bg-surface-card text-txt-tertiary border-border hover:border-border-strong'
          }`}
        >
          <Send size={12} />
          보낸 커피챗
          {sentChats.length > 0 && (
            <span className="bg-txt-tertiary text-white px-1 py-0.5 text-[0.5rem] leading-none">{sentChats.length}</span>
          )}
        </button>
      </div>

      {chatError && (
        <div className="mb-3 px-3 py-2 bg-status-danger-text/5 border border-status-danger-text/20 text-xs text-status-danger-text font-mono flex items-center gap-2">
          <AlertTriangle size={14} />
          {chatError}
        </div>
      )}

      {/* ── 받은 커피챗 ── */}
      {tab === 'received' && (
        <>
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
                        <button
                          type="button"
                          onClick={() => chat.requester_user_id && setViewingProfileUserId(chat.requester_user_id)}
                          disabled={!chat.requester_user_id}
                          className={`w-9 h-9 bg-indicator-premium/10 border border-indicator-premium-border/30 flex items-center justify-center text-xs font-bold text-indicator-premium-border flex-shrink-0 ${
                            chat.requester_user_id ? 'cursor-pointer hover:ring-2 hover:ring-brand/40 transition-all' : ''
                          }`}
                          title={chat.requester_user_id ? '프로필 보기' : ''}
                        >
                          {(chat.requester_name || chat.requester_email || '?').slice(0, 2)}
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {chat.requester_user_id ? (
                            <button
                              type="button"
                              onClick={() => setViewingProfileUserId(chat.requester_user_id!)}
                              className="font-bold text-sm text-txt-primary hover:text-brand transition-colors flex items-center gap-1"
                            >
                              {chat.requester_name || chat.requester_email}
                              <User size={12} className="text-txt-disabled" />
                            </button>
                          ) : (
                            <span className="font-bold text-sm text-txt-primary">{chat.requester_name || chat.requester_email}</span>
                          )}
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

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setAcceptModalChat(chat)}
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
                  </div>
                </div>
              ))}

              {otherChats.map((chat) => (
                <div key={chat.id} className="bg-surface-card border border-border-strong overflow-hidden hover:shadow-sharp transition-all">
                  <div className="flex items-center gap-3 p-4">
                    <button
                      type="button"
                      onClick={() => chat.requester_user_id && setViewingProfileUserId(chat.requester_user_id)}
                      disabled={!chat.requester_user_id}
                      className={`w-9 h-9 bg-surface-sunken border border-border flex items-center justify-center text-xs font-bold text-txt-tertiary flex-shrink-0 ${
                        chat.requester_user_id ? 'cursor-pointer hover:ring-2 hover:ring-brand/40 transition-all' : ''
                      }`}
                      title={chat.requester_user_id ? '프로필 보기' : ''}
                    >
                      {(chat.requester_name || chat.requester_email || '?').slice(0, 2)}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {chat.requester_user_id ? (
                          <button
                            type="button"
                            onClick={() => setViewingProfileUserId(chat.requester_user_id!)}
                            className="font-medium text-sm text-txt-primary hover:text-brand transition-colors flex items-center gap-1"
                          >
                            {chat.requester_name || chat.requester_email}
                            <User size={12} className="text-txt-disabled" />
                          </button>
                        ) : (
                          <span className="font-medium text-sm text-txt-primary">{chat.requester_name || chat.requester_email}</span>
                        )}
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

                  {/* Outcome tracking + Next steps (accepted chats only) */}
                  {chat.status === 'accepted' && (
                    <div className="border-t border-border px-4 py-3 bg-surface-sunken/30">
                      <p className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-2">결과 추적</p>
                      <div className="flex flex-wrap gap-1.5">
                        {OUTCOME_OPTIONS.map((opt) => {
                          const Icon = opt.icon
                          const isActive = chat.outcome === opt.value
                          return (
                            <button
                              key={opt.value}
                              onClick={() => updateOutcomeMutation.mutate({ chatId: chat.id, outcome: opt.value })}
                              disabled={updateOutcomeMutation.isPending}
                              className={`flex items-center gap-1 px-2.5 py-1 text-[0.625rem] font-bold border transition-all ${
                                isActive ? opt.color : 'bg-surface-card text-txt-disabled border-border hover:border-border-strong'
                              }`}
                            >
                              <Icon size={10} />
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>
                      {chat.outcome === 'team_formed' && chat.opportunity_id && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-indicator-online">
                          <ArrowRight size={12} />
                          <a href={`/projects`} className="hover:underline font-medium">프로젝트에서 팀 관리하기</a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Coffee}
              title="아직 받은 커피챗이 없습니다"
              description="프로젝트에 관심을 표현하면 커피챗 요청이 올 수 있어요"
            />
          )}
        </>
      )}

      {/* ── 보낸 커피챗 ── */}
      {tab === 'sent' && (
        <>
          {sentLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-txt-tertiary" size={20} />
            </div>
          ) : sentChats.length > 0 ? (
            <div className="space-y-3">
              {sentChats.map((chat) => (
                <SentChatCard key={chat.id} chat={chat} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Send}
              title="아직 보낸 커피챗이 없습니다"
              description="관심 있는 프로젝트에 커피챗을 보내보세요"
            />
          )}
        </>
      )}

      {/* Accept Modal */}
      {acceptModalChat && (
        <CoffeeChatAcceptModal
          isOpen={!!acceptModalChat}
          onClose={() => setAcceptModalChat(null)}
          onSubmit={handleAcceptSubmit}
          isLoading={acceptChatMutation.isPending}
          requesterName={acceptModalChat.requester_name || acceptModalChat.requester_email || '알 수 없음'}
          isPersonMode={!acceptModalChat.opportunity_id}
        />
      )}

      {/* Profile Detail Modal */}
      <ProfileDetailModal
        profileId={viewingProfileUserId}
        byUserId
        onClose={() => setViewingProfileUserId(null)}
      />
    </section>
  )
}

/** Sent coffee chat card — shows invitation letter when accepted + outcome */
function SentChatCard({ chat }: { chat: CoffeeChat }) {
  const outcomeInfo = chat.outcome ? OUTCOME_OPTIONS.find(o => o.value === chat.outcome) : null
  const invitation = parseInvitation(chat.invitation_message)
  const isAccepted = chat.status === 'accepted'

  // Parse structured contact info (format: "이메일: x / 카카오: y / 전화: z")
  const contactParts = chat.contact_info?.split(' / ').map(part => {
    const [label, ...rest] = part.split(': ')
    return { label: label.trim(), value: rest.join(': ').trim() }
  }) || []

  return (
    <div className="bg-surface-card border border-border-strong overflow-hidden hover:shadow-sharp transition-all">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div className={`w-9 h-9 border flex items-center justify-center text-xs font-bold flex-shrink-0 ${
          isAccepted ? 'bg-status-success-bg border-indicator-online/30 text-indicator-online' :
          chat.status === 'declined' ? 'bg-surface-sunken border-border text-txt-tertiary' :
          'bg-indicator-premium/10 border-indicator-premium-border/30 text-indicator-premium-border'
        }`}>
          <Send size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-medium text-sm text-txt-primary">
              {chat.opportunity_id ? '프로젝트 커피챗' : '개인 커피챗'}
            </span>
            <span className={`text-[0.625rem] font-mono font-bold px-1.5 py-0.5 border ${
              chat.status === 'pending' ? 'bg-indicator-premium/10 text-indicator-premium-border border-indicator-premium-border/20' :
              isAccepted ? 'bg-status-success-bg text-indicator-online border-indicator-online/20' :
              'bg-surface-sunken text-txt-tertiary border-border'
            }`}>
              {chat.status === 'pending' ? 'PENDING' : isAccepted ? 'ACCEPTED' : 'DECLINED'}
            </span>
            {outcomeInfo && (
              <span className={`text-[0.625rem] font-mono font-bold px-1.5 py-0.5 border ${outcomeInfo.color}`}>
                {outcomeInfo.label}
              </span>
            )}
          </div>
          {chat.message && (
            <p className="text-xs text-txt-tertiary line-clamp-1 border-l border-dashed border-border pl-2 mb-0.5">{chat.message}</p>
          )}
          <p className="text-[0.625rem] font-mono text-txt-tertiary mt-0.5">
            {new Date(chat.created_at).toLocaleDateString('ko-KR')}
          </p>
        </div>
      </div>

      {/* Invitation Letter (shown when accepted) */}
      {isAccepted && (
        <div className="border-t border-border">
          {/* Invitation message */}
          {invitation?.message && (
            <div className="px-4 py-3 bg-status-success-bg/30">
              <p className="text-[0.625rem] font-mono font-bold text-indicator-online uppercase tracking-widest mb-1.5">
                초대편지
              </p>
              <p className="text-sm text-txt-primary whitespace-pre-wrap leading-relaxed">
                {invitation.message}
              </p>
            </div>
          )}

          {/* Contact info */}
          {contactParts.length > 0 && (
            <div className="px-4 py-3 border-t border-border/50">
              <p className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-2">
                연락처
              </p>
              <div className="space-y-1.5">
                {contactParts.map((part, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {part.label === '이메일' && <Mail size={12} className="text-txt-tertiary shrink-0" />}
                    {part.label === '전화' && <Phone size={12} className="text-txt-tertiary shrink-0" />}
                    {part.label === '카카오' && <MessageCircle size={12} className="text-txt-tertiary shrink-0" />}
                    <span className="text-txt-primary font-mono text-xs">{part.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legacy: plain contact_info without structured format */}
          {!contactParts.length && chat.contact_info && (
            <div className="px-4 py-3 border-t border-border/50">
              <p className="text-xs text-indicator-online font-mono">연락처: {chat.contact_info}</p>
            </div>
          )}

          {/* Requirements */}
          {invitation?.requirements && (
            <div className="px-4 py-3 border-t border-border/50 bg-surface-sunken/50">
              <div className="flex items-center gap-1.5 mb-1.5">
                <FileText size={12} className="text-txt-tertiary" />
                <p className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest">
                  요청사항
                </p>
              </div>
              <p className="text-sm text-txt-secondary whitespace-pre-wrap">
                {invitation.requirements}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
