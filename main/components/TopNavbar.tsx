'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { PenTool, User, LogOut, Bell, Menu, X, Plus, Settings, Search, MessageSquare, Moon, Sun, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/src/context/AuthContext'
import { useAdmin } from '@/src/hooks/useAdmin'

// 툴팁 아이콘 버튼 — 44px 터치 타겟 보장
const IconButton = ({ label, onClick, children, className: extraClass }: { label: string; onClick?: () => void; children: React.ReactNode; className?: string }) => (
  <div className={`relative group ${extraClass || ''}`}>
    <button
      onClick={onClick}
      aria-label={label}
      className="relative min-w-[44px] min-h-[44px] flex items-center justify-center text-txt-tertiary hover:text-txt-primary hover:bg-surface-sunken rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
    >
      {children}
    </button>
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 bg-surface-inverse text-txt-inverse text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-tooltip hidden md:block">
      {label}
    </div>
  </div>
)

// NavLink 컴포넌트 - 활성 상태 스타일링
const NavLink = ({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) => (
  <Link
    href={href}
    className={`text-sm font-medium transition-colors relative py-2 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-sm
      ${active
        ? 'text-txt-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-accent'
        : 'text-txt-tertiary hover:text-txt-primary'
      }`}
  >
    {children}
  </Link>
)

export const TopNavbar: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const { signOut, user } = useAuth()
  const { isAdmin } = useAdmin()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // 라우트 변경 시 모바일 메뉴 닫기
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // 메뉴 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-16 bg-surface-card border-b border-border z-fixed">
        <div className="max-w-container-wide mx-auto px-4 lg:px-6 h-full flex items-center justify-between">

          {/* ===== 좌측: 로고 + 메뉴 + CTA ===== */}
          <div className="flex items-center gap-6 shrink-0">
            {/* 로고 */}
            <Link href="/explore" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center group-hover:bg-accent-hover transition-colors">
                <PenTool size={16} className="text-txt-inverse" />
              </div>
              <span className="font-bold text-xl tracking-tight hidden sm:block">Draft</span>
            </Link>

            {/* 데스크탑 메뉴 */}
            <div className="hidden md:flex items-center gap-5">
              <NavLink href="/explore" active={pathname === '/explore'}>탐색</NavLink>
              <NavLink href="/profile" active={pathname === '/profile'}>마이페이지</NavLink>
              <button
                onClick={() => router.push('/projects/new')}
                className="flex items-center gap-1.5 px-4 py-2 bg-accent text-txt-inverse text-sm font-semibold rounded-lg hover:bg-accent-hover transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                <Plus size={16} />
                새 프로젝트
              </button>
            </div>
          </div>

          {/* ===== 중앙: 검색바 ===== */}
          <div className="hidden md:flex flex-1 max-w-xl mx-6 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-disabled pointer-events-none" />
            <input
              type="text"
              placeholder="프로젝트, 사람 검색..."
              className="w-full pl-9 pr-12 py-2 bg-surface-sunken border border-border rounded-lg text-sm placeholder:text-txt-disabled focus:outline-none focus:border-accent focus:bg-surface-card transition-all"
            />
            <button className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-accent text-txt-inverse text-xs font-semibold rounded-md hover:bg-accent-hover transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
              검색
            </button>
          </div>

          {/* ===== 우측: AI채팅 + 다크모드 + 알림 + 더보기 + 프로필 ===== */}
          <div className="flex items-center gap-1 shrink-0">
            <IconButton label="AI 채팅" className="hidden sm:block">
              <MessageSquare size={20} />
            </IconButton>

            <IconButton label={isDarkMode ? '라이트 모드' : '다크 모드'} onClick={() => setIsDarkMode(!isDarkMode)} className="hidden sm:block">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </IconButton>

            <IconButton label="알림">
              <Bell size={20} />
            </IconButton>

            <IconButton label="더보기" className="hidden sm:block">
              <MoreHorizontal size={20} />
            </IconButton>

            {/* 프로필 드롭다운 */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="프로필 메뉴"
                aria-expanded={isMenuOpen}
                className="flex items-center gap-2 p-1.5 hover:bg-surface-sunken rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                <div className="w-8 h-8 bg-surface-sunken rounded-full flex items-center justify-center">
                  <User size={16} className="text-txt-secondary" />
                </div>
              </button>

              {/* 드롭다운 메뉴 */}
              {isMenuOpen && (
                <div className="absolute right-0 top-12 w-[calc(100vw-2rem)] sm:w-56 max-w-[14rem] bg-surface-elevated border border-border rounded-xl shadow-lg py-2 animate-in fade-in zoom-in-95 duration-150 z-dropdown">
                  {/* 유저 정보 */}
                  <div className="px-4 py-3 border-b border-border-subtle">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-txt-primary">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}</span>
                    </div>
                    <p className="text-xs text-txt-tertiary mt-0.5 truncate">{user?.email || ''}</p>
                  </div>

                  {/* 메뉴 아이템들 */}
                  <div className="py-1">
                    <MenuItem icon={User} onClick={() => router.push('/profile')}>내 프로필</MenuItem>
                    <MenuItem icon={Settings} disabled>설정</MenuItem>
                  </div>

                  {/* 어드민 섹션 */}
                  {isAdmin && (
                    <div className="py-1 border-t border-border-subtle">
                      <p className="px-4 py-1 text-xs font-mono text-txt-disabled uppercase">Admin</p>
                      <MenuItem icon={Settings} onClick={() => router.push('/admin/invite-codes')}>초대 코드 관리</MenuItem>
                    </div>
                  )}

                  {/* 로그아웃 */}
                  <div className="py-1 border-t border-border-subtle">
                    <MenuItem icon={LogOut} onClick={handleSignOut} danger>로그아웃</MenuItem>
                  </div>
                </div>
              )}
            </div>

            {/* 모바일 햄버거 메뉴 */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
              aria-expanded={isMobileMenuOpen}
              className="md:hidden p-2 text-txt-tertiary hover:text-txt-primary hover:bg-surface-sunken rounded-lg focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 드로어 */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-surface-card border-b border-border shadow-lg animate-in slide-in-from-top duration-200 z-fixed">
            <div className="px-4 py-3 space-y-2">
              {/* 모바일 검색 */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-disabled pointer-events-none" />
                <input
                  type="text"
                  placeholder="프로젝트, 사람 검색..."
                  className="w-full pl-9 pr-4 py-3 bg-surface-sunken border border-border rounded-lg text-sm placeholder:text-txt-disabled focus:outline-none focus:border-accent focus:bg-surface-card transition-all"
                />
              </div>
              <MobileNavLink href="/explore" active={pathname === '/explore'}>탐색</MobileNavLink>
              <MobileNavLink href="/profile" active={pathname === '/profile'}>마이페이지</MobileNavLink>
              <button
                onClick={() => router.push('/projects/new')}
                className="w-full mt-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-accent text-txt-inverse text-sm font-semibold rounded-lg"
              >
                <Plus size={16} /> 새 프로젝트
              </button>
            </div>
          </div>
        )}
      </nav>

    </>
  )
}

// MenuItem 헬퍼 컴포넌트
const MenuItem = ({ icon: Icon, children, onClick, disabled, highlight, danger }: {
  icon: React.ElementType
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  highlight?: boolean
  danger?: boolean
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors text-left
      ${disabled ? 'text-txt-disabled cursor-not-allowed' : ''}
      ${highlight ? 'text-status-info-text hover:bg-status-info-bg' : ''}
      ${danger ? 'text-status-danger-text hover:bg-status-danger-bg' : ''}
      ${!disabled && !highlight && !danger ? 'text-txt-secondary hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2' : ''}
    `}
  >
    <Icon size={16} />
    {children}
  </button>
)

// MobileNavLink 헬퍼 컴포넌트
const MobileNavLink = ({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) => (
  <Link
    href={href}
    className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors
      ${active ? 'bg-surface-sunken text-txt-primary' : 'text-txt-secondary hover:bg-surface-sunken'}`}
  >
    {children}
  </Link>
)
