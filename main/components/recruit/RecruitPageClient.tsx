'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, X, Circle, ChevronDown, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// 스크롤 리빌 공통 props — 섹션이 뷰포트에 들어오면 한 번만 fade-up
const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
}

// 폼 옵션 정의 ─────────────────────────────────────────────

const ROLE_OPTIONS = [
  { v: 'leader', l: '팀장' },
  { v: 'member', l: '팀원' },
] as const

const AI_FREQ_OPTIONS = [
  { v: 'rarely', l: '거의 안 봅니다' },
  { v: 'monthly', l: '가끔 봅니다 (월 1~2회)' },
  { v: 'weekly', l: '종종 봅니다 (주 몇 회)' },
  { v: 'daily', l: '자주 봅니다 (거의 매일)' },
] as const

const ATTITUDE_OPTIONS = [
  { v: 'no_interest', l: '별로 관심 없습니다' },
  { v: 'interested_far', l: '관심은 있지만 멀게 느껴집니다' },
  { v: 'want_start', l: '해보고 싶은데 어디서 시작할지 모르겠습니다' },
  { v: 'trying', l: '이미 조금씩 시도하고 있습니다' },
  { v: 'actively', l: '적극적으로 만들고 있습니다' },
] as const

const EXPERIENCE_OPTIONS = [
  { v: 'ai_regular', l: 'ChatGPT/Claude를 정기적으로 사용' },
  { v: 'ai_make_request', l: 'AI에게 "이런 거 만들어줘" 시켜 결과물 받아본 경험' },
  { v: 'ai_code', l: 'AI에게 코드를 짜달라고 해본 경험' },
  { v: 'cursor', l: 'Cursor / Claude Code 사용 경험' },
  { v: 'html_css', l: 'HTML/CSS로 페이지 제작 경험' },
  { v: 'github', l: 'GitHub에 코드 업로드 경험' },
  { v: 'deploy', l: '웹사이트 배포 경험 (Vercel, Netlify 등)' },
  { v: 'db', l: '데이터베이스 사용 경험 (Supabase, Firebase 등)' },
  { v: 'api', l: 'API 호출 코드 작성 경험' },
  { v: 'none', l: '위 어느 것도 해본 적 없음' },
] as const

// Q10은 Q8에서 "코딩 도구를 써본" 경우에만 노출. 아래 항목 중 1개 이상이면 표시.
const CODING_EXPERIENCE_IDS = new Set([
  'ai_code',
  'cursor',
  'html_css',
  'github',
  'deploy',
  'db',
  'api',
])

const PAID_TOOL_OPTIONS = [
  { v: 'chatgpt', l: 'ChatGPT Plus / Pro' },
  { v: 'claude', l: 'Claude Pro / Max' },
  { v: 'cursor', l: 'Cursor Pro' },
  { v: 'perplexity', l: 'Perplexity Pro' },
  { v: 'nocode', l: 'v0 / Bolt / Lovable 등 노코드 빌더' },
  { v: 'gen_ai', l: 'Midjourney / Suno 등 생성형 AI' },
  { v: 'notion_ai', l: 'Notion AI' },
  { v: 'other', l: '기타 (직접 입력)' },
  { v: 'free_only', l: '무료만 사용' },
  { v: 'none', l: '아무것도 안 씀' },
] as const

const SPEND_OPTIONS = [
  { v: '0', l: '0원' },
  { v: 'lt1', l: '1만원 미만' },
  { v: '1_3', l: '1~3만원' },
  { v: '3_6', l: '3~6만원' },
  { v: '6_10', l: '6~10만원' },
  { v: '10plus', l: '10만원 이상' },
] as const

const CLAUDE_STATUS_OPTIONS = [
  { v: 'paid_want_subsidy', l: '이미 결제 중 (지원되면 환급/보전 받고 싶음)' },
  { v: 'paid_ok', l: '이미 결제 중 (지원 없어도 괜찮음)' },
  { v: 'unpaid_self', l: '미결제, 본인 비용으로 결제 가능' },
  { v: 'unpaid_want_subsidy', l: '미결제, 지원되면 좋겠음' },
  { v: 'unsure', l: '잘 모르겠음' },
] as const

const ASSET_OPTIONS = [
  { v: 'none', l: '전혀 없음' },
  { v: 'idea', l: '아이디어/기획만 있음' },
  { v: 'wip', l: '일부 작업 중 (노션, Figma 등)' },
  { v: 'has_url', l: '어느 정도 만들어져 있음 (URL 있음)' },
  { v: 'almost_done', l: '거의 완성 단계' },
] as const

