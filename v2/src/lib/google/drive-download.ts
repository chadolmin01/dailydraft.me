// Drive 바이너리 다운로드 — pipeline.ts 가 호출.
// raw fetch — googleapis SDK 회피 (번들/cold start).
// 의도: Google Docs/Sheets/Slides 는 export, 그 외는 직접 다운로드.
// scope drive.readonly 로 충분.

import { fetchWithRetry } from '@/src/lib/fetch-retry'

/**
 * Google Docs 계열 mimeType → export 시 사용할 binary mime.
 * - 문서 → PDF (편집 의도 없으니 텍스트 추출 가능한 PDF 가 안전)
 * - 스프레드시트 → XLSX
 * - 슬라이드 → PDF
 */
function pickExportMime(mimeType: string): string {
  if (mimeType === 'application/vnd.google-apps.document') return 'application/pdf'
  if (mimeType === 'application/vnd.google-apps.spreadsheet') {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }
  if (mimeType === 'application/vnd.google-apps.presentation') return 'application/pdf'
  // 기타 vnd.google-apps.* 는 일단 PDF 시도. 실패하면 parse 단에서 unsupported.
  return 'application/pdf'
}

export function isGoogleNative(mimeType: string): boolean {
  return mimeType.startsWith('application/vnd.google-apps')
}

export interface DownloadResult {
  /** 바이너리 자체 */
  buffer: Buffer
  /** 실제로 받은 콘텐츠의 mime — Google Docs 면 export mime 으로 바뀜 */
  effectiveMime: string
}

/**
 * Drive 파일 1개 바이너리 다운로드.
 * - Google Docs/Sheets/Slides → export
 * - 그 외 (PDF, DOCX, XLSX, HWP, txt 등) → alt=media 로 직접
 *
 * 50MB 초과 시 throw — 메모리 폭주 차단. PoC 단계 가드.
 */
const MAX_BYTES = 50 * 1024 * 1024

export async function downloadFile(
  accessToken: string,
  driveFileId: string,
  mimeType: string,
): Promise<DownloadResult> {
  const isNative = isGoogleNative(mimeType)
  const effectiveMime = isNative ? pickExportMime(mimeType) : mimeType

  const url = isNative
    ? `https://www.googleapis.com/drive/v3/files/${driveFileId}/export?mimeType=${encodeURIComponent(effectiveMime)}`
    : `https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`

  const res = await fetchWithRetry(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Drive download failed (${res.status}): ${text.slice(0, 200)}`)
  }

  // Content-Length 확인 — Drive 는 export 시 미보장이라 best-effort.
  const len = Number(res.headers.get('content-length') ?? '0')
  if (len > MAX_BYTES) {
    throw new Error(`File too large: ${(len / 1024 / 1024).toFixed(1)}MB > 50MB`)
  }

  const arrayBuf = await res.arrayBuffer()
  if (arrayBuf.byteLength > MAX_BYTES) {
    throw new Error(`File too large: ${(arrayBuf.byteLength / 1024 / 1024).toFixed(1)}MB > 50MB`)
  }

  return {
    buffer: Buffer.from(arrayBuf),
    effectiveMime,
  }
}
