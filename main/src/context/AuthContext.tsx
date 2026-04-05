'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase/client'
import type { Tables } from '../types/database'

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  // Session is managed internally — not exposed to prevent token leakage
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
      let profileFetched = false

      // Fast path: read local session from cookies/cache (usually instant)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return
        if (session?.user) {
          const p = await fetchProfile(session.user.id)
          if (!mounted) return
          // Batch: user + profile in same tick → single render
          setUser(session.user)
          setProfile(p)
          setIsLoading(false)
          profileFetched = true
        }
      } catch { /* getSession failed — continue to authoritative path */ }

      if (!mounted) return

      // Authoritative validation: server round-trip (background)
      // If fast path succeeded, this silently verifies the session.
      // If session was revoked/expired, it will log the user out.
      try {
        const { data: { user: serverUser }, error } = await supabase.auth.getUser()
        if (!mounted) return
        if (error || !serverUser) {
          setUser(null)
          setProfile(null)
        } else if (!profileFetched) {
          const p = await fetchProfile(serverUser.id)
          if (!mounted) return
          setUser(serverUser)
          setProfile(p)
        }
      } catch { /* getUser failed */ }

      // If fast path didn't finish loading, finish it now
      if (mounted && !profileFetched) setIsLoading(false)
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        if (event === 'INITIAL_SESSION') return

        if (event === 'TOKEN_REFRESHED' && !session) {
          setUser(null)
          setProfile(null)
          return
        }

        if (event === 'SIGNED_OUT') {
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
