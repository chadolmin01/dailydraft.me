'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

interface DriveItem {
  id: string
  name: string
  mimeType: string
  modifiedTime: string
  webViewLink?: string
  size?: string
}

interface FolderResponse {
  subfolders: DriveItem[]
  files: DriveItem[]
  summary: { total: number; subfolders: number; files: number }
}

interface PathSegment {
  id: string
  name: string
}

interface Props {
  // 연결된 Draft 폴더의 루트 — 진입 지점
  rootDriveFolderId: string
  rootName: string
}

// Drive 의 폴더 트리를 브라우저처럼 탐색.
// 폴더 카드 클릭 → 들어감 / 브레드크럼으로 상위 복귀.
// 파일 클릭 → Drive 새 창 (webViewLink).
//
// Draft 의 connected folder 정보는 root 한 번만 — 그 안의 하위 폴더는 Drive 그대로.
export function FolderBrowser({ rootDriveFolderId, rootName }: Props) {
  // 경로 = root → subfolder → subsubfolder ... 마지막이 현재 위치
  const [path, setPath] = useState<PathSegment[]>([
    { id: rootDriveFolderId, name: rootName },
  ])

  // root 가 바뀌면 path 리셋 (다른 connected folder 선택 시)
  useEffect(() => {
    setPath([{ id: rootDriveFolderId, name: rootName }])
  }, [rootDriveFolderId, rootName])

  const current = path[path.length - 1]

  const query = useQuery({
    queryKey: ['drive-folder', current.id],
    queryFn: async (): Promise<FolderResponse> => {
      const res = await fetch(`/api/google/drive/folder?id=${current.id}`)
      if (!res.ok) throw new Error('폴더 조회 실패')
      return res.json()
    },
  })

  const enterSubfolder = (item: DriveItem) => {
    setPath([...path, { id: item.id, name: item.name }])
  }

  const jumpTo = (index: number) => {
    setPath(path.slice(0, index + 1))
  }

  return (
    <section className="space-y-3 border-t border-hairline pt-7">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-display-sm text-ink">파일 브라우저</h2>
        {query.data ? (
          <p className="text-caption text-muted">
            폴더 {query.data.summary.subfolders}개 · 파일 {query.data.summary.files}개
          </p>
        ) : null}
      </div>

      <Breadcrumb path={path} onJump={jumpTo} />

      {query.isLoading ? (
        <p className="text-body-sm text-muted">불러오는 중…</p>
      ) : null}

      {query.isError ? (
        <p className="text-body-sm text-muted">{query.error.message}</p>
      ) : null}

      {query.data ? (
        <div className="space-y-5">
          {query.data.subfolders.length > 0 ? (
            <div>
              <h3 className="text-title-sm text-muted mb-2">폴더</h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {query.data.subfolders.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => enterSubfolder(item)}
                    className="text-left p-4 rounded-lg bg-surface-card hover:bg-surface-strong transition-colors"
                  >
                    <p className="text-body-md text-ink truncate">📁 {item.name}</p>
                    <p className="text-caption text-muted-soft mt-1">
                      {formatDate(item.modifiedTime)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {query.data.files.length > 0 ? (
            <div>
              <h3 className="text-title-sm text-muted mb-2">파일</h3>
              <ul className="rounded-lg border border-hairline divide-y divide-hairline overflow-hidden bg-canvas">
                {query.data.files.map(file => (
                  <li key={file.id}>
                    <a
                      href={file.webViewLink ?? `https://drive.google.com/file/d/${file.id}/view`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-surface-soft transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-body-md text-ink truncate">{file.name}</p>
                        <p className="text-caption text-muted-soft mt-0.5">
                          {fileTypeLabel(file.mimeType)} · {formatDate(file.modifiedTime)}
                          {file.size ? ` · ${formatSize(file.size)}` : ''}
                        </p>
                      </div>
                      <span className="text-caption text-muted-soft shrink-0">열기 ↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {query.data.subfolders.length === 0 && query.data.files.length === 0 ? (
            <p className="text-body-sm text-muted">빈 폴더입니다.</p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

function Breadcrumb({ path, onJump }: { path: PathSegment[]; onJump: (i: number) => void }) {
  return (
    <nav className="flex items-center gap-1.5 text-body-sm text-muted flex-wrap">
      {path.map((seg, i) => (
        <span key={`${seg.id}-${i}`} className="flex items-center gap-1.5">
          {i > 0 ? <span className="text-muted-soft">/</span> : null}
          {i === path.length - 1 ? (
            <span className="text-ink font-medium">{seg.name}</span>
          ) : (
            <button
              type="button"
              onClick={() => onJump(i)}
              className="hover:text-ink transition-colors"
            >
              {seg.name}
            </button>
          )}
        </span>
      ))}
    </nav>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const yy = d.getFullYear().toString().slice(2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yy}.${mm}.${dd}`
}

function formatSize(bytes: string): string {
  const n = Number.parseInt(bytes, 10)
  if (Number.isNaN(n)) return ''
  if (n < 1024) return `${n}B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)}MB`
  return `${(n / 1024 / 1024 / 1024).toFixed(1)}GB`
}

function fileTypeLabel(mimeType: string): string {
  if (mimeType === 'application/vnd.google-apps.document') return '문서'
  if (mimeType === 'application/vnd.google-apps.spreadsheet') return '시트'
  if (mimeType === 'application/vnd.google-apps.presentation') return '슬라이드'
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType.startsWith('image/')) return '이미지'
  if (mimeType.startsWith('video/')) return '동영상'
  if (mimeType.includes('word') || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'Word'
  if (mimeType.includes('excel') || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'Excel'
  if (mimeType.includes('powerpoint') || mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'PowerPoint'
  if (mimeType.includes('hwp')) return '한글'
  return mimeType.split('/').pop() ?? '파일'
}
