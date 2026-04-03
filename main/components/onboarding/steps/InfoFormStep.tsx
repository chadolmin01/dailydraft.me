'use client'

import React, { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import type { ProfileDraft } from '@/src/lib/onboarding/types'
import { AFFILIATION_OPTIONS } from '@/src/lib/onboarding/constants'
import { UNIVERSITY_LIST, LOCATION_OPTIONS } from '@/src/lib/constants/profile-options'
import { OnboardingComboBox } from '../OnboardingComboBox'

interface InfoFormStepProps {
  profile: ProfileDraft
  onProfileChange: (partial: Partial<ProfileDraft>) => void
  onSubmit: () => void
}

export const InfoFormStep: React.FC<InfoFormStepProps> = ({
  profile, onProfileChange, onSubmit,
}) => {
  const [attempted, setAttempted] = useState(false)
  const aff = AFFILIATION_OPTIONS.find(a => a.value === profile.affiliationType) || AFFILIATION_OPTIONS[0]
  const showUnivCombo = profile.affiliationType === 'student' || profile.affiliationType === 'graduate'
  const nameEmpty = attempted && !profile.name.trim()

  const handleSubmit = () => {
    setAttempted(true)
    if (profile.name.trim()) onSubmit()
  }

  return (
    <div className="mt-3 bg-surface-card rounded-xl border border-border p-4 shadow-md space-y-3">
      <div>
        <label className="text-[10px] font-medium text-txt-tertiary mb-1.5 block">닉네임 *</label>
        <div className="relative">
          <input
            type="text"
            value={profile.name}
            onChange={(e) => onProfileChange({ name: e.target.value.slice(0, 7) })}
            maxLength={7}
            placeholder="어떻게 불러드릴까요?"
            className={`w-full px-3.5 py-2.5 bg-surface-card rounded-lg border text-base sm:text-sm font-medium text-txt-primary focus:outline-none focus:border-surface-inverse focus:bg-white transition-all placeholder:text-txt-tertiary ${nameEmpty ? 'border-status-danger-text' : 'border-border'}`}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-txt-disabled">{profile.name.length}/7</span>
        </div>
        {nameEmpty && (
          <p className="text-[11px] text-status-danger-text mt-1 font-medium">닉네임을 입력해주세요</p>
        )}
      </div>
      {/* 소속 유형 */}
      <div>
        <label className="text-[10px] font-medium text-txt-tertiary mb-1.5 block">소속 유형</label>
        <div className="flex flex-wrap gap-1.5">
          {AFFILIATION_OPTIONS.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => onProfileChange({ affiliationType: a.value })}
              className={`px-2.5 py-1.5 text-[11px] font-medium border rounded-full transition-all ${
                profile.affiliationType === a.value
                  ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                  : 'bg-surface-card text-txt-primary border-border hover:bg-black hover:text-white'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-medium text-txt-tertiary mb-1.5 block">
            {aff.orgPlaceholder === '대학교' ? '소속' : aff.orgPlaceholder.replace(' (선택)', '')}
          </label>
          {showUnivCombo ? (
            <OnboardingComboBox
              value={profile.university}
              onChange={(v) => onProfileChange({ university: v })}
              options={UNIVERSITY_LIST}
              placeholder={aff.orgPlaceholder}
            />
          ) : (
            <input
              type="text"
              value={profile.university}
              onChange={(e) => onProfileChange({ university: e.target.value })}
              placeholder={aff.orgPlaceholder}
              className="w-full px-3.5 py-2.5 bg-surface-card rounded-lg border border-border text-base sm:text-sm font-medium text-txt-primary focus:outline-none focus:border-surface-inverse focus:bg-white transition-all placeholder:text-txt-tertiary"
            />
          )}
        </div>
        <div>
          <label className="text-[10px] font-medium text-txt-tertiary mb-1.5 block">
            {aff.rolePlaceholder.replace(' (선택)', '')}
          </label>
          <input
            type="text"
            value={profile.major}
            onChange={(e) => onProfileChange({ major: e.target.value })}
            placeholder={aff.rolePlaceholder}
            className="w-full px-3.5 py-2.5 bg-surface-card rounded-lg border border-border text-base sm:text-sm font-medium text-txt-primary focus:outline-none focus:border-surface-inverse focus:bg-white transition-all placeholder:text-txt-tertiary"
          />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-medium text-txt-tertiary mb-1.5 block">활동 지역</label>
        <div className="flex flex-wrap gap-1.5">
          {LOCATION_OPTIONS.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => onProfileChange({
                locations: profile.locations.includes(loc)
                  ? profile.locations.filter(l => l !== loc)
                  : [...profile.locations, loc],
              })}
              className={`px-2 py-1 text-[11px] font-medium border rounded-full transition-all ${
                profile.locations.includes(loc)
                  ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                  : 'bg-surface-card text-txt-primary border-border hover:bg-black hover:text-white'
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
        {profile.locations.length > 0 && (
          <p className="text-[10px] text-txt-tertiary font-mono mt-1">{profile.locations.join(', ')} 선택됨</p>
        )}
      </div>
      <button
        onClick={handleSubmit}
        className="w-full py-2.5 bg-brand text-white text-[13px] font-bold rounded-xl hover:bg-brand-hover transition-all flex items-center justify-center gap-2 ob-hover hover:opacity-90 active:scale-[0.97] border border-brand"
      >
        입력 완료 <ArrowRight size={14} />
      </button>
      <p className="text-[10px] text-txt-tertiary text-center font-mono">닉네임만 필수예요 · 나중에 수정 가능</p>
    </div>
  )
}
