import { useAuth } from '@/src/context/AuthContext'

/**
 * Hook to check if the current user is an admin.
 * Uses app_metadata.is_admin from the JWT token (no extra DB query needed).
 */
export function useAdmin() {
  const { user, isLoading } = useAuth()

  // app_metadata is included in the JWT token, so no additional query needed
  const isAdmin = user?.app_metadata?.is_admin === true

  return {
    isAdmin,
    isLoading,
  }
}
