'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Compass,
  MessageSquare,
  User,
  Briefcase,
  LogOut,
  Bell,
  Settings,
  AlertCircle,
  Gift,
  Crown,
  Building2,
  Home,
  PanelLeftClose,
  PanelLeft,
  Plus,
} from 'lucide-react'
import { useAuth } from '@/src/context/AuthContext'
import { useProfile } from '@/src/hooks/useProfile'
import { useAdmin } from '@/src/hooks/useAdmin'
import { useInstitutionAdmin } from '@/src/hooks/useInstitutionAdmin'
import { usePremium } from '@/src/hooks/usePremium'
import { useUnreadCount } from '@/src/hooks/useMessages'
import { useMyOperatorClubs } from '@/src/hooks/useMyOperatorClubs'
import InviteCodeModal from '@/components/InviteCodeModal'

const EXPANDED_KEY = 'sidebar-expanded'

/**
 * Expandable Sidebar (Linear/Notion 하이브리드 패턴).
 *
 * - Collapsed (w-16): 아이콘만. 기존 narrow rail과 동일.
 * - Expanded (w-60): 섹션 헤더 + 라벨 + 운영 클럽 이름. Linear 스타일.
 * - 토글 버튼으로 전환, localStorage로 상태 영속.
 *
 * 왜 토글 방식: 모바일에서는 TopNavbar가 nav 담당이고 Sidebar는 데스크톱 전용이라
 * 강제 expansion 안 하고 사용자가 화면 넓이에 따라 선택하게 함.
 */
