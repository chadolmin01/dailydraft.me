'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { PenTool, User, LogOut, Bell, Menu, X, Plus, Settings, Search, Moon, Sun, ChevronRight, Shield, FolderOpen, FileText, Users, Compass, Lightbulb, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/src/context/AuthContext'
import { useAdmin } from '@/src/hooks/useAdmin'
import { NotificationDropdown } from '@/components/NotificationDropdown'

// 데스크탑 pill 형태 네비 탭
const NavPill = ({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) => (
  <Link
    href={href}
    className={`px-3.5 py-1 text-xs font-medium transition-all ${
      active
        ? 'bg-surface-card text-txt-primary shadow-solid-sm border border-border-strong'
        : 'text-txt-tertiary hover:text-txt-primary'
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
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 bg-surface-inverse text-txt-inverse text-[0.625rem] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-tooltip hidden md:block shadow-solid-sm border border-black">
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
    className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
      active ? 'bg-surface-sunken text-txt-primary' : 'text-txt-secondary hover:bg-surface-sunken'
    }`}
  >
    {children}
  </Link>
)

export const TopNavbar: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const { signOut, user, isAuthenticated } = useAuth()
  const { isAdmin } = useAdmin()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
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
    await signOut()
    window.location.href = '/'
  }

  // 페이지 바로가기 목록
  const NAV_ITEMS = [
    { label: '탐색', href: '/explore', icon: Compass, keywords: ['탐색', 'explore', '검색'] },
    { label: '마이페이지', href: '/profile', icon: User, keywords: ['프로필', 'profile', '마이페이지', '내정보'] },
    { label: '새 프로젝트', href: '/projects/new', icon: Plus, keywords: ['새 프로젝트', 'new', '만들기', '생성'] },
    { label: '내 프로젝트', href: '/projects', icon: FolderOpen, keywords: ['프로젝트', 'projects', '내 프로젝트'] },
    { label: '아이디어 검증', href: '/idea-validator', icon: Lightbulb, keywords: ['아이디어', 'idea', '검증', 'validator'] },
    { label: '사업계획서', href: '/business-plan', icon: FileText, keywords: ['사업', 'business', '계획서', 'plan'] },
    { label: '네트워크', href: '/network', icon: Users, keywords: ['네트워크', 'network', '인맥'] },
    { label: '사용량', href: '/usage', icon: BarChart3, keywords: ['사용량', 'usage', '통계'] },
    { label: '설정', href: '', icon: Settings, keywords: ['설정', 'settings', '환경설정'], disabled: true },
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

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'U'
  const initials = displayName.substring(0, 2).toUpperCase()

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 h-14 z-fixed transition-all duration-300 ${
        isScrolled
          ? 'bg-surface-card/80 backdrop-blur-xl shadow-soft'
          : 'bg-surface-card/60 backdrop-blur-md'
      }`}>
        <div className="max-w-container-wide mx-auto px-4 lg:px-6 h-full flex items-center gap-3">

          {/* ===== 좌측: 로고 ===== */}
          <Link href="/explore" className="flex items-center gap-2.5 shrink-0 group mr-1">
            <div className="w-8 h-8 bg-surface-inverse flex items-center justify-center group-hover:scale-105 transition-transform shadow-solid-sm">
              <PenTool size={14} className="text-txt-inverse" />
            </div>
            <span className="font-bold text-lg tracking-tight hidden sm:block">Draft</span>
          </Link>

          {/* ===== 데스크탑 네비게이션 (pill tabs) ===== */}
          <div className="hidden md:flex items-center bg-surface-sunken/80 p-0.5 border border-border">
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
                  ? 'bg-surface-card shadow-sharp border border-border-strong'
                  : 'bg-surface-sunken border border-border hover:bg-surface-card hover:shadow-soft hover:border-border-strong'
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
                  className="flex-1 pl-2 pr-3 py-2 bg-transparent text-sm focus:outline-none"
                  placeholder="페이지, 프로젝트, 사람 검색..."
                />
              )}
              {isSearchOpen && searchQuery && (
                <button onClick={(e) => { e.stopPropagation(); setSearchQuery('') }} className="p-1 mr-2 text-txt-disabled hover:text-txt-secondary rounded-full transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* 드롭다운 — 검색바 아래로 자연스럽게 열림 */}
            {isSearchOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 z-popover">
                <div className="bg-surface-card shadow-brutal border border-border-strong overflow-hidden search-expand max-h-[60vh] overflow-y-auto">

                  {/* 바로가기 */}
                  <div className="px-2 pt-2 pb-1">
                    <p className="px-2.5 pt-1 pb-1.5 text-[10px] font-mono uppercase tracking-widest text-txt-disabled">
                      {searchQuery.trim() ? '바로가기' : '빠른 이동'}
                    </p>
                    {filteredNav.length > 0 ? (
                      filteredNav.map((item) => (
                        <button
                          key={item.href || item.label}
                          onClick={() => !item.disabled && handleNavClick(item.href)}
                          disabled={item.disabled}
                          className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm transition-colors text-left ${
                            item.disabled
                              ? 'text-txt-disabled cursor-not-allowed'
                              : 'text-txt-secondary hover:bg-surface-sunken hover:text-txt-primary'
                          }`}
                        >
                          <div className="w-7 h-7 rounded-lg bg-surface-sunken flex items-center justify-center shrink-0">
                            <item.icon size={14} />
                          </div>
                          <span>{item.label}</span>
                          {item.disabled && <span className="text-[10px] text-txt-disabled ml-auto">준비중</span>}
                          {!item.disabled && <ChevronRight size={12} className="ml-auto text-txt-disabled" />}
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
                        <p className="px-2.5 pt-1 pb-1.5 text-[10px] font-mono uppercase tracking-widest text-txt-disabled">콘텐츠 검색</p>
                        <button
                          onClick={handleSearch}
                          className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm text-txt-secondary hover:bg-surface-sunken hover:text-txt-primary transition-colors text-left"
                        >
                          <div className="w-7 h-7 rounded-lg bg-surface-inverse text-txt-inverse flex items-center justify-center shrink-0">
                            <Search size={14} />
                          </div>
                          <span>&ldquo;{searchQuery.trim()}&rdquo; 탐색에서 검색</span>
                          <kbd className="ml-auto px-1.5 py-0.5 bg-surface-sunken border border-border rounded text-[10px] font-mono text-txt-disabled">Enter</kbd>
                        </button>
                      </div>
                    </>
                  )}

                  {/* 하단 힌트 */}
                  <div className="mx-3 border-t border-border-subtle" />
                  <div className="px-4 py-2 flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-[10px] text-txt-disabled">
                      <kbd className="px-1.5 py-0.5 bg-surface-sunken border border-border rounded font-mono">↑↓</kbd> 이동
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-txt-disabled">
                      <kbd className="px-1.5 py-0.5 bg-surface-sunken border border-border rounded font-mono">Enter</kbd> 열기
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-txt-disabled">
                      <kbd className="px-1.5 py-0.5 bg-surface-sunken border border-border rounded font-mono">Esc</kbd> 닫기
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ===== 우측 액션 ===== */}
          <div className="flex items-center gap-0.5 shrink-0 ml-auto">
            {isAuthenticated ? (
              <>
                {/* 새 프로젝트 CTA */}
                <button
                  onClick={() => router.push('/projects/new')}
                  className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 bg-surface-inverse text-txt-inverse text-xs font-bold hover:bg-accent-hover transition-all border border-black shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                >
                  <Plus size={14} strokeWidth={2.5} />
                  <span>새 프로젝트</span>
                </button>

                {/* 다크모드 */}
                <GnbIconBtn
                  label={isDarkMode ? '라이트 모드' : '다크 모드'}
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="hidden sm:flex"
                >
                  {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                </GnbIconBtn>

                {/* 알림 */}
                <NotificationDropdown />

                {/* 프로필 */}
                <div className="relative ml-1" ref={menuRef}>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="프로필 메뉴"
                    aria-expanded={isMenuOpen}
                    className={`w-8 h-8 flex items-center justify-center text-[0.6875rem] font-bold transition-all border ${
                      isMenuOpen
                        ? 'bg-surface-inverse text-txt-inverse border-black scale-95'
                        : 'bg-surface-sunken text-txt-secondary border-border hover:border-border-strong'
                    }`}
                  >
                    {initials}
                  </button>

                  {/* 드롭다운 */}
                  {isMenuOpen && (
                    <div className="absolute right-0 top-11 w-60 bg-surface-card shadow-brutal border border-border-strong py-1.5 animate-in fade-in zoom-in-95 duration-150 z-dropdown">
                      {/* 유저 헤더 */}
                      <div className="px-4 pt-3 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-surface-inverse flex items-center justify-center text-sm font-bold text-txt-inverse shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-txt-primary truncate">{displayName}</p>
                            <p className="text-[0.6875rem] text-txt-tertiary truncate">{user?.email || ''}</p>
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
                            <p className="px-2.5 py-1 text-[0.625rem] font-mono text-txt-disabled uppercase tracking-widest">Admin</p>
                            <DropdownItem icon={Shield} onClick={() => router.push('/admin')}>관리자 대시보드</DropdownItem>
                            <DropdownItem icon={User} onClick={() => router.push('/admin/users')}>사용자 관리</DropdownItem>
                            <DropdownItem icon={Settings} onClick={() => router.push('/admin/invite-codes')}>초대 코드 관리</DropdownItem>
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
            ) : (
              <>
                {/* 비로그인: 로그인 버튼 */}
                <Link
                  href="/login"
                  className="hidden md:flex items-center gap-1.5 px-4 py-1.5 bg-surface-inverse text-txt-inverse text-xs font-bold hover:bg-accent-hover transition-all border border-black shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                >
                  로그인
                </Link>
              </>
            )}

            {/* 모바일 햄버거 */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
              aria-expanded={isMobileMenuOpen}
              className="md:hidden w-9 h-9 flex items-center justify-center text-txt-tertiary hover:text-txt-primary hover:bg-surface-sunken transition-colors border border-border"
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
          <div className="md:hidden fixed top-14 left-0 right-0 bg-surface-card/95 backdrop-blur-xl border-b border-border-strong shadow-brutal z-fixed animate-in slide-in-from-bottom-2 duration-200">
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
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-sunken rounded-xl text-sm placeholder:text-txt-disabled focus:outline-none focus:bg-surface-card focus:ring-1 focus:ring-border transition-all"
                />
              </form>
              <MobileNavItem href="/explore" active={pathname === '/explore'}>탐색</MobileNavItem>
              {isAuthenticated ? (
                <>
                  <MobileNavItem href="/profile" active={pathname === '/profile'}>마이페이지</MobileNavItem>
                  <button
                    onClick={() => { router.push('/projects/new'); setIsMobileMenuOpen(false) }}
                    className="w-full mt-2 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-surface-inverse text-txt-inverse text-sm font-semibold transition-all shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                  >
                    <Plus size={15} strokeWidth={2.5} /> 새 프로젝트
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="w-full mt-2 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-surface-inverse text-txt-inverse text-sm font-semibold transition-all shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  로그인
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
