'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Card } from './ui/Card'
import {
  MapPin,
  CheckSquare,
  Loader2,
  Edit3,
  Zap,
  Coffee,
  Clock,
  Check,
  X,
  Plus,
  Briefcase,
  Mail,
  Building2,
  Send,
  Target,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  MessageCircle,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ProfileEditPanel } from './ProfileEditPanel'
import { ConfirmModal } from './ui/ConfirmModal'
import { useAuth } from '@/src/context/AuthContext'
import { useProfile } from '@/src/hooks/useProfile'
import { useMyOpportunities, calculateDaysLeft } from '@/src/hooks/useOpportunities'
import { useProjectUpdates, useCreateProjectUpdate, type ProjectUpdate } from '@/src/hooks/useProjectUpdates'
import { useCoffeeChats, useAcceptCoffeeChat, useDeclineCoffeeChat, useUpdateChatOutcome, type CoffeeChatOutcome } from '@/src/hooks/useCoffeeChats'

const PERSONALITY_LABELS: Record<string, string> = {
  risk: '도전 성향',
  time: '시간 투자',
  communication: '소통 선호',
  decision: '실행 속도',
}

const WORK_STYLE_LABELS: Record<string, { label: string; low: string; high: string }> = {
  collaboration: { label: '협업 스타일', low: '독립형', high: '팀 소통형' },
  planning: { label: '작업 방식', low: '바로 실행', high: '기획 우선' },
  perfectionism: { label: '품질 기준', low: '속도 우선', high: '완벽주의' },
}

const UPDATE_TYPE_STYLES: Record<string, string> = {
  ideation: 'bg-status-warning-bg text-status-warning-text border border-status-warning-text/20',
  design: 'bg-status-info-bg text-status-info-text border border-status-info-text/20',
  development: 'bg-status-success-bg text-status-success-text border border-status-success-text/20',
  launch: 'bg-brand-bg text-brand border border-brand-border',
  general: 'bg-surface-sunken text-txt-tertiary border border-border',
}

const UPDATE_TYPE_LABELS: Record<string, string> = {
  ideation: '고민',
  design: '설계',
  development: '구현',
  launch: '런칭',
  general: '일반',
}

