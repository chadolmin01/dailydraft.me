import React from 'react'
import { APP_URL } from '@/src/constants'

/**
 * Structured data (JSON-LD) for landing page SEO.
 *
 * 주입 위치: app/page.tsx (루트 랜딩) — <Script type="application/ld+json"> 대신
 * <script dangerouslySetInnerHTML> 를 쓴다. 이유:
 *   - next/script 의 beforeInteractive 는 runtime 이 필요한데, JSON-LD 는 정적 string 만 넣으면 충분
 *   - Googlebot 은 DOM 파싱 시점에 JSON-LD 를 읽으므로 Strategy 불필요
 *   - React 19 에서 <script type="application/ld+json"> 은 Head 병합 대상 아님 → body 안에 놔도 크롤러 인식됨
 *
 * schema.org 스펙:
 *   - Organization: 회사 정보. Google Knowledge Panel 후보
 *   - WebSite + SearchAction: 검색 결과에 "sitelinks searchbox" 노출
 *   - SoftwareApplication: Google 의 "앱" 카드 노출 후보
 *   - FAQPage: 검색 결과에 FAQ rich result 노출 (별도 컴포넌트)
 *
 * 트레이드오프: 여러 @type 을 한 script 에 array 로 넣어도 되지만, 각각 별도 <script> 로 분리해서
 * 검증 도구(Rich Results Test) 에서 개별적으로 체크하기 쉽게 했다.
 */

const ORG_EMAIL = 'team@dailydraft.me'
const FOUNDING_DATE = '2026-03'

function OrganizationLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Draft',
    alternateName: 'dailydraft',
    url: APP_URL,
    logo: `${APP_URL}/icon-512x512.png`,
    email: ORG_EMAIL,
    foundingDate: FOUNDING_DATE,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'KR',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: ORG_EMAIL,
        availableLanguage: ['ko', 'en'],
      },
      {
        '@type': 'ContactPoint',
        contactType: 'technical support',
        email: ORG_EMAIL,
        availableLanguage: ['ko', 'en'],
      },
      {
        '@type': 'ContactPoint',
        contactType: 'security',
        email: ORG_EMAIL,
        availableLanguage: ['ko', 'en'],
      },
    ],
    sameAs: [
      // 실제 공식 채널이 확정되면 여기 추가. 현재는 비워둠 (placeholder 링크를 넣으면 SEO 악영향).
    ],
  }
  return (
    <script
      type="application/ld+json"
      // JSON 은 한 번만 직렬화. React 가 이 문자열을 HTML 에 그대로 주입.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

function WebSiteLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Draft',
    url: APP_URL,
    inLanguage: 'ko-KR',
    // SearchAction — Google 에 "sitelinks searchbox" 후보로 제공. 실제 /explore?q= 로 리다이렉트.
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${APP_URL}/explore?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

function SoftwareApplicationLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Draft',
    url: APP_URL,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      '동아리·프로젝트 운영을 구조화하는 SaaS. 주간 업데이트, 멤버 관리, 기수별 타임라인, Discord·GitHub 연동, AI 페르소나 자동 발행.',
    inLanguage: 'ko-KR',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW',
      availability: 'https://schema.org/InStock',
      category: 'Free',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Draft',
      url: APP_URL,
    },
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

/**
 * 랜딩 페이지 구조화 데이터 번들. <HomePageClient /> 와 나란히 app/page.tsx 에서 렌더링.
 * 개별 <script> 로 나눠 각 @type 을 Rich Results Test 에서 독립 검증 가능하게 구성.
 */
export function JsonLd() {
  return (
    <>
      <OrganizationLd />
      <WebSiteLd />
      <SoftwareApplicationLd />
    </>
  )
}

/**
 * FAQ 구조화 데이터 — components/home/FAQ.tsx 의 faqs 배열과 1:1 동기.
 * 검색 결과에 "FAQ rich result"(아코디언) 로 노출될 후보.
 *
 * 주의: 실제 렌더 FAQ 와 내용이 다르면 Google 이 스팸으로 판정할 수 있어서
 * 수정 시 FAQ.tsx 와 같이 고쳐야 한다.
 */
const faqItems: ReadonlyArray<{ question: string; answer: string }> = [
  {
    question: 'Discord가 없어도 사용할 수 있나요?',
    answer:
      '네. Draft는 Discord 없이도 독립적으로 사용 가능합니다. 주간 업데이트, 멤버 관리, 기수별 타임라인 등 핵심 기능은 Draft 자체만으로 완전히 동작합니다. Discord 봇은 자동 수집을 더해주는 부가 연동입니다.',
  },
  {
    question: '카카오톡으로 소통하는 동아리도 쓸 수 있나요?',
    answer:
      '네. Draft의 핵심 가치는 소통 채널과 무관하게 운영을 구조화하는 것입니다. 카카오톡, 슬랙, 디스코드 등 어떤 메신저를 쓰더라도 Draft의 운영 기능은 동일하게 사용할 수 있습니다. 소통은 원하는 곳에서, 운영은 Draft에서 하시면 됩니다.',
  },
  {
    question: '기존 멤버 데이터를 가져올 수 있나요?',
    answer:
      '엑셀(.xlsx), 구글 시트, 노션 데이터베이스에서 멤버 데이터를 한 번에 임포트할 수 있습니다. 이름, 역할, 기수, 연락처 등의 필드를 매핑하여 기존 데이터를 손실 없이 옮길 수 있습니다.',
  },
  {
    question: '동아리 규모에 제한이 있나요?',
    answer:
      'Free 플랜은 멤버 50명까지 지원합니다. 대부분의 대학 동아리는 이 범위 안에 충분히 들어옵니다. 더 큰 규모가 필요하시면 Pro 플랜(출시 예정)에서 무제한 멤버를 지원할 예정입니다.',
  },
  {
    question: '데이터는 안전한가요?',
    answer:
      '모든 데이터는 Supabase(AWS 서울 리전)에 암호화되어 저장됩니다. Row Level Security(RLS)를 통해 동아리 멤버만 해당 동아리 데이터에 접근할 수 있으며, 개인정보는 서비스 운영 목적 외에 제3자에게 제공되지 않습니다.',
  },
]

export function FaqJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
