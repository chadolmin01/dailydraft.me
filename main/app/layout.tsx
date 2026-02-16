import type { Metadata } from 'next'
import { Providers } from '@/src/context/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Draft - AI 기반 팀 빌딩 플랫폼',
  description: '스타트업, 공모전, 사이드 프로젝트를 위한 AI 매칭 서비스. 아이디어 검증부터 IR 자료 생성까지, Draft OS 하나로 끝내세요.',
  keywords: ['스타트업', '팀빌딩', 'AI', '공동창업자', '사이드프로젝트', '예비창업패키지'],
  openGraph: {
    title: 'Draft - AI 기반 팀 빌딩 플랫폼',
    description: '초기 창업자와 대학생을 위한 AI 팀 빌딩 플랫폼',
    url: 'https://dailydraft.me',
    siteName: 'Draft',
    type: 'website',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Draft - AI 기반 팀 빌딩 플랫폼',
    description: '초기 창업자와 대학생을 위한 AI 팀 빌딩 플랫폼',
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
