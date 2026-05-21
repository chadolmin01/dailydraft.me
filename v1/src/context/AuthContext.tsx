'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase/client'
import posthog from 'posthog-js'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, nickname: string) => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  signInWithGithub: () => Promise<{ error: AuthError | null }>
  signInWithDiscord: () => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Supabase 네트워크 hang 방어용 timeout. getSession/getUser가 응답 안 돌아오면
// catch 블록도 안 타서 isLoading=true 고착 → UI 영구 스켈레톤. 아래 withTimeout로 감싸
// 5초 후 reject → catch → setIsLoading(false) 보장.
const AUTH_INIT_TIMEOUT_MS = 5000
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms)
    ),
  ])
}

export function AuthProvider({ children, initialUser }: { children: React.ReactNode; initialUser?: User | null }) {
  // initialUser가 주입된 경우 첫 렌더부터 올바른 상태로 시작 → skeleton 고착 방지
  const [user, setUser] = useState<User | null>(initialUser ?? null)
  const [isLoading, setIsLoading] = useState(initialUser === undefined)

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      // initialUser가 서버에서 주입된 경우 — useState 초기값에서 user/isLoading 이미 설정됨
      if (initialUser !== undefined) {
        if (initialUser) {
          posthog.identify(initialUser.id, {
            email: initialUser.email,
            name: initialUser.user_metadata?.full_name || initialUser.user_metadata?.name,
          })
        }
        return
      }

      // initialUser prop 자체가 없는 경우 → 클라이언트에서 직접 세션 확인 (fallback)
      try {
        const { data: { session } } = await withTimeout(
          supabase.auth.getSession(),
          AUTH_INIT_TIMEOUT_MS,
          'getSession',
        )
        if (!mounted) return
        if (session?.user) {
          setUser(session.user)
          setIsLoading(false)
          posthog.identify(session.user.id, {
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          })
          // 백그라운드 서버 검증 — 명확한 세션 무효화 코드만 로그아웃
          supabase.auth.getUser().then(({ error }) => {
            if (!mounted) return
            if (error) {
              const authErrorCodes = ['session_not_found', 'user_not_found', 'bad_jwt']
              const isHardAuthError = authErrorCodes.some(code =>
                error.message?.includes(code) || (error as unknown as { code?: string }).code === code
              )
              if (isHardAuthError) {
                setUser(null)
              }
            }
          }).catch(() => {})
          return
        }
      } catch (err) {
        // getSession 실패 (네트워크 / timeout) — fallback으로 계속
        console.warn('[AuthContext] getSession failed:', (err as Error).message)
      }

      if (!mounted) return

      // 최종 fallback: 서버에서 직접 확인
      try {
        const { data: { user: serverUser }, error } = await withTimeout(
          supabase.auth.getUser(),
          AUTH_INIT_TIMEOUT_MS,
          'getUser',
        )
        if (!mounted) return
        if (!error && serverUser) {
          setUser(serverUser)
        }
      } catch (err) {
        console.warn('[AuthContext] getUser failed:', (err as Error).message)
      }

      if (mounted) setIsLoading(false)
    }

    initializeAuth()

    // Listen for auth changes — user 객체만 동기화. profile은 useProfile()이 React Query로 관리.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (event === 'INITIAL_SESSION') {
          if (session?.user) {
            setUser(session.user)
            setIsLoading(false)
          }
          return
        }

        if (event === 'SIGNED_OUT') {
          posthog.reset()
          setUser(null)
          return
        }

        if (session?.user) {
          setUser(session.user)
        } else if (event === 'TOKEN_REFRESHED') {
          // 세션 없이 TOKEN_REFRESHED → 만료
          setUser(null)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [initialUser])

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

  // Sign in with Discord OAuth
  const signInWithDiscord = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'identify email guilds',
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
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGithub,
    signInWithDiscord,
    signOut,
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
