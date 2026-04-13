'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/src/context/AuthContext'
import { useProfile } from '@/src/hooks/useProfile'

// ── localStorage schema ──
interface DiscordCarouselState {
  version: 1
  dismissedAt: number | null
}

const STORAGE_KEY = 'draft_discord_carousel'

const DEFAULT_STATE: DiscordCarouselState = {
  version: 1,
  dismissedAt: null,
}

function loadState(): DiscordCarouselState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw)
    if (parsed.version !== 1) return DEFAULT_STATE
    return parsed as DiscordCarouselState
  } catch {
    return DEFAULT_STATE
  }
}

function saveState(state: DiscordCarouselState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function useDiscordCarousel() {
  const { isAuthenticated } = useAuth()
  const { data: profile } = useProfile()

  const [state, setState] = useState<DiscordCarouselState>(DEFAULT_STATE)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setState(loadState())
    setHydrated(true)
  }, [])

  const dismiss = useCallback(() => {
    setState(prev => {
      const next = { ...prev, dismissedAt: Date.now() }
      saveState(next)
      return next
    })
  }, [])

  const visible =
    hydrated &&
    isAuthenticated &&
    !!profile?.onboarding_completed &&
    !profile?.discord_user_id &&
    state.dismissedAt == null

  return { visible, dismiss }
}
