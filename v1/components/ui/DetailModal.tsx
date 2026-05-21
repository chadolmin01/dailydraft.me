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
  Briefcase,
  Cpu,
  FileText,
  Sparkles,
  BarChart3,
  Download,
} from 'lucide-react'
import { Opportunity } from '@/types'
import { Modal } from './Modal'
import { Button } from './Button'

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

  if (!data) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" showClose={false} className="bg-surface-card h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-surface-card border-b border-border sticky top-0 z-10 shrink-0">
          <div className="flex justify-between items-start p-6 pb-4">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-surface-sunken rounded-xl border border-border flex items-center justify-center text-txt-tertiary shrink-0">
                {data.category === '기술교육' ? <Cpu size={24} /> : <Briefcase size={24} />}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-medium bg-surface-sunken rounded-xl border border-border px-2 py-0.5 text-txt-tertiary">
                    {data.type}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-txt-primary leading-tight">
                  {data.title}
                </h2>
                <div className="flex items-center gap-2 mt-2 text-sm text-txt-tertiary font-medium">
                  <Building2 size={14} /> {data.organization}
                  <span className="text-border">|</span>
                  <MapPin size={14} /> Seoul, Korea
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-sunken transition-colors text-txt-tertiary hover:text-txt-primary border border-transparent hover:border-border"
              aria-label="닫기"
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
                  ? 'text-txt-primary border-border'
                  : 'text-txt-disabled border-transparent hover:text-txt-secondary'
              }`}
            >
              <FileText size={16} /> Project Details
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'analysis'
                  ? 'text-brand border-brand'
                  : 'text-txt-disabled border-transparent hover:text-txt-secondary'
              }`}
            >
              <Sparkles size={16} /> AI Fit Analysis
              {data.matchPercent && (
                <span className="bg-brand-bg text-brand border border-brand-border px-1.5 py-0.5 text-[10px] font-mono font-bold">
                  {data.matchPercent}%
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-0 bg-surface-card">
          <div className="flex flex-col md:flex-row min-h-full">
            {/* Main Content Area */}
            <div className="flex-1 p-6 md:p-8">
              {/* TAB 1: Project Details */}
              {activeTab === 'details' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div>
                    <h3 className="text-[10px] font-medium text-txt-tertiary mb-3 border-b border-border pb-2">
                      Overview
                    </h3>
                    <div className="prose prose-sm max-w-none text-txt-secondary space-y-4 leading-relaxed">
                      <p>
                        <strong>{data.title}</strong> 프로그램은 초기 단계의 스타트업이 겪는
                        시제품 제작의 어려움을 해소하고, 실제 시장 검증까지 이어질 수 있도록
                        지원하는 엑셀러레이팅 과정입니다.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] font-medium text-txt-tertiary mb-3 border-b border-border pb-2">
                      Tech Stack & Keywords
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {data.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1.5 bg-brand-bg border border-brand-border text-xs font-medium text-brand font-mono hover:bg-brand hover:text-white hover:border-brand transition-colors cursor-default"
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
                  <div className="bg-brand-bg p-6 border border-brand-border relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                      <Sparkles size={120} className="text-draft-blue" />
                    </div>

                    <div className="relative z-10 flex items-start gap-4">
                      <div className="w-16 h-16 bg-surface-card flex items-center justify-center border border-brand/30 shadow-sm shrink-0">
                        <span className="text-2xl font-bold text-brand font-mono">
                          {data.matchPercent}%
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-txt-primary mb-1">Excellent Match</h3>
                        <p className="text-sm text-txt-secondary leading-relaxed max-w-lg break-keep">
                          사용자님의 <strong>하드웨어 스타트업 경험</strong>과{' '}
                          <strong>초기 제품 기획 역량</strong>이 이 모집 공고의 핵심 요구사항과
                          강력하게 일치합니다.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-surface-card p-5 border border-border shadow-md">
                      <h4 className="text-sm font-bold text-txt-primary mb-4 flex items-center gap-2">
                        <BarChart3 size={16} /> Skill Match
                      </h4>
                      <div className="space-y-4">
                        <MetricBar label="Experience Level" score={95} />
                        <MetricBar label="Tech Stack Fit" score={88} />
                        <MetricBar label="Industry Knowledge" score={92} />
                      </div>
                    </div>
                    <div className="bg-surface-card p-5 border border-border shadow-md">
                      <h4 className="text-sm font-bold text-txt-primary mb-4 flex items-center gap-2">
                        <Users size={16} /> Culture Fit
                      </h4>
                      <div className="space-y-4">
                        <MetricBar label="Team Size Preference" score={80} color="bg-indicator-online" />
                        <MetricBar label="Work Style" score={90} color="bg-indicator-online" />
                        <MetricBar label="Growth Stage" score={85} color="bg-indicator-online" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="w-full md:w-80 bg-surface-card border-l border-border p-6 md:p-8 space-y-6 flex flex-col h-full overflow-y-auto custom-scrollbar">
              <div className="space-y-3">
                {/* 기존 "Apply Now" placeholder 를 실제 프로젝트 상세로 연결.
                    이전엔 modal dead-end — 유저가 더 많은 정보 보려면 모달 닫고 다시 탐색해야 했음. */}
                <a
                  href={`/p/${data.id}`}
                  className="w-full flex items-center justify-center gap-1.5 py-3 bg-brand text-white text-sm font-bold rounded-xl hover:bg-brand-hover transition-colors"
                >
                  자세히 보기 <ArrowUpRight size={16} />
                </a>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" fullWidth>
                    <Bookmark size={14} /> Save
                  </Button>
                  <Button variant="secondary" size="sm" fullWidth>
                    <Share2 size={14} /> Share
                  </Button>
                </div>
              </div>

              <div className="w-full h-px bg-border my-2"></div>

              <div>
                <h4 className="text-[10px] font-medium text-txt-disabled mb-3">
                  Snapshot
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="bg-surface-card p-2.5 border border-border ob-ring-glow">
                    <div className="text-[0.5rem] text-txt-disabled mb-1">
                      Deadline
                    </div>
                    <div className="font-bold text-sm text-status-danger-text flex items-center gap-1 font-mono">
                      <Calendar size={12} /> D-{data.daysLeft}
                    </div>
                  </div>
                  <div className="bg-surface-card p-2.5 border border-border ob-ring-glow">
                    <div className="text-[0.5rem] text-txt-disabled mb-1">Type</div>
                    <div className="font-bold text-sm text-txt-primary truncate font-mono">{data.type}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-medium text-txt-disabled mb-3">
                  Resources
                </h4>
                <div className="space-y-2">
                  <button className="w-full flex items-center justify-between p-3 bg-surface-card rounded-xl border border-border ob-ring-glow group">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText size={14} className="text-txt-tertiary group-hover:text-txt-primary" />
                      <span className="text-xs font-bold text-txt-secondary truncate group-hover:text-txt-primary">
                        Program_Guide_v2.pdf
                      </span>
                    </div>
                    <Download size={12} className="text-txt-tertiary group-hover:text-txt-primary" />
                  </button>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-border">
                <div className="text-[10px] text-txt-disabled mb-2">Need Help?</div>
                <div className="text-xs text-txt-secondary font-mono font-medium">support@draft.io</div>
              </div>
            </div>
          </div>
        </div>
    </Modal>
  )
}

const MetricBar = ({
  label,
  score,
  color = 'bg-brand',
}: {
  label: string
  score: number
  color?: string
}) => (
  <div>
    <div className="flex justify-between mb-1 text-xs">
      <span className="text-txt-secondary text-[10px]">{label}</span>
      <span className="font-mono font-bold">{score}%</span>
    </div>
    <div className="w-full h-1.5 bg-surface-sunken rounded-xl border border-border overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${score}%` }}></div>
    </div>
  </div>
)
