'use client'

import { useState, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/src/types/database'

interface UseInterestsOptions {
  opportunityId: string
}

interface UseInterestsReturn {
  loading: boolean
  error: string | null
  expressInterest: (email: string) => Promise<boolean>
  checkInterest: (email: string) => Promise<boolean>
}

export function useInterests({ opportunityId }: UseInterestsOptions): UseInterestsReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient<Database>()

  const expressInterest = useCallback(async (email: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const { data: userData } = await supabase.auth.getUser()

      const { data, error: rpcError } = await supabase.rpc('express_interest', {
        p_opportunity_id: opportunityId,
        p_user_email: email,
        p_user_id: userData?.user?.id || null,
      })

      if (rpcError) throw rpcError

      return data as boolean
    } catch (err) {
      console.error('Failed to express interest:', err)
      setError(err instanceof Error ? err.message : 'Failed to express interest')
      return false
    } finally {
      setLoading(false)
    }
  }, [opportunityId, supabase])

  const checkInterest = useCallback(async (email: string): Promise<boolean> => {
    try {
      const { data, error: rpcError } = await supabase.rpc('has_expressed_interest', {
        p_opportunity_id: opportunityId,
        p_user_email: email,
      })

      if (rpcError) throw rpcError

      return data as boolean
    } catch (err) {
      console.error('Failed to check interest:', err)
      return false
    }
  }, [opportunityId, supabase])

  return {
    loading,
    error,
    expressInterest,
    checkInterest,
  }
}
