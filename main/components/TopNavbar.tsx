'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { User, LogOut, Bell, X, Plus, Settings, Search, ChevronRight, Shield, FolderOpen, Compass, Briefcase, AlertTriangle, Sun, Moon, Building2, Home } from 'lucide-react'
import { ViewTransitionLink as Link } from '@/components/ui/ViewTransitionLink'
import { useAuth } from '@/src/context/AuthContext'
import { useProfile } from '@/src/hooks/useProfile'
import { useAdmin } from '@/src/hooks/useAdmin'
import { useInstitutionAdmin } from '@/src/hooks/useInstitutionAdmin'
import { useMyOperatorClubs } from '@/src/hooks/useMyOperatorClubs'
import { NotificationDropdown } from '@/components/NotificationDropdown'
import { useNotificationSummary } from '@/src/hooks/useNotificationSummary'
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

// 드롭다운 메뉴 아이템 — href 주면 Link로 렌더해 prefetch 활성화, onClick만 주면 button
const DropdownItem = ({ icon: Icon, children, href, onClick, disabled, danger }: {
  icon: React.ElementType; children: React.ReactNode; href?: string; onClick?: () => void; disabled?: boolean; danger?: boolean
}) => {
  const className = `w-full flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-lg transition-colors text-left ${
    disabled ? 'text-txt-disabled cursor-not-allowed'
      : danger ? 'text-status-danger-text hover:bg-status-danger-bg'
      : 'text-txt-secondary hover:bg-surface-sunken hover:text-txt-primary'
  }`
  if (href && !disabled) {
    return (
      <Link href={href} onClick={onClick} className={className}>
        {/* @ts-expect-error lucide icon size prop */}
        <Icon size={14} />
        {children}
      </Link>
    )
  }
  return (
    <button onClick={onClick} disabled={disabled} className={className}>
      {/* @ts-expect-error lucide icon size prop */}
      <Icon size={14} />
      {children}
    </button>
  )
}

