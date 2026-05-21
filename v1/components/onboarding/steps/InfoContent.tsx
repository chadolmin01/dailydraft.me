'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/src/context/AuthContext'
import { AFFILIATION_OPTIONS } from '@/src/lib/onboarding/constants'
import { UNIVERSITY_LIST, LOCATION_OPTIONS } from '@/src/lib/constants/profile-options'
import {
  parseEntranceYearFromStudentId,
  isValidStudentIdFormat,
} from '@/src/lib/universities'
import type { ProfileDraft } from '@/src/lib/onboarding/types'
import { OnboardingComboBox } from '../OnboardingComboBox'
import { chipClass } from '../parts/chipClass'

const INPUT_CLASS = 'ob-input w-full px-4 py-3 bg-surface-card rounded-xl border border-border text-[14px] font-medium text-txt-primary placeholder:text-txt-tertiary'

/**
 * 이메일 기반 대학 매칭 결과.
 * university가 있으면 "인증 완료" 상태로 간주 → university 필드 readonly + 학번 입력 필드 노출.
 */
interface UniversityMatchState {
  loading: boolean
  isAcademic: boolean
  domain: string | null
  university: {
    id: string
    name: string
    short_name: string | null
  } | null
}

interface InfoContentProps {
  profile: ProfileDraft
  aff: (typeof AFFILIATION_OPTIONS)[number]
  showUnivCombo: boolean
  attempted: boolean
  onChange: (partial: Partial<ProfileDraft>) => void
  onSubmit: () => void
}

