'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { BusinessPlanEditor } from '@/components/BusinessPlanEditor'
import { FormTemplateType, BusinessPlanData } from '@/lib/types'

interface ImportedData {
  businessPlan: BusinessPlanData
  sectionData: Record<string, Record<string, string>>
  mappingSummary: {
    filledFields: number
    totalFields: number
    confidence: number
  }
}

export default function EditorPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = params.template as FormTemplateType
  const isImported = searchParams.get('imported') === 'true'

  const [importedData, setImportedData] = useState<ImportedData | null>(null)
  const [isLoading, setIsLoading] = useState(isImported)

  useEffect(() => {
    if (isImported) {
      try {
        const stored = sessionStorage.getItem('importedIdea')
        if (stored) {
          const data = JSON.parse(stored) as ImportedData
          setImportedData(data)
          // Clear the stored data
          sessionStorage.removeItem('importedIdea')
        }
      } catch (error) {
        console.error('Failed to load imported data:', error)
      }
      setIsLoading(false)
    }
  }, [isImported])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">아이디어 데이터 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <BusinessPlanEditor
      templateType={templateId}
      initialData={importedData?.businessPlan}
      initialSectionData={importedData?.sectionData}
      onClose={() => router.push('/')}
    />
  )
}