export const Profile: React.FC = () => {
  const [contactInput, setContactInput] = useState('')
  const [acceptingChatId, setAcceptingChatId] = useState<string | null>(null)
  const [declineTarget, setDeclineTarget] = useState<string | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const { user } = useAuth()
  const { data: profile, isLoading } = useProfile()

  const { data: myOpportunities = [] } = useMyOpportunities()
  const { data: chats = [], isLoading: chatsLoading } = useCoffeeChats({ asOwner: true })
  const { data: sentChats = [], isLoading: sentChatsLoading } = useCoffeeChats()
  const acceptChatMutation = useAcceptCoffeeChat()
  const declineChatMutation = useDeclineCoffeeChat()
  const updateOutcomeMutation = useUpdateChatOutcome()

  const outcomeConfig: Record<CoffeeChatOutcome, { label: string; style: string }> = {
    team_formed: { label: '팀 합류', style: 'bg-status-success-bg text-status-success-text' },
    pending: { label: '보류 중', style: 'bg-status-warning-bg text-status-warning-text' },
    no_match: { label: '불발', style: 'bg-surface-sunken text-txt-tertiary' },
  }

  const skills = profile?.skills as Array<{ name: string; level: string }> | null
  const profileAnalysis = profile?.profile_analysis as { founder_type?: string } | null
  const founderType = profileAnalysis?.founder_type

  const SITUATION_LABELS: Record<string, string> = {
    has_project: '프로젝트 진행 중',
    want_to_join: '팀 합류 희망',
    solo: '함께 시작할 팀원 탐색 중',
    exploring: '탐색 중',
  }

  const AFFILIATION_LABELS: Record<string, { tag: string; orgPrefix: string; separator: string }> = {
    student: { tag: '대학생', orgPrefix: '', separator: ' · ' },
    graduate: { tag: '졸업생', orgPrefix: '', separator: ' · ' },
    professional: { tag: '현직자', orgPrefix: '', separator: ' · ' },
    freelancer: { tag: '프리랜서', orgPrefix: '', separator: ' · ' },
    other: { tag: '', orgPrefix: '', separator: ' · ' },
  }

  const affType = profile?.affiliation_type || 'student'
  const affLabel = AFFILIATION_LABELS[affType] || AFFILIATION_LABELS.student


  const pendingChats = chats.filter(c => c.status === 'pending')
  const otherChats = chats.filter(c => c.status !== 'pending')

  const handleAcceptChat = async (chatId: string) => {
    if (!contactInput.trim()) return
    try {
      await acceptChatMutation.mutateAsync({ chatId, contactInfo: contactInput })
      setAcceptingChatId(null)
      setContactInput('')
      toast.success('커피챗을 수락했습니다')
    } catch {
      toast.error('수락에 실패했습니다')
    }
  }

  const handleDeclineChat = async () => {
    if (!declineTarget) return
    try {
      await declineChatMutation.mutateAsync(declineTarget)
      setDeclineTarget(null)
      toast.success('커피챗을 거절했습니다')
    } catch {
      toast.error('거절에 실패했습니다')
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-surface-bg">
        <Loader2 className="animate-spin text-txt-disabled" size={32} />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-surface-bg">
      <div className="max-w-container-wide mx-auto px-4 lg:px-8 py-8">

        {/* 3-Column Layout */}
        <div className="flex gap-8">

          {/* ========== 좌측 사이드바 ========== */}
          <aside className="hidden lg:block w-[13.75rem] flex-shrink-0">
            <div className="sticky top-8 space-y-6">

              {/* 프로필 미니 카드 */}
              <div className="bg-surface-card border border-border-strong p-5">
                <div className="flex flex-col items-center text-center">
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="relative w-16 h-16 border border-border-strong overflow-hidden mb-3 group cursor-pointer"
                    title="프로필 사진 변경"
                  >
                    {profile?.avatar_url ? (
                      <Image src={profile.avatar_url} alt="avatar" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-surface-sunken flex items-center justify-center text-lg font-bold text-txt-disabled">
                        {profile?.nickname?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Edit3 size={16} className="text-white" />
                    </div>
                  </button>
                  <h3 className="font-bold text-sm text-txt-primary">{profile?.nickname || 'User'}</h3>
                  <p className="text-xs text-txt-tertiary mt-0.5">{profile?.desired_position || '포지션 미설정'}</p>
                  {(profile?.university || affLabel.tag) && (
                    <p className="text-xs text-txt-disabled mt-1">
                      {affLabel.tag && affLabel.tag !== '' && <span>{affLabel.tag} </span>}
                      {profile?.university && <>{affLabel.tag ? '· ' : ''}{profile.university}</>}
                      {profile?.major ? ` · ${profile.major}` : ''}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setIsEditOpen(true)}
                  className="w-full mt-4 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border-strong hover:bg-black hover:text-white hover:border-border-strong transition-colors"
                >
                  <Edit3 size={12} /> 프로필 수정
                </button>
              </div>

              {/* 빠른 이동 */}
              <div className="bg-surface-card border border-border-strong p-5">
                <h3 className="text-[0.625rem] font-mono font-bold text-txt-disabled uppercase tracking-widest mb-3">바로가기</h3>
                <nav className="space-y-1">
                  {[
                    { label: '내 프로젝트', icon: Zap, count: myOpportunities.length },
                    { label: '받은 커피챗', icon: Coffee, count: pendingChats.length },
                    { label: '보낸 커피챗', icon: Send, count: sentChats.length },
                    { label: '기술 스택', icon: CheckSquare, count: skills?.length || 0 },
                  ].map((item) => (
                    <button
                      key={item.label}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm text-txt-secondary hover:bg-surface-sunken transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <item.icon size={14} />
                        {item.label}
                      </span>
                      {item.count > 0 && (
                        <span className="text-xs text-txt-disabled">{item.count}</span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

            </div>
          </aside>

          {/* ========== 메인 콘텐츠 ========== */}
          <main className="flex-1 min-w-0 space-y-8">

            {/* 프로필 오버뷰 */}
            <div className="bg-surface-card border border-border-strong overflow-hidden">
              {/* 커버 사진 */}
              <div className="relative w-full h-32 sm:h-40">
                {profile?.cover_image_url ? (
                  <Image src={profile.cover_image_url} alt="cover" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-surface-sunken to-border" />
                )}
              </div>

              <div className="px-5 pb-5">
                {/* 아바타 + 이름 영역 */}
                <div className="flex items-end gap-4 -mt-10 mb-4">
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="relative w-20 h-20 border border-surface-card overflow-hidden flex-shrink-0 bg-surface-sunken group cursor-pointer"
                    title="프로필 사진 변경"
                  >
                    {profile?.avatar_url ? (
                      <Image src={profile.avatar_url} alt="avatar" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-bold text-txt-disabled">
                        {profile?.nickname?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Edit3 size={18} className="text-white" />
                    </div>
                  </button>
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-txt-primary">{profile?.nickname || 'User'}</h2>
                      {profile?.current_situation && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-status-success-bg text-status-success-text text-xs font-medium border border-status-success-text/20">
                          <Target size={10} />
                          {SITUATION_LABELS[profile.current_situation] || profile.current_situation}
                        </span>
                      )}
                      {founderType && (
                        <span className="text-xs px-2 py-0.5 bg-surface-sunken text-txt-tertiary font-medium border border-border">
                          {founderType}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-txt-tertiary mt-0.5 truncate">
                      {(() => {
                        if (!profile?.vision_summary) return profile?.desired_position || '프로필을 완성해주세요'
                        try { return JSON.parse(profile.vision_summary).summary || profile.desired_position || '' } catch { return profile.vision_summary }
                      })()}
                    </p>
                  </div>
                  {/* 모바일 전용 수정 버튼 (데스크탑은 사이드바에 있음) */}
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-border-strong hover:bg-black hover:text-white hover:border-border-strong transition-colors flex-shrink-0"
                  >
                    <Edit3 size={12} /> 수정
                  </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-border-subtle">
                  <div className="flex items-center gap-2">
                    <Briefcase size={12} className="text-txt-disabled" />
                    <div>
                      <p className="text-xs text-txt-disabled">포지션</p>
                      <p className="text-xs font-medium text-txt-primary">{profile?.desired_position || '미설정'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 size={12} className="text-txt-disabled" />
                    <div>
                      <p className="text-xs text-txt-disabled">
                        {affType === 'professional' ? '회사' : affType === 'freelancer' ? '소속' : '소속'}
                        {affLabel.tag && <span className="ml-1 text-txt-disabled/60">({affLabel.tag})</span>}
                      </p>
                      <p className="text-xs font-medium text-txt-primary">
                        {profile?.university || '미설정'}
                        {profile?.major ? ` · ${profile.major}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-txt-disabled" />
                    <div>
                      <p className="text-xs text-txt-disabled">위치</p>
                      <p className="text-xs font-medium text-txt-primary">{profile?.location || '미설정'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={12} className="text-txt-disabled" />
                    <div>
                      <p className="text-xs text-txt-disabled">연락처</p>
                      <p className="text-xs font-medium text-txt-primary truncate">{profile?.contact_email || user?.email || '미설정'}</p>
                    </div>
                  </div>
                </div>

                {profile?.interest_tags && profile.interest_tags.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap mt-3">
                    {profile.interest_tags.map((tag, idx) => (
                      <span key={idx} className="text-xs bg-brand-bg border border-brand-border text-brand px-2 py-0.5 font-medium font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 내 프로젝트 */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-primary flex items-center gap-2">
                  <span className="w-2 h-2 bg-brand" />
                  <Zap size={12} /> 내 프로젝트
                </h3>
                <Link
                  href="/projects/new"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand text-white border border-brand shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  <Plus size={14} /> 새 프로젝트
                </Link>
              </div>

              {myOpportunities.length > 0 ? (
                <div className="space-y-4">
                  {myOpportunities.map((opp) => (
                    <ProjectCardWithUpdates key={opp.id} opp={opp} />
                  ))}
                </div>
              ) : (
                <Card className="text-center py-8" padding="p-6">
                  <Zap className="mx-auto mb-3 text-txt-disabled" size={32} />
                  <p className="text-txt-tertiary text-sm mb-3">아직 등록한 프로젝트가 없습니다</p>
                  <Link
                    href="/projects/new"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-brand text-white border border-brand shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    <Plus size={16} /> 프로젝트 만들기
                  </Link>
                </Card>
              )}
            </section>

            {/* 받은 커피챗 */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-primary flex items-center gap-2">
                  <span className="w-2 h-2 bg-status-warning-text" />
                  <Coffee size={12} /> 받은 커피챗
                  {pendingChats.length > 0 && (
                    <span className="text-xs bg-status-danger-accent text-txt-inverse px-1.5 py-0.5">{pendingChats.length}</span>
                  )}
                </h3>
              </div>

              {chatsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-txt-disabled" size={20} />
                </div>
              ) : chats.length > 0 ? (
                <div className="space-y-4">
                  {/* 대기 중 */}
                  {pendingChats.map((chat) => (
                    <Card key={chat.id} className="border-border bg-status-warning-bg/30" padding="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 bg-status-warning-bg flex items-center justify-center text-xs font-bold text-status-warning-text flex-shrink-0">
                            {(chat.requester_name || chat.requester_email || '?').slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm text-txt-primary">{chat.requester_name || chat.requester_email}</span>
                              <span className="text-xs bg-status-warning-bg text-status-warning-text px-1.5 py-0.5 font-mono font-bold border border-status-warning-text/20">대기중</span>
                            </div>
                            {chat.message && (
                              <p className="text-xs text-txt-tertiary line-clamp-2">{chat.message}</p>
                            )}
                            <p className="text-xs text-txt-disabled mt-1">
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
                              className="w-24 sm:w-32 px-2 py-1.5 text-xs border border-border-strong focus:outline-none focus:border-brand"
                            />
                            <button
                              onClick={() => handleAcceptChat(chat.id)}
                              className="p-2 bg-brand text-white hover:bg-brand-hover"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => { setAcceptingChatId(null); setContactInput('') }}
                              className="p-2 bg-surface-sunken text-txt-secondary hover:bg-border-strong"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => setAcceptingChatId(chat.id)}
                              className="px-3 py-1.5 text-xs font-semibold bg-brand text-white hover:bg-brand-hover"
                            >
                              수락
                            </button>
                            <button
                              onClick={() => setDeclineTarget(chat.id)}
                              className="px-3 py-1.5 text-xs font-semibold border border-border-strong text-txt-secondary hover:bg-black hover:text-white transition-colors"
                            >
                              거절
                            </button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}

                  {/* 처리 완료 */}
                  {otherChats.map((chat) => (
                    <Card key={chat.id} className="hover:border-border-strong" padding="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-surface-sunken border border-border flex items-center justify-center text-xs font-bold text-txt-tertiary flex-shrink-0">
                          {(chat.requester_name || chat.requester_email || '?').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-txt-primary">{chat.requester_name || chat.requester_email}</span>
                            <span className={`text-xs px-1.5 py-0.5 ${
                              chat.status === 'accepted' ? 'bg-status-success-bg text-status-success-text' : 'bg-surface-sunken text-txt-tertiary'
                            }`}>
                              {chat.status === 'accepted' ? '수락됨' : '거절됨'}
                            </span>
                            {chat.status === 'accepted' && chat.outcome && (
                              <span className={`text-xs px-1.5 py-0.5 ${outcomeConfig[chat.outcome].style}`}>
                                {outcomeConfig[chat.outcome].label}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-txt-disabled mt-0.5">
                            {new Date(chat.created_at).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                        {/* Outcome selector for accepted chats without outcome */}
                        {chat.status === 'accepted' && !chat.outcome && (
                          <div className="flex gap-1 flex-shrink-0">
                            {(Object.keys(outcomeConfig) as CoffeeChatOutcome[]).map((key) => (
                              <button
                                key={key}
                                onClick={() => updateOutcomeMutation.mutate({ chatId: chat.id, outcome: key })}
                                className={`px-2 py-1 text-[0.625rem] font-medium font-mono border border-border hover:border-border-strong transition-colors ${outcomeConfig[key].style}`}
                              >
                                {outcomeConfig[key].label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-8" padding="p-6">
                  <Coffee className="mx-auto mb-3 text-txt-disabled" size={32} />
                  <p className="text-txt-tertiary text-sm">아직 받은 커피챗이 없습니다</p>
                </Card>
              )}
            </section>

            {/* 보낸 커피챗 */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-primary flex items-center gap-2">
                  <span className="w-2 h-2 bg-surface-inverse" />
                  <Send size={12} /> 보낸 커피챗
                </h3>
              </div>

              {sentChatsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-txt-disabled" size={20} />
                </div>
              ) : sentChats.length > 0 ? (
                <div className="space-y-4">
                  {sentChats.map((chat) => (
                    <Card key={chat.id} className="hover:border-border-strong" padding="p-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          chat.status === 'pending' ? 'bg-status-warning-bg text-status-warning-text' :
                          chat.status === 'accepted' ? 'bg-status-success-bg text-status-success-text' :
                          'bg-surface-sunken text-txt-tertiary'
                        }`}>
                          <Coffee size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-txt-primary truncate">
                              {chat.message ? chat.message.slice(0, 40) + (chat.message.length > 40 ? '...' : '') : '커피챗 신청'}
                            </span>
                            <span className={`text-xs px-1.5 py-0.5 flex-shrink-0 ${
                              chat.status === 'pending' ? 'bg-status-warning-bg text-status-warning-text' :
                              chat.status === 'accepted' ? 'bg-status-success-bg text-status-success-text' :
                              'bg-surface-sunken text-txt-tertiary'
                            }`}>
                              {chat.status === 'pending' ? '대기중' : chat.status === 'accepted' ? '수락됨' : '거절됨'}
                            </span>
                          </div>
                          <p className="text-xs text-txt-disabled mt-0.5">
                            {new Date(chat.created_at).toLocaleDateString('ko-KR')}
                          </p>
                          {chat.status === 'accepted' && chat.contact_info && (
                            <p className="text-xs text-status-success-text mt-1 font-medium">
                              연락처: {chat.contact_info}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-8" padding="p-6">
                  <Send className="mx-auto mb-3 text-txt-disabled" size={32} />
                  <p className="text-txt-tertiary text-sm">아직 보낸 커피챗이 없습니다</p>
                </Card>
              )}
            </section>

            {/* 기술 스택 */}
            <section>
              <h3 className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-primary flex items-center gap-2 mb-6">
                <span className="w-2 h-2 bg-brand" />
                <CheckSquare size={12} /> 기술 스택
              </h3>
              {skills && skills.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-surface-card border border-border-strong p-5">
                    <h4 className="text-[0.625rem] font-mono font-bold text-txt-disabled uppercase tracking-widest mb-3">스킬</h4>
                    <div className="space-y-2">
                      {skills.map((skill, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-sm text-txt-secondary">
                            <CheckSquare size={14} className="text-brand" />
                            {skill.name}
                          </span>
                          <span className="text-xs text-txt-disabled uppercase">{skill.level}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Card className="text-center py-8" padding="p-6">
                  <CheckSquare className="mx-auto mb-3 text-txt-disabled" size={32} />
                  <p className="text-txt-tertiary text-sm">아직 스킬이 추가되지 않았습니다</p>
                </Card>
              )}
            </section>

            {/* AI 프로필 분석 */}
            <AiProfileSection visionSummary={profile?.vision_summary} personality={profile?.personality as Record<string, number> | null} />

          </main>

        </div>
      </div>

      <ProfileEditPanel isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} />

      <ConfirmModal
        isOpen={!!declineTarget}
        onClose={() => setDeclineTarget(null)}
        onConfirm={handleDeclineChat}
        title="커피챗 거절"
        message="이 커피챗 요청을 거절하시겠습니까?"
        confirmText="거절"
        variant="warning"
      />
    </div>
  )
}

// --- AI 프로필 분석 섹션 ---
interface AiVisionData {
  work_style?: { collaboration?: number; planning?: number; perfectionism?: number }
  availability?: { hours_per_week?: number | null; prefer_online?: boolean; semester_available?: boolean }
  team_preference?: { role?: string; preferred_size?: string | null; atmosphere?: string }
  goals?: string[]
  strengths?: string[]
  wants_from_team?: string[]
  project_interests?: string[]
  summary?: string
}

function AiProfileSection({ visionSummary, personality }: { visionSummary?: string | null; personality?: Record<string, number> | null }) {
  let visionData: AiVisionData | null = null
  if (visionSummary) {
    try { visionData = JSON.parse(visionSummary) } catch { /* plain text, no structured data */ }
  }

  const hasPersonality = personality && Object.values(personality).some(v => typeof v === 'number' && v > 0)
  if (!hasPersonality && !visionData) return null

  return (
    <section>
      <h3 className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-primary flex items-center gap-2 mb-6">
        <span className="w-2 h-2 bg-brand" />
        <Sparkles size={12} /> AI 프로필 분석
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 성향 점수 */}
        {hasPersonality && (
          <div className="bg-surface-card border border-border-strong p-5">
            <h4 className="text-[0.625rem] font-mono font-bold text-txt-disabled uppercase tracking-widest mb-3">성향</h4>
            <div className="space-y-2.5">
              {Object.entries(personality!)
                .filter(([, v]) => typeof v === 'number')
                .map(([key, value]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-txt-secondary">{PERSONALITY_LABELS[key] || key}</span>
                    <span className="text-xs font-mono text-txt-disabled">{value}/10</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-sunken border border-border overflow-hidden">
                    <div className="h-full bg-brand transition-all" style={{ width: `${(value / 10) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 작업 스타일 */}
        {visionData?.work_style && (
          <div className="bg-surface-card border border-border-strong p-5">
            <h4 className="text-[0.625rem] font-mono font-bold text-txt-disabled uppercase tracking-widest mb-3">작업 스타일</h4>
            <div className="space-y-2.5">
              {Object.entries(visionData.work_style)
                .filter(([, v]) => typeof v === 'number')
                .map(([key, value]) => {
                const meta = WORK_STYLE_LABELS[key]
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-txt-secondary">{meta?.label || key}</span>
                      <span className="text-xs font-mono text-txt-disabled">{value}/10</span>
                    </div>
                    <div className="relative w-full h-1.5 bg-surface-sunken border border-border overflow-hidden">
                      <div className="h-full bg-brand transition-all" style={{ width: `${((value as number) / 10) * 100}%` }} />
                    </div>
                    {meta && (
                      <div className="flex justify-between mt-0.5">
                        <span className="text-[9px] text-txt-disabled font-mono">{meta.low}</span>
                        <span className="text-[9px] text-txt-disabled font-mono">{meta.high}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 팀 선호 */}
        {visionData?.team_preference && (
          <div className="bg-surface-card border border-border-strong p-5">
            <h4 className="text-[0.625rem] font-mono font-bold text-txt-disabled uppercase tracking-widest mb-3">팀 선호</h4>
            <div className="space-y-2">
              {visionData.team_preference.role && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-txt-secondary">역할</span>
                  <span className="text-xs font-medium text-txt-primary px-2 py-0.5 bg-surface-sunken border border-border">{visionData.team_preference.role}</span>
                </div>
              )}
              {visionData.team_preference.preferred_size && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-txt-secondary">선호 인원</span>
                  <span className="text-xs font-medium text-txt-primary px-2 py-0.5 bg-surface-sunken border border-border">{visionData.team_preference.preferred_size}</span>
                </div>
              )}
              {visionData.team_preference.atmosphere && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-txt-secondary">분위기</span>
                  <span className="text-xs font-medium text-txt-primary px-2 py-0.5 bg-surface-sunken border border-border">{visionData.team_preference.atmosphere}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 가용성 */}
        {visionData?.availability && (
          <div className="bg-surface-card border border-border-strong p-5">
            <h4 className="text-[0.625rem] font-mono font-bold text-txt-disabled uppercase tracking-widest mb-3">가용성</h4>
            <div className="space-y-2">
              {visionData.availability.hours_per_week != null && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-txt-secondary">주당 시간</span>
                  <span className="text-xs font-medium text-txt-primary">{visionData.availability.hours_per_week}시간</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-txt-secondary">비대면 선호</span>
                <span className="text-xs font-medium text-txt-primary">{visionData.availability.prefer_online ? '예' : '아니오'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-txt-secondary">학기 중 가능</span>
                <span className="text-xs font-medium text-txt-primary">{visionData.availability.semester_available ? '예' : '아니오'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 태그 기반 데이터 */}
      {(visionData?.goals?.length || visionData?.strengths?.length || visionData?.wants_from_team?.length || visionData?.project_interests?.length) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {[
            { label: '목표', data: visionData?.goals, color: 'bg-brand-bg text-brand border-brand-border' },
            { label: '강점', data: visionData?.strengths, color: 'bg-status-success-bg text-status-success-text border-status-success-text/20' },
            { label: '팀원에게 기대하는 것', data: visionData?.wants_from_team, color: 'bg-status-warning-bg text-status-warning-text border-status-warning-text/20' },
            { label: '관심 프로젝트', data: visionData?.project_interests, color: 'bg-status-info-bg text-status-info-text border-status-info-text/20' },
          ].filter(item => item.data && item.data.length > 0).map(item => (
            <div key={item.label} className="bg-surface-card border border-border-strong p-5">
              <h4 className="text-[0.625rem] font-mono font-bold text-txt-disabled uppercase tracking-widest mb-2.5">{item.label}</h4>
              <div className="flex flex-wrap gap-1.5">
                {item.data!.map((tag, i) => (
                  <span key={i} className={`text-xs font-medium px-2 py-0.5 border ${item.color}`}>{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// --- 프로젝트 카드 + 인라인 업데이트 ---
const INLINE_UPDATE_TYPES: { value: ProjectUpdate['update_type']; label: string }[] = [
  { value: 'general', label: '일반' },
  { value: 'ideation', label: '고민' },
  { value: 'design', label: '설계' },
  { value: 'development', label: '구현' },
  { value: 'launch', label: '런칭' },
]

// 원탭 퀵 업데이트
const QUICK_UPDATES: { title: string; type: ProjectUpdate['update_type'] }[] = [
  { title: '이번 주도 진행 중', type: 'general' },
  { title: '개발 진행 중', type: 'development' },
  { title: '디자인 작업 중', type: 'design' },
]

// 유형별 템플릿
const TYPE_TEMPLATES: Record<string, string[]> = {
  general: ['팀 미팅 완료', '일정 조율 중', '피드백 반영 완료'],
  ideation: ['아이디어 구체화 중', '시장 조사 진행', '사용자 인터뷰 완료'],
  design: ['UI 디자인 완료', '프로토타입 제작 중', '디자인 피드백 반영'],
  development: ['MVP 개발 중', '핵심 기능 구현 완료', 'API 연동 완료'],
  launch: ['베타 출시 준비 중', '배포 완료', '사용자 테스트 진행 중'],
}

interface ProjectCardProps {
  opp: { id: string; title: string; description: string | null; status: string | null; created_at: string | null; applications_count?: number | null; interest_count?: number | null }
}

function ProjectCardWithUpdates({ opp }: ProjectCardProps) {
  const { data: updates = [] } = useProjectUpdates(opp.id)
  const createUpdate = useCreateProjectUpdate()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isWriting, setIsWriting] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [updateType, setUpdateType] = useState<ProjectUpdate['update_type']>('general')

  const daysLeft = calculateDaysLeft(opp.created_at)
  const currentWeek = opp.created_at
    ? Math.max(1, Math.ceil((Date.now() - new Date(opp.created_at).getTime()) / (7 * 24 * 60 * 60 * 1000)))
    : 1

  // 활동 상태 계산
  const latestUpdate = updates.length > 0 ? updates[updates.length - 1] : null
  const daysSinceUpdate = latestUpdate?.created_at
    ? Math.floor((Date.now() - new Date(latestUpdate.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : null

  const activityStatus = !latestUpdate
    ? { label: '업데이트 없음', style: 'text-txt-disabled', dot: 'bg-border' }
    : daysSinceUpdate !== null && daysSinceUpdate <= 7
      ? { label: `${daysSinceUpdate}일 전 업데이트`, style: 'text-status-success-text', dot: 'bg-status-success-text' }
      : daysSinceUpdate !== null && daysSinceUpdate <= 14
        ? { label: `${daysSinceUpdate}일 전`, style: 'text-status-warning-text', dot: 'bg-status-warning-text' }
        : { label: `${daysSinceUpdate}일 전`, style: 'text-status-danger-text', dot: 'bg-status-danger-accent' }

  const handleSubmit = async () => {
    if (!title.trim()) return
    try {
      await createUpdate.mutateAsync({
        opportunity_id: opp.id,
        week_number: currentWeek,
        title: title.trim(),
        content: content.trim(),
        update_type: updateType,
      })
      setTitle('')
      setContent('')
      setUpdateType('general')
      setIsWriting(false)
    } catch { /* handled by React Query */ }
  }

  const handleQuickUpdate = async (quickTitle: string, quickType: ProjectUpdate['update_type']) => {
    try {
      await createUpdate.mutateAsync({
        opportunity_id: opp.id,
        week_number: currentWeek,
        title: quickTitle,
        content: '',
        update_type: quickType,
      })
    } catch { /* handled by React Query */ }
  }

  return (
    <Card className="hover:border-border-strong" padding="p-0">
      {/* 상단: 프로젝트 정보 */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-surface-sunken border border-border-strong flex items-center justify-center text-txt-secondary flex-shrink-0">
            <Zap size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-sm text-txt-primary truncate">{opp.title}</h4>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`flex items-center gap-1 text-[0.625rem] font-medium ${activityStatus.style}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${activityStatus.dot}`} />
                  {activityStatus.label}
                </span>
                <span className={`text-xs px-1.5 py-0.5 ${
                  opp.status === 'active' ? 'bg-status-success-bg text-status-success-text' : 'bg-surface-sunken text-txt-tertiary'
                }`}>
                  {opp.status === 'active' ? '모집중' : opp.status}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-txt-disabled">
              <span>Week {currentWeek}</span>
              <span>{opp.applications_count || 0}명 지원</span>
              <span>{opp.interest_count || 0} 관심</span>
              {daysLeft > 0 && (
                <span className="flex items-center gap-1">
                  <Clock size={10} /> D-{daysLeft}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========== 채팅 영역 ========== */}
      <div className="border-t border-border-subtle bg-surface-sunken/40 flex flex-col" style={{ minHeight: '12rem' }}>

        {/* 메시지 피드 — 고정 높이, 메시지가 아래에서 위로 쌓임 */}
        <div className="flex-1 flex flex-col justify-end overflow-y-auto px-4 pt-2 pb-2" style={{ maxHeight: isExpanded ? '24rem' : '12rem' }}>
          {updates.length > 0 ? (
            <>
              {/* 더보기 (맨 위) */}
              {updates.length > 2 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex-shrink-0 w-full flex items-center justify-center gap-1 py-1.5 mb-1 text-[0.6875rem] text-txt-tertiary hover:text-txt-secondary transition-colors"
                >
                  {isExpanded
                    ? <><ChevronDown size={12} /> 접기</>
                    : <><ChevronUp size={12} /> 이전 업데이트 {updates.length - 2}개 더보기</>
                  }
                </button>
              )}

              {/* 버블 — 시간순, 아래 정렬 */}
              <div className="space-y-2">
                {(isExpanded ? updates : updates.slice(-2)).map((update) => (
                  <div key={update.id} className="flex justify-end">
                    <div className="max-w-[85%]">
                      <div className="bg-brand/[0.07] border border-brand/15 rounded-2xl rounded-br-sm px-3.5 py-2.5">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[0.5625rem] font-semibold font-mono px-1.5 py-px rounded-full ${UPDATE_TYPE_STYLES[update.update_type]}`}>
                            {UPDATE_TYPE_LABELS[update.update_type]}
                          </span>
                          <span className="text-[0.5625rem] text-txt-disabled">W{update.week_number}</span>
                        </div>
                        <p className="text-[0.8125rem] leading-snug font-medium text-txt-primary">{update.title}</p>
                        {update.content && (
                          <p className="text-xs text-txt-tertiary mt-1 leading-relaxed">{update.content}</p>
                        )}
                      </div>
                      {update.created_at && (
                        <p className="text-[0.5625rem] text-txt-disabled mt-0.5 text-right pr-1">
                          {new Date(update.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* 빈 상태 — 중앙 정렬 */
            <div className="flex-1 flex flex-col items-center justify-center gap-1.5">
              <MessageCircle size={20} className="text-txt-disabled" />
              <p className="text-xs text-txt-disabled">이 프로젝트의 첫 소식을 전해보세요</p>
            </div>
          )}
        </div>

        {/* ========== 채팅 입력 바 ========== */}
        <div className="px-3 pb-3 pt-1">
          {/* 퀵 리플라이 칩 */}
          {!isWriting && (
            <div className="flex items-center gap-1.5 mb-2 overflow-x-auto scrollbar-hide">
              {QUICK_UPDATES.map((q) => (
                <button
                  key={q.title}
                  onClick={() => handleQuickUpdate(q.title, q.type)}
                  disabled={createUpdate.isPending}
                  className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-txt-secondary bg-surface-card border border-border rounded-full hover:border-border-strong hover:bg-white transition-colors disabled:opacity-40"
                >
                  {createUpdate.isPending ? <Loader2 size={10} className="animate-spin inline mr-1" /> : null}
                  {q.title}
                </button>
              ))}
            </div>
          )}

          {!isWriting ? (
            /* 입력 바 (닫힌 상태) */
            <div
              onClick={() => setIsWriting(true)}
              className="flex items-center gap-2 bg-surface-card border border-border rounded-2xl px-4 py-2.5 cursor-text hover:border-border-strong transition-colors"
            >
              <span className="flex-1 text-sm text-txt-disabled">업데이트 작성...</span>
              <div className="w-7 h-7 rounded-full bg-surface-sunken flex items-center justify-center">
                <ArrowUp size={14} className="text-txt-disabled" />
              </div>
            </div>
          ) : (
            /* 입력 바 (열린 상태) */
            <div className="bg-surface-card border border-brand/40 rounded-2xl overflow-hidden">
              {/* 유형 + 템플릿 */}
              <div className="px-3 pt-2.5 pb-1.5 flex items-center gap-1 border-b border-border-subtle">
                {INLINE_UPDATE_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => {
                      setUpdateType(t.value)
                      if (!title.trim()) setTitle(TYPE_TEMPLATES[t.value]?.[0] || '')
                    }}
                    className={`px-2 py-0.5 text-[0.625rem] font-medium font-mono rounded-full transition-colors ${
                      updateType === t.value
                        ? UPDATE_TYPE_STYLES[t.value]
                        : 'text-txt-disabled hover:text-txt-secondary'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
                <span className="ml-auto text-[0.5625rem] text-txt-disabled">W{currentWeek}</span>
              </div>

              {/* 템플릿 칩 (제목 비어있을 때만) */}
              {!title.trim() && (
                <div className="flex items-center gap-1.5 px-3 pt-2 pb-1 overflow-x-auto scrollbar-hide">
                  {(TYPE_TEMPLATES[updateType] || []).map((tpl) => (
                    <button
                      key={tpl}
                      onClick={() => setTitle(tpl)}
                      className="flex-shrink-0 px-2.5 py-1 text-[0.6875rem] text-txt-tertiary bg-surface-sunken border border-border rounded-full hover:border-border-strong hover:text-txt-secondary transition-colors"
                    >
                      {tpl}
                    </button>
                  ))}
                </div>
              )}

              {/* 제목 입력 */}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="이번 주에 무엇을 했나요?"
                maxLength={100}
                className="w-full px-4 pt-2 pb-0.5 text-sm font-medium text-txt-primary bg-transparent focus:outline-none placeholder:text-txt-disabled"
                autoFocus
              />

              {/* 내용 + 액션 바 */}
              <div className="flex items-end gap-2 px-3 pb-2.5 pt-0.5">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="자세한 내용 (선택)"
                  rows={1}
                  maxLength={2000}
                  className="flex-1 px-1 py-1.5 text-xs text-txt-secondary bg-transparent focus:outline-none resize-none placeholder:text-txt-disabled"
                />
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => { setIsWriting(false); setTitle(''); setContent(''); setUpdateType('general') }}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-txt-tertiary hover:bg-surface-sunken transition-colors"
                  >
                    <X size={14} />
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!title.trim() || createUpdate.isPending}
                    className="w-7 h-7 rounded-full flex items-center justify-center bg-brand text-white hover:bg-brand-hover disabled:opacity-30 transition-colors"
                  >
                    {createUpdate.isPending ? <Loader2 size={14} className="animate-spin" /> : <ArrowUp size={14} />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
