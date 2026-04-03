'use client'

import { useMemo } from 'react'
import {
  Check,
  X,
  Globe,
  Github,
  Linkedin,
  Loader2,
} from 'lucide-react'
import { useProfileDraft } from '@/src/hooks/useProfileDraft'
import type { Profile } from './types'
import { EditableField } from './EditableField'

/* ── ProfileLinksBar ──────────────────────────────────────── */

interface ProfileLinksBarProps {
  profile: Profile
  isEditable?: boolean
}

export function ProfileLinksBar({ profile, isEditable = false }: ProfileLinksBarProps) {
  const defaults = useMemo(() => ({
    portfolio_url: profile?.portfolio_url || '',
    github_url: profile?.github_url || '',
    linkedin_url: profile?.linkedin_url || '',
  }), [profile])

  const { drafts, hasPendingChanges, isPending, editField, handleSave, handleCancel } = useProfileDraft(
    profile, defaults
  )

  const hasAnyLink = profile?.portfolio_url || profile?.github_url || profile?.linkedin_url
  if (!isEditable && !hasAnyLink) return null

  const linkItems = [
    { icon: Globe, label: 'Portfolio', field: 'portfolio_url', placeholder: 'https://portfolio.com', url: profile?.portfolio_url },
    { icon: Github, label: 'GitHub', field: 'github_url', placeholder: 'https://github.com/username', url: profile?.github_url },
    { icon: Linkedin, label: 'LinkedIn', field: 'linkedin_url', placeholder: 'https://linkedin.com/in/username', url: profile?.linkedin_url },
  ] as const

  return (
    <div className="border-b border-border pb-4 mb-4">
      <div className="flex flex-wrap items-center gap-3">
        {isEditable ? (
          linkItems.map((item) => (
            <EditableField
              key={item.field}
              variant="link"
              value={(profile as unknown as Record<string, string>)?.[item.field] || ''}
              draft={drafts[item.field]}
              placeholder={item.placeholder}
              icon={item.icon}
              label={item.label}
              onEdit={editField(item.field)}
            />
          ))
        ) : (
          linkItems.map((item) =>
            item.url ? (
              <a
                key={item.field}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-txt-secondary bg-surface-sunken border border-border hover:bg-surface-card hover:text-txt-primary transition-colors rounded-full"
              >
                <item.icon size={13} className="text-txt-tertiary" />
                {item.label}
              </a>
            ) : null
          )
        )}
      </div>

      {isEditable && hasPendingChanges && (
        <div className="flex items-center justify-end gap-2 pt-3 mt-3">
          <button onClick={handleCancel} disabled={isPending} className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-txt-secondary border border-border hover:bg-surface-sunken transition-colors rounded-xl">
            <X size={10} /> 취소
          </button>
          <button onClick={handleSave} disabled={isPending} className="flex items-center gap-1 px-3 py-1 text-[10px] font-bold bg-surface-inverse text-txt-inverse border border-surface-inverse hover:bg-surface-inverse/90 transition-colors hover:opacity-90 active:scale-[0.97] disabled:opacity-50 rounded-xl">
            {isPending ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
            저장
          </button>
        </div>
      )}
    </div>
  )
}
