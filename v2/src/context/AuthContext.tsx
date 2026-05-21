'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase/client'

// V2: 매니저 1명 = Google 계정 1개. OAuth 흐름은 /api/auth/google (raw Google OAuth) 에서
// 처리하고, 콜백에서 Supabase 의 signInWithIdToken 으로 세션을 세팅. 여기서는 세션 상태만 관리.

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signInWithGoogle: () => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode
  initialUser?: User | null
}) {
  const [user, setUser] = useState<User | null>(initialUser ?? null)
  const [isLoading, setIsLoading] = useState(initialUser === undefined)

  useEffect(() => {
    let mounted = true

    if (initialUser === undefined) {
      supabase.auth
        .getUser()
        .then(({ data: { user: u } }) => {
          if (!mounted) return
          setUser(u ?? null)
          setIsLoading(false)
        })
        .catch(() => {
          if (mounted) setIsLoading(false)
        })
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      if (event === 'SIGNED_OUT') {
        setUser(null)
        return
      }
      if (session?.user) setUser(session.user)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [initialUser])

  const signInWithGoogle = () => {
    window.location.href = '/api/auth/google'
  }

  const signOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
    } catch {}
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch {}
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
