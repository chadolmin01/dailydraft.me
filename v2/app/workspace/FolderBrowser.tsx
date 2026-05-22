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
  const [viewerFileId, setViewerFileId] = useState<string | null>(null)
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
  // 30s 폴링으로 cron 처리 결과도 페이지 떠나지 않고 반영.
  const processed = useQuery({
    queryKey: ['processed-files', folderId],
    queryFn: async (): Promise<{ files: ProcessedFile[] }> => {
      const res = await fetch(`/api/files/process?folder_id=${folderId}`)
      if (!res.ok) throw new Error('처리 결과 조회 실패')
      return res.json()
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
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
      // processed_files 캐시 + 모든 atom 파생 뷰 (Digest, 카운트, 다가오는 마감, 챗 suggestion, 폴더카드) 동시 무효화.
      qc.invalidateQueries({ queryKey: ['processed-files', folderId] })
      qc.invalidateQueries({ queryKey: ['folder-atoms', folderId] })
      qc.invalidateQueries({ queryKey: ['folder-atom-counts', folderId] })
      qc.invalidateQueries({ queryKey: ['workspace-atom-counts-summary'] })
      qc.invalidateQueries({ queryKey: ['upcoming-deadlines'] })
      qc.invalidateQueries({ queryKey: ['processed-file-detail'] })
      qc.invalidateQueries({ queryKey: ['folders-summary'] })
    },
  })

  const enterSubfolder = (item: DriveItem) => {
    setPath([...path, { id: item.id, name: item.name }])
  }

  const jumpTo = (index: number) => {
    setPath(path.slice(0, index + 1))
  }

  // 일괄 처리 — 현재 화면의 처리 가능 + 아직 안 된 파일을 순차로 트리거.
  // 의도: Vercel 60s 한계 + LLM 동시 호출 비용 절감 → 직렬 (사용자가 진행률 봄).
  const [bulkPending, setBulkPending] = useState<{
    total: number
    done: number
    current: string | null
  } | null>(null)
  const runBulkProcess = async () => {
    const targets = (query.data?.files ?? []).filter(
      (f) =>
        PROCESSABLE_MIMES.has(f.mimeType) &&
        !processedMap.get(f.id)?.parsing_completed_at,
    )
    if (targets.length === 0) return
    setBulkPending({ total: targets.length, done: 0, current: targets[0].name })
    for (let i = 0; i < targets.length; i++) {
      const file = targets[i]
      setBulkPending({ total: targets.length, done: i, current: file.name })
      try {
        await processMutation.mutateAsync(file)
      } catch {
        // 개별 실패는 무시하고 다음 파일로 — 결과는 처리 컬럼에 표시됨.
      }
    }
    setBulkPending(null)
  }

  // 현재 폴더에서 미처리 파일 개수 (toolbar 버튼 표시 조건)
  const unprocessedCount = (query.data?.files ?? []).filter(
    (f) => PROCESSABLE_MIMES.has(f.mimeType) && !processedMap.get(f.id)?.parsing_completed_at,
  ).length

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
      {/* 툴바: 브레드크럼 + 카운트 + 일괄처리 */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-hairline bg-surface-soft">
        <Breadcrumb path={path} onJump={jumpTo} />
        <div className="flex items-center gap-3 shrink-0">
          {bulkPending ? (
            <span
              className="text-caption text-muted tabular inline-flex items-center gap-1.5 max-w-xs min-w-0"
              title={bulkPending.current ?? undefined}
            >
              <Loader2 className="w-3 h-3 animate-spin shrink-0" />
              <span className="shrink-0">{bulkPending.done} / {bulkPending.total}</span>
              {bulkPending.current ? (
                <span className="truncate text-muted-soft">· {bulkPending.current}</span>
              ) : null}
            </span>
          ) : unprocessedCount > 0 ? (
            <button
              type="button"
              onClick={runBulkProcess}
              className="text-caption text-ink border border-hairline px-2.5 py-1 rounded-full hover:bg-canvas transition-colors inline-flex items-center gap-1.5"
              title="이 폴더 안의 처리 가능한 파일을 모두 Atom 추출"
            >
              <Sparkles className="w-3 h-3" />
              안 된 {unprocessedCount}개 모두 처리
            </button>
          ) : null}
          {query.data ? (
            <p className="text-caption text-muted-soft tabular">
              폴더 {query.data.summary.subfolders} · 파일 {query.data.summary.files}
            </p>
          ) : null}
        </div>
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

      {/* 첫 진입 안내 — 처리된 파일이 0 이고 처리 가능한 파일이 있을 때만 */}
      {query.data &&
      processed.data &&
      processed.data.files.filter(p => p.parsing_completed_at).length === 0 &&
      unprocessedCount > 0 &&
      !bulkPending ? (
        <div className="px-4 py-3 border-b border-hairline-soft bg-surface-soft flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-ink shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-body-sm text-ink">
                이 폴더의 파일 {unprocessedCount}개에서 마감·요구사항·결정사항을 자동으로 뽑아낼 수 있습니다.
              </p>
              <p className="text-caption text-muted mt-0.5">
                추출된 항목은 [내용 요약] 탭과 챗봇에서 바로 조회됩니다. 파일당 약 15초.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={runBulkProcess}
            className="shrink-0 h-8 px-3 rounded-full bg-ink text-canvas text-caption font-medium hover:bg-body-strong transition-colors inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3" />
            시작
          </button>
        </div>
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
                      onView={(pid) => setViewerFileId(pid)}
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

      {viewerFileId ? (
        <AtomViewer
          processedFileId={viewerFileId}
          onClose={() => setViewerFileId(null)}
          onReprocess={(file) => {
            processMutation.mutate(file)
            setViewerFileId(null)
          }}
        />
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
  onView,
  pending,
}: {
  processed: ProcessedFile | undefined
  mimeType: string
  onProcess: () => void
  onView: (id: string) => void
  pending: boolean
}) {
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
    // 처리는 성공했지만 추출 항목 0 — 이미지 위주 PDF, 빈 문서, 무의미한 텍스트 등.
    if (processed.atom_count === 0) {
      return (
        <button
          type="button"
          onClick={() => onView(processed.id)}
          title="텍스트는 추출됐지만 요구사항·마감 같은 의미 단위가 발견되지 않았습니다."
          className="hidden md:inline-flex items-center gap-1.5 text-caption text-muted-soft hover:text-ink transition-colors"
        >
          <AlertCircle className="w-3 h-3" />
          항목 없음
        </button>
      )
    }
    return (
      <button
        type="button"
        onClick={() => onView(processed.id)}
        title="Atom 상세 보기"
        className="hidden md:inline-flex items-center gap-1.5 text-caption text-ink hover:opacity-70 transition-opacity"
      >
        <CheckCircle2 className="w-3 h-3" />
        Atom {processed.atom_count}
      </button>
    )
  }

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

interface AtomDetail {
  id: string
  local_id: string
  type: string
  content: string
  attributes: Record<string, unknown>
  provenance: {
    source?: { file_id?: string; location?: string; raw_text?: string }
    extracted_by?: { model?: string; extractor_version?: string; extracted_at?: string }
  }
  confidence: number
}

interface RelationDetail {
  id: string
  from_atom_id: string
  to_atom_id: string
  type: string
  confidence: number
}

interface ViewerResponse {
  file: ProcessedFile & {
    drive_modified_at: string | null
    size_bytes: number | null
    parsed_text: string | null
  }
  atoms: AtomDetail[]
  relations: RelationDetail[]
}

const ATOM_TYPE_LABELS: Record<string, string> = {
  Requirement: '요구사항',
  Deadline: '마감',
  Constraint: '제약',
  Deliverable: '산출물',
  Metric: '수치',
  Narrative: '서술',
  Event: '이벤트',
  Question: '질문',
  Decision: '결정',
  Reference: '참조',
  Definition: '정의',
  Entity: '주체',
}

function AtomViewer({
  processedFileId,
  onClose,
  onReprocess,
}: {
  processedFileId: string
  onClose: () => void
  onReprocess: (file: { id: string; name: string; mimeType: string; size?: string; modifiedTime: string }) => void
}) {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: ['processed-file-detail', processedFileId],
    queryFn: async (): Promise<ViewerResponse> => {
      const res = await fetch(`/api/files/process/${processedFileId}`)
      if (!res.ok) throw new Error('상세 조회 실패')
      return res.json()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/files/process/${processedFileId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error?.message ?? '삭제 실패')
      }
    },
    onSuccess: () => {
      // 모든 atom 파생 캐시 무효화 (folder-atoms / counts / upcoming / processed-files / 폴더카드).
      qc.invalidateQueries({ queryKey: ['processed-files'] })
      qc.invalidateQueries({ queryKey: ['folder-atoms'] })
      qc.invalidateQueries({ queryKey: ['folder-atom-counts'] })
      qc.invalidateQueries({ queryKey: ['workspace-atom-counts-summary'] })
      qc.invalidateQueries({ queryKey: ['upcoming-deadlines'] })
      qc.invalidateQueries({ queryKey: ['folders-summary'] })
      onClose()
    },
  })

  const handleDelete = () => {
    if (window.confirm('이 파일의 처리 결과를 삭제합니다.\n(원본 Drive 파일은 그대로 남습니다.)\n다시 처리하려면 폴더 탭에서 [처리] 버튼을 누르세요.')) {
      deleteMutation.mutate()
    }
  }

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [onClose])

  const grouped = (() => {
    const map = new Map<string, AtomDetail[]>()
    for (const a of query.data?.atoms ?? []) {
      const arr = map.get(a.type) ?? []
      arr.push(a)
      map.set(a.type, arr)
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length)
  })()

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Atom 상세"
      onClick={onClose}
      className="fixed inset-0 bg-ink/30 flex items-center justify-center z-50 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col bg-canvas rounded-lg border border-hairline shadow-lg"
      >
        <header className="px-6 py-4 border-b border-hairline flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-title-lg text-ink truncate">
              {query.data?.file.filename ?? '불러오는 중…'}
            </h3>
            {query.data?.file ? (
              <p className="text-caption text-muted-soft mt-1">
                Atom {query.data.file.atom_count} · Relation {query.data.file.relation_count}
                {query.data.file.parsing_completed_at
                  ? ` · 처리 ${new Date(query.data.file.parsing_completed_at).toLocaleString('ko-KR')}`
                  : ''}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {query.data?.file ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    onReprocess({
                      id: query.data!.file.drive_file_id,
                      name: query.data!.file.filename,
                      mimeType: query.data!.file.mime_type,
                      size: query.data!.file.size_bytes?.toString(),
                      modifiedTime:
                        query.data!.file.drive_modified_at ??
                        new Date().toISOString(),
                    })
                  }
                  className="text-caption text-muted hover:text-ink transition-colors"
                >
                  다시 처리
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="text-caption text-muted hover:text-ink transition-colors disabled:opacity-50"
                >
                  {deleteMutation.isPending ? '삭제 중…' : '삭제'}
                </button>
              </>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="text-caption text-muted hover:text-ink transition-colors"
            >
              닫기
            </button>
          </div>
        </header>

        <div className="overflow-y-auto px-6 py-5 space-y-6">
          {query.isLoading ? (
            <p className="text-body-sm text-muted-soft">불러오는 중…</p>
          ) : null}

          {query.data && query.data.atoms.length === 0 ? (
            <div className="rounded-md bg-surface-soft border border-hairline p-4 text-body-sm text-body space-y-2">
              {query.data.file.parsing_error ? (
                <>
                  <p className="text-ink">처리 실패</p>
                  <p className="text-muted">{query.data.file.parsing_error}</p>
                  <p className="text-caption text-muted-soft">
                    파일이 손상됐거나 권한이 끊겼을 수 있습니다. [다시 처리] 로 재시도해 주세요.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-ink">의미 단위가 발견되지 않았습니다</p>
                  <p className="text-muted">
                    텍스트는 추출되었지만 요구사항·마감·결정사항 같은 항목을 찾지 못했습니다.
                  </p>
                  <p className="text-caption text-muted-soft">
                    이미지 위주 PDF·표만 있는 시트·짧은 메모 등에서 자주 발생합니다.
                  </p>
                </>
              )}
            </div>
          ) : null}

          {grouped.map(([type, atoms]) => (
            <section key={type} className="space-y-2">
              <h4 className="text-title-sm text-ink flex items-baseline gap-2">
                <span>{ATOM_TYPE_LABELS[type] ?? type}</span>
                <span className="text-caption text-muted-soft tabular">{atoms.length}</span>
              </h4>
              <ul className="space-y-2">
                {atoms.map(a => (
                  <li key={a.id} className="rounded-md border border-hairline bg-surface-soft p-3 space-y-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-body-sm text-ink flex-1">{a.content}</p>
                      <span className="text-caption text-muted-soft tabular shrink-0">
                        {Math.round(a.confidence * 100)}%
                      </span>
                    </div>
                    {a.provenance.source?.raw_text ? (
                      <p className="text-caption text-muted-soft border-l-2 border-hairline pl-2 italic">
                        “{a.provenance.source.raw_text}”
                      </p>
                    ) : null}
                    {a.provenance.source?.location ? (
                      <p className="text-caption text-muted-soft">{a.provenance.source.location}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {/* Relations 섹션 — 추출된 Triple 시각화 */}
          {query.data && query.data.relations.length > 0 ? (
            <RelationsSection atoms={query.data.atoms} relations={query.data.relations} />
          ) : null}

          {/* 추출 검증용 원문 텍스트 (collapsible) — 매니저가 LLM 이 무엇을 읽었는지 확인 */}
          {query.data?.file.parsed_text ? (
            <details className="pt-2 border-t border-hairline-soft">
              <summary className="text-title-sm text-ink cursor-pointer hover:text-muted transition-colors">
                추출 원문 보기
                <span className="text-caption text-muted-soft ml-2 tabular">
                  {query.data.file.parsed_text.length.toLocaleString()} 자
                </span>
              </summary>
              <pre className="mt-2 max-h-80 overflow-auto bg-surface-soft border border-hairline rounded-md p-3 text-caption text-body whitespace-pre-wrap font-body">
                {query.data.file.parsed_text}
              </pre>
            </details>
          ) : null}
        </div>
      </div>
    </div>
  )
}

const RELATION_LABELS: Record<string, string> = {
  requires: '필요로 함',
  fulfills: '충족',
  references: '참조',
  assigned_to: '담당',
  produced_by: '작성/제출',
  temporally_after: '이후',
  responds_to: '응답',
  triggers: '촉발',
  approves: '승인',
  evolves_to: '발전',
}

function RelationsSection({
  atoms,
  relations,
}: {
  atoms: AtomDetail[]
  relations: RelationDetail[]
}) {
  const atomById = new Map(atoms.map(a => [a.id, a]))

  // 한 줄로 표현: "[R1 요구사항] → 담당 → [E1 주체]"
  const renderTuple = (rel: RelationDetail) => {
    const from = atomById.get(rel.from_atom_id)
    const to = atomById.get(rel.to_atom_id)
    if (!from || !to) return null
    return (
      <li key={rel.id} className="text-body-sm text-body flex items-baseline gap-2 flex-wrap">
        <span className="text-caption text-muted-soft shrink-0">{from.local_id}</span>
        <span className="text-ink truncate flex-1 min-w-0" title={from.content}>
          {from.content}
        </span>
        <span className="text-caption text-muted shrink-0 border border-hairline rounded-full px-2 py-0.5">
          {RELATION_LABELS[rel.type] ?? rel.type}
        </span>
        <span className="text-caption text-muted-soft shrink-0">{to.local_id}</span>
        <span className="text-ink truncate flex-1 min-w-0" title={to.content}>
          {to.content}
        </span>
      </li>
    )
  }

  return (
    <section className="space-y-2 pt-2 border-t border-hairline-soft">
      <h4 className="text-title-sm text-ink flex items-baseline gap-2">
        <span>연결</span>
        <span className="text-caption text-muted-soft tabular">{relations.length}</span>
      </h4>
      <ul className="space-y-1.5">
        {relations.map(renderTuple)}
      </ul>
    </section>
  )
}
