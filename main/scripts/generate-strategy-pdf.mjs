#!/usr/bin/env node
/**
 * 2026 수익화 전략 문서 PDF 생성기
 *
 * 사용법:
 *   node scripts/generate-strategy-pdf.mjs
 *
 * 입력: main/docs/2026_수익화전략_팀공유문서.md
 * 출력: main/docs/2026_수익화전략_팀공유문서.pdf
 *
 * Draft 브랜딩:
 *   - Toss Blue (#0052CC) 액센트
 *   - Pretendard 폰트
 *   - 소프트 미니멀리즘 (rounded-xl, soft shadow)
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { marked } from 'marked'
import puppeteer from 'puppeteer'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DOCS_DIR = resolve(__dirname, '../docs')
const MD_PATH = resolve(DOCS_DIR, '2026_수익화전략_팀공유문서.md')
const PDF_PATH = resolve(DOCS_DIR, '2026_수익화전략_팀공유문서.pdf')

console.log('[1/4] 마크다운 읽는 중...')
const md = readFileSync(MD_PATH, 'utf-8')

console.log('[2/4] HTML 변환 중...')
marked.setOptions({
  gfm: true,
  breaks: false,
})

const bodyHtml = marked.parse(md)

const title = 'Draft 2026 수익화 전략'
const generatedDate = new Date().toLocaleDateString('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable.css" rel="stylesheet">
<style>
  :root {
    --blue: #0052CC;
    --blue-soft: #EBF2FF;
    --blue-deep: #003D99;
    --ink: #0F172A;
    --body: #334155;
    --mute: #64748B;
    --line: #E2E8F0;
    --line-soft: #F1F5F9;
    --surface: #FFFFFF;
    --surface-soft: #F8FAFC;
    --radius: 12px;
    --radius-lg: 16px;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  @page {
    size: A4;
    margin: 18mm 16mm 20mm 16mm;
  }

  html, body {
    font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Malgun Gothic', sans-serif;
    font-size: 10pt;
    line-height: 1.75;
    color: var(--body);
    background: white;
    letter-spacing: -0.01em;
  }

  /* 커버 페이지 */
  .cover {
    page-break-after: always;
    padding: 80mm 0 0 0;
    text-align: left;
    min-height: 250mm;
  }

  .cover-brand {
    display: inline-block;
    font-size: 10pt;
    font-weight: 700;
    color: var(--blue);
    letter-spacing: 0.15em;
    margin-bottom: 12mm;
  }

  .cover-brand::before {
    content: "";
    display: inline-block;
    width: 24px;
    height: 3px;
    background: var(--blue);
    vertical-align: middle;
    margin-right: 10px;
    margin-bottom: 3px;
  }

  .cover-title {
    font-size: 36pt;
    font-weight: 800;
    color: var(--ink);
    line-height: 1.15;
    margin-bottom: 8mm;
    letter-spacing: -0.03em;
  }

  .cover-sub {
    font-size: 14pt;
    color: var(--mute);
    font-weight: 500;
    margin-bottom: 40mm;
    line-height: 1.5;
    max-width: 140mm;
  }

  .cover-meta {
    border-top: 1px solid var(--line);
    padding-top: 8mm;
    display: flex;
    gap: 60mm;
    font-size: 9pt;
  }

  .cover-meta-item .label {
    color: var(--mute);
    font-size: 8pt;
    margin-bottom: 2mm;
    letter-spacing: 0.05em;
  }

  .cover-meta-item .value {
    color: var(--ink);
    font-weight: 600;
    font-size: 10pt;
  }

  .cover-footer {
    position: absolute;
    bottom: 20mm;
    left: 16mm;
    right: 16mm;
    display: flex;
    justify-content: space-between;
    font-size: 8pt;
    color: var(--mute);
    border-top: 1px solid var(--line);
    padding-top: 4mm;
  }

  /* 본문 헤딩 */
  .content {
    padding-top: 4mm;
  }

  h1 {
    font-size: 22pt;
    font-weight: 800;
    color: var(--ink);
    margin: 18mm 0 6mm 0;
    padding-bottom: 4mm;
    border-bottom: 3px solid var(--blue);
    letter-spacing: -0.02em;
    page-break-before: always;
    page-break-after: avoid;
  }

  .content > h1:first-child {
    page-break-before: avoid;
    margin-top: 0;
  }

  h2 {
    font-size: 15pt;
    font-weight: 700;
    color: var(--ink);
    margin: 10mm 0 4mm 0;
    letter-spacing: -0.02em;
    page-break-after: avoid;
  }

  h2::before {
    content: "";
    display: inline-block;
    width: 4px;
    height: 18px;
    background: var(--blue);
    vertical-align: middle;
    margin-right: 8px;
    border-radius: 2px;
    margin-bottom: 3px;
  }

  h3 {
    font-size: 12pt;
    font-weight: 700;
    color: var(--ink);
    margin: 7mm 0 3mm 0;
    letter-spacing: -0.01em;
    page-break-after: avoid;
  }

  h4 {
    font-size: 10.5pt;
    font-weight: 700;
    color: var(--blue-deep);
    margin: 5mm 0 2mm 0;
    page-break-after: avoid;
  }

  /* 본문 요소 */
  p {
    margin: 3mm 0;
    color: var(--body);
    font-size: 10pt;
    line-height: 1.8;
  }

  strong {
    font-weight: 700;
    color: var(--ink);
  }

  em {
    font-style: italic;
    color: var(--body);
  }

  a {
    color: var(--blue);
    text-decoration: none;
    border-bottom: 1px solid var(--blue-soft);
  }

  code {
    font-family: 'JetBrains Mono', 'Consolas', monospace;
    font-size: 9pt;
    background: var(--surface-soft);
    color: var(--blue-deep);
    padding: 1px 6px;
    border-radius: 4px;
    border: 1px solid var(--line);
  }

  pre {
    background: var(--surface-soft);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 4mm 5mm;
    margin: 4mm 0;
    overflow-x: auto;
    page-break-inside: avoid;
  }

  pre code {
    background: transparent;
    border: none;
    padding: 0;
    font-size: 8.5pt;
    line-height: 1.7;
    color: var(--ink);
  }

  /* 리스트 */
  ul, ol {
    margin: 3mm 0 3mm 6mm;
    color: var(--body);
  }

  ul li, ol li {
    margin: 1.5mm 0;
    padding-left: 2mm;
    font-size: 10pt;
    line-height: 1.75;
  }

  ul li::marker {
    color: var(--blue);
  }

  ol li::marker {
    color: var(--blue);
    font-weight: 700;
  }

  /* 표 */
  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin: 5mm 0;
    font-size: 9pt;
    page-break-inside: avoid;
    border-radius: var(--radius);
    overflow: hidden;
    border: 1px solid var(--line);
  }

  thead {
    background: var(--surface-soft);
  }

  th {
    padding: 3mm 4mm;
    text-align: left;
    font-weight: 700;
    color: var(--ink);
    font-size: 9pt;
    border-bottom: 2px solid var(--line);
    letter-spacing: -0.01em;
  }

  td {
    padding: 3mm 4mm;
    color: var(--body);
    font-size: 9pt;
    border-bottom: 1px solid var(--line-soft);
    vertical-align: top;
    line-height: 1.6;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  tbody tr:nth-child(even) {
    background: #FAFBFC;
  }

  /* 강조 박스 (blockquote) */
  blockquote {
    background: var(--blue-soft);
    border-left: 4px solid var(--blue);
    padding: 4mm 6mm;
    margin: 5mm 0;
    border-radius: 0 var(--radius) var(--radius) 0;
    color: var(--ink);
    page-break-inside: avoid;
  }

  blockquote p {
    margin: 0;
    color: var(--ink);
    font-weight: 500;
  }

  /* 구분선 */
  hr {
    border: none;
    border-top: 1px solid var(--line);
    margin: 10mm 0;
  }

  /* 체크리스트·이모지 헤딩 특별 처리 */
  h2:first-letter, h3:first-letter {
    /* 이모지 간격 */
  }

  /* 페이지 나눔 제어 */
  .section { page-break-inside: avoid; }
  table, pre, blockquote { page-break-inside: avoid; }

  /* 인쇄 최적화 */
  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    a { color: var(--blue); border-bottom: none; }
  }
