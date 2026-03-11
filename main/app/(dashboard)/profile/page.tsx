'use client'

import React, { useState } from 'react'
import {
  MapPin,
  CheckSquare,
  FileText,
  Loader2,
  Edit3,
  Zap,
  Coffee,
  Clock,
  Check,
  X,
  Plus,
  User,
  Briefcase,
  Mail,
  Building2,
} from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { DashboardLayout } from '@/components/ui/DashboardLayout'
import { useAuth } from '@/src/context/AuthContext'
import { useProfile, useUpdateProfile } from '@/src/hooks/useProfile'
import { useMyOpportunities, calculateDaysLeft } from '@/src/hooks/useOpportunities'
import { useCoffeeChats } from '@/src/hooks/useCoffeeChats'

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
  const { chats, loading: chatsLoading, acceptChat, declineChat } = useCoffeeChats({ asOwner: true })

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
    await acceptChat(chatId, contactInput)
    setAcceptingChatId(null)
    setContactInput('')
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-[#FAFAFA]">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    )
  }

  return (
    <div className="bg-[#FAFAFA] min-h-full">
      <DashboardLayout
        size="wide"
        sidebar={
          <div className="space-y-4">
            {/* 프로필 미니 카드 */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center text-lg font-bold text-gray-400 mb-3">
                  {profile?.nickname?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || 'U'}
                </div>
                <h3 className="font-bold text-sm text-gray-900">{profile?.nickname || 'User'}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{profile?.desired_position || '포지션 미설정'}</p>
                {profile?.university && (
                  <p className="text-[10px] text-gray-400 mt-1">{profile.university}</p>
                )}
              </div>
              <button
                onClick={startEdit}
                className="w-full mt-4 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-black hover:text-white hover:border-black transition-colors"
              >
                <Edit3 size={12} /> 프로필 수정
              </button>
            </div>

            {/* 바로가기 */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">바로가기</h3>
              <nav className="space-y-1">
                {[
                  { label: '내 프로젝트', icon: Zap, count: myOpportunities.length },
                  { label: '받은 커피챗', icon: Coffee, count: pendingChats.length },
                  { label: '기술 스택', icon: CheckSquare, count: skills?.length || 0 },
                  { label: '첨부파일', icon: FileText, count: 0 },
                ].map((item) => (
                  <button
                    key={item.label}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <item.icon size={14} />
                      {item.label}
                    </span>
                    {item.count > 0 && (
                      <span className="text-[10px] text-gray-400">{item.count}</span>
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
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Coffee size={12} /> 받은 커피챗
                {pendingChats.length > 0 && (
                  <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">{pendingChats.length}</span>
                )}
              </h3>
              {chatsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="animate-spin text-gray-400" size={16} />
                </div>
              ) : pendingChats.length > 0 ? (
                <div className="space-y-2">
                  {pendingChats.slice(0, 3).map((chat) => (
                    <div key={chat.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-[10px] font-bold text-amber-700 shrink-0">
                        {(chat.requester_name || chat.requester_email || '?').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{chat.requester_name || chat.requester_email}</p>
                        <p className="text-[10px] text-gray-400">{new Date(chat.created_at).toLocaleDateString('ko-KR')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-3">대기 중인 요청 없음</p>
              )}
            </div>

            {/* 프로필 완성도 */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">프로필 완성도</h3>
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
                      <span className="text-sm font-semibold text-gray-900">{percentage}%</span>
                      <span className="text-[10px] text-gray-400">{completedCount}/{fields.length}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                      <div className="h-full bg-black rounded-full transition-all" style={{ width: `${percentage}%` }} />
                    </div>
                    <div className="space-y-1.5">
                      {fields.map((f) => (
                        <div key={f.label} className="flex items-center gap-2 text-xs">
                          {f.done ? (
                            <Check size={12} className="text-green-500" />
                          ) : (
                            <div className="w-3 h-3 rounded-full border border-gray-300" />
                          )}
                          <span className={f.done ? 'text-gray-400 line-through' : 'text-gray-600'}>{f.label}</span>
                        </div>
                      ))}
                    </div>
                    {percentage < 100 && (
                      <button
                        onClick={startEdit}
                        className="w-full mt-3 px-3 py-2 text-xs font-semibold bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
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
        <div className="relative h-36 md:h-48 bg-gradient-to-b from-gray-200 to-gray-300 rounded-xl overflow-hidden mb-0">
          <button className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/80 backdrop-blur text-gray-700 text-xs font-medium rounded-lg hover:bg-white transition-colors border border-gray-200">
            커버 사진 추가
          </button>
        </div>

        {/* Avatar + Name + Actions */}
        <div className="flex items-end justify-between px-4 -mt-10 relative z-10 mb-6">
          <div className="flex items-end gap-4">
            <div className="w-24 h-24 bg-white border-4 border-white rounded-full shadow-md flex items-center justify-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-xl font-bold text-gray-400">
                {profile?.nickname?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || <User size={24} />}
              </div>
            </div>
            <div className="pb-2">
              <h1 className="text-lg font-bold text-gray-900">{profile?.nickname || 'User'}</h1>
              <p className="text-xs text-gray-500">{profile?.desired_position || '포지션 미설정'}</p>
            </div>
          </div>
          <div className="flex gap-2 pb-2">
            <button
              onClick={startEdit}
              className="hidden lg:flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-black hover:text-white hover:border-black transition-colors"
            >
              <Edit3 size={14} /> 프로필 수정
            </button>
            <button
              onClick={startEdit}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-black hover:text-white hover:border-black transition-colors"
            >
              <Edit3 size={12} /> 수정
            </button>
          </div>
        </div>

        {/* 프로필 정보 카드 */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <div className="flex-1 min-w-0">
            {profile?.vision_summary && (
              <p className="text-sm text-gray-600 mb-3">{profile.vision_summary}</p>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Briefcase size={12} className="text-gray-400" />
                <div>
                  <p className="text-[10px] text-gray-400">포지션</p>
                  <p className="text-xs font-medium text-gray-900">{profile?.desired_position || '미설정'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Building2 size={12} className="text-gray-400" />
                <div>
                  <p className="text-[10px] text-gray-400">소속</p>
                  <p className="text-xs font-medium text-gray-900">{profile?.university || '미설정'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={12} className="text-gray-400" />
                <div>
                  <p className="text-[10px] text-gray-400">위치</p>
                  <p className="text-xs font-medium text-gray-900">{profile?.location || '미설정'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={12} className="text-gray-400" />
                <div>
                  <p className="text-[10px] text-gray-400">연락처</p>
                  <p className="text-xs font-medium text-gray-900 truncate">{profile?.contact_email || user?.email || '미설정'}</p>
                </div>
              </div>
            </div>

            {profile?.interest_tags && profile.interest_tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-3">
                {profile.interest_tags.map((tag, idx) => (
                  <span key={idx} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg font-medium">
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
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Zap size={16} /> 내 프로젝트
            </h3>
            <Link
              href="/projects/new"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus size={14} /> 새 프로젝트
            </Link>
          </div>

          {myOpportunities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myOpportunities.map((opp) => {
                const daysLeft = calculateDaysLeft(opp.created_at)
                return (
                  <Card key={opp.id} className="group hover:border-gray-300" padding="p-4">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-black group-hover:text-white transition-colors flex-shrink-0">
                        <Zap size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm text-gray-900 truncate">{opp.title}</h4>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-lg flex-shrink-0 ${
                            opp.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {opp.status === 'active' ? '모집중' : opp.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{opp.description}</p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                          <div className="flex items-center gap-3 text-[10px] text-gray-400">
                            <span>{opp.applications_count || 0}명 지원</span>
                            <span>{opp.interest_count || 0} 관심</span>
                          </div>
                          {daysLeft > 0 && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                              <Clock size={10} /> D-{daysLeft}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="text-center py-8" padding="p-6">
              <Zap className="mx-auto mb-3 text-gray-300" size={32} />
              <p className="text-gray-500 text-sm mb-3">아직 등록한 프로젝트가 없습니다</p>
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Plus size={16} /> 프로젝트 만들기
              </Link>
            </Card>
          )}
        </section>

        {/* 받은 커피챗 */}
        <section className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Coffee size={16} /> 받은 커피챗
              {pendingChats.length > 0 && (
                <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">{pendingChats.length}</span>
              )}
            </h3>
          </div>

          {chatsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-gray-400" size={20} />
            </div>
          ) : chats.length > 0 ? (
            <div className="space-y-3">
              {pendingChats.map((chat) => (
                <Card key={chat.id} className="border-amber-200 bg-amber-50/30" padding="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center text-xs font-bold text-amber-700 flex-shrink-0">
                        {(chat.requester_name || chat.requester_email || '?').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-gray-900">{chat.requester_name || chat.requester_email}</span>
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-lg">대기중</span>
                        </div>
                        {chat.message && (
                          <p className="text-xs text-gray-500 line-clamp-2">{chat.message}</p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(chat.created_at).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </div>

                    {acceptingChatId === chat.id ? (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <input
                          type="text"
                          value={contactInput}
                          onChange={(e) => setContactInput(e.target.value)}
                          placeholder="연락처 입력"
                          className="w-32 px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                        />
                        <button
                          onClick={() => handleAcceptChat(chat.id)}
                          className="p-1.5 bg-black text-white rounded-lg hover:bg-gray-800"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          onClick={() => { setAcceptingChatId(null); setContactInput('') }}
                          className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setAcceptingChatId(chat.id)}
                          className="px-3 py-1.5 text-xs font-semibold bg-black text-white rounded-lg hover:bg-gray-800"
                        >
                          수락
                        </button>
                        <button
                          onClick={() => declineChat(chat.id)}
                          className="px-3 py-1.5 text-xs font-semibold border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
                        >
                          거절
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}

              {otherChats.map((chat) => (
                <Card key={chat.id} className="hover:border-gray-300" padding="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                      {(chat.requester_name || chat.requester_email || '?').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900">{chat.requester_name || chat.requester_email}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-lg ${
                          chat.status === 'accepted' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {chat.status === 'accepted' ? '수락됨' : '거절됨'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(chat.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-8" padding="p-6">
              <Coffee className="mx-auto mb-3 text-gray-300" size={32} />
              <p className="text-gray-500 text-sm">아직 받은 커피챗이 없습니다</p>
            </Card>
          )}
        </section>

        {/* 기술 스택 */}
        <section>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
            <CheckSquare size={16} /> 기술 스택
          </h3>
          {skills && skills.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">스킬</h4>
                <div className="space-y-2">
                  {skills.map((skill, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckSquare size={14} className="text-blue-500" />
                        {skill.name}
                      </span>
                      <span className="text-[10px] text-gray-400 uppercase">{skill.level}</span>
                    </div>
                  ))}
                </div>
              </div>
              {profile?.personality && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">성향</h4>
                  <div className="space-y-2">
                    {Object.entries(profile.personality as Record<string, number>).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 capitalize">{key.replace(/_/g, ' ')}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-black rounded-full" style={{ width: `${value}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-400 w-7 text-right">{value}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Card className="text-center py-8" padding="p-6">
              <CheckSquare className="mx-auto mb-3 text-gray-300" size={32} />
              <p className="text-gray-500 text-sm">아직 스킬이 추가되지 않았습니다</p>
            </Card>
          )}
        </section>
      </DashboardLayout>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setIsEditing(false)}>
          <div
            className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">프로필 수정</h3>
              <button onClick={() => setIsEditing(false)} className="p-1 text-gray-400 hover:text-black">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">닉네임</label>
                <input
                  type="text"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  maxLength={30}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">포지션</label>
                <input
                  type="text"
                  value={editPosition}
                  onChange={(e) => setEditPosition(e.target.value)}
                  placeholder="예: 프론트엔드 개발자"
                  maxLength={50}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">대학교</label>
                <input
                  type="text"
                  value={editUniversity}
                  onChange={(e) => setEditUniversity(e.target.value)}
                  placeholder="예: 서울대학교"
                  maxLength={50}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">한 줄 소개</label>
                <textarea
                  value={editVision}
                  onChange={(e) => setEditVision(e.target.value)}
                  placeholder="자신을 한 줄로 소개해주세요"
                  rows={2}
                  maxLength={200}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-black resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-black transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={updateProfile.isPending}
                className="px-5 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {updateProfile.isPending ? '저장 중...' : '저장'}
              </button>
            </div>
            {saveError && (
              <p className="mt-3 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{saveError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
