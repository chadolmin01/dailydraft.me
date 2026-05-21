import { useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'

const STORAGE_KEY = 'draft-new-project'
const DEBOUNCE_MS = 1000
const EXPIRY_MS = 24 * 60 * 60 * 1000 // 24h

interface DraftData {
  title: string
  description: string
  type: string
  selectedRoles: string[]
  selectedTags: string[]
  locationType: string
  painPoint: string
  timeCommitment: string
  compensationType: string
  compensationDetails: string
  links: { label: string; url: string }[]
  ts: number
}

export function useAutoSaveDraft(
  formData: Omit<DraftData, 'ts'>,
  options: {
    enabled: boolean
    onRestore: (data: Omit<DraftData, 'ts'>) => void
  }
): { clearDraft: () => void } {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const restoredRef = useRef(false)

  // Restore on mount (once)
  useEffect(() => {
    if (restoredRef.current || !options.enabled) return
    restoredRef.current = true

    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const data = JSON.parse(raw) as DraftData
      if (Date.now() - data.ts > EXPIRY_MS) {
        localStorage.removeItem(STORAGE_KEY)
        return
      }
      // Only restore if there's meaningful content
      if (!data.title && !data.description) return
      const { ts: _, ...rest } = data
      options.onRestore(rest)
      toast('임시저장된 내용을 불러왔어요')
    } catch {
      /* ignore parse errors */
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.enabled])

  // Debounced save
  useEffect(() => {
    if (!options.enabled) return

    // Don't save empty forms
    if (!formData.title && !formData.description) return

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...formData, ts: Date.now() }))
      } catch {
        /* quota exceeded */
      }
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [formData, options.enabled])

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  return { clearDraft }
}
