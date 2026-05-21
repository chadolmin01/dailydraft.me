'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Returns a ref and a boolean `isVisible` that becomes true
 * once the element enters the viewport (stays true).
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  threshold = 0.1,
) {
  const ref = useRef<T>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(el) // only trigger once
        }
      },
      { threshold },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, isVisible }
}
