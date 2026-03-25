'use client'

import Link from 'next/link'
import { Plus, Rocket, Clock, FolderOpen } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { calculateDaysLeft } from '@/src/hooks/useOpportunities'
import type { Opportunity } from '@/src/types/opportunity'

interface ProfileProjectsProps {
  opportunities: Opportunity[]
}

export function ProfileProjects({ opportunities }: ProfileProjectsProps) {
  return (
    <section className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest flex items-center gap-2">
          <span className="w-5 h-5 bg-brand text-white flex items-center justify-center text-[0.5rem] font-bold">P</span>
          MY PROJECTS
          <span className="text-[0.625rem] font-mono text-txt-tertiary">({opportunities.length})</span>
        </h3>
        <Link
          href="/projects/new"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-brand text-white border border-brand hover:bg-brand-hover transition-colors shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
        >
          <Plus size={14} /> 새 프로젝트
        </Link>
      </div>

      {opportunities.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {opportunities.map((opp, oppIdx) => {
            const daysLeft = calculateDaysLeft(opp.created_at)
            const isUrgent = daysLeft > 0 && daysLeft <= 3
            return (
              <Link href={`/projects/${opp.id}`} key={opp.id} className="relative bg-surface-card border border-border-strong overflow-hidden group hover:shadow-brutal transition-all cursor-pointer h-[21.25rem] flex flex-col shadow-sharp">
                <div className="absolute top-1 left-1 w-2 h-2 border-l border-t border-black/20 z-20" />
                <div className="absolute top-1 right-1 w-2 h-2 border-r border-t border-black/20 z-20" />
                <div className="relative h-36 shrink-0 bg-surface-inverse flex items-end p-4">
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="text-[0.625rem] font-mono font-bold text-white/50">#{String(oppIdx + 1).padStart(2, '0')}</span>
                    {isUrgent ? (
                      <span className="text-[0.625rem] font-mono font-bold bg-indicator-alert text-white px-2 py-0.5">D-{daysLeft} URGENT</span>
                    ) : (
                      <span className="text-[0.625rem] font-mono font-bold bg-indicator-online text-white px-2 py-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-indicator-online rounded-full animate-pulse" />
                        {opp.status === 'active' ? '모집중' : opp.status}
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    {(opp.interest_tags || []).slice(0, 2).map(tag => (
                      <span key={tag} className="text-[0.625rem] font-mono bg-white/10 text-white px-2 py-0.5 border border-white/20">{tag}</span>
                    ))}
                  </div>
                  <div className="w-10 h-10 bg-surface-card border border-border-strong flex items-center justify-center shadow-solid-sm">
                    <Rocket size={20} className="text-txt-primary" />
                  </div>
                </div>
                <div className="px-4 pt-4 h-[7.5rem] shrink-0 overflow-hidden">
                  <h4 className="font-bold text-base text-txt-primary mb-1.5 truncate">{opp.title}</h4>
                  <div className="flex items-center gap-1.5 mb-2 overflow-hidden">
                    <span className="text-[0.5rem] font-mono font-bold text-brand/60 uppercase tracking-widest shrink-0">NEED</span>
                    {(opp.needed_roles || []).slice(0, 2).map(role => (
                      <span key={role} className="text-[0.625rem] font-mono bg-brand-bg text-brand border border-brand-border px-2 py-0.5 font-medium shrink-0">{role}</span>
                    ))}
                  </div>
                  <p className="text-sm text-txt-secondary line-clamp-2">{opp.description}</p>
                </div>
                <div className="px-4 pb-4 h-[4.75rem] shrink-0 flex items-end">
                  <div className="flex items-center justify-between w-full pt-3 border-t border-dashed border-border">
                    <div className="flex items-center gap-3 text-[0.625rem] font-mono text-txt-tertiary">
                      <span>{opp.applications_count || 0}명 지원</span>
                      <span>{opp.interest_count || 0} 관심</span>
                    </div>
                    {daysLeft > 0 && (
                      <span className={`text-[0.625rem] font-mono flex items-center gap-1 ${isUrgent ? 'text-status-danger-text font-bold' : 'text-txt-tertiary'}`}>
                        <Clock size={10} /> D-{daysLeft}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={FolderOpen}
          title="아직 등록한 프로젝트가 없습니다"
          description="아이디어를 프로젝트로 만들고 팀원을 모집해보세요"
          actionLabel="프로젝트 만들기"
          actionHref="/projects/new?from=/profile"
        />
      )}
    </section>
  )
}
