import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR, JetBrains_Mono } from 'next/font/google'
import { Providers } from '@/src/context/Providers'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { APP_URL } from '@/src/constants'
import { WebVitalsReporter } from '@/components/WebVitalsReporter'
import './globals.css'

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-kr',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
})

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Draft',
    template: '%s | Draft',
  },
  description: 'Draft V2',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let initialUser = null
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    initialUser = user ?? null
  } catch {}

  return (
    <html lang="ko" className={`${notoSansKR.variable} ${jetBrainsMono.variable}`}>
      <body>
        <Providers initialUser={initialUser}>
          <WebVitalsReporter />
          {children}
        </Providers>
      </body>
    </html>
  )
}
