import * as React from 'react'

/**
 * 공통 이메일 레이아웃 / 디자인 토큰.
 * 소프트 미니멀리즘(Toss 스타일) — invite-code 템플릿과 동일한 톤.
 * 모든 트랜잭셔널 이메일은 이 레이아웃을 래퍼로 사용해 톤을 통일한다.
 */

export const emailTokens = {
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", Arial, sans-serif',
  bgOuter: '#f5f5f5',
  bgInner: '#ffffff',
  bgSoft: '#fafafa',
  bgMuted: '#f3f4f6',
  border: '#e5e7eb',
  primary: '#111827',
  textBody: '#4b5563',
  textMuted: '#9ca3af',
  accent: '#2563eb',
  danger: '#dc2626',
}

const t = emailTokens

export const emailStyles = {
  outer: {
    margin: 0,
    padding: '48px 20px',
    backgroundColor: t.bgOuter,
    fontFamily: t.font,
  } as React.CSSProperties,
  container: {
    maxWidth: '520px',
    margin: '0 auto',
    backgroundColor: t.bgInner,
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    overflow: 'hidden' as const,
  } as React.CSSProperties,
  header: {
    padding: '32px 40px 0 40px',
    display: 'flex',
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  } as React.CSSProperties,
  headerLabel: {
    fontSize: '11px',
    color: '#6b7280',
    letterSpacing: '1.5px',
    textTransform: 'uppercase' as const,
    margin: 0,
  } as React.CSSProperties,
  brand: {
    fontFamily: 'Georgia, serif',
    fontSize: '15px',
    fontWeight: 600,
    color: t.primary,
    margin: 0,
  } as React.CSSProperties,
  body: {
    padding: '32px 40px',
  } as React.CSSProperties,
  heading: {
    fontSize: '24px',
    fontWeight: 700,
    color: t.primary,
    letterSpacing: '-0.3px',
    lineHeight: 1.3,
    margin: '0 0 16px 0',
  } as React.CSSProperties,
  text: {
    fontSize: '15px',
    color: t.textBody,
    lineHeight: 1.7,
    margin: '0 0 20px 0',
  } as React.CSSProperties,
  card: {
    padding: '20px 24px',
    backgroundColor: t.bgSoft,
    border: `1px solid ${t.border}`,
    borderRadius: '12px',
    marginBottom: '24px',
  } as React.CSSProperties,
  cardLabel: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: 600,
    margin: '0 0 8px 0',
  } as React.CSSProperties,
  ctaWrap: {
    textAlign: 'center' as const,
    padding: '8px 0 16px 0',
  } as React.CSSProperties,
  cta: {
    display: 'inline-block',
    padding: '14px 36px',
    fontSize: '15px',
    fontWeight: 600,
    color: '#ffffff',
    backgroundColor: t.primary,
    borderRadius: '10px',
    textDecoration: 'none',
  } as React.CSSProperties,
  ctaSecondary: {
    display: 'inline-block',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 500,
    color: t.primary,
    backgroundColor: t.bgMuted,
    borderRadius: '8px',
    textDecoration: 'none',
  } as React.CSSProperties,
  footer: {
    padding: '24px 40px 32px 40px',
    backgroundColor: t.bgSoft,
    textAlign: 'center' as const,
    borderTop: `1px solid ${t.border}`,
  } as React.CSSProperties,
  footerText: {
    fontSize: '12px',
    color: t.textMuted,
    lineHeight: 1.6,
    margin: '0 0 4px 0',
  } as React.CSSProperties,
}

interface EmailLayoutProps {
  /** 상단 좌측 소형 라벨 (한글 권장, 예: "커피챗") */
  eyebrow?: string
  /** 푸터 상단 안내 문구 (선택) */
  footerNote?: string
  children: React.ReactNode
}

/**
 * 모든 트랜잭셔널 이메일의 공통 래퍼.
 * 왜: 7개 템플릿이 제각각 브루탈/그라디언트/소프트로 흩어져 있어서
 *     브랜드 일관성 붕괴. 레이아웃을 단일 소스로 강제해야 유지보수 가능.
 */
export function EmailLayout({ eyebrow, footerNote, children }: EmailLayoutProps) {
  return (
    <div style={emailStyles.outer}>
      <div style={emailStyles.container}>
        <div style={emailStyles.header}>
          <p style={emailStyles.headerLabel}>{eyebrow || ''}</p>
          <p style={emailStyles.brand}>Draft.</p>
        </div>
        <div style={emailStyles.body}>{children}</div>
        <div style={emailStyles.footer}>
          {footerNote && <p style={emailStyles.footerText}>{footerNote}</p>}
          <p style={emailStyles.footerText}>© 2026 Draft. 모든 프로젝트는 여기서 시작됩니다.</p>
        </div>
      </div>
    </div>
  )
}

/** 서버사이드 렌더 헬퍼 — 각 템플릿의 render 함수에서 재사용 */
export function renderEmail(element: React.ReactElement): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactDOMServer = require('react-dom/server')
  return ReactDOMServer.renderToStaticMarkup(element)
}
