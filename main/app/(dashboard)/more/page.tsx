'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MessageSquare, Sun, Moon, LogOut, Shield, Building2, ChevronRight, Plus } from 'lucide-react'
import { useAuth } from '@/src/context/AuthContext'
import { useAdmin } from '@/src/hooks/useAdmin'
import { useInstitutionAdmin } from '@/src/hooks/useInstitutionAdmin'
import { useTheme } from '@/src/context/ThemeContext'
import { useUnreadCount } from '@/src/hooks/useMessages'

export default function MorePage() {
  const router = useRouter()
  const { signOut, user, profile } = useAuth()
  const { isAdmin } = useAdmin()
  const { isInstitutionAdmin } = useInstitutionAdmin()
  const { theme, toggleTheme } = useTheme()
  const { data: msgUnread = 0 } = useUnreadCount()

  const displayName = profile?.nickname || user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''

  const handleSignOut = async () => {
    try { await signOut() } catch { /* ignore */ }
    window.location.href = '/'
  }

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 pb-24">
      {/* 헤더 */}
      <h1 className="text-[22px] font-bold text-txt-primary mb-6">더보기</h1>

      {/* 프로필 요약 */}
      <Link
        href="/profile"
        className="flex items-center gap-4 bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl p-4 mb-4 active:opacity-80 transition-opacity"
      >
        <div className="w-12 h-12 bg-[#3182F6] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
          {displayName.substring(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-txt-primary truncate">{displayName}</p>
          <p className="text-[13px] text-txt-tertiary truncate">{user?.email || ''}</p>
        </div>
        <ChevronRight size={18} className="text-txt-disabled shrink-0" />
      </Link>

      {/* 메뉴 그룹 1: 주요 기능 */}
      <div className="bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl overflow-hidden mb-4">
        <Link
          href="/messages"
          className="flex items-center gap-4 px-4 py-3.5 active:bg-[#E5E5EA] dark:active:bg-[#2C2C2E] transition-colors"
        >
          <MessageSquare size={20} className="text-[#3182F6] shrink-0" />
          <span className="flex-1 text-[15px] text-txt-primary">메시지</span>
          {msgUnread > 0 && (
            <span className="min-w-[1.25rem] h-5 flex items-center justify-center px-1.5 bg-indicator-alert text-white text-[11px] font-bold rounded-full">
              {msgUnread > 9 ? '9+' : msgUnread}
            </span>
          )}
          <ChevronRight size={16} className="text-txt-disabled shrink-0" />
        </Link>

        <div className="mx-4 border-t border-border/30" />

        <Link
          href="/projects/new"
          className="flex items-center gap-4 px-4 py-3.5 active:bg-[#E5E5EA] dark:active:bg-[#2C2C2E] transition-colors"
        >
          <Plus size={20} className="text-[#3182F6] shrink-0" />
          <span className="flex-1 text-[15px] text-txt-primary">새 프로젝트</span>
          <ChevronRight size={16} className="text-txt-disabled shrink-0" />
        </Link>
      </div>

      {/* 메뉴 그룹 2: 설정 */}
      <div className="bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl overflow-hidden mb-4">
        <button
          onClick={() => { import('@/src/utils/haptic').then(h => h.hapticLight()); toggleTheme() }}
          className="w-full flex items-center gap-4 px-4 py-3.5 active:bg-[#E5E5EA] dark:active:bg-[#2C2C2E] transition-colors"
        >
          {theme === 'dark' ? <Sun size={20} className="text-[#FF9F0A] shrink-0" /> : <Moon size={20} className="text-[#5E5CE6] shrink-0" />}
          <span className="flex-1 text-[15px] text-txt-primary text-left">
            {theme === 'dark' ? '라이트 모드' : '다크 모드'}
          </span>
          <span className="text-[13px] text-txt-tertiary">{theme === 'dark' ? '켜짐' : '꺼짐'}</span>
        </button>
      </div>

      {/* 관리자 메뉴 */}
      {(isAdmin || isInstitutionAdmin) && (
        <div className="bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl overflow-hidden mb-4">
          <p className="px-4 pt-3 pb-1 text-[11px] font-medium text-txt-disabled uppercase tracking-wider">관리</p>
          {isInstitutionAdmin && (
            <Link
              href="/institution"
              className="flex items-center gap-4 px-4 py-3.5 active:bg-[#E5E5EA] dark:active:bg-[#2C2C2E] transition-colors"
            >
              <Building2 size={20} className="text-[#3182F6] shrink-0" />
              <span className="flex-1 text-[15px] text-txt-primary">기관 대시보드</span>
              <ChevronRight size={16} className="text-txt-disabled shrink-0" />
            </Link>
          )}
          {isAdmin && (
            <>
              {isInstitutionAdmin && <div className="mx-4 border-t border-border/30" />}
              <Link
                href="/admin"
                className="flex items-center gap-4 px-4 py-3.5 active:bg-[#E5E5EA] dark:active:bg-[#2C2C2E] transition-colors"
              >
                <Shield size={20} className="text-[#3182F6] shrink-0" />
                <span className="flex-1 text-[15px] text-txt-primary">관리자 대시보드</span>
                <ChevronRight size={16} className="text-txt-disabled shrink-0" />
              </Link>
            </>
          )}
        </div>
      )}

      {/* 로그아웃 */}
      <div className="bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl overflow-hidden">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-4 px-4 py-3.5 active:bg-[#E5E5EA] dark:active:bg-[#2C2C2E] transition-colors"
        >
          <LogOut size={20} className="text-[#FF3B30] shrink-0" />
          <span className="flex-1 text-[15px] text-[#FF3B30] text-left">로그아웃</span>
        </button>
      </div>
    </div>
  )
}
