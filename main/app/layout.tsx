import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR, JetBrains_Mono } from 'next/font/google'
import Script from 'next/script'
import { Providers } from '@/src/context/Providers'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { APP_URL } from '@/src/constants'
import { TitleSync } from '@/components/TitleSync'
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

// 검색엔진 site verification — 값은 env 로 주입. 없으면 태그 자체 생략 (잘못된 placeholder 는
// verification 실패 + 콘솔 경고 → 일부러 undefined 로 떨어지게 둠).
const NAVER_VERIFY = process.env.NEXT_PUBLIC_NAVER_VERIFY
const GOOGLE_VERIFY = process.env.NEXT_PUBLIC_GOOGLE_VERIFY
const TWITTER_HANDLE = process.env.NEXT_PUBLIC_TWITTER_HANDLE

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
  keywords: ['팀빌딩', 'AI매칭', '사이드프로젝트', '팀원모집', '개발자', '디자이너', '기획자', '스타트업', '동아리', '주간업데이트', '클럽운영'],
  applicationName: 'Draft',
  authors: [{ name: 'Draft', url: APP_URL }],
  creator: 'Draft',
  publisher: 'Draft',
  category: 'business',
  // 전역 canonical·언어 힌트. 페이지별 metadata 에서 override 한다.
  alternates: {
    canonical: '/',
    languages: {
      'ko-KR': '/',
      'x-default': '/',
    },
  },
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
    // 다국어 지원이 생기면 여기 추가. 지금은 영어가 fallback 인 것만 힌트로 남김.
    alternateLocale: ['en_US'],
    // 기본 OG 이미지. 페이지별 generateMetadata 가 있으면 거기서 override.
    images: [{ url: `${APP_URL}/api/og/default`, width: 1200, height: 630, alt: 'Draft — 동아리의 세대를 잇는 인프라' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Draft — AI로 찾는 내 프로젝트 팀',
    description: '스킬과 작업 스타일 기반 AI 매칭으로 사이드프로젝트 팀원을 찾아보세요. 개발자, 디자이너, 기획자들의 팀빌딩 플랫폼.',
    // 공식 X(Twitter) 계정 확정 전까지 env 로만 주입. placeholder '@draft' 는 카드 검증 실패하므로 금지.
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
    images: [`${APP_URL}/api/og/default`],
  },
  robots: {
    index: true,
    follow: true,
    // googleBot: 이미지·스니펫 크기 제한을 풀어서 OG 이미지가 크게 노출되게 한다.
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Draft',
  },
  // verification: env 로 들어온 값만 내보낸다. 없으면 undefined 로 태그 자체를 생략.
  // 잘못된 placeholder 내보내면 서치 콘솔 verification 실패 + 스팸 신호로 집계됨.
  verification: {
    google: GOOGLE_VERIFY,
    other: NAVER_VERIFY
      ? { 'naver-site-verification': NAVER_VERIFY }
      : undefined,
  },
  formatDetection: {
    // 한글 본문에서 전화번호·이메일·주소 자동 링크 방지 — 디자인 훼손 + 의도하지 않은 통화 유발 방지
    telephone: false,
    email: false,
    address: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  // 브라우저 chrome(모바일 주소창 영역) 색상. PWA manifest theme_color 와 동일.
  // 라이트: Electric Indigo, 다크: surface-card 검정
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#5E6AD2' },
    { media: '(prefers-color-scheme: dark)', color: '#1C1C1E' },
  ],
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
      <head>
        {/* ── 외부 이미지 origin preconnect ──
            Why: 각 origin 의 DNS + TCP + TLS 왕복(모바일 3G ~400ms)을 HTML 파싱 중 미리 처리.
                 실제 <Image> 가 내려오는 시점에 커넥션이 이미 준비돼 LCP·이미지 섹션 로딩 단축.
            원칙: 실사용 중인 hostname 만 등록(과도하면 역효과). next.config 의 remotePatterns 와 정합.
            next/font 는 자동 preload 이므로 font preload 라인은 추가하지 않음. */}
        <link rel="preconnect" href="https://prxqjiuibfrmuwwmkhqb.supabase.co" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://lh3.googleusercontent.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://avatars.githubusercontent.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://k.kakaocdn.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://phinf.pstatic.net" crossOrigin="anonymous" />
        {/* dns-prefetch 는 preconnect 미지원 브라우저용 폴백 */}
        <link rel="dns-prefetch" href="https://picsum.photos" />
        {/* OpenSearch — 브라우저 주소창 검색엔진 등록 */}
        <link
          rel="search"
          type="application/opensearchdescription+xml"
          title="Draft"
          href="/opensearch.xml"
        />
      </head>
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
          <WebVitalsReporter />
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
