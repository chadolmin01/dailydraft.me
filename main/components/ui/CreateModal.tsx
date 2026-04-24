'use client'

import React from 'react'
import { Lightbulb, Folder, MessageSquare, FileUp, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Modal } from './Modal'

interface CreateModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'idea' | 'project'
  onPdfUpload?: () => void
}

export const CreateModal: React.FC<CreateModalProps> = ({
  isOpen,
  onClose,
  type,
  onPdfUpload,
}) => {
  const router = useRouter()

  const config = {
    idea: {
      title: '새 아이디어',
      description: '아이디어를 추가하는 방법을 선택하세요',
      icon: Lightbulb,
      aiPath: '/messages?mode=validator',
      aiLabel: 'AI와 함께 검증',
      aiDescription: 'AI가 아이디어를 분석하고 피드백을 제공합니다',
      uploadLabel: '문서 업로드',
      uploadDescription: 'PDF, DOCX, PPTX 파일을 AI가 분석합니다',
    },
    project: {
      title: '새 프로젝트',
      description: '프로젝트를 시작하는 방법을 선택하세요',
      icon: Folder,
      aiPath: '/messages?mode=project',
      aiLabel: 'AI와 함께 작성',
      aiDescription: 'AI가 PRD 작성을 도와드립니다',
      uploadLabel: '문서 업로드',
      uploadDescription: 'PDF, DOCX, PPTX 파일을 AI가 분석합니다',
    },
  }

  const current = config[type]
  const Icon = current.icon

  const handleAI = () => {
    onClose()
    router.push(current.aiPath)
  }

  const handleUpload = () => {
    onClose()
    onPdfUpload?.()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} showClose={false} className="max-w-100 bg-surface-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-surface-inverse flex items-center justify-center text-txt-inverse shadow-sm">
            <Icon size={18} />
          </div>
          <div>
            <h2 className="font-bold text-lg text-txt-primary">{current.title}</h2>
            <p className="text-sm text-txt-secondary">{current.description}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-surface-sunken transition-colors border border-transparent hover:border-border"
        >
          <X size={18} className="text-txt-tertiary" />
        </button>
      </div>

      {/* Options */}
      <div className="p-6 pt-4 space-y-3">
        {/* AI 옵션 - 추천 */}
        <button
          onClick={handleAI}
          className="w-full p-4 bg-brand text-left group hover:bg-brand-hover transition-colors relative overflow-hidden border border-brand hover:opacity-90 active:scale-[0.97]"
        >
          <div className="absolute top-3 right-3 px-2 py-0.5 bg-white/20 text-white text-[10px] font-medium">
            추천
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <MessageSquare size={18} />
            </div>
            <div>
              <div className="font-bold text-white text-sm">{current.aiLabel}</div>
              <div className="text-xs text-white/60 mt-0.5">{current.aiDescription}</div>
            </div>
          </div>
        </button>

        {/* 문서 업로드 옵션 */}
        <button
          onClick={handleUpload}
          className="w-full p-4 border border-border text-left group hover:bg-surface-sunken transition-all shadow-md hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface-sunken rounded-xl border border-border flex items-center justify-center text-txt-secondary group-hover:bg-border transition-colors">
              <FileUp size={18} />
            </div>
            <div>
              <div className="font-bold text-txt-primary text-sm">{current.uploadLabel}</div>
              <div className="text-xs text-txt-tertiary mt-0.5">{current.uploadDescription}</div>
            </div>
          </div>
        </button>
      </div>
    </Modal>
  )
}

export default CreateModal
