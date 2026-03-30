'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, ArrowRight } from 'lucide-react'
import { useAuth } from '@/src/context/AuthContext'
import { useProfileCompletion } from '@/src/hooks/useProfileCompletion'

const DISMISS_KEY_PREFIX = 'profile-nudge-dismissed-'

function getDismissKey() {
  const d = new Date()
  return `${DISMISS_KEY_PREFIX}${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function ProfileCompletionBanner() {
  const { isAuthenticated, profile } = useAuth()
  const { fields, pct } = useProfileCompletion(profile)
  const [dismissed, setDismissed] = useState(true) // default hidden to avoid flash

  useEffect(() => {
    setDismissed(localStorage.getItem(getDismissKey()) === '1')
  }, [])

  if (!isAuthenticated || !profile || pct >= 100 || dismissed) return null

  const incomplete = fields.filter(f => !f.done).map(f => f.label)

  return (
    <div className="border border-border-strong bg-surface-card px-4 py-3 mb-4 flex items-center gap-4">
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-[0.625rem] font-medium text-txt-tertiary">
          PROFILE
        </span>
        <div className="w-16 h-1.5 bg-surface-sunken overflow-hidden">
          <div
            className="h-full bg-brand transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[0.625rem] font-mono font-bold text-txt-primary">{pct}%</span>
      </div>

      <p className="text-xs text-txt-secondary flex-1 min-w-0 truncate">
        {incomplete.join(', ')} 추가하면 매칭 정확도가 올라가요
      </p>

      <Link
        href="/profile/edit"
        className="shrink-0 px-3 py-1.5 bg-surface-inverse text-txt-inverse text-xs font-bold border border-surface-inverse hover:bg-surface-inverse/90 transition-colors flex items-center gap-1"
      >
        완성하기 <ArrowRight size={12} />
      </Link>

      <button
        onClick={() => {
          localStorage.setItem(getDismissKey(), '1')
          setDismissed(true)
        }}
        className="shrink-0 text-txt-disabled hover:text-txt-primary transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  )
}