</style>
</head>
<body>

<!-- 커버 페이지 -->
<section class="cover">
  <div class="cover-brand">DRAFT · STRATEGY</div>
  <h1 class="cover-title">2026<br>수익화 전략</h1>
  <p class="cover-sub">대학 동아리 브랜딩 자동화 엔진<br>₩10M 달성 로드맵 · 2026년 4월 ~ 12월</p>

  <div class="cover-meta">
    <div class="cover-meta-item">
      <div class="label">작성일</div>
      <div class="value">${generatedDate}</div>
    </div>
    <div class="cover-meta-item">
      <div class="label">버전</div>
      <div class="value">v1.0</div>
    </div>
    <div class="cover-meta-item">
      <div class="label">대상</div>
      <div class="value">창업팀 · 관계자</div>
    </div>
  </div>

  <div class="cover-footer">
    <span>Draft — 대학 동아리 브랜딩 자동화 엔진</span>
    <span>Confidential</span>
  </div>
</section>

<!-- 본문 -->
<main class="content">
${bodyHtml}
</main>

</body>
</html>`

console.log('[3/4] Puppeteer로 PDF 생성 중...')
const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
  ],
})

try {
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })

  await page.pdf({
    path: PDF_PATH,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '18mm',
      right: '16mm',
      bottom: '20mm',
      left: '16mm',
    },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="width:100%; font-family: 'Pretendard Variable', -apple-system, sans-serif; font-size:8pt; color:#94A3B8; padding: 0 16mm; display:flex; justify-content:space-between;">
        <span>Draft 2026 수익화 전략</span>
        <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
      </div>
    `,
  })
} finally {
  await browser.close()
}

const stats = (await import('node:fs')).statSync(PDF_PATH)
console.log(`[4/4] 완료! → ${PDF_PATH}`)
console.log(`       크기: ${(stats.size / 1024).toFixed(1)} KB`)