const OUTCOME_OPTIONS = [
  { v: 'landing', l: '우리 팀 데모데이용 랜딩페이지/사이트' },
  { v: 'mvp_feature', l: '우리 팀 프로덕트의 MVP 일부 기능' },
  { v: 'preorder_data', l: '우리 팀 사전예약/유저 데이터 수집 도구' },
  { v: 'experience', l: 'AI로 뭔가를 만드는 과정을 직접 경험' },
  { v: 'founder_proof', l: '창업가로서 "내 손으로 만들어봤다"는 경험' },
  { v: 'other', l: '기타' },
] as const

const ATTENDANCE_OPTIONS = [
  { v: 'all_6', l: '6회 다 가능' },
  { v: '5', l: '5회 정도 가능' },
  { v: 'lt_4', l: '4회 이하' },
  { v: 'unsure', l: '잘 모르겠음' },
] as const

const TIME_SLOTS = [
  { id: 'weekday_7_9', label: '평일 저녁 7~9시' },
  { id: 'weekday_8_10', label: '평일 저녁 8~10시' },
  { id: 'sat_am', label: '토요일 오전' },
  { id: 'sat_pm', label: '토요일 오후' },
  { id: 'sun_am', label: '일요일 오전' },
  { id: 'sun_pm', label: '일요일 오후' },
] as const

// 폼 상태 ────────────────────────────────────────────────

type FormState = {
  name: string
  team_name: string
  team_role: 'leader' | 'member' | ''

  ai_content_freq: 'rarely' | 'monthly' | 'weekly' | 'daily' | ''
  ai_recent_use: string
  ai_build_attitude:
    | 'no_interest'
    | 'interested_far'
    | 'want_start'
    | 'trying'
    | 'actively'
    | ''
  willingness: number // 0 = 미선택, 1~5

  experience: string[]
  self_skill: number // 0 = 미선택, 1~5
  recent_build: string

  paid_tools: string[]
  paid_tools_other: string
  monthly_spend: '0' | 'lt1' | '1_3' | '3_6' | '6_10' | '10plus' | ''
  claude_status:
    | 'paid_want_subsidy'
    | 'paid_ok'
    | 'unpaid_self'
    | 'unpaid_want_subsidy'
    | 'unsure'
    | ''

  team_asset_status: 'none' | 'idea' | 'wip' | 'has_url' | 'almost_done' | ''
  desired_outcome:
    | 'landing'
    | 'mvp_feature'
    | 'preorder_data'
    | 'experience'
    | 'founder_proof'
    | 'other'
    | ''
  desired_outcome_other: string
  ai_feature_idea: string

  attendance: 'all_6' | '5' | 'lt_4' | 'unsure' | ''
  available_slots: string[]
  has_laptop: 'yes' | 'no' | ''
  notes: string

  agreed: boolean
}

const initialState: FormState = {
  name: '',
  team_name: '',
  team_role: '',
  ai_content_freq: '',
  ai_recent_use: '',
  ai_build_attitude: '',
  willingness: 0,
  experience: [],
  self_skill: 0,
  recent_build: '',
  paid_tools: [],
  paid_tools_other: '',
  monthly_spend: '',
  claude_status: '',
  team_asset_status: '',
  desired_outcome: '',
  desired_outcome_other: '',
  ai_feature_idea: '',
  attendance: '',
  available_slots: [],
  has_laptop: '',
  notes: '',
  agreed: false,
}

