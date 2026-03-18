import { useMemo } from 'react'
import type { Profile } from '@/components/profile/types'

export function useProfileCompletion(profile: Profile | null | undefined) {
  return useMemo(() => {
    const bio = (profile as Record<string, unknown> | null)?.bio as string | null
    const skills = profile?.skills as Array<{ name: string; level: string }> | null

    const fields = [
      { label: '닉네임', done: !!profile?.nickname },
      { label: '포지션', done: !!profile?.desired_position },
      { label: '대학교', done: !!profile?.university },
      { label: '자기소개', done: !!bio },
      { label: '기술 스택', done: !!(skills && skills.length > 0) },
    ]
    const completedCount = fields.filter(f => f.done).length
    const pct = Math.round((completedCount / fields.length) * 100)

    return { fields, completedCount, pct }
  }, [profile])
}
