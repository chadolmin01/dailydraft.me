'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, ArrowRight, User } from 'lucide-react'
import { useAuth } from '@/src/context/AuthContext'
import { useProfile } from '@/src/hooks/useProfile'
import { useProfileCompletion } from '@/src/hooks/useProfileCompletion'

const DISMISS_KEY_PREFIX = 'profile-nudge-dismissed-'

function getDismissKey() {
  const d = new Date()
  return `${DISMISS_KEY_PREFIX}${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function ProfileCompletionBanner() {
  const { isAuthenticated } = useAuth()
  const { data: profile } = useProfile()
  const { fields, pct } = useProfileCompletion(profile ?? null)
  const [dismissed, setDismissed] = useState(true) // default hidden to avoid flash

  useEffect(() => {
    setDismissed(localStorage.getItem(getDismissKey()) === '1')
  }, [])

  if (!isAuthenticated || !profile || pct >= 100 || dismissed) return null

  const incomplete = fields.filter(f => !f.done).map(f => f.label)
  const displayFields = incomplete.slice(0, 3)
  const remaining = incomplete.length - displayFields.length

  return (
    <div className="group relative overflow-hidden bg-surface-card rounded-xl shadow-sm mb-4 transition-all duration-300 hover:shadow-md">
      {/* Progress accent bar */}
      <div className="absolute top-0 left-0 h-[2px] bg-brand transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-surface-sunken" />
      <div className="absolute top-0 left-0 h-[2px] bg-brand transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />

      <div className="flex items-center gap-4 px-4 py-3.5">
        {/* Icon + percentage */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-xl bg-surface-sunken border border-border flex items-center justify-center">
            <User size={16} className="text-txt-tertiary" />
          </div>
          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 text-[0.5rem] font-mono font-bold bg-surface-inverse text-txt-inverse rounded-full border-2 border-surface-card">
            {pct}%
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-medium text-txt-tertiary uppercase tracking-wider">PROFILE COMPLETION</span>
          </div>
          <p className="text-xs text-txt-secondary truncate">
            <span className="font-semibold text-txt-primary">{displayFields.join(', ')}</span>
            {remaining > 0 && <span className="text-txt-tertiary"> 외 {remaining}개</span>}
            <span className="text-txt-tertiary"> 추가하면 매칭률이 올라가요</span>
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/profile"
          className="shrink-0 px-3.5 py-2 bg-surface-inverse text-txt-inverse text-xs font-bold rounded-xl border border-surface-inverse hover:bg-brand transition-colors duration-300 flex items-center gap-1.5"
        >
          완성하기 <ArrowRight size={12} />
        </Link>

        {/* Dismiss */}
        <button
          onClick={() => {
            localStorage.setItem(getDismissKey(), '1')
            setDismissed(true)
          }}
          className="shrink-0 p-1.5 text-txt-disabled hover:text-txt-secondary transition-colors rounded-lg hover:bg-surface-sunken"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
