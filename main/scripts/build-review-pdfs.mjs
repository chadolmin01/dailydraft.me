// Meta App Review 제출 패키지를 PDF로 변환. md-to-pdf(Puppeteer 기반) 사용.
// 입력: docs/meta-app-review/*.md (8개)
// 출력: docs/meta-app-review/dist/*.pdf + draft-meta-review-package-v1.0.pdf (번들)
//
// 실행: pnpm review:pdf
// 요구사항: md-to-pdf 이미 devDependency 에 있음. Puppeteer 최초 실행 시 Chrome download.

import { mdToPdf } from 'md-to-pdf'
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const SRC_DIR = path.resolve('docs/meta-app-review')
const OUT_DIR = path.resolve('docs/meta-app-review/dist')

// Puppeteer 가 번들 Chrome 을 못 찾으면 환경변수 또는 로컬 다운로드 경로 사용.
// `npx @puppeteer/browsers install chrome@<ver>` 로 받으면 ./chrome/ 이 생김.
function resolveChromeExecutable() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH
  const candidates = [
    'chrome/win64-147.0.7727.56/chrome-win64/chrome.exe',
    'chrome/mac_arm-147.0.7727.56/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
    'chrome/linux-147.0.7727.56/chrome-linux64/chrome',
  ]
  for (const c of candidates) {
    const abs = path.resolve(c)
    if (existsSync(abs)) return abs
  }
  return undefined // md-to-pdf 의 기본 puppeteer cache 에 위임
}
const CHROME_EXECUTABLE = resolveChromeExecutable()

// 제출 순서 고정 — SUBMISSION 이 맨 앞, README 는 내부용이라 번들 제외.
const FILE_ORDER = [
  'SUBMISSION.md',
  'use-case.md',
  'demo-video-script.md',
  'compliance-attestation.md',
  'security-architecture.md',
  'reviewer-expectations.md',
  'privacy-policy-checklist.md',
]

// 엔터프라이즈 제출 표준 — A4, 28mm margin, 11pt Pretendard/system, 회색 헤더푸터.
const CSS = `
@page {
  size: A4;
  margin: 28mm 22mm 26mm 22mm;
}

@page {
  @top-left { content: ""; }
  @top-right { content: ""; }
  @bottom-center { content: counter(page) " / " counter(pages); font-family: 'Pretendard', -apple-system, system-ui, sans-serif; font-size: 9pt; color: #8a8a8a; }
}

* { box-sizing: border-box; }

html, body {
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Noto Sans KR', 'Helvetica Neue', Arial, sans-serif;
  font-size: 10.5pt;
  line-height: 1.6;
  color: #111418;
  -webkit-font-smoothing: antialiased;
}

h1 {
  font-size: 20pt;
  line-height: 1.25;
  letter-spacing: -0.01em;
  margin: 0 0 18pt 0;
  padding-bottom: 10pt;
  border-bottom: 1px solid #111418;
  font-weight: 700;
  page-break-after: avoid;
}

h2 {
  font-size: 14.5pt;
  letter-spacing: -0.005em;
  margin: 22pt 0 10pt 0;
  font-weight: 700;
  color: #111418;
  page-break-after: avoid;
}

h3 {
  font-size: 12pt;
  margin: 16pt 0 8pt 0;
  font-weight: 600;
  color: #1f242b;
  page-break-after: avoid;
}

h4 { font-size: 11pt; margin: 12pt 0 6pt 0; font-weight: 600; }

p { margin: 0 0 9pt 0; orphans: 3; widows: 3; }

ul, ol { margin: 0 0 10pt 0; padding-left: 22pt; }
li { margin-bottom: 3pt; }

strong { font-weight: 600; color: #0b0d10; }

code {
  font-family: 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;
  font-size: 9.2pt;
  background: #f4f5f7;
  padding: 1pt 4pt;
  border-radius: 3px;
  color: #1f242b;
}

pre {
  background: #f7f8fa;
  border: 1px solid #e6e8eb;
  border-radius: 4px;
  padding: 10pt 12pt;
  font-size: 9pt;
  line-height: 1.5;
  overflow-x: hidden;
  white-space: pre-wrap;
  page-break-inside: avoid;
  margin: 8pt 0 12pt 0;
}

pre code { background: none; padding: 0; font-size: inherit; }

blockquote {
  margin: 10pt 0;
  padding: 10pt 14pt;
  border-left: 3px solid #111418;
  background: #f7f8fa;
  color: #1f242b;
  page-break-inside: avoid;
}

blockquote p:last-child { margin-bottom: 0; }

table {
  width: 100%;
  border-collapse: collapse;
  margin: 10pt 0 14pt 0;
  font-size: 9.5pt;
  page-break-inside: auto;
}

thead { display: table-header-group; }
tr { page-break-inside: avoid; }

th {
  background: #111418;
  color: #ffffff;
  padding: 7pt 9pt;
  text-align: left;
  font-weight: 600;
  letter-spacing: 0.01em;
  font-size: 9pt;
  border: 1px solid #111418;
}

td {
  padding: 6pt 9pt;
  border: 1px solid #dde0e4;
  vertical-align: top;
  color: #1f242b;
}

tr:nth-child(even) td { background: #fafbfc; }

hr {
  border: 0;
  border-top: 1px solid #dde0e4;
  margin: 18pt 0;
}

a { color: #0b0d10; text-decoration: underline; text-decoration-thickness: 0.5pt; }

/* 표지 스타일 — h1 가 문서 최상단일 때 위 여백 추가 */
body > h1:first-child {
  margin-top: 10pt;
}

/* 하단 footer signature 의 br 처리 */
br { line-height: 1.6; }
`

