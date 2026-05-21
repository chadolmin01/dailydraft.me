// 파트너십 별첨 문서 단일 PDF 빌더. build-review-pdfs.mjs 와 동일한 스타일 재사용.
// 실행: node scripts/build-partnership-pdf.mjs docs/partnerships/khu-draft-overview.md

import { mdToPdf } from 'md-to-pdf'
import { readFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const ARG = process.argv[2]
if (!ARG) {
  console.error('Usage: node scripts/build-partnership-pdf.mjs <path-to-md>')
  process.exit(1)
}

const SRC = path.resolve(ARG)
const OUT_DIR = path.resolve(path.dirname(SRC), 'dist')
const OUT_FILE = path.join(
  OUT_DIR,
  path.basename(SRC).replace(/\.md$/, '.pdf'),
)

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
  return undefined
}
const CHROME_EXECUTABLE = resolveChromeExecutable()

// build-review-pdfs.mjs 와 동일 CSS. Pretendard·28mm 여백·검정 헤더·회색 본문.
const CSS = `
@page { size: A4; margin: 28mm 22mm 26mm 22mm; }
* { box-sizing: border-box; }
html, body { font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Noto Sans KR', 'Helvetica Neue', Arial, sans-serif; font-size: 10.5pt; line-height: 1.6; color: #111418; -webkit-font-smoothing: antialiased; }
h1 { font-size: 20pt; line-height: 1.25; letter-spacing: -0.01em; margin: 0 0 18pt 0; padding-bottom: 10pt; border-bottom: 1px solid #111418; font-weight: 700; page-break-after: avoid; }
h2 { font-size: 14.5pt; letter-spacing: -0.005em; margin: 22pt 0 10pt 0; font-weight: 700; color: #111418; page-break-after: avoid; }
h3 { font-size: 12pt; margin: 16pt 0 8pt 0; font-weight: 600; color: #1f242b; page-break-after: avoid; }
h4 { font-size: 11pt; margin: 12pt 0 6pt 0; font-weight: 600; }
p { margin: 0 0 9pt 0; orphans: 3; widows: 3; }
ul, ol { margin: 0 0 10pt 0; padding-left: 22pt; }
li { margin-bottom: 3pt; }
strong { font-weight: 600; color: #0b0d10; }
code { font-family: 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace; font-size: 9.2pt; background: #f4f5f7; padding: 1pt 4pt; border-radius: 3px; color: #1f242b; }
pre { background: #f7f8fa; border: 1px solid #e6e8eb; border-radius: 4px; padding: 10pt 12pt; font-size: 9pt; line-height: 1.5; overflow-x: hidden; white-space: pre-wrap; page-break-inside: avoid; margin: 8pt 0 12pt 0; }
pre code { background: none; padding: 0; font-size: inherit; }
blockquote { margin: 10pt 0; padding: 10pt 14pt; border-left: 3px solid #111418; background: #f7f8fa; color: #1f242b; page-break-inside: avoid; }
blockquote p:last-child { margin-bottom: 0; }
table { width: 100%; border-collapse: collapse; margin: 10pt 0 14pt 0; font-size: 9.5pt; page-break-inside: auto; }
thead { display: table-header-group; }
tr { page-break-inside: avoid; }
th { background: #111418; color: #ffffff; padding: 7pt 9pt; text-align: left; font-weight: 600; letter-spacing: 0.01em; font-size: 9pt; border: 1px solid #111418; }
td { padding: 6pt 9pt; border: 1px solid #dde0e4; vertical-align: top; color: #1f242b; }
tr:nth-child(even) td { background: #fafbfc; }
hr { border: 0; border-top: 1px solid #dde0e4; margin: 18pt 0; }
a { color: #0b0d10; text-decoration: underline; text-decoration-thickness: 0.5pt; }
body > h1:first-child { margin-top: 10pt; }
br { line-height: 1.6; }
em { font-style: italic; color: #3a3f46; }
img { max-width: 100%; height: auto; display: block; margin: 14pt auto; border: 1px solid #e6e8eb; border-radius: 6px; page-break-inside: avoid; }
`

async function main() {
  if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true })

  // md-to-pdf 는 path 로 받으면 해당 파일 부모 디렉토리를 basedir 로 삼아
  // md 안의 상대경로 이미지(./screenshots/*.png)를 자동 해석해준다.
  const pdf = await mdToPdf(
    { path: SRC },
    {
      dest: OUT_FILE,
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

  if (!pdf) throw new Error(`PDF 생성 실패: ${SRC}`)
  console.log(
    `  ✓ ${path.basename(OUT_FILE).padEnd(40)} → ${(pdf.content.length / 1024).toFixed(0)} KB`,
  )
  console.log(`\n출력 경로: ${OUT_FILE}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
