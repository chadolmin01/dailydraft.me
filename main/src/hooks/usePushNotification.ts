'use client'

import { useState, useEffect, useCallback } from 'react'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported'

export function usePushNotification() {
  const [permission, setPermission] = useState<PushPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission as PushPermission)

    // Serwist 가 SW 자동 등록 — 여기서는 ready 대기 후 구독 상태만 조회.
    // 수동 register('/sw.js') 를 또 호출하면 Serwist 가 이미 등록한 것과 중복되어 무해하지만 혼란 유발.
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setIsSubscribed(!!sub))
      .catch(() => {})
  }, [])

  const subscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
    setIsLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const permission = await Notification.requestPermission()
      setPermission(permission as PushPermission)
      if (permission !== 'granted') return false

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })

      const key = sub.getKey('p256dh')
      const auth = sub.getKey('auth')
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          p256dh: btoa(String.fromCharCode(...new Uint8Array(key!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(auth!))),
        }),
      })

      setIsSubscribed(true)
      return true
    } catch {
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (!sub) return
    await sub.unsubscribe()
    await fetch('/api/push/subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    })
    setIsSubscribed(false)
  }, [])

  return { permission, isSubscribed, isLoading, subscribe, unsubscribe }
}
