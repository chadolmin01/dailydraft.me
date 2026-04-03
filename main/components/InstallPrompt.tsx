'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { X, Download, Share, Plus, ChevronDown } from 'lucide-react'
import { useAuth } from '@/src/context/AuthContext'

// localStorage key — 닫으면 3일간 미노출
const DISMISS_KEY = 'draft_install_dismissed'
const DISMISS_DAYS = 3

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream
}

function isDismissed() {
  try {
    const val = localStorage.getItem(DISMISS_KEY)
    if (!val) return false
    const dismissedAt = parseInt(val, 10)
    return Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

export function InstallPrompt() {
  const { isAuthenticated } = useAuth()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)
  const prevAuthRef = useRef<boolean | null>(null)

  const tryShow = useCallback(() => {
    if (isStandalone() || isDismissed()) return
    if (typeof window !== 'undefined' && window.innerWidth >= 768) return
    setVisible(true)
  }, [])

  useEffect(() => {
    if (isStandalone() || isDismissed()) return
    if (window.innerWidth >= 768) return

    // Android: beforeinstallprompt — 즉시 표시 안 하고 저장만
    const installHandler = (e: Event) => {
      e.preventDefault()
      const prompt = e as BeforeInstallPromptEvent
      deferredPromptRef.current = prompt
      setDeferredPrompt(prompt)
    }
    window.addEventListener('beforeinstallprompt', installHandler)

    // 행동 기반 트리거 이벤트 수신
    const promptHandler = () => tryShow()
    window.addEventListener('draft:pwa-prompt', promptHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', installHandler)
      window.removeEventListener('draft:pwa-prompt', promptHandler)
    }
  }, [tryShow])

  // 로그인 직후 감지 — false → true 전환 시 1.5초 후 표시
  useEffect(() => {
    if (prevAuthRef.current === false && isAuthenticated) {
      const timer = setTimeout(() => tryShow(), 1500)
      return () => clearTimeout(timer)
    }
    prevAuthRef.current = isAuthenticated
  }, [isAuthenticated, tryShow])

  const dismiss = useCallback(() => {
    setClosing(true)
    setTimeout(() => {
      setVisible(false)
      setClosing(false)
      setShowIOSGuide(false)
      try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch {}
    }, 300)
  }, [])

  const handleInstall = useCallback(async () => {
    const prompt = deferredPromptRef.current ?? deferredPrompt
    if (prompt) {
      // Android: 네이티브 설치 프롬프트 트리거
      await prompt.prompt()
      const { outcome } = await prompt.userChoice
      if (outcome === 'accepted') {
        dismiss()
      }
      deferredPromptRef.current = null
      setDeferredPrompt(null)
    } else {
      // iOS 또는 prompt 미지원 — 수동 안내 표시
      setShowIOSGuide(true)
    }
  }, [deferredPrompt, dismiss])

  if (!visible) return null

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[400] md:hidden transition-transform duration-300 ease-out ${
        closing ? '-translate-y-full' : 'translate-y-0 animate-slideDown'
      }`}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
        .animate-slideDown { animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
      `}} />

      <div className="bg-surface-inverse text-txt-inverse border-b border-border shadow-lg">
        {/* 메인 배너 */}
        {!showIOSGuide ? (
          <div className="flex items-center gap-3 px-4 py-3">
            {/* 앱 아이콘 */}
            <div className="w-10 h-10 bg-white flex items-center justify-center shrink-0">
              <span className="text-black font-black text-lg font-mono">D</span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight">Draft 앱으로 열기</p>
              <p className="text-[10px] font-mono text-txt-inverse/60 mt-0.5">
                홈 화면에 추가하면 앱처럼 사용할 수 있어요
              </p>
            </div>

            <button
              onClick={handleInstall}
              className="flex items-center gap-1.5 px-3 py-2 bg-white text-black text-xs font-bold border border-white shrink-0 active:scale-95 transition-transform"
            >
              <Download size={14} />
              설치
            </button>

            <button
              onClick={dismiss}
              className="p-1.5 text-txt-inverse/50 hover:text-txt-inverse shrink-0"
              aria-label="닫기"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          /* iOS 수동 설치 가이드 */
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold">홈 화면에 추가하는 방법</p>
              <button
                onClick={dismiss}
                className="p-1 text-txt-inverse/50 hover:text-txt-inverse"
                aria-label="닫기"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-white/10 flex items-center justify-center shrink-0 text-[10px] font-bold">1</div>
                <div className="flex-1">
                  <p className="text-[0.8125rem] font-medium flex items-center gap-1.5">
                    하단의 <Share size={14} className="text-brand" /> 공유 버튼을 탭하세요
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-white/10 flex items-center justify-center shrink-0 text-[10px] font-bold">2</div>
                <div className="flex-1">
                  <p className="text-[0.8125rem] font-medium flex items-center gap-1.5">
                    <Plus size={14} className="text-brand" /> &quot;홈 화면에 추가&quot;를 탭하세요
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-white/10 flex items-center justify-center shrink-0 text-[10px] font-bold">3</div>
                <div className="flex-1">
                  <p className="text-[0.8125rem] font-medium">우측 상단 &quot;추가&quot;를 탭하면 완료!</p>
                </div>
              </div>
            </div>

            {/* Safari 하단 공유 버튼 가리키는 화살표 */}
            <div className="flex justify-center mt-3 text-txt-inverse/40">
              <ChevronDown size={20} className="animate-bounce" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
