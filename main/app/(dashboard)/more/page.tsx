'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ViewTransitionLink as Link } from '@/components/ui/ViewTransitionLink'
import { MessageSquare, Sun, Moon, LogOut, Shield, Building2, ChevronRight, Plus, Download, Share, Smartphone, Users, GraduationCap } from 'lucide-react'
import { useAuth } from '@/src/context/AuthContext'
import { useProfile } from '@/src/hooks/useProfile'
import { useAdmin } from '@/src/hooks/useAdmin'
import { useInstitutionAdmin } from '@/src/hooks/useInstitutionAdmin'
import { useTheme } from '@/src/context/ThemeContext'
import { useUnreadCount } from '@/src/hooks/useMessages'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function useInstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)

  useEffect(() => {
    // 이미 설치된 경우
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as unknown as { standalone?: boolean }).standalone === true
    setIsInstalled(standalone)

    // iOS 감지
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent))

    // Android: beforeinstallprompt 캡처
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setIsInstalled(true)
      setDeferredPrompt(null)
    } else {
      setShowIOSGuide(true)
    }
  }, [deferredPrompt])

  return { isInstalled, isIOS, canInstall: !!deferredPrompt || isIOS, install, showIOSGuide, setShowIOSGuide }
}

export default function MorePage() {
  const { signOut, user } = useAuth()
  const { data: profile } = useProfile()
  const { isAdmin } = useAdmin()
  const { isInstitutionAdmin } = useInstitutionAdmin()
  const { theme, toggleTheme } = useTheme()
  const { data: msgUnread = 0 } = useUnreadCount()
  const { isInstalled, isIOS, canInstall, install, showIOSGuide, setShowIOSGuide } = useInstallApp()

  const displayName = profile?.nickname || user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''

  const handleSignOut = async () => {
    try { await signOut() } catch { /* ignore */ }
    window.location.href = '/'
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24">
      {/* 헤더 */}
      <h1 className="text-[22px] font-bold text-txt-primary mb-6">더보기</h1>

      {/* 프로필 요약 */}
      <Link
        href="/profile"
        className="flex items-center gap-4 bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl p-4 mb-4 active:opacity-80 transition-opacity"
      >
        <div className="w-12 h-12 bg-[#5E6AD2] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
          {displayName.substring(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-txt-primary truncate">{displayName}</p>
          <p className="text-[13px] text-txt-tertiary truncate">{user?.email || ''}</p>
        </div>
        <ChevronRight size={18} className="text-txt-disabled shrink-0" />
      </Link>

      {/* 탐색 — 사람·클럽 */}
      <div className="bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl overflow-hidden mb-4">
        <p className="px-4 pt-3 pb-1 text-[11px] font-medium text-txt-disabled uppercase tracking-wider">탐색</p>
        <Link
          href="/network"
          className="flex items-center gap-4 px-4 py-3.5 active:bg-[#E5E5EA] dark:active:bg-[#2C2C2E] transition-colors"
        >
          <Users size={20} className="text-[#5E6AD2] shrink-0" />
          <span className="flex-1 text-[15px] text-txt-primary">사람 찾기</span>
          <ChevronRight size={16} className="text-txt-disabled shrink-0" />
        </Link>
        <div className="mx-4 border-t border-border/30" />
        <Link
          href="/clubs"
          className="flex items-center gap-4 px-4 py-3.5 active:bg-[#E5E5EA] dark:active:bg-[#2C2C2E] transition-colors"
        >
          <GraduationCap size={20} className="text-[#5E6AD2] shrink-0" />
          <span className="flex-1 text-[15px] text-txt-primary">클럽 찾기</span>
          <ChevronRight size={16} className="text-txt-disabled shrink-0" />
        </Link>
      </div>

      {/* 메뉴 그룹 1: 주요 기능 */}
      <div className="bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl overflow-hidden mb-4">
        <Link
          href="/messages"
          className="flex items-center gap-4 px-4 py-3.5 active:bg-[#E5E5EA] dark:active:bg-[#2C2C2E] transition-colors"
        >
          <MessageSquare size={20} className="text-[#5E6AD2] shrink-0" />
          <span className="flex-1 text-[15px] text-txt-primary">메시지</span>
          {msgUnread > 0 && (
            <span className="min-w-5 h-5 flex items-center justify-center px-1.5 bg-indicator-alert text-white text-[11px] font-bold rounded-full">
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
          <Plus size={20} className="text-[#5E6AD2] shrink-0" />
          <span className="flex-1 text-[15px] text-txt-primary">새 프로젝트</span>
          <ChevronRight size={16} className="text-txt-disabled shrink-0" />
        </Link>
      </div>

      {/* 앱 설치 */}
      {!isInstalled && (
        <div className="bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl overflow-hidden mb-4">
          <button
            onClick={install}
            className="w-full flex items-center gap-4 px-4 py-3.5 active:bg-[#E5E5EA] dark:active:bg-[#2C2C2E] transition-colors"
          >
            <Smartphone size={20} className="text-[#34C759] shrink-0" />
            <div className="flex-1 text-left">
              <span className="text-[15px] text-txt-primary block">Draft 앱 설치</span>
              <span className="text-[12px] text-txt-tertiary">홈 화면에 추가하면 앱처럼 전체 화면으로 사용하실 수 있습니다</span>
            </div>
            <Download size={16} className="text-txt-disabled shrink-0" />
          </button>

          {/* iOS 설치 가이드 */}
          {showIOSGuide && (
            <div className="px-4 pb-4 pt-1 space-y-2.5 border-t border-border/30 mx-4 pt-3">
              <p className="text-[13px] font-semibold text-txt-primary">홈 화면에 추가하는 방법</p>
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 bg-[#E5E5EA] dark:bg-[#3A3A3C] rounded-md flex items-center justify-center text-[11px] font-bold text-txt-secondary shrink-0">1</span>
                <p className="text-[13px] text-txt-secondary flex items-center gap-1">
                  하단의 <Share size={13} className="text-[#5E6AD2]" /> 공유 버튼 탭
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 bg-[#E5E5EA] dark:bg-[#3A3A3C] rounded-md flex items-center justify-center text-[11px] font-bold text-txt-secondary shrink-0">2</span>
                <p className="text-[13px] text-txt-secondary flex items-center gap-1">
                  <Plus size={13} className="text-[#5E6AD2]" /> &quot;홈 화면에 추가&quot; 탭
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 bg-[#E5E5EA] dark:bg-[#3A3A3C] rounded-md flex items-center justify-center text-[11px] font-bold text-txt-secondary shrink-0">3</span>
                <p className="text-[13px] text-txt-secondary">&quot;추가&quot;를 탭하면 완료!</p>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-[12px] text-txt-tertiary hover:text-txt-secondary mt-1"
              >
                닫기
              </button>
            </div>
          )}
        </div>
      )}

      {/* 설정 */}
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
              <Building2 size={20} className="text-[#5E6AD2] shrink-0" />
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
                <Shield size={20} className="text-[#5E6AD2] shrink-0" />
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
