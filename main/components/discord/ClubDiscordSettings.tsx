'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useClub } from '@/src/hooks/useClub'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { DiscordConnectionWizard } from './DiscordConnectionWizard'

interface GhostwriterSettings {
  club_id: string
  checkin_day: number
  generate_day: number
  ai_tone: 'formal' | 'casual' | 'english'
  min_messages: number
  timeout_hours: number
  custom_prompt_hint: string | null
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

const TONE_OPTIONS = [
  { value: 'formal' as const, label: '합쇼체', desc: '"이번 주 활동을 정리했습니다"' },
  { value: 'casual' as const, label: '해요체', desc: '"이번 주 이렇게 활동했어요!"' },
  { value: 'english' as const, label: 'English', desc: '"Here\'s your weekly summary"' },
]

export function ClubDiscordSettings({ clubSlug }: { clubSlug: string }) {
  const { data: club, isLoading: clubLoading } = useClub(clubSlug)
  const queryClient = useQueryClient()

  const [tone, setTone] = useState<'formal' | 'casual' | 'english'>('formal')
  const [checkinDay, setCheckinDay] = useState(1)
  const [generateDay, setGenerateDay] = useState(0)
  const [minMessages, setMinMessages] = useState(5)
  const [timeoutHours, setTimeoutHours] = useState(24)
  const [customPrompt, setCustomPrompt] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)

