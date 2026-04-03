'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/src/context/AuthContext'
import { hapticMedium } from '@/src/utils/haptic'

interface UseProfileInterestReturn {
  hasInterested: boolean
  interestCount: number
  interestLoading: boolean
  handleInterest: () => Promise<void>
}

export function useProfileInterest(
  profileId: string | undefined,
  profileUserId: string | undefined
): UseProfileInterestReturn {
  const { user } = useAuth()
  const [hasInterested, setHasInterested] = useState(false)
  const [interestCount, setInterestCount] = useState(0)
  const [interestLoading, setInterestLoading] = useState(false)

  useEffect(() => {
    if (profileId && user) {
      fetch(`/api/profile/${profileId}/interest`)
        .then(r => r.json())
        .then(d => {
          setHasInterested(!!d.interested)
          setInterestCount(d.interest_count ?? 0)
        })
        .catch(() => toast.error('관심 정보를 불러오지 못했습니다'))
    } else {
      setHasInterested(false)
      setInterestCount(0)
    }
  }, [profileId, user])

  const handleInterest = useCallback(async () => {
    hapticMedium()
    if (!user) return
    if (user.id === profileUserId) {
      toast.error('내 프로필에는 관심 표시를 할 수 없어요')
      return
    }
    if (!profileId || interestLoading) return
    setInterestLoading(true)
    try {
      const res = await fetch(`/api/profile/${profileId}/interest`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setHasInterested(data.interested)
        setInterestCount(data.interest_count ?? 0)
        toast.success(data.interested ? '관심을 표시했어요' : '관심 표시를 취소했어요')
      } else {
        toast.error('관심 표시에 실패했어요')
      }
    } catch {
      toast.error('네트워크 오류가 발생했어요')
    }
    setInterestLoading(false)
  }, [user, profileUserId, profileId, interestLoading])

  return { hasInterested, interestCount, interestLoading, handleInterest }
}
