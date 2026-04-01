'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { User, LogOut, Bell, Menu, X, Plus, Settings, Search, ChevronRight, Shield, FolderOpen, Compass, Briefcase, AlertTriangle, Sun, Moon } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/src/context/AuthContext'
import { useAdmin } from '@/src/hooks/useAdmin'
import { NotificationDropdown } from '@/components/NotificationDropdown'
import { useTheme } from '@/src/context/ThemeContext'
import { useBackHandler } from '@/src/hooks/useBackHandler'

// 데스크탑 pill 형태 네비 탭
const NavPill = ({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) => (
  <Link
    href={href}
    className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all ${
      active
        ? 'bg-surface-card text-txt-primary shadow-sm'
        : 'text-txt-tertiary hover:text-txt-primary hover:bg-surface-sunken/50'
    }`}
  >
    {children}
  </Link>
)

// GNB 아이콘 버튼 — 원형 32px
const GnbIconBtn = ({ label, onClick, children, className }: {
  label: string; onClick?: () => void; children: React.ReactNode; className?: string
}) => (
  <div className={`relative group ${className || ''}`}>
    <button
      onClick={onClick}
      aria-label={label}
      className="w-8 h-8 flex items-center justify-center text-txt-tertiary hover:text-txt-primary hover:bg-surface-sunken transition-colors"
    >
      {children}
    </button>
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 bg-surface-inverse text-txt-inverse text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-tooltip hidden md:block shadow-sm border border-surface-inverse">
      {label}
    </div>
  </div>
)

// 드롭다운 메뉴 아이템
const DropdownItem = ({ icon: Icon, children, onClick, disabled, danger }: {
  icon: React.ElementType; children: React.ReactNode; onClick?: () => void; disabled?: boolean; danger?: boolean
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-lg transition-colors text-left ${
      disabled ? 'text-txt-disabled cursor-not-allowed'
        : danger ? 'text-status-danger-text hover:bg-status-danger-bg'
        : 'text-txt-secondary hover:bg-surface-sunken hover:text-txt-primary'
    }`}
  >
    <Icon size={14} />
    {children}
  </button>
)

