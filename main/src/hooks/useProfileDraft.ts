'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import { useUpdateProfile } from './useProfile'
import type { Tables } from '../types/database'

type Profile = Tables<'profiles'>

interface UseProfileDraftReturn {
  drafts: Record<string, string>
  hasPendingChanges: boolean
  isPending: boolean
  editField: (field: string) => (val: string) => void
  handleSave: () => void
  handleCancel: () => void
}

export function useProfileDraft(
  profile: Profile | null | undefined,
  fieldDefaults: Record<string, string>,
  options?: { onSuccess?: () => void; onError?: () => void }
): UseProfileDraftReturn {
  const updateProfile = useUpdateProfile()
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  // Reset drafts when profile updates (after successful save)
  useEffect(() => { setDrafts({}) }, [profile])

  const hasPendingChanges = useMemo(() => {
    return Object.entries(drafts).some(([field, val]) => {
      const original = fieldDefaults[field] ?? ''
      return val !== original
    })
  }, [drafts, fieldDefaults])

  const editField = useCallback(
    (field: string) => (val: string) => {
      setDrafts(prev => ({ ...prev, [field]: val }))
    },
    []
  )

  const handleSave = useCallback(() => {
    if (!hasPendingChanges) return
    const updates: Record<string, string | null> = {}
    for (const [field, val] of Object.entries(drafts)) {
      const trimmed = val.trim()
      const original = fieldDefaults[field] ?? ''
      if (trimmed !== original) {
        updates[field] = trimmed || null
      }
    }
    if (Object.keys(updates).length > 0) {
      updateProfile.mutate(updates, {
        onSuccess: () => {
          if (options?.onSuccess) {
            options.onSuccess()
          }
        },
        onError: () => {
          if (options?.onError) {
            options.onError()
          }
        },
      })
    }
  }, [hasPendingChanges, drafts, fieldDefaults, updateProfile, options])

  const handleCancel = useCallback(() => setDrafts({}), [])

  return {
    drafts,
    hasPendingChanges,
    isPending: updateProfile.isPending,
    editField,
    handleSave,
    handleCancel,
  }
}
