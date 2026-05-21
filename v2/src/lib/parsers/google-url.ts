// Google Drive / Sheets URL → ID 추출.
// 사용자가 URL 통째로 붙여넣어도 ID 만 추려서 폼에 채워준다.

// Drive 폴더 URL 패턴:
//   https://drive.google.com/drive/folders/{ID}
//   https://drive.google.com/drive/folders/{ID}?usp=sharing
//   https://drive.google.com/drive/u/0/folders/{ID}
const DRIVE_FOLDER_RE = /\/folders\/([a-zA-Z0-9_-]+)/

// Sheets URL 패턴:
//   https://docs.google.com/spreadsheets/d/{ID}/edit
//   https://docs.google.com/spreadsheets/d/{ID}/edit#gid=0
const SHEETS_RE = /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/

// 일반적인 Google ID 형식 — 25~50자, 영문/숫자/_/-
const ID_RE = /^[a-zA-Z0-9_-]{20,80}$/

export function extractDriveFolderId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // URL 이면 패턴 매칭
  const urlMatch = DRIVE_FOLDER_RE.exec(trimmed)
  if (urlMatch) return urlMatch[1]

  // 이미 ID 형식이면 그대로
  if (ID_RE.test(trimmed)) return trimmed

  return null
}

export function extractSheetId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const urlMatch = SHEETS_RE.exec(trimmed)
  if (urlMatch) return urlMatch[1]

  if (ID_RE.test(trimmed)) return trimmed

  return null
}
