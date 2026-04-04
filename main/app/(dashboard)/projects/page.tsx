'use client'

import React, { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  Plus,
  FolderOpen,
  Eye,
  Heart,
  Users,
  Pencil,
  Rocket,
} from 'lucide-react'
import { SkeletonGrid } from '@/components/ui/Skeleton'
import { useMyOpportunities } from '@/src/hooks/useOpportunities'
import type { Opportunity } from '@/src/types/opportunity'

const ModalLoadingFallback = () => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-modal-backdrop">
    <div className="bg-surface-card rounded-2xl border border-border px-6 py-4 shadow-lg">
      <span className="text-sm text-txt-secondary font-mono">로딩 중...</span>
    </div>
  </div>
)

const ProjectDetailModal = dynamic(
  () => import('@/components/ProjectDetailModal').then(m => ({ default: m.ProjectDetailModal })),
  { ssr: false, loading: ModalLoadingFallback }
)

/* ── Status Badge ── */
function StatusBadge({ status }: { status: string }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-status-success-bg border border-status-success-text/20 text-status-success-text text-[11px] font-bold rounded-full shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-indicator-online animate-pulse" />
        모집중
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 bg-surface-sunken text-txt-tertiary text-[11px] font-bold rounded-full border border-border shrink-0">
      마감
    </span>
  )
}

/* ── Summary Strip ── */
function SummaryStrip({ projects }: { projects: Opportunity[] }) {
  const activeCount = projects.filter(p => (p.status ?? 'active') === 'active').length
  const totalApplications = projects.reduce((sum, p) => sum + (p.applications_count ?? 0), 0)

  const stats = [
    { label: '전체', value: projects.length, unit: '개' },
    { label: '모집중', value: activeCount, unit: '개' },
    { label: '총 지원', value: totalApplications, unit: '명' },
  ]

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {stats.map(({ label, value, unit }, i) => (
        <div
          key={label}
          className="stagger-item bg-surface-card border border-border rounded-2xl p-4 text-center"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="text-[22px] font-black text-txt-primary tabular-nums leading-none mb-1">
            {value}
            <span className="text-[12px] font-medium text-txt-tertiary ml-0.5">{unit}</span>
          </div>
          <div className="text-[11px] text-txt-tertiary font-medium">{label}</div>
        </div>
      ))}
    </div>
  )
}

