'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/src/context/AuthContext'
import { useProfileCompletion } from '@/src/hooks/useProfileCompletion'
import { useMyOpportunities } from '@/src/hooks/useOpportunities'
import { useQuery } from '@tanstack/react-query'

// ── localStorage schema ──
interface StarterGuideState {
  version: 1
  steps: { profile: boolean; explore: boolean; project: boolean }
  softDismissedAt: number | null
  permanentlyDismissed: boolean
  completedAt: number | null
}

const STORAGE_KEY = 'draft_starter_guide'
const SOFT_DISMISS_DURATION = 24 * 60 * 60 * 1000 // 24h

const DEFAULT_STATE: StarterGuideState = {
  version: 1,
  steps: { profile: false, explore: false, project: false },
  softDismissedAt: null,
  permanentlyDismissed: false,
  completedAt: null,
}

function loadState(): StarterGuideState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw)
    if (parsed.version !== 1) return DEFAULT_STATE
    return parsed as StarterGuideState
  } catch {
    return DEFAULT_STATE
  }
}

function saveState(state: StarterGuideState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

// ── Step definition ──
export interface StarterStep {
  id: 'profile' | 'explore' | 'project'
  label: string
  desc: string
  href: string
  done: boolean
}

// ── Hook ──
export function useStarterGuide() {
  const { isAuthenticated, profile, user } = useAuth()
  const { pct: profilePct } = useProfileCompletion(profile)
  const { data: myOpportunities } = useMyOpportunities()

  // Pending applications count (applications I sent)
  const { data: pendingData } = useQuery({
    queryKey: ['my-sent-applications-count', user?.id],
    queryFn: async () => {
      const res = await fetch('/api/applications/pending-count')
      if (!res.ok) return { count: 0 }
      return res.json() as Promise<{ count: number }>
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  })

  const [state, setState] = useState<StarterGuideState>(DEFAULT_STATE)
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage
  useEffect(() => {
    setState(loadState())
    setHydrated(true)
  }, [])

  // Auto-complete: profile
  useEffect(() => {
    if (!hydrated || state.steps.profile) return
    if (profilePct >= 100) {
      setState(prev => {
        const next = { ...prev, steps: { ...prev.steps, profile: true } }
        saveState(next)
        return next
      })
    }
  }, [hydrated, profilePct, state.steps.profile])

  // Auto-complete: project (user created or has pending applications)
  useEffect(() => {
    if (!hydrated || state.steps.project) return
    const hasProject = (myOpportunities?.length ?? 0) > 0
    const hasPending = (pendingData?.count ?? 0) > 0
    if (hasProject || hasPending) {
      setState(prev => {
        const next = { ...prev, steps: { ...prev.steps, project: true } }
        saveState(next)
        return next
      })
    }
  }, [hydrated, myOpportunities, pendingData, state.steps.project])

  // Mark explore visited (called externally)
  const markExploreVisited = useCallback(() => {
    setState(prev => {
      if (prev.steps.explore) return prev
      const next = { ...prev, steps: { ...prev.steps, explore: true } }
      saveState(next)
      return next
    })
  }, [])

  const softDismiss = useCallback(() => {
    setState(prev => {
      const next = { ...prev, softDismissedAt: Date.now() }
      saveState(next)
      return next
    })
  }, [])

  const permanentDismiss = useCallback(() => {
    setState(prev => {
      const next = { ...prev, permanentlyDismissed: true }
      saveState(next)
      return next
    })
  }, [])

  const resetGuide = useCallback(() => {
    const fresh = { ...DEFAULT_STATE }
    saveState(fresh)
    setState(fresh)
  }, [])

  // Build steps
  const steps: StarterStep[] = useMemo(() => [
    { id: 'profile', label: '프로필 완성하기', desc: '매칭 정확도를 높이는 첫 걸음', href: '/profile/edit', done: state.steps.profile },
    { id: 'explore', label: '프로젝트 둘러보기', desc: '지금 모집 중인 프로젝트 구경', href: '/explore', done: state.steps.explore },
    { id: 'project', label: '프로젝트 등록 또는 지원', desc: '팀에 합류하거나 직접 시작하기', href: '/projects/new', done: state.steps.project },
  ], [state.steps])

  const completedCount = steps.filter(s => s.done).length
  const allDone = completedCount === steps.length

  // Mark completed when all done (justCompleted = first time completing in this session)
  const [justCompleted, setJustCompleted] = useState(false)
  useEffect(() => {
    if (!hydrated) return
    if (allDone && !state.completedAt) {
      setJustCompleted(true)
      setState(prev => {
        const next = { ...prev, completedAt: Date.now() }
        saveState(next)
        return next
      })
    }
  }, [hydrated, allDone, state.completedAt])

  // Visibility logic
  const isSoftDismissExpired = state.softDismissedAt
    ? Date.now() - state.softDismissedAt > SOFT_DISMISS_DURATION
    : true
  const isDismissed = state.permanentlyDismissed || (state.softDismissedAt !== null && !isSoftDismissExpired)
  const onboardingDone = profile?.onboarding_completed ?? false

  const visible = hydrated && isAuthenticated && onboardingDone && !isDismissed

  // Bonus hint: show link nudge after profile step done
  const profileRecord = profile as Record<string, unknown> | null
  const hasExternalLink = !!(
    profileRecord?.portfolio_url ||
    profileRecord?.github_url ||
    profileRecord?.linkedin_url
  )
  const showLinkHint = state.steps.profile && !hasExternalLink

  return {
    steps,
    completedCount,
    total: steps.length,
    visible,
    allDone,
    softDismiss,
    permanentDismiss,
    resetGuide,
    markExploreVisited,
    showLinkHint,
    justCompleted,
  }
}
