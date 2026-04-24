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

const SPOTS_FILLED = 3
const SPOTS_TOTAL = 7

type FormState = {
  name: string
  team_idea: string
  team_role: 'plan' | 'design' | 'dev' | 'etc' | ''
  ai_experience: string
  learning_goal: string
  motivation: string
  available_slots: string[]
  weekly_hours: '3-5' | '5-8' | '8+' | ''
  offline_available: 'yes' | 'discuss' | ''
  agreed: boolean
}

const initialState: FormState = {
  name: '',
  team_idea: '',
  team_role: '',
  ai_experience: '',
  learning_goal: '',
  motivation: '',
  available_slots: [],
  weekly_hours: '',
  offline_available: '',
  agreed: false,
}

const TIME_SLOTS = [
  { id: 'mon_eve', label: '월 저녁' },
  { id: 'tue_eve', label: '화 저녁' },
  { id: 'wed_eve', label: '수 저녁' },
  { id: 'thu_eve', label: '목 저녁' },
  { id: 'fri_eve', label: '금 저녁' },
  { id: 'sat_am', label: '토 오전' },
  { id: 'sat_pm', label: '토 오후' },
  { id: 'sun_am', label: '일 오전' },
  { id: 'sun_pm', label: '일 오후' },
]

export function RecruitPageClient() {
  const [form, setForm] = useState<FormState>(initialState)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const toggleSlot = (id: string) => {
    setForm((prev) => ({
      ...prev,
      available_slots: prev.available_slots.includes(id)
        ? prev.available_slots.filter((s) => s !== id)
        : [...prev.available_slots, id],
    }))
  }

  const showError = (msg: string) => {
    setError(msg)
    // 다음 프레임에 에러 박스로 스크롤 (렌더 후)
    requestAnimationFrame(() => {
      document.getElementById('recruit-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // 클라이언트 측 사전 검증 — HTML required가 안 먹히는 버튼 그룹
    if (!form.name.trim()) return showError('이름을 입력해주세요')
    if (!form.team_idea.trim()) return showError('팀 아이디어를 입력해주세요')
    if (!form.team_role) return showError('팀 내 역할을 선택해주세요')
    if (!form.ai_experience.trim()) return showError('AI 활용 경험을 입력해주세요')
    if (!form.learning_goal.trim()) return showError('8주 동안 경험하고 싶은 것을 입력해주세요')
    if (!form.motivation.trim()) return showError('지원 동기를 입력해주세요')
    if (form.available_slots.length === 0) return showError('정기 모임 가능 시간대를 1개 이상 선택해주세요')
    if (!form.weekly_hours) return showError('주당 투입 가능 시간을 선택해주세요')
    if (!form.offline_available) return showError('오프라인 밋업 참여 가능 여부를 선택해주세요')
    if (!form.agreed) return showError('개인정보 수집·이용에 동의해주세요')

    setSubmitting(true)
    try {
      const res = await fetch('/api/recruit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
          <h1 className="text-2xl font-bold mb-3">신청이 완료되었습니다</h1>
          <p className="text-txt-secondary leading-relaxed mb-8">
            지원해주셔서 감사합니다. 4/12 마감 후 결과를 안내드립니다.
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
          5~7명만 모집합니다. 작성에 5분이면 충분합니다.
          <br className="sm:hidden" />
          <span className="hidden sm:inline"> · </span>
          Draft 1기는 경희대 국제캠 기반으로 운영됩니다.
        </div>
      </div>

      {/* Section 1 — Hero (모바일 풀스크린, 데스크탑은 자연 높이) */}
      <section className="relative min-h-svh sm:min-h-0 flex flex-col items-center justify-center max-w-3xl mx-auto px-6 pt-16 pb-12 sm:pt-24 sm:pb-20 text-center overflow-hidden">
        {/* 배경 패턴 — 절제된 점 그리드 */}
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
          DRAFT × FLIP · 1기 모집 중
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
          <span className="text-brand">AI로, 같이.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="text-base md:text-lg text-txt-secondary leading-relaxed mb-10 max-w-xl mx-auto break-keep"
        >
          8주 후, 당신 이름으로 된 프로덕트 하나.
          <br />
          경희대 국제캠에서 5~7명이 함께 만듭니다.
        </motion.p>

        {/* 진행률 바 — 자리 채워짐 시각화 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="max-w-xs mx-auto mb-10"
        >
          <div className="flex items-center justify-between text-xs text-txt-tertiary mb-2">
            <span>모집 현황</span>
            <span className="font-bold text-txt-secondary">
              {SPOTS_FILLED} / {SPOTS_TOTAL} 자리
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface-sunken overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(SPOTS_FILLED / SPOTS_TOTAL) * 100}%` }}
              transition={{ duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="h-full bg-brand rounded-full"
            />
          </div>
          <div className="text-[11px] text-txt-tertiary mt-2">~4/12 자정 마감</div>
        </motion.div>

        <motion.a
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          href="#apply"
          className="group inline-flex items-center gap-2 bg-brand text-white px-8 py-4 rounded-full font-bold text-sm hover:bg-brand-hover transition-all duration-200 active:scale-[0.97] shadow-sm hover:shadow-md"
        >
          1기 신청하기
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </motion.a>

        {/* 스크롤 인디케이터 — 모바일에서 다음 섹션 있음을 암시 */}
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

      {/* Section 2 — 공감 (한 줄씩 staggered fade-up) */}
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
            '만들고 싶은 건 있는데, 코딩을 모르겠고',
            'GPT한테 물어봐도 결국 완성은 못 하고',
            '노션에 아이디어 30개 적혀있는데 시작한 건 0개고',
            '주변 친구들은 다 뭔가 하는 것 같은데',
            '이번 학기도 또 아이디어만 굴리다 끝날 것 같고',
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
          → 그래서, 같이 하려고 합니다.
        </motion.p>
      </section>

      {/* Section 3 — 적합도 */}
      <motion.section {...reveal} className="max-w-2xl mx-auto px-6 py-20 border-t border-border">
        <h2 className="text-2xl sm:text-3xl font-bold mb-10">이런 분이면 딱입니다</h2>
        <ul className="space-y-3 mb-12">
          {[
            '만들고 싶은 아이디어가 하나라도 있는 분',
            '코딩 경험 없어도 AI로 해보고 싶은 분',
            '이번 학기에 눈에 보이는 결과물을 내고 싶은 분',
            '혼자 하면 흐지부지될 것 같은 분',
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
            '그냥 스펙 한 줄 추가하려는 분',
            '8주간 주 3시간 이상 확보가 어려운 분',
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

      {/* Section 4 — 정체성 (3카드 그리드, hover 시 미세 lift) */}
      <motion.section {...reveal} className="max-w-3xl mx-auto px-6 py-20 border-t border-border">
        <h2 className="text-2xl sm:text-3xl font-bold mb-12">Draft 1기는</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { title: '바이브코딩', desc: '코드 몰라도 Claude 같은 AI로 직접 프로덕트를 만듭니다.' },
            { title: '실전 중심', desc: '강의를 듣는 것이 아니라 매주 직접 만들고 공유합니다.' },
            { title: '소규모', desc: '각 MVP팀에서 1명씩, 5~7명이 밀도 있게 갑니다.' },
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

      {/* Section 5 — 타임라인 (좌측 연결선 + 도트) */}
      <motion.section {...reveal} className="max-w-3xl mx-auto px-6 py-20 border-t border-border">
        <h2 className="text-2xl sm:text-3xl font-bold mb-12">타임라인</h2>
        <ol className="relative space-y-8 pl-8 sm:pl-10">
          {/* 세로 연결선 */}
          <div className="absolute left-2 sm:left-3 top-2 bottom-2 w-px bg-border" aria-hidden />
          {[
            { date: '~4/12', title: '신청 마감', desc: '각 팀에서 1명씩', highlight: true },
            { date: '4/13~4/26', title: '사전 온보딩', desc: 'Claude 셋업 가이드 + 첫 프로젝트 템플릿 배포' },
            { date: '4/27', title: '정식 시작 — 8주 프로그램 킥오프', desc: '오프라인, 경희대 국제캠' },
            { date: '5월 말', title: '중간 평가', desc: '오프라인, 경희대 국제캠' },
            { date: '6/23', title: '데모데이', desc: '오프라인, 경희대 국제캠' },
          ].map((item, i) => (
            <motion.li
              key={item.date}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative"
            >
              {/* 도트 */}
              <div
                className={`absolute left-[-26px] sm:left-[-30px] top-1.5 w-3 h-3 rounded-full border-2 ${
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

      {/* Section 6 — FAQ (아코디언) */}
      <motion.section {...reveal} className="max-w-2xl mx-auto px-6 py-20 border-t border-border">
        <h2 className="text-2xl sm:text-3xl font-bold mb-10">자주 묻는 질문</h2>
        <FaqList />
      </motion.section>

      {/* Section 7 — 신청 폼 */}
      <section id="apply" className="border-t border-border bg-surface-sunken/30">
        <div className="max-w-2xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">자리가 많지 않습니다</h2>
            <p className="text-txt-secondary">5~7명 중 3명 이미 신청 · 4/12 자정 마감</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7">
            <Field label="이름" required>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className={inputClass}
                placeholder="예: 이성민"
                aria-label="신청자 이름"
                autoComplete="name"
              />
            </Field>

            <Field label="팀 아이디어 한 줄" required>
              <input
                type="text"
                required
                maxLength={200}
                value={form.team_idea}
                onChange={(e) => update('team_idea', e.target.value)}
                className={inputClass}
                placeholder="예) 대학생 팀빌딩 플랫폼 Draft"
              />
            </Field>

            <Field label="팀 내 역할" required>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { v: 'plan', l: '기획' },
                  { v: 'design', l: '디자인' },
                  { v: 'dev', l: '개발' },
                  { v: 'etc', l: '기타' },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.v}
                    onClick={() => update('team_role', opt.v as FormState['team_role'])}
                    className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                      form.team_role === opt.v
                        ? 'border-brand bg-brand text-white'
                        : 'border-border bg-surface-card text-txt-secondary hover:bg-surface-sunken'
                    }`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </Field>

            <Field
              label="AI 활용 경험"
              required
              hint="잘 모르겠다면 솔직하게 적어주셔도 괜찮습니다."
            >
              <textarea
                required
                rows={3}
                maxLength={1000}
                value={form.ai_experience}
                onChange={(e) => update('ai_experience', e.target.value)}
                className={inputClass}
                placeholder="예) ChatGPT로 글쓰기는 자주 합니다. Claude는 처음 들어봅니다."
              />
            </Field>

            <Field label="8주 동안 경험하고 싶은 것" required>
              <textarea
                required
                rows={3}
                maxLength={1000}
                value={form.learning_goal}
                onChange={(e) => update('learning_goal', e.target.value)}
                className={inputClass}
                placeholder="예) AI로 직접 프론트엔드 화면을 만들어보고 싶습니다."
              />
            </Field>

            <Field label="지원 동기" required>
              <textarea
                required
                rows={4}
                maxLength={2000}
                value={form.motivation}
                onChange={(e) => update('motivation', e.target.value)}
                className={inputClass}
                placeholder="예) 이번 학기에 우리 팀 MVP를 꼭 출시하고 싶은데, 개발이 막혀서…"
              />
            </Field>

            <Field
              label="정기 모임 가능 시간대"
              required
              hint="가능한 시간대를 모두 선택해주세요. (다중 선택)"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const selected = form.available_slots.includes(slot.id)
                  return (
                    <button
                      type="button"
                      key={slot.id}
                      onClick={() => toggleSlot(slot.id)}
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

            <Field label="8주 동안 Draft에 쓸 수 있는 시간" required>
              <div className="space-y-2">
                {[
                  { v: '3-5', l: '주 3~5시간', desc: '모임 참여 + 약간의 개인 작업' },
                  { v: '5-8', l: '주 5~8시간', desc: '적극적으로 만들어보고 싶은 정도', recommended: true },
                  { v: '8+', l: '주 8시간 이상', desc: '이번 학기 최우선 프로젝트로' },
                ].map((opt) => {
                  const selected = form.weekly_hours === opt.v
                  return (
                    <button
                      type="button"
                      key={opt.v}
                      onClick={() => update('weekly_hours', opt.v as FormState['weekly_hours'])}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                        selected
                          ? 'border-brand bg-brand/5'
                          : 'border-border bg-surface-card hover:bg-surface-sunken'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {selected ? (
                            <Check className="w-4 h-4 text-brand" />
                          ) : (
                            <Circle className="w-4 h-4 text-txt-tertiary" />
                          )}
                          <span className="font-bold text-sm text-txt-primary">{opt.l}</span>
                          {opt.recommended && (
                            <span className="text-[10px] font-mono font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                              권장
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-txt-secondary mt-1.5 ml-6">{opt.desc}</div>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-txt-tertiary mt-3 leading-relaxed">
                ※ 8주간 직접 프로덕트를 만드는 프로그램입니다. 주 3시간 이상 확보 가능한 분만 신청해주세요.
              </p>
            </Field>

            <Field
              label="오프라인 밋업 참여"
              required
              hint="킥오프(4/27 주) · 중간 평가(5월 말) · 데모데이(6/23) — 모두 경희대 국제캠"
            >
              <div className="space-y-2">
                {[
                  { v: 'yes', l: '3회 모두 참여 가능합니다' },
                  { v: 'discuss', l: '일정이 안 맞을 수 있습니다 (사전에 협의 필요)' },
                ].map((opt) => {
                  const selected = form.offline_available === opt.v
                  return (
                    <button
                      type="button"
                      key={opt.v}
                      onClick={() => update('offline_available', opt.v as FormState['offline_available'])}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-colors flex items-center gap-2 ${
                        selected
                          ? 'border-brand bg-brand/5'
                          : 'border-border bg-surface-card hover:bg-surface-sunken'
                      }`}
                    >
                      {selected ? (
                        <Check className="w-4 h-4 text-brand" />
                      ) : (
                        <Circle className="w-4 h-4 text-txt-tertiary" />
                      )}
                      <span className="text-sm text-txt-primary">{opt.l}</span>
                    </button>
                  )
                })}
              </div>
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
                  수집 항목: 이름, 지원 내용
                  <br />
                  이용 목적: Draft 1기 선발 및 운영 연락
                  <br />
                  보유 기간: 1기 종료 후 3개월 (2026년 9월까지)
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
              {submitting ? '제출 중...' : '신청 제출하기'}
            </button>

          </form>
        </div>
      </section>
    </div>
  )
}

function FaqList() {
  const items = [
    {
      q: '정말 코딩 0인데 따라갈 수 있습니까?',
      a: '네. AI로 만드는 것이 핵심이며, 사전 온보딩 자료부터 차근차근 진행합니다. "잘 모르겠습니다"가 디폴트라고 생각하셔도 됩니다.',
    },
    {
      q: '주당 시간은 얼마나 듭니까?',
      a: '최소 주 3시간, 권장 주 5~8시간입니다. 8주간 프로덕트 하나 완성이 목표입니다.',
    },
    {
      q: '우리 팀에서 2명 신청해도 됩니까?',
      a: '원칙적으로 각 MVP팀당 1명입니다. 다양한 팀에서 모이는 것이 1기의 핵심이기 때문입니다.',
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
                  <div className="px-5 pb-5 text-sm text-txt-secondary leading-relaxed">
                    {item.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-border bg-surface-card text-txt-primary text-sm placeholder:text-txt-tertiary focus:outline-hidden focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors'

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
