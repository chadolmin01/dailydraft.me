'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, Share2, Heart, Coffee, Users, Eye, Clock,
  Briefcase, MapPin, Calendar, ChevronRight, Loader2, AlertCircle,
  MessageCircle, ExternalLink, Sparkles, Check
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/src/context/AuthContext'
import { useOpportunity, useUpdateOpportunity, useSimilarOpportunities, type SimilarOpportunity } from '@/src/hooks/useOpportunities'
import type { OpportunityWithCreator } from '@/src/types/opportunity'
import { useCoffeeChats } from '@/src/hooks/useCoffeeChats'
import { useProjectUpdates } from '@/src/hooks/useProjectUpdates'
import { WriteUpdateForm } from '@/components/WriteUpdateForm'
import { CoffeeChatRequestForm } from '@/components/CoffeeChatRequestForm'
import { Modal } from '@/components/ui/Modal'
import type { Opportunity } from '@/src/types/opportunity'
import { UPDATE_TYPE_CONFIG } from '@/components/project/types'
import { PublicProjectJourney } from '@/components/project/PublicProjectJourney'
import { ProjectShareMenu } from '@/components/project/ProjectShareMenu'
import { toReadableContent } from '@/src/lib/ghostwriter/format-content'
import { EmptyState } from '@/components/ui/EmptyState'
import { positionLabel } from '@/src/constants/roles'
import { timeAgo } from '@/src/lib/utils'

const TYPE_LABEL: Record<string, string> = {
  side_project: '함께 만들기',
  startup: '창업 준비',
  study: '함께 배우기',
}

