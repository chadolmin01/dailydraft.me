import type { Metadata } from 'next'
import { Providers } from '@/src/context/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Draft - 모든 프로젝트는 여기서 시작됩니다',
  description: '프로젝트를 공유하고, 피드백 받고, 함께할 사람을 만나세요.',
  keywords: ['스타트업', '프로젝트', '커뮤니티', '피드백', '사이드프로젝트', '팀빌딩'],
  openGraph: {
    title: 'Draft - 모든 프로젝트는 여기서 시작됩니다',
    description: '프로젝트를 공유하고, 피드백 받고, 함께할 사람을 만나세요.',
    url: 'https://dailydraft.me',
    siteName: 'Draft',
    images: ['/og-image.png'],
    type: 'website',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Draft - 모든 프로젝트는 여기서 시작됩니다',
    description: '프로젝트를 공유하고, 피드백 받고, 함께할 사람을 만나세요.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-ZDEFY0F999" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-ZDEFY0F999');
            `,
          }}
        />
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600&family=Nanum+Gothic+Coding:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