export function RecruitPageClient() {
  const [form, setForm] = useState<FormState>(initialState)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const toggleArrayValue = (key: 'experience' | 'paid_tools' | 'available_slots', value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }))
  }

  const showError = (msg: string) => {
    setError(msg)
    requestAnimationFrame(() => {
      document.getElementById('recruit-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  // Q10 가시성: Q8 응답에 코딩 경험 항목이 1개라도 있으면 노출
  const showRecentBuild = form.experience.some((v) => CODING_EXPERIENCE_IDS.has(v))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // 클라이언트 사전 검증 — 라디오/체크박스 버튼 그룹은 HTML required가 안 먹힘
    if (!form.name.trim()) return showError('이름을 입력해주세요 (Q1)')
    if (!form.team_name.trim()) return showError('소속 팀을 입력해주세요 (Q2)')
    if (!form.team_role) return showError('팀 내 역할을 선택해주세요 (Q3)')
    if (!form.ai_content_freq) return showError('AI 콘텐츠 시청 빈도를 선택해주세요 (Q4)')
    if (!form.ai_recent_use.trim()) return showError('최근 한 달 AI 사용 용도를 적어주세요 (Q5)')
    if (!form.ai_build_attitude) return showError('AI로 만들기에 대한 느낌을 선택해주세요 (Q6)')
    if (!form.willingness) return showError('의지를 1~5점 중 선택해주세요 (Q7)')
    if (form.experience.length === 0) return showError('경험 항목을 1개 이상 선택해주세요 (Q8)')
    if (!form.self_skill) return showError('자가평가를 1~5점 중 선택해주세요 (Q9)')
    if (form.paid_tools.length === 0) return showError('결제 도구 항목을 1개 이상 선택해주세요 (Q11)')
    if (form.paid_tools.includes('other') && !form.paid_tools_other.trim())
      return showError('"기타"를 선택하셨습니다. 도구 이름을 적어주세요 (Q11)')
    if (!form.monthly_spend) return showError('월 평균 지출을 선택해주세요 (Q12)')
    if (!form.claude_status) return showError('Claude Pro 결제 상황을 선택해주세요 (Q13)')
    if (!form.team_asset_status) return showError('팀 자산 상태를 선택해주세요 (Q14)')
    if (!form.desired_outcome) return showError('6주 후 얻고 싶은 것을 선택해주세요 (Q15)')
    if (form.desired_outcome === 'other' && !form.desired_outcome_other.trim())
      return showError('"기타"를 선택하셨습니다. 내용을 적어주세요 (Q15)')
    if (!form.attendance) return showError('참여 가능 횟수를 선택해주세요 (Q17)')
    if (form.available_slots.length === 0)
      return showError('가능한 시간대를 1개 이상 선택해주세요 (Q18)')
    if (!form.has_laptop) return showError('노트북 지참 가능 여부를 선택해주세요 (Q19)')
    if (!form.agreed) return showError('개인정보 수집·이용에 동의해주세요')

    setSubmitting(true)
    try {
      const res = await fetch('/api/recruit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          has_laptop: form.has_laptop === 'yes',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        showError(data?.error?.message || '제출에 실패했습니다. 다시 시도해주세요.')
        return
      }
      setDone(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      showError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-surface-card text-txt-primary flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-brand/10 flex items-center justify-center">
            <Check className="w-8 h-8 text-brand" />
          </div>
          <h1 className="text-2xl font-bold mb-3">사전 신청이 완료되었습니다</h1>
          <p className="text-txt-secondary leading-relaxed mb-8">
            지원해주셔서 감사합니다. 운영 인원 확정 후 개별 안내드립니다.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm border border-border bg-surface-card hover:bg-surface-sunken transition-colors"
          >
            메인으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-card text-txt-primary">
      {/* Top notice */}
      <div className="border-b border-border bg-surface-sunken/50">
        <div className="max-w-3xl mx-auto px-6 py-4 text-xs text-txt-tertiary text-center leading-relaxed">
          FLIP 1기 안에서 운영하는 AI 빌더 스터디 · 8명 내외 모집
          <br className="sm:hidden" />
          <span className="hidden sm:inline"> · </span>
          작성에 약 5~7분 소요
        </div>
      </div>

      {/* Section 1 — Hero */}
      <section className="relative min-h-[100svh] sm:min-h-0 flex flex-col items-center justify-center max-w-3xl mx-auto px-6 pt-16 pb-12 sm:pt-24 sm:pb-20 text-center overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 text-brand text-xs font-bold mb-8"
        >
          <span className="relative flex w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-brand opacity-75 animate-ping" />
            <span className="relative rounded-full w-2 h-2 bg-brand" />
          </span>
          FLIP × DRAFT · 1기 AI 빌더 스터디
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
        >
          아이디어를
          <br />
          프로덕트로.
          <br />
          <span className="text-brand">Claude로, 같이.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="text-base md:text-lg text-txt-secondary leading-relaxed mb-10 max-w-xl mx-auto break-keep"
        >
          6주 동안 매주 2시간 + 그 외 시간.
          <br />
          FLIP 1기 8명이 데모데이에 올릴 그것 하나를 직접 만듭니다.
        </motion.p>

        {/* 모집 메타 — 진행률 대신 정보 칩 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex flex-wrap items-center justify-center gap-2 mb-10"
        >
          {[
            { k: '기간', v: '5/16 ~ 6/20 (6주)' },
            { k: '인원', v: '8명 내외' },
            { k: '도구', v: 'Claude 중심' },
          ].map((item) => (
            <span
              key={item.k}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-sunken text-xs text-txt-secondary"
            >
              <span className="text-txt-tertiary">{item.k}</span>
              <span className="font-bold text-txt-primary">{item.v}</span>
            </span>
          ))}
        </motion.div>

        <motion.a
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          href="#apply"
          className="group inline-flex items-center gap-2 bg-brand text-white px-8 py-4 rounded-full font-bold text-sm hover:bg-brand-hover transition-all duration-200 active:scale-[0.97] shadow-sm hover:shadow-md"
        >
          사전 신청하기
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </motion.a>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 sm:hidden"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="text-txt-tertiary"
          >
            <ChevronDown size={22} />
          </motion.div>
        </motion.div>
      </section>

      {/* Section 2 — 공감 */}
      <section className="max-w-2xl mx-auto px-6 py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.18, delayChildren: 0.1 } },
          }}
          className="space-y-5 text-lg sm:text-xl font-medium leading-relaxed text-txt-secondary"
        >
          {[
            '우리 팀 아이디어는 있는데, 누가 손대지가 막혀 있고',
            '데모데이는 다가오는데, 보여줄 게 화면 한 장이 없고',
            'AI로 뭔가 해볼 수는 있을 것 같은데, 어디서 시작할지 모르겠고',
            '혼자 손대다 결국 노션만 길어지고',
            '6주 뒤, 우리 팀 이름으로 된 사이트 하나라도 있으면 좋겠고',
          ].map((line) => (
            <motion.p
              key={line}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
              }}
            >
              {line}
            </motion.p>
          ))}
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, delay: 1.05, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 text-xl sm:text-2xl font-bold text-txt-primary"
        >
          → 그래서, 6주만 같이 해봅시다.
        </motion.p>
      </section>

      {/* Section 3 — 적합도 */}
      <motion.section {...reveal} className="max-w-2xl mx-auto px-6 py-20 border-t border-border">
        <h2 className="text-2xl sm:text-3xl font-bold mb-10">이런 분이면 딱입니다</h2>
        <ul className="space-y-3 mb-12">
          {[
            '우리 팀에 디지털 자산 하나는 필요한데 손이 못 가신 분',
            'AI로 직접 해보고 싶었지만 시작점이 없던 분',
            '데모데이에서 자기 손으로 만든 걸 보여주고 싶은 분',
            '6주간 매주 2시간 + 그 외 작업 시간 확보 가능한 분',
          ].map((t, i) => (
            <motion.li
              key={t}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex items-start gap-3 text-base sm:text-lg text-txt-primary p-3 rounded-xl hover:bg-surface-sunken/60 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-brand" />
              </div>
              <span>{t}</span>
            </motion.li>
          ))}
        </ul>

        <h3 className="text-lg font-bold mb-5 text-txt-secondary">이런 분은 안 맞을 수 있습니다</h3>
        <ul className="space-y-2">
          {[
            '매주 2시간 + 추가 작업 시간 확보가 어려운 분',
            '강의식 수업을 기대하는 분 — 실습 중심으로 운영됩니다',
          ].map((t, i) => (
            <motion.li
              key={t}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex items-start gap-3 text-sm sm:text-base text-txt-tertiary p-3"
            >
              <X className="w-4 h-4 shrink-0 mt-1" />
              <span>{t}</span>
            </motion.li>
          ))}
        </ul>
      </motion.section>

      {/* Section 4 — 정체성 */}
      <motion.section {...reveal} className="max-w-3xl mx-auto px-6 py-20 border-t border-border">
        <h2 className="text-2xl sm:text-3xl font-bold mb-12">이 스터디는</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { title: 'Claude 중심', desc: '코드를 손으로 안 씁니다. Claude에 자연어로 시켜서 만듭니다. Cursor 사용자는 Cursor 안에서 Claude 모델로 따라옵니다.' },
            { title: '매주 2시간 + α', desc: '강의를 듣는 게 아니라 직접 만들고 매주 공유합니다. 그 외 시간에도 본인 손으로 작업합니다.' },
            { title: '8명 내외', desc: 'FLIP 1기 안에서만 운영. 각 팀에서 데모데이용 자산 하나가 나오는 것이 목표입니다.' },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-border bg-surface-card p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-bold mb-2 text-txt-primary">{card.title}</h3>
              <p className="text-sm text-txt-secondary leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Section 5 — 타임라인 */}
      <motion.section {...reveal} className="max-w-3xl mx-auto px-6 py-20 border-t border-border">
        <h2 className="text-2xl sm:text-3xl font-bold mb-12">6주 타임라인</h2>
        <ol className="relative space-y-8 pl-8 sm:pl-10">
          <div className="absolute left-2 sm:left-3 top-2 bottom-2 w-px bg-border" aria-hidden />
          {[
            { date: '~ 5/15', title: '사전 신청 접수 중', desc: '운영 인원 확정 후 개별 안내', highlight: true },
            { date: 'W1 · 5/16 주', title: 'Claude 셋업 + 도메인 구매', desc: '도메인은 본인 부담 (연 1~2만원), W1에 함께 구매' },
            { date: 'W2~W5 · 5/23 ~ 6/13', title: '매주 2시간 모임 + 개인 작업', desc: '각자 팀 아이템으로 직접 만들고 공유' },
            { date: 'W6 · 6/20 주', title: '데모데이 직전 마무리', desc: '발표 자료/링크 정리' },
            { date: '데모데이', title: '결과물 공개', desc: '자기 손으로 만든 그것 하나' },
          ].map((item, i) => (
            <motion.li
              key={item.date}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative"
            >
              <div
                className={`absolute -left-[26px] sm:-left-[30px] top-1.5 w-3 h-3 rounded-full border-2 ${
                  item.highlight
                    ? 'bg-brand border-brand ring-4 ring-brand/15'
                    : 'bg-surface-card border-border'
                }`}
                aria-hidden
              />
              <div className="text-xs font-mono text-txt-tertiary mb-1">{item.date}</div>
              <div className="font-bold text-txt-primary">{item.title}</div>
              <div className="text-sm text-txt-secondary mt-1">{item.desc}</div>
            </motion.li>
          ))}
        </ol>
      </motion.section>

      {/* Section 6 — FAQ */}
      <motion.section {...reveal} className="max-w-2xl mx-auto px-6 py-20 border-t border-border">
        <h2 className="text-2xl sm:text-3xl font-bold mb-10">자주 묻는 질문</h2>
        <FaqList />
      </motion.section>

      {/* Section 7 — 신청 폼 */}
      <section id="apply" className="border-t border-border bg-surface-sunken/30">
        <div className="max-w-2xl mx-auto px-6 py-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">[FLIP 1기] AI 빌더 스터디 사전 신청</h2>
            <p className="text-txt-secondary text-sm leading-relaxed">
              8명 내외 · 작성에 약 5~7분 소요됩니다
            </p>
          </div>

          {/* 인사말 */}
          <div className="mb-10 rounded-2xl border border-border bg-surface-card p-5 text-sm text-txt-secondary leading-relaxed space-y-3">
            <p>
              안녕하세요. FLIP 1기 안에서 운영할 AI 빌더 스터디(8명 내외) 사전 신청을 받습니다.
              6주간 매주 2시간, 각자 팀 아이템으로 직접 만들어보는 스터디이며 데모데이가 목표 시점입니다.
            </p>
            <p>
              도구는 Claude 중심으로 진행합니다. (Cursor 사용자는 Cursor 안에서 Claude 모델로 동일하게 따라올 수 있습니다.)
            </p>
            <p>
              도구 비용 관련 문항은 창업교육센터에 일부 지원 요청을 검토하기 위한 자료입니다. 이미 결제 중이신 분도 환급/지원 대상이 될 수 있습니다.
              도메인(연 1~2만원)은 본인 부담이며 W1에 함께 구매합니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* 섹션 1. 기본 정보 */}
            <SectionHeader index={1} title="기본 정보" />

            <Field label="Q1. 이름" required>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className={inputClass}
                placeholder="예: 이성민"
                autoComplete="name"
              />
            </Field>

            <Field label="Q2. 소속 팀" required hint="본인이 속한 FLIP 팀 이름을 적어주세요.">
              <input
                type="text"
                required
                value={form.team_name}
                onChange={(e) => update('team_name', e.target.value)}
                className={inputClass}
                placeholder="예) 팀 ABC"
                maxLength={100}
              />
            </Field>

            <Field label="Q3. 팀 내 역할" required>
              <ButtonGroup
                options={ROLE_OPTIONS}
                value={form.team_role}
                onChange={(v) => update('team_role', v as FormState['team_role'])}
                columns={2}
              />
            </Field>

            {/* 섹션 2. AI 관심 & 태도 */}
            <SectionHeader index={2} title="AI에 대한 관심과 태도" />

            <Field label="Q4. AI 관련 콘텐츠(유튜브, 트위터, 뉴스레터 등)를 평소 얼마나 보십니까?" required>
              <RadioList
                options={AI_FREQ_OPTIONS}
                value={form.ai_content_freq}
                onChange={(v) => update('ai_content_freq', v as FormState['ai_content_freq'])}
              />
            </Field>

            <Field
              label="Q5. 최근 한 달 안에 ChatGPT/Claude 같은 AI를 가장 많이 쓴 용도는 무엇입니까?"
              required
              hint="한 줄로 적어주세요 (예: 과제 글쓰기, 코드 짜기, 사업계획서 다듬기, 거의 안 씀)"
            >
              <input
                type="text"
                value={form.ai_recent_use}
                onChange={(e) => update('ai_recent_use', e.target.value)}
                className={inputClass}
                placeholder="예) 과제 글쓰기, 코드 짜기, 사업계획서 다듬기"
                maxLength={300}
              />
            </Field>

            <Field
              label='Q6. "AI로 내가 직접 뭔가를 만든다"는 생각에 대해 어떻게 느끼십니까?'
              required
            >
              <RadioList
                options={ATTITUDE_OPTIONS}
                value={form.ai_build_attitude}
                onChange={(v) => update('ai_build_attitude', v as FormState['ai_build_attitude'])}
              />
            </Field>

            <Field
              label="Q7. 6주간 매주 2시간 + 그 외 시간에도 직접 작업해야 하는 스터디입니다. 본인 의지는 어느 정도입니까?"
              required
            >
              <ScaleSelector
                value={form.willingness}
                onChange={(v) => update('willingness', v)}
                minLabel="시간 내기 어려울 듯"
                maxLabel="무조건 합니다"
              />
            </Field>

            {/* 섹션 3. AI/개발 경험 */}
            <SectionHeader index={3} title="AI/개발 경험" />

            <Field label="Q8. 다음 중 직접 해본 적 있는 것을 모두 골라주세요." required>
              <CheckboxList
                options={EXPERIENCE_OPTIONS}
                selected={form.experience}
                onToggle={(v) => toggleArrayValue('experience', v)}
              />
            </Field>

            <Field
              label='Q9. 본인의 "AI 도구로 뭔가 만드는 능력"을 스스로 평가하면?'
              required
            >
              <ScaleSelector
                value={form.self_skill}
                onChange={(v) => update('self_skill', v)}
                minLabel="거의 없음"
                maxLabel="매우 자신 있음"
              />
            </Field>

            {showRecentBuild && (
              <Field
                label="Q10. 가장 최근에 만들어본 것은 무엇입니까?"
                hint="Q8에서 코딩 도구 경험을 선택하신 분만 답변해주세요. (선택)"
              >
                <textarea
                  rows={3}
                  maxLength={500}
                  value={form.recent_build}
                  onChange={(e) => update('recent_build', e.target.value)}
                  className={inputClass}
                  placeholder="예) 토이 프로젝트 랜딩페이지를 Cursor로 만들어봤습니다."
                />
              </Field>
            )}

            {/* 섹션 4. AI 도구 사용 & 비용 */}
            <SectionHeader index={4} title="AI 도구 사용 현황 & 비용" />

            <Field
              label="Q11. 현재 결제해서 쓰고 있는 AI/개발 도구를 모두 골라주세요."
              required
            >
              <CheckboxList
                options={PAID_TOOL_OPTIONS}
                selected={form.paid_tools}
                onToggle={(v) => toggleArrayValue('paid_tools', v)}
              />
              {form.paid_tools.includes('other') && (
                <input
                  type="text"
                  value={form.paid_tools_other}
                  onChange={(e) => update('paid_tools_other', e.target.value)}
                  className={`${inputClass} mt-3`}
                  placeholder='"기타"에 해당하는 도구 이름'
                  maxLength={200}
                />
              )}
            </Field>

            <Field label="Q12. 위 도구들에 월 평균 얼마 정도 쓰십니까?" required>
              <RadioList
                options={SPEND_OPTIONS}
                value={form.monthly_spend}
                onChange={(v) => update('monthly_spend', v as FormState['monthly_spend'])}
              />
            </Field>

            <Field
              label="Q13. 스터디는 Claude Pro를 메인 도구로 사용합니다. 본인 상황에 가장 가까운 것을 골라주세요."
              required
            >
              <RadioList
                options={CLAUDE_STATUS_OPTIONS}
                value={form.claude_status}
                onChange={(v) => update('claude_status', v as FormState['claude_status'])}
              />
            </Field>

            {/* 섹션 5. 팀 자산 & 스터디 목표 */}
            <SectionHeader index={5} title="팀 자산과 스터디 목표" />

            <Field
              label="Q14. 우리 팀이 데모데이에 보여줄 디지털 자산의 현재 상태는?"
              required
            >
              <RadioList
                options={ASSET_OPTIONS}
                value={form.team_asset_status}
                onChange={(v) => update('team_asset_status', v as FormState['team_asset_status'])}
              />
            </Field>

            <Field label="Q15. 6주 후 가장 얻고 싶은 것은? (1개 선택)" required>
              <RadioList
                options={OUTCOME_OPTIONS}
                value={form.desired_outcome}
                onChange={(v) => update('desired_outcome', v as FormState['desired_outcome'])}
              />
              {form.desired_outcome === 'other' && (
                <input
                  type="text"
                  value={form.desired_outcome_other}
                  onChange={(e) => update('desired_outcome_other', e.target.value)}
                  className={`${inputClass} mt-3`}
                  placeholder='"기타"에 해당하는 내용'
                  maxLength={200}
                />
              )}
            </Field>

            <Field
              label="Q16. 본인 팀 아이템에 AI 기능을 붙인다면 어떤 게 떠오르십니까?"
              hint="떠오르시는 분만 한 줄 적어주세요. (선택)"
            >
              <textarea
                rows={3}
                maxLength={500}
                value={form.ai_feature_idea}
                onChange={(e) => update('ai_feature_idea', e.target.value)}
                className={inputClass}
                placeholder="예) 사용자가 입력한 키워드로 자동 추천"
              />
            </Field>

            {/* 섹션 6. 운영 정보 */}
            <SectionHeader index={6} title="운영 정보" />

            <Field
              label="Q17. 6주간(5/16 주 ~ 6/20 주) 매주 2시간 참여 가능하십니까?"
              required
            >
              <RadioList
                options={ATTENDANCE_OPTIONS}
                value={form.attendance}
                onChange={(v) => update('attendance', v as FormState['attendance'])}
              />
            </Field>

            <Field
              label="Q18. 가능한 요일/시간대를 모두 골라주세요."
              required
              hint="다중 선택"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const selected = form.available_slots.includes(slot.id)
                  return (
                    <button
                      type="button"
                      key={slot.id}
                      onClick={() => toggleArrayValue('available_slots', slot.id)}
                      className={`px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                        selected
                          ? 'border-brand bg-brand text-white font-medium'
                          : 'border-border bg-surface-card text-txt-secondary hover:bg-surface-sunken'
                      }`}
                    >
                      {slot.label}
                    </button>
                  )
                })}
              </div>
            </Field>

            <Field label="Q19. 노트북을 매주 가져올 수 있습니까?" required>
              <ButtonGroup
                options={[
                  { v: 'yes', l: '네' },
                  { v: 'no', l: '아니요' },
                ]}
                value={form.has_laptop}
                onChange={(v) => update('has_laptop', v as FormState['has_laptop'])}
                columns={2}
              />
            </Field>

            <Field
              label="Q20. 스터디 운영에 대해 미리 하고 싶은 말이 있으면 적어주세요."
              hint="선택"
            >
              <textarea
                rows={4}
                maxLength={1000}
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                className={inputClass}
                placeholder="자유롭게 적어주세요."
              />
            </Field>

            {/* 개인정보 동의 */}
            <div className="rounded-xl border border-border bg-surface-card p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agreed}
                  onChange={(e) => update('agreed', e.target.checked)}
                  className="mt-1 w-4 h-4 accent-brand shrink-0"
                  required
                />
                <div className="text-xs text-txt-secondary leading-relaxed">
                  <div className="font-bold text-txt-primary mb-1">개인정보 수집·이용에 동의합니다 (필수)</div>
                  수집 항목: 이름, 소속 팀, 사전 신청 응답 내용
                  <br />
                  이용 목적: FLIP 1기 AI 빌더 스터디 선발 및 운영 연락, 도구 비용 지원 검토
                  <br />
                  보유 기간: 스터디 종료 후 3개월
                </div>
              </label>
            </div>

            {error && (
              <div
                id="recruit-error"
                className="rounded-xl border border-status-error-border bg-status-error-bg text-status-error-text px-4 py-3 text-sm"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand text-white px-6 py-4 rounded-full font-bold text-base hover:bg-brand-hover transition-all duration-200 active:scale-[0.99] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? '제출 중...' : '사전 신청 제출하기'}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}

