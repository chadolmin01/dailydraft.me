'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Folder,
  FileText,
  FileSpreadsheet,
  Presentation,
  FileImage,
  FileVideo,
  FileType,
  File as FileIcon,
  ChevronRight,
  ArrowUpRight,
  Home,
} from 'lucide-react'

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
  rootDriveFolderId: string
  rootName: string
}

export function FolderBrowser({ rootDriveFolderId, rootName }: Props) {
  const [path, setPath] = useState<PathSegment[]>([
    { id: rootDriveFolderId, name: rootName },
  ])

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

  const allItems = query.data
    ? [
        ...query.data.subfolders.map(i => ({ ...i, kind: 'folder' as const })),
        ...query.data.files.map(i => ({ ...i, kind: 'file' as const })),
      ]
    : []

  return (
    <div className="rounded-lg border border-hairline bg-canvas overflow-hidden">
      {/* 툴바: 브레드크럼 + 카운트 */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-hairline bg-surface-soft">
        <Breadcrumb path={path} onJump={jumpTo} />
        {query.data ? (
          <p className="text-caption text-muted-soft shrink-0 tabular">
            폴더 {query.data.summary.subfolders} · 파일 {query.data.summary.files}
          </p>
        ) : null}
      </div>

      {/* 본문 */}
      {query.isLoading ? (
        <div className="px-4 py-8 text-center text-body-sm text-muted">불러오는 중…</div>
      ) : null}

      {query.isError ? (
        <div className="px-4 py-8 text-center space-y-2">
          <p className="text-body-sm text-muted">폴더를 불러오지 못했습니다.</p>
          <p className="text-caption text-muted-soft">Drive 권한이 끊겼거나 일시 네트워크 문제일 수 있습니다.</p>
        </div>
      ) : null}

      {query.data && allItems.length === 0 ? (
        <div className="px-4 py-12 text-center text-body-sm text-muted">빈 폴더입니다.</div>
      ) : null}

      {query.data && allItems.length > 0 ? (
        <>
          {/* 헤더 행 */}
          <div className="hidden md:grid grid-cols-[1fr_120px_110px_90px] gap-4 px-4 py-2 border-b border-hairline-soft text-caption text-muted-soft">
            <div>이름</div>
            <div>종류</div>
            <div>수정</div>
            <div className="text-right">크기</div>
          </div>

          <ul className="divide-y divide-hairline-soft">
            {allItems.map(item => (
              <li key={item.id}>
                {item.kind === 'folder' ? (
                  <button
                    type="button"
                    onClick={() => enterSubfolder(item)}
                    className="w-full grid md:grid-cols-[1fr_120px_110px_90px] gap-4 px-4 py-2.5 text-left hover:bg-surface-soft transition-colors items-center"
                  >
                    <Row
                      icon={<Folder className="w-4 h-4 text-ink shrink-0" />}
                      name={item.name}
                      isFolder
                    />
                    <span className="hidden md:block text-body-sm text-muted">폴더</span>
                    <span className="hidden md:block text-body-sm text-muted-soft tabular">
                      {formatDate(item.modifiedTime)}
                    </span>
                    <span className="hidden md:block text-body-sm text-muted-soft text-right">—</span>
                  </button>
                ) : (
                  <a
                    href={item.webViewLink ?? `https://drive.google.com/file/d/${item.id}/view`}
                    target="_blank"
                    rel="noreferrer"
                    className="grid md:grid-cols-[1fr_120px_110px_90px] gap-4 px-4 py-2.5 hover:bg-surface-soft transition-colors items-center group"
                  >
                    <Row
                      icon={<FileTypeIcon mimeType={item.mimeType} />}
                      name={item.name}
                      external
                    />
                    <span className="hidden md:block text-body-sm text-muted">
                      {fileTypeLabel(item.mimeType)}
                    </span>
                    <span className="hidden md:block text-body-sm text-muted-soft tabular">
                      {formatDate(item.modifiedTime)}
                    </span>
                    <span className="hidden md:block text-body-sm text-muted-soft text-right tabular">
                      {item.size ? formatSize(item.size) : '—'}
                    </span>
                  </a>
                )}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  )
}

function Row({
  icon,
  name,
  isFolder,
  external,
}: {
  icon: React.ReactNode
  name: string
  isFolder?: boolean
  external?: boolean
}) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      {icon}
      <span className={`text-body-md text-ink truncate ${isFolder ? 'font-medium' : ''}`}>
        {name}
      </span>
      {external ? <ArrowUpRight className="w-3.5 h-3.5 text-muted-soft shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" /> : null}
    </div>
  )
}

function Breadcrumb({ path, onJump }: { path: PathSegment[]; onJump: (i: number) => void }) {
  return (
    <nav className="flex items-center gap-1 text-body-sm text-muted flex-wrap min-w-0">
      {path.map((seg, i) => {
        const isLast = i === path.length - 1
        return (
          <span key={`${seg.id}-${i}`} className="flex items-center gap-1 min-w-0">
            {i > 0 ? <ChevronRight className="w-3.5 h-3.5 text-muted-soft shrink-0" /> : null}
            {isLast ? (
              <span className="text-ink font-medium truncate flex items-center gap-1.5">
                {i === 0 ? <Home className="w-3.5 h-3.5 shrink-0" /> : null}
                {seg.name}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onJump(i)}
                className="hover:text-ink transition-colors truncate flex items-center gap-1.5 shrink-0"
              >
                {i === 0 ? <Home className="w-3.5 h-3.5 shrink-0" /> : null}
                {seg.name}
              </button>
            )}
          </span>
        )
      })}
    </nav>
  )
}

function FileTypeIcon({ mimeType }: { mimeType: string }) {
  const className = 'w-4 h-4 shrink-0 text-muted'
  if (mimeType === 'application/vnd.google-apps.document') return <FileText className={className} />
  if (mimeType === 'application/vnd.google-apps.spreadsheet') return <FileSpreadsheet className={className} />
  if (mimeType === 'application/vnd.google-apps.presentation') return <Presentation className={className} />
  if (mimeType === 'application/pdf') return <FileType className={className} />
  if (mimeType.startsWith('image/')) return <FileImage className={className} />
  if (mimeType.startsWith('video/')) return <FileVideo className={className} />
  if (mimeType.includes('word') || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return <FileText className={className} />
  if (mimeType.includes('excel') || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return <FileSpreadsheet className={className} />
  if (mimeType.includes('powerpoint') || mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return <Presentation className={className} />
  return <FileIcon className={className} />
}

function fileTypeLabel(mimeType: string): string {
  if (mimeType === 'application/vnd.google-apps.document') return '문서'
  if (mimeType === 'application/vnd.google-apps.spreadsheet') return '시트'
  if (mimeType === 'application/vnd.google-apps.presentation') return '슬라이드'
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType.startsWith('image/')) return '이미지'
  if (mimeType.startsWith('video/')) return '동영상'
  if (mimeType.includes('word')) return 'Word'
  if (mimeType.includes('excel') || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'Excel'
  if (mimeType.includes('powerpoint') || mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'PowerPoint'
  if (mimeType.includes('hwp')) return '한글'
  return '파일'
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const sameYear = d.getFullYear() === now.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  if (sameYear) return `${mm}.${dd}`
  return `${d.getFullYear()}.${mm}.${dd}`
}

function formatSize(bytes: string): string {
  const n = Number.parseInt(bytes, 10)
  if (Number.isNaN(n)) return ''
  if (n < 1024) return `${n}B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)}KB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)}MB`
  return `${(n / 1024 / 1024 / 1024).toFixed(1)}GB`
}
