'use client'

import React, { useState } from 'react'
import Link from 'next/link'

import { Card } from './ui/Card'
import { DetailModal } from './ui/DetailModal'
import {
  Plus,
  Building2,
  Clock,
  Rocket,
  Landmark,
  User,
  Command,
} from 'lucide-react'
import { Opportunity } from '@/types'
import { SkeletonGrid } from '@/components/ui/Skeleton'
import { useAuth } from '@/src/context/AuthContext'
import { useRecommendedOpportunities, useMyOpportunities, calculateDaysLeft, OpportunityWithCreator } from '@/src/hooks/useOpportunities'
import { useProfile } from '@/src/hooks/useProfile'
import { cleanNickname } from '@/src/lib/clean-nickname'
import { ErrorState } from './ui/ErrorState'


export const Dashboard: React.FC = () => {
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null)

  const { user } = useAuth()
  const { data: profile } = useProfile()
  const { data: recommendedOpportunities, isLoading: oppLoading, isError: oppError, refetch: refetchOpp } = useRecommendedOpportunities(4)

  const transformOpportunity = (opp: OpportunityWithCreator): Opportunity => {
    const daysLeft = calculateDaysLeft(opp.created_at)
    let scope: 'PROJECT' | 'PROGRAM' | 'TALENT' = 'PROJECT'
    let uiType: Opportunity['type'] = 'Team Building'

    if (opp.type === 'side_project') {
      scope = 'PROJECT'
      uiType = 'Team Building'
    } else if (opp.type === 'startup') {
      scope = 'PROJECT'
      uiType = 'Startup Support'
    } else if (opp.type === 'study') {
      scope = 'PROJECT'
      uiType = 'Education'
    }

    const categoryMap: Record<string, string> = {
      side_project: '함께 만들기',
      startup: '창업 준비',
      study: '함께 배우기',
    }

    return {
      id: opp.id,
      scope,
      type: uiType,
      title: opp.title,
      organization: cleanNickname(opp.creator?.nickname || '') || 'Unknown',
      tags: opp.needed_roles || [],
      daysLeft,
      matchPercent: 85,
      category: categoryMap[opp.type] || opp.type,
    }
  }

  const displayOpportunities = recommendedOpportunities?.map(transformOpportunity) || []

  const handleOpenModal = (opp: Opportunity) => {
     setSelectedOpportunity(opp)
  }

  const handleCloseModal = () => {
     setSelectedOpportunity(null)
  }

  const getScopeStyles = (scope?: string) => {
    switch (scope) {
      case 'PROJECT':
        return {
          variant: 'solid' as const,
          cardClass: 'bg-surface-inverse border border-border-strong hover:border-white/40 text-white',
          badgeClass: 'bg-white text-black border-transparent',
          textClass: 'text-white',
          subTextClass: 'text-white/50',
          organizationClass: 'text-white/60',
          fitBadgeClass: 'bg-border-strong border-border-strong text-white',
          icon: <Rocket size={10} />,
          text: 'PROJECT'
        }
      case 'PROGRAM':
        return {
          variant: 'solid' as const,
          cardClass: 'bg-brand border border-brand hover:border-brand-hover text-white',
          badgeClass: 'bg-white text-brand border-transparent shadow-sm',
          textClass: 'text-white',
          subTextClass: 'text-brand-border',
          organizationClass: 'text-brand-bg',
          fitBadgeClass: 'bg-white text-brand border-status-info-text/20',
          icon: <Landmark size={10} />,
          text: 'PROGRAM'
        }
      case 'TALENT':
        return {
          variant: 'solid' as const,
          cardClass: 'bg-status-success-text border border-status-success-text hover:border-status-success-text/60 text-white',
          badgeClass: 'bg-white text-status-success-text border-transparent shadow-sm',
          textClass: 'text-white',
          subTextClass: 'text-status-success-text/40',
          organizationClass: 'text-status-success-text/30',
          fitBadgeClass: 'bg-white text-status-success-text border-status-success-text/30',
          icon: <User size={10} />,
          text: 'TALENT'
        }
      default:
        return {
          variant: 'default' as const,
          cardClass: 'bg-surface-card hover:border-border text-txt-primary',
          badgeClass: 'bg-surface-sunken text-txt-secondary border-border',
          textClass: 'text-txt-primary',
          subTextClass: 'text-txt-disabled',
          organizationClass: 'text-txt-tertiary',
          fitBadgeClass: 'bg-status-success-bg text-status-success-text border-status-success-text/20',
          icon: <Building2 size={10} />,
          text: 'ETC'
        }
    }
  }

  return (
    <div className="flex-1 overflow-y-auto h-screen bg-surface-bg bg-grid-engineering relative flex flex-col">

      <DetailModal
         isOpen={!!selectedOpportunity}
         onClose={handleCloseModal}
         data={selectedOpportunity}
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 space-y-6 flex-1 flex flex-col w-full">

        {/* Header */}
        <div className="flex justify-between items-end border-b border-border pb-6 shrink-0">
          <div>
            <div className="text-xs font-mono text-txt-tertiary mb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-surface-inverse"></span>
              WORKSPACE / MAIN
            </div>
            <h1 className="text-3xl font-bold text-txt-primary tracking-tight">Dashboard</h1>
          </div>
          <Link
            href="/projects"
            className="bg-brand text-white border border-brand px-4 py-2 text-sm font-medium hover:bg-brand-hover transition-colors flex items-center gap-2 shadow-sm rounded-xl"
          >
             <Plus size={16} /> New Draft
          </Link>
        </div>

        {/* Content Wrapper */}
        <div className="flex-1 flex flex-col gap-3 min-h-0">

          {/* Opportunity Index */}
          <div className="flex flex-col gap-3">
             <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-brand text-white flex items-center justify-center text-[0.5rem] font-bold font-mono">R</span>
                  <h3 className="text-[10px] font-medium text-txt-primary">Recommended Opportunities</h3>
                </div>
                <Link
                   href="/explore"
                   className="text-[10px] text-txt-tertiary hover:text-txt-primary font-mono font-medium border border-border px-2 py-0.5 hover:border-border transition-colors"
                >
                   View All
                </Link>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {oppError ? (
                  <div className="col-span-4">
                    <ErrorState message="추천 프로젝트를 불러오지 못했습니다" onRetry={() => refetchOpp()} />
                  </div>
                ) : oppLoading ? (
                  <div className="col-span-4">
                    <SkeletonGrid count={4} cols={2} />
                  </div>
                ) : displayOpportunities.length === 0 ? (
                  <div className="col-span-4 flex flex-col items-center justify-center py-12 text-txt-disabled">
                    <div className="text-sm mb-1">아직 등록된 프로젝트가 없습니다</div>
                    <div className="text-[10px] font-mono">첫 번째 프로젝트를 만들어보세요</div>
                  </div>
                ) : displayOpportunities.map((opp) => {
                  const styles = getScopeStyles(opp.scope)
                  return (
                    <Card
                       key={opp.id}
                       variant={styles.variant}
                       className={`group transition-all cursor-pointer relative ${styles.cardClass}`}
                       padding="p-4"
                       onClick={() => handleOpenModal(opp)}
                    >
                       <div className="flex flex-col h-[8.125rem] justify-between">
                         <div>
                            <div className="flex justify-between items-start mb-2">
                                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-sm border text-[10px] font-bold font-mono ${styles.badgeClass}`}>
                                  {styles.icon}
                                  {styles.text}
                                </div>
                                {opp.matchPercent && opp.matchPercent > 80 && (
                                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${styles.fitBadgeClass}`}>
                                      {opp.matchPercent}% FIT
                                  </span>
                                )}
                            </div>

                            <div>
                              <span className={`text-[10px] block mb-0.5 ${styles.subTextClass}`}>
                                  {opp.category}
                              </span>
                              <h4 className={`font-bold text-sm leading-snug transition-colors break-keep line-clamp-2 group-hover:opacity-80 ${styles.textClass}`}>
                                  {opp.title}
                              </h4>
                            </div>
                         </div>

                         <div className={`flex items-center justify-between text-[10px] ${styles.organizationClass} pt-2 border-t border-white/10`}>
                            <div className="flex items-center gap-1 max-w-[70%]">
                                <Building2 size={8} />
                                <span className="truncate">{opp.organization}</span>
                            </div>
                            {opp.daysLeft && (
                                <div className="font-mono flex items-center gap-1">
                                    <Clock size={8} /> D-{opp.daysLeft}
                                </div>
                            )}
                         </div>
                      </div>
                    </Card>
                  )
                })}
             </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-8 border-t border-border">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-2">
                      <Command size={16} className="text-txt-disabled" />
                      <span className="font-bold text-txt-primary text-sm tracking-tight">Draft</span>
                  </div>

                  <div className="flex gap-6 text-[10px] text-txt-tertiary font-mono">
                      <a href="/legal/terms" className="hover:text-txt-primary transition-colors">Terms of Service</a>
                      <a href="/legal/privacy" className="hover:text-txt-primary transition-colors">Privacy Policy</a>
                  </div>

                  <div className="text-[10px] text-txt-disabled font-mono">
                      &copy; 2026 Draft. All rights reserved.
                  </div>
              </div>
          </div>

        </div>
      </div>
    </div>
  )
}
