'use client'

import React, { useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { ArrowRight, ArrowLeft, Sparkles, Loader2, CheckCircle2 } from 'lucide-react'
import type {
  ProfileDraft, StructuredResponse,
  ScenarioCardQuestion, ThisOrThatQuestion, DragRankQuestion,
  EmojiGridQuestion, QuickNumberQuestion, SpectrumPickQuestion,
  ThisOrThatOption, EmojiGridOption,
} from '@/src/lib/onboarding/types'
import {
  INTERVIEW_SCRIPT,
  INTERVIEW_SECTIONS,
  isFirstInSection,
} from '@/src/lib/onboarding/interview-script'
import { INTERACTIVE_QUESTIONS } from '@/src/lib/onboarding/interactive-questions'
import { ScenarioCard } from '../interactive/ScenarioCard'
import { ThisOrThat } from '../interactive/ThisOrThat'
import { QuickNumber } from '../interactive/QuickNumber'
import { EmojiGrid } from '../interactive/EmojiGrid'
import { SpectrumPick } from '../interactive/SpectrumPick'
import { DragRank } from '../interactive/DragRank'

type Phase = 'intro' | 'showing' | 'answered' | 'saving' | 'completing'
type SlideDir = 'forward' | 'back'

interface Props {
  profile: ProfileDraft
  introMessage?: string
  onAnswer: (response: StructuredResponse) => void
  onComplete: (responses: StructuredResponse[]) => void
  onSkip?: () => void
}

// Visual + label per question
const SPECTRUM_HINT = '1부터 5 사이에서 골라주세요'
const QUESTION_VISUALS: Record<string, { emoji: string; illustration: string | null; hint: string; label: string }> = {
  spectrum_teamrole:      { emoji: '👥', illustration: '/onboarding/leader_follower.svg', hint: SPECTRUM_HINT, label: '팀 역할' },
  spectrum_communication: { emoji: '💬', illustration: '/onboarding/2.svg',              hint: SPECTRUM_HINT, label: '소통 스타일' },
  spectrum_risk:          { emoji: '⚡', illustration: '/onboarding/3.svg',              hint: SPECTRUM_HINT, label: '도전 성향' },
  spectrum_planning:      { emoji: '🗂️', illustration: '/onboarding/5.svg',             hint: SPECTRUM_HINT, label: '작업 방식' },
  spectrum_quality:       { emoji: '💎', illustration: '/onboarding/Deadline.svg',         hint: SPECTRUM_HINT, label: '완성도 vs 속도' },
  quick_number_hours:     { emoji: '⏱️', illustration: '/onboarding/4.svg',              hint: '',            label: '투자 시간' },
  emoji_grid_strengths:   { emoji: '✨', illustration: '/onboarding/6.svg',              hint: '최대 3개 선택해주세요', label: '나의 강점' },
}

export function ScriptedInterviewStep({ profile, introMessage, onAnswer, onComplete, onSkip }: Props) {
  const [qIndex, setQIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>(introMessage ? 'intro' : 'showing')
  const [responses, setResponses] = useState<StructuredResponse[]>([])
  const [slideKey, setSlideKey] = useState(0)
  const [slideDir, setSlideDir] = useState<SlideDir>('forward')
  const [selectionValue, setSelectionValue] = useState<unknown>(null)
  const [selectionReady, setSelectionReady] = useState(false)
  const responsesRef = useRef(responses)
  responsesRef.current = responses

  const total = INTERVIEW_SCRIPT.length
  const question = INTERVIEW_SCRIPT[qIndex]
  const questionDef = question ? INTERACTIVE_QUESTIONS[question.interactiveId] : null
  const prevAnswers = Object.fromEntries(responses.map(r => [r.questionId, r.value]))
  const visual = question ? (QUESTION_VISUALS[question.interactiveId] ?? { emoji: '💡', hint: '' }) : null

  const goToSlide = useCallback((nextIndex: number, dir: SlideDir) => {
    setSlideDir(dir)
    setQIndex(nextIndex)
    setSlideKey(k => k + 1)
    setSelectionValue(null)
    setSelectionReady(false)
    setPhase('showing')
  }, [])

  const handleAnswer = useCallback((response: StructuredResponse) => {
    const updated = [...responsesRef.current, response]
    setResponses(updated)
    onAnswer(response)
    setPhase('answered')

    if (qIndex + 1 >= total) {
      setTimeout(() => {
        setPhase('saving')
        // saving spinner (2s) → completing checkmark, then notify parent
        setTimeout(() => {
          setPhase('completing')
          onComplete(updated)
        }, 2000)
      }, 400)
    } else {
      setTimeout(() => goToSlide(qIndex + 1, 'forward'), 350)
    }
  }, [onAnswer, onComplete, qIndex, total, goToSlide])

  const handleBack = useCallback(() => {
    if (qIndex === 0) {
      setPhase('intro')
      return
    }
    setResponses(prev => prev.slice(0, -1))
    goToSlide(qIndex - 1, 'back')
  }, [qIndex, goToSlide])

  const buildResponse = useCallback((questionId: string, value: unknown, naturalLanguage: string): StructuredResponse => ({
    questionId,
    type: INTERACTIVE_QUESTIONS[questionId].type,
    value,
    naturalLanguage,
    measuredFields: INTERACTIVE_QUESTIONS[questionId].measuredFields,
  }), [])

  const handleConfirm = useCallback(() => {
    if (!selectionReady || !question || !questionDef) return
    const qId = question.interactiveId
    let response: StructuredResponse

    switch (questionDef.type) {
      case 'this-or-that': {
        const opt = selectionValue as ThisOrThatOption
        response = buildResponse(qId, opt.id, `${opt.emoji} ${opt.label}`)
        break
      }
      case 'spectrum-pick': {
        const value = selectionValue as number
        const q = questionDef as SpectrumPickQuestion
        const labels = [q.leftLabel, '', '중간', '', q.rightLabel]
        response = buildResponse(qId, value, labels[value - 1] || `${value}점`)
        break
      }
      case 'emoji-grid': {
        const opts = selectionValue as EmojiGridOption[]
        response = buildResponse(qId, opts.map(s => s.id), opts.map(s => `${s.emoji} ${s.label}`).join(', '))
        break
      }
      case 'quick-number': {
        const { hours, subAnswer } = selectionValue as { hours: number; subAnswer: boolean | null }
        const q = questionDef as QuickNumberQuestion
        let nl = `주 ${hours}시간`
        if (q.subQuestion && subAnswer !== null) {
          nl += subAnswer ? `, ${q.subQuestion.yesLabel}` : `, ${q.subQuestion.noLabel}`
        }
        response = buildResponse(qId, { hours, semesterAvailable: subAnswer }, nl)
        break
      }
      case 'scenario-card': {
        const opt = selectionValue as { id: string; label: string }
        response = buildResponse(qId, opt.id, opt.label)
        break
      }
      case 'drag-rank': {
        const ordered = selectionValue as { id: string; label: string }[]
        response = buildResponse(qId, ordered.map(i => i.id), ordered.map((i, idx) => `${idx + 1}. ${i.label}`).join(', '))
        break
      }
      default:
        return
    }
    handleAnswer(response)
  }, [selectionReady, selectionValue, question, questionDef, buildResponse, handleAnswer])

  const renderInteractive = () => {
    if (!questionDef || !question) return null

    switch (questionDef.type) {
      case 'spectrum-pick': {
        const q = questionDef as SpectrumPickQuestion
        return (
          <SpectrumPick
            {...q}
            onChange={(val, ready) => { setSelectionValue(val); setSelectionReady(ready) }}
          />
        )
      }
      case 'this-or-that': {
        const q = questionDef as ThisOrThatQuestion
        return (
          <ThisOrThat
            optionA={q.optionA}
            optionB={q.optionB}
            onChange={(opt, ready) => { setSelectionValue(opt); setSelectionReady(ready) }}
          />
        )
      }
      case 'quick-number': {
        const q = questionDef as QuickNumberQuestion
        return (
          <QuickNumber
            presets={q.presets}
            unit={q.unit}
            subQuestion={q.subQuestion}
            onChange={(hours, subAnswer, ready) => { setSelectionValue({ hours, subAnswer }); setSelectionReady(ready) }}
          />
        )
      }
      case 'emoji-grid': {
        const q = questionDef as EmojiGridQuestion
        return (
          <EmojiGrid
            options={q.options}
            minSelect={q.minSelect}
            maxSelect={q.maxSelect}
            onChange={(opts, ready) => { setSelectionValue(opts); setSelectionReady(ready) }}
          />
        )
      }
      case 'scenario-card': {
        const q = questionDef as ScenarioCardQuestion
        return (
          <ScenarioCard
            options={q.options}
            onChange={(opt, ready) => { setSelectionValue(opt); setSelectionReady(ready) }}
          />
        )
      }
      case 'drag-rank': {
        const q = questionDef as DragRankQuestion
        const dragQId = question.interactiveId
        return (
          <DragRank
            items={q.items}
            onConfirm={(ordered) =>
              handleAnswer(buildResponse(dragQId, ordered.map(i => i.id), ordered.map((i, idx) => `${idx + 1}. ${i.label}`).join(', ')))
            }
          />
        )
      }
      default:
        return null
    }
  }

  // -- Saving screen (spinner) --
  if (phase === 'saving') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
        <div className="flex flex-col items-center animate-in fade-in duration-300">
          <Loader2 size={36} className="text-brand animate-spin mb-6" />
          <h2 className="text-lg font-bold text-txt-primary mb-1">
            매칭 프로필을 만들고 있습니다
          </h2>
          <p className="text-sm text-txt-tertiary">잠시만 기다려 주세요. 20초 이내에 완료됩니다.</p>
        </div>
      </div>
    )
  }

  // -- Completing screen (checkmark) --
  if (phase === 'completing') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
        <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
          <div
            className="w-16 h-16 rounded-full bg-brand flex items-center justify-center mb-6"
            style={{ animation: 'ob-bubble-in 0.5s cubic-bezier(0.34, 1.4, 0.64, 1) both' }}
          >
            <CheckCircle2 size={32} className="text-white" />
          </div>
          <h2 className="text-lg font-bold text-txt-primary mb-1">
            완료되었습니다
          </h2>
          <p className="text-sm text-txt-secondary">
            이제 매칭 정확도가 올라간 상태로 팀원을 추천해 드립니다
          </p>
        </div>
      </div>
    )
  }

  // -- Intro screen --
  if (phase === 'intro') {
    return (
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="max-w-lg mx-auto w-full px-6 flex flex-col flex-1 justify-center py-10">

          {/* Visual */}
          <div className="flex justify-center mb-10">
            <Image src="/onboarding/almost.svg" alt="거의 다 왔어요" width={260} height={260} className="w-full max-w-[260px] h-auto object-contain ob-avatar ob-img-fade loaded" />
          </div>

          {/* Value proposition */}
          <h2 className="text-2xl sm:text-[28px] font-black text-txt-primary leading-tight mb-3 ob-bubble">
            {onSkip ? '거의 다 왔습니다' : '매칭 정확도를 높여 보시겠어요?'}
          </h2>
          <p className="text-[15px] text-txt-secondary leading-relaxed mb-4 ob-bubble" style={{ animationDelay: '100ms' }}>
            작업 스타일을 알려 주시면<br />
            <span className="font-bold text-txt-primary">나와 잘 맞는 팀원</span>을 추천해 드릴 수 있습니다
          </p>

          {/* Benefits */}
          <div className="space-y-2 mb-10 ob-bubble" style={{ animationDelay: '180ms' }}>
            {[
              { emoji: '🎯', text: '성향이 맞는 팀원 매칭' },
              { emoji: '⚡', text: '선택지만 고르면 끝 — 약 1분' },
            ].map(({ emoji, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-[13px] text-txt-secondary">
                <span className="text-base">{emoji}</span>
                {text}
              </div>
            ))}
          </div>

          {/* Start button */}
          <div className="ob-chip" style={{ animationDelay: '300ms' }}>
            <button
              onClick={() => goToSlide(0, 'forward')}
              className="w-full flex items-center justify-center gap-2 py-4 bg-brand text-white rounded-full text-[15px] font-black hover:opacity-90 active:scale-[0.97] transition-all"
            >
              매칭 정확도 높이기
              <Sparkles size={16} />
            </button>
            {onSkip && (
              <button
                onClick={onSkip}
                className="w-full text-center text-[13px] text-txt-tertiary hover:text-txt-secondary transition-colors mt-4 py-1"
              >
                나중에 할게요
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const message = question ? question.getMessage(profile, prevAnswers) : ''
  const isDragRank = questionDef?.type === 'drag-rank'

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* Progress bar */}
      <div className="px-6 sm:px-10 pt-8 pb-4 shrink-0">
        <div className="max-w-2xl mx-auto space-y-3">

          {/* Top row: back button + section label + counter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handleBack}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-txt-secondary hover:text-txt-primary hover:bg-surface-sunken transition-colors shrink-0"
                aria-label="이전 질문으로"
              >
                <ArrowLeft size={15} />
              </button>
              {question && (
                <span
                  key={`section-${question.section}`}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-txt-secondary bg-surface-sunken px-2 py-0.5 rounded-full animate-in fade-in slide-in-from-left-2 duration-300"
                  aria-label={`현재 섹션 ${INTERVIEW_SECTIONS[question.section].title}`}
                >
                  <span aria-hidden="true">{INTERVIEW_SECTIONS[question.section].emoji}</span>
                  {INTERVIEW_SECTIONS[question.section].title}
                </span>
              )}
            </div>
            <span className="text-[12px] font-mono text-txt-secondary tabular-nums">
              {qIndex + 1} <span className="text-txt-tertiary">/ {total}</span>
            </span>
          </div>

          {/* Segmented bar — 섹션 경계에 작은 gap 으로 그룹핑 표시 */}
          <div className="flex gap-1.5 items-center">
            {INTERVIEW_SCRIPT.map((q, i) => {
              const isDone = i < qIndex || (i === qIndex && phase === 'answered')
              const isCurrent = i === qIndex && phase !== 'answered'
              // 섹션 첫 번째 질문 앞에 시각적 여백 (i>0)
              const leadSection = i > 0 && isFirstInSection(i)
              return (
                <React.Fragment key={i}>
                  {leadSection && (
                    <span
                      className="w-1 h-[5px] rounded-full bg-border-subtle shrink-0"
                      aria-hidden="true"
                      title={`섹션 전환: ${INTERVIEW_SECTIONS[q.section].title}`}
                    />
                  )}
                  <div className="flex-1 h-[5px] rounded-full overflow-hidden bg-surface-sunken">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${
                        isDone ? 'bg-surface-inverse w-full'
                        : isCurrent ? 'bg-brand'
                        : 'w-0'
                      }`}
                      style={isCurrent ? {
                        width: '100%',
                        animation: 'segment-fill 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
                      } : undefined}
                    />
                  </div>
                </React.Fragment>
              )
            })}
          </div>

        </div>
      </div>

      {/* Content area */}
      <div
        key={slideKey}
        className={`flex-1 flex flex-col min-h-0 animate-in fade-in duration-300 ${
          slideDir === 'back' ? 'slide-in-from-left-8' : 'slide-in-from-right-8'
        }`}
      >
        {/* Top section — question + illustration */}
        <div className="shrink flex flex-col min-h-0 overflow-hidden">
          <div className="max-w-2xl mx-auto w-full px-6 pt-4 flex flex-col min-h-0">

            {/* Question */}
            <h2 className="text-2xl sm:text-[28px] font-black text-txt-primary leading-snug shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {message}
            </h2>

            {/* Hint */}
            {visual?.hint && (
              <p className="text-[12px] font-medium text-txt-secondary mt-2 shrink-0 animate-in fade-in duration-300" style={{ animationDelay: '50ms' }}>
                {visual.hint}
              </p>
            )}

            {/* Illustration */}
            <div
              className="flex items-center justify-center min-h-0 animate-in fade-in slide-in-from-bottom-3 duration-300 mt-10 md:mt-16 mb-10 md:mb-14"
              style={{ animationDelay: '30ms' }}
            >
              {visual?.illustration ? (
                <Image
                  src={visual.illustration}
                  alt={visual.label}
                  width={360}
                  height={360}
                  className="w-full h-auto object-contain max-h-[200px] sm:max-h-[280px] md:max-h-[360px] ob-img-fade loaded"
                  onError={(e) => {
                    const target = e.currentTarget
                    target.style.display = 'none'
                    target.nextElementSibling?.classList.remove('hidden')
                  }}
                />
              ) : null}
              <span className={`text-7xl ${visual?.illustration ? 'hidden' : ''}`}>{visual?.emoji}</span>
            </div>
          </div>
        </div>

        {/* Bottom section — choices */}
        <div className="shrink-0 overflow-y-auto max-h-[45vh]">
          <div className="max-w-2xl mx-auto w-full px-6 pb-2">
            <div
              className="animate-in fade-in slide-in-from-bottom-4 duration-300"
              style={{
                animationDelay: '60ms',
                pointerEvents: phase === 'answered' ? 'none' : 'auto',
              }}
            >
              {renderInteractive()}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom button - fixed (hide for drag-rank which has its own confirm) */}
      {!isDragRank && (
        <div className="px-6 pb-8 pt-2 shrink-0">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleConfirm}
              disabled={!selectionReady || phase === 'answered'}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-full text-[14px] font-black transition-all duration-200 active:scale-[0.97] ${
                selectionReady && phase !== 'answered'
                  ? 'bg-surface-inverse text-white hover:opacity-90'
                  : 'bg-surface-sunken text-txt-disabled cursor-not-allowed'
              }`}
            >
              다음으로
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
