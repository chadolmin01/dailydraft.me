'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Calendar,
  MapPin,
  Building2,
  Users,
  ArrowUpRight,
  Share2,
  Bookmark,
  CheckCircle2,
  Briefcase,
  Cpu,
  FileText,
  Sparkles,
  BarChart3,
  Download,
} from 'lucide-react'
import { Opportunity } from '@/types'

interface DetailModalProps {
  isOpen: boolean
  onClose: () => void
  data: Opportunity | null
}

export const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, data }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'analysis'>('details')

  // Reset tab when modal opens/changes
  useEffect(() => {
    if (isOpen) setActiveTab('details')
  }, [isOpen, data])

  // Prevent background scrolling
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || !data) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-4xl h-[85vh] rounded-lg shadow-2xl flex flex-col overflow-hidden animate-[scale-in_0.2s_ease-out]">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shrink-0">
          <div className="flex justify-between items-start p-6 pb-4">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
                {data.category === '기술교육' ? <Cpu size={24} /> : <Briefcase size={24} />}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                    {data.type}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                  {data.title}
                </h2>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 font-medium">
                  <Building2 size={14} /> {data.organization}
                  <span className="text-gray-300">|</span>
                  <MapPin size={14} /> Seoul, Korea
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-black"
            >
              <X size={24} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex px-6 gap-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'details'
                  ? 'text-gray-900 border-black'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              <FileText size={16} /> Project Details
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'analysis'
                  ? 'text-draft-blue border-draft-blue'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              <Sparkles size={16} /> AI Fit Analysis
              {data.matchPercent && (
                <span className="bg-blue-50 text-draft-blue px-1.5 py-0.5 rounded text-[10px] font-mono">
                  {data.matchPercent}%
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-0 bg-white">
          <div className="flex flex-col md:flex-row min-h-full">
            {/* Main Content Area */}
            <div className="flex-1 p-6 md:p-8">
              {/* TAB 1: Project Details */}
              {activeTab === 'details' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3 font-mono uppercase border-b border-gray-100 pb-2">
                      Overview
                    </h3>
                    <div className="prose prose-sm max-w-none text-gray-600 space-y-4 leading-relaxed">
                      <p>
                        <strong>{data.title}</strong> 프로그램은 초기 단계의 스타트업이 겪는
                        시제품 제작의 어려움을 해소하고, 실제 시장 검증까지 이어질 수 있도록
                        지원하는 엑셀러레이팅 과정입니다.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3 font-mono uppercase border-b border-gray-100 pb-2">
                      Tech Stack & Keywords
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {data.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-sm text-xs font-medium text-gray-700 font-mono"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: AI Analysis */}
              {activeTab === 'analysis' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-draft-light p-6 rounded-lg border border-gray-200/60 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                      <Sparkles size={120} className="text-draft-blue" />
                    </div>

                    <div className="relative z-10 flex items-start gap-4">
                      <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center border border-gray-200 shadow-sm shrink-0">
                        <span className="text-2xl font-bold text-draft-blue font-mono">
                          {data.matchPercent}%
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Excellent Match</h3>
                        <p className="text-sm text-gray-600 leading-relaxed max-w-lg break-keep">
                          사용자님의 <strong>하드웨어 스타트업 경험</strong>과{' '}
                          <strong>초기 제품 기획 역량</strong>이 이 모집 공고의 핵심 요구사항과
                          강력하게 일치합니다.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-5 rounded-lg border border-gray-200">
                      <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <BarChart3 size={16} /> Skill Match
                      </h4>
                      <div className="space-y-4">
                        <MetricBar label="Experience Level" score={95} />
                        <MetricBar label="Tech Stack Fit" score={88} />
                        <MetricBar label="Industry Knowledge" score={92} />
                      </div>
                    </div>
                    <div className="bg-white p-5 rounded-lg border border-gray-200">
                      <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Users size={16} /> Culture Fit
                      </h4>
                      <div className="space-y-4">
                        <MetricBar label="Team Size Preference" score={80} color="bg-green-500" />
                        <MetricBar label="Work Style" score={90} color="bg-green-500" />
                        <MetricBar label="Growth Stage" score={85} color="bg-green-500" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="w-full md:w-80 bg-gray-50/50 border-l border-gray-100 p-6 md:p-8 space-y-6 flex flex-col h-full overflow-y-auto custom-scrollbar">
              <div className="space-y-3">
                <button className="w-full bg-black text-white py-3 rounded-sm text-sm font-bold hover:bg-gray-800 transition-colors shadow-sm flex items-center justify-center gap-2">
                  Apply Now <ArrowUpRight size={16} />
                </button>
                <div className="flex gap-2">
                  <button className="flex-1 bg-white border border-gray-200 py-2.5 rounded-sm text-xs font-bold hover:border-black transition-colors flex items-center justify-center gap-2">
                    <Bookmark size={14} /> Save
                  </button>
                  <button className="flex-1 bg-white border border-gray-200 py-2.5 rounded-sm text-xs font-bold hover:border-black transition-colors flex items-center justify-center gap-2">
                    <Share2 size={14} /> Share
                  </button>
                </div>
              </div>

              <div className="w-full h-px bg-gray-200 my-2"></div>

              <div>
                <h4 className="text-[10px] font-mono font-bold text-gray-400 uppercase mb-3">
                  Snapshot
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white p-2.5 rounded-sm border border-gray-200 hover:border-black transition-colors">
                    <div className="text-[9px] text-gray-400 font-mono uppercase mb-1">
                      Deadline
                    </div>
                    <div className="font-bold text-sm text-red-500 flex items-center gap-1">
                      <Calendar size={12} /> D-{data.daysLeft}
                    </div>
                  </div>
                  <div className="bg-white p-2.5 rounded-sm border border-gray-200 hover:border-black transition-colors">
                    <div className="text-[9px] text-gray-400 font-mono uppercase mb-1">Type</div>
                    <div className="font-bold text-sm text-gray-900 truncate">{data.type}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-mono font-bold text-gray-400 uppercase mb-3">
                  Resources
                </h4>
                <div className="space-y-2">
                  <button className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-sm hover:border-black transition-colors group">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText size={14} className="text-gray-400 group-hover:text-black" />
                      <span className="text-xs font-bold text-gray-600 truncate group-hover:text-black">
                        Program_Guide_v2.pdf
                      </span>
                    </div>
                    <Download size={12} className="text-gray-400 group-hover:text-black" />
                  </button>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-200">
                <div className="text-[10px] text-gray-400 font-mono mb-2">Need Help?</div>
                <div className="text-xs text-gray-600 font-medium">support@draft.io</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const MetricBar = ({
  label,
  score,
  color = 'bg-draft-blue',
}: {
  label: string
  score: number
  color?: string
}) => (
  <div>
    <div className="flex justify-between mb-1 text-xs">
      <span className="text-gray-600 font-medium">{label}</span>
      <span className="font-mono font-bold">{score}%</span>
    </div>
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${score}%` }}></div>
    </div>
  </div>
)
