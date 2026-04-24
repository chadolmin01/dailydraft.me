'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface ChannelOption {
  id: string
  name: string
}

interface ExistingMapping {
  id: string
  opportunity_id: string
  discord_channel_id: string
  discord_channel_name: string | null
}

interface ChannelDataResponse {
  mappings: ExistingMapping[]
  available_channels: ChannelOption[]
  opportunities: { id: string; title: string }[]
  guild: { id: string; name: string } | null
}

/**
 * Discord 채널 선택 드롭다운
 * - clubId가 있고, 해당 클럽에 Discord 봇이 설치된 경우만 표시
 * - 프로젝트 수정 시: opportunityId로 기존 매핑 로드/저장
 * - 프로젝트 생성 시: onSelect로 선택값만 전달 (생성 후 매핑)
 */
export function DiscordChannelSelect({
  clubId,
  opportunityId,
  onSelect,
}: {
  clubId: string | null | undefined
  opportunityId?: string
  onSelect?: (channelId: string, channelName: string) => void
}) {
  const queryClient = useQueryClient()
  const [selectedChannel, setSelectedChannel] = useState('')

  const { data, isLoading } = useQuery<ChannelDataResponse>({
    queryKey: ['discord-channels', clubId],
    enabled: !!clubId,
    queryFn: async () => {
      const res = await fetch(`/api/clubs/${clubId}/discord-channels`)
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    staleTime: 1000 * 60 * 5,
  })

  // 기존 매핑이 있으면 로드
  useEffect(() => {
    if (data?.mappings && opportunityId) {
      const existing = data.mappings.find(m => m.opportunity_id === opportunityId)
      if (existing) setSelectedChannel(existing.discord_channel_id)
    }
  }, [data?.mappings, opportunityId])

  const saveMutation = useMutation({
    mutationFn: async ({ channelId, channelName }: { channelId: string; channelName: string }) => {
      if (!clubId || !opportunityId) return

      // 기존 매핑 삭제
      const existing = data?.mappings?.find(m => m.opportunity_id === opportunityId)
      if (existing) {
        await fetch(`/api/clubs/${clubId}/discord-channels?id=${existing.id}`, { method: 'DELETE' })
      }

      // 새 매핑 생성 (빈 값이면 삭제만)
      if (channelId) {
        const res = await fetch(`/api/clubs/${clubId}/discord-channels`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            opportunity_id: opportunityId,
            discord_channel_id: channelId,
            discord_channel_name: channelName,
          }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || '매핑 저장 실패')
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discord-channels', clubId] })
    },
  })

  const handleChange = (channelId: string) => {
    setSelectedChannel(channelId)
    const channel = data?.available_channels.find(c => c.id === channelId)
    const channelName = channel?.name ?? ''

    if (onSelect) {
      // 생성 모드: 부모에 값 전달만
      onSelect(channelId, channelName)
    } else if (opportunityId) {
      // 수정 모드: 즉시 저장
      saveMutation.mutate({ channelId, channelName })
    }
  }

  // 봇 미설치 또는 clubId 없으면 렌더링 안 함
  if (!clubId || isLoading) return null
  if (!data?.guild || !data.available_channels.length) return null

  // 다른 프로젝트에서 이미 사용 중인 채널은 비활성화
  const usedChannels = new Set(
    data.mappings
      .filter(m => m.opportunity_id !== opportunityId)
      .map(m => m.discord_channel_id)
  )

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="text-txt-disabled">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
        <span className="text-xs text-txt-secondary font-medium">Discord 채널</span>
        {saveMutation.isPending && (
          <span className="text-[10px] text-txt-disabled">저장 중...</span>
        )}
      </div>
      <div className="ml-5">
        <select
          value={selectedChannel}
          onChange={e => handleChange(e.target.value)}
          className="w-full text-xs border border-border-subtle rounded-lg px-3 py-1.5 bg-surface-card text-txt-primary focus:outline-hidden focus:ring-2 focus:ring-brand/10 focus:border-brand transition-all"
        >
          <option value="">연결 안 함</option>
          {data.available_channels.map(ch => (
            <option key={ch.id} value={ch.id} disabled={usedChannels.has(ch.id)}>
              # {ch.name}
            </option>
          ))}
        </select>
        <p className="text-[10px] text-txt-disabled mt-1">
          이 채널의 대화가 주간 업데이트에 반영됩니다
        </p>
      </div>
    </div>
  )
}
