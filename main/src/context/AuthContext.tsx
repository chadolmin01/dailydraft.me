'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase/client'
import type { Tables } from '../types/database'
import posthog from 'posthog-js'

type Profile = Tables<'profiles'>

interface AuthContextType {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, nickname: string) => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  signInWithGithub: () => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children, initialUser }: { children: React.ReactNode; initialUser?: User | null }) {
  // initialUser가 주입된 경우 첫 렌더부터 올바른 상태로 시작 → skeleton 고착 방지
  const [user, setUser] = useState<User | null>(initialUser ?? null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(initialUser === undefined)

  // Fetch user profile from database
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }, [])

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    if (user) {
      const profileData = await fetchProfile(user.id)
      setProfile(profileData)
    }
  }, [user, fetchProfile])

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      // initialUser가 서버에서 주입된 경우 — useState 초기값에서 user/isLoading 이미 설정됨
      // 여기선 posthog 식별 + profile fetch만 수행
      if (initialUser !== undefined) {
        if (initialUser) {
          posthog.identify(initialUser.id, {
            email: initialUser.email,
            name: initialUser.user_metadata?.full_name || initialUser.user_metadata?.name,
          })
          fetchProfile(initialUser.id).then(p => {
            if (mounted) setProfile(p)
          })
        }
        return
      }

      // initialUser prop 자체가 없는 경우 → 클라이언트에서 직접 세션 확인 (fallback)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return
        if (session?.user) {
          setUser(session.user)
          setIsLoading(false)
          posthog.identify(session.user.id, {
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          })
          fetchProfile(session.user.id).then(p => {
            if (mounted) setProfile(p)
          })
          // 백그라운드 서버 검증 — 명확한 세션 무효화 코드만 로그아웃
          supabase.auth.getUser().then(({ error }) => {
            if (!mounted) return
            if (error) {
              const authErrorCodes = ['session_not_found', 'user_not_found', 'bad_jwt']
              const isHardAuthError = authErrorCodes.some(code =>
                error.message?.includes(code) || (error as any).code === code
              )
              if (isHardAuthError) {
                setUser(null)
                setProfile(null)
              }
            }
          }).catch(() => {})
          return
        }
      } catch { /* getSession failed */ }

      if (!mounted) return

      // 최종 fallback: 서버에서 직접 확인
      try {
        const { data: { user: serverUser }, error } = await supabase.auth.getUser()
        if (!mounted) return
        if (!error && serverUser) {
          setUser(serverUser)
          const p = await fetchProfile(serverUser.id)
          if (mounted) setProfile(p)
        }
      } catch { /* getUser failed */ }

      if (mounted) setIsLoading(false)
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        // INITIAL_SESSION: getSession()이 null을 반환했을 때의 안전망
        // session이 있으면 복구만 수행, null인 경우는 initializeAuth에 위임
        // — 과거엔 여기서 setIsLoading(false)를 호출했지만, getSession()보다
        //   INITIAL_SESSION이 먼저 fire되는 모바일 race condition으로
        //   isLoading=false, user=null 중간 상태가 생겨 하단바가 숨겨졌음
        if (event === 'INITIAL_SESSION') {
          if (session?.user) {
            setUser(session.user)
            setIsLoading(false)
            fetchProfile(session.user.id).then(p => {
              if (mounted) setProfile(p)
            })
          }
          return
        }

        if (event === 'TOKEN_REFRESHED' && !session) {
          setUser(null)
          setProfile(null)
          return
        }

        if (event === 'SIGNED_OUT') {
          posthog.reset()
          setUser(null)
          setProfile(null)
          return
        }

        if (session?.user) {
          const profileData = await fetchProfile(session.user.id)
          if (!mounted) return
          // Batch: user + profile in same tick → single render
          setUser(session.user)
          setProfile(profileData)
        } else {
          setUser(null)
          setProfile(null)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  // Sign in with email/password
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  // Sign up with email/password
  const signUp = async (email: string, password: string, nickname: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname,
        },
      },
    })

    // Create profile after signup
    if (!error && data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: data.user.id,
        nickname,
        contact_email: email,
      })
      if (profileError) {
        console.error('Failed to create profile:', profileError)
        return { error: new AuthError('계정은 생성되었지만 프로필 생성에 실패했습니다. 다시 로그인해주세요.') }
      }
    }

    return { error }
  }

  // Sign in with Google OAuth
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    })
    return { error }
  }

  // Sign in with GitHub OAuth
  const signInWithGithub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error }
  }

  // Sign out
  const signOut = async () => {
    try {
      // Call server-side signout to clear httpOnly auth cookies
      await fetch('/api/auth/signout', { method: 'POST' })
    } catch (e) {
      console.error('Server signout error:', e)
    }
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch (e) {
      console.error('Client signout error:', e)
    }
    setUser(null)
    setProfile(null)
  }

  const value: AuthContextType = {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGithub,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
