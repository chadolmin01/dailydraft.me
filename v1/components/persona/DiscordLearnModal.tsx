'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Hash, Megaphone, Sparkles } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

interface AvailableChannel {
  id: string
  name: string
  type: number // 0=텍스트, 5=공지, 15=포럼
  parent_id: string | null
}

interface CorpusSource {
  id: string
  source_type: string
  source_ref: string
  active: boolean
}

interface CorpusSourcesResponse {
  sources: CorpusSource[]
  available_channels: AvailableChannel[]
  has_discord: boolean
}

interface ExtractResponse {
  run_id: string
  success_count: number
  total_count: number
  slots: { field_key: string; confidence: number; error: string | null }[]
}

type Phase = 'loading' | 'select' | 'no-discord' | 'running' | 'done' | 'error'

interface Props {
  personaId: string
  isOpen: boolean
  onClose: () => void
}

/**
 * "Discord 대화에서 자동 학습" 액션의 모달.
 *
 * 흐름:
 *   1. loading  — corpus-sources GET으로 사용 가능 채널 + 현재 소스 조회
 *   2. select   — 채널 체크박스 선택 (기본값: 기존 소스)
 *   3. running  — 학습 중 (동기 API 호출이지만 수 초 걸림)
 *   4. done     — 결과 요약 (슬롯 n/13 채워짐)
 *   5. error    — 에러 메시지
 *
 * 저장: 학습 시작 전 PUT으로 corpus_sources 갱신 → POST extract로 실제 학습 트리거.
 */
