import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR, JetBrains_Mono } from 'next/font/google'
import Script from 'next/script'
import { Providers } from '@/src/context/Providers'
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://dailydraft.me'),
  title: 'Draft - 모든 프로젝트는 여기서 시작됩니다',
  description: '프로젝트를 공유하고, 피드백 받고, 함께할 사람을 만나세요.',
  keywords: ['스타트업', '프로젝트', '커뮤니티', '피드백', '사이드프로젝트', '팀빌딩'],
  openGraph: {
    title: 'Draft - 모든 프로젝트는 여기서 시작됩니다',
    description: '프로젝트를 공유하고, 피드백 받고, 함께할 사람을 만나세요.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://dailydraft.me',
    siteName: 'Draft',
    type: 'website',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Draft - 모든 프로젝트는 여기서 시작됩니다',
    description: '프로젝트를 공유하고, 피드백 받고, 함께할 사람을 만나세요.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={`${notoSansKR.variable} ${jetBrainsMono.variable} overflow-x-hidden`}>
      <body className="overflow-x-hidden max-w-[100vw]">
        <Providers>{children}</Providers>
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}
