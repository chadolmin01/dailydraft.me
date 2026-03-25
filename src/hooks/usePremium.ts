'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/src/lib/supabase/client'

interface UsePremiumReturn {
  isPremium: boolean
  isLoading: boolean
  premiumActivatedAt: string | null
  refetch: () => Promise<void>
}

export function usePremium(): UsePremiumReturn {
  const [isPremium, setIsPremium] = useState(false)
  const [premiumActivatedAt, setPremiumActivatedAt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const fetchPremiumStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mountedRef.current) return
      if (!user) {
        setIsPremium(false)
        setPremiumActivatedAt(null)
        return
      }

      // Check profile premium status (invite code based)
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium, premium_activated_at')
        .eq('user_id', user.id)
        .single()

      if (!mountedRef.current) return

      if (profile?.is_premium) {
        setIsPremium(true)
        setPremiumActivatedAt(profile.premium_activated_at)
        return
      }

      // Fallback: Check subscription status (for future payment integration)
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status, plan_type')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (!mountedRef.current) return

      const hasActiveSubscription = !!subscription && subscription.plan_type !== 'free'
      setIsPremium(hasActiveSubscription)
      setPremiumActivatedAt(null)
    } catch (error: unknown) {
      if (!mountedRef.current) return
      // Silently ignore AbortError from React Strict Mode (navigator.locks abort)
      const msg = error instanceof Error ? error.message : String(error)
      if (!msg.includes('AbortError')) {
        console.error('Failed to fetch premium status:', error)
      }
      setIsPremium(false)
      setPremiumActivatedAt(null)
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchPremiumStatus()
  }, [fetchPremiumStatus])

  return {
    isPremium,
    isLoading,
    premiumActivatedAt,
    refetch: fetchPremiumStatus,
  }
}

export default usePremium