export function DiscordLearnModal({ personaId, isOpen, onClose }: Props) {
  const qc = useQueryClient()
  const [phase, setPhase] = useState<Phase>('loading')
  const [channels, setChannels] = useState<AvailableChannel[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [result, setResult] = useState<ExtractResponse | null>(null)

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false

    setPhase('loading')
    setErrorMessage(null)
    setResult(null)

    fetch(`/api/personas/${personaId}/corpus-sources`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`소스 조회 실패 (${res.status})`)
        return (await res.json()) as CorpusSourcesResponse
      })
      .then((data) => {
        if (cancelled) return
        if (!data.has_discord) {
          setPhase('no-discord')
          return
        }
        setChannels(data.available_channels)
        const existing = new Set(
          data.sources
            .filter((s) => s.source_type === 'discord_channel')
            .map((s) => s.source_ref),
        )
        setSelectedIds(existing)
        setPhase('select')
      })
      .catch((err: Error) => {
        if (cancelled) return
        setErrorMessage(err.message)
        setPhase('error')
      })

    return () => {
      cancelled = true
    }
  }, [isOpen, personaId])

  const grouped = useMemo(() => groupChannelsByCategory(channels), [channels])

  const toggleChannel = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const startLearning = async () => {
    if (selectedIds.size === 0) {
      toast.error('최소 한 채널을 선택하십시오')
      return
    }
    setPhase('running')
    try {
      // 1) corpus_sources 업데이트 (replace)
      const putRes = await fetch(`/api/personas/${personaId}/corpus-sources`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discord_channel_ids: Array.from(selectedIds),
        }),
      })
      if (!putRes.ok) {
        const body = await putRes.json().catch(() => ({}))
        throw new Error(body.error?.message ?? '소스 저장 실패')
      }

      // 2) 자동 추출 트리거
      const res = await fetch(`/api/personas/${personaId}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'manual' }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error?.message ?? '학습 실패')
      }
      const data = (await res.json()) as ExtractResponse
      setResult(data)
      setPhase('done')
      qc.invalidateQueries({ queryKey: ['persona'] })
      toast.success(`${data.success_count}/${data.total_count}개 슬롯 채워짐`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류'
      setErrorMessage(msg)
      setPhase('error')
      toast.error(msg)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="Discord 대화에서 자동 학습"
    >
      <div className="p-5 max-h-[70vh] overflow-y-auto">
        {phase === 'loading' && (
          <div className="py-12 text-center text-sm text-txt-tertiary">
            채널 목록을 불러오는 중...
          </div>
        )}

        {phase === 'no-discord' && (
          <div className="py-8 text-center">
            <p className="text-sm text-txt-primary font-semibold mb-2">
              Discord 서버가 아직 연결되어 있지 않습니다
            </p>
            <p className="text-xs text-txt-tertiary leading-relaxed">
              자동 학습은 동아리 Discord 서버의 메시지를 corpus로 사용합니다.
              <br />
              동아리 설정에서 Discord 연결을 먼저 완료하십시오.
            </p>
          </div>
        )}

        {phase === 'select' && (
          <>
            <p className="text-xs text-txt-secondary leading-relaxed mb-4">
              학습에 사용할 채널을 선택하십시오. 공지·일반 채널을 넣으면 동아리의 공식 목소리를
              잘 학습합니다. 선택된 채널의 최근 메시지를 분석해 13개 슬롯을 자동으로 채웁니다.
            </p>

            <div className="space-y-4">
              {grouped.map((group) => (
                <div key={group.key}>
                  {group.label && (
                    <p className="text-[10px] font-semibold text-txt-tertiary uppercase tracking-wider mb-1.5">
                      {group.label}
                    </p>
                  )}
                  <div className="space-y-1">
                    {group.channels.map((ch) => (
                      <ChannelCheckbox
                        key={ch.id}
                        channel={ch}
                        checked={selectedIds.has(ch.id)}
                        onToggle={() => toggleChannel(ch.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <p className="text-xs text-txt-tertiary">
                {selectedIds.size}개 선택됨
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="h-9 px-4 rounded-lg text-sm font-semibold text-txt-secondary hover:bg-surface-bg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={startLearning}
                  disabled={selectedIds.size === 0}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-60"
                >
                  <Sparkles size={14} />
                  학습 시작
                </button>
              </div>
            </div>
          </>
        )}

        {phase === 'running' && (
          <div className="py-16 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-txt-primary mb-2">
              <Sparkles size={16} className="animate-pulse" />
              학습 중입니다
            </div>
            <p className="text-xs text-txt-tertiary">
              채널 메시지 수집 → 정제 → 13개 슬롯 추출
              <br />
              보통 20~60초 소요됩니다
            </p>
          </div>
        )}

        {phase === 'done' && result && (
          <div>
            <div className="text-center mb-5">
              <p className="text-base font-bold text-txt-primary mb-1">
                학습이 완료되었습니다
              </p>
              <p className="text-xs text-txt-tertiary">
                {result.success_count}/{result.total_count}개 슬롯이 자동으로 채워졌습니다
              </p>
            </div>

            <div className="bg-surface-bg rounded-xl p-4 space-y-1.5">
              {result.slots.map((s) => (
                <div
                  key={s.field_key}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-txt-primary">{s.field_key}</span>
                  {s.error ? (
                    <span className="text-txt-tertiary">실패</span>
                  ) : s.confidence > 0 ? (
                    <span className="text-txt-secondary">
                      정확도 {Math.round(s.confidence * 100)}%
                    </span>
                  ) : (
                    <span className="text-txt-tertiary">건너뜀</span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-5 pt-4 border-t border-border">
              <button
                onClick={onClose}
                className="h-9 px-4 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors"
              >
                슬롯 확인하러 가기
              </button>
            </div>
          </div>
        )}

        {phase === 'error' && (
          <div className="py-8">
            <p className="text-sm text-txt-primary font-semibold mb-2">
              학습에 실패했습니다
            </p>
            <p className="text-xs text-txt-tertiary leading-relaxed mb-5">
              {errorMessage ?? '알 수 없는 오류가 발생했습니다.'}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setPhase('select')}
                className="h-9 px-4 rounded-lg border border-border text-sm font-semibold text-txt-primary hover:bg-surface-bg transition-colors"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

function ChannelCheckbox({
  channel,
  checked,
  onToggle,
}: {
  channel: AvailableChannel
  checked: boolean
  onToggle: () => void
}) {
  const Icon = channel.type === 5 ? Megaphone : Hash
  return (
    <label
      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
        checked ? 'bg-brand-bg' : 'hover:bg-surface-bg'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="w-4 h-4 accent-brand"
      />
      <Icon size={14} className="text-txt-tertiary shrink-0" />
      <span className="text-sm text-txt-primary">{channel.name}</span>
    </label>
  )
}

/**
 * 같은 parent_id(카테고리)를 가진 채널을 묶음.
 * parent_id는 실제 카테고리 id이지 이름이 아니어서 "카테고리 1" 같은 임시 라벨만 사용.
 * UI 개선은 R3에서 category 채널 이름까지 fetch.
 */
function groupChannelsByCategory(channels: AvailableChannel[]): Array<{
  key: string
  label: string | null
  channels: AvailableChannel[]
}> {
  const groups = new Map<string, AvailableChannel[]>()
  for (const ch of channels) {
    const key = ch.parent_id ?? '__root__'
    const arr = groups.get(key) ?? []
    arr.push(ch)
    groups.set(key, arr)
  }
  return Array.from(groups.entries()).map(([key, chs], idx) => ({
    key,
    label: key === '__root__' ? null : `그룹 ${idx + 1}`,
    channels: chs.sort((a, b) => a.name.localeCompare(b.name)),
  }))
}
