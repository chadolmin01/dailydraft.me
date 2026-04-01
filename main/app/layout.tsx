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
  title: 'Draft — AI로 찾는 내 프로젝트 팀',
  description: '스킬과 작업 스타일 기반 AI 매칭으로 사이드프로젝트 팀원을 찾아보세요. 개발자, 디자이너, 기획자들의 팀빌딩 플랫폼.',
  keywords: ['팀빌딩', 'AI매칭', '사이드프로젝트', '팀원모집', '개발자', '디자이너', '기획자', '스타트업'],
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Draft — AI로 찾는 내 프로젝트 팀',
    description: '스킬과 작업 스타일 기반 AI 매칭으로 사이드프로젝트 팀원을 찾아보세요. 개발자, 디자이너, 기획자들의 팀빌딩 플랫폼.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://dailydraft.me',
    siteName: 'Draft',
    type: 'website',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Draft — AI로 찾는 내 프로젝트 팀',
    description: '스킬과 작업 스타일 기반 AI 매칭으로 사이드프로젝트 팀원을 찾아보세요. 개발자, 디자이너, 기획자들의 팀빌딩 플랫폼.',
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Draft',
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
    <html lang="ko" className={`${notoSansKR.variable} ${jetBrainsMono.variable}`}>
      <body>
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
