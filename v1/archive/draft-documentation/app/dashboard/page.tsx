'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, ArrowRight, LogOut } from 'lucide-react'
import { useAuth } from '@/src/context/AuthContext'
import { IdeaUploader } from '@/components/IdeaUploader'
import { FormTemplateType } from '@/lib/types'
import { IdeaToBusinessPlanResult } from '@/lib/ideaToBusinessPlan'

const templates = [
  { id: 'yebi-chogi', name: 'PSST 표준 사업계획서', desc: '정부지원사업 합격 표준 양식', pages: '15p' },
  { id: 'student-300', name: '학생창업유망팀300', desc: '학생 창업팀 전용 양식', pages: '15p' },
  { id: 'saengae-chungnyeon', name: '생애최초청년창업', desc: '청년 창업자 전용 양식', pages: '9p' },
  { id: 'oneul-jeongtong', name: '오늘전통', desc: '전통문화 사업 양식', pages: '10p' },
  { id: 'gyeonggi-g-star', name: '경기G스타오디션', desc: '경기도 스타트업 양식', pages: '10p' },
]

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile, isLoading, isAuthenticated, signOut } = useAuth()
  const [showUploader, setShowUploader] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  const handleIdeaImport = (result: IdeaToBusinessPlanResult, templateType: FormTemplateType) => {
    sessionStorage.setItem('importedIdea', JSON.stringify({
      businessPlan: result.businessPlan,
      sectionData: result.sectionData,
      mappingSummary: result.mappingSummary,
    }))
    router.push(`/editor/${templateType}?imported=true`)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E5E7EB] border-t-[#111827] rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-white bg-grid">
      {/* Header */}
      <header className="border-b border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-[#111827]" />
            <span className="font-semibold text-[#111827]">Draft Documentation</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#6B7280]">{profile?.nickname || user?.email}</span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111827] transition-colors"
            >
              <LogOut size={14} />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex gap-16">
          {/* Left: Hero */}
          <div className="flex-1">
            <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide mb-3">
              Government Business Plan Generator
            </p>
            <h1 className="text-3xl font-bold text-[#111827] mb-4 leading-tight">
              정부지원 사업계획서<br />
              <span className="text-[#3B82F6]">쉽고 빠르게</span> 작성하세요
            </h1>
            <p className="text-[#6B7280] mb-8 leading-relaxed">
              5종 정부양식을 지원하며, AI로 검증된 아이디어를 불러와<br />
              자동으로 사업계획서를 채울 수 있습니다.
            </p>
            <button
              onClick={() => setShowUploader(true)}
              className="flex items-center gap-2 h-11 px-6 bg-[#111827] text-white rounded-lg font-medium hover:bg-[#374151] transition-colors"
            >
              사업계획서 작성
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Right: Templates */}
          <div className="w-80">
            <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide mb-3">
              Templates
            </p>
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => router.push(`/editor/${template.id}`)}
                  className="w-full bg-white border border-[#E5E7EB] rounded-lg p-3 text-left hover:border-[#D1D5DB] hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-[#F3F4F6] rounded flex items-center justify-center shrink-0">
                        <FileText size={14} className="text-[#6B7280]" />
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-[#111827]">{template.name}</h4>
                        <p className="text-[10px] text-[#9CA3AF]">{template.desc}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[#9CA3AF]">{template.pages}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Uploader Modal */}
      <IdeaUploader
        isOpen={showUploader}
        onClose={() => setShowUploader(false)}
        onImport={handleIdeaImport}
      />
    </div>
  )
}