/* ── Project Card ── */
function ProjectCard({
  opp,
  index,
  onSelect,
}: {
  opp: Opportunity
  index: number
  onSelect: () => void
}) {
  const daysAgo = opp.created_at
    ? Math.floor((Date.now() - new Date(opp.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect() }
      }}
      style={{ animationDelay: `${Math.min(index * 70, 600)}ms` }}
      className="stagger-item bg-surface-card rounded-2xl border border-border p-5 cursor-pointer hover:shadow-md hover:border-brand/30 hover-spring group"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">

          {/* Title + Status */}
          <div className="flex items-start gap-2 mb-2 flex-wrap">
            <h3 className="text-[15px] font-black text-txt-primary leading-snug min-w-0">
              {opp.title}
            </h3>
            <StatusBadge status={opp.status || 'active'} />
          </div>

          {/* Description — hidden on desktop, slides down on hover; always shown on mobile */}
          {opp.description && (
            <>
              <div className="hidden md:block overflow-hidden max-h-0 group-hover:max-h-16 transition-all duration-300 ease-out mb-0 group-hover:mb-3">
                <p className="text-[13px] text-txt-secondary line-clamp-2">{opp.description}</p>
              </div>
              <p className="md:hidden text-[13px] text-txt-secondary line-clamp-2 mb-3">
                {opp.description}
              </p>
            </>
          )}

          {/* Role chips */}
          {opp.needed_roles && opp.needed_roles.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mb-3">
              <span className="text-[10px] font-bold text-brand bg-brand-bg px-2 py-0.5 border border-brand-border rounded-full">
                NEED
              </span>
              {opp.needed_roles.slice(0, 3).map((role: string) => (
                <span
                  key={role}
                  className="text-[11px] bg-surface-sunken text-txt-secondary px-2.5 py-0.5 border border-border rounded-full font-medium"
                >
                  {role}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-3 text-[11px] text-txt-tertiary flex-wrap">
            <span className="font-medium">
              {daysAgo === 0 ? '오늘 등록' : `${daysAgo}일 전`}
            </span>
            {(opp.views_count ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Eye size={11} />
                {opp.views_count}
              </span>
            )}
            {(opp.interest_count ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Heart size={11} />
                {opp.interest_count}
              </span>
            )}
            <span className="flex items-center gap-1 font-bold text-txt-secondary">
              <Users size={11} />
              지원 {opp.applications_count ?? 0}명
            </span>
          </div>

        </div>

        {/* Edit button */}
        <Link
          href={`/projects/${opp.id}/edit`}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-txt-disabled hover:text-txt-primary hover:bg-surface-sunken transition-colors"
        >
          <Pencil size={14} />
        </Link>
      </div>
    </div>
  )
}

/* ── Empty State ── */
function EmptyState() {
  return (
    <div className="bg-surface-card border border-border rounded-2xl p-12 flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-surface-sunken rounded-full flex items-center justify-center mb-5 empty-float">
        <FolderOpen size={26} className="text-txt-tertiary" strokeWidth={1.5} />
      </div>
      <h3 className="text-[17px] font-black text-txt-primary mb-2">아직 프로젝트가 없어요</h3>
      <p className="text-[13px] text-txt-tertiary mb-8 leading-relaxed">
        아이디어를 등록하고<br />함께할 팀원을 찾아보세요
      </p>
      <Link
        href="/projects/new"
        className="inline-flex items-center gap-2 px-6 py-3.5 bg-surface-inverse text-txt-inverse text-[14px] font-black rounded-full hover:opacity-90 active:scale-[0.97] transition-all"
      >
        <Rocket size={16} />
        첫 프로젝트 만들기
      </Link>
    </div>
  )
}

/* ── Page ── */
export default function MyProjectsPage() {
  const { data: myProjects = [], isLoading } = useMyOpportunities()
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  return (
    <div className="bg-surface-bg min-h-full">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-black text-txt-primary tracking-tight">내 프로젝트</h1>
            <p className="text-[11px] text-txt-tertiary mt-0.5 font-medium tracking-widest">MY PROJECTS</p>
          </div>
          <Link
            href="/projects/new"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-inverse text-txt-inverse text-[13px] font-black rounded-full hover:opacity-90 active:scale-[0.97] transition-all"
          >
            <Plus size={14} strokeWidth={2.5} />
            새 프로젝트
          </Link>
        </div>

        {/* Content */}
        {isLoading ? (
          <SkeletonGrid count={3} cols={1} />
        ) : myProjects.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <SummaryStrip projects={myProjects} />

            <div className="space-y-3">
              {myProjects.map((opp: Opportunity, index: number) => (
                <ProjectCard
                  key={opp.id}
                  opp={opp}
                  index={index}
                  onSelect={() => setSelectedProjectId(opp.id)}
                />
              ))}
            </div>

            {/* Explore CTA */}
            <div className="mt-8 flex flex-col items-center gap-3">
              <p className="text-[12px] text-txt-tertiary">다른 프로젝트도 둘러보세요</p>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-border rounded-full text-[13px] font-bold text-txt-secondary hover:border-txt-primary hover:text-txt-primary transition-all active:scale-[0.97]"
              >
                탐색하기 →
              </Link>
            </div>
          </>
        )}

      </div>

      <AnimatePresence>
        {selectedProjectId && (
          <ProjectDetailModal
            key="project-modal"
            projectId={selectedProjectId}
            onClose={() => setSelectedProjectId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
