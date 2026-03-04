'use client'

import React, { useState, useCallback, useRef } from 'react'
import { X, FileUp, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

export interface StructuredIdea {
  problem: string
  solution: string
  target: string
}

export interface SaveData {
  text: string
  structured: StructuredIdea
}

interface DirectInputModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: SaveData) => Promise<void>
  type: 'idea' | 'project'
}

type ModalStep = 'upload' | 'processing' | 'structured'

const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.pptx', '.txt']

export const DirectInputModal: React.FC<DirectInputModalProps> = ({
  isOpen,
  onClose,
  onSave,
  type,
}) => {
  const [step, setStep] = useState<ModalStep>('upload')
  const [structuredData, setStructuredData] = useState<StructuredIdea>({
    problem: '',
    solution: '',
    target: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [processingStatus, setProcessingStatus] = useState('')
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const config = {
    idea: {
      title: '문서 분석',
      description: '사업계획서를 업로드하면 AI가 핵심을 추출합니다',
    },
    project: {
      title: '문서 분석',
      description: '기획서를 업로드하면 AI가 핵심을 추출합니다',
    },
  }

  const current = config[type]

  // PDF 파일을 서버로 전송하여 AI 구조화
  const structurePdfWithAI = useCallback(async (file: File): Promise<StructuredIdea> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/pdf-structure', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'AI 처리 중 오류가 발생했습니다')
    }

    const { data } = await response.json()
    return data
  }, [])

  // 파일 처리 핸들러
  const handleFile = useCallback(async (file: File) => {
    const ext = '.' + file.name.toLowerCase().split('.').pop()
    const isSupported = SUPPORTED_EXTENSIONS.includes(ext)

    if (!isSupported) {
      setError('지원 형식: PDF, DOCX, PPTX, TXT')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB 이하여야 합니다')
      return
    }

    setError(null)
    setStep('processing')

    try {
      setProcessingStatus('문서를 분석하고 있습니다...')
      const structured = await structurePdfWithAI(file)
      setStructuredData(structured)
      setStep('structured')
    } catch (err) {
      setError(err instanceof Error ? err.message : '문서 처리 중 오류가 발생했습니다')
      setStep('upload')
    }
  }, [structurePdfWithAI])

  // 파일 선택 핸들러
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
    e.target.value = ''
  }, [handleFile])

  // 드래그앤드롭 핸들러
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  // 저장 핸들러
  const handleSave = async () => {
    if (!structuredData.problem && !structuredData.solution && !structuredData.target) {
      setError('내용을 입력해주세요')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await onSave({
        text: `${structuredData.problem}\n${structuredData.solution}\n${structuredData.target}`,
        structured: structuredData,
      })
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  // 모달 닫기 (상태 초기화)
  const handleClose = () => {
    setStructuredData({ problem: '', solution: '', target: '' })
    setStep('upload')
    setError(null)
    setProcessingStatus('')
    setIsDragging(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white">
              <FileUp size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-gray-900">{current.title}</h2>
              <p className="text-sm text-gray-500">{current.description}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Processing Step */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative mb-6">
                <div className="w-14 h-14 border-[3px] border-gray-100 rounded-full" />
                <div className="absolute inset-0 w-14 h-14 border-[3px] border-gray-900 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">{processingStatus}</p>
              <p className="text-xs text-gray-400">잠시만 기다려주세요</p>
            </div>
          )}

          {/* Upload Step */}
          {step === 'upload' && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative p-12 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-200
                ${isDragging
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.pptx,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-4">
                <div className={`
                  w-14 h-14 rounded-2xl flex items-center justify-center transition-colors
                  ${isDragging ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'}
                `}>
                  <FileUp size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    파일을 드래그하거나 클릭하여 선택
                  </p>
                  <p className="text-xs text-gray-400">
                    PDF, DOCX, PPTX, TXT · 최대 10MB
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Structured Step */}
          {step === 'structured' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-3 rounded-xl">
                <CheckCircle2 size={18} />
                <span className="text-sm font-medium">분석이 완료되었습니다</span>
              </div>

              {/* Problem Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Problem
                  <span className="text-gray-400 font-normal ml-1">해결하려는 문제</span>
                </label>
                <textarea
                  value={structuredData.problem}
                  onChange={(e) => setStructuredData(prev => ({ ...prev, problem: e.target.value }))}
                  className="w-full h-24 px-4 py-3 bg-gray-50 border-0 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm placeholder:text-gray-400 transition-shadow"
                  placeholder="해결하려는 문제를 입력하세요..."
                />
              </div>

              {/* Solution Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Solution
                  <span className="text-gray-400 font-normal ml-1">핵심 솔루션</span>
                </label>
                <textarea
                  value={structuredData.solution}
                  onChange={(e) => setStructuredData(prev => ({ ...prev, solution: e.target.value }))}
                  className="w-full h-24 px-4 py-3 bg-gray-50 border-0 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm placeholder:text-gray-400 transition-shadow"
                  placeholder="핵심 솔루션을 입력하세요..."
                />
              </div>

              {/* Target Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target
                  <span className="text-gray-400 font-normal ml-1">타겟 고객</span>
                </label>
                <textarea
                  value={structuredData.target}
                  onChange={(e) => setStructuredData(prev => ({ ...prev, target: e.target.value }))}
                  className="w-full h-24 px-4 py-3 bg-gray-50 border-0 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm placeholder:text-gray-400 transition-shadow"
                  placeholder="타겟 고객을 입력하세요..."
                />
              </div>

              {/* Back link */}
              <button
                onClick={() => {
                  setStep('upload')
                  setStructuredData({ problem: '', solution: '', target: '' })
                }}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← 다른 파일 선택
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 px-4 py-3 bg-red-50 rounded-xl text-sm text-red-600 flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'structured' && (
          <div className="p-6 pt-0 flex justify-end gap-3 shrink-0">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || (!structuredData.problem && !structuredData.solution && !structuredData.target)}
              className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  저장 중...
                </>
              ) : (
                '저장하기'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default DirectInputModal
