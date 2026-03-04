'use client'

import React from 'react'
import { X, Lightbulb, Folder, MessageSquare, FileUp } from 'lucide-react'
import { useRouter } from 'next/navigation'

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

  if (!isOpen) return null

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-[400px] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white">
              <Icon size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-gray-900">{current.title}</h2>
              <p className="text-sm text-gray-500">{current.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Options */}
        <div className="p-6 pt-4 space-y-3">
          {/* AI 옵션 - 추천 */}
          <button
            onClick={handleAI}
            className="w-full p-4 bg-gray-900 rounded-xl text-left group hover:bg-gray-800 transition-colors relative overflow-hidden"
          >
            <div className="absolute top-3 right-3 px-2 py-0.5 bg-white/20 text-white text-[10px] font-medium rounded-full">
              추천
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white">
                <MessageSquare size={18} />
              </div>
              <div>
                <div className="font-medium text-white text-sm">{current.aiLabel}</div>
                <div className="text-xs text-gray-400 mt-0.5">{current.aiDescription}</div>
              </div>
            </div>
          </button>

          {/* 문서 업로드 옵션 */}
          <button
            onClick={handleUpload}
            className="w-full p-4 border border-gray-200 rounded-xl text-left group hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 group-hover:bg-gray-200 transition-colors">
                <FileUp size={18} />
              </div>
              <div>
                <div className="font-medium text-gray-900 text-sm">{current.uploadLabel}</div>
                <div className="text-xs text-gray-500 mt-0.5">{current.uploadDescription}</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateModal
