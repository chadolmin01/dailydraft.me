'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { PenTool, User, LogOut, Bell, Menu, X, Plus, Settings, Search, MessageSquare, Moon, Sun, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/src/context/AuthContext'
import { useAdmin } from '@/src/hooks/useAdmin'

// 툴팁 아이콘 버튼
const IconButton = ({ label, onClick, children }: { label: string; onClick?: () => void; children: React.ReactNode }) => (
  <div className="relative group">
    <button
      onClick={onClick}
      aria-label={label}
      className="relative p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
    >
      {children}
    </button>
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
      {label}
    </div>
  </div>
)

// NavLink 컴포넌트 - 활성 상태 스타일링
const NavLink = ({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) => (
  <Link
    href={href}
    className={`text-sm font-medium transition-colors relative py-2
      ${active
        ? 'text-black after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-black'
        : 'text-gray-500 hover:text-black'
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
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 z-50">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 h-full flex items-center justify-between">

          {/* ===== 좌측: 로고 + 메뉴 + CTA ===== */}
          <div className="flex items-center gap-6 shrink-0">
            {/* 로고 */}
            <Link href="/explore" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                <PenTool size={16} className="text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight hidden sm:block">Draft</span>
            </Link>

            {/* 데스크탑 메뉴 */}
            <div className="hidden md:flex items-center gap-5">
              <NavLink href="/explore" active={pathname === '/explore'}>탐색</NavLink>
              <NavLink href="/profile" active={pathname === '/profile'}>마이페이지</NavLink>
              <button
                onClick={() => router.push('/projects/new')}
                className="flex items-center gap-1.5 px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
              >
                <Plus size={16} />
                새 프로젝트
              </button>
            </div>
          </div>

          {/* ===== 중앙: 검색바 ===== */}
          <div className="hidden md:flex flex-1 max-w-xl mx-6 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="프로젝트, 사람 검색..."
              className="w-full pl-9 pr-12 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:border-black focus:bg-white transition-all"
            />
            <button className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-black text-white text-xs font-semibold rounded-md hover:bg-gray-800 transition-colors">
              검색
            </button>
          </div>

          {/* ===== 우측: AI채팅 + 다크모드 + 알림 + 더보기 + 프로필 ===== */}
          <div className="flex items-center gap-1 shrink-0">
            <IconButton label="AI 채팅">
              <MessageSquare size={20} />
            </IconButton>

            <IconButton label={isDarkMode ? '라이트 모드' : '다크 모드'} onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </IconButton>

            <IconButton label="알림">
              <Bell size={20} />
            </IconButton>

            <IconButton label="더보기">
              <MoreHorizontal size={20} />
            </IconButton>

            {/* 프로필 드롭다운 */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="프로필 메뉴"
                aria-expanded={isMenuOpen}
                className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User size={16} className="text-gray-600" />
                </div>
              </button>

              {/* 드롭다운 메뉴 */}
              {isMenuOpen && (
                <div className="absolute right-0 top-12 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-2 animate-in fade-in zoom-in-95 duration-150">
                  {/* 유저 정보 */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{user?.email || ''}</p>
                  </div>

                  {/* 메뉴 아이템들 */}
                  <div className="py-1">
                    <MenuItem icon={User} onClick={() => router.push('/profile')}>내 프로필</MenuItem>
                    <MenuItem icon={Settings} disabled>설정</MenuItem>
                  </div>

                  {/* 어드민 섹션 */}
                  {isAdmin && (
                    <div className="py-1 border-t border-gray-100">
                      <p className="px-4 py-1 text-[10px] font-mono text-gray-400 uppercase">Admin</p>
                      <MenuItem icon={Settings} onClick={() => router.push('/admin/invite-codes')}>초대 코드 관리</MenuItem>
                    </div>
                  )}

                  {/* 로그아웃 */}
                  <div className="py-1 border-t border-gray-100">
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
              className="md:hidden p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 드로어 */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg animate-in slide-in-from-top duration-200">
            <div className="px-4 py-3 space-y-1">
              <MobileNavLink href="/explore" active={pathname === '/explore'}>탐색</MobileNavLink>
              <MobileNavLink href="/profile" active={pathname === '/profile'}>마이페이지</MobileNavLink>
              <button
                onClick={() => router.push('/projects/new')}
                className="w-full mt-2 flex items-center justify-center gap-1.5 px-4 py-3 bg-black text-white text-sm font-semibold rounded-lg"
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
      ${disabled ? 'text-gray-400 cursor-not-allowed' : ''}
      ${highlight ? 'text-blue-600 hover:bg-blue-50' : ''}
      ${danger ? 'text-red-600 hover:bg-red-50' : ''}
      ${!disabled && !highlight && !danger ? 'text-gray-700 hover:bg-gray-50' : ''}
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
      ${active ? 'bg-gray-100 text-black' : 'text-gray-600 hover:bg-gray-50'}`}
  >
    {children}
  </Link>
)
