import { ImageResponse } from 'next/og'
import { renderOgTemplate, OG_SIZE, OG_CONTENT_TYPE } from '@/src/lib/og-template'

export const runtime = 'edge'
export const alt = '로드맵 · Draft'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function OG() {
  return new ImageResponse(
    renderOgTemplate({
      eyebrow: 'Roadmap',
      headline: 'Draft 가 앞으로 어디로 가는가',
      subline: '분기별 theme 과 주요 기능 계획. planned / in-progress / shipped 상태 투명 공개.',
      tags: ['Q2 2026', 'Meta 심사', 'FLIP 파일럿'],
    }),
    OG_SIZE,
  )
}
