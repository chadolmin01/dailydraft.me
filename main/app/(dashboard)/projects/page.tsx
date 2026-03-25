'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  Plus,
  FolderOpen,
  Clock,
  Users,
  Eye,
  Heart,
  Loader2,
  Rocket,
  Settings,
} from 'lucide-react'
import { useMyOpportunities } from '@/src/hooks/useOpportunities'
import { useAuth } from '@/src/context/AuthContext'
import type { Opportunity } from '@/src/types/opportunity'

const ProjectDetailModal = dynamic(
  () => import('@/components/ProjectDetailModal').then(m => ({ default: m.ProjectDetailModal })),
  { ssr: false }
)

function StatusBadge({ status }: { status: string }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-status-success-bg border border-status-success-text/30 text-status-success-text text-[0.625rem] font-bold">
        <span className="w-1.5 h-1.5 bg-indicator-online animate-pulse" />
        모집중
      </span>
    )
  }
  return (
    <span className="px-2 py-0.5 bg-surface-sunken text-txt-tertiary text-[0.625rem] font-bold border border-border">
      마감
    </span>
  )
}

export default function MyProjectsPage() {
  const { user } = useAuth()
  const { data: myProjects = [], isLoading } = useMyOpportunities()
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  return (
    <div className="bg-surface-bg min-h-full">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-bold text-txt-primary">내 프로젝트</h1>
            <p className="text-[0.625rem] font-mono text-txt-tertiary uppercase tracking-widest mt-0.5">
              MY PROJECTS · {myProjects.length}개
            </p>
          </div>
          <Link
            href="/projects/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-surface-inverse text-txt-inverse text-sm font-bold border border-surface-inverse shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <Plus size={16} />
            새 프로젝트
          </Link>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-txt-tertiary" />
          </div>
        ) : myProjects.length === 0 ? (
          <div className="border border-dashed border-border-strong bg-surface-card p-10 text-center">
            <div className="w-14 h-14 bg-surface-sunken border border-border flex items-center justify-center mx-auto mb-4">
              <FolderOpen size={24} className="text-txt-disabled" />
            </div>
            <h3 className="font-bold text-txt-primary mb-1">아직 프로젝트가 없습니다</h3>
            <p className="text-sm text-txt-tertiary mb-6">
              아이디어를 등록하고 함께할 팀원을 찾아보세요
            </p>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-surface-inverse text-txt-inverse text-sm font-bold border border-surface-inverse shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <Rocket size={16} />
              첫 프로젝트 만들기
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myProjects.map((opp: Opportunity) => {
              const daysAgo = opp.created_at
                ? Math.floor((Date.now() - new Date(opp.created_at).getTime()) / (1000 * 60 * 60 * 24))
                : 0

              return (
                <div
                  key={opp.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedProjectId(opp.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedProjectId(opp.id) } }}
                  className="bg-surface-card border border-border-strong p-4 cursor-pointer hover:shadow-solid-sm hover:border-brand/30 transition-all active:scale-[0.985] group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Title + Status */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-bold text-txt-primary truncate">{opp.title}</h3>
                        <StatusBadge status={opp.status || 'active'} />
                      </div>

                      {/* Description */}
                      <p className="text-sm text-txt-secondary line-clamp-2 mb-3">{opp.description}</p>

                      {/* Roles */}
                      {opp.needed_roles && opp.needed_roles.length > 0 && (
                        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                          <span className="text-[0.625rem] font-mono font-bold text-brand uppercase tracking-wide bg-brand-bg px-1.5 py-0.5 border border-brand-border">NEED</span>
                          {opp.needed_roles.slice(0, 3).map((role: string) => (
                            <span key={role} className="text-[0.625rem] bg-surface-sunken text-txt-secondary px-2 py-0.5 border border-border font-medium">{role}</span>
                          ))}
                        </div>
                      )}

                      {/* Stats footer */}
                      <div className="flex items-center gap-4 text-[0.625rem] font-mono text-txt-tertiary">
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {daysAgo === 0 ? '오늘' : `${daysAgo}일 전`}
                        </span>
                        {(opp.views_count ?? 0) > 0 && (
                          <span className="flex items-center gap-1">
                            <Eye size={10} />
                            {opp.views_count}
                          </span>
                        )}
                        {(opp.interest_count ?? 0) > 0 && (
                          <span className="flex items-center gap-1">
                            <Heart size={10} />
                            {opp.interest_count}
                          </span>
                        )}
                        {(opp.applications_count ?? 0) > 0 && (
                          <span className="flex items-center gap-1">
                            <Users size={10} />
                            지원 {opp.applications_count}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Edit button */}
                    <Link
                      href={`/projects/${opp.id}/edit`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 text-txt-disabled hover:text-txt-primary hover:bg-surface-sunken transition-colors shrink-0"
                    >
                      <Settings size={16} />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Explore CTA */}
        {myProjects.length > 0 && (
          <div className="mt-6 border border-dashed border-border p-4 text-center">
            <p className="text-sm text-txt-tertiary mb-2">다른 프로젝트도 둘러보세요</p>
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:text-brand-hover transition-colors"
            >
              탐색하기 →
            </Link>
          </div>
        )}
      </div>

      <ProjectDetailModal
        projectId={selectedProjectId}
        onClose={() => setSelectedProjectId(null)}
      />
    </div>
  )
}
