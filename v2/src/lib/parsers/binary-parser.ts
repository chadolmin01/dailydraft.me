// 바이너리 → 텍스트. M6 task_extractor 가 텍스트만 받기 때문.
// 의도: PDF, DOCX, XLSX, HWP, plain text 한 함수로 dispatch.
// 인식 못 하는 mime 은 unsupported error.

export interface ParseResult {
  text: string
  /** 추가 메타 (페이지 수, 시트 수 등 — 디버깅과 UI 표시용) */
  meta?: Record<string, unknown>
}

const MIME = {
  PDF: 'application/pdf',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  XLS: 'application/vnd.ms-excel',
  PPTX: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  TXT: 'text/plain',
  MD: 'text/markdown',
  CSV: 'text/csv',
  HWP: 'application/x-hwp',
  HWP_ALT: 'application/haansofthwp',
} as const

export async function parseBuffer(buffer: Buffer, mimeType: string): Promise<ParseResult> {
  // text 류 — 가장 가볍게 먼저
  if (
    mimeType === MIME.TXT ||
    mimeType === MIME.MD ||
    mimeType === MIME.CSV ||
    mimeType.startsWith('text/')
  ) {
    return { text: buffer.toString('utf-8') }
  }

  if (mimeType === MIME.PDF) return parsePdf(buffer)
  if (mimeType === MIME.DOCX) return parseDocx(buffer)
  if (mimeType === MIME.XLSX || mimeType === MIME.XLS) return parseXlsx(buffer)
  if (mimeType === MIME.HWP || mimeType === MIME.HWP_ALT) return parseHwp(buffer)

  throw new Error(`Unsupported mime type: ${mimeType}`)
}

// ─── PDF ───
async function parsePdf(buffer: Buffer): Promise<ParseResult> {
  // 의도: import 시점에 pdf-parse 가 무거우니 동적 import (cold start 절감).
  const { PDFParse } = await import('pdf-parse')
  // PDFParse 는 ArrayBuffer/Uint8Array 도 받음. Buffer 는 Uint8Array 의 superset.
  const parser = new PDFParse({ data: new Uint8Array(buffer) })
  try {
    const result = await parser.getText()
    return {
      text: result.text ?? '',
      meta: { pages: result.total ?? undefined },
    }
  } finally {
    await parser.destroy().catch(() => {})
  }
}

// ─── DOCX ───
async function parseDocx(buffer: Buffer): Promise<ParseResult> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ buffer })
  return { text: result.value, meta: { warnings: result.messages.length } }
}

// ─── XLSX ───
async function parseXlsx(buffer: Buffer): Promise<ParseResult> {
  const XLSX = await import('xlsx')
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const parts: string[] = []
  for (const name of wb.SheetNames) {
    parts.push(`=== ${name} ===`)
    parts.push(XLSX.utils.sheet_to_csv(wb.Sheets[name]))
    parts.push('')
  }
  return {
    text: parts.join('\n'),
    meta: { sheets: wb.SheetNames.length, sheet_names: wb.SheetNames },
  }
}

// ─── HWP ───
// hwp.js 는 한국 공문/보고서 (HWP 5.0 spec) 텍스트 추출. 일부 신규 HWP/HWPX 미지원.
// 실패 시 친절한 메시지로 throw → 매니저에게 PDF 변환 안내.
async function parseHwp(buffer: Buffer): Promise<ParseResult> {
  try {
    const hwp = await import('hwp.js')
    // hwp.js API 는 버전별로 차이가 큼. parse() 가 있으면 사용, 없으면 throw.
    const parser = (hwp.default ?? hwp) as { parse?: (b: Buffer) => unknown }
    if (typeof parser.parse !== 'function') {
      throw new Error('HWP 파서 API 변경됨')
    }
    const doc = parser.parse(buffer) as { sections?: Array<{ paragraphs?: Array<{ text?: string }> }> }
    const parts: string[] = []
    for (const section of doc.sections ?? []) {
      for (const p of section.paragraphs ?? []) {
        if (p.text) parts.push(p.text)
      }
    }
    if (parts.length === 0) throw new Error('HWP 에서 텍스트를 찾지 못함')
    return { text: parts.join('\n'), meta: { sections: doc.sections?.length ?? 0 } }
  } catch (e) {
    throw new Error(
      `HWP 파싱 실패 (${(e as Error).message}). PDF 로 변환 후 다시 올려주세요.`,
    )
  }
}
