// Google Sheets REST API wrapper.
// scope: spreadsheets (read + write)

export interface SheetRange {
  range: string
  values: string[][]
}

/**
 * 단일 범위 읽기 — A1 표기법. 예: 'Sheet1!A1:C100'
 * 범위만 지정하면 첫 시트 전체.
 */
export async function readRange(
  accessToken: string,
  spreadsheetId: string,
  range: string,
): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Sheets read failed (${res.status}): ${text}`)
  }

  const data = (await res.json()) as { values?: string[][] }
  return data.values ?? []
}

/**
 * 단일 범위 쓰기 — A1 표기법. 기존 값을 덮어씀.
 * valueInputOption=USER_ENTERED 로 수식 해석 (예: =SUM(A1:A10)).
 */
export async function writeRange(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: string[][],
): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values, range }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Sheets write failed (${res.status}): ${text}`)
  }
}

/**
 * 스프레드시트 메타 — 시트 탭 목록 조회.
 */
export async function getSpreadsheetMeta(
  accessToken: string,
  spreadsheetId: string,
): Promise<{ title: string; sheets: Array<{ sheetId: number; title: string }> }> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties(sheetId,title)`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Sheets meta failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  return {
    title: data.properties?.title ?? '',
    sheets: (data.sheets ?? []).map((s: { properties: { sheetId: number; title: string } }) => s.properties),
  }
}