// ─── FAQ ──────────────────────────────────────────────────

function FaqList() {
  const items = [
    {
      q: '코딩 0인데 따라갈 수 있습니까?',
      a: 'Claude에 자연어로 시켜서 만드는 것이 핵심입니다. W1에 셋업 가이드부터 차근차근 진행하고, 매주 모임에서 막힌 부분을 같이 풉니다. "잘 모르겠습니다"가 디폴트라고 생각하셔도 됩니다.',
    },
    {
      q: 'Claude Pro 결제는 꼭 필요한가요?',
      a: '메인 도구로 Claude Pro를 사용합니다. 도구 비용은 창업교육센터에 일부 지원 요청을 검토 중이며, 이미 결제 중이신 분도 환급/지원 대상이 될 수 있습니다. 폼 Q13에서 본인 상황을 선택해주시면 됩니다.',
    },
    {
      q: 'Cursor를 쓰고 있어도 되나요?',
      a: '됩니다. Cursor 안에서 Claude 모델을 선택해서 동일하게 따라올 수 있습니다.',
    },
    {
      q: '우리 팀에서 2명 신청해도 됩니까?',
      a: '가능합니다. 다만 자리가 8명 내외라 팀별 균형은 운영진이 조정할 수 있습니다.',
    },
    {
      q: '도메인은 꼭 사야 하나요?',
      a: 'W1에 함께 구매합니다. 연 1~2만원 수준이며 본인 부담입니다. 데모데이에 자기 손으로 만든 사이트를 본인 도메인으로 공개하는 것이 권장 흐름입니다.',
    },
  ]
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const open = openIdx === i
        return (
          <div
            key={item.q}
            className="rounded-2xl border border-border bg-surface-card overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setOpenIdx(open ? null : i)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-surface-sunken/50 transition-colors"
              aria-expanded={open}
            >
              <span className="font-bold text-txt-primary text-sm sm:text-base">Q. {item.q}</span>
              <ChevronDown
                size={18}
                className={`text-txt-tertiary shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
              />
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 text-sm text-txt-secondary leading-relaxed">{item.a}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

// ─── 폼 헬퍼 컴포넌트 ────────────────────────────────────────

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-border bg-surface-card text-txt-primary text-sm placeholder:text-txt-tertiary focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors'

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-txt-primary mb-2">
        {label}
        {required && <span className="text-brand ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-txt-tertiary mb-2">{hint}</p>}
      {children}
    </div>
  )
}

function SectionHeader({ index, title }: { index: number; title: string }) {
  return (
    <div className="pt-4 pb-1 border-t border-border first:border-t-0 first:pt-0">
      <div className="text-xs font-mono text-txt-tertiary mb-1">섹션 {index}</div>
      <h3 className="text-base font-bold text-txt-primary">{title}</h3>
    </div>
  )
}

function ButtonGroup({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: ReadonlyArray<{ v: string; l: string }>
  value: string
  onChange: (v: string) => void
  columns?: 2 | 3 | 4
}) {
  const gridClass = columns === 4 ? 'sm:grid-cols-4' : columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
  return (
    <div className={`grid grid-cols-2 ${gridClass} gap-2`}>
      {options.map((opt) => (
        <button
          type="button"
          key={opt.v}
          onClick={() => onChange(opt.v)}
          className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
            value === opt.v
              ? 'border-brand bg-brand text-white'
              : 'border-border bg-surface-card text-txt-secondary hover:bg-surface-sunken'
          }`}
        >
          {opt.l}
        </button>
      ))}
    </div>
  )
}

