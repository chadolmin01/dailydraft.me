'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Inbox, Sparkles, Users } from 'lucide-react'

const navItems = [
  { href: '/', icon: Home, label: '홈' },
  { href: '/challenge', icon: Sparkles, label: '챌린지', disabled: true },
  { href: '/inbox', icon: Inbox, label: '인박스' },
  { href: '/feed', icon: Users, label: '피드', disabled: true },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-lg border-t border-zinc-800 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          if (item.disabled) {
            return (
              <div
                key={item.href}
                className="flex flex-col items-center justify-center w-16 h-full opacity-30"
              >
                <Icon className="w-6 h-6" />
                <span className="text-[10px] mt-1">{item.label}</span>
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 h-full transition-colors tap-target ${
                isActive ? 'text-white' : 'text-zinc-500'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
              <span className="text-[10px] mt-1">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
