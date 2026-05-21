'use client'

import React, { useState, useCallback } from 'react'
import { Upload, FileJson, Sparkles, X, AlertCircle, CheckCircle2, Clipboard, FileText } from 'lucide-react'
import { ValidationResult, mapIdeaToBusinessPlan, IdeaToBusinessPlanResult, getMappingSummary } from '@/lib/ideaToBusinessPlan'
import { FormTemplateType } from '@/lib/types'

interface IdeaUploaderProps {
  isOpen: boolean
  onClose: () => void
  onImport: (result: IdeaToBusinessPlanResult, templateType: FormTemplateType) => void
}

export const IdeaUploader: React.FC<IdeaUploaderProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [jsonInput, setJsonInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [parsedResult, setParsedResult] = useState<IdeaToBusinessPlanResult | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplateType>('yebi-chogi')
  const [isDragging, setIsDragging] = useState(false)

  const parseAndValidate = useCallback((input: string) => {
    setError(null)
    setParsedResult(null)

    if (!input.trim()) {
      return
    }

    try {
      const parsed = JSON.parse(input) as ValidationResult

      // Validate required fields
      if (!parsed.projectIdea) {
        setError('projectIdea 필드가 필요합니다')
        return
      }

      // Map to business plan
      const result = mapIdeaToBusinessPlan(parsed, selectedTemplate)
      setParsedResult(result)
    } catch (e) {
      setError('유효한 JSON 형식이 아닙니다')
    }
  }, [selectedTemplate])

  const handleTextChange = (value: string) => {
    setJsonInput(value)
    parseAndValidate(value)
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setJsonInput(text)
      parseAndValidate(text)
    } catch {
      setError('클립보드에서 붙여넣기를 할 수 없습니다')
    }
  }

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/json') {
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        setJsonInput(text)
        parseAndValidate(text)
      }
      reader.readAsText(file)
    } else {
      setError('JSON 파일만 업로드할 수 있습니다')
    }
  }, [parseAndValidate])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        setJsonInput(text)
        parseAndValidate(text)
      }
      reader.readAsText(file)
    }
  }

  const handleImport = () => {
    if (parsedResult) {
      onImport(parsedResult, selectedTemplate)
      onClose()
    }
  }

  const loadSampleData = () => {
    const sampleData: ValidationResult = {
      id: 'sample_001',
      timestamp: Date.now(),
      projectIdea: 'AI 기반 스타트업 멘토링 플랫폼',
      conversationHistory: '',
      reflectedAdvice: [
        '초기 고객 확보를 위한 무료 체험 기간 제공',
        '멘토 풀 다양화를 통한 서비스 차별화',
        '데이터 기반 매칭 알고리즘 고도화',
      ],
      artifacts: {
        prd: JSON.stringify({
          projectName: 'MentorMatch',
          tagline: 'AI가 찾아주는 나만의 스타트업 멘토',
          version: '1.0',
          overview: '초기 스타트업 창업자들이 적합한 멘토를 찾는데 어려움을 겪고 있습니다. MentorMatch는 AI 기반 매칭 알고리즘을 통해 창업자의 산업, 단계, 목표에 맞는 최적의 멘토를 연결해드립니다.',
          targetAudience: [
            '초기 스타트업 창업자 (시드~시리즈A)',
            '신규 사업을 준비하는 예비 창업자',
            '피봇을 고려하는 기존 사업자',
          ],
          coreFeatures: [
            {
              name: 'AI 멘토 매칭',
              description: '창업자의 프로필, 산업, 현재 고민을 분석하여 최적의 멘토 3인을 추천',
              priority: 'High' as const,
              effort: 'High' as const,
            },
            {
              name: '실시간 화상 멘토링',
              description: '내장된 화상 회의 시스템으로 별도 툴 없이 바로 멘토링 진행',
              priority: 'High' as const,
              effort: 'Medium' as const,
            },
            {
              name: '멘토링 이력 관리',
              description: '과거 멘토링 내용 요약, 액션 아이템 추적, 성장 기록 대시보드',
              priority: 'Medium' as const,
              effort: 'Medium' as const,
            },
          ],
          techStack: ['Next.js', 'TypeScript', 'OpenAI API', 'Supabase', 'WebRTC'],
          successMetrics: [
            '월 활성 매칭 500건 달성',
            '멘토링 후 만족도 4.5/5.0 이상',
            '재이용률 60% 이상',
          ],
        }),
        jd: JSON.stringify({
          roleTitle: 'Full-Stack Developer',
          department: 'Engineering',
          companyIntro: 'MentorMatch는 AI 기반 스타트업 멘토링 플랫폼입니다.',
          responsibilities: [
            'Next.js 기반 웹 애플리케이션 개발 및 유지보수',
            'AI 매칭 알고리즘 구현 및 최적화',
            'WebRTC 기반 실시간 통신 기능 개발',
          ],
          qualifications: [
            'React/Next.js 3년 이상 경험',
            'TypeScript 숙련자',
            'RESTful API 설계 및 개발 경험',
          ],
          preferred: [
            'AI/ML 프로젝트 경험',
            '스타트업 경험',
            'WebRTC 경험',
          ],
          benefits: [
            '스톡옵션 지급',
            '유연 근무제',
            '교육비 지원',
          ],
        }),
      },
      score: 82,
      personaScores: {
        developer: 85,
        designer: 78,
        vc: 80,
      },
      actionPlan: {
        developer: [
          'MVP 개발 및 베타 테스트 진행',
          'AI 매칭 알고리즘 프로토타입 구현',
        ],
        designer: [
          '사용자 플로우 최적화',
          '멘토 프로필 UI 디자인',
        ],
        vc: [
          '초기 멘토 풀 확보 (50명)',
          '베타 사용자 모집 (100명)',
        ],
      },
    }

    const jsonString = JSON.stringify(sampleData, null, 2)
    setJsonInput(jsonString)
    parseAndValidate(jsonString)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden mx-4 border border-[#E5E7EB]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#111827] rounded-xl flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#111827]">검증된 아이디어 불러오기</h2>
              <p className="text-sm text-[#6B7280]">AI로 검증한 아이디어 데이터를 불러와 자동으로 채웁니다</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors">
            <X size={20} className="text-[#6B7280]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Template Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#374151] mb-2">
              사업계획서 양식 선택
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => {
                setSelectedTemplate(e.target.value as FormTemplateType)
                if (jsonInput) parseAndValidate(jsonInput)
              }}
              className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] bg-white text-[#111827]"
            >
              <option value="yebi-chogi">예비/초기창업패키지 (15p)</option>
              <option value="student-300">학생창업유망팀300 (15p)</option>
              <option value="saengae-chungnyeon">생애최초청년창업 (9p)</option>
              <option value="oneul-jeongtong">오늘전통 (10p)</option>
              <option value="gyeonggi-g-star">경기G스타오디션 (10p)</option>
            </select>
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center transition-all mb-4
              ${isDragging
                ? 'border-[#3B82F6] bg-[#EFF6FF]'
                : 'border-[#E5E7EB] hover:border-[#D1D5DB]'
              }
            `}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-[#F3F4F6] rounded-2xl flex items-center justify-center">
                <FileJson size={32} className="text-[#6B7280]" />
              </div>
              <div>
                <p className="font-medium text-[#374151] mb-1">
                  JSON 파일을 드래그하거나 클릭하여 업로드
                </p>
                <p className="text-sm text-[#6B7280]">
                  또는 아래에 JSON을 직접 붙여넣으세요
                </p>
              </div>
              <div className="flex gap-3">
                <label className="px-4 py-2 bg-[#F3F4F6] text-[#374151] rounded-lg text-sm font-medium cursor-pointer hover:bg-[#E5E7EB] transition-colors">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Upload size={16} className="inline mr-2" />
                  파일 선택
                </label>
                <button
                  onClick={handlePaste}
                  className="px-4 py-2 bg-[#F3F4F6] text-[#374151] rounded-lg text-sm font-medium hover:bg-[#E5E7EB] transition-colors"
                >
                  <Clipboard size={16} className="inline mr-2" />
                  클립보드에서 붙여넣기
                </button>
                <button
                  onClick={loadSampleData}
                  className="px-4 py-2 bg-[#FFFBEB] text-[#92400E] rounded-lg text-sm font-medium hover:bg-[#FEF3C7] transition-colors"
                >
                  <FileText size={16} className="inline mr-2" />
                  샘플 데이터
                </button>
              </div>
            </div>
          </div>

          {/* JSON Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#374151] mb-2">
              JSON 데이터
            </label>
            <textarea
              value={jsonInput}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder='{"projectIdea": "...", "artifacts": {"prd": {...}}}'
              rows={10}
              className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] resize-none text-[#374151]"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-lg mb-4">
              <AlertCircle size={18} className="text-[#EF4444]" />
              <span className="text-sm text-[#991B1B]">{error}</span>
            </div>
          )}

          {/* Success Preview */}
          {parsedResult && (
            <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={18} className="text-[#10B981]" />
                <span className="font-medium text-[#166534]">아이디어 분석 완료</span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">아이템명</span>
                  <span className="font-medium text-[#111827]">
                    {parsedResult.businessPlan.basicInfo.itemName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">자동 완성 필드</span>
                  <span className="font-medium text-[#111827]">
                    {parsedResult.mappingSummary.filledFields}/{parsedResult.mappingSummary.totalFields}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">완성도</span>
                  <span className="font-medium text-[#111827]">
                    {Math.round(parsedResult.mappingSummary.confidence * 100)}%
                  </span>
                </div>
                <div className="pt-2 border-t border-[#BBF7D0]">
                  <span className="text-[#166534]">{getMappingSummary(parsedResult)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
          <p className="text-xs text-[#6B7280]">
            * main 앱의 Idea Validator에서 export한 JSON을 사용하세요
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[#6B7280] hover:bg-[#F3F4F6] rounded-lg transition-colors text-sm"
            >
              취소
            </button>
            <button
              onClick={handleImport}
              disabled={!parsedResult}
              className="px-6 py-2 bg-[#111827] text-white rounded-lg hover:bg-[#374151] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Sparkles size={16} />
              사업계획서 생성
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IdeaUploader
