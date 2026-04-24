import React from 'react'
import { Loader2, Sparkles, MapPin, Clock } from 'lucide-react'
import { LOCATION_TYPE_OPTIONS, TIME_OPTIONS, COMPENSATION_OPTIONS } from '../constants'
import type { TypeTheme } from '../constants'
import { RolesGrid } from './RolesGrid'
import { DiscordChannelSelect } from './DiscordChannelSelect'

interface ProjectInfoSidebarProps {
  theme: TypeTheme
  selectedRoles: string[]
  locationType: string
  timeCommitment: string
  compensationType: string
  compensationDetails: string
  onToggleRole: (role: string) => void
  onSetLocationType: (value: string) => void
  onSetTimeCommitment: (value: string) => void
  onSetCompensationType: (value: string) => void
  onSetCompensationDetails: (value: string) => void
  isPending: boolean
  imageUploading: boolean
  submitLabel?: string
  hideRolesOnMobile?: boolean
  rolesError?: string
  // Discord 채널 매핑용 (선택적)
  clubId?: string | null
  opportunityId?: string
  onDiscordChannelSelect?: (channelId: string, channelName: string) => void
}

function OptionGroup({ label, icon: Icon, options, value, onSelect, theme }: {
  label: string
  icon: React.ElementType
  options: { value: string; label: string }[]
  value: string
  onSelect: (v: string) => void
  theme: TypeTheme
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        {/* @ts-expect-error lucide icon size prop */}
        <Icon size={13} className="text-txt-disabled" />
        <span className="text-xs text-txt-secondary font-medium">{label}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 ml-5">
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={`relative px-3 py-1.5 text-xs border rounded-lg transition-all overflow-hidden active:scale-[0.93] ${
              value === opt.value
                ? theme.chipOn
                : 'bg-surface-card text-txt-secondary border-border-subtle hover:border-border'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ProjectInfoSidebar({
  theme,
  selectedRoles,
  locationType,
  timeCommitment,
  compensationType,
  compensationDetails,
  onToggleRole,
  onSetLocationType,
  onSetTimeCommitment,
  onSetCompensationType,
  onSetCompensationDetails,
  isPending,
  imageUploading,
  submitLabel,
  hideRolesOnMobile,
  rolesError,
  clubId,
  opportunityId,
  onDiscordChannelSelect,
}: ProjectInfoSidebarProps) {
  return (
    <div className="md:col-span-2 space-y-6">

      {/* Roles */}
      <div className={hideRolesOnMobile ? 'hidden md:block' : undefined}>
        <RolesGrid
          theme={theme}
          selectedRoles={selectedRoles}
          onToggleRole={onToggleRole}
          rolesLabel={theme.rolesLabel}
          error={rolesError}
        />
      </div>

      {/* Project Info */}
      <div>
        <h3 className="text-[10px] font-medium text-txt-tertiary mb-3">
          프로젝트 정보
        </h3>
        <div className="space-y-4">
          <OptionGroup label="활동 방식" icon={MapPin} options={LOCATION_TYPE_OPTIONS} value={locationType} onSelect={onSetLocationType} theme={theme} />
          <OptionGroup label="시간 투자" icon={Clock} options={TIME_OPTIONS} value={timeCommitment} onSelect={onSetTimeCommitment} theme={theme} />
          <OptionGroup label="보상 방식" icon={Sparkles} options={COMPENSATION_OPTIONS} value={compensationType} onSelect={onSetCompensationType} theme={theme} />
          <div className={`transition-all duration-300 overflow-hidden ${
            compensationType && compensationType !== 'unpaid' ? 'max-h-20 opacity-100 mt-0' : 'max-h-0 opacity-0'
          }`}>
            <input
              type="text"
              value={compensationDetails}
              onChange={(e) => onSetCompensationDetails(e.target.value)}
              placeholder="상세 (예: 지분 5%, 월 50만원)"
              className="px-3 py-2 border border-border-subtle rounded-lg text-base sm:text-sm ml-5 w-[calc(100%-1.25rem)] focus:outline-hidden focus:ring-2 focus:ring-brand/10 focus:border-brand bg-transparent transition-all"
            />
          </div>
          {/* Discord 채널 — clubId가 있고 봇 설치된 경우만 자동 표시 */}
          <DiscordChannelSelect
            clubId={clubId}
            opportunityId={opportunityId}
            onSelect={onDiscordChannelSelect}
          />
        </div>
      </div>

      {/* Submit CTA (desktop) */}
      <div className={`hidden md:block p-5 text-txt-inverse border border-transparent rounded-xl transition-all ${theme.cta}`}>
        <h3 className="font-bold text-sm mb-1">{theme.ctaTitle}</h3>
        <p className="text-white/60 text-xs mb-4 break-keep">
          {theme.ctaDesc}
        </p>
        <button
          type="submit"
          disabled={isPending || imageUploading}
          className={`group/cta relative w-full py-3 font-bold text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden hover:scale-[1.01] active:scale-[0.98] ${theme.ctaBtn}`}
        >
          {/* Shimmer effect */}
          <span className="absolute inset-0 -translate-x-full group-hover/cta:translate-x-full transition-transform duration-700 bg-linear-to-r from-transparent via-white/20 to-transparent" />
          <span className="relative flex items-center gap-2">
            {imageUploading ? (
              <><Loader2 size={14} className="animate-spin" /> 이미지 업로드 중...</>
            ) : isPending ? (
              <><Loader2 size={14} className="animate-spin" /> 생성 중...</>
            ) : (
              <>{submitLabel || '프로젝트 등록하기'}</>
            )}
          </span>
        </button>
      </div>
    </div>
  )
}
