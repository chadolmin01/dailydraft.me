'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

/* ── Tab Data ── */

const tabs = [
  { id: 'calculator', label: '시간 절약 계산기' },
  { id: 'discord', label: 'Discord 봇 데모' },
  { id: 'comparison', label: '기능 비교' },
] as const

type TabId = (typeof tabs)[number]['id']

/* ── Tab 1: 시간 절약 계산기 ── */

function CalculatorPanel() {
  const [teams, setTeams] = useState(5)
  const [members, setMembers] = useState(24)

  const results = useMemo(() => {
    const weeklyHours = teams * 0.6 + members * 0.02
    const semesterHours = weeklyHours * 16
    const handoffHours = members * 0.05 + teams * 0.2
    const fullTimeDays = semesterHours / 8

    return {
      weeklyHours: weeklyHours.toFixed(1),
      semesterHours: Math.round(semesterHours),
      fullTimeDays: fullTimeDays.toFixed(1),
      handoffHours: handoffHours.toFixed(1),
    }
  }, [teams, members])

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <SliderInput
          label="팀 수"
          value={teams}
          min={1}
          max={10}
          onChange={setTeams}
          unit="개"
        />
        <SliderInput
          label="기수당 멤버 수"
          value={members}
          min={5}
          max={60}
          onChange={setMembers}
          unit="명"
        />
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Weekly tracking */}
        <div className="bg-surface-card border border-border rounded-xl p-5 text-center">
          <p className="text-xs text-txt-tertiary mb-3">주간 추적 시간 절약</p>
          <p className="text-sm text-txt-tertiary line-through mb-1">
            현재: {results.weeklyHours}시간/주
          </p>
          <p className="text-2xl font-bold text-brand">0분</p>
          <p className="text-xs text-txt-tertiary mt-1">Draft 자동 수집</p>
        </div>

        {/* Semester savings */}
        <div className="bg-surface-card border border-border rounded-xl p-5 text-center">
          <p className="text-xs text-txt-tertiary mb-3">학기당 절약 시간</p>
          <p className="text-3xl font-bold text-txt-primary">{results.semesterHours}시간</p>
          <p className="text-xs text-txt-tertiary mt-1">
            = 풀타임 {results.fullTimeDays}일
          </p>
        </div>

        {/* Handoff */}
        <div className="bg-surface-card border border-border rounded-xl p-5 text-center">
          <p className="text-xs text-txt-tertiary mb-3">인수인계 시간</p>
          <p className="text-sm text-txt-tertiary line-through mb-1">
            현재: {results.handoffHours}시간
          </p>
          <p className="text-2xl font-bold text-brand">5분</p>
          <p className="text-xs text-txt-tertiary mt-1">관리자 권한 이전</p>
        </div>
      </div>
    </div>
  )
}

/* ── Slider helper ── */

function SliderInput({
  label,
  value,
  min,
  max,
  onChange,
  unit,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  unit: string
}) {
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-txt-primary">{label}</span>
        <span className="text-sm font-bold text-brand">
          {value}{unit}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-brand
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-white
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:relative
            [&::-webkit-slider-thumb]:z-10
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-brand
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-white
            [&::-moz-range-thumb]:shadow-md"
          style={{
            background: `linear-gradient(to right, var(--brand) 0%, var(--brand) ${percentage}%, var(--surface-sunken) ${percentage}%, var(--surface-sunken) 100%)`,
          }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-txt-tertiary">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}

/* ── Tab 2: Discord 봇 데모 ── */

function DiscordDemoPanel() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <p className="text-sm sm:text-base text-txt-secondary text-center leading-relaxed break-keep">
        팀 채널에 실제로 발행된 Draft Bot 주간 리포트입니다. 대화 기반 자동 요약.
      </p>

      {/* 실제 Discord 서버 스크린샷. 팀명·유저 정보는 블러 처리. */}
      <div className="relative rounded-xl overflow-hidden border border-border shadow-sm bg-surface-card">
        <Image
          src="/landing/screenshots/07_discord_activity.png"
          alt="Draft 팀 채널 — Discord 에 발행된 팀 업데이트"
          width={2549}
          height={1418}
          className="w-full h-auto"
          sizes="(min-width: 768px) 720px, 100vw"
        />
      </div>

      <p className="text-xs text-txt-tertiary text-center">
        실제 프로덕션 서버 캡처 · 개인정보 블러 처리
      </p>
    </div>
  )
}