export function InfoContent({
  profile, aff, showUnivCombo, attempted, onChange, onSubmit,
}: InfoContentProps) {
  const { user } = useAuth()
  const nameEmpty = attempted && !profile.name.trim()
  // 소속 유형 버튼을 클릭한 적 있는지 추적
  const [affTouched, setAffTouched] = useState(false)
  const showDetails = affTouched

  // ── Phase 1-a: 이메일 도메인 → 대학 자동 감지 ──
  // 의도: 로그인한 이메일이 @ac.kr 이면 universities 테이블에서 매칭된 대학 자동 세팅.
  // 매칭되면 university 필드 readonly + 학번/학과 입력 표시. 매칭 안 되면 기존 ComboBox 로직 fallback.
  // 한 번만 실행 (이메일 바뀌는 일 없음), 실패해도 일반 플로우 동작.
  const [matchState, setMatchState] = useState<UniversityMatchState>({
    loading: false,
    isAcademic: false,
    domain: null,
    university: null,
  })
  const matchFetchedRef = useRef(false)

  useEffect(() => {
    if (matchFetchedRef.current) return
    const email = user?.email
    if (!email) return
    matchFetchedRef.current = true

    setMatchState(s => ({ ...s, loading: true }))
    fetch(`/api/universities/by-email?email=${encodeURIComponent(email)}`)
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        const payload = json?.data ?? json
        const univ = payload?.university ?? null
        setMatchState({
          loading: false,
          isAcademic: !!payload?.isAcademic,
          domain: payload?.domain ?? null,
          university: univ,
        })
        // 매칭되면 자동으로 profile에 주입. 사용자가 졸업생/현직자로 바꾸면 affiliation만 변경,
        // university_id는 남아도 서버에서 affiliation_type에 따라 해석.
        if (univ && !profile.university) {
          onChange({
            affiliationType: 'student',
            university: univ.name,
            universityId: univ.id,
          })
          setAffTouched(true)
        }
      })
      .catch(() => {
        setMatchState(s => ({ ...s, loading: false }))
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email])

  const verified = !!matchState.university
  const isStudent = profile.affiliationType === 'student' || profile.affiliationType === 'graduate'
  const showStudentFields = verified && isStudent

  const studentIdError = attempted && showStudentFields && profile.studentId
    ? !isValidStudentIdFormat(profile.studentId) : false

  const handleStudentIdChange = (raw: string) => {
    // 숫자만 허용, 10자리 제한 (학번 형식)
    const clean = raw.replace(/\D/g, '').slice(0, 10)
    const entranceYear = parseEntranceYearFromStudentId(clean) ?? undefined
    onChange({ studentId: clean, entranceYear })
  }

  return (
    <div className="space-y-5">
      {/* Name */}
      <div>
        <label className="text-[11px] font-medium text-txt-tertiary mb-2 block">닉네임 *</label>
        <div className="relative">
          <input
            type="text"
            value={profile.name}
            onChange={(e) => onChange({ name: e.target.value.slice(0, 7) })}
            maxLength={7}
            placeholder="어떻게 불러드릴까요?"
            className={`${INPUT_CLASS} ${nameEmpty ? '!border-status-danger-text' : ''}`}
            autoFocus
            autoComplete="nickname"
            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-txt-disabled">
            {profile.name.length}/7
          </span>
        </div>
        {nameEmpty && <p className="text-[11px] text-status-danger-text mt-1 font-medium">닉네임을 입력해 주세요</p>}
      </div>

      {/* University match — 이메일 검증 UI: 로딩 → 인증됨 / 미인증 3가지 상태 */}
      {matchState.loading && (
        <div className="flex items-center gap-2 px-4 py-3 bg-surface-sunken border border-border rounded-xl animate-pulse">
          <div className="w-4 h-4 rounded-full bg-border" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <div className="h-3 w-40 bg-border rounded-full" />
            <div className="h-2 w-24 bg-border/70 rounded-full mt-1.5" />
          </div>
          <span className="sr-only" role="status" aria-live="polite">이메일 도메인으로 학교를 확인하고 있습니다</span>
        </div>
      )}

      {!matchState.loading && verified && matchState.university && (
        <div
          className="flex items-center gap-2 px-4 py-3 bg-brand/5 border border-brand/20 rounded-xl animate-in fade-in slide-in-from-top-1 duration-300"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 size={16} className="text-brand shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-txt-primary">
              {matchState.university.name} 재학생으로 확인되었습니다
            </div>
            <div className="text-[11px] text-txt-tertiary mt-0.5">
              학교 이메일({matchState.domain}) 로 인증됨. 기관·동아리 리포트에 반영됩니다.
            </div>
          </div>
        </div>
      )}

      {!matchState.loading && !verified && matchState.isAcademic && (
        <div className="flex items-start gap-2 px-4 py-3 bg-status-warn-bg/50 border border-status-warn-text/20 rounded-xl">
          <span aria-hidden="true" className="text-status-warn-text shrink-0 text-[14px] leading-none mt-0.5">ℹ</span>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold text-txt-primary">
              학교 이메일 ({matchState.domain}) 이지만 자동 매칭이 안 되었습니다
            </div>
            <div className="text-[11px] text-txt-tertiary mt-0.5 leading-relaxed">
              아래 소속 입력란에 학교명을 직접 선택해 주세요. 잠시 후 관리자가 확인해 정식 인증으로 전환해 드립니다.
            </div>
          </div>
        </div>
      )}

      {/* Affiliation type — always visible */}
      <div>
        <label className="text-[11px] font-medium text-txt-tertiary mb-2 block">소속 유형</label>
        <div className="flex flex-wrap gap-1.5">
          {AFFILIATION_OPTIONS.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => { onChange({ affiliationType: a.value }); setAffTouched(true) }}
              className={chipClass(profile.affiliationType === a.value, 'sm')}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* University + Major + Location — revealed after affiliation button click */}
      {showDetails && (
        <div
          className="space-y-5"
          style={{ animation: 'ob-reveal 0.35s cubic-bezier(0.16, 1, 0.3, 1) both' }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-txt-tertiary mb-2 block">
                {aff.orgPlaceholder === '대학교' ? '소속' : aff.orgPlaceholder.replace(' (선택)', '')}
              </label>
              {verified && isStudent ? (
                // 이메일 인증 완료: 매칭된 대학을 readonly로 표시
                <div className={`${INPUT_CLASS} !bg-surface-sunken !text-txt-secondary flex items-center`}>
                  {matchState.university?.name ?? profile.university}
                </div>
              ) : showUnivCombo ? (
                <OnboardingComboBox
                  value={profile.university}
                  onChange={(v) => onChange({ university: v })}
                  options={UNIVERSITY_LIST}
                  placeholder={aff.orgPlaceholder}
                />
              ) : (
                <input
                  type="text"
                  value={profile.university}
                  onChange={(e) => onChange({ university: e.target.value })}
                  placeholder={aff.orgPlaceholder}
                  className={INPUT_CLASS}
                />
              )}
            </div>
            <div>
              <label className="text-[11px] font-medium text-txt-tertiary mb-2 block">
                {aff.rolePlaceholder.replace(' (선택)', '')}
              </label>
              <input
                type="text"
                value={profile.major}
                onChange={(e) => onChange({ major: e.target.value, department: e.target.value })}
                placeholder={aff.rolePlaceholder}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {/* 학번 — 이메일 인증된 학생/졸업생에게만 노출 (B2B 리포팅용) */}
          {showStudentFields && (
            <div>
              <label className="text-[11px] font-medium text-txt-tertiary mb-2 block">
                학번 <span className="text-txt-disabled">(선택 · 기관 리포트에 사용)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={profile.studentId ?? ''}
                  onChange={(e) => handleStudentIdChange(e.target.value)}
                  placeholder="예: 2023123456"
                  aria-label="학번 (숫자 6~10자리)"
                  aria-invalid={studentIdError}
                  aria-describedby={profile.entranceYear ? 'student-id-hint' : undefined}
                  className={`${INPUT_CLASS} ${studentIdError ? '!border-status-danger-text' : profile.entranceYear ? '!border-brand/40' : ''}`}
                />
                {profile.entranceYear && !studentIdError && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[11px] font-semibold text-brand">
                    <CheckCircle2 size={12} aria-hidden="true" />
                    {profile.entranceYear}학번
                  </span>
                )}
              </div>
              {profile.entranceYear && !studentIdError && (
                <p id="student-id-hint" className="text-[11px] text-brand mt-1.5 font-medium" role="status" aria-live="polite">
                  {profile.entranceYear}학번으로 인식했습니다. 틀렸다면 학번을 다시 입력해 주세요.
                </p>
              )}
              {!profile.entranceYear && profile.studentId && !studentIdError && (
                <p className="text-[11px] text-txt-tertiary mt-1">
                  학번에서 입학년도를 아직 추정하지 못했습니다. 6자리 이상 입력하시면 자동 인식됩니다.
                </p>
              )}
              {studentIdError && (
                <p className="text-[11px] text-status-danger-text mt-1 font-medium" role="alert">
                  학번은 숫자 6~10자리로 입력해 주세요
                </p>
              )}
            </div>
          )}

          <div>
            <label className="text-[11px] font-medium text-txt-tertiary mb-2 block">활동 지역</label>
            <div className="flex flex-wrap gap-1.5">
              {LOCATION_OPTIONS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => onChange({
                    locations: profile.locations.includes(loc)
                      ? profile.locations.filter(l => l !== loc)
                      : [...profile.locations, loc],
                  })}
                  className={chipClass(profile.locations.includes(loc), 'sm')}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
