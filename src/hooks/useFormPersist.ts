/**
 * useFormPersist
 * 폼 데이터를 localStorage에 자동 저장하고 복원하는 훅
 * 새로고침 시에도 입력 내용이 유지됩니다.
 */

import { useEffect, useCallback, useRef } from 'react'

interface UseFormPersistOptions<T> {
  key: string
  data: T
  setData: (data: T) => void
  debounceMs?: number
  excludeFields?: (keyof T)[]
  enabled?: boolean
}

export function useFormPersist<T extends object>({
  key,
  data,
  setData,
  debounceMs = 500,
  excludeFields = [],
  enabled = true,
}: UseFormPersistOptions<T>) {
  const storageKey = `form_draft_${key}`
  const initialLoadDone = useRef(false)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  // 초기 로드 시 저장된 데이터 복원
  useEffect(() => {
    if (!enabled || initialLoadDone.current) return

    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved) as { data: T; timestamp: number }

        // 24시간 이내의 데이터만 복원
        const isRecent = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000
        if (isRecent && parsed.data) {
          setData(parsed.data)
        } else {
          // 오래된 데이터 삭제
          localStorage.removeItem(storageKey)
        }
      }
    } catch (error) {
      console.error('Failed to restore form data:', error)
      localStorage.removeItem(storageKey)
    }

    initialLoadDone.current = true
  }, [storageKey, setData, enabled])

  // 데이터 변경 시 저장 (debounced)
  useEffect(() => {
    if (!enabled || !initialLoadDone.current) return

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      try {
        // 제외할 필드 필터링
        const dataToSave = { ...data }
        excludeFields.forEach((field) => {
          delete dataToSave[field]
        })

        // 빈 데이터인지 확인
        const isEmpty = Object.values(dataToSave).every(
          (v) => v === '' || v === null || v === undefined ||
                 (Array.isArray(v) && v.length === 0) ||
                 (typeof v === 'object' && Object.keys(v as object).length === 0)
        )

        if (isEmpty) {
          localStorage.removeItem(storageKey)
        } else {
          localStorage.setItem(
            storageKey,
            JSON.stringify({ data: dataToSave, timestamp: Date.now() })
          )
        }
      } catch (error) {
        console.error('Failed to save form data:', error)
      }
    }, debounceMs)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [data, storageKey, debounceMs, excludeFields, enabled])

  // 저장된 데이터 삭제 (제출 완료 또는 취소 시 호출)
  const clearSavedData = useCallback(() => {
    localStorage.removeItem(storageKey)
  }, [storageKey])

  // 저장된 데이터가 있는지 확인
  const hasSavedData = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (!saved) return false

      const parsed = JSON.parse(saved)
      return Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000
    } catch {
      return false
    }
  }, [storageKey])

  // 마지막 저장 시간 가져오기
  const getLastSavedTime = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (!saved) return null

      const parsed = JSON.parse(saved)
      return new Date(parsed.timestamp)
    } catch {
      return null
    }
  }, [storageKey])

  return {
    clearSavedData,
    hasSavedData,
    getLastSavedTime,
  }
}

/**
 * 간단한 사용 예시:
 *
 * const [formData, setFormData] = useState({ title: '', description: '' })
 *
 * const { clearSavedData } = useFormPersist({
 *   key: 'new-opportunity',
 *   data: formData,
 *   setData: setFormData,
 * })
 *
 * const handleSubmit = async () => {
 *   await submitForm(formData)
 *   clearSavedData() // 제출 완료 후 저장된 데이터 삭제
 * }
 */
