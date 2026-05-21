import { ImageResponse } from 'next/og'
import { renderOgTemplate, OG_SIZE, OG_CONTENT_TYPE } from '@/src/lib/og-template'

export const runtime = 'edge'
export const alt = '공개 API · Draft'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function OG() {
  return new ImageResponse(
    renderOgTemplate({
      eyebrow: 'Public API',
      headline: '공개 API 레퍼런스',
      subline: '지표·인시던트·QR·Atom 피드·검색 등 파트너 연동용 16 엔드포인트.',
      tags: ['16 엔드포인트', 'RSS 피드', 'RLS 보호'],
    }),
    OG_SIZE,
  )
}
