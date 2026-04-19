'use client'

import React, { useState } from 'react'
import { X, Loader2, Check, FolderOpen, Coffee } from 'lucide-react'
import { toast } from 'sonner'
import { useMyOpportunities } from '@/src/hooks/useOpportunities'
import { useCreateInvitation } from '@/src/hooks/useProjectInvitations'
import { useCoffeeChats } from '@/src/hooks/useCoffeeChats'
import { useBackHandler } from '@/src/hooks/useBackHandler'
import { CoffeeChatRequestForm } from '@/components/CoffeeChatRequestForm'

interface InviteToProjectModalProps {
  targetUserId: string
  targetName: string
  onClose: () => void
}

export const InviteToProjectModal: React.FC<InviteToProjectModalProps> = ({
  targetUserId,
  targetName,
  onClose,
}) => {
  useBackHandler(true, onClose, 'invite-project')

  const { data: myOpportunities = [], isLoading: loadingProjects } = useMyOpportunities()
  const createInvitation = useCreateInvitation()

  // 커피챗 이력 조회 — 처음 보는 사람한테 곧장 "프로젝트 합류"가 무거우므로
  // 이력 없으면 배너로 부드럽게 가이드 (차단은 안 함)
  const { data: chatHistory = [], isLoading: loadingChatHistory } = useCoffeeChats({ targetUserId })
  const hasCoffeeChatHistory = chatHistory.some(c => c.status === 'accepted' || c.status === 'pending')
  const [showCoffeeForm, setShowCoffeeForm] = useState(false)

  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeProjects = myOpportunities.filter(o => o.status === 'active')
  const selectedOpp = activeProjects.find(o => o.id === selectedProject)
  const neededRoles = (selectedOpp?.needed_roles as string[] | null) || []

  const handleSubmit = async () => {
    if (!selectedProject || !selectedRole) return
    setError(null)
    try {
      await createInvitation.mutateAsync({
        opportunity_id: selectedProject,
        invited_user_id: targetUserId,
        role: selectedRole,
        message: message.trim() || undefined,
      })
      setSent(true)
      toast.success('초대가 전송되었습니다!')
    } catch (err) {
      const msg = err instanceof Error ? err.message : null
      setError(msg && msg !== 'Unknown error' ? msg : '초대 전송에 실패했습니다.')
      toast.error('초대 전송에 실패했습니다')
    }
  }

  // 커피챗 폼으로 전환된 상태: 모달 안에서 커피챗 보내기
  if (showCoffeeForm) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-popover p-4" onClick={(e) => { e.stopPropagation(); onClose() }}>
        <div className="bg-surface-card dark:bg-[#1C1C1E] rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <CoffeeChatRequestForm targetUserId={targetUserId} onClose={onClose} />
        </div>
      </div>
    )
  }

  if (sent) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-popover p-4" onClick={(e) => { e.stopPropagation(); onClose() }}>
        <div className="bg-surface-card dark:bg-[#1C1C1E] rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
          <div className="p-8 text-center">
            <div className="w-14 h-14 bg-[#E8F5E9] dark:bg-[#1B3A2D] rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <Check size={24} className="text-[#34C759]" />
            </div>
            <h3 className="text-[20px] font-bold text-txt-primary mb-2">초대 완료!</h3>
            <p className="text-[14px] text-txt-tertiary mb-6">
              {targetName}님에게 프로젝트 초대가 전송되었습니다.
            </p>
            <button
              onClick={onClose}
              className="text-[14px] text-txt-tertiary hover:text-txt-secondary transition-colors"
            >
              돌아가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-popover p-4" onClick={(e) => { e.stopPropagation(); onClose() }}>
      <div className="bg-surface-card dark:bg-[#1C1C1E] rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0">
          <h3 className="text-[17px] font-bold text-txt-primary">프로젝트에 초대</h3>
          <button onClick={onClose} className="p-1.5 bg-[#F2F3F5] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C] rounded-full transition-colors" aria-label="닫기">
            <X size={16} className="text-txt-tertiary" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 space-y-5 overflow-y-auto flex-1">
          {/* 커피챗 이력 없음 → 부드러운 가이드 (차단 X). 짧게 얘기 먼저 해보라는 권유 */}
          {!loadingChatHistory && !hasCoffeeChatHistory && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-3.5">
              <p className="text-[13px] text-amber-900 dark:text-amber-200 leading-relaxed mb-3">
                💡 아직 {targetName}님과 커피챗 이력이 없어요. 먼저 짧게 이야기해보면 더 좋은 매칭이 될 수 있어요.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCoffeeForm(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-[12px] font-semibold rounded-xl transition-colors active:scale-[0.97]"
                >
                  <Coffee size={13} /> 커피챗 먼저 보내기
                </button>
                <span className="text-[12px] text-amber-900/70 dark:text-amber-200/70">또는 그래도 초대하기 ↓</span>
              </div>
            </div>
          )}

          {loadingProjects ? (
            <div className="space-y-2 py-2">
              {[0,1,2].map(i => (
                <div key={i} className="h-12 bg-[#F2F3F5] dark:bg-[#2C2C2E] rounded-2xl skeleton-shimmer" />
              ))}
            </div>
          ) : activeProjects.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen size={32} className="text-txt-disabled mx-auto mb-3" />
              <p className="text-[15px] font-bold text-txt-primary mb-1">모집 중인 프로젝트가 없습니다</p>
              <p className="text-[13px] text-txt-tertiary mb-4">프로젝트를 먼저 만들어주세요</p>
              <a
                href="/projects/new"
                className="inline-flex items-center gap-1.5 px-5 py-3 bg-[#5E6AD2] text-white text-[14px] font-semibold rounded-2xl hover:bg-[#4B4FB8] active:scale-[0.97] transition-all"
              >
                프로젝트 만들기
              </a>
            </div>
          ) : (
            <>
              {/* 1. Project Selection */}
              <div>
                <label className="block text-[13px] font-semibold text-txt-secondary mb-2.5">
                  1. 프로젝트 선택
                </label>
                <div className="space-y-2">
                  {activeProjects.map(opp => (
                    <button
                      key={opp.id}
                      onClick={() => { setSelectedProject(opp.id); setSelectedRole(null) }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left text-[14px] rounded-2xl transition-all ${
                        selectedProject === opp.id
                          ? 'bg-[#EBF4FF] dark:bg-[#1A2A42] text-[#5E6AD2] font-bold'
                          : 'bg-[#F7F8F9] dark:bg-[#1C1C1E] text-txt-secondary hover:bg-[#EDF0F3] dark:hover:bg-[#252527]'
                      }`}
                    >
                      <span className="truncate">{opp.title}</span>
                      <span className="text-[11px] font-semibold text-[#34C759] bg-[#E8F5E9] dark:bg-[#1B3A2D] px-2 py-0.5 rounded-full shrink-0 ml-2">
                        모집중
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Role Selection */}
              {selectedProject && (
                <div>
                  <label className="block text-[13px] font-semibold text-txt-secondary mb-2.5">
                    2. 역할 선택
                  </label>
                  {neededRoles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {neededRoles.map(role => (
                        <button
                          key={role}
                          onClick={() => setSelectedRole(role)}
                          className={`px-3.5 py-2 text-[13px] font-semibold rounded-full transition-all ${
                            selectedRole === role
                              ? 'bg-[#5E6AD2] text-white'
                              : 'bg-[#F2F3F5] dark:bg-[#2C2C2E] text-txt-secondary hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C]'
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="역할을 입력하세요 (예: Frontend Developer)"
                      value={selectedRole || ''}
                      onChange={e => setSelectedRole(e.target.value || null)}
                      className="w-full px-4 py-3 text-[14px] bg-[#F7F8F9] dark:bg-[#2C2C2E] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/20"
                    />
                  )}
                </div>
              )}

              {/* 3. Message */}
              {selectedProject && selectedRole && (
                <div>
                  <label className="block text-[13px] font-semibold text-txt-secondary mb-2.5">
                    3. 메시지 (선택)
                  </label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="함께 하고 싶어서 연락드립니다..."
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-3 text-[14px] bg-[#F7F8F9] dark:bg-[#2C2C2E] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/20 resize-none"
                  />
                </div>
              )}

              {error && (
                <p className="text-[12px] text-[#FF3B30]">{error}</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {activeProjects.length > 0 && (
          <div className="px-5 pb-5 shrink-0">
            <button
              onClick={handleSubmit}
              disabled={!selectedProject || !selectedRole || createInvitation.isPending}
              className="w-full flex items-center justify-center gap-2 h-14 bg-[#5E6AD2] text-white text-[15px] font-semibold rounded-2xl hover:bg-[#4B4FB8] active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {createInvitation.isPending ? (
                <><Loader2 size={16} className="animate-spin" /> 전송 중...</>
              ) : (
                '초대 보내기'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