// 모바일 네비 아이템
const MobileNavItem = ({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) => (
  <Link
    href={href}
    className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      active ? 'bg-surface-sunken text-txt-primary' : 'text-txt-secondary hover:bg-surface-sunken'
    }`}
  >
    {children}
  </Link>
)

export const TopNavbar: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const { signOut, user, isAuthenticated, isLoading: authLoading, profile } = useAuth()
  const { isAdmin } = useAdmin()
  const { theme, toggleTheme } = useTheme()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  useBackHandler(isMobileMenuOpen, () => setIsMobileMenuOpen(false), 'mobile-menu')
  useBackHandler(isSearchOpen, () => setIsSearchOpen(false), 'search')
  useBackHandler(isMenuOpen, () => setIsMenuOpen(false), 'profile-menu')
  const [searchQuery, setSearchQuery] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // 스크롤 감지
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // 검색 패널 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false)
      }
    }
    if (isSearchOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isSearchOpen])

  // 라우트 변경 시 메뉴 닫기
  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsMenuOpen(false)
    setIsSearchOpen(false)
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
    try {
      await signOut()
    } catch {
      // ignore — redirect regardless
    }
    window.location.href = '/'
  }

  // 페이지 바로가기 목록
  const NAV_ITEMS = [
    { label: '탐색', href: '/explore', icon: Compass, keywords: ['탐색', 'explore', '검색'] },
    { label: '마이페이지', href: '/profile', icon: User, keywords: ['프로필', 'profile', '마이페이지', '내정보'] },
    { label: '새 프로젝트', href: '/projects/new', icon: Plus, keywords: ['새 프로젝트', 'new', '만들기', '생성'] },
    { label: '내 프로젝트', href: '/projects', icon: FolderOpen, keywords: ['프로젝트', 'projects', '내 프로젝트'] },
  ]

  const filteredNav = searchQuery.trim()
    ? NAV_ITEMS.filter(item =>
        item.keywords.some(k => k.includes(searchQuery.toLowerCase())) ||
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : NAV_ITEMS.slice(0, 5) // 기본: 상위 5개

  const handleSearch = () => {
    const q = searchQuery.trim()
    if (!q) return
    router.push(`/explore?q=${encodeURIComponent(q)}`)
    setIsSearchOpen(false)
    setSearchQuery('')
  }

  const handleNavClick = (href: string) => {
    router.push(href)
    setIsSearchOpen(false)
    setSearchQuery('')
  }

  const displayName = profile?.nickname || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'U'
  const initials = displayName.substring(0, 2).toUpperCase()

  return (
    <>
      <nav className="fixed top-0 left-0 w-full h-14 sm:h-20 z-fixed">
        {/* 배경 레이어 — backdrop-filter를 nav가 아닌 별도 div에 적용하여 드롭다운 overflow 가림 방지 */}
        <div className={`absolute inset-0 transition-all duration-300 ${
          isScrolled
            ? 'bg-surface-card/80 backdrop-blur-xl shadow-soft'
            : 'bg-surface-card/60 backdrop-blur-md'
        }`} />
        <div className="relative w-full px-2.5 sm:px-10 lg:px-16 xl:px-24 h-full flex items-center gap-2 sm:gap-3">

          {/* ===== 좌측: 로고 ===== */}
          <Link href="/explore" className="flex items-center gap-2.5 shrink-0 group mr-1">
            <div className="w-8 h-8 bg-surface-inverse rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-txt-inverse font-black text-sm leading-none">D</span>
            </div>
            <span className="font-bold text-lg tracking-tight hidden sm:block">Draft</span>
          </Link>

          {/* ===== 데스크탑 네비게이션 (pill tabs) ===== */}
          <div className="hidden md:flex items-center bg-surface-sunken/60 p-0.5 rounded-full">
            <NavPill href="/explore" active={pathname === '/explore'}>탐색</NavPill>
            <NavPill href="/profile" active={pathname === '/profile'}>마이페이지</NavPill>
          </div>

          {/* ===== 중앙: 유니버설 검색 ===== */}
          <div className="hidden md:block flex-1 max-w-xl mx-4 relative" ref={searchRef}>
            {/* 검색바 — 클릭하면 input 활성화 + 아래로 패널 열림 */}
            <div
              onClick={() => { if (!isSearchOpen) { setIsSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 50) } }}
              className={`flex items-center transition-all duration-200 cursor-text ${
                isSearchOpen
                  ? 'bg-surface-card shadow-md border border-border rounded-xl'
                  : 'bg-surface-card rounded-xl border border-border hover:shadow-soft hover:border-border'
              }`}
            >
              <Search size={15} className={`ml-3.5 shrink-0 transition-colors ${isSearchOpen ? 'text-txt-secondary' : 'text-txt-disabled'}`} />
              {!isSearchOpen ? (
                <span className="flex-1 pl-2 pr-3.5 py-2 text-sm text-txt-disabled">페이지, 프로젝트, 사람 검색...</span>
              ) : (
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') { setIsSearchOpen(false) }
                    if (e.key === 'Enter') handleSearch()
                  }}
                  className="flex-1 pl-2 pr-3 py-2 bg-transparent text-base sm:text-sm focus:outline-none"
                  placeholder="페이지, 프로젝트, 사람 검색..."
                />
              )}
              {isSearchOpen && searchQuery && (
                <button onClick={(e) => { e.stopPropagation(); setSearchQuery('') }} className="p-3 sm:p-1 mr-2 text-txt-disabled hover:text-txt-secondary transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* 드롭다운 — 검색바 아래로 자연스럽게 열림 */}
            {isSearchOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 z-popover">
                <div className="bg-surface-card shadow-lg border border-border rounded-xl overflow-hidden search-expand max-h-[60vh] overflow-y-auto">

                  {/* 바로가기 */}
                  <div className="px-2 pt-2 pb-1">
                    <p className="px-2.5 pt-1 pb-1.5 text-[10px] text-txt-disabled">
                      {searchQuery.trim() ? '바로가기' : '빠른 이동'}
                    </p>
                    {filteredNav.length > 0 ? (
                      filteredNav.map((item) => (
                        <button
                          key={item.href || item.label}
                          onClick={() => handleNavClick(item.href)}
                          className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors text-left text-txt-secondary hover:bg-surface-sunken hover:text-txt-primary"
                        >
                          <div className="w-7 h-7 rounded-lg bg-surface-sunken flex items-center justify-center shrink-0">
                            <item.icon size={14} />
                          </div>
                          <span>{item.label}</span>
                          <ChevronRight size={12} className="ml-auto text-txt-disabled" />
                        </button>
                      ))
                    ) : (
                      <p className="px-2.5 py-2 text-xs text-txt-disabled">일치하는 페이지가 없습니다</p>
                    )}
                  </div>

                  {/* 콘텐츠 검색 — 입력어가 있을 때만 */}
                  {searchQuery.trim() && (
                    <>
                      <div className="mx-3 border-t border-border-subtle" />
                      <div className="px-2 pt-1 pb-2">
                        <p className="px-2.5 pt-1 pb-1.5 text-[10px] text-txt-disabled">콘텐츠 검색</p>
                        <button
                          onClick={handleSearch}
                          className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm text-txt-secondary hover:bg-surface-sunken hover:text-txt-primary transition-colors text-left"
                        >
                          <div className="w-7 h-7 rounded-lg bg-surface-inverse text-txt-inverse flex items-center justify-center shrink-0">
                            <Search size={14} />
                          </div>
                          <span>&ldquo;{searchQuery.trim()}&rdquo; 탐색에서 검색</span>
                          <kbd className="ml-auto px-1.5 py-0.5 bg-surface-sunken rounded-xl border border-border rounded text-[10px] font-mono text-txt-disabled">Enter</kbd>
                        </button>
                      </div>
                    </>
                  )}

                  {/* 하단 힌트 */}
                  <div className="mx-3 border-t border-border-subtle" />
                  <div className="px-4 py-2 flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-[10px] text-txt-disabled">
                      <kbd className="px-1.5 py-0.5 bg-surface-sunken rounded-lg border border-border font-mono">↑↓</kbd> 이동
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-txt-disabled">
                      <kbd className="px-1.5 py-0.5 bg-surface-sunken rounded-lg border border-border font-mono">Enter</kbd> 열기
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-txt-disabled">
                      <kbd className="px-1.5 py-0.5 bg-surface-sunken rounded-lg border border-border font-mono">Esc</kbd> 닫기
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ===== 우측 액션 ===== */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {/* 새 프로젝트 CTA — auth 불필요, 즉시 렌더 (미인증 시 middleware가 /login 리다이렉트) */}
            <Link
              href="/projects/new"
              className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 bg-surface-inverse text-txt-inverse text-xs font-bold hover:bg-accent-hover transition-all border border-surface-inverse hover:opacity-90 active:scale-[0.97] rounded-xl"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>새 프로젝트</span>
            </Link>

            {/* 다크모드 토글 — auth 불필요, 즉시 렌더 */}
            <button
              onClick={() => { import('@/src/utils/haptic').then(h => h.hapticLight()); toggleTheme() }}
              aria-label={theme === 'dark' ? '라이트 모드' : '다크 모드'}
              className="w-9 h-9 flex items-center justify-center rounded-full text-txt-tertiary hover:text-txt-primary hover:bg-surface-sunken transition-colors"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* 알림 + 프로필: 인증 확인되면 즉시 실제 UI / 미확인 중이면 플레이스홀더 / 비인증이면 로그인 */}
            {isAuthenticated ? (
              <>
                {/* 알림 드롭다운 — 데스크탑 전용 (모바일은 하단 탭바에서 처리) */}
                <div className="hidden md:block">
                  <NotificationDropdown />
                </div>

                {/* 프로필 */}
                <div className="relative ml-1" ref={menuRef}>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="프로필 메뉴"
                    aria-expanded={isMenuOpen}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${
                      isMenuOpen
                        ? 'bg-surface-inverse text-txt-inverse border-surface-inverse scale-95'
                        : 'bg-surface-sunken text-txt-secondary border-border-subtle hover:border-border'
                    }`}
                  >
                    {initials}
                  </button>

                  {/* 드롭다운 */}
                  {isMenuOpen && (
                    <div className="absolute right-0 top-11 w-[calc(100vw-2rem)] sm:w-60 max-w-60 bg-surface-card shadow-lg border border-border rounded-xl py-1.5 animate-in fade-in zoom-in-95 duration-150 z-popover">
                      {/* 유저 헤더 */}
                      <div className="px-4 pt-3 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-surface-inverse rounded-full flex items-center justify-center text-sm font-bold text-txt-inverse shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-txt-primary truncate">{displayName}</p>
                            <p className="text-xs text-txt-tertiary truncate">{user?.email || ''}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mx-3 border-t border-border-subtle" />
                      <div className="py-1.5 px-1.5">
                        <DropdownItem icon={User} onClick={() => router.push('/profile')}>내 프로필</DropdownItem>
                        <DropdownItem icon={Settings} disabled>설정</DropdownItem>
                      </div>
                      {isAdmin && (
                        <>
                          <div className="mx-3 border-t border-border-subtle" />
                          <div className="py-1.5 px-1.5">
                            <p className="px-2.5 py-1 text-[10px] text-txt-disabled">Admin</p>
                            <DropdownItem icon={Shield} onClick={() => router.push('/admin')}>관리자 대시보드</DropdownItem>
                            <DropdownItem icon={User} onClick={() => router.push('/admin/users')}>사용자 관리</DropdownItem>
                            <DropdownItem icon={Briefcase} onClick={() => router.push('/admin/opportunities')}>기회 관리</DropdownItem>
                            <DropdownItem icon={Settings} onClick={() => router.push('/admin/invite-codes')}>초대 코드 관리</DropdownItem>
                            <DropdownItem icon={AlertTriangle} onClick={() => router.push('/admin/error-logs')}>에러 로그</DropdownItem>
                          </div>
                        </>
                      )}
                      <div className="mx-3 border-t border-border-subtle" />
                      <div className="py-1.5 px-1.5">
                        <DropdownItem icon={LogOut} onClick={handleSignOut} danger>로그아웃</DropdownItem>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : authLoading ? (
              <>
                <div className="w-8 h-8 bg-surface-sunken rounded-full animate-pulse" />
                <div className="w-10 h-10 bg-surface-sunken rounded-full animate-pulse" />
              </>
            ) : (
              <Link
                href="/login"
                className="px-4 py-1.5 bg-surface-sunken text-txt-secondary text-xs font-bold border border-border hover:bg-surface-inverse hover:text-txt-inverse transition-all rounded-xl"
              >
                로그인
              </Link>
            )}

            {/* 모바일 햄버거 */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
              aria-expanded={isMobileMenuOpen}
              className="md:hidden w-11 h-11 flex items-center justify-center text-txt-tertiary hover:text-txt-primary hover:bg-surface-sunken transition-colors border border-border rounded-lg"
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ===== 모바일 드로어 ===== */}
      {isMobileMenuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-[299] animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="md:hidden fixed top-14 sm:top-20 left-0 right-0 bg-surface-card/95 backdrop-blur-xl border-b border-border shadow-lg z-fixed animate-in slide-in-from-bottom-2 duration-200">
            <div className="px-4 py-4 space-y-1.5">
              <form
                className="relative mb-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  const input = (e.currentTarget.elements.namedItem('mq') as HTMLInputElement)?.value?.trim()
                  if (input) { router.push(`/explore?q=${encodeURIComponent(input)}`); setIsMobileMenuOpen(false) }
                }}
              >
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-disabled pointer-events-none" />
                <input
                  name="mq"
                  type="text"
                  placeholder="검색..."
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-sunken rounded-lg text-base sm:text-sm placeholder:text-txt-disabled focus:outline-none focus:bg-surface-card focus:ring-1 focus:ring-border transition-all"
                />
              </form>
              <MobileNavItem href="/explore" active={pathname === '/explore'}>탐색</MobileNavItem>
              {isAuthenticated && (
                <MobileNavItem href="/profile" active={pathname === '/profile'}>마이페이지</MobileNavItem>
              )}
              <Link
                href={isAuthenticated ? '/projects/new' : '/login'}
                className="w-full mt-2 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-surface-inverse text-txt-inverse text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.97] rounded-xl"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {isAuthenticated ? <><Plus size={15} strokeWidth={2.5} /> 새 프로젝트</> : '로그인'}
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  )
}
