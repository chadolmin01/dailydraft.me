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
} from 'lucide-react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/ui/DashboardLayout'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/src/context/AuthContext'
import { useProfile, useUpdateProfile } from '@/src/hooks/useProfile'
import { useMyOpportunities, calculateDaysLeft } from '@/src/hooks/useOpportunities'
import { useCoffeeChats, useAcceptCoffeeChat, useDeclineCoffeeChat } from '@/src/hooks/useCoffeeChats'

export default function ProfilePage() {
  const [contactInput, setContactInput] = useState('')
  const [acceptingChatId, setAcceptingChatId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editNickname, setEditNickname] = useState('')
  const [editPosition, setEditPosition] = useState('')
  const [editUniversity, setEditUniversity] = useState('')
  const [editVision, setEditVision] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const { user } = useAuth()
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()
  const { data: myOpportunities = [] } = useMyOpportunities()
  const { data: chats = [], isLoading: chatsLoading } = useCoffeeChats({ asOwner: true })
  const acceptChatMutation = useAcceptCoffeeChat()
  const declineChatMutation = useDeclineCoffeeChat()

  const skills = profile?.skills as Array<{ name: string; level: string }> | null
  const pendingChats = chats.filter(c => c.status === 'pending')
  const otherChats = chats.filter(c => c.status !== 'pending')

  const startEdit = () => {
    setEditNickname(profile?.nickname || '')
    setEditPosition(profile?.desired_position || '')
    setEditUniversity(profile?.university || '')
    setEditVision(profile?.vision_summary || '')
    setIsEditing(true)
  }

  const handleSaveProfile = async () => {
    setSaveError(null)
    try {
      await updateProfile.mutateAsync({
        nickname: editNickname.trim() || undefined,
        desired_position: editPosition.trim() || undefined,
        university: editUniversity.trim() || undefined,
        vision_summary: editVision.trim() || undefined,
      })
      setIsEditing(false)
    } catch {
      setSaveError('프로필 저장에 실패했습니다. 다시 시도해주세요.')
    }
  }

  const handleAcceptChat = async (chatId: string) => {
    if (!contactInput.trim()) return
    try {
      await acceptChatMutation.mutateAsync({ chatId, contactInfo: contactInput })
      setAcceptingChatId(null)
      setContactInput('')
    } catch { /* error handled by React Query */ }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-surface-bg">
        <Loader2 className="animate-spin text-txt-tertiary" size={32} />
      </div>
    )
  }

  return (
    <div className="bg-surface-bg min-h-full">
      <DashboardLayout
        size="wide"
        sidebar={
          <div className="space-y-4">
            {/* 프로필 미니 카드 */}
            <div className="bg-surface-card border border-border rounded-xl p-4">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-surface-sunken rounded-xl border border-border flex items-center justify-center text-lg font-bold text-txt-tertiary mb-3">
                  {profile?.nickname?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || 'U'}
                </div>
                <h3 className="font-bold text-sm text-txt-primary">{profile?.nickname || 'User'}</h3>
                <p className="text-xs text-txt-tertiary mt-0.5">{profile?.desired_position || '포지션 미설정'}</p>
                {profile?.university && (
                  <p className="text-xs text-txt-disabled mt-1">{profile.university}</p>
                )}
              </div>
              <button
                onClick={startEdit}
                className="w-full mt-4 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-accent hover:text-txt-inverse hover:border-accent transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                <Edit3 size={12} /> 프로필 수정
              </button>
            </div>

            {/* 바로가기 */}
            <div className="bg-surface-card border border-border rounded-xl p-4">
              <h3 className="text-xs font-bold text-txt-tertiary uppercase tracking-wider mb-3">바로가기</h3>
              <nav className="space-y-1">
                {[
                  { label: '내 프로젝트', icon: Rocket, count: myOpportunities.length },
                  { label: '받은 커피챗', icon: Coffee, count: pendingChats.length },
                  { label: '기술 스택', icon: CheckSquare, count: skills?.length || 0 },
                  { label: '첨부파일', icon: FileText, count: 0 },
                ].map((item) => (
                  <button
                    key={item.label}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-txt-secondary hover:bg-surface-sunken transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <item.icon size={14} />
                      {item.label}
                    </span>
                    {item.count > 0 && (
                      <span className="text-xs text-txt-tertiary">{item.count}</span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        }
        aside={
          <div className="space-y-4">
            {/* 받은 커피챗 미리보기 */}
            <div className="bg-surface-card border border-border rounded-xl p-4">
              <h3 className="text-xs font-bold text-txt-tertiary uppercase tracking-wider mb-3 flex items-center gap-2">
                <Coffee size={12} /> 받은 커피챗
                {pendingChats.length > 0 && (
                  <span className="text-xs bg-status-danger-accent text-txt-inverse px-1.5 py-0.5 rounded-full">{pendingChats.length}</span>
                )}
              </h3>
              {chatsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="animate-spin text-txt-tertiary" size={16} />
                </div>
              ) : pendingChats.length > 0 ? (
                <div className="space-y-2">
                  {pendingChats.slice(0, 3).map((chat) => (
                    <div key={chat.id} className="flex items-center gap-3 py-2 border-b border-border-subtle last:border-0">
                      <div className="w-8 h-8 bg-status-warning-bg rounded-full flex items-center justify-center text-xs font-bold text-status-warning-text shrink-0">
                        {(chat.requester_name || chat.requester_email || '?').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-txt-primary truncate">{chat.requester_name || chat.requester_email}</p>
                        <p className="text-xs text-txt-disabled">{new Date(chat.created_at).toLocaleDateString('ko-KR')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-txt-disabled text-center py-3">대기 중인 요청 없음</p>
              )}
            </div>

            {/* 프로필 완성도 */}
            <div className="bg-surface-card border border-border rounded-xl p-4">
              <h3 className="text-xs font-bold text-txt-tertiary uppercase tracking-wider mb-3">프로필 완성도</h3>
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
                      <span className="text-sm font-semibold text-txt-primary">{percentage}%</span>
                      <span className="text-xs text-txt-disabled">{completedCount}/{fields.length}</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-sunken rounded-full overflow-hidden mb-3">
                      <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${percentage}%` }} />
                    </div>
                    <div className="space-y-1.5">
                      {fields.map((f) => (
                        <div key={f.label} className="flex items-center gap-2 text-xs">
                          {f.done ? (
                            <Check size={12} className="text-status-success-text" />
                          ) : (
                            <div className="w-3 h-3 rounded-full border border-border" />
                          )}
                          <span className={f.done ? 'text-txt-disabled line-through' : 'text-txt-secondary'}>{f.label}</span>
                        </div>
                      ))}
                    </div>
                    {percentage < 100 && (
                      <button
                        onClick={startEdit}
                        className="w-full mt-3 px-3 py-2 text-xs font-semibold bg-accent text-txt-inverse rounded-lg hover:bg-accent-hover transition-colors"
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
        {/* Cover Photo */}
        <div className="relative h-36 md:h-48 bg-gradient-to-b from-surface-sunken to-border rounded-xl overflow-hidden mb-0">
          <button className="absolute bottom-3 right-3 px-3 py-1.5 bg-surface-card/80 backdrop-blur text-txt-secondary text-xs font-medium rounded-lg hover:bg-surface-card transition-colors border border-border">
            커버 사진 추가
          </button>
        </div>

        {/* Avatar + Name + Actions */}
        <div className="flex items-end justify-between px-4 -mt-10 relative z-10 mb-6">
          <div className="flex items-end gap-4">
            <div className="w-24 h-24 bg-surface-card border-4 border-surface-card rounded-full shadow-md flex items-center justify-center">
              <div className="w-20 h-20 bg-surface-sunken rounded-full flex items-center justify-center text-xl font-bold text-txt-tertiary">
                {profile?.nickname?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || <User size={24} />}
              </div>
            </div>
            <div className="pb-2">
              <h1 className="text-lg font-bold text-txt-primary">{profile?.nickname || 'User'}</h1>
              <p className="text-xs text-txt-tertiary">{profile?.desired_position || '포지션 미설정'}</p>
            </div>
          </div>
          <div className="flex gap-2 pb-2">
            <button
              onClick={startEdit}
              className="hidden lg:flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-accent hover:text-txt-inverse hover:border-accent transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              <Edit3 size={14} /> 프로필 수정
            </button>
            <button
              onClick={startEdit}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-border rounded-lg hover:bg-accent hover:text-txt-inverse hover:border-accent transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              <Edit3 size={12} /> 수정
            </button>
          </div>
        </div>

        {/* 프로필 정보 카드 */}
        <div className="bg-surface-card border border-border rounded-xl p-4 mb-6">
          <div className="flex-1 min-w-0">
            {profile?.vision_summary && (
              <p className="text-sm text-txt-secondary mb-3">{profile.vision_summary}</p>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-border-subtle">
              <div className="flex items-center gap-2">
                <Briefcase size={12} className="text-txt-tertiary" />
                <div>
                  <p className="text-xs text-txt-disabled">포지션</p>
                  <p className="text-xs font-medium text-txt-primary">{profile?.desired_position || '미설정'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Building2 size={12} className="text-txt-tertiary" />
                <div>
                  <p className="text-xs text-txt-disabled">소속</p>
                  <p className="text-xs font-medium text-txt-primary">{profile?.university || '미설정'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={12} className="text-txt-tertiary" />
                <div>
                  <p className="text-xs text-txt-disabled">위치</p>
                  <p className="text-xs font-medium text-txt-primary">{profile?.location || '미설정'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={12} className="text-txt-tertiary" />
                <div>
                  <p className="text-xs text-txt-disabled">연락처</p>
                  <p className="text-xs font-medium text-txt-primary truncate">{profile?.contact_email || user?.email || '미설정'}</p>
                </div>
              </div>
            </div>

            {profile?.interest_tags && profile.interest_tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-3">
                {profile.interest_tags.map((tag, idx) => (
                  <span key={idx} className="text-xs bg-tag-default-bg text-tag-default-text px-2 py-0.5 rounded font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 내 프로젝트 */}
        <section className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-txt-primary flex items-center gap-2">
              <Rocket size={16} /> 내 프로젝트
            </h3>
            <Link
              href="/projects/new"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-accent text-txt-inverse rounded-lg hover:bg-accent-hover transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              <Plus size={14} /> 새 프로젝트
            </Link>
          </div>

          {myOpportunities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myOpportunities.map((opp) => {
                const daysLeft = calculateDaysLeft(opp.created_at)
                const isUrgent = daysLeft > 0 && daysLeft <= 3
                return (
                  <div key={opp.id} className="bg-surface-card border border-border rounded-xl overflow-hidden group hover:border-border-strong hover:shadow-sm transition-all cursor-pointer h-[340px] flex flex-col">
                    {/* 커버 */}
                    <div className="relative h-36 shrink-0 bg-surface-inverse flex items-end p-4">
                      <div className="absolute top-3 left-3">
                        {isUrgent ? (
                          <span className="text-xs bg-status-danger-accent/90 backdrop-blur-sm text-txt-inverse px-2 py-0.5 rounded font-semibold">D-{daysLeft} 마감임박</span>
                        ) : (
                          <span className="text-xs bg-surface-inverse/60 backdrop-blur-sm text-txt-inverse px-2 py-0.5 rounded font-semibold">
                            {opp.status === 'active' ? '모집중' : opp.status}
                          </span>
                        )}
                      </div>
                      <div className="absolute top-3 right-3 flex gap-1.5">
                        {(opp.interest_tags || []).slice(0, 2).map(tag => (
                          <span key={tag} className="text-xs bg-surface-card/15 backdrop-blur-sm text-txt-inverse px-2 py-0.5 rounded font-medium">{tag}</span>
                        ))}
                      </div>
                      <div className="w-10 h-10 bg-surface-card rounded-lg flex items-center justify-center shadow-md">
                        <Rocket size={20} className="text-txt-primary" />
                      </div>
                    </div>
                    {/* 본문 */}
                    <div className="px-4 pt-4 h-[120px] shrink-0 overflow-hidden">
                      <h4 className="font-semibold text-base text-txt-primary mb-1.5 truncate">{opp.title}</h4>
                      <div className="flex items-center gap-1.5 mb-2 overflow-hidden">
                        <span className="text-xs font-mono text-txt-disabled uppercase tracking-wide shrink-0">NEED</span>
                        {(opp.needed_roles || []).slice(0, 2).map(role => (
                          <span key={role} className="text-xs bg-tag-default-bg text-tag-default-text px-2 py-0.5 rounded font-medium shrink-0">{role}</span>
                        ))}
                      </div>
                      <p className="text-sm text-txt-secondary line-clamp-2">{opp.description}</p>
                    </div>
                    {/* 푸터 */}
                    <div className="px-4 pb-4 h-[76px] shrink-0 flex items-end">
                      <div className="flex items-center justify-between w-full pt-3 border-t border-border-subtle">
                        <div className="flex items-center gap-3 text-xs text-txt-tertiary">
                          <span>{opp.applications_count || 0}명 지원</span>
                          <span>{opp.interest_count || 0} 관심</span>
                        </div>
                        {daysLeft > 0 && (
                          <span className={`text-xs flex items-center gap-1 ${isUrgent ? 'text-status-danger-text font-semibold' : 'text-txt-tertiary'}`}>
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

        {/* 받은 커피챗 */}
        <section className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-txt-primary flex items-center gap-2">
              <Coffee size={16} /> 받은 커피챗
              {pendingChats.length > 0 && (
                <span className="text-xs bg-status-danger-accent text-txt-inverse px-1.5 py-0.5 rounded-full">{pendingChats.length}</span>
              )}
            </h3>
          </div>

          {chatsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-txt-tertiary" size={20} />
            </div>
          ) : chats.length > 0 ? (
            <div className="space-y-3">
              {pendingChats.map((chat) => (
                <div key={chat.id} className="bg-surface-card border border-border rounded-xl p-4 border-l-4 border-l-status-warning-text">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 bg-status-warning-bg rounded-full flex items-center justify-center text-xs font-bold text-status-warning-text flex-shrink-0">
                        {(chat.requester_name || chat.requester_email || '?').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-txt-primary">{chat.requester_name || chat.requester_email}</span>
                          <span className="text-xs bg-status-warning-bg text-status-warning-text px-1.5 py-0.5 rounded">대기중</span>
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
                          className="w-24 sm:w-32 px-2 py-1.5 text-xs border border-border rounded-lg focus:outline-none focus:border-accent"
                        />
                        <button
                          onClick={() => handleAcceptChat(chat.id)}
                          className="p-2 bg-accent text-txt-inverse rounded-lg hover:bg-accent-hover"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => { setAcceptingChatId(null); setContactInput('') }}
                          className="p-2 bg-surface-sunken text-txt-secondary rounded-lg hover:bg-border"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setAcceptingChatId(chat.id)}
                          className="px-3 py-1.5 text-xs font-semibold bg-accent text-txt-inverse rounded-lg hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                        >
                          수락
                        </button>
                        <button
                          onClick={() => declineChatMutation.mutate(chat.id)}
                          className="px-3 py-1.5 text-xs font-semibold border border-border text-txt-secondary rounded-lg hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                        >
                          거절
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {otherChats.map((chat) => (
                <div key={chat.id} className="bg-surface-card border border-border rounded-xl p-4 hover:border-border-strong transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-surface-sunken rounded-full flex items-center justify-center text-xs font-bold text-txt-tertiary flex-shrink-0">
                      {(chat.requester_name || chat.requester_email || '?').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-txt-primary">{chat.requester_name || chat.requester_email}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          chat.status === 'accepted' ? 'bg-status-success-bg text-status-success-text' : 'bg-surface-sunken text-txt-tertiary'
                        }`}>
                          {chat.status === 'accepted' ? '수락됨' : '거절됨'}
                        </span>
                      </div>
                      <p className="text-xs text-txt-disabled mt-0.5">
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
              onAction={startEdit}
            />
          )}
        </section>

        {/* 기술 스택 */}
        <section>
          <h3 className="text-base font-bold text-txt-primary flex items-center gap-2 mb-4">
            <CheckSquare size={16} /> 기술 스택
          </h3>
          {skills && skills.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-surface-card rounded-xl border border-border p-4">
                <h4 className="text-xs font-bold text-txt-tertiary uppercase tracking-wider mb-3">스킬</h4>
                <div className="space-y-2">
                  {skills.map((skill, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-txt-secondary">
                        <CheckSquare size={14} className="text-tag-default-text" />
                        {skill.name}
                      </span>
                      <span className="text-xs text-txt-disabled uppercase">{skill.level}</span>
                    </div>
                  ))}
                </div>
              </div>
              {profile?.personality && (
                <div className="bg-surface-card rounded-xl border border-border p-4">
                  <h4 className="text-xs font-bold text-txt-tertiary uppercase tracking-wider mb-3">성향</h4>
                  <div className="space-y-2">
                    {Object.entries(profile.personality as Record<string, number>).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-txt-secondary capitalize">{key.replace(/_/g, ' ')}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-surface-sunken rounded-full overflow-hidden">
                            <div className="h-full bg-accent rounded-full" style={{ width: `${value}%` }} />
                          </div>
                          <span className="text-xs text-txt-disabled w-7 text-right">{value}%</span>
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
              onAction={startEdit}
            />
          )}
        </section>
      </DashboardLayout>

      {/* Edit Profile Modal */}
      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="프로필 수정" size="md">
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-txt-tertiary mb-1">닉네임</label>
            <input
              type="text"
              value={editNickname}
              onChange={(e) => setEditNickname(e.target.value)}
              maxLength={30}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface-card focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-txt-tertiary mb-1">포지션</label>
            <input
              type="text"
              value={editPosition}
              onChange={(e) => setEditPosition(e.target.value)}
              placeholder="예: 프론트엔드 개발자"
              maxLength={50}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface-card focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-txt-tertiary mb-1">대학교</label>
            <input
              type="text"
              value={editUniversity}
              onChange={(e) => setEditUniversity(e.target.value)}
              placeholder="예: 서울대학교"
              maxLength={50}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface-card focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-txt-tertiary mb-1">한 줄 소개</label>
            <textarea
              value={editVision}
              onChange={(e) => setEditVision(e.target.value)}
              placeholder="자신을 한 줄로 소개해주세요"
              rows={2}
              maxLength={200}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface-card focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent resize-none"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 text-sm text-txt-secondary hover:text-txt-primary transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 rounded-lg"
          >
            취소
          </button>
          <button
            onClick={handleSaveProfile}
            disabled={updateProfile.isPending}
            className="px-5 py-2 bg-accent text-txt-inverse text-sm font-semibold rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {updateProfile.isPending ? '저장 중...' : '저장'}
          </button>
        </div>
        {saveError && (
          <p className="text-sm text-status-danger-text bg-status-danger-bg px-4 py-2 mx-6 mb-4 rounded-lg">{saveError}</p>
        )}
      </Modal>
    </div>
  )
}
