'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/src/lib/supabase/client'
import { useAuth } from '@/src/context/AuthContext'
import { universityVerificationKeys, fetchUniversityVerification } from '@/src/lib/queries/profile-queries'

export function useUniversityVerification() {
  const { user } = useAuth()
  return useQuery({
    queryKey: universityVerificationKeys.detail(user?.id ?? ''),
    queryFn: () => fetchUniversityVerification(supabase, user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    retry: false,
  })
}
