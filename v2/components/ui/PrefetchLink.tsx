'use client'

import Link, { LinkProps } from 'next/link'
import { useRouter } from 'next/navigation'
import { ComponentProps, forwardRef, useCallback, useRef } from 'react'

type PrefetchLinkProps = Omit<ComponentProps<'a'>, keyof LinkProps> &
  LinkProps & {
    children: React.ReactNode
    /** hover/focus 감지 후 prefetch 까지의 지연 (ms). 빠르게 지나치는 hover 는 prefetch 안 하도록. */
    prefetchDelay?: number
  }

/**
 * next/link 위에 한 겹 더 싼 컴포넌트.
 *
 * Next/Link 는 뷰포트 진입 시 prefetch 하지만 hover 시는 production 에서만 동작하고
 * 즉시 발사가 아님. 실사용에서 마우스를 올린 순간 prefetch 를 더 적극적으로
 * 발사해 체감 속도를 끌어올림.
 *
 * 동작:
 *   - mouseenter / focus → 120ms 후 prefetch 발사 (너무 빠른 스쳐 지나감 제외)
 *   - mouseleave / blur → 대기 중이었으면 취소
 *   - 이미 prefetch 한 href 는 재호출 안 함 (내부 Set)
 *
 * Note: router.prefetch 는 idempotent 하므로 중복 호출해도 비용 거의 없음.
 * 단 서버 RSC payload 가 이미 fetched 면 그대로 재사용.
 */
const prefetched = new Set<string>()

export const PrefetchLink = forwardRef<HTMLAnchorElement, PrefetchLinkProps>(
  function PrefetchLink({ href, prefetchDelay = 120, onMouseEnter, onMouseLeave, onFocus, onBlur, ...rest }, ref) {
    const router = useRouter()
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const firePrefetch = useCallback(() => {
      if (typeof href !== 'string') return
      if (prefetched.has(href)) return
      prefetched.add(href)
      try {
        router.prefetch(href)
      } catch {
        /* 라우터 prefetch 실패는 조용히 무시 — 실제 클릭 시 정상 네비 */
      }
    }, [href, router])

    const schedule = useCallback(() => {
      if (timerRef.current) return
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        firePrefetch()
      }, prefetchDelay)
    }, [firePrefetch, prefetchDelay])

    const cancel = useCallback(() => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }, [])

    return (
      <Link
        ref={ref}
        href={href}
        onMouseEnter={(e) => {
          schedule()
          onMouseEnter?.(e)
        }}
        onMouseLeave={(e) => {
          cancel()
          onMouseLeave?.(e)
        }}
        onFocus={(e) => {
          schedule()
          onFocus?.(e)
        }}
        onBlur={(e) => {
          cancel()
          onBlur?.(e)
        }}
        {...rest}
      />
    )
  }
)
