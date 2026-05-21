import { ImageResponse } from 'next/og'
import { renderOgTemplate, OG_SIZE, OG_CONTENT_TYPE } from '@/src/lib/og-template'

export const runtime = 'edge'
export const alt = '자주 묻는 질문 · Draft'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function OG() {
  return new ImageResponse(
    renderOgTemplate({
      eyebrow: 'Help',
      headline: 'Draft 를 처음 쓰시거나 학교 도입을 검토 중이시라면',
      subline: '시작·운영·데이터·보안·학교 도입·플랜 5개 카테고리 17 질문.',
      tags: ['시작하기', '학교·기관 도입', '데이터 보안'],
    }),
    OG_SIZE,
  )
}
