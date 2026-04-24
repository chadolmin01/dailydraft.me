'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { X, ArrowRight, Calendar, Users, Eye, Heart, CheckCircle2 } from 'lucide-react'
import { useOpportunity } from '@/src/hooks/useOpportunities'
import { useBackHandler } from '@/src/hooks/useBackHandler'
import { projectRoleLabel } from '@/src/constants/roles'
import { CATEGORY_SLUGS } from '@/src/constants/categories'

interface Props {
  projectId: string | null
  onClose: () => void
}

// category fallback cover — ProjectHeader/ExploreProjectGrid 와 동일 패턴
function getCategoryCover(tags: string[]): string {
  const match = tags.find(t => CATEGORY_SLUGS.includes(t))
  return `/categories/${match ?? 'portfolio'}.svg`
}

/**
 * 프로젝트 빠른 미리보기 모달.
 *
 * 기존 ProjectDetailModal (654 lines — 탭/커피챗/팀관리/지원 폼 전부) 를 대체.
 * 여기서는 의도적으로 핵심만: 제목 / 설명 / 태그 / 크리에이터 / 주요 수치.
 *
 * "자세히 보기" 버튼 → /p/[id] 또는 /projects/[id] 페이지 이동.
 * 액션(커피챗, 지원 등) 은 페이지에서 처리 → 모달은 디스커버리 전용.
 */
export function ProjectPreviewModal({ projectId, onClose }: Props) {
  useBackHandler(!!projectId, onClose, 'project-preview')
  const { data: opportunity, isLoading } = useOpportunity(projectId ?? undefined)

  if (!projectId) return null

  const creator = (opportunity?.creator ?? null) as {
    id: string
    nickname: string | null
    desired_position: string | null
  } | null

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-modal-backdrop"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-modal flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={opportunity?.title || '프로젝트 미리보기'}
          className="w-full max-w-[480px] bg-surface-card rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden pointer-events-auto max-h-[90vh] flex flex-col"
        >
          {/* 닫기 */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
            <span className="text-[12px] font-semibold text-txt-tertiary">미리보기</span>
            <button
              onClick={onClose}
              className="p-1.5 -mr-1 text-txt-tertiary hover:text-txt-primary rounded-full hover:bg-surface-sunken transition-colors"
              aria-label="닫기"
            >
              <X size={16} />
            </button>
          </div>

          {isLoading || !opportunity ? (
            <div className="px-5 pb-6">
              <div className="animate-pulse space-y-3">
                <div className="h-32 bg-surface-sunken rounded-xl w-full" />
                <div className="h-6 bg-surface-sunken rounded w-3/4" />
                <div className="h-4 bg-surface-sunken rounded w-full" />
                <div className="h-4 bg-surface-sunken rounded w-5/6" />
                <div className="h-10 bg-surface-sunken rounded w-full mt-5" />
              </div>
            </div>
          ) : (
            <>
              {/* 본문 — 스크롤 가능 */}
              <div className="px-5 py-2 overflow-y-auto flex-1">
                {/* 헤더 이미지 — demo_images[0] 우선, 없으면 카테고리 커버 폴백 (ProjectHeader 와 동일) */}
                <div className="bg-surface-sunken rounded-xl overflow-hidden h-[140px] mb-4 relative">
                  {Array.isArray(opportunity.demo_images) && opportunity.demo_images.length > 0 ? (
                    <Image
                      src={opportunity.demo_images[0]}
                      alt={opportunity.title}
                      fill
                      sizes="480px"
                      className="object-cover"
                      quality={85}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <Image
                        src={getCategoryCover(opportunity.interest_tags || [])}
                        alt="카테고리"
                        width={48}
                        height={48}
                        className="opacity-30"
                      />
                    </div>
                  )}
                </div>

                {/* 제목 */}
                <h2 className="text-xl font-bold text-txt-primary leading-tight mb-2 break-keep">
                  {opportunity.title}
                </h2>

                {/* 크리에이터 + 메타 */}
                <div className="flex items-center gap-2 text-[13px] text-txt-tertiary mb-4">
                  {creator?.nickname && (
                    <span className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center text-[10px] font-bold">
                        {creator.nickname.charAt(0)}
                      </div>
                      <span className="text-txt-secondary font-medium">{creator.nickname}</span>
                    </span>
                  )}
                  {creator?.desired_position && (
                    <>
                      <span className="text-txt-disabled">·</span>
                      <span>{creator.desired_position}</span>
                    </>
                  )}
                </div>

                {/* 설명 */}
                {opportunity.description && (
                  <p className="text-[14px] text-txt-secondary leading-relaxed mb-4 whitespace-pre-wrap break-keep line-clamp-4">
                    {opportunity.description}
                  </p>
                )}

                {/* 필요 역할 — filled_roles 는 line-through + check 로 표시 */}
                {Array.isArray(opportunity.needed_roles) && opportunity.needed_roles.length > 0 && (() => {
                  const filledRoles = ((opportunity as unknown as { filled_roles?: string[] | null }).filled_roles || []) as string[]
                  return (
                    <div className="mb-3">
                      <span className="text-[12px] font-semibold text-txt-secondary mr-2">
                        찾는 역할
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {opportunity.needed_roles.map((role: string) => {
                          const isFilled = filledRoles.includes(role)
                          return (
                            <span
                              key={role}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-medium rounded-full border ${
                                isFilled
                                  ? 'bg-status-success-bg text-status-success-text border-status-success-text/20 line-through opacity-60'
                                  : 'bg-brand-bg text-brand border-brand-border'
                              }`}
                            >
                              {isFilled && <CheckCircle2 size={11} />}
                              {projectRoleLabel(role) || role}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}

                {/* 태그 */}
                {Array.isArray(opportunity.interest_tags) && opportunity.interest_tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1.5">
                      {opportunity.interest_tags.slice(0, 6).map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 bg-surface-sunken text-txt-secondary text-[12px] rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 미니 통계 */}
                <div className="flex items-center gap-4 text-[12px] text-txt-tertiary pt-2 border-t border-border">
                  {(opportunity as { views_count?: number }).views_count != null && (
                    <span className="inline-flex items-center gap-1">
                      <Eye size={12} />
                      {(opportunity as { views_count?: number }).views_count}
                    </span>
                  )}
                  {(opportunity as { interest_count?: number }).interest_count != null && (
                    <span className="inline-flex items-center gap-1">
                      <Heart size={12} />
                      {(opportunity as { interest_count?: number }).interest_count}
                    </span>
                  )}
                  {(opportunity as { applications_count?: number }).applications_count != null && (
                    <span className="inline-flex items-center gap-1">
                      <Users size={12} />
                      {(opportunity as { applications_count?: number }).applications_count}
                    </span>
                  )}
                  {opportunity.created_at && (
                    <span className="inline-flex items-center gap-1 ml-auto">
                      <Calendar size={12} />
                      {new Date(opportunity.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  )}
                </div>
              </div>

              {/* CTA */}
              <div className="px-5 py-4 border-t border-border shrink-0 bg-surface-card">
                <Link
                  href={`/p/${opportunity.id}`}
                  onClick={onClose}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-brand text-white text-[14px] font-semibold rounded-xl hover:bg-brand-hover transition-colors active:scale-[0.98]"
                >
                  자세히 보기
                  <ArrowRight size={14} />
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </>
  )
}