// 헤더에 회사명/버전 넣을 수 있지만, 심사관 혼동 막으려면 간결하게 페이지 번호만.

async function buildOne(srcFile) {
  const srcPath = path.join(SRC_DIR, srcFile)
  const outPath = path.join(OUT_DIR, srcFile.replace(/\.md$/, '.pdf'))
  const mdRaw = await readFile(srcPath, 'utf8')

  // md-to-pdf 는 frontmatter 를 파싱. 우리 문서엔 없지만 안전하게 감싸서 전달.
  const pdf = await mdToPdf(
    { content: mdRaw },
    {
      dest: outPath,
      stylesheet: [],
      css: CSS,
      pdf_options: {
        format: 'A4',
        printBackground: true,
        margin: { top: '28mm', right: '22mm', bottom: '26mm', left: '22mm' },
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate:
          '<div style="font-family: Pretendard, system-ui, sans-serif; font-size: 8.5pt; color: #8a8a8a; width: 100%; text-align: center; padding: 0 22mm;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
      },
      launch_options: {
        headless: 'new',
        args: ['--no-sandbox'],
        ...(CHROME_EXECUTABLE ? { executablePath: CHROME_EXECUTABLE } : {}),
      },
      marked_options: { gfm: true, breaks: false },
    },
  )

  if (!pdf) throw new Error(`PDF 생성 실패: ${srcFile}`)
  return { srcFile, outPath, bytes: pdf.content.length }
}

async function buildBundle() {
  // 번들 PDF — 전체 문서를 하나로 병합. 표지 + 목차 + 각 섹션.
  // md-to-pdf 에 여러 md 를 순차 concat 한 markdown 하나를 넣어 처리.
  const pieces = []
  pieces.push(
    `# Draft × Threads API — Meta App Review Submission Package\n\n**Version v1.0 · 2026-04-21 · https://dailydraft.me**\n\n---\n\n## Package Index\n\n${FILE_ORDER.map((f, i) => `${i + 1}. ${f.replace(/\.md$/, '')}`).join('\n')}\n\n---\n\n<div style="page-break-after: always;"></div>\n\n`,
  )
  for (const f of FILE_ORDER) {
    const body = await readFile(path.join(SRC_DIR, f), 'utf8')
    pieces.push(body)
    pieces.push('\n\n<div style="page-break-after: always;"></div>\n\n')
  }
  const combined = pieces.join('\n')

  const outPath = path.join(OUT_DIR, 'draft-meta-review-package-v1.0.pdf')
  const pdf = await mdToPdf(
    { content: combined },
    {
      dest: outPath,
      stylesheet: [],
      css: CSS,
      pdf_options: {
        format: 'A4',
        printBackground: true,
        margin: { top: '28mm', right: '22mm', bottom: '26mm', left: '22mm' },
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate:
          '<div style="font-family: Pretendard, system-ui, sans-serif; font-size: 8.5pt; color: #8a8a8a; width: 100%; text-align: center; padding: 0 22mm;">Draft × Threads API — v1.0 · <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
      },
      launch_options: {
        headless: 'new',
        args: ['--no-sandbox'],
        ...(CHROME_EXECUTABLE ? { executablePath: CHROME_EXECUTABLE } : {}),
      },
      marked_options: { gfm: true, breaks: false },
    },
  )

  if (!pdf) throw new Error('번들 PDF 생성 실패')
  return { outPath, bytes: pdf.content.length }
}

async function main() {
  if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true })

  const results = []
  for (const f of FILE_ORDER) {
    const r = await buildOne(f)
    results.push(r)
    console.log(`  ✓ ${f.padEnd(34)} → ${(r.bytes / 1024).toFixed(0)} KB`)
  }

  console.log('\n번들 PDF 생성 중...')
  const bundle = await buildBundle()
  console.log(`  ✓ ${path.basename(bundle.outPath).padEnd(40)} → ${(bundle.bytes / 1024).toFixed(0)} KB`)

  const totalBytes = results.reduce((s, r) => s + r.bytes, 0) + bundle.bytes
  console.log(`\n완료 — 총 ${results.length + 1} 개 PDF / ${(totalBytes / 1024 / 1024).toFixed(2)} MB`)
  console.log(`출력 디렉토리: ${OUT_DIR}`)

  // README 갱신
  const readmePath = path.join(OUT_DIR, 'README.md')
  await writeFile(
    readmePath,
    `# Meta App Review PDFs — v1.0 (${new Date().toISOString().slice(0, 10)})\n\n` +
      `## 개별 PDF (심사 항목별 제출용)\n\n` +
      results.map((r) => `- ${path.basename(r.outPath)} (${(r.bytes / 1024).toFixed(0)} KB)`).join('\n') +
      `\n\n## 번들 PDF (cover + 전체)\n\n- ${path.basename(bundle.outPath)} (${(bundle.bytes / 1024).toFixed(0)} KB)\n\n` +
      `## 재생성\n\n\`\`\`bash\npnpm review:pdf\n\`\`\`\n`,
    'utf8',
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
