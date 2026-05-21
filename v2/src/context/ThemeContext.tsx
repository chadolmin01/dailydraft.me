'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'light', toggleTheme: () => {} })

// SSR/hydration 전에 올바른 초기값을 결정 — FOUC 방지
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem('draft-theme') as Theme | null
  return stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  // 초기 마운트 시 DOM에 .dark 클래스 동기화
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('draft-theme', next)
      document.documentElement.classList.toggle('dark', next === 'dark')
      return next
    })
  }, [])

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
