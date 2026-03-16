'use client'

import React, { useState } from 'react'
import {
  MapPin,
  CheckSquare,
  FileText,
  Loader2,
  Edit3,
  Rocket,
  Coffee,
  Clock,
  Check,
  X,
  Plus,
  User,
  Briefcase,
  Mail,
  Building2,
  FolderOpen,
  Code2,
  AlertTriangle,
  Eye,
} from 'lucide-react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/ui/DashboardLayout'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProfileEditPanel } from '@/components/ProfileEditPanel'
import { useAuth } from '@/src/context/AuthContext'
import { useProfile } from '@/src/hooks/useProfile'
import { useMyOpportunities, calculateDaysLeft } from '@/src/hooks/useOpportunities'
import { useCoffeeChats, useAcceptCoffeeChat, useDeclineCoffeeChat } from '@/src/hooks/useCoffeeChats'

export default function ProfilePage() {
  const [contactInput, setContactInput] = useState('')
  const [acceptingChatId, setAcceptingChatId] = useState<string | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const { user } = useAuth()
  const { data: profile, isLoading } = useProfile()
  const { data: myOpportunities = [] } = useMyOpportunities()
  const { data: chats = [], isLoading: chatsLoading } = useCoffeeChats({ asOwner: true })
  const acceptChatMutation = useAcceptCoffeeChat()
  const declineChatMutation = useDeclineCoffeeChat()

  const skills = profile?.skills as Array<{ name: string; level: string }> | null
  const pendingChats = chats.filter(c => c.status === 'pending')
  const otherChats = chats.filter(c => c.status !== 'pending')

  const [chatError, setChatError] = useState<string | null>(null)

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

  if (isLoading) {
    return (
      <div className="bg-surface-bg min-h-full">
        <DashboardLayout size="wide"
          sidebar={
            <div className="space-y-4 animate-pulse">
              <div className="bg-surface-card border border-border-strong p-4 shadow-sharp">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-surface-sunken border border-border mb-3" />
                  <div className="h-4 bg-surface-sunken w-20 mb-2" />
                  <div className="h-3 bg-border-subtle w-24" />
                </div>
                <div className="h-9 bg-surface-sunken mt-4" />
              </div>
              <div className="bg-surface-card border border-border-strong p-4 shadow-sharp">
                <div className="h-3 bg-surface-sunken w-16 mb-3" />
                <div className="space-y-2">
                  {[1,2,3,4].map(i => <div key={i} className="h-8 bg-surface-sunken" />)}
                </div>
              </div>
            </div>
          }
          aside={
            <div className="space-y-4 animate-pulse">
              <div className="bg-surface-card border border-border-strong p-4 shadow-sharp">
                <div className="h-3 bg-surface-sunken w-20 mb-3" />
                <div className="h-10 bg-surface-sunken" />
              </div>
              <div className="bg-surface-card border border-border-strong p-4 shadow-sharp">
                <div className="h-3 bg-surface-sunken w-20 mb-3" />
                <div className="h-2 bg-surface-sunken border border-border mb-3" />
                <div className="space-y-2">
                  {[1,2,3,4,5].map(i => <div key={i} className="h-4 bg-surface-sunken" />)}
                </div>
              </div>
            </div>
          }
        >
          {/* Cover skeleton */}
          <div className="h-36 md:h-48 bg-surface-sunken border border-border-strong mb-0 animate-pulse" />

          {/* Avatar + Name skeleton */}
          <div className="flex items-end gap-4 px-4 -mt-10 relative z-10 mb-6 animate-pulse">
            <div className="w-24 h-24 bg-surface-card border border-border-strong shadow-sharp">
              <div className="w-full h-full bg-surface-sunken" />
            </div>
            <div className="pb-2 space-y-2">
              <div className="h-5 bg-surface-sunken w-28" />
              <div className="h-3 bg-border-subtle w-20" />
            </div>
          </div>

          {/* Info card skeleton */}
          <div className="bg-surface-card border border-border-strong p-4 mb-6 shadow-sharp animate-pulse">
            <div className="h-4 bg-surface-sunken w-3/4 mb-3" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-dashed border-border">
              {[1,2,3,4].map(i => (
                <div key={i} className="space-y-1">
                  <div className="h-3 bg-border-subtle w-10" />
                  <div className="h-3 bg-surface-sunken w-16" />
                </div>
              ))}
            </div>
          </div>

          {/* Projects skeleton */}
          <div className="mb-6 animate-pulse">
            <div className="h-5 bg-surface-sunken w-24 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1,2].map(i => (
                <div key={i} className="bg-surface-card border border-border-strong h-[21.25rem] shadow-sharp">
                  <div className="h-36 bg-surface-sunken" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-surface-sunken w-3/4" />
                    <div className="h-3 bg-border-subtle w-full" />
                    <div className="h-3 bg-border-subtle w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DashboardLayout>
      </div>
    )
  }

  return (
    <div className="bg-surface-bg min-h-full">
      <DashboardLayout
        size="wide"
        sidebar={
          <div className="space-y-4">
            {/* 프로필 미니 카드 — 블루프린트 */}
            <div className="relative bg-surface-card border border-border-strong p-4 shadow-sharp">
              <div className="absolute top-1 left-1 w-2 h-2 border-l border-t border-black/20" />
              <div className="absolute top-1 right-1 w-2 h-2 border-r border-t border-black/20" />
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-[#4F46E5]/10 border border-[#4F46E5]/30 flex items-center justify-center text-lg font-bold text-[#4F46E5] mb-3 shadow-[2px_2px_0px_0px_rgba(79,70,229,0.2)]">
                  {profile?.nickname?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || 'U'}
                </div>
                <h3 className="font-bold text-sm text-txt-primary">{profile?.nickname || 'User'}</h3>
                <p className="text-[0.625rem] font-mono text-txt-tertiary mt-0.5 uppercase tracking-wide">{profile?.desired_position || '포지션 미설정'}</p>
                {profile?.university && (
                  <p className="text-[0.625rem] font-mono text-txt-disabled mt-1">{profile.university}</p>
                )}
                {typeof profile?.profile_views === 'number' && profile.profile_views > 0 && (
                  <p className="flex items-center gap-1 text-[0.625rem] font-mono text-txt-disabled mt-2">
                    <Eye size={10} /> {profile.profile_views} views
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsEditOpen(true)}
                className="w-full mt-4 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold border border-border-strong hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
              >
                <Edit3 size={12} /> 프로필 수정
              </button>
            </div>

            {/* 바로가기 — 인덱스 네비 */}
            <div className="relative bg-surface-card border border-border-strong p-4 shadow-sharp">
              <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-4 h-4 bg-[#4F46E5] text-white flex items-center justify-center text-[0.5rem] font-bold">N</span>
                NAVIGATION
              </h3>
              <nav className="space-y-0.5">
                {[
                  { label: '내 프로젝트', icon: Rocket, count: myOpportunities.length, color: 'bg-[#4F46E5]' },
                  { label: '받은 커피챗', icon: Coffee, count: pendingChats.length, color: 'bg-amber-500' },
                  { label: '기술 스택', icon: CheckSquare, count: skills?.length || 0, color: 'bg-emerald-600' },
                  { label: '첨부파일', icon: FileText, count: 0, color: 'bg-border-strong' },
                ].map((item, idx) => (
                  <button
                    key={item.label}
                    className="w-full flex items-center justify-between px-2.5 py-2 text-sm text-txt-secondary hover:bg-surface-sunken hover:border-border border border-transparent transition-all"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-[0.625rem] font-mono text-txt-disabled">{String(idx + 1).padStart(2, '0')}</span>
                      <item.icon size={13} />
                      {item.label}
                    </span>
                    {item.count > 0 && (
                      <span className={`text-[0.625rem] font-mono font-bold px-1.5 py-0.5 text-white ${item.color}`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        }
        aside={
          <div className="space-y-4">
            {/* 받은 커피챗 미리보기 — 블루프린트 */}
            <div className="relative bg-surface-card border border-border-strong p-4 shadow-sharp">
              <div className="absolute top-1 left-1 w-2 h-2 border-l border-t border-black/20" />
              <div className="absolute top-1 right-1 w-2 h-2 border-r border-t border-black/20" />
              <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-4 h-4 bg-amber-500 text-white flex items-center justify-center text-[0.5rem] font-bold">C</span>
                COFFEE CHAT
                {pendingChats.length > 0 && (
                  <span className="text-[0.625rem] font-mono font-bold bg-red-600 text-white px-1.5 py-0.5">{pendingChats.length}</span>
                )}
              </h3>
              {chatsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="animate-spin text-txt-tertiary" size={16} />
                </div>
              ) : pendingChats.length > 0 ? (
                <div className="space-y-1">
                  {pendingChats.slice(0, 3).map((chat, idx) => (
                    <div key={chat.id} className="flex items-center gap-3 py-2 border-b border-dashed border-border last:border-0">
                      <span className="text-[0.625rem] font-mono text-txt-disabled">{String(idx + 1).padStart(2, '0')}</span>
                      <div className="w-7 h-7 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[0.625rem] font-bold text-amber-600 shrink-0">
                        {(chat.requester_name || chat.requester_email || '?').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-txt-primary truncate">{chat.requester_name || chat.requester_email}</p>
                        <p className="text-[0.625rem] font-mono text-txt-disabled">{new Date(chat.created_at).toLocaleDateString('ko-KR')}</p>
                      </div>
                      <span className="text-[0.625rem] font-mono font-bold bg-amber-500/10 text-amber-600 px-1.5 py-0.5 border border-amber-500/20">WAIT</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[0.625rem] font-mono text-txt-disabled text-center py-3 border border-dashed border-border">NO PENDING REQUESTS</p>
              )}
            </div>

            {/* 프로필 완성도 — 블루프린트 */}
            <div className="relative bg-surface-card border border-border-strong p-4 shadow-sharp">
              <div className="absolute bottom-1 left-1 w-2 h-2 border-l border-b border-black/20" />
              <div className="absolute bottom-1 right-1 w-2 h-2 border-r border-b border-black/20" />
              <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-4 h-4 bg-emerald-600 text-white flex items-center justify-center text-[0.5rem] font-bold">%</span>
                COMPLETION
              </h3>
              {(() => {
                const fields = [
                  { label: '닉네임', done: !!profile?.nickname },
                  { label: '포지션', done: !!profile?.desired_position },
                  { label: '대학교', done: !!profile?.university },
                  { label: '한 줄 소개', done: !!profile?.vision_summary },
                  { label: '기술 스택', done: !!(skills && skills.length > 0) },
                ]
                const completedCount = fields.filter(f => f.done).length
                const percentage = Math.round((completedCount / fields.length) * 100)
                return (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-mono font-bold text-txt-primary">{percentage}%</span>
                      <span className="text-[0.625rem] font-mono text-txt-disabled">{completedCount}/{fields.length} FIELDS</span>
                    </div>
                    <div className="w-full h-2 bg-surface-sunken border border-border overflow-hidden mb-3">
                      <div className="h-full bg-emerald-600 transition-all" style={{ width: `${percentage}%` }} />
                    </div>
                    <div className="space-y-1">
                      {fields.map((f, idx) => (
                        <div key={f.label} className="flex items-center gap-2 text-xs py-0.5">
                          <span className="text-[0.625rem] font-mono text-txt-disabled w-4">{String(idx + 1).padStart(2, '0')}</span>
                          {f.done ? (
                            <span className="w-3.5 h-3.5 bg-emerald-600 text-white flex items-center justify-center"><Check size={10} /></span>
                          ) : (
                            <span className="w-3.5 h-3.5 border border-border-strong" />
                          )}
                          <span className={f.done ? 'text-txt-disabled line-through font-mono text-[0.625rem]' : 'text-txt-secondary font-mono text-[0.625rem]'}>{f.label}</span>
                        </div>
                      ))}
                    </div>
                    {percentage < 100 && (
                      <button
                        onClick={() => setIsEditOpen(true)}
                        className="w-full mt-3 px-3 py-2 text-xs font-bold bg-[#4F46E5] text-white border-2 border-[#4F46E5] hover:bg-[#4338CA] transition-colors shadow-[2px_2px_0px_0px_rgba(79,70,229,0.3)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                      >
                        프로필 완성하기
                      </button>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        }
      >
        {/* Cover Photo — 블루프린트 */}
        <div className="relative h-36 md:h-48 bg-surface-sunken border border-border-strong overflow-hidden mb-0"
          style={{ backgroundImage: 'linear-gradient(rgba(79,70,229,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(79,70,229,0.04) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        >
          <div className="absolute top-2 left-2 w-3 h-3 border-l border-t border-[#4F46E5]/30" />
          <div className="absolute top-2 right-2 w-3 h-3 border-r border-t border-[#4F46E5]/30" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-l border-b border-[#4F46E5]/30" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-r border-b border-[#4F46E5]/30" />
          <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[0.5rem] font-mono text-[#4F46E5]/30 uppercase tracking-[0.3em]">COVER · PHOTO · AREA</div>
          <button className="absolute bottom-3 right-3 px-3 py-1.5 bg-surface-card text-txt-secondary text-xs font-bold border border-border-strong hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
            커버 사진 추가
          </button>
        </div>

        {/* Avatar + Name + Actions — 블루프린트 */}
        <div className="flex items-end justify-between px-4 -mt-10 relative z-10 mb-6">
          <div className="flex items-end gap-4">
            <div className="w-24 h-24 bg-surface-card border border-border-strong shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] flex items-center justify-center">
              <div className="w-20 h-20 bg-[#4F46E5]/10 border border-[#4F46E5]/20 flex items-center justify-center text-xl font-bold text-[#4F46E5]">
                {profile?.nickname?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || <User size={24} />}
              </div>
            </div>
            <div className="pb-2">
              <h1 className="text-lg font-bold text-txt-primary font-mono">{profile?.nickname || 'User'}</h1>
              <p className="text-[0.625rem] font-mono text-txt-tertiary uppercase tracking-wide">{profile?.desired_position || '포지션 미설정'}</p>
            </div>
          </div>
          <div className="flex gap-2 pb-2">
            <button
              onClick={() => setIsEditOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-4 py-2 text-xs font-bold border border-border-strong hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              <Edit3 size={14} /> 프로필 수정
            </button>
            <button
              onClick={() => setIsEditOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-border-strong hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              <Edit3 size={12} /> 수정
            </button>
          </div>
        </div>

        {/* 프로필 정보 카드 — 블루프린트 */}
        <div className="relative bg-surface-card border border-border-strong p-4 mb-6 shadow-sharp">
          <div className="absolute top-1 left-1 w-2 h-2 border-l border-t border-black/20" />
          <div className="absolute top-1 right-1 w-2 h-2 border-r border-t border-black/20" />
          <div className="flex-1 min-w-0">
            {profile?.vision_summary && (
              <p className="text-sm text-txt-secondary mb-3 border-l border-[#4F46E5]/30 pl-3 italic">{profile.vision_summary}</p>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-dashed border-border">
              {[
                { icon: Briefcase, label: 'POSITION', value: profile?.desired_position || '미설정' },
                { icon: Building2, label: 'AFFILIATION', value: profile?.university || '미설정' },
                { icon: MapPin, label: 'LOCATION', value: profile?.location || '미설정' },
                { icon: Mail, label: 'CONTACT', value: profile?.contact_email || user?.email || '미설정' },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2">
                  <item.icon size={12} className="text-[#4F46E5]/60 mt-0.5" />
                  <div>
                    <p className="text-[0.5rem] font-mono text-txt-disabled uppercase tracking-widest">{item.label}</p>
                    <p className="text-xs font-medium text-txt-primary truncate">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {profile?.interest_tags && profile.interest_tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-3 pt-3 border-t border-dashed border-border">
                <span className="text-[0.5rem] font-mono text-txt-disabled uppercase tracking-widest self-center mr-1">TAGS</span>
                {profile.interest_tags.map((tag, idx) => (
                  <span key={idx} className="text-[0.625rem] font-mono bg-[#4F46E5]/5 text-[#4F46E5] border border-[#4F46E5]/20 px-2 py-0.5 font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 내 프로젝트 — 블루프린트 */}
        <section className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest flex items-center gap-2">
              <span className="w-5 h-5 bg-[#4F46E5] text-white flex items-center justify-center text-[0.5rem] font-bold">P</span>
              MY PROJECTS
              <span className="text-[0.625rem] font-mono text-txt-disabled">({myOpportunities.length})</span>
            </h3>
            <Link
              href="/projects/new"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#4F46E5] text-white border-2 border-[#4F46E5] hover:bg-[#4338CA] transition-colors shadow-[2px_2px_0px_0px_rgba(79,70,229,0.3)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              <Plus size={14} /> 새 프로젝트
            </Link>
          </div>

          {myOpportunities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myOpportunities.map((opp, oppIdx) => {
                const daysLeft = calculateDaysLeft(opp.created_at)
                const isUrgent = daysLeft > 0 && daysLeft <= 3
                return (
                  <div key={opp.id} className="relative bg-surface-card border border-border-strong overflow-hidden group hover:shadow-brutal transition-all cursor-pointer h-[21.25rem] flex flex-col shadow-sharp">
                    <div className="absolute top-1 left-1 w-2 h-2 border-l border-t border-black/20 z-20" />
                    <div className="absolute top-1 right-1 w-2 h-2 border-r border-t border-black/20 z-20" />
                    {/* 커버 */}
                    <div className="relative h-36 shrink-0 bg-surface-inverse flex items-end p-4">
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="text-[0.625rem] font-mono font-bold text-white/50">#{String(oppIdx + 1).padStart(2, '0')}</span>
                        {isUrgent ? (
                          <span className="text-[0.625rem] font-mono font-bold bg-red-600 text-white px-2 py-0.5">D-{daysLeft} URGENT</span>
                        ) : (
                          <span className="text-[0.625rem] font-mono font-bold bg-emerald-600 text-white px-2 py-0.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse" />
                            {opp.status === 'active' ? '모집중' : opp.status}
                          </span>
                        )}
                      </div>
                      <div className="absolute top-3 right-3 flex gap-1.5">
                        {(opp.interest_tags || []).slice(0, 2).map(tag => (
                          <span key={tag} className="text-[0.625rem] font-mono bg-white/10 text-white px-2 py-0.5 border border-white/20">{tag}</span>
                        ))}
                      </div>
                      <div className="w-10 h-10 bg-surface-card border border-border-strong flex items-center justify-center shadow-solid-sm">
                        <Rocket size={20} className="text-txt-primary" />
                      </div>
                    </div>
                    {/* 본문 */}
                    <div className="px-4 pt-4 h-[7.5rem] shrink-0 overflow-hidden">
                      <h4 className="font-bold text-base text-txt-primary mb-1.5 truncate">{opp.title}</h4>
                      <div className="flex items-center gap-1.5 mb-2 overflow-hidden">
                        <span className="text-[0.5rem] font-mono font-bold text-[#4F46E5]/60 uppercase tracking-widest shrink-0">NEED</span>
                        {(opp.needed_roles || []).slice(0, 2).map(role => (
                          <span key={role} className="text-[0.625rem] font-mono bg-[#4F46E5]/5 text-[#4F46E5] border border-[#4F46E5]/20 px-2 py-0.5 font-medium shrink-0">{role}</span>
                        ))}
                      </div>
                      <p className="text-sm text-txt-secondary line-clamp-2">{opp.description}</p>
                    </div>
                    {/* 푸터 */}
                    <div className="px-4 pb-4 h-[4.75rem] shrink-0 flex items-end">
                      <div className="flex items-center justify-between w-full pt-3 border-t border-dashed border-border">
                        <div className="flex items-center gap-3 text-[0.625rem] font-mono text-txt-tertiary">
                          <span>{opp.applications_count || 0}명 지원</span>
                          <span>{opp.interest_count || 0} 관심</span>
                        </div>
                        {daysLeft > 0 && (
                          <span className={`text-[0.625rem] font-mono flex items-center gap-1 ${isUrgent ? 'text-red-600 font-bold' : 'text-txt-tertiary'}`}>
                            <Clock size={10} /> D-{daysLeft}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={FolderOpen}
              title="아직 등록한 프로젝트가 없습니다"
              description="아이디어를 프로젝트로 만들고 팀원을 모집해보세요"
              actionLabel="프로젝트 만들기"
              actionHref="/projects/new?from=/profile"
            />
          )}
        </section>

        {/* 받은 커피챗 — 블루프린트 */}
        <section className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest flex items-center gap-2">
              <span className="w-5 h-5 bg-amber-500 text-white flex items-center justify-center text-[0.5rem] font-bold">C</span>
              RECEIVED COFFEE CHATS
              {pendingChats.length > 0 && (
                <span className="text-[0.625rem] font-mono font-bold bg-red-600 text-white px-1.5 py-0.5">{pendingChats.length} PENDING</span>
              )}
            </h3>
          </div>

          {chatError && (
            <div className="mb-3 px-3 py-2 bg-red-600/5 border border-red-600/20 text-xs text-red-600 font-mono flex items-center gap-2">
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
                        <span className="absolute -top-2 -left-2 text-[0.5rem] font-mono text-txt-disabled">{String(chatIdx + 1).padStart(2, '0')}</span>
                        <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-600 flex-shrink-0">
                          {(chat.requester_name || chat.requester_email || '?').slice(0, 2)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-txt-primary">{chat.requester_name || chat.requester_email}</span>
                          <span className="text-[0.625rem] font-mono font-bold bg-amber-500/10 text-amber-600 px-1.5 py-0.5 border border-amber-500/20">PENDING</span>
                        </div>
                        {chat.message && (
                          <p className="text-xs text-txt-tertiary line-clamp-2 border-l border-dashed border-border pl-2">{chat.message}</p>
                        )}
                        <p className="text-[0.625rem] font-mono text-txt-disabled mt-1">
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
                          className="w-24 sm:w-32 px-2 py-1.5 text-xs font-mono border-2 border-border-strong focus:outline-none focus:border-[#4F46E5]"
                        />
                        <button
                          onClick={() => handleAcceptChat(chat.id)}
                          className="p-2 bg-emerald-600 text-white border border-emerald-700 hover:bg-emerald-700"
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
                          className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white border-2 border-emerald-700 hover:bg-emerald-700 shadow-[2px_2px_0px_0px_rgba(5,150,105,0.3)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
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
                          chat.status === 'accepted' ? 'bg-emerald-600/5 text-emerald-600 border-emerald-600/20' : 'bg-surface-sunken text-txt-tertiary border-border'
                        }`}>
                          {chat.status === 'accepted' ? 'ACCEPTED' : 'DECLINED'}
                        </span>
                      </div>
                      <p className="text-[0.625rem] font-mono text-txt-disabled mt-0.5">
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
              onAction={() => setIsEditOpen(true)}
            />
          )}
        </section>

        {/* 기술 스택 — 블루프린트 */}
        <section>
          <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest flex items-center gap-2 mb-4">
            <span className="w-5 h-5 bg-emerald-600 text-white flex items-center justify-center text-[0.5rem] font-bold">S</span>
            TECH STACK
          </h3>
          {skills && skills.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative bg-surface-card border border-border-strong p-4 shadow-sharp">
                <div className="absolute top-1 left-1 w-2 h-2 border-l border-t border-black/20" />
                <h4 className="text-[0.5rem] font-mono font-bold text-txt-disabled uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Code2 size={10} /> SKILLS
                </h4>
                <div className="space-y-1.5">
                  {skills.map((skill, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1 border-b border-dashed border-border last:border-0">
                      <span className="flex items-center gap-2 text-sm text-txt-secondary">
                        <span className="text-[0.625rem] font-mono text-txt-disabled">{String(idx + 1).padStart(2, '0')}</span>
                        {skill.name}
                      </span>
                      <span className="text-[0.625rem] font-mono font-bold bg-[#4F46E5]/5 text-[#4F46E5] border border-[#4F46E5]/20 px-1.5 py-0.5 uppercase">{skill.level}</span>
                    </div>
                  ))}
                </div>
              </div>
              {profile?.personality && (
                <div className="relative bg-surface-card border border-border-strong p-4 shadow-sharp">
                  <div className="absolute top-1 right-1 w-2 h-2 border-r border-t border-black/20" />
                  <h4 className="text-[0.5rem] font-mono font-bold text-txt-disabled uppercase tracking-widest mb-3 flex items-center gap-2">
                    <User size={10} /> PERSONALITY
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(profile.personality as Record<string, number>).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-[0.625rem] font-mono text-txt-secondary uppercase">{key.replace(/_/g, ' ')}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-surface-sunken border border-border overflow-hidden">
                            <div className="h-full bg-[#4F46E5] transition-all" style={{ width: `${value}%` }} />
                          </div>
                          <span className="text-[0.625rem] font-mono text-txt-disabled w-8 text-right">{value}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon={Code2}
              title="아직 스킬이 추가되지 않았습니다"
              description="기술 스택을 추가하면 맞는 프로젝트를 추천받을 수 있어요"
              actionLabel="스킬 추가하기"
              onAction={() => setIsEditOpen(true)}
            />
          )}
        </section>
      </DashboardLayout>

      <ProfileEditPanel isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} />
    </div>
  )
}
