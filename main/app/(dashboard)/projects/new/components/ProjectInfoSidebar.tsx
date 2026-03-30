import React from 'react'
import { Loader2, Sparkles, MapPin, Clock } from 'lucide-react'
import { ROLE_OPTIONS, LOCATION_TYPE_OPTIONS, TIME_OPTIONS, COMPENSATION_OPTIONS } from '../constants'
import type { TypeTheme } from '../constants'

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
}: ProjectInfoSidebarProps) {
  return (
    <div className="md:col-span-2 space-y-6">

      {/* Roles */}
      <div>
        <h3 className="text-[0.625rem] font-medium text-txt-tertiary mb-2">
          {theme.rolesLabel}
        </h3>
        <div className="grid grid-cols-3 gap-1.5">
          {ROLE_OPTIONS.map(({ value, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => onToggleRole(value)}
              className={`flex flex-col items-center justify-center aspect-square border transition-colors ${
                selectedRoles.includes(value)
                  ? theme.roleOn
                  : 'bg-surface-sunken text-txt-secondary border-border-subtle hover:bg-accent-secondary hover:border-border'
              }`}
            >
              <Icon size={18} className={selectedRoles.includes(value) ? `${theme.roleIconOn} mb-1.5` : 'text-txt-disabled mb-1.5'} />
              <span className="text-xs font-medium">{value}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Project Info */}
      <div>
        <h3 className="text-[0.625rem] font-medium text-txt-tertiary mb-3">
          프로젝트 정보
        </h3>
        <div className="space-y-4">
          {/* Location */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <MapPin size={13} className="text-txt-disabled" />
              <span className="text-xs text-txt-secondary font-medium">활동 방식</span>
            </div>
            <div className="flex flex-wrap gap-1.5 ml-5">
              {LOCATION_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSetLocationType(opt.value)}
                  className={`px-3 py-1.5 text-xs border transition-colors ${
                    locationType === opt.value
                      ? theme.chipOn
                      : 'bg-surface-card text-txt-secondary border-border hover:border-border-strong'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Clock size={13} className="text-txt-disabled" />
              <span className="text-xs text-txt-secondary font-medium">시간 투자</span>
            </div>
            <div className="flex flex-wrap gap-1.5 ml-5">
              {TIME_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSetTimeCommitment(opt.value)}
                  className={`px-3 py-1.5 text-xs border transition-colors ${
                    timeCommitment === opt.value
                      ? theme.chipOn
                      : 'bg-surface-card text-txt-secondary border-border hover:border-border-strong'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Compensation */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles size={13} className="text-txt-disabled" />
              <span className="text-xs text-txt-secondary font-medium">보상 방식</span>
            </div>
            <div className="flex flex-wrap gap-1.5 ml-5">
              {COMPENSATION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSetCompensationType(opt.value)}
                  className={`px-3 py-1.5 text-xs border transition-colors ${
                    compensationType === opt.value
                      ? theme.chipOn
                      : 'bg-surface-card text-txt-secondary border-border hover:border-border-strong'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {compensationType && compensationType !== 'unpaid' && (
              <input
                type="text"
                value={compensationDetails}
                onChange={(e) => onSetCompensationDetails(e.target.value)}
                placeholder="상세 (예: 지분 5%, 월 50만원)"
                className="px-3 py-2 border border-border text-sm mt-2 ml-5 w-[calc(100%-1.25rem)] focus:outline-none focus:border-border-strong bg-transparent"
              />
            )}
          </div>
        </div>
      </div>

      {/* Submit CTA (desktop) */}
      <div className={`hidden md:block p-5 text-txt-inverse border border-transparent transition-colors ${theme.cta}`}>
        <h3 className="font-bold text-sm mb-1">{theme.ctaTitle}</h3>
        <p className="text-white/60 text-xs mb-4 break-keep">
          {theme.ctaDesc}
        </p>
        <button
          type="submit"
          disabled={isPending || imageUploading}
          className={`w-full py-3 font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${theme.ctaBtn}`}
        >
          {imageUploading ? (
            <><Loader2 size={14} className="animate-spin" /> 이미지 업로드 중...</>
          ) : isPending ? (
            <><Loader2 size={14} className="animate-spin" /> 생성 중...</>
          ) : (
            submitLabel || '프로젝트 등록하기'
          )}
        </button>
      </div>
    </div>
  )
}
