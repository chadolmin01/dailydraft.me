'use client'

import React, { useState } from 'react'
import { X, Download, FileText, Loader2 } from 'lucide-react'
import { BusinessPlanData, FormTemplate, getIndustryName } from '@/lib/types'

interface PreviewModalProps {
  data: BusinessPlanData
  sectionData: Record<string, Record<string, string>>
  template: FormTemplate
  onClose: () => void
}

export default function PreviewModal({
  data,
  sectionData,
  template,
  onClose,
}: PreviewModalProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExportPdf = async () => {
    setIsExporting(true)

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'pdf',
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

      // Download the PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${data.basicInfo.itemName || '사업계획서'}_${template.shortName}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      alert('PDF 생성 중 오류가 발생했습니다.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-5xl h-[95vh] rounded-lg shadow-2xl flex flex-col">
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
              onClick={handleExportPdf}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              PDF 다운로드
            </button>

            <div className="w-px h-6 bg-gray-200" />

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-100">
          <div className="max-w-[210mm] mx-auto bg-white shadow-lg">
            {/* Cover Page */}
            <div className="p-12 min-h-[297mm] flex flex-col">
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold mb-8">
                  {template.name}
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {data.basicInfo.itemName || '사업계획서'}
                </h1>
                <p className="text-xl text-gray-600 mb-12">
                  {data.basicInfo.oneLiner}
                </p>
              </div>

              {/* Basic Info */}
              <div className="border-t border-gray-200 pt-8 max-w-md mx-auto w-full">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 text-gray-500 w-32">타겟 고객</td>
                      <td className="py-3 text-gray-900 font-medium">{data.basicInfo.targetCustomer}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 text-gray-500">업종</td>
                      <td className="py-3 text-gray-900 font-medium">
                        {getIndustryName(data.basicInfo.industry)}
                      </td>
                    </tr>
                    {data.basicInfo.fundingAmount && (
                      <tr className="border-b border-gray-100">
                        <td className="py-3 text-gray-500">희망 지원금</td>
                        <td className="py-3 text-gray-900 font-medium">
                          {data.basicInfo.fundingAmount.toLocaleString()}만원
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div className="text-center mt-12 text-gray-500 text-sm">
                  {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Content Pages */}
            <div className="p-12 border-t border-gray-200">
              {/* Main Sections */}
              {template.sections.map((section, sectionIndex) => (
                <div key={section.type} className="mb-12">
                  <div className="bg-gray-100 border-l-4 border-blue-600 px-4 py-3 mb-4">
                    <h2 className="text-lg font-bold text-gray-900">
                      {sectionIndex + 1}. {section.title}
                    </h2>
                    <p className="text-xs text-blue-600 font-medium mt-1">
                      배점: {section.weight}점
                    </p>
                  </div>

                  <div className="space-y-6 px-4">
                    {section.fields.map((field) => {
                      const value = sectionData[section.type]?.[field.id]
                      return (
                        <div key={field.id}>
                          <h3 className="text-sm font-semibold text-gray-700 mb-2 pb-2 border-b border-dotted border-gray-300">
                            {field.label}
                          </h3>
                          {value ? (
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                              {value}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400 italic">
                              작성 필요
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Extra Sections */}
              {template.extraSections?.map((section, index) => (
                <div key={section.type} className="mb-12 bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <div className="bg-gray-200 border-l-4 border-gray-500 px-4 py-3 mb-4">
                    <h2 className="text-lg font-bold text-gray-900">
                      {template.sections.length + index + 1}. {section.title}
                    </h2>
                    <p className="text-xs text-gray-600 font-medium mt-1">
                      배점: {section.weight}점
                    </p>
                  </div>

                  <div className="space-y-6 px-4">
                    {section.fields.map((field) => {
                      const value = sectionData[section.type]?.[field.id]
                      return (
                        <div key={field.id}>
                          <h3 className="text-sm font-semibold text-gray-700 mb-2 pb-2 border-b border-dotted border-gray-300">
                            {field.label}
                          </h3>
                          {value ? (
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                              {value}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400 italic">
                              작성 필요
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
            <div className="px-12 pb-8 text-center border-t border-gray-200 pt-8">
              <p className="text-xs text-gray-400">
                Draft Documentation으로 작성됨 | {new Date().toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