  const { data: settings, isLoading: settingsLoading } = useQuery<GhostwriterSettings>({
    queryKey: ['ghostwriter-settings', club?.id],
    enabled: !!club?.id,
    queryFn: async () => {
      const res = await fetch(`/api/clubs/${club!.id}/ghostwriter-settings`)
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
  })

  // 봇 설치 확인
  const { data: channelData } = useQuery<{ guild: { id: string; name: string } | null }>({
    queryKey: ['discord-channels', club?.id],
    enabled: !!club?.id,
    queryFn: async () => {
      const res = await fetch(`/api/clubs/${club!.id}/discord-channels`)
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
  })

  useEffect(() => {
    if (settings) {
      setTone(settings.ai_tone || 'formal')
      setCheckinDay(settings.checkin_day ?? 1)
      setGenerateDay(settings.generate_day ?? 0)
      setMinMessages(settings.min_messages ?? 5)
      setTimeoutHours(settings.timeout_hours ?? 24)
      setCustomPrompt(settings.custom_prompt_hint ?? '')
      setHasChanges(false)
    }
  }, [settings])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/clubs/${club!.id}/ghostwriter-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ai_tone: tone,
          checkin_day: checkinDay,
          generate_day: generateDay,
          min_messages: minMessages,
          timeout_hours: timeoutHours,
          custom_prompt_hint: customPrompt || null,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ghostwriter-settings', club?.id] })
      setHasChanges(false)
      toast.success('설정이 저장되었습니다')
    },
    onError: () => {
      toast.error('설정 저장에 실패했습니다')
    },
  })

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/discord/connect', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ club_id: club!.id }),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discord-channels', club?.id] })
      queryClient.invalidateQueries({ queryKey: ['ghostwriter-settings', club?.id] })
      setShowDisconnectConfirm(false)
      toast.success('Discord 연결이 해제되었습니다')
    },
    onError: () => {
      toast.error('Discord 연결 해제에 실패했습니다')
    },
  })

  const markChanged = () => setHasChanges(true)

  if (clubLoading || settingsLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-5 bg-surface-sunken rounded w-32" />
        <div className="h-32 bg-surface-sunken rounded-xl" />
        <div className="h-32 bg-surface-sunken rounded-xl" />
      </div>
    )
  }

  if (!club) return null

  const isConnected = !!channelData?.guild

  return (
    <div className="space-y-6">
      {/* 연결 상태 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#5865F2' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-txt-primary">Discord 연동</h3>
            {isConnected ? (
              <p className="text-xs text-txt-tertiary">{channelData.guild!.name} 서버 연결됨</p>
            ) : (
              <p className="text-xs text-txt-tertiary">아직 연결되지 않았습니다</p>
            )}
          </div>
        </div>
        {isConnected ? (
          <span className="px-2.5 py-1 rounded-full bg-status-success-bg text-status-success-text text-[11px] font-semibold border border-status-success-text/20">
            연결됨
          </span>
        ) : null}
      </div>

      {!isConnected && (
        <DiscordConnectionWizard clubId={club.id} clubSlug={clubSlug} />
      )}

      {isConnected && (
        <>
          {/* AI 톤 */}
          <div>
            <h4 className="text-xs font-semibold text-txt-secondary mb-2">AI 말투</h4>
            <div className="grid grid-cols-3 gap-2">
              {TONE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setTone(opt.value); markChanged() }}
                  className={`px-3 py-2.5 rounded-xl border text-left transition-all ${
                    tone === opt.value
                      ? 'border-brand bg-brand-bg'
                      : 'border-border hover:border-txt-tertiary'
                  }`}
                >
                  <div className="text-sm font-semibold text-txt-primary">{opt.label}</div>
                  <div className="text-[10px] text-txt-tertiary mt-0.5 truncate">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 스케줄 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-txt-secondary mb-2">체크인 요일</h4>
              <div className="flex gap-1">
                {DAY_NAMES.map((day, i) => (
                  <button
                    key={`c-${i}`}
                    type="button"
                    onClick={() => { setCheckinDay(i); markChanged() }}
                    className={`w-8 h-8 rounded-full text-xs font-semibold transition-all ${
                      checkinDay === i ? 'bg-brand text-white' : 'bg-surface-sunken text-txt-secondary hover:bg-border'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-txt-secondary mb-2">초안 생성 요일</h4>
              <div className="flex gap-1">
                {DAY_NAMES.map((day, i) => (
                  <button
                    key={`g-${i}`}
                    type="button"
                    onClick={() => { setGenerateDay(i); markChanged() }}
                    className={`w-8 h-8 rounded-full text-xs font-semibold transition-all ${
                      generateDay === i ? 'bg-brand text-white' : 'bg-surface-sunken text-txt-secondary hover:bg-border'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 고급 설정 */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-txt-secondary">고급 설정</h4>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-txt-primary">최소 메시지 수</span>
                <p className="text-[10px] text-txt-disabled">이보다 적으면 초안을 생성하지 않습니다</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setMinMessages(m => Math.max(1, m - 1)); markChanged() }}
                  className="w-7 h-7 rounded-lg border border-border text-txt-secondary hover:bg-surface-sunken text-sm flex items-center justify-center"
                >-</button>
                <span className="w-6 text-center text-sm font-bold text-txt-primary">{minMessages}</span>
                <button
                  type="button"
                  onClick={() => { setMinMessages(m => Math.min(50, m + 1)); markChanged() }}
                  className="w-7 h-7 rounded-lg border border-border text-txt-secondary hover:bg-surface-sunken text-sm flex items-center justify-center"
                >+</button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-txt-primary">승인 타임아웃</span>
                <p className="text-[10px] text-txt-disabled">이 시간 후 자동 게시됩니다</p>
              </div>
              <div className="flex gap-1.5">
                {[12, 24, 48].map(h => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => { setTimeoutHours(h); markChanged() }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      timeoutHours === h ? 'bg-brand text-white' : 'bg-surface-sunken text-txt-secondary hover:bg-border'
                    }`}
                  >
                    {h}시간
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-sm text-txt-primary">커스텀 프롬프트</span>
              <textarea
                value={customPrompt}
                onChange={e => { setCustomPrompt(e.target.value); markChanged() }}
                placeholder="예: 기술 스택 언급 금지, 이모지 많이 사용"
                maxLength={200}
                className="mt-1.5 w-full px-3 py-2 border border-border rounded-xl text-sm text-txt-primary bg-surface-card resize-none h-16 focus:outline-hidden focus:border-brand transition-colors placeholder:text-txt-disabled"
              />
              <div className="text-right text-[10px] text-txt-disabled">{customPrompt.length}/200</div>
            </div>
          </div>

          {/* 저장 */}
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={!hasChanges || saveMutation.isPending}
            className="w-full py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saveMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            {saveMutation.isPending ? '저장 중' : '설정 저장'}
          </button>

          {/* 채널 안내 */}
          <p className="text-[11px] text-txt-disabled text-center">
            Discord 채널 연결은 각 프로젝트 수정 페이지에서 설정할 수 있습니다.
          </p>

          {/* 연결 해제 */}
          <div className="pt-4 border-t border-border">
            {!showDisconnectConfirm ? (
              <button
                type="button"
                onClick={() => setShowDisconnectConfirm(true)}
                className="text-xs text-txt-disabled hover:text-status-danger-text transition-colors"
              >
                Discord 연결 해제
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-status-danger-text">
                  연결을 해제하면 주간 업데이트 자동 생성이 중단되고, 모든 채널 매핑이 삭제됩니다.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => disconnectMutation.mutate()}
                    disabled={disconnectMutation.isPending}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-status-danger-text rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {disconnectMutation.isPending && <Loader2 size={11} className="animate-spin" />}
                    {disconnectMutation.isPending ? '해제 중' : '연결 해제'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDisconnectConfirm(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-txt-secondary border border-border rounded-lg hover:bg-surface-sunken transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
