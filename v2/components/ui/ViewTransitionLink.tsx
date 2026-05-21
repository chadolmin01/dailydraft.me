'use client'

import Link, { LinkProps } from 'next/link'
import { useRouter } from 'next/navigation'
import { ComponentProps, forwardRef, MouseEvent } from 'react'

type ViewTransitionLinkProps = Omit<ComponentProps<'a'>, keyof LinkProps> &
  LinkProps & {
    children: React.ReactNode
  }

/**
 * Next Link 에 View Transitions API 크로스페이드를 얹은 래퍼.
 *
 * Chrome/Edge (2024+): 클릭 시 document.startViewTransition 호출 →
 *   browser-native 240ms 페이드가 자동 적용됨 (globals.css 에서 타이밍 세팅).
 * Safari/Firefox: 기본 Link 동작 그대로 (fallback).
 *
 * 언제 써야:
 *   - 같은 레이아웃 내 페이지 전환 (sidebar/tabbar 그대로)
 *   - 사용자가 큰 시각 변화에 멀미나는 곳
 *
 * 언제 쓰면 안 됨:
 *   - 외부 URL (_blank)
 *   - 크기가 큰 애니메이션이 이미 있는 페이지 (중첩 페이드로 어색함)
 *   - Cmd/Ctrl-click 으로 새 탭 여는 경우 → 기본 동작 유지해야 함 (이 컴포넌트가 자동 처리)
 */
type StartViewTransitionFn = (cb: () => void) => { finished: Promise<void> }

export const ViewTransitionLink = forwardRef<HTMLAnchorElement, ViewTransitionLinkProps>(
  function ViewTransitionLink({ href, onClick, ...rest }, ref) {
    const router = useRouter()

    const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e)
      if (e.defaultPrevented) return
      // 모디파이어 키 (새 탭/창) 는 기본 동작 유지
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
      if (typeof href !== 'string') return

      if (typeof document !== 'undefined') {
        const doc = document as Document & { startViewTransition?: StartViewTransitionFn }
        if (doc.startViewTransition) {
          e.preventDefault()
          doc.startViewTransition(() => {
            router.push(href)
          })
        }
      }
    }

    return <Link ref={ref} href={href} onClick={handleClick} {...rest} />
  }
)
