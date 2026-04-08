'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Compass,
  MessageSquare,
  Calendar,
  FileText,
  Users,
  User,
  LayoutDashboard,
  Briefcase,
  LogOut,
  Bell,
  Settings,
  BarChart3,
  AlertCircle,
  Gift,
  Crown,
  Building2,
} from 'lucide-react'
import { useAuth } from '@/src/context/AuthContext'
import { useProfile } from '@/src/hooks/useProfile'
import { useAdmin } from '@/src/hooks/useAdmin'
import { useInstitutionAdmin } from '@/src/hooks/useInstitutionAdmin'
import { usePremium } from '@/src/hooks/usePremium'
import { useUnreadCount } from '@/src/hooks/useMessages'
import InviteCodeModal from '@/components/InviteCodeModal'

export const Sidebar: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const { signOut, user } = useAuth()
  const { data: profile } = useProfile()
  const { isAdmin } = useAdmin()
  const { isInstitutionAdmin } = useInstitutionAdmin()
  const { isPremium, refetch: refetchPremium } = usePremium()
  const { data: unreadMessages = 0 } = useUnreadCount()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Community Mode: Only show FEED, PROJECTS, PROFILE
  // Other items are commented out but preserved for future use
  const navItems = [
    // { id: 'dashboard', icon: LayoutDashboard, label: 'DASHBOARD', path: '/dashboard' },
    { id: 'explore', icon: Compass, label: 'FEED', path: '/explore' },
    { id: 'projects', icon: Briefcase, label: 'PROJECTS', path: '/projects' },
    { id: 'profile', icon: User, label: 'PROFILE', path: '/profile' },
    { id: 'messages', icon: MessageSquare, label: 'MESSAGES', path: '/messages' },
    // { id: 'calendar', icon: Calendar, label: 'SCHEDULE', path: '/calendar' },
    // { id: 'documents', icon: FileText, label: 'DOCS', path: '/documents' },
    // { id: 'network', icon: Users, label: 'NET', path: '/network' },
  ]

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  const handleMenuAction = async (action: string) => {
    if (action === 'profile') router.push('/profile')
    if (action === 'settings') router.push('/profile')
    if (action === 'usage') router.push('/usage')
    if (action === 'institution') router.push('/institution')
    if (action === 'error-logs') router.push('/admin/error-logs')
    if (action === 'invite-codes-admin') router.push('/admin/invite-codes')
    if (action === 'notifications') router.push('/notifications')
    if (action === 'invite-code') {
      setIsInviteModalOpen(true)
    }
    if (action === 'signout') {
      try {
        await signOut()
        // Force a hard navigation to clear all client state
        window.location.href = '/'
      } catch (error) {
        console.error('Sign out error:', error)
      }
    }
    setIsMenuOpen(false)
  }

  const handleInviteSuccess = () => {
    refetchPremium()
  }

  const getActiveTab = () => {
    const path = pathname.split('/')[1] || 'dashboard'
    return path
  }

  return (
    <div className="w-16 flex-shrink-0 bg-surface-card border-r border-border flex flex-col items-center py-6 h-screen sticky top-0 z-50">
      {/* Home / Logo Button - Now goes to Dashboard */}
      <div
        className="mb-8 cursor-pointer group relative"
        onClick={() => router.push('/explore')}
      >
        <div
          className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors
            ${
              getActiveTab() === 'dashboard'
                ? 'bg-surface-inverse text-txt-inverse shadow-sm'
                : 'bg-surface-card text-txt-primary border border-border hover:bg-surface-inverse hover:text-txt-inverse hover:border-border hover:shadow-md active:scale-[0.97]'
            }
        `}
        >
          <span className="font-black text-base leading-none">D</span>
        </div>
        <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-surface-inverse text-txt-inverse text-[10px] font-medium px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-sm">
          MAIN
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-3 w-full px-3">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => router.push(item.path)}
            className={`w-10 h-10 flex items-center justify-center transition-all duration-200 mx-auto rounded-lg relative group
              ${
                getActiveTab() === item.id
                  ? 'bg-brand-bg text-brand border border-brand shadow-sm'
                  : 'text-txt-tertiary hover:text-txt-primary hover:bg-surface-sunken border border-transparent'
              }`}
          >
            <item.icon size={20} strokeWidth={1.5} />
            {item.id === 'messages' && unreadMessages > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand text-white text-[0.5rem] font-bold flex items-center justify-center">
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </span>
            )}

            {/* Tooltip */}
            <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-surface-inverse text-txt-inverse text-[10px] font-medium px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-sm">
              {item.label}
            </div>
          </button>
        ))}
      </nav>

      {/* Settings / Profile Menu Area */}
      <div className="mt-auto flex flex-col gap-4 w-full px-3 pb-4 relative" ref={menuRef}>
        {/* Popup Menu */}
        {isMenuOpen && (
          <div className="absolute left-14 bottom-2 w-56 bg-surface-card rounded-xl border border-border shadow-md p-1 flex flex-col gap-0.5 z-50 animate-in fade-in zoom-in-95 duration-100 origin-bottom-left">
            {/* User Info */}
            <div className="px-3 py-2.5 mb-1 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-txt-primary">{profile?.nickname || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}</span>
                {isPremium && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-indicator-premium text-white text-[10px] font-mono font-bold rounded-lg border border-indicator-premium-border">
                    <Crown size={10} />
                    PRO
                  </span>
                )}
              </div>
              <div className="text-[10px] text-txt-tertiary font-mono mt-0.5">{user?.email || ''}</div>
            </div>

            {/* Menu Items */}
            <button
              onClick={() => handleMenuAction('profile')}
              className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-txt-secondary hover:bg-surface-sunken hover:text-txt-primary rounded-lg transition-colors text-left w-full"
            >
              <User size={14} /> My Profile
            </button>
            {/* Community Mode: Usage hidden
            <button
              onClick={() => handleMenuAction('usage')}
              className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-txt-secondary hover:bg-surface-sunken hover:text-txt-primary rounded-lg transition-colors text-left w-full"
            >
              <BarChart3 size={14} /> Usage & Billing
            </button>
            */}
            <button
              onClick={() => handleMenuAction('settings')}
              className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-txt-secondary hover:bg-surface-sunken hover:text-txt-primary rounded-lg transition-colors text-left w-full"
            >
              <Settings size={14} /> Settings
            </button>
            <button
              onClick={() => handleMenuAction('notifications')}
              className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-txt-secondary hover:bg-surface-sunken hover:text-txt-primary rounded-lg transition-colors text-left w-full"
            >
              <Bell size={14} /> Notifications{' '}
              {unreadMessages > 0 && (
                <span className="ml-auto bg-status-danger-bg text-status-danger-text px-1.5 py-0.5 rounded-lg text-[10px] font-mono font-bold border border-status-danger-accent">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </button>

            {/* Invite Code - Only show for non-premium users */}
            {!isPremium && (
              <button
                onClick={() => handleMenuAction('invite-code')}
                className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-brand hover:bg-brand-bg rounded-lg transition-colors text-left w-full"
              >
                <Gift size={14} /> 초대 코드 입력
              </button>
            )}

            {/* Institution Admin Section */}
            {isInstitutionAdmin && (
              <>
                <div className="h-px border-t border-border my-1"></div>
                <div className="px-3 py-1.5">
                  <div className="text-[10px] font-medium text-txt-tertiary">Institution</div>
                </div>
                <button
                  onClick={() => handleMenuAction('institution')}
                  className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-txt-secondary hover:bg-surface-sunken hover:text-txt-primary rounded-lg transition-colors text-left w-full"
                >
                  <Building2 size={14} /> 기관 대시보드
                </button>
              </>
            )}

            <div className="h-px border-t border-border my-1"></div>

            {/* Admin Section - Only show for admins */}
            {isAdmin && (
              <>
                <div className="px-3 py-1.5">
                  <div className="text-[10px] font-medium text-txt-tertiary">Admin</div>
                </div>
                <button
                  onClick={() => handleMenuAction('invite-codes-admin')}
                  className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-txt-secondary hover:bg-surface-sunken hover:text-txt-primary rounded-lg transition-colors text-left w-full"
                >
                  <Gift size={14} /> 초대 코드 관리
                </button>
                <button
                  onClick={() => handleMenuAction('error-logs')}
                  className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-txt-secondary hover:bg-surface-sunken hover:text-txt-primary rounded-lg transition-colors text-left w-full"
                >
                  <AlertCircle size={14} /> Error Logs
                </button>
                <div className="h-px border-t border-border my-1"></div>
              </>
            )}

            <button
              onClick={() => handleMenuAction('signout')}
              className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-status-danger-text hover:bg-status-danger-bg rounded-lg transition-colors text-left w-full"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        )}

        {/* Profile Avatar Trigger */}
        <button
          className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all border relative group
            ${
              isMenuOpen
                ? 'bg-surface-inverse text-txt-inverse border-surface-inverse shadow-sm'
                : isPremium
                  ? 'bg-indicator-premium text-white border-indicator-premium-border shadow-sm'
                  : 'bg-surface-sunken text-txt-secondary border-border hover:border-border hover:shadow-md active:scale-[0.97]'
            }`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isPremium ? <Crown size={16} /> : (profile?.nickname?.[0] || user?.email?.[0] || 'U').toUpperCase()}
          {/* Notification Dot — only show when there are unread messages */}
          {unreadMessages > 0 && (
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-indicator-alert rounded-full border border-surface-card"></div>
          )}
        </button>
      </div>

      {/* Invite Code Modal */}
      <InviteCodeModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={handleInviteSuccess}
      />
    </div>
  )
}
