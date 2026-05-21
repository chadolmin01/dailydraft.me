import { ImageResponse } from 'next/og'
import { renderOgTemplate, OG_SIZE, OG_CONTENT_TYPE } from '@/src/lib/og-template'

export const runtime = 'edge'
export const alt = '신뢰 센터 · Draft'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function OG() {
  return new ImageResponse(
    renderOgTemplate({
      eyebrow: 'Trust Center',
      headline: '신뢰·보안·투명성을 한 URL 에',
      subline: 'SLO·개인정보·보안·약관·공개 API·실사 자료 요청 — 엔터프라이즈 실사 단일 출발점.',
      tags: ['PIPA 준수', 'AES-256 암호화', 'SLO 99.9% target'],
    }),
    OG_SIZE,
  )
}
