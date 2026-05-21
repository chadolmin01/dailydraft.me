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
      toast.error('본인 프로필에는 관심 표시를 남길 수 없습니다')
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
        toast.success(data.interested ? '관심을 표시했습니다' : '관심 표시를 취소했습니다', {
          description: data.interested
            ? '상대방에게 익명으로 관심 숫자만 전달됩니다.'
            : '관심 숫자가 1 감소합니다.',
        })
      } else {
        toast.error('관심 표시에 실패했습니다', {
          description: '잠시 후 다시 시도해 주세요.',
        })
      }
    } catch {
      toast.error('네트워크 오류가 발생했습니다', {
        description: '인터넷 연결을 확인하신 뒤 다시 시도해 주세요.',
      })
    }
    setInterestLoading(false)
  }, [user, profileUserId, profileId, interestLoading])

  return { hasInterested, interestCount, interestLoading, handleInterest }
}
