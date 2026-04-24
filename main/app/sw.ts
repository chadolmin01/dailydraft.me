/// <reference lib="webworker" />

import { defaultCache } from '@serwist/next/worker'
import { Serwist, NetworkFirst, NetworkOnly, type PrecacheEntry, type RuntimeCaching, type SerwistGlobalConfig } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
}

// React Query 가 클라이언트 캐시를 담당하므로 API·RSC 는 절대 SW 캐시 타지 않음.
// static-js/css 는 NetworkFirst — Next 가 content-hash 파일명을 쓰므로 캐시 미스 드묾.
// 네비게이션(HTML) 도 NetworkFirst — 배포 직후 stale 구버전 노출 방지.
const runtimeCaching: RuntimeCaching[] = [
  {
    matcher: /\/api\//,
    handler: new NetworkOnly(),
  },
  {
    matcher: /\/_next\/data\//,
    handler: new NetworkOnly(),
  },
  {
    matcher: /\/_next\/static\/.*\.js$/,
    handler: new NetworkFirst({
      cacheName: 'static-js-assets',
      networkTimeoutSeconds: 3,
    }),
  },
  {
    matcher: /\/_next\/static\/.*\.css$/,
    handler: new NetworkFirst({
      cacheName: 'static-style-assets',
      networkTimeoutSeconds: 3,
    }),
  },
  {
    matcher: ({ request }) => request.mode === 'navigate',
    handler: new NetworkFirst({
      cacheName: 'pages',
      networkTimeoutSeconds: 3,
    }),
  },
  ...defaultCache,
]

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher({ request }) {
          return request.destination === 'document'
        },
      },
    ],
  },
})

serwist.addEventListeners()
