import React, { useRef, useCallback } from 'react'
import Image from 'next/image'
import {
  Heart, Calendar, MapPin, Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badges } from '@/components/ui/Badge'
import { ProjectHeaderProps } from './types'
import { hapticMedium } from '@/src/utils/haptic'

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  opportunity,
  creator,
  isOwner,
  matchScore,
  daysAgo,
  hasInterested,
  interestLoading,
  handleInterest,
}) => {
  const hasImages = opportunity.demo_images && opportunity.demo_images.length > 0

  if (hasImages) {
    return (
      <>
        {/* Hero Cover -- first image as background */}
        <div className="relative h-48 sm:h-56 overflow-hidden">
          <Image
            src={opportunity.demo_images![0]}
            alt={opportunity.title}
            fill
            priority
            sizes="(max-width:768px) 100vw, 768px"
            className="object-cover"
            quality={90}
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Title & Meta overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-4 sm:pb-5">
            <div className="flex items-start gap-2 mb-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white break-keep leading-tight drop-shadow-sm">
                {opportunity.title}
              </h2>
              <Badges badges={(opportunity as unknown as { badges?: string[] | null }).badges ?? null} className="mt-1" />
              {!isOwner && matchScore != null && matchScore >= 60 && (
                <span className={`text-[0.625rem] font-mono font-bold px-1.5 py-0.5 border shrink-0 mt-1 ${
                  matchScore >= 80 ? 'bg-status-success-bg text-status-success-text border-indicator-online/20'
                  : 'bg-white/20 text-white/80 border-white/30'
                }`}>
                  {matchScore >= 80 ? '잘 맞는 프로젝트' : '관심 가능'}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
              {creator ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-[0.5625rem] font-bold text-white">
                    {creator.nickname.charAt(0)}
                  </div>
                  <span className="font-medium text-white/90">{creator.nickname}</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-[0.5625rem] font-bold text-white/70">?</div>
                  <span className="font-medium text-white/90">익명</span>
                </span>
              )}
              {opportunity.created_at && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  {daysAgo === 0 ? '오늘' : `${daysAgo}일 전`}
                </span>
              )}
              {opportunity.location_type && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={12} />
                  {opportunity.location_type === 'remote' ? '원격' :
                   opportunity.location_type === 'offline' ? '오프라인' : '혼합'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tags + Stats below cover */}
        <div className="px-4 sm:px-8 pt-3 pb-3">
          {opportunity.interest_tags && opportunity.interest_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {opportunity.interest_tags.map((tag) => (
                <span key={tag} className="px-2.5 py-1 bg-surface-card text-txt-tertiary text-xs border border-border">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={() => { hapticMedium(); if (isOwner) { toast('내 프로젝트에는 관심 표시를 할 수 없어요'); return } handleInterest() }}
              disabled={interestLoading}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs font-bold transition-all ${
                hasInterested
                  ? 'border-status-danger-text/20 bg-status-danger-bg text-status-danger-text'
                  : 'border-border bg-surface-card text-txt-secondary hover:border-status-danger-text/20 hover:text-status-danger-text'
              } disabled:opacity-40 disabled:cursor-default`}
            >
              <Heart size={12} className={`${hasInterested ? 'fill-current heart-burst' : ''} transition-transform`} />
              {hasInterested ? '관심 표현됨' : '관심 있어요'}
              <span className="text-txt-disabled font-mono">{(opportunity.interest_count ?? 0) + (hasInterested ? 1 : 0)}</span>
            </button>
            <span className="flex items-center gap-1 text-xs text-txt-disabled">
              <Eye size={12} />
              {opportunity.views_count ?? 0}
            </span>
          </div>
        </div>

        {/* Extra images gallery */}
        {opportunity.demo_images!.length > 1 && (
          <div className="px-4 sm:px-8 pb-3">
            <div className="flex gap-2 overflow-x-auto">
              {opportunity.demo_images!.slice(1).map((src, idx) => (
                <div key={idx} className="relative h-24 w-32 shrink-0 border border-border">
                  <Image
                    src={src}
                    alt={`${opportunity.title} 이미지 ${idx + 2}`}
                    fill
                    sizes="128px"
                    className="object-cover"
                    quality={85}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    /* Plain Header -- no images */
    <div className="px-4 sm:px-8 pt-4 sm:pt-6 pb-3">
      <div className="flex items-start gap-2 mb-3">
        <h2 className="text-2xl font-bold text-txt-primary break-keep leading-tight">
          {opportunity.title}
        </h2>
        <Badges badges={(opportunity as unknown as { badges?: string[] | null }).badges ?? null} className="mt-1" />
        {!isOwner && matchScore != null && matchScore >= 60 && (
          <span className={`text-[0.625rem] font-mono font-bold px-1.5 py-0.5 border shrink-0 mt-1 ${
            matchScore >= 80 ? 'bg-status-success-bg text-status-success-text border-indicator-online/20'
            : 'bg-brand-bg text-brand border-brand-border'
          }`}>
            {matchScore >= 80 ? '잘 맞는 프로젝트' : '관심 가능'}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm text-txt-tertiary">
        {creator ? (
          <span className="flex items-center gap-2">
            <div className="w-6 h-6 bg-surface-inverse rounded-full flex items-center justify-center text-[0.625rem] font-bold text-txt-inverse">
              {creator.nickname.charAt(0)}
            </div>
            <span className="font-medium text-txt-secondary">{creator.nickname}</span>
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <div className="w-6 h-6 bg-surface-sunken flex items-center justify-center text-[0.625rem] font-bold text-txt-tertiary border border-border">?</div>
            <span className="font-medium text-txt-secondary">익명</span>
          </span>
        )}
        {opportunity.created_at && (
          <span className="flex items-center gap-1.5 text-txt-disabled">
            <Calendar size={13} />
            {daysAgo === 0 ? '오늘' : `${daysAgo}일 전`}
          </span>
        )}
        {opportunity.location_type && (
          <span className="flex items-center gap-1.5 text-txt-disabled">
            <MapPin size={13} />
            {opportunity.location_type === 'remote' ? '원격' :
             opportunity.location_type === 'offline' ? '오프라인' : '혼합'}
          </span>
        )}
      </div>
      {opportunity.interest_tags && opportunity.interest_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {opportunity.interest_tags.map((tag) => (
            <span key={tag} className="px-2.5 py-1 bg-surface-card text-txt-tertiary text-xs border border-border">
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={() => { hapticMedium(); handleInterest() }}
          disabled={isOwner || interestLoading}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs font-bold transition-all ${
            hasInterested
              ? 'border-status-danger-text/20 bg-status-danger-bg text-status-danger-text'
              : 'border-border bg-surface-card text-txt-secondary hover:border-status-danger-text/20 hover:text-status-danger-text'
          } disabled:opacity-40 disabled:cursor-default`}
        >
          <Heart size={12} className={hasInterested ? 'fill-current' : ''} />
          {hasInterested ? '관심 표현됨' : '관심 있어요'}
          <span className="text-txt-disabled font-mono">{(opportunity.interest_count ?? 0) + (hasInterested ? 1 : 0)}</span>
        </button>
        <span className="flex items-center gap-1 text-xs text-txt-disabled">
          <Eye size={12} />
          {opportunity.views_count ?? 0}
        </span>
      </div>
    </div>
  )
}
