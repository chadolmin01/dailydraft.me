'use client'

import { useState } from 'react'
import { Mail, Phone, MessageCircle, Loader2, Send } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/src/context/AuthContext'

interface CoffeeChatAcceptModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: InvitationData) => void
  isLoading: boolean
  requesterName: string
  isPersonMode: boolean
}

export interface InvitationData {
  message: string
  contactEmail: string
  contactPhone: string
  contactKakao: string
  requirements: string
}

export function CoffeeChatAcceptModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  requesterName,
  isPersonMode,
}: CoffeeChatAcceptModalProps) {
  const { profile } = useAuth()

  const [message, setMessage] = useState(
    isPersonMode
      ? `안녕하세요! 커피챗 요청을 수락합니다. 편하게 연락주세요.`
      : `안녕하세요! 프로젝트에 관심 가져주셔서 감사합니다. 함께 이야기 나눠봐요!`
  )
  const [contactEmail, setContactEmail] = useState(profile?.contact_email || '')
  const [contactPhone, setContactPhone] = useState('')
  const [contactKakao, setContactKakao] = useState(profile?.contact_kakao || '')
  const [requirements, setRequirements] = useState('')

  const hasContact = contactEmail.trim() || contactPhone.trim() || contactKakao.trim()

  const handleSubmit = () => {
    if (!hasContact) return
    onSubmit({
      message: message.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      contactKakao: contactKakao.trim(),
      requirements: requirements.trim(),
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="초대편지 작성" size="md">
      <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

        {/* Recipient */}
        <div className="flex items-center gap-2 px-3 py-2 bg-surface-sunken rounded-xl border border-border">
          <span className="text-[0.625rem] font-medium text-txt-tertiary">TO</span>
          <span className="text-sm font-bold text-txt-primary">{requesterName}님에게</span>
        </div>

        {/* Welcome Message */}
        <div>
          <label className="block text-[0.625rem] font-medium text-txt-tertiary mb-1.5">
            환영 메시지
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            placeholder="상대방에게 전할 메시지를 작성하세요..."
            className="w-full px-3 py-2.5 text-sm border border-border bg-surface-card rounded-lg text-txt-primary placeholder:text-txt-disabled focus:outline-none focus:border-brand resize-none"
          />
        </div>

        {/* Contact Info */}
        <div>
          <label className="block text-[0.625rem] font-medium text-txt-tertiary mb-1.5">
            연락처 <span className="text-status-danger-text">*</span>
          </label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-surface-sunken rounded-xl border border-border flex items-center justify-center shrink-0">
                <Mail size={14} className="text-txt-tertiary" />
              </div>
              <input
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                placeholder="이메일"
                className="flex-1 px-3 py-2 text-sm border border-border bg-surface-card rounded-lg text-txt-primary placeholder:text-txt-disabled focus:outline-none focus:border-brand"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-surface-sunken rounded-xl border border-border flex items-center justify-center shrink-0">
                <Phone size={14} className="text-txt-tertiary" />
              </div>
              <input
                type="tel"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                placeholder="전화번호"
                className="flex-1 px-3 py-2 text-sm border border-border bg-surface-card rounded-lg text-txt-primary placeholder:text-txt-disabled focus:outline-none focus:border-brand"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-surface-sunken rounded-xl border border-border flex items-center justify-center shrink-0">
                <MessageCircle size={14} className="text-txt-tertiary" />
              </div>
              <input
                type="text"
                value={contactKakao}
                onChange={e => setContactKakao(e.target.value)}
                placeholder="카카오톡 ID"
                className="flex-1 px-3 py-2 text-sm border border-border bg-surface-card rounded-lg text-txt-primary placeholder:text-txt-disabled focus:outline-none focus:border-brand"
              />
            </div>
          </div>
          {!hasContact && (
            <p className="text-[0.625rem] font-mono text-status-danger-text mt-1">
              연락처를 최소 하나 입력해주세요
            </p>
          )}
        </div>

        {/* Requirements */}
        <div>
          <label className="block text-[0.625rem] font-medium text-txt-tertiary mb-1.5">
            요청사항 <span className="text-txt-disabled font-normal">(선택)</span>
          </label>
          <textarea
            value={requirements}
            onChange={e => setRequirements(e.target.value)}
            rows={2}
            placeholder="포트폴리오, 이력서 등 요청할 내용이 있다면 작성하세요..."
            className="w-full px-3 py-2.5 text-sm border border-border bg-surface-card rounded-lg text-txt-primary placeholder:text-txt-disabled focus:outline-none focus:border-brand resize-none"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2 text-xs font-bold border border-border text-txt-secondary hover:bg-surface-sunken transition-colors"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || !hasContact}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-surface-inverse text-txt-inverse border border-surface-inverse hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {isLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
          초대편지 보내기
        </button>
      </div>
    </Modal>
  )
}
