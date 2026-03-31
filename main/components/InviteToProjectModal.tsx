'use client'

import React, { useState } from 'react'
import { X, Loader2, Check, FolderOpen } from 'lucide-react'
import { toast } from 'sonner'
import { useMyOpportunities } from '@/src/hooks/useOpportunities'
import { useCreateInvitation } from '@/src/hooks/useProjectInvitations'
import { useBackHandler } from '@/src/hooks/useBackHandler'

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

  if (sent) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-surface-card rounded-xl border border-border shadow-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
          <div className="p-6 text-center">
            <div className="w-14 h-14 bg-status-success-bg border border-status-success-text/20 flex items-center justify-center mb-4 mx-auto shadow-sm">
              <Check size={24} className="text-status-success-text" />
            </div>
            <h3 className="text-xl font-bold text-txt-primary mb-2">초대 완료!</h3>
            <p className="text-txt-tertiary text-sm mb-6">
              {targetName}님에게 프로젝트 초대가 전송되었습니다.
            </p>
            <button
              onClick={onClose}
              className="text-sm text-txt-disabled hover:text-txt-secondary transition-colors"
            >
              돌아가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface-card rounded-xl border border-border shadow-lg w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-sunken shrink-0">
          <h3 className="text-sm font-bold text-txt-primary">프로젝트에 초대</h3>
          <button onClick={onClose} className="p-2.5 sm:p-1 hover:bg-surface-card transition-colors">
            <X size={16} className="text-txt-disabled" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-5 overflow-y-auto flex-1">
          {loadingProjects ? (
            <div className="space-y-2 py-2">
              {[0,1,2].map(i => (
                <div key={i} className="h-12 bg-surface-sunken rounded skeleton-shimmer" />
              ))}
            </div>
          ) : activeProjects.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen size={32} className="text-txt-disabled mx-auto mb-3" />
              <p className="text-sm font-bold text-txt-primary mb-1">모집 중인 프로젝트가 없습니다</p>
              <p className="text-xs text-txt-tertiary mb-4">프로젝트를 먼저 만들어주세요</p>
              <a
                href="/projects/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-bold border border-brand hover:bg-brand-hover hover:opacity-90 active:scale-[0.97] transition-all"
              >
                프로젝트 만들기
              </a>
            </div>
          ) : (
            <>
              {/* 1. Project Selection */}
              <div>
                <label className="block text-[0.625rem] font-medium text-txt-tertiary mb-2">
                  1. 프로젝트 선택
                </label>
                <div className="space-y-1.5">
                  {activeProjects.map(opp => (
                    <button
                      key={opp.id}
                      onClick={() => { setSelectedProject(opp.id); setSelectedRole(null) }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm border transition-all ${
                        selectedProject === opp.id
                          ? 'bg-brand-bg text-brand border-brand-border font-bold'
                          : 'bg-surface-card text-txt-secondary border-border hover:bg-surface-sunken'
                      }`}
                    >
                      <span className="truncate">{opp.title}</span>
                      <span className="text-[0.625rem] font-mono font-bold bg-indicator-online/10 text-indicator-online px-1.5 py-0.5 border border-indicator-online/20 shrink-0 ml-2">
                        모집중
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Role Selection */}
              {selectedProject && (
                <div>
                  <label className="block text-[0.625rem] font-medium text-txt-tertiary mb-2">
                    2. 역할 선택
                  </label>
                  {neededRoles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {neededRoles.map(role => (
                        <button
                          key={role}
                          onClick={() => setSelectedRole(role)}
                          className={`px-3 py-1.5 text-xs font-bold border transition-all ${
                            selectedRole === role
                              ? 'bg-brand text-white border-brand shadow-sm'
                              : 'bg-surface-card text-txt-secondary border-border hover:bg-black hover:text-white'
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
                      className="w-full px-3 py-2 text-base sm:text-sm border border-border bg-surface-card rounded-lg focus:outline-none focus:border-brand"
                    />
                  )}
                </div>
              )}

              {/* 3. Message */}
              {selectedProject && selectedRole && (
                <div>
                  <label className="block text-[0.625rem] font-medium text-txt-tertiary mb-2">
                    3. 메시지 (선택)
                  </label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="함께 하고 싶어서 연락드립니다..."
                    rows={3}
                    maxLength={500}
                    className="w-full px-3 py-2 text-base sm:text-sm border border-border bg-surface-card rounded-lg focus:outline-none focus:border-brand resize-none"
                  />
                </div>
              )}

              {error && (
                <p className="text-xs text-status-danger-text">{error}</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {activeProjects.length > 0 && (
          <div className="px-4 py-3 border-t border-border shrink-0">
            <button
              onClick={handleSubmit}
              disabled={!selectedProject || !selectedRole || createInvitation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand text-white border border-brand text-sm font-bold hover:bg-brand-hover hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {createInvitation.isPending ? (
                <><Loader2 size={14} className="animate-spin" /> 전송 중...</>
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
