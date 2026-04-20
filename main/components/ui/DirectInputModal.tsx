'use client'

import React, { useState, useCallback, useRef } from 'react'
import { X, FileUp, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

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

  return (
    <Modal isOpen={isOpen} onClose={handleClose} showClose={false} className="max-w-lg bg-surface-card overflow-hidden max-h-[85vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-0 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-surface-inverse flex items-center justify-center text-txt-inverse shadow-sm">
            <FileUp size={18} />
          </div>
          <div>
            <h2 className="font-bold text-lg text-txt-primary">{current.title}</h2>
            <p className="text-sm text-txt-tertiary">{current.description}</p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="p-2 hover:bg-surface-sunken transition-colors border border-transparent hover:border-border"
          aria-label="닫기"
        >
          <X size={18} className="text-txt-tertiary" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto flex-1">
        {/* Processing Step */}
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative mb-6">
              <div className="w-14 h-14 border-[3px] border-border-subtle" />
              <div className="absolute inset-0 w-14 h-14 border-[3px] border-border border-t-transparent animate-spin" />
            </div>
            <p className="text-sm font-medium text-txt-primary mb-1">{processingStatus}</p>
            <p className="text-xs text-txt-tertiary">잠시만 기다려주세요</p>
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
              relative p-12 border text-center cursor-pointer transition-all duration-200
              ${isDragging
                ? 'border-border bg-surface-sunken'
                : 'border-border hover:border-border hover:bg-surface-sunken'
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
                w-14 h-14 flex items-center justify-center transition-colors
                ${isDragging ? 'bg-surface-inverse text-txt-inverse' : 'bg-surface-sunken text-txt-tertiary'}
              `}>
                <FileUp size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-txt-primary mb-1">
                  파일을 드래그하거나 클릭하여 선택
                </p>
                <p className="text-xs text-txt-tertiary">
                  PDF, DOCX, PPTX, TXT · 최대 10MB
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Structured Step */}
        {step === 'structured' && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-indicator-online bg-status-success-bg px-4 py-3 border border-indicator-online/20">
              <CheckCircle2 size={18} />
              <span className="text-sm font-medium">분석이 완료되었습니다</span>
            </div>

            {/* Problem Field */}
            <div>
              <label htmlFor="direct-input-problem" className="block text-[10px] font-medium text-txt-tertiary mb-2">
                Problem
                <span className="text-txt-disabled font-normal ml-1 normal-case tracking-normal">해결하려는 문제</span>
              </label>
              <textarea
                id="direct-input-problem"
                value={structuredData.problem}
                onChange={(e) => setStructuredData(prev => ({ ...prev, problem: e.target.value }))}
                className="w-full h-24 px-4 py-3 bg-surface-sunken rounded-xl border border-border focus:border-border resize-none focus:outline-none focus:ring-2 focus:ring-brand text-base sm:text-sm placeholder:text-txt-disabled transition-shadow"
                placeholder="해결하려는 문제를 입력하세요..."
              />
            </div>

            {/* Solution Field */}
            <div>
              <label htmlFor="direct-input-solution" className="block text-[10px] font-medium text-txt-tertiary mb-2">
                Solution
                <span className="text-txt-disabled font-normal ml-1 normal-case tracking-normal">핵심 솔루션</span>
              </label>
              <textarea
                id="direct-input-solution"
                value={structuredData.solution}
                onChange={(e) => setStructuredData(prev => ({ ...prev, solution: e.target.value }))}
                className="w-full h-24 px-4 py-3 bg-surface-sunken rounded-xl border border-border focus:border-border resize-none focus:outline-none focus:ring-2 focus:ring-brand text-base sm:text-sm placeholder:text-txt-disabled transition-shadow"
                placeholder="핵심 솔루션을 입력하세요..."
              />
            </div>

            {/* Target Field */}
            <div>
              <label htmlFor="direct-input-target" className="block text-[10px] font-medium text-txt-tertiary mb-2">
                Target
                <span className="text-txt-disabled font-normal ml-1 normal-case tracking-normal">타겟 고객</span>
              </label>
              <textarea
                id="direct-input-target"
                value={structuredData.target}
                onChange={(e) => setStructuredData(prev => ({ ...prev, target: e.target.value }))}
                className="w-full h-24 px-4 py-3 bg-surface-sunken rounded-xl border border-border focus:border-border resize-none focus:outline-none focus:ring-2 focus:ring-brand text-base sm:text-sm placeholder:text-txt-disabled transition-shadow"
                placeholder="타겟 고객을 입력하세요..."
              />
            </div>

            {/* Back link */}
            <button
              onClick={() => {
                setStep('upload')
                setStructuredData({ problem: '', solution: '', target: '' })
              }}
              className="text-sm text-txt-tertiary hover:text-txt-secondary transition-colors"
            >
              ← 다른 파일 선택
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 px-4 py-3 bg-status-danger-text/5 border border-status-danger-text/20 text-sm text-status-danger-text flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>

      {/* Footer */}
      {step === 'structured' && (
        <div className="p-6 pt-0 flex justify-end gap-3 shrink-0">
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
            취소
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isLoading || (!structuredData.problem && !structuredData.solution && !structuredData.target)}
            loading={isLoading}
          >
            {isLoading ? '저장 중...' : '저장하기'}
          </Button>
        </div>
      )}
    </Modal>
  )
}

export default DirectInputModal