function SimilarProjectsSection({ opportunityId }: { opportunityId: string | undefined }) {
  const { data: similar, isLoading } = useSimilarOpportunities(opportunityId)

  if (isLoading || !similar || similar.length === 0) return null

  return (
    <div className="border-t border-border bg-surface-bg">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center gap-1.5 mb-6">
          <Sparkles size={14} className="text-brand" />
          <span className="text-[13px] font-semibold text-txt-secondary">
            비슷한 프로젝트
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {similar.map((proj: SimilarOpportunity) => (
            <Link
              key={proj.id}
              href={`/p/${proj.id}`}
              className="group block bg-surface-card rounded-2xl border border-border p-5 hover:border-brand/40 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-medium text-txt-tertiary">
                  {TYPE_LABEL[proj.type] || '프로젝트'}
                </span>
                <span className="text-[11px] font-semibold text-brand bg-brand-bg px-2 py-0.5 rounded-full">
                  {Math.round(proj.similarity * 100)}% 유사
                </span>
              </div>
              <h3 className="text-sm font-bold text-txt-primary leading-snug mb-2 group-hover:text-brand transition-colors line-clamp-2">
                {proj.title}
              </h3>
              <p className="text-xs text-txt-tertiary leading-relaxed line-clamp-2 mb-3">
                {proj.description}
              </p>
              {proj.interest_tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {proj.interest_tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[11px] bg-surface-sunken text-txt-secondary px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// CTA Overlay Component
const SignupCTA: React.FC<{ onClose: () => void; onSignup: () => void }> = ({ onClose, onSignup }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-backdrop-in"
    onClick={onClose}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="bg-surface-card w-full max-w-sm p-8 text-center rounded-2xl shadow-xl border border-border animate-modal-in"
    >
      <div className="w-14 h-14 rounded-2xl bg-brand-bg flex items-center justify-center mx-auto mb-5">
        <Sparkles size={22} className="text-brand" />
      </div>
      <h3 className="text-xl font-bold text-txt-primary mb-2">
        이 프로젝트에 관심이 있으신가요?
      </h3>
      <p className="text-txt-tertiary mb-8 leading-relaxed break-keep text-sm">
        Draft에 가입하면 관심 표현, 커피챗 신청,<br />
        피드백 주고받기까지 모두 가능해요.
      </p>
      <button
        onClick={onSignup}
        className="w-full bg-brand hover:bg-brand-hover text-white px-8 py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.97] mb-3"
      >
        무료로 시작하기
        <ArrowRight size={16} />
      </button>
      <p className="text-[11px] text-txt-disabled mb-4">
        가입 30초 · 무료 · 바로 사용 가능
      </p>
      <button
        onClick={onClose}
        className="text-sm text-txt-disabled hover:text-txt-secondary transition-colors"
      >
        돌아가기
      </button>
    </div>
  </div>
)

// Main Component
export const ProjectDetail: React.FC<{ id: string }> = ({ id }) => {
  const router = useRouter()
  const { user } = useAuth()
  const [showCta, setShowCta] = useState(false)
  const [showCoffeeChatForm, setShowCoffeeChatForm] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showWriteUpdate, setShowWriteUpdate] = useState(false)

  const { data: oppData, isLoading: loading, isError } = useOpportunity(id)
  const updateOpportunity = useUpdateOpportunity()
  const opportunity = oppData as Opportunity | null
  const error = isError ? '프로젝트를 찾을 수 없습니다.' : null

  const creator = (oppData as OpportunityWithCreator | null)?.creator ?? null

  const { data: realUpdates = [] } = useProjectUpdates(id)

  // 조회수 트래킹
  useEffect(() => {
    if (id) {
      fetch(`/api/opportunities/${id}/view`, { method: 'POST' }).catch(() => {})
    }
  }, [id])

  // ESC to close CTA
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showCta) setShowCta(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [showCta])

  const handleShare = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const isOwner = !!(user && opportunity && user.id === opportunity.creator_id)

  const handleCoffeeChatAction = () => {
    if (isOwner) return // 자기 프로젝트에는 커피챗 신청 불가
    if (!opportunity?.creator_id) return // waitlist 프로젝트는 커피챗 불가
    if (user) {
      setShowCoffeeChatForm(true)
    } else {
      setShowCta(true)
    }
  }

  const handleSignup = () => {
    setShowCta(false)
    router.push('/login')
  }

  const daysAgo = opportunity?.created_at
    ? Math.floor((Date.now() - new Date(opportunity.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-bg">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Hero skeleton */}
          <div className="h-56 bg-surface-sunken rounded-xl border border-border skeleton-shimmer mb-6" />
          {/* Title */}
          <div className="h-7 w-2/3 bg-surface-sunken rounded-xl border border-border skeleton-shimmer mb-3" />
          <div className="h-4 w-1/3 bg-surface-sunken rounded-xl border border-border skeleton-shimmer mb-6" />
          {/* Tags */}
          <div className="flex gap-2 mb-6">
            <div className="h-6 w-16 bg-surface-sunken rounded-xl border border-border skeleton-shimmer" />
            <div className="h-6 w-20 bg-surface-sunken rounded-xl border border-border skeleton-shimmer" />
            <div className="h-6 w-14 bg-surface-sunken rounded-xl border border-border skeleton-shimmer" />
          </div>
          {/* Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              <div className="h-4 bg-surface-sunken rounded-xl border border-border skeleton-shimmer" />
              <div className="h-4 bg-surface-sunken rounded-xl border border-border skeleton-shimmer w-5/6" />
              <div className="h-4 bg-surface-sunken rounded-xl border border-border skeleton-shimmer w-4/6" />
              <div className="h-4 bg-surface-sunken rounded-xl border border-border skeleton-shimmer w-3/4" />
            </div>
            <div className="space-y-3">
              <div className="h-24 bg-surface-sunken rounded-xl border border-border skeleton-shimmer" />
              <div className="h-20 bg-surface-sunken rounded-xl border border-border skeleton-shimmer" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !opportunity) {
    return (
      <div className="min-h-screen bg-surface-bg flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-txt-disabled mx-auto mb-4" />
          <h2 className="text-xl font-bold text-txt-primary mb-2">프로젝트를 찾을 수 없습니다</h2>
          <p className="text-txt-tertiary mb-6">{error || '존재하지 않거나 삭제된 프로젝트입니다.'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-surface-inverse text-txt-inverse px-6 py-3 rounded-xl font-bold text-sm hover:bg-surface-inverse/90 transition-colors border border-surface-inverse hover:opacity-90 active:scale-[0.97]"
          >
            <ArrowLeft size={16} />
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const interestCount = opportunity.interest_count ?? 0
  const viewsCount = opportunity.views_count ?? 0

  const projectLinks = opportunity.project_links as Record<string, string> | null

  return (
    <div className="min-h-screen bg-surface-bg">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-surface-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="hidden sm:flex items-center gap-2 text-sm text-txt-secondary hover:text-txt-primary transition-colors"
          >
            <ArrowLeft size={16} />
            뒤로
          </button>
          <Link href="/" className="font-black text-lg tracking-tight">
            Draft
          </Link>
          <ProjectShareMenu
            projectTitle={opportunity.title}
            projectType={opportunity.type}
            neededRoles={(opportunity.needed_roles || []) as string[]}
            url={typeof window !== 'undefined' ? window.location.href : ''}
          />
        </div>
      </nav>

      {/* Hero Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              {/* Type Badge */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[12px] font-medium px-2.5 py-1 rounded-full bg-surface-sunken text-txt-secondary">
                  {opportunity.type === 'side_project' ? '함께 만들기' :
                   opportunity.type === 'startup' ? '창업 준비' :
                   opportunity.type === 'study' ? '함께 배우기' : '프로젝트'}
                </span>
                {opportunity.status === 'active' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-success-bg text-status-success-text text-[12px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-indicator-online animate-pulse" />
                    모집 중
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-surface-sunken text-txt-tertiary text-[12px] font-semibold">
                    마감
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-txt-primary mb-3 break-keep leading-tight">
                {opportunity.title}
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-txt-tertiary">
                {creator && (
                  <span className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[11px] font-bold">
                      {creator.nickname.charAt(0)}
                    </div>
                    <span className="text-txt-secondary font-medium">{creator.nickname}</span>
                  </span>
                )}
                {opportunity.created_at && (
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {daysAgo === 0 ? '오늘' : `${daysAgo}일 전`}
                  </span>
                )}
                {opportunity.location_type && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {opportunity.location_type === 'remote' ? '원격' :
                     opportunity.location_type === 'offline' ? '오프라인' : '혼합'}
                    {opportunity.location && ` · ${opportunity.location}`}
                  </span>
                )}
              </div>
            </div>

            {/* Action Button (Desktop) */}
            <div className="hidden md:flex flex-col gap-3 shrink-0">
              <button
                onClick={handleCoffeeChatAction}
                className="bg-brand hover:bg-brand-hover text-white px-8 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors border border-brand hover:opacity-90 active:scale-[0.97]"
              >
                <Coffee size={16} />
                커피챗 신청
              </button>
            </div>
          </div>

          {/* Tags */}
          {opportunity.interest_tags && opportunity.interest_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-6">
              {opportunity.interest_tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-surface-sunken text-txt-secondary text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Stats Bar */}
          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-border text-sm text-txt-tertiary">
            {interestCount > 0 && (
              <span className="flex items-center gap-1.5">
                <Heart size={14} className="text-txt-disabled" />
                관심 <span className="font-bold text-txt-primary">{interestCount}</span>
              </span>
            )}
            {viewsCount > 0 && (
              <span className="flex items-center gap-1.5">
                <Eye size={14} className="text-txt-disabled" />
                조회 <span className="font-bold text-txt-primary">{viewsCount}</span>
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Content (2/3) */}
          <div className="lg:col-span-2 space-y-10">
            {/* Project Description */}
            <section>
              <h2 className="text-[13px] font-semibold text-txt-primary mb-4">
                프로젝트 소개
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-txt-secondary leading-relaxed break-keep whitespace-pre-line text-[0.9375rem]">
                  {opportunity.description}
                </p>
              </div>
            </section>

            {/* Pain Point (if exists) */}
            {opportunity.pain_point && (
              <section className="bg-surface-sunken rounded-2xl border border-border p-6">
                <h2 className="text-[13px] font-semibold text-txt-primary mb-3">
                  해결하려는 문제
                </h2>
                <p className="text-txt-secondary leading-relaxed break-keep text-[0.9375rem]">
                  {opportunity.pain_point}
                </p>
              </section>
            )}

            {/* Weekly Updates Timeline — owner always sees, others only when show_updates */}
            {(isOwner || opportunity.show_updates) && (
            <section>
              {realUpdates.length > 0 && (
                <PublicProjectJourney updates={realUpdates} createdAt={opportunity.created_at} />
              )}
              <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-[13px] font-semibold text-txt-primary">
                    주간 업데이트
                  </h2>
                  {!opportunity.show_updates && isOwner && (
                    <span className="text-[10px] font-medium text-txt-disabled px-1.5 py-0.5 rounded-full bg-surface-sunken">
                      비공개
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {isOwner && (
                    <button
                      onClick={() => {
                        updateOpportunity.mutate({
                          id: opportunity.id,
                          updates: { show_updates: !opportunity.show_updates },
                        })
                      }}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors ${
                        opportunity.show_updates
                          ? 'bg-status-success-bg text-status-success-text'
                          : 'bg-surface-sunken text-txt-disabled hover:bg-border'
                      }`}
                    >
                      {opportunity.show_updates ? '공개 중' : '비공개'}
                    </button>
                  )}
                  <span className="text-[11px] text-txt-disabled">
                    {realUpdates.length}개의 업데이트
                  </span>
                  {isOwner && (
                    <button
                      onClick={() => setShowWriteUpdate(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold bg-surface-inverse text-txt-inverse rounded-full hover:opacity-90 active:scale-[0.97] transition-all"
                    >
                      + 작성하기
                    </button>
                  )}
                </div>
              </div>

              {realUpdates.length > 0 ? (
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-[0.9375rem] top-2 bottom-2 w-[1px] bg-border" />

                  <div className="space-y-6">
                    {realUpdates.map((update, index) => {
                      const config = UPDATE_TYPE_CONFIG[update.update_type] || UPDATE_TYPE_CONFIG.general
                      return (
                        <div key={update.id} className="relative pl-10">
                          {/* Timeline Dot */}
                          <div className={`absolute left-[0.6875rem] top-2 w-2.5 h-2.5 rounded-full border-2 bg-surface-card ${
                            index === 0 ? 'border-brand' : 'border-border'
                          }`} />

                          <div className="bg-surface-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${config.badgeColor}`}>
                                {config.label}
                              </span>
                              <span className="text-[11px] text-txt-disabled">
                                {update.week_number}주차
                              </span>
                              {update.created_at && (
                                <span className="text-[11px] text-txt-disabled">· {timeAgo(update.created_at)}</span>
                              )}
                            </div>
                            <h3 className="font-semibold text-txt-primary mb-1.5">{update.title}</h3>
                            <p className="text-sm text-txt-secondary leading-relaxed break-keep whitespace-pre-line">
                              {toReadableContent(update.content)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={Clock}
                  title="아직 업데이트가 없습니다"
                  description={isOwner ? "첫 업데이트를 작성하면 팀원에게 자동으로 알림이 전송됩니다" : undefined}
                  actionLabel={isOwner ? "업데이트 작성하기" : undefined}
                  onAction={isOwner ? () => setShowWriteUpdate(true) : undefined}
                />
              )}
            </section>
            )}

            {/* Write Update Modal (Owner) */}
            {opportunity && isOwner && (
              <WriteUpdateForm
                opportunityId={opportunity.id}
                createdAt={opportunity.created_at}
                isOpen={showWriteUpdate}
                onClose={() => setShowWriteUpdate(false)}
              />
            )}

            {/* Feedback Section */}
            <section>
              <h2 className="text-[13px] font-semibold text-txt-primary mb-4">
                커뮤니티 피드백
              </h2>
              <div className="bg-surface-sunken rounded-2xl border border-border p-8 text-center">
                <MessageCircle size={32} className="text-txt-disabled mx-auto mb-3" />
                <p className="font-semibold text-txt-primary mb-1">피드백을 남겨보세요</p>
                <p className="text-sm text-txt-tertiary mb-4 break-keep">
                  아이디어에 대한 솔직한 의견이 프로젝트를 성장시킵니다
                </p>
                <button
                  onClick={handleCoffeeChatAction}
                  className="inline-flex items-center gap-2 bg-surface-inverse text-txt-inverse px-5 py-2.5 rounded-full font-semibold text-sm hover:opacity-90 transition-all active:scale-[0.97]"
                >
                  피드백 작성하기
                  <ChevronRight size={14} />
                </button>
              </div>
            </section>
          </div>

          {/* Right: Sidebar (1/3) */}
          <aside className="space-y-6">
            {/* Team Section */}
            <div className="bg-surface-card rounded-2xl border border-border p-6">
              <h3 className="text-[13px] font-semibold text-txt-primary mb-4">
                팀 정보
              </h3>
              {creator ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm">
                      {creator.nickname.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-txt-primary text-sm">{creator.nickname}</p>
                      <p className="text-xs text-txt-tertiary">
                        {positionLabel(creator.desired_position || '') || '메이커'}
                        {creator.university && ` · ${creator.university}`}
                      </p>
                    </div>
                  </div>

                  {Array.isArray(creator.skills) && creator.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {(Array.isArray(creator.skills) ? creator.skills : []).slice(0, 5).map((skill, i) => {
                        const label = typeof skill === 'string' ? skill : (skill as any)?.name || ''
                        return (
                          <span key={label || i} className="text-[11px] bg-surface-sunken text-txt-secondary px-2 py-0.5 rounded-full font-medium">
                            {label}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-sunken flex items-center justify-center font-bold text-sm text-txt-tertiary">
                    ?
                  </div>
                  <div>
                    <p className="font-semibold text-txt-primary text-sm">익명 메이커</p>
                    <p className="text-xs text-txt-tertiary">프로필 비공개</p>
                  </div>
                </div>
              )}
            </div>

            {/* Needed Roles */}
            {opportunity.needed_roles && opportunity.needed_roles.length > 0 && (
              <div className="bg-surface-card rounded-2xl border border-border p-6">
                <h3 className="text-[13px] font-semibold text-txt-primary mb-4">
                  모집 중인 포지션
                </h3>
                <div className="space-y-3">
                  {opportunity.needed_roles.map((role) => {
                    const filledRoles = (opportunity as any).filled_roles as string[] | null
                    const isFilled = filledRoles?.includes(role) ?? false

                    if (isOwner) {
                      return (
                        <button
                          key={role}
                          onClick={() => {
                            const current = (filledRoles || []) as string[]
                            const next = isFilled
                              ? current.filter(r => r !== role)
                              : [...current, role]
                            updateOpportunity.mutate(
                              { id: opportunity.id, updates: { filled_roles: next } as any },
                              {
                                onSuccess: () => {
                                  toast.success(
                                    isFilled
                                      ? `${role} 포지션을 다시 모집합니다`
                                      : `${role} 포지션 모집이 완료되었습니다`
                                  )
                                },
                              }
                            )
                          }}
                          className={`group w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                            isFilled
                              ? 'bg-surface-sunken border-border hover:border-brand/40 hover:bg-brand-bg/50'
                              : 'bg-brand-bg border-brand-border hover:bg-status-success-bg hover:border-status-success-text/30'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isFilled ? (
                              <Check size={14} className="text-status-success-text group-hover:text-brand transition-colors" />
                            ) : (
                              <Briefcase size={14} className="text-brand group-hover:text-status-success-text transition-colors" />
                            )}
                            <span className={`font-medium text-sm ${isFilled ? 'text-txt-tertiary' : 'text-txt-primary'}`}>
                              {role}
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold">
                            <span className={`group-hover:hidden ${isFilled ? 'text-status-success-text' : 'text-brand'}`}>
                              {isFilled ? '모집완료' : '모집중'}
                            </span>
                            <span className={`hidden group-hover:inline ${isFilled ? 'text-brand' : 'text-status-success-text'}`}>
                              {isFilled ? '다시 모집하기' : '모집완료로 변경'}
                            </span>
                          </span>
                        </button>
                      )
                    }

                    if (isFilled) {
                      return (
                        <div
                          key={role}
                          className="flex items-center justify-between p-3 rounded-xl bg-surface-sunken border border-border opacity-60"
                        >
                          <div className="flex items-center gap-2">
                            <Check size={14} className="text-status-success-text" />
                            <span className="font-medium text-sm text-txt-tertiary">{role}</span>
                          </div>
                          <span className="text-[11px] font-semibold text-txt-disabled">
                            모집완료
                          </span>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={role}
                        className="flex items-center justify-between p-3 rounded-xl bg-brand-bg border border-brand-border"
                      >
                        <div className="flex items-center gap-2">
                          <Briefcase size={14} className="text-brand" />
                          <span className="font-medium text-sm text-txt-primary">{role}</span>
                        </div>
                        <button
                          onClick={handleCoffeeChatAction}
                          className="text-[11px] font-semibold text-brand hover:text-brand-hover transition-colors"
                        >
                          커피챗 신청 &rarr;
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Project Info */}
            <div className="bg-surface-card rounded-2xl border border-border p-6">
              <h3 className="text-[13px] font-semibold text-txt-primary mb-4">
                프로젝트 정보
              </h3>
              <div className="space-y-3 text-sm">
                {opportunity.time_commitment && (
                  <div className="flex items-center justify-between">
                    <span className="text-txt-tertiary flex items-center gap-1.5">
                      <Clock size={14} />
                      시간 투자
                    </span>
                    <span className="font-medium text-txt-primary">{opportunity.time_commitment}</span>
                  </div>
                )}
                {opportunity.location_type && (
                  <div className="flex items-center justify-between">
                    <span className="text-txt-tertiary flex items-center gap-1.5">
                      <MapPin size={14} />
                      활동 방식
                    </span>
                    <span className="font-medium text-txt-primary">
                      {opportunity.location_type === 'remote' ? '원격' :
                       opportunity.location_type === 'offline' ? '오프라인' : '혼합'}
                    </span>
                  </div>
                )}
                {opportunity.compensation_type && (
                  <div className="flex items-center justify-between">
                    <span className="text-txt-tertiary flex items-center gap-1.5">
                      <Sparkles size={14} />
                      보상
                    </span>
                    <span className="font-medium text-txt-primary">
                      {opportunity.compensation_type === 'equity' ? '지분' :
                       opportunity.compensation_type === 'paid' ? '유급' : '무급 (경험)'}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-txt-tertiary flex items-center gap-1.5">
                    <Users size={14} />
                    관심 표현
                  </span>
                  <span className="font-medium text-txt-primary">{interestCount}명</span>
                </div>
              </div>
            </div>

            {/* Project Links */}
            {projectLinks && Object.keys(projectLinks).length > 0 && (
              <div className="bg-surface-card rounded-2xl border border-border p-6">
                <h3 className="text-[13px] font-semibold text-txt-primary mb-4">
                  링크
                </h3>
                <div className="space-y-1">
                  {Object.entries(projectLinks).map(([key, url]) => (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-txt-secondary hover:text-txt-primary transition-colors px-3 py-2.5 rounded-xl hover:bg-surface-sunken"
                    >
                      <ExternalLink size={14} />
                      {key}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Card */}
            <div className="bg-surface-inverse text-txt-inverse p-6 rounded-2xl shadow-md">
              <h3 className="font-bold mb-2">프로젝트에 참여하고 싶나요?</h3>
              <p className="text-txt-inverse/60 text-sm mb-4 break-keep">
                커피챗으로 메이커와 직접 이야기해보세요.
              </p>
              <button
                onClick={handleCoffeeChatAction}
                className="w-full bg-white text-black py-3 rounded-xl font-bold text-sm hover:bg-surface-sunken transition-colors flex items-center justify-center gap-2 active:scale-[0.97]"
              >
                <Coffee size={14} />
                커피챗 신청하기
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Similar Projects Section */}
      <SimilarProjectsSection opportunityId={opportunity?.id} />

      {/* Mobile Fixed CTA */}
      <div
        className="fixed left-0 right-0 bg-surface-card border-t border-border p-4 md:hidden z-30"
        style={{ bottom: 'calc(var(--bottom-tab-height) + env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          onClick={handleCoffeeChatAction}
          className="w-full bg-brand text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-brand hover:opacity-90 active:scale-[0.97] transition-all"
        >
          <Coffee size={16} />
          커피챗 신청
        </button>
      </div>

      {/* Mobile bottom padding (CTA ~72px + tab bar 56px + margin) */}
      <div className="h-36 md:hidden" />

      {/* Coffee Chat Form (Authenticated) — uses shared Modal */}
      {opportunity && (
        <Modal
          isOpen={showCoffeeChatForm}
          onClose={() => setShowCoffeeChatForm(false)}
          size="sm"
          showClose={false}
        >
          <div className="px-6 py-4">
            <CoffeeChatRequestForm
              opportunityId={opportunity.id}
              onClose={() => setShowCoffeeChatForm(false)}
            />
          </div>
        </Modal>
      )}

      {/* Signup CTA Overlay (Non-authenticated) */}
      {showCta && <SignupCTA onClose={() => setShowCta(false)} onSignup={handleSignup} />}
    </div>
  )
}
