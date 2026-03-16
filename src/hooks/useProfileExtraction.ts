'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { profileKeys } from './useProfile'
import type { ExtractedProfile, ProfileExtractionResponse } from '../types/extracted-profile'

interface ExtractionInput {
  conversationHistory: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
}

export function useProfileExtraction() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (input: ExtractionInput): Promise<ProfileExtractionResponse> => {
      const response = await fetch('/api/profile/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '프로필 추출에 실패했습니다.')
      }

      return response.json()
    },
    onSuccess: () => {
      // 프로필 캐시 갱신
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: profileKeys.detail(user.id) })
      }
    },
  })
}

// 백그라운드 추출 트리거 (응답 대기 없이)
export async function triggerBackgroundExtraction(
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<void> {
  // fire-and-forget 방식
  fetch('/api/profile/extract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ conversationHistory }),
  }).catch((err) => {
    console.error('Background profile extraction failed:', err)
  })
}

export type { ExtractedProfile, ProfileExtractionResponse }
