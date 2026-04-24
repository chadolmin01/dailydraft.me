'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

/* ── Tab Data ── */

const tabs = [
  { id: 'weekly', label: '주간 진행 추적' },
  { id: 'handoff', label: '기수 인수인계' },
  { id: 'report', label: '성과 보고' },
] as const

type TabId = (typeof tabs)[number]['id']

/* ── Tab 1: 주간 진행 추적 ── */

const WeeklyTrackingPanel = () => (
  <div className="space-y-6">
    <p className="text-sm sm:text-base text-txt-secondary text-center max-w-2xl mx-auto leading-relaxed break-keep">
      5개 팀의 진행상황을 파악하기 위해 카톡 3개, 디코 2개, 시트 1개를 여는 월요일 아침.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-stretch">
      {/* Before */}
      <div className="bg-surface-sunken rounded-xl p-5 sm:p-6 flex flex-col">
        <span className="text-xs font-semibold text-txt-tertiary mb-4">Before</span>
        <div className="space-y-3 flex-1">
          {/* Mock chat messages */}
          <ChatBubble sender="회장" message="팀 A 진행상황 공유해주세요~" time="오전 9:02" />
          <ChatStatus text="읽음" />
          <ChatBubble sender="회장" message="팀 B도 부탁드려요" time="오전 9:15" />
          <ChatStatus text="답장 없음..." muted />
          <ChatBubble sender="팀A 리더" message="저희 이번 주 API 연동했습니다!" time="오후 2:30" />
          <ChatBubble sender="회장" message="팀 C는요...?" time="오후 4:12" />
          <ChatStatus text="답장 없음..." muted />
        </div>
        <div className="mt-5 pt-4 border-t border-border">
          <p className="text-xs text-txt-tertiary">
            주 3시간 소모 · 수동 취합 · 누락 빈번
          </p>
        </div>
      </div>

      {/* Arrow — 장식용, before→after 흐름은 시각 전용. 보조기기엔 before/after 라벨로 전달됨 */}
      <div aria-hidden="true" className="hidden md:flex items-center justify-center">
        <span className="text-2xl text-txt-tertiary select-none">&rarr;</span>
      </div>
      <div aria-hidden="true" className="flex md:hidden items-center justify-center py-1">
        <span className="text-xl text-txt-tertiary select-none">&darr;</span>
      </div>

      {/* After — 실제 Discord 서버에 발행된 Draft Bot 주간 리포트 */}
      <div className="bg-surface-card border border-border rounded-xl overflow-hidden flex flex-col">
        <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-3">
          <span className="text-xs font-semibold text-brand">After</span>
        </div>
        <div className="relative flex-1">
          <Image
            src="/landing/screenshots/03_ghostwriter.png"
            alt="Draft Bot 이 Discord 에 자동 발행한 15주차 주간 현황"
            width={2074}
            height={1105}
            className="w-full h-auto"
            sizes="(min-width: 768px) 520px, 100vw"
          />
        </div>
        <div className="px-5 sm:px-6 py-4 border-t border-border">
          <p className="text-xs text-brand font-medium">
            대화 기반 자동 요약 · 회장이 묻지 않아도 정리 완료
          </p>
        </div>
      </div>
    </div>
  </div>
)

/* ── Tab 2: 기수 인수인계 ── */

