import { ImageResponse } from 'next/og'
import { renderOgTemplate, OG_SIZE, OG_CONTENT_TYPE } from '@/src/lib/og-template'

export const runtime = 'edge'
export const alt = '릴리스 노트 · Draft'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function OG() {
  return new ImageResponse(
    renderOgTemplate({
      eyebrow: 'Changelog',
      headline: 'Draft 가 지금까지 어떻게 달라져왔는가',
      subline: '주요 배포·보안·기능 변경 이력을 공개합니다. Atom 피드도 구독 가능.',
      tags: ['공개 릴리스', 'Atom 피드', 'GitHub 커밋 연결'],
    }),
    OG_SIZE,
  )
}
