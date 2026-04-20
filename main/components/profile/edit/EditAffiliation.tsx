'use client'

import React from 'react'
import { Briefcase, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { ComboBox } from '@/components/ui/ComboBox'
import { UNIVERSITY_LIST, LOCATION_OPTIONS } from '@/src/lib/constants/profile-options'
import { POSITION_OPTIONS, AFFILIATION_OPTIONS } from './constants'
import type { EditAffiliationProps } from './types'

export const EditAffiliation: React.FC<EditAffiliationProps> = ({
  affiliationType,
  setAffiliationType,
  position,
  setPosition,
  university,
  setUniversity,
  major,
  setMajor,
  location,
  setLocation,
  uniVerified,
  setUniVerified,
  verifyEmail,
  setVerifyEmail,
  verifyCode,
  setVerifyCode,
  verifyStep,
  setVerifyStep,
  verifyError,
  setVerifyError,
  verifySending,
  setVerifySending,
}) => {
  return (
    <section>
      <h3 className="text-[10px] font-medium text-txt-tertiary mb-4 flex items-center gap-2">
        <Briefcase size={14} /> 소속 & 포지션
      </h3>
      <div className="space-y-4">
        {/* 소속 유형 */}
        <div>
          <label className="block text-xs font-medium text-txt-secondary mb-1.5">소속 유형</label>
          <div className="flex flex-wrap gap-1.5">
            {AFFILIATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAffiliationType(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                  affiliationType === opt.value
                    ? 'bg-brand text-white border-brand'
                    : 'bg-surface-card text-txt-secondary border-border hover:border-border'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 포지션 */}
        <div>
          <label className="block text-xs font-medium text-txt-secondary mb-1.5">포지션</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {POSITION_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setPosition(opt)}
                className={`px-2.5 py-1 text-xs font-medium border transition-colors ${
                  position === opt
                    ? 'bg-brand text-white border-brand'
                    : 'bg-surface-card text-txt-secondary border-border hover:border-border'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="또는 직접 입력"
            maxLength={50}
            className="w-full px-3 py-2.5 text-base sm:text-sm border border-border bg-surface-card rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
          />
        </div>

        {/* 소속 + 전공/직무 (라벨이 유형에 따라 변경) */}
        {(() => {
          const affConfig = AFFILIATION_OPTIONS.find(a => a.value === affiliationType) || AFFILIATION_OPTIONS[0]
          const showUnivCombo = affiliationType === 'student' || affiliationType === 'graduate'
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-txt-secondary mb-1.5">{affConfig.orgLabel}</label>
                {showUnivCombo ? (
                  <ComboBox
                    value={university}
                    onChange={setUniversity}
                    options={UNIVERSITY_LIST}
                    placeholder={affConfig.orgPlaceholder}
                  />
                ) : (
                  <input
                    type="text"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder={affConfig.orgPlaceholder}
                    maxLength={50}
                    className="w-full px-3 py-2.5 text-base sm:text-sm border border-border bg-surface-card rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-txt-secondary mb-1.5">{affConfig.roleLabel}</label>
                <input
                  type="text"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder={affConfig.rolePlaceholder}
                  maxLength={50}
                  className="w-full px-3 py-2.5 text-base sm:text-sm border border-border bg-surface-card rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
                />
              </div>
            </div>
          )
        })()}

        <div>
          <label className="block text-xs font-medium text-txt-secondary mb-1.5">활동 지역</label>
          <div className="flex flex-wrap gap-1.5">
            {LOCATION_OPTIONS.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setLocation(location === loc ? '' : loc)}
                className={`px-2.5 py-1 text-xs font-medium border transition-colors ${
                  location === loc
                    ? 'bg-brand text-white border-brand'
                    : 'bg-surface-card text-txt-secondary border-border hover:border-border'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* 대학 인증 */}
        {(affiliationType === 'student' || affiliationType === 'graduate') && (
          <div className="mt-4 p-3 border border-border bg-surface-sunken">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={14} className={uniVerified ? 'text-indicator-online' : 'text-txt-tertiary'} />
              <span className="text-xs font-bold text-txt-secondary">
                대학 인증
              </span>
              {uniVerified && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indicator-online text-white">VERIFIED</span>
              )}
            </div>

            {uniVerified ? (
              <p className="text-xs text-indicator-online">대학 인증이 완료되었습니다.</p>
            ) : verifyStep === 'idle' ? (
              <div className="space-y-2">
                <p className="text-xs text-txt-tertiary">대학 이메일(.ac.kr)로 인증하면 프로필에 인증 배지가 표시됩니다.</p>
                <div className="flex flex-wrap gap-1.5">
                  <input
                    type="email"
                    value={verifyEmail}
                    onChange={e => { setVerifyEmail(e.target.value); setVerifyError('') }}
                    placeholder="university@snu.ac.kr"
                    inputMode="email"
                    autoComplete="email"
                    className="flex-1 px-3 py-2 text-base sm:text-sm border border-border bg-surface-card rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
                  />
                  <button
                    type="button"
                    disabled={verifySending || !verifyEmail.trim()}
                    onClick={async () => {
                      setVerifySending(true)
                      setVerifyError('')
                      try {
                        const res = await fetch('/api/profile/verify-university', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'send', email: verifyEmail.trim() }),
                        })
                        const data = await res.json()
                        if (!res.ok) { setVerifyError(data.error); return }
                        setVerifyStep('sent')
                      } catch { setVerifyError('요청에 실패했습니다') }
                      finally { setVerifySending(false) }
                    }}
                    className="px-3 py-2 text-xs font-bold border border-surface-inverse bg-surface-inverse text-txt-inverse hover:bg-surface-inverse/90 disabled:opacity-50 transition-colors"
                  >
                    {verifySending ? '전송 중...' : '인증 코드 전송'}
                  </button>
                </div>
                {verifyError && <p className="text-xs text-status-danger-text">{verifyError}</p>}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-txt-tertiary">
                  <strong>{verifyEmail}</strong>로 발송된 6자리 코드를 입력하세요.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <input
                    type="text"
                    value={verifyCode}
                    onChange={e => { setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setVerifyError('') }}
                    placeholder="000000"
                    maxLength={6}
                    className="w-24 sm:w-32 px-3 py-2 text-base sm:text-sm font-mono text-center tracking-widest border border-border bg-surface-card rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
                  />
                  <button
                    type="button"
                    disabled={verifySending || verifyCode.length !== 6}
                    onClick={async () => {
                      setVerifySending(true)
                      setVerifyError('')
                      try {
                        const res = await fetch('/api/profile/verify-university', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'verify', code: verifyCode }),
                        })
                        const data = await res.json()
                        if (!res.ok) { setVerifyError(data.error); return }
                        setUniVerified(true)
                        toast.success('대학 인증이 완료되었습니다!')
                      } catch { setVerifyError('요청에 실패했습니다') }
                      finally { setVerifySending(false) }
                    }}
                    className="px-3 py-2 text-xs font-bold border border-surface-inverse bg-surface-inverse text-txt-inverse hover:bg-surface-inverse/90 disabled:opacity-50 transition-colors"
                  >
                    {verifySending ? '확인 중...' : '인증 확인'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setVerifyStep('idle'); setVerifyCode(''); setVerifyError('') }}
                    className="px-2 py-2 text-xs text-txt-tertiary hover:text-txt-primary transition-colors"
                  >
                    재전송
                  </button>
                </div>
                {verifyError && <p className="text-xs text-status-danger-text">{verifyError}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
