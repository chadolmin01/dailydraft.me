'use client'

import React from 'react'
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
  const aff = AFFILIATION_OPTIONS.find(a => a.value === profile.affiliationType) || AFFILIATION_OPTIONS[0]
  const showUnivCombo = profile.affiliationType === 'student' || profile.affiliationType === 'graduate'

  return (
    <div className="mt-3 bg-surface-card border border-border-strong p-4 shadow-sharp space-y-3">
      <div>
        <label className="text-[10px] font-medium text-txt-tertiary mb-1.5 block">닉네임 *</label>
        <input
          type="text"
          value={profile.name}
          onChange={(e) => onProfileChange({ name: e.target.value })}
          placeholder="어떻게 불러드릴까요?"
          className="w-full px-3.5 py-2.5 bg-surface-card border border-border-strong text-sm font-medium focus:outline-none focus:border-surface-inverse focus:bg-white transition-all placeholder:text-txt-tertiary"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && profile.name.trim() && onSubmit()}
        />
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
              className={`px-2.5 py-1.5 text-[11px] font-medium border transition-all ${
                profile.affiliationType === a.value
                  ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                  : 'bg-surface-card text-txt-primary border-border-strong hover:bg-black hover:text-white'
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
              className="w-full px-3.5 py-2.5 bg-surface-card border border-border-strong text-sm font-medium focus:outline-none focus:border-surface-inverse focus:bg-white transition-all placeholder:text-txt-tertiary"
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
            className="w-full px-3.5 py-2.5 bg-surface-card border border-border-strong text-sm font-medium focus:outline-none focus:border-surface-inverse focus:bg-white transition-all placeholder:text-txt-tertiary"
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
              className={`px-2 py-1 text-[11px] font-medium border transition-all ${
                profile.locations.includes(loc)
                  ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                  : 'bg-surface-card text-txt-primary border-border-strong hover:bg-black hover:text-white'
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
        onClick={onSubmit}
        disabled={!profile.name.trim()}
        className="w-full py-2.5 bg-brand text-white text-[13px] font-bold hover:bg-brand-hover transition-all flex items-center justify-center gap-2 disabled:opacity-20 disabled:cursor-not-allowed ob-hover hover:opacity-90 active:scale-[0.97] border border-brand"
      >
        입력 완료 <ArrowRight size={14} />
      </button>
      <p className="text-[10px] text-txt-tertiary text-center font-mono">닉네임만 필수예요 · 나중에 수정 가능</p>
    </div>
  )
}
