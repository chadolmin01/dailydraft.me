'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase/client'

export default function DevOnboardingPage() {
  const router = useRouter()
  const { user, profile, isLoading, refreshProfile } = useAuth()
  const [resetting, setResetting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-bg flex items-center justify-center font-mono text-sm text-gray-400">
        Loading...
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-surface-bg flex flex-col items-center justify-center gap-4 font-mono">
        <p className="text-sm text-gray-500">로그인이 필요합니다</p>
        <button
          onClick={() => router.push('/login')}
          className="px-4 py-2 bg-black text-white text-sm rounded-sm hover:bg-gray-800 transition"
        >
          로그인하기
        </button>
      </div>
    )
  }

  const handleReset = async () => {
    setResetting(true)
    setMessage(null)

    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_completed: false })
      .eq('user_id', user.id)

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      await refreshProfile()
      setMessage('onboarding_completed → false')
    }
    setResetting(false)
  }

  const handleGoOnboarding = async () => {
    // Reset first, then navigate
    await supabase
      .from('profiles')
      .update({ onboarding_completed: false })
      .eq('user_id', user.id)
    router.push('/onboarding')
  }

  return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl p-6 shadow-sm font-mono">
        <div className="flex items-center gap-2 mb-6">
          <div className="px-2 py-0.5 bg-yellow-100 border border-yellow-300 rounded text-[10px] font-bold uppercase text-yellow-700">
            DEV
          </div>
          <h1 className="text-lg font-bold tracking-tight">Onboarding Debug</h1>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-xs text-gray-500 uppercase">User ID</span>
            <span className="text-xs font-medium truncate max-w-[200px]">{user.id}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-xs text-gray-500 uppercase">Email</span>
            <span className="text-xs font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-xs text-gray-500 uppercase">Nickname</span>
            <span className="text-xs font-medium">{profile?.nickname || '—'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-xs text-gray-500 uppercase">Profile Exists</span>
            <span className={`text-xs font-bold ${profile ? 'text-green-600' : 'text-red-600'}`}>
              {profile ? 'YES' : 'NO'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-xs text-gray-500 uppercase">Onboarding Completed</span>
            <span className={`text-xs font-bold ${profile?.onboarding_completed ? 'text-green-600' : 'text-orange-600'}`}>
              {profile?.onboarding_completed ? 'TRUE' : 'FALSE'}
            </span>
          </div>
        </div>

        {message && (
          <div className={`mb-4 px-3 py-2 rounded text-xs ${message.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={handleReset}
            disabled={resetting}
            className="w-full px-4 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-sm hover:bg-orange-600 transition disabled:opacity-50"
          >
            {resetting ? 'Resetting...' : 'Reset Onboarding Status'}
          </button>

          <button
            onClick={handleGoOnboarding}
            className="w-full px-4 py-2.5 bg-black text-white text-sm font-bold rounded-sm hover:bg-gray-800 transition"
          >
            Reset & Go to Onboarding →
          </button>

          <button
            onClick={() => router.push('/explore')}
            className="w-full px-4 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-sm border border-gray-200 hover:bg-gray-50 transition"
          >
            Back to Explore
          </button>
        </div>

        <p className="mt-4 text-[10px] text-gray-400 text-center">
          이 페이지는 개발 전용입니다. 프로덕션에서는 /dev/ 경로를 비활성화하세요.
        </p>
      </div>
    </div>
  )
}
