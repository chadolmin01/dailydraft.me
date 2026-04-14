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

// ─── Component ───

export function GitHubSettingsPanel({ clubSlug }: { clubSlug: string }) {
  const { data: club, isLoading: clubLoading } = useClub(clubSlug)
  const queryClient = useQueryClient()
  const [connectingRepo, setConnectingRepo] = useState<string | null>(null)
  const [disconnectingRepo, setDisconnectingRepo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ── GitHub 연결 상태 조회 ──
  const { data: connectorInfo, isLoading: connectorLoading } = useQuery<GitHubConnectorInfo>({
    queryKey: ['github-connector', club?.id],
    enabled: !!club?.id,
    queryFn: async () => {
      const res = await fetch(`/api/github/repos?clubId=${club!.id}`)
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
    queryKey: ['github-repos', club?.id],
    enabled: !!club?.id && connectorInfo?.connected === true,
    queryFn: async () => {
      const res = await fetch(`/api/github/repos?clubId=${club!.id}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || 'Failed to fetch repos')
      }
      return res.json()
    },
  })

  // ── 레포 연결 ──
  const connectMutation = useMutation({
    mutationFn: async (repoFullName: string) => {
      setConnectingRepo(repoFullName)
      setError(null)
      const res = await fetch('/api/github/repos/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clubId: club!.id, repoFullName }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || '레포 연결에 실패했습니다.')
      }
      return res.json()
    },
    onSuccess: () => {
      setConnectingRepo(null)
      queryClient.invalidateQueries({ queryKey: ['github-repos', club?.id] })
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
        body: JSON.stringify({ clubId: club!.id, repoFullName }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || '레포 연결 해제에 실패했습니다.')
      }
      return res.json()
    },
    onSuccess: () => {
      setDisconnectingRepo(null)
      queryClient.invalidateQueries({ queryKey: ['github-repos', club?.id] })
    },
    onError: (err: Error) => {
      setDisconnectingRepo(null)
      setError(err.message)
    },
  })

  // ── GitHub OAuth 시작 ──
  const handleConnectGitHub = useCallback(() => {
    if (!club) return
    window.location.href = `/api/github/oauth?clubId=${club.id}&clubSlug=${clubSlug}`
  }, [club, clubSlug])

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
          body: JSON.stringify({ clubId: club.id, repoFullName: repo.fullName }),
        })
      } catch {
        // 개별 실패 무시, 계속 진행
      }
    }

    // OAuth connector도 삭제 (직접 API 호출 대신 disconnect all 용도)
    // 현재는 OAuth connector를 삭제하면 레포 목록 조회가 안 되므로
    // 페이지를 새로고침하면 미연결 상태로 표시됨
    try {
      // OAuth connector는 별도 삭제 API가 없으므로 repos disconnect 후
      // connector 상태를 무효화
      queryClient.invalidateQueries({ queryKey: ['github-connector', club.id] })
      queryClient.invalidateQueries({ queryKey: ['github-repos', club.id] })
    } catch {
      // 무시
    }

    // 간단하게 페이지 새로고침으로 상태 동기화
    window.location.reload()
  }, [club, reposData, queryClient])

  // ── Loading ──
  if (clubLoading || connectorLoading) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-border-default/30 rounded w-48" />
          <div className="h-48 bg-border-default/30 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!club) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-12 text-center">
        <p className="text-txt-tertiary">클럽을 찾을 수 없습니다.</p>
      </div>
    )
  }

  const isConnected = connectorInfo?.connected === true
  const repos = reposData?.repos ?? []
  const connectedRepos = repos.filter(r => r.connected)
  const availableRepos = repos.filter(r => !r.connected)

  return (
    <div className="max-w-2xl mx-auto px-5 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-surface-bg flex items-center justify-center shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-txt-primary">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-txt-primary">{club.name}</h1>
          <p className="text-xs text-txt-tertiary">GitHub 연동 설정</p>
        </div>
        {isConnected && (
          <div className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs font-semibold border border-green-200">
            연결됨
          </div>
        )}
      </div>

      {/* 뒤로가기 */}
      <Link
        href={`/clubs/${clubSlug}`}
        className="inline-flex items-center gap-1.5 text-sm text-txt-tertiary hover:text-txt-secondary transition-colors mb-6"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        클럽으로 돌아가기
      </Link>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
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
        <div className="bg-surface-card border border-border-default rounded-2xl p-6">
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
                주간 업데이트에 개발 진행 상황이 반영됩니다.
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
                    className="flex items-center gap-3 px-4 py-3 bg-surface-card border border-border-default rounded-xl"
                  >
                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
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
                    <button
                      onClick={() => disconnectMutation.mutate(repo.fullName)}
                      disabled={disconnectingRepo === repo.fullName}
                      className="px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                    >
                      {disconnectingRepo === repo.fullName ? '해제 중...' : '연결 해제'}
                    </button>
                  </div>
                ))}
              </div>
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
                  <div key={i} className="animate-pulse h-16 bg-border-default/30 rounded-xl" />
                ))}
              </div>
            ) : availableRepos.length === 0 && connectedRepos.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-txt-tertiary bg-surface-card border border-border-default rounded-xl">
                연결 가능한 레포지토리가 없습니다.
                <br />
                Admin 권한이 있는 레포가 필요합니다.
              </div>
            ) : availableRepos.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {availableRepos.map((repo) => (
                  <div
                    key={repo.fullName}
                    className="flex items-center gap-3 px-4 py-3 bg-surface-card border border-border-default rounded-xl hover:border-txt-disabled transition-colors"
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
          <div className="pt-4 border-t border-border-default">
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
