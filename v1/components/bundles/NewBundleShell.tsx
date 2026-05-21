'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useClub } from '@/src/hooks/useClub'
import { usePersonaByOwner } from '@/src/hooks/usePersona'
import {
  useApproveAndScheduleBundle,
  useApproveBundle,
} from '@/src/hooks/useBundles'
import type { EventType } from '@/src/lib/personas/types'
import {
  EVENTS,
  getDefaultMeta,
  toTypedMeta,
  type Step,
} from './new-bundle/_types'
import {
  StepIndicator,
  PickEventStep,
  FillMetaStep,
  GeneratingStep,
  ScheduleStep,
  ErrorStep,
} from './new-bundle/_steps'

// 번들(=콘텐츠 덱) 신규 생성 위저드의 메인 라우터.
// step 컴포넌트와 타입은 ./new-bundle/_steps, ./new-bundle/_types 로 분리됨.

export function NewBundleShell({ slug }: { slug: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const scheduleMode = searchParams.get('schedule') === '1'

  const { data: club } = useClub(slug)
  const { data: personaData } = usePersonaByOwner('club', club?.id)
  const persona = personaData?.persona
  const isAdmin = club?.my_role === 'owner' || club?.my_role === 'admin'

  const [step, setStep] = useState<Step>('pick-event')
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null)
  const [meta, setMeta] = useState<Record<string, string>>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [createdBundleId, setCreatedBundleId] = useState<string | null>(null)

  const approveAndSchedule = useApproveAndScheduleBundle(
    createdBundleId ?? undefined,
  )
  const approveNow = useApproveBundle(createdBundleId ?? undefined)

  const selectedDef = selectedEvent
    ? EVENTS.find((e) => e.key === selectedEvent) ?? null
    : null

  const handleGenerate = async () => {
    if (!persona || !selectedEvent) return
    setStep('generating')
    setErrorMessage(null)
    try {
      const res = await fetch(`/api/personas/${persona.id}/bundles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: selectedEvent,
          event_metadata: toTypedMeta(selectedEvent, meta),
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body?.error?.message ?? '번들 생성 실패')
      }
      const bundleId = body?.bundle?.id
      if (!bundleId) throw new Error('번들 ID를 받지 못했습니다')

      if (scheduleMode) {
        // 예약 모드: 덱 생성 후 바로 "언제 올릴지" 단계로 전환
        setCreatedBundleId(bundleId)
        toast.success('AI 가 글을 준비했습니다', {
          description: '발행 시간만 정해 주시면 예약되고, 그 시점에 자동으로 올라갑니다.',
        })
        setStep('schedule')
      } else {
        toast.success('AI 가 글을 모두 준비했습니다', {
          description: '각 채널별 초안을 확인하신 뒤 승인하시면 발행됩니다. 수정도 가능합니다.',
        })
        router.push(`/clubs/${slug}/bundles/${bundleId}`)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류'
      setErrorMessage(msg)
      setStep('error')
    }
  }

  const handleConfirmSchedule = (scheduledIso: string) => {
    if (!createdBundleId) return
    approveAndSchedule.mutate(
      { scheduled_at: scheduledIso },
      {
        onSuccess: () => {
          router.push(`/clubs/${slug}/contents?tab=calendar`)
        },
      },
    )
  }

  const handlePublishNow = () => {
    if (!createdBundleId) return
    approveNow.mutate(undefined, {
      onSuccess: () => {
        router.push(`/clubs/${slug}/bundles/${createdBundleId}`)
      },
    })
  }

  const handleSaveDraft = () => {
    if (!createdBundleId) return
    // 덱은 이미 pending_approval 상태로 DB 에 있음 — 상세로 이동만
    toast.success('내 덱 모음에 저장했습니다', {
      description: '나중에 승인해서 발행하시거나, 일부만 수정해 재사용하실 수 있습니다.',
    })
    router.push(`/clubs/${slug}/contents?tab=decks`)
  }

  // 페르소나가 없으면 먼저 만들라고 안내
  if (club && personaData && !persona) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <p className="text-base font-bold text-txt-primary mb-2">
          먼저 페르소나를 만들어주세요
        </p>
        <p className="text-sm text-txt-secondary mb-6 leading-relaxed">
          AI가 글을 쓰려면 {club.name}의 "말투"를 먼저 알아야 합니다.
          <br />
          페르소나 설정에서 3분만 투자하시면 됩니다.
        </p>
        <Link
          href={`/clubs/${slug}/settings/persona`}
          className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors"
        >
          <Sparkles size={14} />
          페르소나 먼저 만들기
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link
          href={`/clubs/${slug}/settings/persona`}
          className="text-txt-tertiary hover:text-txt-primary transition-colors"
          aria-label="뒤로"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-txt-primary">
            {scheduleMode ? '자동 발행 예약 만들기' : 'AI에게 어떤 글을 부탁할까요?'}
          </h1>
          <p className="text-xs text-txt-tertiary leading-relaxed">
            {scheduleMode
              ? `${club?.name ?? '우리 동아리'} 페르소나로 글을 준비한 뒤, 원하는 시간에 자동으로 올려드립니다.`
              : `${club?.name ?? '우리 동아리'} 페르소나를 기반으로 인스타·LinkedIn·에타·이메일·Discord용 글을 한 번에 준비합니다.`}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <StepIndicator step={step} scheduleMode={scheduleMode} />

      {/* Step content */}
      {step === 'pick-event' && (
        <PickEventStep
          onPick={(ev) => {
            setSelectedEvent(ev)
            setMeta(getDefaultMeta(ev))
            setStep('fill-meta')
          }}
        />
      )}

      {step === 'fill-meta' && selectedDef && (
        <FillMetaStep
          def={selectedDef}
          meta={meta}
          onChange={setMeta}
          onBack={() => setStep('pick-event')}
          onSubmit={handleGenerate}
          canSubmit={isAdmin && !!persona}
        />
      )}

      {step === 'generating' && selectedDef && <GeneratingStep def={selectedDef} />}

      {step === 'schedule' && selectedDef && createdBundleId && (
        <ScheduleStep
          def={selectedDef}
          bundleId={createdBundleId}
          slug={slug}
          isScheduling={approveAndSchedule.isPending}
          isPublishingNow={approveNow.isPending}
          onSchedule={handleConfirmSchedule}
          onPublishNow={handlePublishNow}
          onSaveDraft={handleSaveDraft}
        />
      )}

      {step === 'error' && (
        <ErrorStep
          message={errorMessage ?? '알 수 없는 오류'}
          onRetry={() => setStep(selectedEvent ? 'fill-meta' : 'pick-event')}
        />
      )}
    </>
  )
}