function RadioList({
  options,
  value,
  onChange,
}: {
  options: ReadonlyArray<{ v: string; l: string }>
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const selected = value === opt.v
        return (
          <button
            type="button"
            key={opt.v}
            onClick={() => onChange(opt.v)}
            className={`w-full text-left px-4 py-3 rounded-xl border transition-colors flex items-center gap-3 ${
              selected
                ? 'border-brand bg-brand/5'
                : 'border-border bg-surface-card hover:bg-surface-sunken'
            }`}
          >
            {selected ? (
              <Check className="w-4 h-4 text-brand shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-txt-tertiary shrink-0" />
            )}
            <span className="text-sm text-txt-primary">{opt.l}</span>
          </button>
        )
      })}
    </div>
  )
}

function CheckboxList({
  options,
  selected,
  onToggle,
}: {
  options: ReadonlyArray<{ v: string; l: string }>
  selected: string[]
  onToggle: (v: string) => void
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const isOn = selected.includes(opt.v)
        return (
          <button
            type="button"
            key={opt.v}
            onClick={() => onToggle(opt.v)}
            className={`w-full text-left px-4 py-3 rounded-xl border transition-colors flex items-center gap-3 ${
              isOn
                ? 'border-brand bg-brand/5'
                : 'border-border bg-surface-card hover:bg-surface-sunken'
            }`}
          >
            <div
              className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                isOn ? 'border-brand bg-brand' : 'border-border bg-surface-card'
              }`}
            >
              {isOn && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="text-sm text-txt-primary">{opt.l}</span>
          </button>
        )
      })}
    </div>
  )
}

function ScaleSelector({
  value,
  onChange,
  minLabel,
  maxLabel,
}: {
  value: number
  onChange: (v: number) => void
  minLabel: string
  maxLabel: string
}) {
  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n) => {
          const selected = value === n
          return (
            <button
              type="button"
              key={n}
              onClick={() => onChange(n)}
              className={`py-3 rounded-xl border font-bold text-base transition-colors ${
                selected
                  ? 'border-brand bg-brand text-white'
                  : 'border-border bg-surface-card text-txt-secondary hover:bg-surface-sunken'
              }`}
              aria-label={`${n}점`}
            >
              {n}
            </button>
          )
        })}
      </div>
      <div className="flex justify-between text-[11px] text-txt-tertiary mt-2 px-1">
        <span>1 — {minLabel}</span>
        <span>5 — {maxLabel}</span>
      </div>
    </div>
  )
}
