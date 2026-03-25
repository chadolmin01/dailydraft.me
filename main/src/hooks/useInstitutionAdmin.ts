import { useAuth } from '@/src/context/AuthContext'
import { useQuery } from '@tanstack/react-query'

interface InstitutionInfo {
  institutionId: string
  institutionName: string
  role: 'admin' | 'mentor' | 'student'
}

/**
 * Hook to check if the current user is an institution admin.
 * Fetches institution membership from DB.
 */
export function useInstitutionAdmin() {
  const { user, isLoading: isAuthLoading } = useAuth()

  const { data, isLoading: isQueryLoading } = useQuery<InstitutionInfo | null>({
    queryKey: ['institution-admin', user?.id],
    queryFn: async () => {
      const res = await fetch('/api/institution/me')
      if (!res.ok) return null
      return res.json()
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  })

  return {
    isInstitutionAdmin: data?.role === 'admin',
    isInstitutionMember: !!data,
    institution: data,
    isLoading: isAuthLoading || isQueryLoading,
  }
}
