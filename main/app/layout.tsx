import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR, JetBrains_Mono } from 'next/font/google'
import Script from 'next/script'
import { Providers } from '@/src/context/Providers'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { APP_URL } from '@/src/constants'
import { TitleSync } from '@/components/TitleSync'
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
  // title: default 는 비로그인/SEO 크롤러·초기 로드용. 로그인 후 라우트 전환 시 탭 타이틀은
  // <TitleSync /> 가 pathname 기반으로 즉시 동기화 (src/lib/routes/titles.ts 참조).
  // template 은 SEO 동적 페이지에서 `{page} | Draft` 형태로 자동 조립.
  title: {
    default: 'Draft — AI로 찾는 내 프로젝트 팀',
    template: '%s | Draft',
  },
  description: '스킬과 작업 스타일 기반 AI 매칭으로 사이드프로젝트 팀원을 찾아보세요. 개발자, 디자이너, 기획자들의 팀빌딩 플랫폼.',
  keywords: ['팀빌딩', 'AI매칭', '사이드프로젝트', '팀원모집', '개발자', '디자이너', '기획자', '스타트업'],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
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
    url: APP_URL,
    siteName: 'Draft',
    type: 'website',
    locale: 'ko_KR',
    // 기본 OG 이미지. 페이지별 generateMetadata 가 있으면 거기서 override.
    images: [{ url: `${APP_URL}/api/og/default`, width: 1200, height: 630, alt: 'Draft — 동아리의 세대를 잇는 인프라' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Draft — AI로 찾는 내 프로젝트 팀',
    description: '스킬과 작업 스타일 기반 AI 매칭으로 사이드프로젝트 팀원을 찾아보세요. 개발자, 디자이너, 기획자들의 팀빌딩 플랫폼.',
    images: [`${APP_URL}/api/og/default`],
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 서버에서 유저를 미리 읽어 클라이언트에 주입 — getUser()는 서버 검증으로 토큰 조작 방지
  let initialUser = null
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    initialUser = user ?? null
  } catch { /* 세션 없으면 null */ }

  return (
    <html lang="ko" className={`${notoSansKR.variable} ${jetBrainsMono.variable}`}>
      <body>
        {/* 키보드 사용자용 skip link — Tab 으로 포커스되면 화면 좌상단에 노출.
            WCAG 2.4.1 Bypass Blocks 충족. 페이지별 #main-content anchor 는 기본 layout 에 포함. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand focus:text-white focus:rounded-full focus:shadow-lg focus:text-sm focus:font-semibold"
        >
          메인 콘텐츠로 이동
        </a>
        <Providers initialUser={initialUser}>
          <TitleSync />
          {children}
        </Providers>
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