export const TopNavbar: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const { signOut, user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { data: profile } = useProfile()
  const { isAdmin } = useAdmin()
  const { isInstitutionAdmin } = useInstitutionAdmin()
  const { isOperator } = useMyOperatorClubs()
  const hasAnyAdminAccess = isAdmin || isInstitutionAdmin || isOperator
  const { theme, toggleTheme } = useTheme()
  // 모바일 bell badge — NotificationDropdown 과 동일 queryKey 공유 → 읽음 처리 시 자동 갱신
  const { unreadCount } = useNotificationSummary()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchActiveIdx, setSearchActiveIdx] = useState(0)

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

  // Cmd+K / Ctrl+K 로 검색 열기 — 전역 단축키
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
        setTimeout(() => searchInputRef.current?.focus(), 50)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // 검색 필터 결과가 바뀌면 선택 인덱스 초기화
  useEffect(() => {
    setSearchActiveIdx(0)
  }, [searchQuery])

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
    { label: '홈', href: '/dashboard', icon: Home, keywords: ['홈', 'home', 'dashboard', '대시보드'] },
    { label: '탐색', href: '/explore', icon: Compass, keywords: ['탐색', 'explore', '검색'] },
    { label: '프로필', href: '/profile', icon: User, keywords: ['프로필', 'profile', '마이페이지', '내정보'] },
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

  // 검색 드롭다운 닫기 — Link 네비게이션 후 호출되어 prefetch는 유지됨
  const closeSearchPanel = () => {
    setIsSearchOpen(false)
    setSearchQuery('')
  }

  const displayName = profile?.nickname || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'U'
  const initials = displayName.substring(0, 2).toUpperCase()

  return (
    <>
      {/* ===== 모바일 GNB (인스타 스타일) ===== */}
      <nav className="md:hidden fixed top-0 left-0 w-full h-12 z-fixed">
        <div className={`absolute inset-0 transition-all duration-300 ${
          isScrolled
            ? 'bg-surface-card/90 backdrop-blur-xl'
            : 'bg-surface-card'
        }`} />
        <div className="relative w-full px-4 h-full flex items-center justify-between">
          <Link
            href="/projects/new"
            aria-label="새 프로젝트 만들기"
            title="새 프로젝트 만들기"
            className="w-9 h-9 flex items-center justify-center text-txt-primary active:scale-90 transition-transform"
          >
            <Plus size={24} strokeWidth={1.8} />
          </Link>
          <Link href="/dashboard" aria-label="홈으로" className="font-bold text-[20px] tracking-tight text-txt-primary">
            Draft
          </Link>
          <Link
            href="/notifications"
            aria-label={unreadCount > 0 ? `알림 · 읽지 않은 ${unreadCount}건` : '알림 보기'}
            title={unreadCount > 0 ? `읽지 않은 알림 ${unreadCount}건` : '알림 · 지원서·커피챗·초대 등'}
            className="relative w-9 h-9 flex items-center justify-center text-txt-primary active:scale-90 transition-transform"
          >
            <Bell size={22} strokeWidth={1.8} />
            {unreadCount > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full bg-status-danger-text text-white text-[10px] font-bold tabular-nums"
                aria-hidden="true"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        </div>
      </nav>

      {/* ===== 데스크탑 GNB ===== */}
      <nav className="hidden md:block fixed top-0 left-0 w-full h-14 z-fixed">
        <div className={`absolute inset-0 transition-all duration-300 ${
          isScrolled
            ? 'bg-surface-card/80 backdrop-blur-xl shadow-md'
            : 'bg-surface-card/60 backdrop-blur-md'
        }`} />
        {/* GNB 내부 컨텐츠도 페이지 컨테이너(max-w-[1400px] + px-4 sm:px-6 lg:px-8) 와 정합 —
            이전 px-24 는 콘텐츠 영역 대비 3배 커서 좌우 여백 과다 */}
        <div className="relative max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 h-full flex items-center gap-2 sm:gap-3">

          {/* ===== 좌측: 로고 ===== */}
          <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0 group mr-1">
            <div className="w-8 h-8 bg-surface-inverse rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-txt-inverse font-black text-sm leading-none">D</span>
            </div>
            <span className="font-bold text-lg tracking-tight hidden sm:block">Draft</span>
          </Link>

          {/* ===== 데스크탑 네비게이션 (pill tabs) — 홈을 최상단에 =====
              사람은 독립 탐색 니즈가 약해(매칭·팀·클럽 맥락 속에서 발견됨) GNB 에서 제거.
              /network 라우트는 유지 — /explore 의 "사람 →" 보조 링크와 /more 에서 접근 가능. */}
          <div className="hidden md:flex items-center bg-surface-sunken/60 p-0.5 rounded-full">
            <NavPill href="/dashboard" active={pathname === '/dashboard'}>홈</NavPill>
            <NavPill href="/explore" active={pathname === '/explore'}>발견</NavPill>
            <NavPill href="/projects" active={pathname?.startsWith('/projects') ?? false}>프로젝트</NavPill>
            <NavPill href="/clubs" active={pathname?.startsWith('/clubs') ?? false}>클럽</NavPill>
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
                <span className="flex-1 pl-2 pr-3 py-2 text-sm text-txt-disabled flex items-center justify-between">
                  <span>페이지, 프로젝트, 사람 검색...</span>
                  <kbd className="shrink-0 hidden lg:inline-flex items-center px-1.5 py-0.5 bg-surface-sunken rounded text-[10px] font-mono text-txt-disabled">
                    ⌘K
                  </kbd>
                </span>
              ) : (
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsSearchOpen(false)
                      return
                    }
                    if (e.key === 'ArrowDown') {
                      e.preventDefault()
                      setSearchActiveIdx(i => Math.min(i + 1, filteredNav.length - 1))
                      return
                    }
                    if (e.key === 'ArrowUp') {
                      e.preventDefault()
                      setSearchActiveIdx(i => Math.max(i - 1, 0))
                      return
                    }
                    if (e.key === 'Enter') {
                      // 필터 결과 중 활성 항목이 있으면 그쪽 우선, 아니면 검색 실행
                      const target = filteredNav[searchActiveIdx]
                      if (target) {
                        router.push(target.href)
                        closeSearchPanel()
                      } else {
                        handleSearch()
                      }
                    }
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
                <div className="bg-surface-card shadow-lg rounded-xl overflow-hidden search-expand max-h-[60vh] overflow-y-auto">

                  {/* 바로가기 */}
                  <div className="px-2 pt-2 pb-1">
                    <p className="px-2.5 pt-1 pb-1.5 text-[10px] text-txt-disabled">
                      {searchQuery.trim() ? '바로가기' : '빠른 이동'}
                    </p>
                    {filteredNav.length > 0 ? (
                      filteredNav.map((item, idx) => {
                        const isActive = idx === searchActiveIdx
                        return (
                          <Link
                            key={item.href || item.label}
                            href={item.href}
                            onClick={closeSearchPanel}
                            onMouseEnter={() => setSearchActiveIdx(idx)}
                            className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors text-left ${
                              isActive
                                ? 'bg-surface-sunken text-txt-primary'
                                : 'text-txt-secondary hover:bg-surface-sunken hover:text-txt-primary'
                            }`}
                          >
                            <div className="w-7 h-7 rounded-lg bg-surface-sunken flex items-center justify-center shrink-0">
                              <item.icon size={14} />
                            </div>
                            <span>{item.label}</span>
                            <ChevronRight size={12} className="ml-auto text-txt-disabled" />
                          </Link>
                        )
                      })
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
              className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-sm font-bold hover:bg-brand-hover transition-all shadow-sm hover:shadow-md active:scale-[0.97] rounded-xl"
            >
              <Plus size={16} strokeWidth={2.5} />
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
                    aria-label={isMenuOpen ? '프로필 메뉴 닫기' : '프로필 메뉴 열기 · 프로필·설정·로그아웃'}
                    title={isMenuOpen ? '메뉴 닫기' : '프로필·설정·로그아웃'}
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
                    <div className="absolute right-0 top-11 w-[calc(100vw-2rem)] sm:w-60 max-w-60 bg-surface-card shadow-lg rounded-xl py-1.5 animate-in fade-in zoom-in-95 duration-150 z-popover">
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
                        <DropdownItem icon={User} href="/profile">내 프로필</DropdownItem>
                        <DropdownItem icon={Settings} disabled>설정</DropdownItem>
                      </div>
                      {hasAnyAdminAccess && (
                        <>
                          <div className="mx-3 border-t border-border-subtle" />
                          <div className="py-1.5 px-1.5">
                            <p className="px-2.5 py-1 text-[10px] text-txt-disabled">관리자</p>
                            <DropdownItem icon={Shield} href="/admin">통합 관리자 허브</DropdownItem>
                            {isInstitutionAdmin && (
                              <DropdownItem icon={Building2} href="/institution">기관 대시보드</DropdownItem>
                            )}
                            {isAdmin && (
                              <>
                                <DropdownItem icon={User} href="/admin/users">사용자 관리</DropdownItem>
                                <DropdownItem icon={Briefcase} href="/admin/opportunities">프로젝트 관리</DropdownItem>
                                <DropdownItem icon={AlertTriangle} href="/admin/error-logs">에러 로그</DropdownItem>
                              </>
                            )}
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

          </div>
        </div>
      </nav>

    </>
  )
}
