'use client'

import { useParams, useRouter } from 'next/navigation'
import { useClub } from '@/src/hooks/useClub'

export default function ClubPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { data: club, isLoading } = useClub(slug)

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-border-default/30 rounded w-48" />
          <div className="h-32 bg-border-default/30 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!club) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-12 text-center">
        <p className="text-txt-tertiary">클럽을 찾을 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-6">
      {/* Club Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-brand-bg flex items-center justify-center text-brand font-extrabold text-xl shrink-0">
          {club.name[0]}
        </div>
        <div>
          <h1 className="text-xl font-bold text-txt-primary">{club.name}</h1>
          {club.description && (
            <p className="text-sm text-txt-secondary mt-0.5">{club.description}</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => router.push(`/clubs/${slug}/settings/discord`)}
          className="flex items-center gap-4 p-4 bg-surface-card border border-border-default rounded-2xl hover:border-brand transition-colors text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#5865F2]/10 flex items-center justify-center text-[#5865F2] shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-txt-primary group-hover:text-brand transition-colors">Discord 연동 설정</div>
            <div className="text-xs text-txt-tertiary">채널 매핑, AI 톤, 스케줄 설정</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-txt-disabled shrink-0">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <button
          onClick={() => router.push(`/clubs/${slug}/settings/discord`)}
          className="flex items-center gap-4 p-4 bg-surface-card border border-border-default rounded-2xl hover:border-brand transition-colors text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center text-brand shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-txt-primary group-hover:text-brand transition-colors">클럽 설정</div>
            <div className="text-xs text-txt-tertiary">이름, 설명, 공개 범위</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-txt-disabled shrink-0">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
