// Google Drive REST API wrapper — 폴더 내 파일 목록 조회.
// googleapis SDK 대신 raw fetch — 번들 크기 + cold start 최소화.
// scope: drive.readonly (CLAUDE.md Hard Rules)

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  modifiedTime: string
  size?: string                    // bytes (string, API spec)
  webViewLink?: string
}

interface ListResponse {
  files: DriveFile[]
  nextPageToken?: string
}

const FIELDS = 'nextPageToken,files(id,name,mimeType,modifiedTime,size,webViewLink)'

/**
 * 폴더 안의 파일 목록 (트래쉬 제외, 직속 자식만).
 * pagination 자동 처리 — 한 폴더에 파일 수천 개 있어도 다 모음.
 */
export async function listFolderFiles(
  accessToken: string,
  folderId: string,
): Promise<DriveFile[]> {
  const all: DriveFile[] = []
  let pageToken: string | undefined

  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      fields: FIELDS,
      pageSize: '1000',
      orderBy: 'name',
    })
    if (pageToken) params.set('pageToken', pageToken)

    const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      // Next.js 서버에서 호출 — 캐시 안 함 (실시간 상태가 중요)
      cache: 'no-store',
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Drive list failed (${res.status}): ${text}`)
    }

    const data = (await res.json()) as ListResponse
    all.push(...(data.files ?? []))
    pageToken = data.nextPageToken
  } while (pageToken)

  return all
}

/**
 * 폴더 1개의 메타정보 (이름 검증 등). 없거나 권한 없으면 throw.
 */
export async function getFolderMeta(
  accessToken: string,
  folderId: string,
): Promise<{ id: string; name: string; mimeType: string }> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    },
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Drive folder meta failed (${res.status}): ${text}`)
  }

  return res.json()
}
