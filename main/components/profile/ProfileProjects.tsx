'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Plus, Clock } from 'lucide-react'
import { calculateDaysLeft } from '@/src/hooks/useOpportunities'
import type { Opportunity } from '@/src/types/opportunity'

interface ProfileProjectsProps {
  opportunities: Opportunity[]
}

export function ProfileProjects({ opportunities }: ProfileProjectsProps) {
  return (
    <section className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[15px] font-bold text-txt-primary flex items-center gap-2">
          내 프로젝트
          <span className="text-[13px] font-medium text-txt-tertiary">{opportunities.length}</span>
        </h3>
      </div>

      {opportunities.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {opportunities.map((opp) => {
            const daysLeft = calculateDaysLeft(opp.created_at)
            const isUrgent = daysLeft > 0 && daysLeft <= 3
            const coverSrc = opp.demo_images?.[0] || null

            return (
              <Link href={`/projects/${opp.id}`} key={opp.id} className="bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl overflow-hidden group hover:shadow-lg transition-all cursor-pointer flex flex-col">
                {/* Cover */}
                <div className="relative h-32 sm:h-36 shrink-0 bg-[#E5E5EA] dark:bg-[#2C2C2E] overflow-hidden">
                  {coverSrc ? (
                    <Image
                      src={coverSrc}
                      alt={opp.title}
                      fill
                      sizes="(max-width:640px) 100vw, 50vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      quality={80}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <span className="text-[28px] font-bold text-txt-disabled/30">{opp.title.charAt(0)}</span>
                    </div>
                  )}
                  {/* Status badge */}
                  <div className="absolute top-2.5 left-2.5">
                    {isUrgent ? (
                      <span className="text-[11px] font-semibold bg-[#FF3B30] text-white px-2 py-0.5 rounded-full">D-{daysLeft}</span>
                    ) : (
                      <span className="text-[11px] font-semibold bg-white/80 dark:bg-black/50 backdrop-blur-sm text-txt-primary dark:text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${opp.status === 'active' ? 'bg-[#34C759]' : 'bg-txt-disabled'}`} />
                        {opp.status === 'active' ? '모집 중' : '마감'}
                      </span>
                    )}
                  </div>
                  {/* Tags */}
                  <div className="absolute top-2.5 right-2.5 flex gap-1">
                    {(opp.interest_tags || []).slice(0, 2).map(tag => (
                      <span key={tag} className="text-[11px] font-medium bg-white/80 dark:bg-black/50 backdrop-blur-sm text-txt-secondary dark:text-white/80 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 flex-1 flex flex-col">
                  <h4 className="font-bold text-[15px] text-txt-primary mb-1 truncate">{opp.title}</h4>
                  <div className="flex items-center gap-1.5 mb-2 overflow-hidden">
                    {(opp.needed_roles || []).slice(0, 3).map(role => (
                      <span key={role} className="text-[12px] bg-[#E5E5EA] dark:bg-[#3A3A3C] text-txt-secondary px-2 py-0.5 rounded-full">{role}</span>
                    ))}
                  </div>
                  <p className="text-[13px] text-txt-tertiary line-clamp-2 flex-1">{opp.description}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-3 text-[12px] text-txt-tertiary">
                      <span>{opp.applications_count || 0}명 지원</span>
                      <span>{opp.interest_count || 0} 관심</span>
                    </div>
                    {daysLeft > 0 && (
                      <span className={`text-[12px] flex items-center gap-1 ${isUrgent ? 'text-[#FF3B30] font-semibold' : 'text-txt-tertiary'}`}>
                        <Clock size={11} /> D-{daysLeft}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}

          {/* 새 프로젝트 — 목록 마지막 */}
          <Link
            href="/projects/new?from=/profile"
            className="bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl overflow-hidden group hover:bg-[#EDF0F3] dark:hover:bg-[#252527] transition-all cursor-pointer flex items-center justify-center gap-3 min-h-[8rem] sm:min-h-0 sm:h-full"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E5E5EA] dark:bg-[#3A3A3C] flex items-center justify-center group-hover:bg-[#3182F6] transition-colors">
              <Plus size={20} className="text-txt-disabled group-hover:text-white transition-colors" />
            </div>
            <span className="text-[14px] font-medium text-txt-tertiary group-hover:text-[#3182F6] transition-colors">새 프로젝트</span>
          </Link>
        </div>
      ) : (
        /* 프로젝트 없을 때 */
        <Link
          href="/projects/new?from=/profile"
          className="flex items-center gap-4 bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl p-5 group hover:bg-[#EDF0F3] dark:hover:bg-[#252527] transition-all cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-[#E5E5EA] dark:bg-[#3A3A3C] flex items-center justify-center group-hover:bg-[#3182F6] transition-colors shrink-0">
            <Plus size={24} className="text-txt-disabled group-hover:text-white transition-colors" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-txt-primary group-hover:text-[#3182F6] transition-colors">새 프로젝트 만들기</p>
            <p className="text-[13px] text-txt-tertiary">아이디어를 프로젝트로 만들어보세요</p>
          </div>
        </Link>
      )}
    </section>
  )
}
