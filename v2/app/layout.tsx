import type { Metadata, Viewport } from 'next'
import { Noto_Serif_KR, JetBrains_Mono } from 'next/font/google'
import { Providers } from '@/src/context/Providers'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { APP_URL } from '@/src/constants'
import './globals.css'

const notoSerifKR = Noto_Serif_KR({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-display-kr',
  display: 'swap',
  preload: true,
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono-en',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Draft',
    template: '%s — Draft',
  },
  description: '창업기관 운영자 워크스페이스',
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#faf9f5',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let initialUser = null
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    initialUser = user ?? null
  } catch {}

  return (
    <html lang="ko" className={`${notoSerifKR.variable} ${jetBrainsMono.variable}`}>
      <head>
        {/* Pretendard Variable — body 폰트. next/font 가 지원하지 않아 CDN preload */}
        <link
          rel="preload"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
          as="style"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body>
        <Providers initialUser={initialUser}>{children}</Providers>
      </body>
    </html>
  )
}