const HandoffPanel = () => (
  <div className="space-y-6">
    <p className="text-sm sm:text-base text-txt-secondary text-center max-w-2xl mx-auto leading-relaxed break-keep">
      &ldquo;이 노션이랑 이 시트랑 이 디코 서버랑...&rdquo; &mdash; 매 기수 반복되는 2시간짜리 설명.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-stretch">
      {/* Before */}
      <div className="bg-surface-sunken rounded-xl p-5 sm:p-6 flex flex-col">
        <span className="text-xs font-semibold text-txt-tertiary mb-4">Before</span>
        <ul className="space-y-3 flex-1">
          {[
            { icon: '📁', text: '2024 노션 워크스페이스 (링크 만료)' },
            { icon: '📊', text: '구글시트_멤버명단_최종_진짜최종_v3' },
            { icon: '💬', text: '카톡방 스크롤 올려보면 있어요' },
            { icon: '🔗', text: '드라이브 폴더 (권한 만료)' },
            { icon: '📝', text: '나머진 구두로 설명할게요' },
          ].map((item) => (
            <li key={item.text} className="flex items-start gap-3">
              <span aria-hidden="true" className="text-base shrink-0 leading-none mt-0.5">
                {item.icon}
              </span>
              <span className="text-sm text-txt-secondary leading-snug">{item.text}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 pt-4 border-t border-border">
          <p className="text-xs text-txt-tertiary">
            인수인계 2시간+ · 다음 기수 적응 2주
          </p>
        </div>
      </div>

      {/* Arrow — 장식용, before→after 흐름은 시각 전용. 보조기기엔 before/after 라벨로 전달됨 */}
      <div aria-hidden="true" className="hidden md:flex items-center justify-center">
        <span className="text-2xl text-txt-tertiary select-none">&rarr;</span>
      </div>
      <div aria-hidden="true" className="flex md:hidden items-center justify-center py-1">
        <span className="text-xl text-txt-tertiary select-none">&darr;</span>
      </div>

      {/* After — 실제 클럽 페이지 + 아카이브 탭. 운영 툴바(KPI·증명서·설정·페르소나·초대)에
          다음 기수 회장이 받을 것들이 한 눈에 보임. */}
      <div className="bg-surface-card border border-border rounded-xl overflow-hidden flex flex-col">
        <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-3">
          <span className="text-xs font-semibold text-brand">After</span>
        </div>
        <div className="relative flex-1">
          <Image
            src="/landing/screenshots/12_cohorts.png"
            alt="Draft 클럽 페이지 — 기수 아카이브와 운영 도구 한 곳에"
            width={1428}
            height={1438}
            className="w-full h-auto"
            sizes="(min-width: 768px) 520px, 100vw"
          />
        </div>
        <div className="px-5 sm:px-6 py-4 border-t border-border">
          <p className="text-xs text-brand font-medium">
            관리자 권한 이전 · 5분 · 맥락 100% 보존
          </p>
        </div>
      </div>
    </div>
  </div>
)

/* ── Tab 3: 성과 보고 ── */

const ReportPanel = () => (
  <div className="space-y-6">
    <p className="text-sm sm:text-base text-txt-secondary text-center max-w-2xl mx-auto leading-relaxed break-keep">
      학기말마다 돌아오는 지도교수님의 &ldquo;성과 정리해서 보내줘.&rdquo;
    </p>

    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-stretch">
      {/* Before */}
      <div className="bg-surface-sunken rounded-xl p-5 sm:p-6 flex flex-col">
        <span className="text-xs font-semibold text-txt-tertiary mb-4">Before</span>
        <div className="space-y-3 flex-1">
          {/* Document skeleton lines */}
          <div className="space-y-2.5">
            <div className="h-4 w-3/4 bg-border/60 rounded" />
            <div className="h-3 w-full bg-border/40 rounded" />
            <div className="h-3 w-5/6 bg-border/40 rounded" />
            <div className="h-3 w-full bg-border/40 rounded" />
            <div className="h-3 w-2/3 bg-border/40 rounded" />
          </div>
          <div className="h-px bg-border/30 my-3" />
          <div className="space-y-2.5">
            <div className="h-3.5 w-1/2 bg-border/60 rounded" />
            <div className="h-3 w-full bg-border/40 rounded" />
            <div className="h-3 w-4/5 bg-border/40 rounded" />
            <div className="h-3 w-full bg-border/40 rounded" />
          </div>
          <div className="h-px bg-border/30 my-3" />
          <div className="space-y-2.5">
            <div className="h-3.5 w-2/5 bg-border/60 rounded" />
            <div className="h-3 w-3/4 bg-border/40 rounded" />
            <div className="h-3 w-full bg-border/40 rounded" />
          </div>
        </div>
        <div className="mt-5 pt-4 border-t border-border">
          <p className="text-xs text-txt-tertiary">
            수동 작성 3일 · 수치 불정확 · 매번 포맷 새로
          </p>
        </div>
      </div>

      {/* Arrow — 장식용, before→after 흐름은 시각 전용. 보조기기엔 before/after 라벨로 전달됨 */}
      <div aria-hidden="true" className="hidden md:flex items-center justify-center">
        <span className="text-2xl text-txt-tertiary select-none">&rarr;</span>
      </div>
      <div aria-hidden="true" className="flex md:hidden items-center justify-center py-1">
        <span className="text-xl text-txt-tertiary select-none">&darr;</span>
      </div>

      {/* After — 실제 KPI 보고서 페이지. 창업지원단·LINC·RISE·캠퍼스타운 제출 포맷에
          맞춘 정량·정성 지표를 자동 집계. */}
      <div className="bg-surface-card border border-border rounded-xl overflow-hidden flex flex-col">
        <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-3">
          <span className="text-xs font-semibold text-brand">After</span>
        </div>
        <div className="relative flex-1">
          <Image
            src="/landing/screenshots/11_kpi_report.png"
            alt="FLIP KPI 보고서 — 창업지원단·LINC 제출용 자동 집계"
            width={1430}
            height={1440}
            className="w-full h-auto"
            sizes="(min-width: 768px) 520px, 100vw"
          />
        </div>
        <div className="px-5 sm:px-6 py-4 border-t border-border">
          <p className="text-xs text-brand font-medium">
            원클릭 생성 · 10초 · 활동 기록에서 자동 집계
          </p>
        </div>
      </div>
    </div>
  </div>
)

/* ── Chat Bubble helpers ── */

function ChatBubble({ sender, message, time }: { sender: string; message: string; time: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-full bg-surface-card border border-border flex items-center justify-center shrink-0">
        <span className="text-[10px] font-semibold text-txt-secondary">{sender[0]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold text-txt-primary">{sender}</span>
          <span className="text-[10px] text-txt-tertiary">{time}</span>
        </div>
        <p className="text-xs text-txt-secondary mt-0.5 leading-relaxed">{message}</p>
      </div>
    </div>
  )
}

function ChatStatus({ text, muted }: { text: string; muted?: boolean }) {
  return (
    <p className={`text-[10px] pl-[38px] ${muted ? 'text-status-danger-text' : 'text-txt-tertiary'}`}>
      {text}
    </p>
  )
}

/* ── Panel map ── */

const panels: Record<TabId, React.FC> = {
  weekly: WeeklyTrackingPanel,
  handoff: HandoffPanel,
  report: ReportPanel,
}

/* ── Main Component ── */

export function BeforeAfterTabs() {
  const [activeTab, setActiveTab] = useState<TabId>('weekly')

  const Panel = panels[activeTab]

  return (
    <section
      id="before-after"
      aria-labelledby="before-after-title"
      className="w-full bg-white py-24 sm:py-32 px-6 md:px-10"
    >
      <div className="max-w-5xl mx-auto">
        {/* Title */}
        <h2
          id="before-after-title"
          className="text-3xl sm:text-4xl font-bold text-txt-primary text-center mb-10"
        >
          이런 월요일, 바꿀 수 있습니다
        </h2>

        {/* Tab bar — ARIA Authoring Practices tabs pattern */}
        <div
          role="tablist"
          aria-label="Before/After 시나리오"
          className="flex justify-center border-b border-border mb-10"
        >
          {tabs.map((tab) => {
            const selected = activeTab === tab.id
            return (
              <button
                key={tab.id}
                id={`beforeafter-tab-${tab.id}`}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls={`beforeafter-panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-5 py-3 text-sm transition-colors duration-200 whitespace-nowrap focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded-sm ${
                  selected
                    ? 'font-semibold text-txt-primary'
                    : 'text-txt-tertiary hover:text-txt-secondary'
                }`}
              >
                {tab.label}
                {selected && (
                  <motion.div
                    layoutId="beforeafter-underline"
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-txt-primary"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Panel — aria-live 로 탭 변경 내용이 보조기기에도 전달됨 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            role="tabpanel"
            id={`beforeafter-panel-${activeTab}`}
            aria-labelledby={`beforeafter-tab-${activeTab}`}
            tabIndex={0}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded-md"
          >
            <Panel />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
