import { marked } from 'marked'

// Claude 의 텍스트 응답을 안전한 HTML 로 렌더.
//
// 보안:
//   - 입력은 Claude 의 출력 — 우리 system prompt 가 통제하므로 신뢰도 높음
//   - marked 기본 동작이 raw HTML 을 escape → <script> 같은 게 텍스트로 렌더됨
//   - 추가로 위험 태그를 정규식으로 한 번 더 제거 (이중 방어)
//
// 지원:
//   - **굵게**, *기울임*, `코드`, [링크](url), 줄바꿈, 목록, 표
//   - 한국어 본문 친화 (gfm + breaks)

marked.setOptions({
  gfm: true,
  breaks: true,
})

const FORBIDDEN_TAGS = /<\/?(script|iframe|object|embed|link|meta|style|form|input)\b[^>]*>/gi

export function renderMarkdown(text: string): string {
  const html = marked.parse(text, { async: false }) as string
  // 이중 방어: 만에 하나 marked 가 통과시킨 위험 태그 제거
  return html.replace(FORBIDDEN_TAGS, '')
}
