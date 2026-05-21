'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { ConsentRow } from '../parts/ConsentRow'

/**
 * 온보딩 첫 화면 — 약관·개인정보 동의 체크박스 UI.
 * PIPA 상 "명시적 동의" 요구 → 필수 3종 체크해야 "시작하기" 활성화.
 * 선택 2종은 체크 안 해도 진행 가능 (마케팅/통계 제공).
 *
 * 동의 상태는 saveProfileCheckpoint 시점에 data_consent=true + data_consent_at=now() 로 기록.
 * 선택 동의(marketing, institution_share)는 저장 안 함 — 현재 스키마에 별도 컬럼 없음.
 * 필요 시 후속 마이그레이션에서 consent_marketing / consent_institution_share 추가.
 */
interface ConsentState {
  terms: boolean
  privacy: boolean
  ageOver14: boolean
  marketing: boolean
  institutionShare: boolean
}

const INITIAL_CONSENT: ConsentState = {
  terms: false,
  privacy: false,
  ageOver14: false,
  marketing: false,
  institutionShare: false,
}

export function IntroScreen({ onStart }: { onStart: () => void }) {
  const [consent, setConsent] = useState<ConsentState>(INITIAL_CONSENT)
  const allRequired = consent.terms && consent.privacy && consent.ageOver14
  const allChecked = Object.values(consent).every(Boolean)

  const toggle = useCallback((key: keyof ConsentState) => {
    setConsent(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const toggleAll = useCallback(() => {
    const next = !allChecked
    setConsent({
      terms: next,
      privacy: next,
      ageOver14: next,
      marketing: next,
      institutionShare: next,
    })
  }, [allChecked])

  // 6개 블록을 모두 ob-stagger-item 으로 통일 — 이전엔 ob-bubble-in(0.5s spring) 과
  // ob-chip-in(0.35s) 두 애니메이션을 100ms 간격으로 섞어 써서 속도·커브가 제각각이었음.
  // 60ms 간격 순차 fade+slide-up 으로 리듬 통일.
  //
  // 세로 압축: 이전엔 일러스트 220 + py-8 + mb-6 으로 합산 ~880px → 일반 노트북에서 스크롤 발생.
  // 일러스트 140 + py-4 + mb-3/4 로 압축해 1280×720 (노트북 표준) 에서 한 화면 안에 들어오도록.
  //
  // 3-layer 센터링: outer scroll + middle min-h-full center + inner content.
  // flex justify-center 단독은 환경/스크롤 컨테이너 조합에서 콘텐츠가 위쪽 정렬되는 케이스가 있어
  // min-h-full 명시로 viewport 100% 보장.
  return (
    <div className="fixed inset-0 ob-atmos overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="max-w-lg w-full flex flex-col items-center py-4">
        <Image
          src="/onboarding/1.svg"
          alt="환영"
          width={140}
          height={140}
          priority
          className="ob-stagger-item w-full max-w-[140px] h-auto object-contain mb-4"
          style={{ ['--stagger' as string]: '0ms' }}
        />
        <h2
          className="ob-stagger-item text-2xl sm:text-[26px] font-black text-txt-primary leading-tight mb-1.5 text-center"
          style={{ ['--stagger' as string]: '60ms' }}
        >
          Draft 에 오신 것을 환영합니다
        </h2>
        <p
          className="ob-stagger-item text-[13px] text-txt-secondary leading-relaxed mb-4 text-center break-keep max-w-sm"
          style={{ ['--stagger' as string]: '120ms' }}
        >
          Draft 는 동아리·프로젝트의 운영 기록을 쌓는 공간입니다. 시작하시기 전에 아래 필수 약관을 확인하고 동의해 주세요.
        </p>

        {/* 전체 동의 */}
        <div
          className="ob-stagger-item w-full mb-2"
          style={{ ['--stagger' as string]: '180ms' }}
        >
          <ConsentRow
            checked={allChecked}
            onToggle={toggleAll}
            label="전체 동의"
            emphasis
          />
        </div>

        {/* 개별 동의 */}
        <div
          className="ob-stagger-item w-full space-y-1 mb-4 border-t border-border pt-2"
          style={{ ['--stagger' as string]: '240ms' }}
        >
          <ConsentRow
            checked={consent.ageOver14}
            onToggle={() => toggle('ageOver14')}
            label="만 14세 이상입니다"
            required
          />
          <ConsentRow
            checked={consent.terms}
            onToggle={() => toggle('terms')}
            label="서비스 이용약관에 동의합니다"
            required
            link={{ href: '/terms', label: '전문 보기' }}
          />
          <ConsentRow
            checked={consent.privacy}
            onToggle={() => toggle('privacy')}
            label="개인정보 수집·이용에 동의합니다"
            required
            link={{ href: '/privacy', label: '전문 보기' }}
          />
          <ConsentRow
            checked={consent.institutionShare}
            onToggle={() => toggle('institutionShare')}
            label="소속 기관(대학/동아리)에 참여 현황 공유"
            hint="선택 · 운영진 리포트 생성에 사용됩니다"
          />
          <ConsentRow
            checked={consent.marketing}
            onToggle={() => toggle('marketing')}
            label="마케팅 정보 수신"
            hint="선택 · 새 기능·이벤트 뉴스레터"
          />
        </div>

        <div
          className="ob-stagger-item w-full"
          style={{ ['--stagger' as string]: '300ms' }}
        >
          <button
            onClick={onStart}
            disabled={!allRequired}
            className={`ob-press-spring w-full flex items-center justify-center gap-2 py-4 rounded-full text-[15px] font-black ${
              allRequired
                ? 'bg-brand text-white hover:opacity-90 shadow-[0_4px_14px_-4px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_20px_-4px_rgba(37,99,235,0.4)]'
                : 'bg-surface-sunken text-txt-disabled cursor-not-allowed'
            }`}
          >
            시작하기
            <ArrowRight size={16} />
          </button>
          <p className="text-[11px] text-txt-tertiary text-center mt-2">
            필수 항목 3개에 동의하시면 진행할 수 있습니다
          </p>
        </div>
        </div>
      </div>
    </div>
  )
}