/* ── Tab 3: 기능 비교 ── */

const comparisonRows = [
  {
    feature: '주간 팀 진행 추적',
    legacy: '수동 취합 (3시간/주)',
    draft: '자동 수집 (0분)',
  },
  {
    feature: '기수 아카이브',
    legacy: '노션 링크 복사 (만료 위험)',
    draft: '자동 기수별 타임라인',
  },
  {
    feature: '멤버 관리',
    legacy: '구글 시트 (버전 충돌)',
    draft: '역할/기수/참여도 통합',
  },
  {
    feature: '성과 보고서',
    legacy: '한글/워드 수동 작성 (3일)',
    draft: '원클릭 자동 생성 (10초)',
  },
  {
    feature: '인수인계',
    legacy: '구두 설명 2시간+',
    draft: '관리자 권한 이전 5분',
  },
  {
    feature: '도구 수',
    legacy: '4-6개 조합',
    draft: '1개',
  },
  {
    feature: '가격',
    legacy: '무료 (시간 비용 별도)',
    draft: '무료',
  },
]

function ComparisonPanel() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-surface-card border border-border rounded-xl overflow-hidden">
        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-4 text-xs font-medium text-txt-tertiary w-1/3">
                  기능
                </th>
                <th className="text-left px-5 py-4 text-xs font-medium text-txt-tertiary w-1/3">
                  노션+시트+디코 (직접 조합)
                </th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-brand w-1/3 bg-brand/5">
                  Draft (올인원)
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, i) => (
                <tr
                  key={row.feature}
                  className={i < comparisonRows.length - 1 ? 'border-b border-border' : ''}
                >
                  <td className="px-5 py-3.5 font-medium text-txt-primary text-sm">
                    {row.feature}
                  </td>
                  <td className="px-5 py-3.5 text-txt-tertiary text-sm">
                    {row.legacy}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-txt-primary text-sm bg-brand/5">
                    {row.draft}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile stacked cards */}
        <div className="sm:hidden divide-y divide-border">
          {comparisonRows.map((row) => (
            <div key={row.feature} className="p-4 space-y-2.5">
              <p className="text-sm font-semibold text-txt-primary">{row.feature}</p>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-medium text-txt-tertiary bg-surface-sunken px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                    기존
                  </span>
                  <span className="text-xs text-txt-tertiary">{row.legacy}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-semibold text-brand bg-brand/10 px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                    Draft
                  </span>
                  <span className="text-xs font-semibold text-txt-primary">{row.draft}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Panel map ── */

const panels: Record<TabId, React.FC> = {
  calculator: CalculatorPanel,
  discord: DiscordDemoPanel,
  comparison: ComparisonPanel,
}

/* ── Main Component ── */

export function DemoTabs() {
  const [activeTab, setActiveTab] = useState<TabId>('calculator')

  const Panel = panels[activeTab]

  return (
    <section className="w-full bg-[#f7fbff] py-24 sm:py-32 px-6 md:px-10">
      <div className="max-w-5xl mx-auto">
        {/* Title */}
        <h2 className="text-3xl sm:text-4xl font-bold text-txt-primary text-center mb-10">
          직접 체험해보세요
        </h2>

        {/* Tab bar */}
        <div className="flex justify-center border-b border-border mb-10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-5 py-3 text-sm transition-colors duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'font-semibold text-txt-primary'
                  : 'text-txt-tertiary hover:text-txt-secondary'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="demo-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-txt-primary"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Panel />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
