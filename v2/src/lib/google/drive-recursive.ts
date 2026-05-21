// 재귀적으로 Drive 폴더 트리를 훑어 파일 + 경로 수집.
//
// 안전장치:
//   - 최대 depth: 6 (무한 루프 방어, 보통 program/N주차/N팀 = 3단계면 충분)
//   - 최대 노드: 2000 (대형 폴더 보호 — 그 이상이면 truncated 플래그)
//   - 폴더 자체는 결과에서 제외, 파일만

import { listFolderFiles, type DriveFile } from './drive'

const FOLDER_MIME = 'application/vnd.google-apps.folder'

export interface FileWithPath extends DriveFile {
  /** 루트(연결된 폴더) 이름 빼고, 하위 폴더 이름 array. 예: ['3주차', '3팀'] */
  path: string[]
}

export interface RecursiveScanResult {
  files: FileWithPath[]
  truncated: boolean
  nodes_scanned: number
  max_depth_reached: number
}

interface ScanOpts {
  maxDepth?: number
  maxNodes?: number
}

export async function listFolderFilesRecursive(
  accessToken: string,
  rootFolderId: string,
  opts: ScanOpts = {},
): Promise<RecursiveScanResult> {
  const maxDepth = opts.maxDepth ?? 6
  const maxNodes = opts.maxNodes ?? 2000

  const files: FileWithPath[] = []
  let nodesScanned = 0
  let maxDepthReached = 0
  let truncated = false

  // BFS — 광범위 우선이 더 직관적 (사용자가 보는 폴더 순서와 비슷)
  const queue: Array<{ folderId: string; path: string[] }> = [
    { folderId: rootFolderId, path: [] },
  ]

  while (queue.length > 0) {
    if (nodesScanned >= maxNodes) {
      truncated = true
      break
    }
    const { folderId, path } = queue.shift()!
    if (path.length > maxDepth) {
      continue
    }
    maxDepthReached = Math.max(maxDepthReached, path.length)

    let children: DriveFile[]
    try {
      children = await listFolderFiles(accessToken, folderId)
    } catch {
      // 권한/네트워크 실패 — 해당 폴더 skip, 다른 폴더 계속
      continue
    }

    for (const child of children) {
      nodesScanned++
      if (child.mimeType === FOLDER_MIME) {
        if (path.length < maxDepth) {
          queue.push({ folderId: child.id, path: [...path, child.name] })
        }
      } else {
        files.push({ ...child, path })
      }
      if (nodesScanned >= maxNodes) {
        truncated = true
        break
      }
    }
  }

  return { files, truncated, nodes_scanned: nodesScanned, max_depth_reached: maxDepthReached }
}
