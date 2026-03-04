'use client'

import React, { useState, useRef } from 'react'
import { X, Download, FileText, File, Loader2, Printer } from 'lucide-react'
import {
  BusinessPlanData,
  FormTemplate,
  getIndustryName,
} from '../../src/types/business-plan'

interface PreviewModalProps {
  data: BusinessPlanData
  sectionData: Record<string, Record<string, string>>
  template: FormTemplate | undefined
  onClose: () => void
  /** 워크플로우 완료 콜백 (워크플로우 모드에서만 표시) */
  onComplete?: () => void
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  data,
  sectionData,
  template,
  onClose,
  onComplete,
}) => {
  const [isExporting, setIsExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<'pdf' | 'docx' | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  if (!template) return null

  const handleExport = async (format: 'pdf' | 'docx') => {
    setIsExporting(true)
    setExportFormat(format)

    try {
      const response = await fetch('/api/business-plan/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          data,
          sectionData,
          template: {
            name: template.name,
            shortName: template.shortName,
            sections: template.sections,
            extraSections: template.extraSections,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const result = await response.json()

      if (format === 'pdf') {
        // Use browser's print functionality for PDF
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          printWindow.document.write(result.htmlContent)
          printWindow.document.close()
          printWindow.onload = () => {
            printWindow.print()
          }
        }
      } else if (format === 'docx') {
        // For DOCX, we would need to implement client-side generation
        // Using the docx library
        alert('DOCX 내보내기는 곧 지원될 예정입니다.')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('내보내기 중 오류가 발생했습니다.')
    } finally {
      setIsExporting(false)
      setExportFormat(null)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-5xl h-[95vh] rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <FileText className="text-gray-400" size={20} />
            <div>
              <h3 className="font-bold text-gray-900">미리보기</h3>
              <p className="text-xs text-gray-500">{template.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Printer size={16} />
              인쇄
            </button>

            <div className="w-px h-6 bg-gray-200" />

            <button
              type="button"
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-draft-blue rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
            >
              {isExporting && exportFormat === 'pdf' ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              PDF
            </button>

            <button
              type="button"
              onClick={() => handleExport('docx')}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isExporting && exportFormat === 'docx' ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <File size={16} />
              )}
              DOCX
            </button>

            {onComplete && (
              <>
                <div className="w-px h-6 bg-gray-200" />
                <button
                  type="button"
                  onClick={onComplete}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  워크플로우 완료
                </button>
              </>
            )}

            <div className="w-px h-6 bg-gray-200" />

            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="닫기"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-100 print:p-0 print:bg-white">
          <div
            ref={previewRef}
            className="max-w-[210mm] mx-auto bg-white shadow-lg print:shadow-none"
          >
            {/* Cover Page */}
            <div className="p-12 min-h-[297mm] flex flex-col print:page-break-after-always">
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {data.basicInfo.itemName || '사업계획서'}
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  {data.basicInfo.oneLiner}
                </p>
                <div className="px-6 py-3 border border-gray-300 rounded-sm text-gray-500">
                  {template.name}
                </div>
              </div>

              {/* Basic Info */}
              <div className="border-t border-gray-200 pt-8 max-w-md mx-auto w-full">
                <div className="space-y-3 text-sm">
                  <div className="flex">
                    <span className="w-24 text-gray-500">타겟 고객</span>
                    <span className="flex-1 text-gray-900">{data.basicInfo.targetCustomer}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-gray-500">업종</span>
                    <span className="flex-1 text-gray-900">
                      {getIndustryName(data.basicInfo.industry)}
                    </span>
                  </div>
                  {data.basicInfo.fundingAmount && (
                    <div className="flex">
                      <span className="w-24 text-gray-500">희망 지원금</span>
                      <span className="flex-1 text-gray-900">
                        {data.basicInfo.fundingAmount.toLocaleString()}만원
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content Pages */}
            <div className="p-12">
              {/* Main Sections */}
              {template.sections.map((section) => (
                <div
                  key={section.type}
                  className="mb-12 print:page-break-inside-avoid"
                >
                  <div className="border-b-2 border-gray-800 pb-2 mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                      {section.title}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      배점: {section.weight}점
                    </p>
                  </div>

                  <div className="space-y-6">
                    {section.fields.map((field) => {
                      const value = sectionData[section.type]?.[field.id]
                      return (
                        <div key={field.id}>
                          <h3 className="text-sm font-semibold text-gray-700 mb-2">
                            {field.label}
                          </h3>
                          {value ? (
                            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                              {value}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400 italic">
                              작성이 필요합니다
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Extra Sections */}
              {template.extraSections?.map((section) => (
                <div
                  key={section.type}
                  className="mb-12 p-6 bg-gray-50 rounded-sm print:page-break-inside-avoid"
                >
                  <div className="border-b border-gray-300 pb-2 mb-6">
                    <h2 className="text-lg font-bold text-gray-900">
                      {section.title}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      배점: {section.weight}점
                    </p>
                  </div>

                  <div className="space-y-6">
                    {section.fields.map((field) => {
                      const value = sectionData[section.type]?.[field.id]
                      return (
                        <div key={field.id}>
                          <h3 className="text-sm font-semibold text-gray-700 mb-2">
                            {field.label}
                          </h3>
                          {value ? (
                            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                              {value}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400 italic">
                              작성이 필요합니다
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-12 pb-8 text-center">
              <p className="text-xs text-gray-400">
                Draft로 작성됨 | {new Date().toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PreviewModal
