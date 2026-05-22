'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
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
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
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
  /** Draft 의 DB folder uuid — /api/files/process 호출 시 필요 */
  folderId: string
  rootDriveFolderId: string
  rootName: string
}

interface ProcessedFile {
  id: string
  drive_file_id: string
  filename: string
  mime_type: string
  parsing_completed_at: string | null
  parsing_error: string | null
  atom_count: number
  relation_count: number
  updated_at: string
}

export function FolderBrowser({ folderId, rootDriveFolderId, rootName }: Props) {
  const qc = useQueryClient()
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
    placeholderData: keepPreviousData,
  })

  // 이 폴더의 처리 결과들 — drive_file_id 로 인덱싱.
  const processed = useQuery({
    queryKey: ['processed-files', folderId],
    queryFn: async (): Promise<{ files: ProcessedFile[] }> => {
      const res = await fetch(`/api/files/process?folder_id=${folderId}`)
      if (!res.ok) throw new Error('처리 결과 조회 실패')
      return res.json()
    },
    staleTime: 30_000,
  })
  const processedMap = new Map<string, ProcessedFile>()
  for (const p of processed.data?.files ?? []) processedMap.set(p.drive_file_id, p)

  const processMutation = useMutation({
    mutationFn: async (file: { id: string; name: string; mimeType: string; size?: string; modifiedTime: string }) => {
      const res = await fetch('/api/files/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder_id: folderId,
          drive_file_id: file.id,
          filename: file.name,
          mime_type: file.mimeType,
          size_bytes: file.size ? Number(file.size) : undefined,
          drive_modified_at: file.modifiedTime,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error?.message ?? '처리 실패')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['processed-files', folderId] })
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

  // 점멸 방지: 폴더 진입 직후 placeholderData 로 직전 목록이 살아 있고, isFetching 만 true.
  // 본문은 그대로 두고 미세 dim 만 줘서 갱신 중임을 알림.
  const refetching = query.isFetching && !query.isLoading

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

      {/* 본문 — 초기 로딩은 스켈레톤, 재페치는 본문 dim */}
      {query.isLoading ? (
        <ul className="divide-y divide-hairline-soft" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <li key={i} className="px-4 py-3 flex items-center gap-3">
              <span className="h-4 w-4 rounded bg-surface-card opacity-60" />
              <span className="h-3 flex-1 max-w-xs rounded bg-surface-card opacity-50" />
            </li>
          ))}
        </ul>
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
        <div className={refetching ? 'opacity-70 transition-opacity duration-200' : 'transition-opacity duration-200'}>
          {/* 헤더 행 — 데스크탑에 1열 추가 (Atom 처리 상태) */}
          <div className="hidden md:grid grid-cols-[1fr_120px_110px_140px_90px] gap-4 px-4 py-2 border-b border-hairline-soft text-caption text-muted-soft">
            <div>이름</div>
            <div>종류</div>
            <div>수정</div>
            <div>처리</div>
            <div className="text-right">크기</div>
          </div>

          <ul className="divide-y divide-hairline-soft">
            {allItems.map(item => (
              <li key={item.id}>
                {item.kind === 'folder' ? (
                  <button
                    type="button"
                    onClick={() => enterSubfolder(item)}
                    className="w-full grid md:grid-cols-[1fr_120px_110px_140px_90px] gap-4 px-4 py-2.5 text-left hover:bg-surface-soft transition-colors items-center"
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
                    <span className="hidden md:block text-body-sm text-muted-soft">—</span>
                    <span className="hidden md:block text-body-sm text-muted-soft text-right">—</span>
                  </button>
                ) : (
                  <div className="grid md:grid-cols-[1fr_120px_110px_140px_90px] gap-4 px-4 py-2.5 hover:bg-surface-soft transition-colors items-center group">
                    <a
                      href={item.webViewLink ?? `https://drive.google.com/file/d/${item.id}/view`}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-0"
                    >
                      <Row
                        icon={<FileTypeIcon mimeType={item.mimeType} />}
                        name={item.name}
                        external
                      />
                    </a>
                    <span className="hidden md:block text-body-sm text-muted">
                      {fileTypeLabel(item.mimeType)}
                    </span>
                    <span className="hidden md:block text-body-sm text-muted-soft tabular">
                      {formatDate(item.modifiedTime)}
                    </span>
                    <ProcessCell
                      processed={processedMap.get(item.id)}
                      mimeType={item.mimeType}
                      onProcess={() => processMutation.mutate(item)}
                      pending={processMutation.isPending && processMutation.variables?.id === item.id}
                    />
                    <span className="hidden md:block text-body-sm text-muted-soft text-right tabular">
                      {item.size ? formatSize(item.size) : '—'}
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
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

// 텍스트 추출 가능 mime — 그 외는 "처리" 버튼 숨김 (이미지/비디오 등).
const PROCESSABLE_MIMES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.google-apps.document',
  'application/vnd.google-apps.spreadsheet',
  'application/vnd.google-apps.presentation',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/x-hwp',
  'application/haansofthwp',
])

function ProcessCell({
  processed,
  mimeType,
  onProcess,
  pending,
}: {
  processed: ProcessedFile | undefined
  mimeType: string
  onProcess: () => void
  pending: boolean
}) {
  // 처리 가능한 mime 가 아니면 표시 안 함
  if (!PROCESSABLE_MIMES.has(mimeType)) {
    return <span className="hidden md:block text-caption text-muted-soft">—</span>
  }

  if (pending) {
    return (
      <span className="hidden md:inline-flex items-center gap-1.5 text-caption text-muted">
        <Loader2 className="w-3 h-3 animate-spin" />
        처리 중
      </span>
    )
  }

  // 이미 처리됨 — 에러였는지, 성공이었는지
  if (processed?.parsing_completed_at) {
    if (processed.parsing_error) {
      return (
        <button
          type="button"
          onClick={onProcess}
          title={processed.parsing_error}
          className="hidden md:inline-flex items-center gap-1.5 text-caption text-muted hover:text-ink transition-colors"
        >
          <AlertCircle className="w-3 h-3" />
          실패 · 재시도
        </button>
      )
    }
    return (
      <button
        type="button"
        onClick={onProcess}
        title="다시 처리 (새 결과로 덮어쓰기)"
        className="hidden md:inline-flex items-center gap-1.5 text-caption text-ink hover:opacity-70 transition-opacity"
      >
        <CheckCircle2 className="w-3 h-3" />
        Atom {processed.atom_count}
      </button>
    )
  }

  // 아직 처리 안 됨
  return (
    <button
      type="button"
      onClick={onProcess}
      className="hidden md:inline-flex items-center gap-1.5 text-caption text-muted border border-hairline rounded-full px-2.5 py-1 hover:text-ink hover:border-muted transition-colors"
    >
      <Sparkles className="w-3 h-3" />
      처리
    </button>
  )
}
