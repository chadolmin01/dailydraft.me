'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useClub } from '@/src/hooks/useClub'
import Link from 'next/link'

// ─── Types ───

interface GitHubRepo {
  fullName: string
  name: string
  owner: string
  private: boolean
  url: string
  description: string | null
  language: string | null
  updatedAt: string
  connected: boolean
}

interface GitHubConnectorInfo {
  connected: boolean
  githubUsername: string | null
  githubAvatarUrl: string | null
}

interface DiscordChannelOption {
  id: string
  name: string
  type: number // 0 = 텍스트, 15 = 포럼
}

interface GitHubSettingsPanelProps {
  clubSlug: string
  /** 팀/프로젝트 단위 연동 시 필수. 없으면 클럽 레벨 OAuth 전용. */
  opportunityId?: string
  /** 프로젝트 수정 페이지에서 사용 시 "클럽으로 돌아가기" 대신 다른 동작 필요 */
  hideBackLink?: boolean
}

// ─── Component ───

export function GitHubSettingsPanel({ clubSlug, opportunityId, hideBackLink }: GitHubSettingsPanelProps) {
  const { data: club, isLoading: clubLoading } = useClub(clubSlug)
  const queryClient = useQueryClient()
  const [connectingRepo, setConnectingRepo] = useState<string | null>(null)
  const [disconnectingRepo, setDisconnectingRepo] = useState<string | null>(null)
  const [testingRepo, setTestingRepo] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ repo: string; success: boolean; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedChannelId, setSelectedChannelId] = useState<string>('')

  // queryKey에 opportunityId 포함하여 프로젝트별 캐시 분리
  const connectorQueryKey = ['github-connector', club?.id, opportunityId ?? 'club']
  const reposQueryKey = ['github-repos', club?.id, opportunityId ?? 'club']

  // ── GitHub 연결 상태 조회 ──
  const { data: connectorInfo, isLoading: connectorLoading } = useQuery<GitHubConnectorInfo>({
    queryKey: connectorQueryKey,
    enabled: !!club?.id,
    queryFn: async () => {
      const params = new URLSearchParams({ clubId: club!.id })
      if (opportunityId) params.set('opportunityId', opportunityId)
      const res = await fetch(`/api/github/repos?${params.toString()}`)
      if (res.status === 404) {
        return { connected: false, githubUsername: null, githubAvatarUrl: null }
      }
      if (res.status === 401) {
        return { connected: false, githubUsername: null, githubAvatarUrl: null }
      }
      if (!res.ok) throw new Error('Failed to check GitHub status')
      // 레포 목록을 받았다는 것 자체가 연결된 상태
      return { connected: true, githubUsername: null, githubAvatarUrl: null }
    },
  })

  // ── 레포 목록 조회 ──
  const { data: reposData, isLoading: reposLoading } = useQuery<{ repos: GitHubRepo[] }>({
    queryKey: reposQueryKey,
    enabled: !!club?.id && connectorInfo?.connected === true,
    queryFn: async () => {
      const params = new URLSearchParams({ clubId: club!.id })
      if (opportunityId) params.set('opportunityId', opportunityId)
      const res = await fetch(`/api/github/repos?${params.toString()}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || 'Failed to fetch repos')
      }
      return res.json()
    },
  })

  // ── Discord 채널 목록 조회 (알림 채널 선택용) ──
  const { data: discordChannelsData } = useQuery<{ available_channels: DiscordChannelOption[] }>({
    queryKey: ['discord-channels', club?.id],
    enabled: !!club?.id && connectorInfo?.connected === true,
    queryFn: async () => {
      const res = await fetch(`/api/clubs/${club!.id}/discord-channels`)
      if (!res.ok) throw new Error('Discord 채널 목록을 불러올 수 없습니다')
      return res.json()
    },
  })

  const discordChannels = discordChannelsData?.available_channels ?? []

  // ── 레포 연결 ──
  const connectMutation = useMutation({
    mutationFn: async (repoFullName: string) => {
      setConnectingRepo(repoFullName)
      setError(null)

      // 선택된 Discord 채널 정보 (알림 전송 대상)
      const selectedChannel = discordChannels.find(ch => ch.id === selectedChannelId)

      const res = await fetch('/api/github/repos/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubId: club!.id,
          repoFullName,
          opportunityId,
          // 사용자가 직접 선택한 알림 채널 (없으면 서버에서 discord_team_channels fallback)
          ...(selectedChannelId ? {
            discordChannelId: selectedChannelId,
            discordChannelType: selectedChannel?.type ?? 0,
          } : {}),
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || '레포 연결에 실패했습니다.')
      }
      return res.json()
    },
    onSuccess: () => {
      setConnectingRepo(null)
      queryClient.invalidateQueries({ queryKey: reposQueryKey })
    },
    onError: (err: Error) => {
      setConnectingRepo(null)
      setError(err.message)
    },
  })

  // ── 레포 연결 해제 ──
  const disconnectMutation = useMutation({
    mutationFn: async (repoFullName: string) => {
      setDisconnectingRepo(repoFullName)
      setError(null)
      const res = await fetch('/api/github/repos/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubId: club!.id,
          repoFullName,
          opportunityId,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || '레포 연결 해제에 실패했습니다.')
      }
      return res.json()
    },
    onSuccess: () => {
      setDisconnectingRepo(null)
      queryClient.invalidateQueries({ queryKey: reposQueryKey })
    },
    onError: (err: Error) => {
      setDisconnectingRepo(null)
      setError(err.message)
    },
  })

  // ── 테스트 알림 ──
  const testMutation = useMutation({
    mutationFn: async (repoFullName: string) => {
      setTestingRepo(repoFullName)
      setTestResult(null)
      const res = await fetch('/api/github/test-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clubId: club!.id, opportunityId, repoFullName }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || '테스트 알림 전송에 실패했습니다.')
      }
      return res.json()
    },
    onSuccess: (data, repoFullName) => {
      setTestingRepo(null)
      const channelType = data.channel === 'forum' ? '포럼' : '채널'
      setTestResult({ repo: repoFullName, success: true, message: `Discord ${channelType}에 테스트 알림을 전송했습니다.` })
      setTimeout(() => setTestResult(null), 5000)
    },
    onError: (err: Error, repoFullName) => {
      setTestingRepo(null)
      setTestResult({ repo: repoFullName, success: false, message: err.message })
      setTimeout(() => setTestResult(null), 5000)
    },
  })

  // ── GitHub OAuth 시작 ──
  const handleConnectGitHub = useCallback(() => {
    if (!club) return
    const params = new URLSearchParams({
      clubId: club.id,
      clubSlug,
    })
    if (opportunityId) params.set('opportunityId', opportunityId)
    window.location.href = `/api/github/oauth?${params.toString()}`
  }, [club, clubSlug, opportunityId])

  // ── 전체 GitHub 연결 해제 ──
  const handleDisconnectAll = useCallback(async () => {
    if (!club) return
    if (!confirm('GitHub 연결을 해제하면 모든 레포의 webhook도 삭제됩니다. 계속하시겠습니까?')) {
      return
    }

    setError(null)

    // 연결된 모든 레포 해제
    const connectedRepos = reposData?.repos.filter(r => r.connected) || []
    for (const repo of connectedRepos) {
      try {
        await fetch('/api/github/repos/disconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clubId: club.id,
            repoFullName: repo.fullName,
            opportunityId,
          }),
        })
      } catch {
        // 개별 실패 무시, 계속 진행
      }
    }

    // OAuth connector도 삭제 (직접 API 호출 대신 disconnect all 용도)
    // 현재는 OAuth connector를 삭제하면 레포 목록 조회가 안 되므로
    // 페이지를 새로고침하면 미연결 상태로 표시됨
    try {
      queryClient.invalidateQueries({ queryKey: connectorQueryKey })
      queryClient.invalidateQueries({ queryKey: reposQueryKey })
    } catch {
      // 무시
    }

    // 간단하게 페이지 새로고침으로 상태 동기화
    window.location.reload()
  }, [club, reposData, queryClient, opportunityId, connectorQueryKey, reposQueryKey])

  // ── Loading ──
  if (clubLoading || connectorLoading) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-surface-sunken rounded w-48" />
          <div className="h-48 bg-surface-sunken rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!club) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-txt-tertiary">클럽을 찾을 수 없습니다.</p>
      </div>
    )
  }

  const isConnected = connectorInfo?.connected === true
  const repos = reposData?.repos ?? []
  const connectedRepos = repos.filter(r => r.connected)
  const availableRepos = repos.filter(r => !r.connected)

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-surface-bg flex items-center justify-center shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-txt-primary">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-txt-primary">GitHub 연동</h1>
          <p className="text-xs text-txt-tertiary">
            {opportunityId
              ? '이 프로젝트의 GitHub 레포를 연결합니다'
              : 'GitHub 계정을 연결합니다'}
          </p>
        </div>
        {isConnected && (
          <div className="px-3 py-1 rounded-full bg-status-success-bg text-status-success-text text-xs font-semibold border border-status-success-text/20">
            연결됨
          </div>
        )}
      </div>

      {/* 뒤로가기 */}
      {!hideBackLink && (
        <Link
          href={`/clubs/${clubSlug}`}
          className="inline-flex items-center gap-1.5 text-sm text-txt-tertiary hover:text-txt-secondary transition-colors mb-6"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          클럽으로 돌아가기
        </Link>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-status-danger-bg border border-status-danger-text/20 text-sm text-status-danger-text">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700 font-semibold"
          >
            닫기
          </button>
        </div>
      )}

      {/* 미연결 상태 */}
      {!isConnected && (
        <div className="bg-surface-card border border-border rounded-2xl p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-surface-bg flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-txt-tertiary">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-txt-primary mb-1">
                GitHub 계정을 연결해주세요
              </h2>
              <p className="text-sm text-txt-tertiary leading-relaxed">
                GitHub를 연결하면 커밋, PR, 이슈 활동이 자동으로 추적됩니다.
                <br />
                {opportunityId
                  ? '이 프로젝트의 Discord 채널에 알림이 전송됩니다.'
                  : '주간 업데이트에 개발 진행 상황이 반영됩니다.'}
              </p>
            </div>
            <button
              onClick={handleConnectGitHub}
              className="inline-flex items-center gap-2 px-6 py-3 bg-txt-primary text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub 연결하기
            </button>
          </div>
        </div>
      )}

      {/* 연결된 상태 */}
      {isConnected && (
        <div className="space-y-4">
          {/* 연결된 레포 */}
          {connectedRepos.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-txt-primary mb-3">
                연결된 레포지토리
              </h2>
              <div className="space-y-2">
                {connectedRepos.map((repo) => (
                  <div
                    key={repo.fullName}
                    className="flex items-center gap-3 px-4 py-3 bg-surface-card border border-border rounded-xl"
                  >
                    <div className="w-8 h-8 rounded-lg bg-status-success-bg flex items-center justify-center shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-status-success-text">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-txt-primary truncate">
                          {repo.fullName}
                        </span>
                        {repo.private && (
                          <span className="px-1.5 py-0.5 rounded bg-surface-bg text-[10px] font-semibold text-txt-tertiary shrink-0">
                            비공개
                          </span>
                        )}
                      </div>
                      {repo.description && (
                        <p className="text-xs text-txt-tertiary truncate mt-0.5">
                          {repo.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => testMutation.mutate(repo.fullName)}
                        disabled={testingRepo === repo.fullName}
                        className="px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand-bg rounded-lg transition-colors disabled:opacity-50"
                      >
                        {testingRepo === repo.fullName ? '전송 중...' : '테스트'}
                      </button>
                      <button
                        onClick={() => disconnectMutation.mutate(repo.fullName)}
                        disabled={disconnectingRepo === repo.fullName}
                        className="px-3 py-1.5 text-xs font-semibold text-status-danger-text hover:bg-status-danger-bg rounded-lg transition-colors disabled:opacity-50"
                      >
                        {disconnectingRepo === repo.fullName ? '해제 중...' : '해제'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {/* 테스트 결과 */}
              {testResult && connectedRepos.some(r => r.fullName === testResult.repo) && (
                <div className={`mt-2 px-4 py-2.5 rounded-xl text-sm ${
                  testResult.success
                    ? 'bg-status-success-bg border border-status-success-text/20 text-status-success-text'
                    : 'bg-status-danger-bg border border-status-danger-text/20 text-status-danger-text'
                }`}>
                  {testResult.message}
                </div>
              )}
            </div>
          )}

          {/* 알림 채널 선택 */}
          {discordChannels.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-txt-primary mb-1">
                알림 채널
              </h2>
              <p className="text-xs text-txt-tertiary mb-2">
                커밋, PR 등 GitHub 알림을 받을 Discord 채널을 선택합니다.
              </p>
              <select
                value={selectedChannelId}
                onChange={(e) => setSelectedChannelId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface-card border border-border rounded-xl text-txt-primary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
              >
                <option value="">자동 (팀 채널 매핑 사용)</option>
                {discordChannels.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    #{ch.name}{ch.type === 15 ? ' (포럼)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 연결 가능한 레포 */}
          <div>
            <h2 className="text-sm font-bold text-txt-primary mb-1">
              레포지토리 연결
            </h2>
            <p className="text-xs text-txt-tertiary mb-3">
              Admin 권한이 있는 레포만 표시됩니다. 연결하면 webhook이 자동 생성됩니다.
            </p>

            {reposLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse h-16 bg-surface-sunken rounded-xl" />
                ))}
              </div>
            ) : availableRepos.length === 0 && connectedRepos.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-txt-tertiary bg-surface-card border border-border rounded-xl">
                연결 가능한 레포지토리가 없습니다.
                <br />
                Admin 권한이 있는 레포가 필요합니다.
              </div>
            ) : availableRepos.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {availableRepos.map((repo) => (
                  <div
                    key={repo.fullName}
                    className="flex items-center gap-3 px-4 py-3 bg-surface-card border border-border rounded-xl hover:border-txt-disabled transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-surface-bg flex items-center justify-center shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-txt-tertiary">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-txt-primary truncate">
                          {repo.fullName}
                        </span>
                        {repo.private && (
                          <span className="px-1.5 py-0.5 rounded bg-surface-bg text-[10px] font-semibold text-txt-tertiary shrink-0">
                            비공개
                          </span>
                        )}
                        {repo.language && (
                          <span className="px-1.5 py-0.5 rounded bg-surface-bg text-[10px] font-semibold text-txt-disabled shrink-0">
                            {repo.language}
                          </span>
                        )}
                      </div>
                      {repo.description && (
                        <p className="text-xs text-txt-tertiary truncate mt-0.5">
                          {repo.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => connectMutation.mutate(repo.fullName)}
                      disabled={connectingRepo === repo.fullName}
                      className="px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand-bg rounded-lg transition-colors disabled:opacity-50 shrink-0"
                    >
                      {connectingRepo === repo.fullName ? '연결 중...' : '연결'}
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* 전체 연결 해제 */}
          <div className="pt-4 border-t border-border">
            <button
              onClick={handleDisconnectAll}
              className="text-sm text-txt-tertiary hover:text-red-500 transition-colors"
            >
              GitHub 연결 해제
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
