// Draft 5분 발표 HTML → PDF (1280×720, 16:9, 10 슬라이드).
// puppeteer 는 v1 의 node_modules 에서 가져옴 (v2 에 새로 설치 안 함).

import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { createRequire } from 'node:module'

const here = dirname(fileURLToPath(import.meta.url))
const req = createRequire(resolve(here, '../../v1/package.json'))
const puppeteer = req('puppeteer')

const htmlPath = resolve(here, 'deck.html')
const pdfPath = resolve(here, 'deck.pdf')

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox'],
})
try {
  const page = await browser.newPage()
  await page.goto('file://' + htmlPath.replace(/\\/g, '/'), {
    waitUntil: 'networkidle0',
  })
  // Force web fonts to settle
  await new Promise(r => setTimeout(r, 500))
  await page.pdf({
    path: pdfPath,
    width: '1280px',
    height: '720px',
    printBackground: true,
    pageRanges: '1-10',
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  })
  console.log('OK → ' + pdfPath)
} finally {
  await browser.close()
}