export const Sidebar: React.FC = () => {
  const pathname = usePathname()
  const { signOut, user } = useAuth()
  const { data: profile } = useProfile()
  const { isAdmin } = useAdmin()
  const { isInstitutionAdmin } = useInstitutionAdmin()
  const { isPremium, refetch: refetchPremium } = usePremium()
  const { data: unreadMessages = 0 } = useUnreadCount()
  const { clubs: operatorClubs, isOperator } = useMyOperatorClubs()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  // Expansion state — localStorage 영속. SSR 기본값은 collapsed.
  const [expanded, setExpanded] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // hydrate 후에만 localStorage 읽어 적용 (SSR mismatch 방지)
    if (typeof window !== 'undefined') {
      setExpanded(localStorage.getItem(EXPANDED_KEY) === '1')
    }
  }, [])

  const toggleExpanded = () => {
    const next = !expanded
    setExpanded(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem(EXPANDED_KEY, next ? '1' : '0')
    }
  }

  // "홈"을 최상단에 — /dashboard Triage Home으로 실제 진입하는 유일한 nav.
  // 로그인 redirect도 /dashboard로 바뀌어서, 홈이 정말로 앱의 시작점이 됨.
  const navItems = [
    { id: 'dashboard', icon: Home, label: '홈', path: '/dashboard' },
    { id: 'explore', icon: Compass, label: '탐색', path: '/explore' },
    { id: 'projects', icon: Briefcase, label: '내 프로젝트', path: '/projects' },
    { id: 'profile', icon: User, label: '프로필', path: '/profile' },
    { id: 'messages', icon: MessageSquare, label: '메시지', path: '/messages' },
  ]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  const handleMenuAction = async (action: string) => {
    if (action === 'invite-code') setIsInviteModalOpen(true)
    if (action === 'signout') {
      try {
        await signOut()
        window.location.href = '/'
      } catch (error) {
        console.error('Sign out error:', error)
      }
    }
    setIsMenuOpen(false)
  }

  const closeMenu = () => setIsMenuOpen(false)

  const getActiveTab = () => pathname.split('/')[1] || 'dashboard'

  const widthClass = expanded ? 'w-60' : 'w-16'

  return (
    <div
      className={`${widthClass} flex-shrink-0 bg-surface-card border-r border-border flex flex-col h-screen sticky top-0 z-50 transition-[width] duration-200 ease-out`}
    >

      {/* ── 상단: 로고 + 토글 ── */}
      <div className={`flex items-center gap-2 pt-6 pb-4 ${expanded ? 'px-4' : 'justify-center px-0'}`}>
        <Link href="/dashboard" className="relative group shrink-0" aria-label="Home">
          <div
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors
              ${getActiveTab() === 'dashboard'
                ? 'bg-surface-inverse text-txt-inverse shadow-sm'
                : 'bg-surface-card text-txt-primary border border-border hover:bg-surface-inverse hover:text-txt-inverse hover:shadow-md active:scale-[0.97]'
              }`}
          >
            <span className="font-black text-base leading-none">D</span>
          </div>
          {!expanded && (
            <Tooltip>Draft</Tooltip>
          )}
        </Link>
        {expanded && (
          <>
            <span className="font-bold text-[15px] tracking-tight text-txt-primary flex-1">Draft</span>
            <button
              onClick={toggleExpanded}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-txt-tertiary hover:text-txt-primary hover:bg-surface-sunken transition-colors shrink-0"
              aria-label="사이드바 접기"
            >
              <PanelLeftClose size={16} />
            </button>
          </>
        )}
      </div>

      {!expanded && (
        <button
          onClick={toggleExpanded}
          className="mx-auto mb-3 w-8 h-8 flex items-center justify-center rounded-lg text-txt-tertiary hover:text-txt-primary hover:bg-surface-sunken transition-colors relative group"
          aria-label="사이드바 펼치기"
        >
          <PanelLeft size={14} />
          <Tooltip>펼치기</Tooltip>
        </button>
      )}

      {/* ── Scrollable middle ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-3">

        {expanded && <SectionHeader>메뉴</SectionHeader>}

        {/* Main nav */}
        <div className={`flex flex-col gap-1 ${!expanded ? 'items-center' : ''}`}>
          {navItems.map((item) => {
            const isActive = getActiveTab() === item.id
            return (
              <Link
                key={item.id}
                href={item.path}
                className={`${expanded ? 'flex items-center gap-3 px-3 py-2 w-full' : 'w-10 h-10 flex items-center justify-center mx-auto'} rounded-lg relative group transition-colors
                  ${isActive
                    ? 'bg-brand-bg text-brand'
                    : 'text-txt-tertiary hover:text-txt-primary hover:bg-surface-sunken'
                  }`}
              >
                <item.icon size={expanded ? 16 : 20} strokeWidth={1.5} className="shrink-0" />
                {expanded && (
                  <span className={`text-[13px] font-medium truncate ${isActive ? 'text-brand' : ''}`}>
                    {item.label}
                  </span>
                )}
                {item.id === 'messages' && unreadMessages > 0 && (
                  <span className={`${expanded ? 'ml-auto' : 'absolute -top-0.5 -right-0.5'} min-w-[16px] h-4 px-1 flex items-center justify-center bg-brand text-white text-[10px] font-bold rounded-full`}>
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
                {!expanded && <Tooltip>{item.label}</Tooltip>}
              </Link>
            )
          })}
        </div>

        {/* 운영 섹션 — 운영자만 */}
        {isOperator && (
          <>
            <div className={`${expanded ? 'mt-5' : 'w-8 h-px bg-border mx-auto my-3'}`} aria-hidden>
              {expanded && (
                <div className="flex items-center justify-between mb-2 px-3">
                  <span className="text-[10px] font-bold text-txt-tertiary uppercase tracking-wider">운영</span>
                  <Link
                    href="/clubs/new"
                    className="w-5 h-5 flex items-center justify-center rounded-md text-txt-tertiary hover:bg-surface-sunken hover:text-txt-primary transition-colors"
                    aria-label="새 클럽"
                  >
                    <Plus size={12} />
                  </Link>
                </div>
              )}
            </div>

            <div className={`flex flex-col gap-1 ${!expanded ? 'items-center' : ''}`}>
              {operatorClubs.slice(0, expanded ? 10 : 5).map(club => {
                const isActive = pathname?.startsWith(`/clubs/${club.slug}`)
                return (
                  <Link
                    key={club.slug}
                    href={`/clubs/${club.slug}`}
                    className={`${expanded ? 'flex items-center gap-3 px-3 py-2 w-full' : 'w-10 h-10 flex items-center justify-center mx-auto overflow-hidden'} rounded-lg relative group transition-colors
                      ${isActive
                        ? 'bg-brand-bg text-brand'
                        : 'text-txt-secondary hover:bg-surface-sunken hover:text-txt-primary'
                      }`}
                  >
                    {club.logo_url ? (
                      <div className={`${expanded ? 'w-6 h-6 rounded-md' : 'w-full h-full'} relative overflow-hidden shrink-0`}>
                        <Image src={club.logo_url} alt={club.name} fill sizes="40px" className="object-cover" />
                      </div>
                    ) : (
                      <div className={`${expanded ? 'w-6 h-6 rounded-md bg-brand-bg text-brand text-[11px]' : 'w-full h-full text-[11px]'} flex items-center justify-center font-extrabold shrink-0`}>
                        {club.name[0]}
                      </div>
                    )}
                    {expanded && (
                      <>
                        <span className="text-[13px] font-medium truncate flex-1">{club.name}</span>
                        <span className="shrink-0 text-[9px] font-semibold text-txt-tertiary">
                          {club.role === 'owner' ? '대표' : '운영'}
                        </span>
                      </>
                    )}
                    {!expanded && (
                      <Tooltip>{club.name} · {club.role === 'owner' ? '대표' : '운영'}</Tooltip>
                    )}
                  </Link>
                )
              })}
              {operatorClubs.length > (expanded ? 10 : 5) && (
                <Link
                  href="/clubs"
                  className={`${expanded ? 'flex items-center gap-3 px-3 py-2 w-full' : 'w-10 h-10 flex items-center justify-center mx-auto'} rounded-lg text-txt-tertiary hover:bg-surface-sunken hover:text-txt-primary transition-colors relative group`}
                >
                  <span className="text-[11px] font-mono font-bold">+{operatorClubs.length - (expanded ? 10 : 5)}</span>
                  {expanded && <span className="text-[12px] text-txt-tertiary">더보기</span>}
                  {!expanded && <Tooltip>모든 클럽 보기</Tooltip>}
                </Link>
              )}
            </div>
          </>
        )}

        {/* 비운영자 nudge — 확장 상태에서만, 공간 있을 때 */}
        {expanded && !isOperator && (
          <div className="mt-5 px-2">
            <Link
              href="/clubs/new"
              className="block p-3 rounded-xl bg-brand-bg/50 border border-brand-border text-brand hover:bg-brand-bg transition-colors"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <Plus size={12} />
                <span className="text-[12px] font-bold">클럽 만들기</span>
              </div>
              <p className="text-[10px] text-brand/80">운영자 도구를 활용해보세요</p>
            </Link>
          </div>
        )}
      </nav>

      {/* ── 하단: 프로필 메뉴 ── */}
      <div className={`shrink-0 relative ${expanded ? 'p-3' : 'px-3 pb-4'}`} ref={menuRef}>
        {isMenuOpen && (
          <div className="absolute bottom-16 left-3 right-3 min-w-[14rem] bg-surface-card rounded-xl border border-border shadow-md p-1 flex flex-col gap-0.5 z-50 animate-in fade-in zoom-in-95 duration-100 origin-bottom-left">
            <div className="px-3 py-2.5 mb-1 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-txt-primary truncate">{profile?.nickname || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}</span>
                {isPremium && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-indicator-premium text-white text-[10px] font-mono font-bold rounded-lg">
                    <Crown size={10} /> PRO
                  </span>
                )}
              </div>
              <div className="text-[10px] text-txt-tertiary font-mono mt-0.5 truncate">{user?.email || ''}</div>
            </div>

            <Link href="/profile" onClick={closeMenu} className="menu-item"><User size={14} /> 내 프로필</Link>
            <Link href="/profile" onClick={closeMenu} className="menu-item"><Settings size={14} /> 설정</Link>
            <Link href="/notifications" onClick={closeMenu} className="menu-item">
              <Bell size={14} /> 알림
              {unreadMessages > 0 && (
                <span className="ml-auto bg-status-danger-bg text-status-danger-text px-1.5 py-0.5 rounded-lg text-[10px] font-mono font-bold">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </Link>

            {!isPremium && (
              <button onClick={() => handleMenuAction('invite-code')} className="menu-item text-brand">
                <Gift size={14} /> 초대 코드 입력
              </button>
            )}

            {isInstitutionAdmin && (
              <>
                <div className="h-px bg-border my-1" />
                <div className="px-3 py-1.5 text-[10px] font-medium text-txt-tertiary">Institution</div>
                <Link href="/institution" onClick={closeMenu} className="menu-item">
                  <Building2 size={14} /> 기관 대시보드
                </Link>
              </>
            )}

            <div className="h-px bg-border my-1" />

            {isAdmin && (
              <>
                <div className="px-3 py-1.5 text-[10px] font-medium text-txt-tertiary">Admin</div>
                <Link href="/admin/invite-codes" onClick={closeMenu} className="menu-item">
                  <Gift size={14} /> 초대 코드 관리
                </Link>
                <Link href="/admin/error-logs" onClick={closeMenu} className="menu-item">
                  <AlertCircle size={14} /> Error Logs
                </Link>
                <div className="h-px bg-border my-1" />
              </>
            )}

            <button
              onClick={() => handleMenuAction('signout')}
              className="menu-item text-status-danger-text hover:bg-status-danger-bg font-bold"
            >
              <LogOut size={14} /> 로그아웃
            </button>
          </div>
        )}

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`${expanded ? 'flex items-center gap-3 px-3 py-2 w-full' : 'w-10 h-10 mx-auto flex items-center justify-center'} rounded-lg text-[11px] font-bold cursor-pointer transition-all relative group
            ${isMenuOpen
              ? 'bg-surface-sunken text-txt-primary'
              : 'hover:bg-surface-sunken text-txt-secondary'
            }`}
        >
          <div className={`shrink-0 flex items-center justify-center rounded-lg relative
            ${isPremium ? 'bg-indicator-premium text-white' : 'bg-surface-sunken text-txt-secondary border border-border'}
            ${expanded ? 'w-8 h-8' : 'w-10 h-10'}`}
          >
            {isPremium ? <Crown size={16} /> : (profile?.nickname?.[0] || user?.email?.[0] || 'U').toUpperCase()}
            {unreadMessages > 0 && (
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-indicator-alert rounded-full border border-surface-card" />
            )}
          </div>
          {expanded && (
            <div className="flex-1 min-w-0 text-left">
              <div className="text-[13px] font-semibold text-txt-primary truncate">
                {profile?.nickname || user?.email?.split('@')[0] || 'User'}
              </div>
              {isPremium && (
                <div className="text-[10px] text-indicator-premium font-bold">PRO</div>
              )}
            </div>
          )}
        </button>
      </div>

      <InviteCodeModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() => refetchPremium()}
      />

      <style jsx>{`
        :global(.menu-item) {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--txt-secondary);
          border-radius: 0.5rem;
          transition: colors 150ms;
          text-align: left;
          width: 100%;
        }
        :global(.menu-item:hover) {
          background: var(--surface-sunken);
          color: var(--txt-primary);
        }
      `}</style>
    </div>
  )
}

/** 접힌 상태에서 아이콘 옆에 띄우는 툴팁 */
function Tooltip({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-surface-inverse text-txt-inverse text-[10px] font-medium px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-sm">
      {children}
    </div>
  )
}

/** 펼친 상태에서만 보이는 섹션 헤더 */
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 mb-2 mt-1 text-[10px] font-bold text-txt-tertiary uppercase tracking-wider">
      {children}
    </div>
  )
}
